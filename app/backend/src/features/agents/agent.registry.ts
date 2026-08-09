import type { Agent } from './agent.types.js';
import { ApiError } from '../../utils/ApiError.js';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent> = new Map();

  private constructor() {}

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register a new agent.
   * Throws an error if an agent with the same ID is already registered.
   */
  public register(agent: Agent): void {
    if (!agent.id || typeof agent.id !== 'string') {
      throw new ApiError(500, 'Cannot register an agent without a valid ID.');
    }
    if (this.agents.has(agent.id)) {
      throw new ApiError(500, `Agent with ID "${agent.id}" is already registered.`);
    }
    this.agents.set(agent.id, agent);
  }

  /**
   * Retrieve an agent by ID.
   */
  public get(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Check if an agent ID is registered.
   */
  public has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * List all registered agents.
   */
  public getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Clear all agents (primarily for testing).
   */
  public clear(): void {
    this.agents.clear();
  }
}

export const agentRegistry = AgentRegistry.getInstance();
