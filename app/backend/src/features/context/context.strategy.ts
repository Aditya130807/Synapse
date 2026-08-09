export type ContextStrategyType =
  | 'conversation'       // Strategy A: Semantic search across conversation/KB
  | 'attached-document'  // Strategy B: Full load of explicitly attached files
  | 'large-document'     // Strategy C: Hierarchical compression for large files exceeding budget
  | 'hybrid';            // Strategy D: Attached documents + semantic search

export interface AgentExecutionTraceStep {
  step: string;
  timestamp: string;
  durationMs?: number;
  details?: Record<string, unknown>;
}

export interface AgentExecutionMeta {
  agentId: string;
  agentName: string;
  routingReason: string;
  durationMs: number;
  traceSteps: AgentExecutionTraceStep[];
}

export interface ContextStrategyMeta {
  strategy: ContextStrategyType;
  messageFileIds: string[];
  conversationFileIds: string[];
  totalChunksAvailable: number;
  chunksInjected: number;
  tokensBudget: number;
  tokensUsed: number;
  compressionApplied: boolean;
  semanticSearchEnabled: boolean;
  previousContextUsed: boolean;
  previousContextReason: string;
  filesLoaded: Array<{ fileId: string; filename: string; chunkCount: number }>;
  memoriesInjectedCount?: number;
  memoriesInjected?: Array<{ id: string; content: string; type: string; isPinned: boolean; scope?: 'conversation' | 'workspace' }>;
  agentMeta?: AgentExecutionMeta;
}
