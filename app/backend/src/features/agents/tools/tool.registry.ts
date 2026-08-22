import type { Tool, ToolResult, ToolExecutionResult } from './tool.types.js';
import type { AgentCapability, AgentContext } from '../agent.types.js';
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
   * Returns all registered tools authorized for an agent possessing `agentCapabilities`.
   */
  public getAvailableTools(agentCapabilities: AgentCapability[]): Tool[] {
    const caps = new Set(agentCapabilities);
    return this.getAll().filter((tool) =>
      tool.requiredCapabilities.every((reqCap) => caps.has(reqCap))
    );
  }

  /**
   * Safely execute a registered tool after verifying permissions, user scoping, and input schema.
   */
  public async executeTool(
    toolId: string,
    input: Record<string, unknown>,
    context: AgentContext,
    agentCapabilities?: AgentCapability[]
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolId);

    // 1. Tool existence check
    if (!tool) {
      return {
        toolId,
        status: 'failed',
        error: `Tool "${toolId}" is not registered.`,
        durationMs: 0,
      };
    }

    // 2. Authentication check
    if (!context.userId) {
      return {
        toolId,
        status: 'denied',
        error: 'Unauthorized tool execution: missing authenticated user context.',
        durationMs: 0,
      };
    }

    // 3. Permission & Capability check
    if (agentCapabilities && agentCapabilities.length > 0) {
      const caps = new Set(agentCapabilities);
      const isAuthorized = tool.requiredCapabilities.every((reqCap) => caps.has(reqCap));
      if (!isAuthorized) {
        return {
          toolId,
          status: 'denied',
          error: `Permission denied: Agent lacks required capability [${tool.requiredCapabilities.join(', ')}].`,
          durationMs: Date.now() - startTime,
        };
      }
    }

    // 4. Input Schema Validation
    if (tool.inputSchema?.required) {
      for (const reqProp of tool.inputSchema.required) {
        if (input[reqProp] === undefined || input[reqProp] === null) {
          return {
            toolId,
            status: 'invalid',
            error: `Invalid tool input: required parameter "${reqProp}" is missing.`,
            durationMs: Date.now() - startTime,
          };
        }
      }
    }

    // 5. Controlled Tool Execution
    try {
      const data = await tool.execute(input, context);
      return {
        toolId,
        status: 'success',
        data,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tool execution failed';
      return {
        toolId,
        status: 'failed',
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
