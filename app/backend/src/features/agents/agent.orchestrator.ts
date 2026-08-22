import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { contextEngine } from '../context/context.engine.js';
import { agentRouter } from './agent.router.js';
import { agentRegistry } from './agent.registry.js';
import { toolRegistry } from './tools/tool.registry.js';
import { synthesisService } from './synthesis.service.js';
import { createMessage } from '../chat/chat.service.js';
import { CitationService } from '../rag/rag.service.js';
import { extractMemoriesAsync } from '../memory/memory.extractor.js';
import { memoryPipeline } from '../memory/memory.pipeline.js';
import * as persistentMemoryService from '../memory/persistent-memory.service.js';
import { env } from '../../config/env.js';
import type {
  AgentContext,
  AgentExecutionMeta,
  AgentExecutionTraceStep,
  AgentExecutionOptions,
  ChatMessageInput,
  AgentTask,
} from './agent.types.js';
import type { ToolResult } from './tools/tool.types.js';
import type { MessageDTO } from '../chat/chat.types.js';
import type { Citation } from '../rag/rag.types.js';

const MAX_TOOL_CALLS = 5;
const MAX_AGENTS_PER_REQUEST = 3;
const MAX_TASKS_PER_REQUEST = 5;
const MAX_PARALLEL_AGENTS = 3;

export class AgentOrchestrator {
  public async execute(
    userId: string,
    conversationId: string
  ): Promise<MessageDTO> {
    return this.orchestrate(userId, conversationId);
  }

  public async executeStream(
    userId: string,
    conversationId: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<MessageDTO> {
    return this.orchestrate(userId, conversationId, { onChunk, signal });
  }

  private async orchestrate(
    userId: string,
    conversationId: string,
    options?: AgentExecutionOptions
  ): Promise<MessageDTO> {
    const orchestratorStartTime = Date.now();
    const traceSteps: AgentExecutionTraceStep[] = [];

    traceSteps.push({
      step: 'request.received',
      timestamp: new Date().toISOString(),
    });

    // 1. Verify conversation ownership & fetch message history
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    const history = await prisma.message.findMany({
      where: { conversationId },
      include: { attachments: true },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const lastUserMsgRecord = history.slice().reverse().find((m) => m.role === 'user');
    const lastUserMsg = lastUserMsgRecord?.content || '';
    const messageFileIds = (lastUserMsgRecord?.attachments || []).map((a) => a.fileId);

    const historyMessages: ChatMessageInput[] = history.map((m) => ({
      role: m.role as ChatMessageInput['role'],
      content: m.content,
    }));

    // Memory Pipeline Intent & Command Processing
    const memoryFeedback = await memoryPipeline.processIncomingMessage(
      userId,
      'default',
      conversationId,
      lastUserMsg
    );

    // 2. Context Engine Assembly
    const contextStartTime = Date.now();
    const ragResult = await contextEngine.execute(
      conversationId,
      userId,
      lastUserMsg,
      messageFileIds
    );
    traceSteps.push({
      step: 'context.assembled',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - contextStartTime,
    });

    // 3. Build Base Agent Context
    const baseAgentContext: AgentContext = {
      userId,
      conversationId,
      query: lastUserMsg,
      history: historyMessages,
      messageFileIds,
      ragResult,
    };

    // 4. Collaboration Router Selection
    const routerStartTime = Date.now();
    const collabDecision = await agentRouter.routeCollaboration(baseAgentContext);
    traceSteps.push({
      step: 'collaboration.detected',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - routerStartTime,
      details: {
        mode: collabDecision.mode,
        agents: collabDecision.agents,
        reason: collabDecision.reason,
      },
    });

    // Handle Collaborative Execution Modes (Parallel / Sequential)
    if (collabDecision.mode !== 'single' && collabDecision.agents.length > 1) {
      return this.orchestrateCollaboration(
        userId,
        conversationId,
        lastUserMsg,
        baseAgentContext,
        collabDecision,
        traceSteps,
        orchestratorStartTime,
        options
      );
    }

    // --- Single Agent Path ---
    const routingDecision = await agentRouter.route(baseAgentContext);
    const agent = agentRegistry.get(routingDecision.agentId);
    if (!agent) {
      throw new ApiError(500, `Selected agent "${routingDecision.agentId}" is not registered.`);
    }

    const toolCalls: ToolResult[] = [];
    const webCitations: Citation[] = [];
    await this.executeToolsForAgent(agent, baseAgentContext, lastUserMsg, toolCalls, webCitations, traceSteps, ragResult);

    // Execute Selected Agent (with Model Fallback & Emergency Agent Fallback)
    const agentExecutionStartTime = Date.now();
    let agentResult;
    let usedAgent = agent;
    let didEmergencyFallback = false;
    let emergencyFallbackReason = '';

    try {
      agentResult = await agent.execute(baseAgentContext, options);
    } catch (err: any) {
      const isProviderFailure =
        err.statusCode === 429 ||
        err.statusCode === 502 ||
        err.statusCode === 503 ||
        err.statusCode === 504 ||
        err.message?.includes('Rate limit') ||
        err.message?.includes('OmniRoute') ||
        err.message?.includes('OpenRouter') ||
        err.message?.includes('unreachable');

      const isEmergencyEnabled = String(env.ENABLE_GENERAL_AGENT_EMERGENCY_FALLBACK).toLowerCase() === 'true';

      if (agent.id !== 'general' && isProviderFailure && isEmergencyEnabled) {
        console.warn(
          `[AgentOrchestrator] Specialized agent "${agent.id}" failed model chain (${err.message}). Performing Emergency Fallback to GeneralAgent.`
        );
        const generalFallbackAgent = agentRegistry.get('general');
        if (generalFallbackAgent) {
          usedAgent = generalFallbackAgent;
          didEmergencyFallback = true;
          emergencyFallbackReason = `Specialized model chain for ${agent.name} exhausted — emergency fallback to GeneralAgent.`;
          agentResult = await generalFallbackAgent.execute(baseAgentContext, options);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const agentExecutionDuration = Date.now() - agentExecutionStartTime;
    traceSteps.push({
      step: 'agent.executed',
      timestamp: new Date().toISOString(),
      durationMs: agentExecutionDuration,
      details: didEmergencyFallback ? { emergencyFallback: true, emergencyFallbackReason } : undefined,
    });

    const innerMeta: Partial<AgentExecutionMeta> = agentResult.agentMeta || {};
    const totalDuration = Date.now() - orchestratorStartTime;
    const agentMeta: AgentExecutionMeta = {
      agentId: usedAgent.id,
      agentName: usedAgent.name,
      routingReason: routingDecision.reason,
      durationMs: totalDuration,
      traceSteps,
      provider: innerMeta.provider,
      requestedModel: innerMeta.requestedModel,
      selectedModel: innerMeta.selectedModel,
      resolvedModel: innerMeta.resolvedModel,
      requestedAgent: agent.id,
      executedAgent: usedAgent.id,
      fallback: innerMeta.fallback || didEmergencyFallback,
      emergencyFallback: didEmergencyFallback,
      fallbackReason: didEmergencyFallback ? emergencyFallbackReason : innerMeta.fallbackReason,
      fallbackAttempts: innerMeta.fallbackAttempts ?? 0,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      collaborationMode: 'single',
    };

    const messageMetadata = CitationService.prepareMessageMetadata(ragResult.context);
    if (webCitations.length > 0) {
      messageMetadata.citations = [...(messageMetadata.citations || []), ...webCitations];
    }

    if (messageMetadata.strategyMeta) {
      messageMetadata.strategyMeta.agentMeta = agentMeta;
    } else {
      messageMetadata.strategyMeta = {
        strategy: 'conversation',
        messageFileIds,
        conversationFileIds: [],
        totalChunksAvailable: 0,
        chunksInjected: 0,
        tokensBudget: 8000,
        tokensUsed: 0,
        compressionApplied: false,
        semanticSearchEnabled: false,
        previousContextUsed: false,
        previousContextReason: '',
        filesLoaded: [],
        agentMeta,
      };
    }

    const memoriesInjected = ragResult.context.strategyMeta?.memoriesInjected || [];
    if (memoriesInjected.length > 0) {
      (messageMetadata as any).memoriesUsed = memoriesInjected;
    }
    if (memoryFeedback && memoryFeedback.actionExecuted !== 'none') {
      (messageMetadata as any).memoryFeedback = memoryFeedback;
    }

    const assistantContent = agentResult.content.trim();
    if (!assistantContent) {
      throw new ApiError(502, `Agent "${usedAgent.id}" returned empty content. The provider stream completed without producing a response.`);
    }
    const assistantMessage = await createMessage(
      userId,
      conversationId,
      'assistant',
      assistantContent,
      messageMetadata
    );

    const usedMemIds = memoriesInjected.map((m: any) => m.id).filter(Boolean);
    persistentMemoryService.markMemoriesUsed(usedMemIds).catch(() => {});
    extractMemoriesAsync(userId, conversationId, lastUserMsg, assistantContent).catch(() => {});
    return assistantMessage;
  }

  /**
   * Orchestrates Multi-Agent Collaboration (Parallel or Sequential).
   */
  private async orchestrateCollaboration(
    userId: string,
    conversationId: string,
    userQuery: string,
    baseContext: AgentContext,
    collabDecision: any,
    traceSteps: AgentExecutionTraceStep[],
    orchestratorStartTime: number,
    options?: AgentExecutionOptions
  ): Promise<MessageDTO> {
    const tasksToExecute: AgentTask[] = collabDecision.tasks
      .slice(0, MAX_TASKS_PER_REQUEST)
      .map((t: any) => ({
        id: t.id,
        agentId: t.agentId,
        objective: t.objective,
        dependencies: t.dependencies,
        status: 'pending' as const,
      }));

    traceSteps.push({
      step: 'tasks.created',
      timestamp: new Date().toISOString(),
      details: { taskCount: tasksToExecute.length, mode: collabDecision.mode },
    });

    const allToolCalls: ToolResult[] = [];
    const allCitations: Citation[] = [];

    if (collabDecision.mode === 'parallel') {
      // Parallel Collaboration Path using Promise.all (up to MAX_PARALLEL_AGENTS = 3)
      const executionPromises = tasksToExecute
        .slice(0, MAX_PARALLEL_AGENTS)
        .map(async (task) => {
          task.status = 'running';
          const taskStartTime = Date.now();
          traceSteps.push({
            step: `${task.agentId}.started`,
            timestamp: new Date().toISOString(),
            details: { taskId: task.id, objective: task.objective },
          });

          const agent = agentRegistry.get(task.agentId);
          if (!agent) {
            task.status = 'failed';
            task.error = `Agent "${task.agentId}" not found in registry.`;
            return;
          }

          const taskContext: AgentContext = {
            ...baseContext,
            query: task.objective,
          };

          const taskToolCalls: ToolResult[] = [];
          const taskWebCitations: Citation[] = [];
          await this.executeToolsForAgent(agent, taskContext, task.objective, taskToolCalls, taskWebCitations, traceSteps, baseContext.ragResult);

          allToolCalls.push(...taskToolCalls);
          allCitations.push(...taskWebCitations);

          try {
            const result = await agent.execute(taskContext);
            task.status = 'completed';
            task.result = result.content;
            task.durationMs = Date.now() - taskStartTime;
            if (result.citations) task.citations = result.citations;
            task.toolCalls = taskToolCalls;

            traceSteps.push({
              step: `${task.agentId}.completed`,
              timestamp: new Date().toISOString(),
              durationMs: task.durationMs,
            });
          } catch (err: any) {
            console.warn(`[AgentOrchestrator] Task ${task.id} (${task.agentId}) failed: ${err.message}`);
            task.status = 'failed';
            task.error = err.message || 'Subtask execution failed.';
            task.durationMs = Date.now() - taskStartTime;
          }
        });

      await Promise.all(executionPromises);
    } else {
      // Sequential Collaboration Path
      for (const task of tasksToExecute) {
        task.status = 'running';
        const taskStartTime = Date.now();

        traceSteps.push({
          step: `${task.agentId}.started`,
          timestamp: new Date().toISOString(),
          details: { taskId: task.id, objective: task.objective },
        });

        const agent = agentRegistry.get(task.agentId);
        if (!agent) {
          task.status = 'failed';
          task.error = `Agent "${task.agentId}" not found.`;
          continue;
        }

        // Build sequential context with prior completed task findings
        const priorCompleted = tasksToExecute.filter((t) => t.status === 'completed' && t.result);
        let taskQuery = task.objective;
        if (priorCompleted.length > 0) {
          taskQuery += `\n\nPrior Analysis Context:\n${priorCompleted.map((t) => `[${t.agentId.toUpperCase()} FINDINGS]: ${t.result}`).join('\n\n')}`;
        }

        const taskContext: AgentContext = {
          ...baseContext,
          query: taskQuery,
        };

        const taskToolCalls: ToolResult[] = [];
        const taskWebCitations: Citation[] = [];
        await this.executeToolsForAgent(agent, taskContext, taskQuery, taskToolCalls, taskWebCitations, traceSteps, baseContext.ragResult);

        allToolCalls.push(...taskToolCalls);
        allCitations.push(...taskWebCitations);

        try {
          const result = await agent.execute(taskContext);
          task.status = 'completed';
          task.result = result.content;
          task.durationMs = Date.now() - taskStartTime;
          if (result.citations) task.citations = result.citations;
          task.toolCalls = taskToolCalls;

          traceSteps.push({
            step: `${task.agentId}.completed`,
            timestamp: new Date().toISOString(),
            durationMs: task.durationMs,
          });
        } catch (err: any) {
          console.warn(`[AgentOrchestrator] Sequential task ${task.id} (${task.agentId}) failed: ${err.message}`);
          task.status = 'failed';
          task.error = err.message;
          task.durationMs = Date.now() - taskStartTime;
        }
      }
    }

    // Check completed tasks
    const completedTasks = tasksToExecute.filter((t) => t.status === 'completed');
    if (completedTasks.length === 0) {
      throw new ApiError(500, 'All collaborating agents failed to complete analysis.');
    }

    // 5. Synthesis Step
    const synthesisStartTime = Date.now();
    traceSteps.push({
      step: 'synthesis.started',
      timestamp: new Date().toISOString(),
    });

    const synthesisOutput = await synthesisService.synthesize({
      query: userQuery,
      tasks: tasksToExecute,
      history: baseContext.history,
    });

    const synthesisDuration = Date.now() - synthesisStartTime;
    traceSteps.push({
      step: 'synthesis.completed',
      timestamp: new Date().toISOString(),
      durationMs: synthesisDuration,
    });

    // Stream final synthesis text if onChunk is attached
    if (options?.onChunk) {
      options.onChunk(synthesisOutput.content);
    }

    // 6. Build Metadata & Save Assistant Message
    const totalDuration = Date.now() - orchestratorStartTime;
    const mergedCitations = [...allCitations, ...synthesisOutput.citations];

    const agentMeta: AgentExecutionMeta = {
      agentId: 'multi-agent',
      agentName: 'Multi-Agent',
      routingReason: collabDecision.reason,
      durationMs: totalDuration,
      traceSteps,
      toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
      collaborationMode: collabDecision.mode,
      tasks: tasksToExecute,
    };

    const messageMetadata = baseContext.ragResult
      ? CitationService.prepareMessageMetadata(baseContext.ragResult.context)
      : ({ strategyMeta: undefined, citations: [] } as any);
    if (mergedCitations.length > 0) {
      messageMetadata.citations = mergedCitations;
    }

    if (messageMetadata.strategyMeta) {
      messageMetadata.strategyMeta.agentMeta = agentMeta;
    } else {
      messageMetadata.strategyMeta = {
        strategy: 'conversation',
        messageFileIds: baseContext.messageFileIds,
        conversationFileIds: [],
        totalChunksAvailable: 0,
        chunksInjected: 0,
        tokensBudget: 8000,
        tokensUsed: 0,
        compressionApplied: false,
        semanticSearchEnabled: false,
        previousContextUsed: false,
        previousContextReason: '',
        filesLoaded: [],
        agentMeta,
      };
    }

    const assistantMessage = await createMessage(
      userId,
      conversationId,
      'assistant',
      synthesisOutput.content,
      messageMetadata
    );

    extractMemoriesAsync(userId, conversationId, userQuery, synthesisOutput.content).catch(() => {});
    return assistantMessage;
  }

  /**
   * Helper to execute authorized tools for an agent if matching query intents exist.
   */
  private async executeToolsForAgent(
    agent: any,
    agentContext: AgentContext,
    query: string,
    toolCalls: ToolResult[],
    webCitations: Citation[],
    traceSteps: AgentExecutionTraceStep[],
    ragResult: any
  ): Promise<void> {
    let toolCallCount = 0;

    // Calculator check
    const hasCalcCap = agent.capabilities.includes('calculator.execute');
    const pctMathMatch = query.match(/([0-9\.]+)\%\s+of\s+([0-9\.]+)/i);
    const mathExprMatch = query.match(/(?:what\s+is|calc|compute)\s+([0-9\.\s\+\-\*\/\^\(\)]+)/i);

    if (hasCalcCap && (pctMathMatch || mathExprMatch) && toolCallCount < MAX_TOOL_CALLS) {
      const expr = pctMathMatch ? pctMathMatch[0] : mathExprMatch![1];
      toolCallCount++;

      traceSteps.push({
        step: 'tool.requested',
        timestamp: new Date().toISOString(),
        details: { toolId: 'calculator', input: { expression: expr } },
      });

      const calcRes = await toolRegistry.executeTool('calculator', { expression: expr }, agentContext, agent.capabilities);
      toolCalls.push(calcRes);

      if (calcRes.status === 'success' && calcRes.data && ragResult) {
        traceSteps.push({
          step: 'tool.executed',
          timestamp: new Date().toISOString(),
          durationMs: calcRes.durationMs,
          details: { toolId: 'calculator', result: (calcRes.data as any).result },
        });
        ragResult.systemPrompt = `[VERIFIED CALCULATOR RESULT: ${expr} = ${(calcRes.data as any).result}]\n\n${ragResult.systemPrompt}`;
      }
    }

    // Web Search check
    const hasWebCap = agent.capabilities.includes('web.search');
    const webQueryKeywords = ['latest', 'current', 'news', 'release', 'recent', 'web search', 'search online'];
    const requestsWebSearch = webQueryKeywords.some((kw) => query.toLowerCase().includes(kw));

    if (hasWebCap && requestsWebSearch && toolCallCount < MAX_TOOL_CALLS) {
      toolCallCount++;

      traceSteps.push({
        step: 'tool.requested',
        timestamp: new Date().toISOString(),
        details: { toolId: 'web.search', query },
      });

      const webRes = await toolRegistry.executeTool('web.search', { query, limit: 3 }, agentContext, agent.capabilities);
      toolCalls.push(webRes);

      if (webRes.status === 'success' && webRes.data) {
        const searchData = webRes.data as { results: Array<{ title: string; url: string; snippet: string }> };
        traceSteps.push({
          step: 'tool.executed',
          timestamp: new Date().toISOString(),
          durationMs: webRes.durationMs,
          details: { toolId: 'web.search', count: searchData.results?.length || 0 },
        });

        if (searchData.results && searchData.results.length > 0 && ragResult) {
          let webBlock = '\n\n--- [UNTRUSTED EXTERNAL WEB SEARCH RESULTS] ---\n';
          searchData.results.forEach((item, idx) => {
            webBlock += `\n[Web Source ${idx + 1}]: ${item.title}\nURL: ${item.url}\nSnippet: ${item.snippet}\n`;
            let domain = 'web';
            try {
              domain = new URL(item.url).hostname;
            } catch {}

            webCitations.push({
              fileId: `web-${idx + 1}`,
              filename: item.title,
              page: null,
              chunkId: `web-chunk-${idx + 1}`,
              chunkIndex: idx,
              score: 0.9,
              scorePercent: 90,
              excerpt: item.snippet,
              sourceOrigin: `Web Source (${domain})` as any,
            });
          });
          webBlock += '--- [END WEB SEARCH RESULTS] ---\n';
          ragResult.systemPrompt = `${ragResult.systemPrompt}${webBlock}`;
        }
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
