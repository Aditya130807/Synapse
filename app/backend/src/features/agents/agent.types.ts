import type { ContextStrategyMeta } from '../context/context.strategy.js';
import type { RAGPromptResult, Citation } from '../rag/rag.types.js';
import type { WorkspaceMemoryDTO } from '../workspace-memory/workspace-memory.types.js';
import type { MemoryDTO as ConversationMemoryDTO } from '../memory/memory.types.js';

export type AgentCapability =
  | 'conversation.read'
  | 'knowledge.read'
  | 'memory.read'
  | 'memory.write'
  | 'tools.execute'
  | 'calculator.execute'
  | 'web.search'
  | 'code.execute';

export interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentContext {
  userId: string;
  conversationId: string | null;
  messageId?: string;
  query: string;
  history: ChatMessageInput[];
  messageFileIds: string[];
  workspaceMemories?: WorkspaceMemoryDTO[];
  conversationMemories?: ConversationMemoryDTO[];
  ragResult?: RAGPromptResult;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutionTraceStep {
  step: string;
  timestamp: string;
  durationMs?: number;
  details?: Record<string, unknown>;
}

import type { ToolResult } from './tools/tool.types.js';

export type CollaborationMode = 'single' | 'sequential' | 'parallel';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AgentTask {
  id: string;
  agentId: string;
  objective: string;
  dependencies?: string[];
  status: TaskStatus;
  result?: string;
  durationMs?: number;
  error?: string;
  citations?: Citation[];
  toolCalls?: ToolResult[];
}

export interface CollaborationDecision {
  mode: CollaborationMode;
  agents: string[];
  reason: string;
  confidence: number;
  tasks: Array<{
    id: string;
    agentId: string;
    objective: string;
    dependencies?: string[];
  }>;
}

export interface CollaborationResult {
  requestId: string;
  mode: CollaborationMode;
  tasks: AgentTask[];
  completedTasks: number;
  failedTasks: number;
  synthesis: string;
  durationMs: number;
  citations?: Citation[];
}

export interface AgentExecutionMeta {
  agentId: string;
  agentName: string;
  routingReason: string;
  durationMs: number;
  traceSteps: AgentExecutionTraceStep[];
  provider?: string;
  requestedModel?: string;
  selectedModel?: string;
  resolvedModel?: string;
  requestedAgent?: string;
  executedAgent?: string;
  fallback?: boolean;
  emergencyFallback?: boolean;
  fallbackReason?: string;
  fallbackAttempts?: number;
  toolCalls?: ToolResult[];
  collaborationMode?: CollaborationMode;
  tasks?: AgentTask[];
}

export interface ToolCallResult {
  toolId: string;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface AgentResult {
  agentId: string;
  status: 'success' | 'failure';
  content: string;
  citations?: Citation[];
  toolCalls?: ToolCallResult[];
  strategyMeta?: ContextStrategyMeta;
  agentMeta?: AgentExecutionMeta;
  durationMs: number;
  error?: string;
}

export interface AgentExecutionOptions {
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface AgentRoutingDecision {
  agentId: string;
  reason: string;
  confidence: number;
  candidates: string[];
}

export interface CanHandleResult {
  canHandle: boolean;
  confidence: number;
  reason?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  canHandle(context: AgentContext): Promise<CanHandleResult>;
  execute(context: AgentContext, options?: AgentExecutionOptions): Promise<AgentResult>;
}
