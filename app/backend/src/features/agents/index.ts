import { agentRegistry } from './agent.registry.js';
import { generalAgent } from './general.agent.js';
import { codingAgent } from './coding.agent.js';
import { researchAgent } from './research.agent.js';
import { documentAgent } from './document.agent.js';
import { toolRegistry } from './tools/tool.registry.js';
import { calculatorTool } from './tools/calculator.tool.js';
import { knowledgeSearchTool } from './tools/knowledge-search.tool.js';
import { webSearchTool } from './tools/web-search.tool.js';

// Auto-register built-in specialized agents
if (!agentRegistry.has(generalAgent.id)) {
  agentRegistry.register(generalAgent);
}
if (!agentRegistry.has(codingAgent.id)) {
  agentRegistry.register(codingAgent);
}
if (!agentRegistry.has(researchAgent.id)) {
  agentRegistry.register(researchAgent);
}
if (!agentRegistry.has(documentAgent.id)) {
  agentRegistry.register(documentAgent);
}

// Auto-register authorized tools
if (!toolRegistry.has(calculatorTool.id)) {
  toolRegistry.register(calculatorTool);
}
if (!toolRegistry.has(knowledgeSearchTool.id)) {
  toolRegistry.register(knowledgeSearchTool);
}
if (!toolRegistry.has(webSearchTool.id)) {
  toolRegistry.register(webSearchTool);
}

export * from './agent.types.js';
export * from './agent.registry.js';
export * from './agent.router.js';
export * from './agent.orchestrator.js';
export * from './general.agent.js';
export * from './coding.agent.js';
export * from './research.agent.js';
export * from './document.agent.js';
export * from './tools/tool.types.js';
export * from './tools/tool.registry.js';
export * from './tools/calculator.tool.js';
export * from './tools/knowledge-search.tool.js';
export * from './tools/web-search.tool.js';
