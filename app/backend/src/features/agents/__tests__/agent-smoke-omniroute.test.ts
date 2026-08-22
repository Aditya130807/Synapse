import prisma from '../../../lib/prisma.js';
import { agentRegistry } from '../agent.registry.js';
import { generalAgent } from '../general.agent.js';
import { codingAgent } from '../coding.agent.js';
import { researchAgent } from '../research.agent.js';
import { documentAgent } from '../document.agent.js';
import { agentOrchestrator } from '../agent.orchestrator.js';

async function runRealWorldOmniRouteSmokeTest() {
  console.log('==================================================================');
  console.log('  STARTING REAL-WORLD OMNIROUTE LIVE SMOKE TEST SUITE             ');
  console.log('==================================================================');

  // Register agents
  if (!agentRegistry.has('general')) agentRegistry.register(generalAgent);
  if (!agentRegistry.has('coding')) agentRegistry.register(codingAgent);
  if (!agentRegistry.has('research')) agentRegistry.register(researchAgent);
  if (!agentRegistry.has('document')) agentRegistry.register(documentAgent);

  // Setup test user & conversation
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'OmniRoute Smoke Test User', email: 'omniroute-smoke@example.com', password: 'password123' },
    });
  }

  // --- 1. General Query ---
  console.log('\n[SMOKE 1] General Agent Query: "What is React?"');
  const conv1 = await prisma.conversation.create({ data: { userId: user.id, title: 'General Smoke' } });
  await prisma.message.create({ data: { conversationId: conv1.id, role: 'user', content: 'What is React?' } });

  const msg1 = await agentOrchestrator.execute(user.id, conv1.id);
  const meta1 = (msg1.metadata?.strategyMeta as any)?.agentMeta;

  console.log(`   Agent Executed: ${meta1?.agentName} (${meta1?.executedAgent})`);
  console.log(`   Provider: ${meta1?.provider}`);
  console.log(`   Requested Model: ${meta1?.requestedModel}`);
  console.log(`   Selected Model: ${meta1?.selectedModel}`);
  console.log(`   Resolved Downstream Model: ${meta1?.resolvedModel}`);
  console.log(`   Response Excerpt: ${msg1.content.substring(0, 100).replace(/\n/g, ' ')}...`);

  if (meta1?.executedAgent !== 'general' || meta1?.provider !== 'omniroute') {
    throw new Error('Smoke Test 1 Failed: General query did not execute through GeneralAgent on OmniRoute.');
  }

  // --- 2. Coding Query ---
  console.log('\n[SMOKE 2] Coding Agent Query: "Why is my React component rerendering?"');
  const conv2 = await prisma.conversation.create({ data: { userId: user.id, title: 'Coding Smoke' } });
  await prisma.message.create({ data: { conversationId: conv2.id, role: 'user', content: 'Why is my React component rerendering?' } });

  const msg2 = await agentOrchestrator.execute(user.id, conv2.id);
  const meta2 = (msg2.metadata?.strategyMeta as any)?.agentMeta;

  console.log(`   Agent Executed: ${meta2?.agentName} (${meta2?.executedAgent})`);
  console.log(`   Provider: ${meta2?.provider}`);
  console.log(`   Requested Model: ${meta2?.requestedModel}`);
  console.log(`   Selected Model: ${meta2?.selectedModel}`);
  console.log(`   Resolved Downstream Model: ${meta2?.resolvedModel}`);
  console.log(`   Response Excerpt: ${msg2.content.substring(0, 100).replace(/\n/g, ' ')}...`);

  if (meta2?.executedAgent !== 'coding') {
    throw new Error('Smoke Test 2 Failed: Coding query did not route to CodingAgent.');
  }

  // --- 3. Research Query ---
  console.log('\n[SMOKE 3] Research Agent Query: "Compare PostgreSQL vs MongoDB."');
  const conv3 = await prisma.conversation.create({ data: { userId: user.id, title: 'Research Smoke' } });
  await prisma.message.create({ data: { conversationId: conv3.id, role: 'user', content: 'Compare PostgreSQL vs MongoDB.' } });

  const msg3 = await agentOrchestrator.execute(user.id, conv3.id);
  const meta3 = (msg3.metadata?.strategyMeta as any)?.agentMeta;

  console.log(`   Agent Executed: ${meta3?.agentName} (${meta3?.executedAgent})`);
  console.log(`   Provider: ${meta3?.provider}`);
  console.log(`   Requested Model: ${meta3?.requestedModel}`);
  console.log(`   Selected Model: ${meta3?.selectedModel}`);
  console.log(`   Resolved Downstream Model: ${meta3?.resolvedModel}`);
  console.log(`   Response Excerpt: ${msg3.content.substring(0, 100).replace(/\n/g, ' ')}...`);

  if (meta3?.executedAgent !== 'research') {
    throw new Error('Smoke Test 3 Failed: Research query did not route to ResearchAgent.');
  }

  // Cleanup test conversations
  await prisma.conversation.deleteMany({
    where: { id: { in: [conv1.id, conv2.id, conv3.id] } },
  });

  console.log('\n==================================================================');
  console.log('  REAL-WORLD OMNIROUTE LIVE SMOKE TEST SUITE PASSED 100%!         ');
  console.log('==================================================================\n');
}

runRealWorldOmniRouteSmokeTest().catch((err) => {
  console.error('\n❌ OMNIROUTE SMOKE TEST FAILED:', err);
  process.exit(1);
});
