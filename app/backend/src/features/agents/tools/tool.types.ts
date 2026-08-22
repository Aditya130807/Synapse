import type { AgentCapability, AgentContext } from '../agent.types.js';

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
}

export type ToolExecutionStatus = 'success' | 'failed' | 'denied' | 'invalid';

export interface ToolResult<T = unknown> {
  toolId: string;
  status: ToolExecutionStatus;
  data?: T;
  error?: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface Tool<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: AgentCapability[];
  inputSchema?: ToolInputSchema;
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}

export interface ToolExecutionResult extends ToolResult {}
