import type { AgentCapability, AgentContext } from '../agent.types.js';

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
}

export interface Tool<TInput = Record<string, unknown>, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: AgentCapability[];
  inputSchema?: ToolInputSchema;
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}

export interface ToolExecutionResult {
  toolId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}
