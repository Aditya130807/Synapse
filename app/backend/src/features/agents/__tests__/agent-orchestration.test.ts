import prisma from '../../../lib/prisma.js';
import { agentRegistry } from '../agent.registry.js';
import { agentRouter } from '../agent.router.js';
import { agentOrchestrator } from '../agent.orchestrator.js';
import { generalAgent } from '../general.agent.js';
import { codingAgent } from '../coding.agent.js';
import { researchAgent } from '../research.agent.js';
import { documentAgent } from '../document.agent.js';
import { toolRegistry } from '../tools/tool.registry.js';
import type { Agent, AgentContext, AgentExecutionOptions, AgentResult } from '../agent.types.js';
import { ApiError } from '../../../utils/ApiError.js';

async function runAgentOrchestrationTests() {
  console.log('==================================================================');
  console.log('  STARTING PHASE A SYNAPSE MULTI-AGENT V1 ORCHESTRATION TESTS   ');
  console.log('==================================================================');

  // Ensure all 4 specialized agents are registered
  if (!agentRegistry.has('general')) agentRegistry.register(generalAgent);
  if (!agentRegistry.has('coding')) agentRegistry.register(codingAgent);
  if (!agentRegistry.has('research')) agentRegistry.register(researchAgent);
  if (!agentRegistry.has('document')) agentRegistry.register(documentAgent);

  // --- TEST 1: Agent Registry & Multi-Agent Registration ---
  console.log('\n[TEST 1] Specialized Agent Registry Verification');
  const registered = agentRegistry.getAll();
  console.log(`   Registered Agents (${registered.length}): ${registered.map((a) => a.name).join(', ')}`);
  
  const expectedAgentIds = ['general', 'coding', 'research', 'document'];
  for (const id of expectedAgentIds) {
    if (!agentRegistry.has(id)) {
      throw new Error(`Test 1 Failed: Expected agent "${id}" is not registered.`);
    }
  }
  console.log('   All 4 specialized agents verified in AgentRegistry.');

  // --- TEST 2: Deterministic Intent Router Verification ---
  console.log('\n[TEST 2] Intent Router Decision Verification');
  
  const routingTestCases = [
    { query: "What's an API?", fileIds: [], expectedAgent: 'general' },
    { query: 'Why is my API returning 500?', fileIds: [], expectedAgent: 'coding' },
    { query: 'Compare REST and GraphQL.', fileIds: [], expectedAgent: 'research' },
    { query: 'Explain this attached API documentation.', fileIds: ['file-1'], expectedAgent: 'document' },
    { query: 'What is a PDF?', fileIds: [], expectedAgent: 'general' },
    { query: 'Why is my PDF parser throwing an error?', fileIds: [], expectedAgent: 'coding' },
    { query: 'Compare these two attached architecture documents.', fileIds: ['file-1', 'file-2'], expectedAgent: 'document' },
    { query: 'What should I use for my database?', fileIds: [], expectedAgent: 'research' },
  ];

  for (const tc of routingTestCases) {
    const ctx: AgentContext = {
      userId: 'user-test-1',
      conversationId: 'conv-test-1',
      query: tc.query,
      history: [],
      messageFileIds: tc.fileIds,
    };
    const decision = await agentRouter.route(ctx);
    console.log(`   Query: "${tc.query}" (files=${tc.fileIds.length}) → Agent: ${decision.agentId} (confidence=${decision.confidence})`);
    if (decision.agentId !== tc.expectedAgent) {
      throw new Error(
        `Test 2 Failed for query "${tc.query}": expected "${tc.expectedAgent}" but got "${decision.agentId}".`
      );
    }
  }
  console.log('   All routing intent test cases passed perfectly!');

  // --- TEST 3: Model Failure Fallback Verification ---
  console.log('\n[TEST 3] Graceful Model Failure Fallback Verification');
  
  // Register a failing specialized agent that throws an OpenRouter HTTP 429 rate limit error
  const failingAgent: Agent = {
    id: 'failing-spec',
    name: 'Failing Specialized Agent',
    description: 'Failing agent for testing fallback',
    capabilities: ['conversation.read'],
    canHandle: async () => ({ canHandle: true, confidence: 0.99 }),
    execute: async () => {
      throw new ApiError(429, 'OpenRouter: Rate limit exceeded. Please try again later.');
    },
  };

  // Temporarily force router to pick failing agent
  const originalRoute = agentRouter.route;
  (agentRouter as any).route = async () => ({
    agentId: 'failing-spec',
    reason: 'Testing fallback logic',
    confidence: 0.99,
    candidates: ['failing-spec', 'general'],
  });

  // Temporarily register failing agent and a mock general agent to prevent actual network calls during fallback test
  const mockGeneralAgent: Agent = {
    id: 'general',
    name: 'General Agent',
    description: 'Mock fallback general agent',
    capabilities: generalAgent.capabilities,
    canHandle: generalAgent.canHandle.bind(generalAgent),
    execute: async (context: AgentContext): Promise<AgentResult> => ({
      agentId: 'general',
      status: 'success',
      content: 'Fallback response generated successfully by GeneralAgent.',
      strategyMeta: context.ragResult?.context.strategyMeta,
      durationMs: 12,
    }),
  };

  const realGeneral = agentRegistry.get('general');
  (agentRegistry as any).agents.set('failing-spec', failingAgent);
  (agentRegistry as any).agents.set('general', mockGeneralAgent);

  // Setup test user & conversation
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Fallback Test User', email: 'fallback-test@example.com', password: 'password123' },
    });
  }
  const conv = await prisma.conversation.create({
    data: { userId: user.id, title: 'Fallback Test Conv' },
  });
  await prisma.message.create({
    data: { conversationId: conv.id, role: 'user', content: 'Test prompt' },
  });

  const fallbackMsg = await agentOrchestrator.execute(user.id, conv.id);
  const fallbackMeta = (fallbackMsg.metadata?.strategyMeta as any)?.agentMeta;

  console.log(`   Fallback Message Created: id=${fallbackMsg.id}`);
  console.log(`   AgentMeta Fallback Flag: ${fallbackMeta?.fallback}`);
  console.log(`   AgentMeta Fallback Reason: "${fallbackMeta?.fallbackReason}"`);

  if (!fallbackMeta || !fallbackMeta.fallback || fallbackMeta.agentId !== 'general') {
    throw new Error('Test 3 Failed: Fallback metadata missing or did not fallback to general agent.');
  }
  console.log('   Graceful specialized model fallback verified successfully!');

  // Cleanup test state
  (agentRouter as any).route = originalRoute;
  (agentRegistry as any).agents.delete('failing-spec');
  if (realGeneral) (agentRegistry as any).agents.set('general', realGeneral);
  await prisma.conversation.delete({ where: { id: conv.id } });

  console.log('\n==================================================================');
  console.log('  ALL PHASE A MULTI-AGENT ORCHESTRATION TESTS PASSED 100%!       ');
  console.log('==================================================================\n');
}

runAgentOrchestrationTests().catch((err) => {
  console.error('\n❌ PHASE A TEST FAILED:', err);
  process.exit(1);
});
