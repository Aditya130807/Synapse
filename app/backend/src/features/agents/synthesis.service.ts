import type { AgentTask, ChatMessageInput } from './agent.types.js';
import type { Citation } from '../rag/rag.types.js';
import { getModelProfile } from '../ai/model-profiles/agent.model.profiles.js';
import { agentFallbackExecutor } from '../ai/fallback/agent.fallback.executor.js';
import type { ChatMessage } from '../ai/ai.types.js';

export interface SynthesisInput {
  query: string;
  tasks: AgentTask[];
  history?: ChatMessageInput[];
}

export interface SynthesisOutput {
  content: string;
  citations: Citation[];
}

export class SynthesisService {
  /**
   * Synthesizes completed subtask outputs from collaborating agents into a single coherent, evidence-backed answer.
   * Identifies agreements/disagreements, resolves conflicts, and deduplicates citations.
   */
  public async synthesize(input: SynthesisInput): Promise<SynthesisOutput> {
    const { query, tasks } = input;
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.result);

    // Merge and deduplicate citations across all completed agent tasks
    const mergedCitations: Citation[] = [];
    const seenCitationKeys = new Set<string>();

    for (const task of completedTasks) {
      if (task.citations && task.citations.length > 0) {
        for (const citation of task.citations) {
          const key = `${citation.fileId}_${citation.chunkId}_${citation.filename}`;
          if (!seenCitationKeys.has(key)) {
            seenCitationKeys.add(key);
            mergedCitations.push(citation);
          }
        }
      }
    }

    // If only 1 task completed, return its output directly with merged citations
    if (completedTasks.length === 1) {
      return {
        content: completedTasks[0].result!,
        citations: mergedCitations,
      };
    }

    // Prepare structured prompt context with explicit task boundaries
    let promptContext = `USER REQUEST:\n${query}\n\n`;
    promptContext += `COLLABORATING AGENTS ANALYSIS OUTPUTS:\n`;

    completedTasks.forEach((task, idx) => {
      promptContext += `\n--- [AGENT OUTPUT ${idx + 1}: ${task.agentId.toUpperCase()} AGENT] ---\n`;
      promptContext += `Objective: ${task.objective}\n`;
      promptContext += `Findings:\n${task.result}\n`;
      promptContext += `--- [END AGENT OUTPUT ${idx + 1}] ---\n`;
    });

    const synthesisSystemPrompt =
      'You are Synapse Synthesis Agent, an expert technical coordinator.\n' +
      'Your role is to synthesize findings from collaborating AI agents into a single, cohesive, well-structured final answer.\n' +
      'Directives:\n' +
      '1. Combine findings logically without repeating identical points.\n' +
      '2. If agents disagree, explicitly state the disagreement, compare the evidence, and explain the optimal recommendation.\n' +
      '3. Clearly distinguish evidence from inference.\n' +
      '4. Do NOT invent new facts or cite external sources not provided in agent outputs.\n' +
      '5. Provide a clear, professional, unified response.';

    try {
      const profile = getModelProfile('synthesis');
      const messages: ChatMessage[] = [
        { role: 'system', content: synthesisSystemPrompt },
        { role: 'user', content: promptContext },
      ];

      const fallbackResult = await agentFallbackExecutor.execute(messages, profile);
      const synthesizedText = fallbackResult.response.content.trim() || this.fallbackFormat(completedTasks);

      return {
        content: synthesizedText,
        citations: mergedCitations,
      };
    } catch (err: any) {
      console.warn(`[SynthesisService] LLM synthesis failed (${err.message}) — using structured fallback synthesis.`);
      return {
        content: this.fallbackFormat(completedTasks),
        citations: mergedCitations,
      };
    }
  }

  private fallbackFormat(tasks: AgentTask[]): string {
    let text = '### Multi-Agent Synthesis Report\n\n';
    tasks.forEach((t) => {
      text += `#### ${t.agentId.toUpperCase()} AGENT ANALYSIS\n${t.result}\n\n`;
    });
    return text;
  }
}

export const synthesisService = new SynthesisService();
