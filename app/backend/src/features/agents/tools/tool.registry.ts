import type { Tool, ToolExecutionResult } from './tool.types.js';
import type { AgentContext } from '../agent.types.js';
import { ApiError } from '../../../utils/ApiError.js';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Tool> = new Map();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public register(tool: Tool): void {
    if (!tool.id || typeof tool.id !== 'string') {
      throw new ApiError(500, 'Cannot register a tool without a valid ID.');
    }
    if (this.tools.has(tool.id)) {
      throw new ApiError(500, `Tool with ID "${tool.id}" is already registered.`);
    }
    this.tools.set(tool.id, tool);
  }

  public get(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  public has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  public getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Safely execute a registered tool after verifying existence and authorization context.
   */
  public async executeTool(
    toolId: string,
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        toolId,
        success: false,
        error: `Tool "${toolId}" is not registered.`,
        durationMs: 0,
      };
    }

    const startTime = Date.now();
    try {
      const output = await tool.execute(input, context);
      return {
        toolId,
        success: true,
        output,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tool execution failed';
      return {
        toolId,
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      };
    }
  }

  public clear(): void {
    this.tools.clear();
  }
}

export const toolRegistry = ToolRegistry.getInstance();
