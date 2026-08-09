import { agentRegistry } from './agent.registry.js';
import { generalAgent } from './general.agent.js';

// Auto-register built-in GeneralAgent
if (!agentRegistry.has(generalAgent.id)) {
  agentRegistry.register(generalAgent);
}

export * from './agent.types.js';
export * from './agent.registry.js';
export * from './agent.router.js';
export * from './agent.orchestrator.js';
export * from './general.agent.js';
export * from './tools/tool.types.js';
export * from './tools/tool.registry.js';
