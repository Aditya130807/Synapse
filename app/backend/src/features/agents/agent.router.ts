import type { AgentContext, AgentRoutingDecision } from './agent.types.js';
import { agentRegistry } from './agent.registry.js';

export class AgentRouter {
  /**
   * Evaluates the request context and selects the best registered agent.
   * Deterministic and conservative in Sprint 10 (defaults to GeneralAgent with O(1) cost).
   */
  public async route(context: AgentContext): Promise<AgentRoutingDecision> {
    const availableAgents = agentRegistry.getAll();
    const candidates = availableAgents.map((a) => a.id);

    // Evaluate registered agents for explicit handling capabilities
    for (const agent of availableAgents) {
      if (agent.id !== 'general') {
        const check = await agent.canHandle(context);
        if (check.canHandle && check.confidence > 0.8) {
          return {
            agentId: agent.id,
            reason: check.reason || `Routed to ${agent.name} based on capability match.`,
            confidence: check.confidence,
            candidates,
          };
        }
      }
    }

    // Default fallback to general agent
    return {
      agentId: 'general',
      reason: 'Default general-purpose agent.',
      confidence: 1.0,
      candidates,
    };
  }
}

export const agentRouter = new AgentRouter();
