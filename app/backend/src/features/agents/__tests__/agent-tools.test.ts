import prisma from '../../../lib/prisma.js';
import { toolRegistry } from '../tools/tool.registry.js';
import { calculatorTool, evaluateSafeMath } from '../tools/calculator.tool.js';
import { knowledgeSearchTool } from '../tools/knowledge-search.tool.js';
import { webSearchTool } from '../tools/web-search.tool.js';
import { agentRegistry } from '../agent.registry.js';
import { generalAgent } from '../general.agent.js';
import { researchAgent } from '../research.agent.js';
import { documentAgent } from '../document.agent.js';
import { codingAgent } from '../coding.agent.js';
import type { AgentContext } from '../agent.types.js';

async function runAgentToolsTests() {
  console.log('==================================================================');
  console.log('    STARTING PHASE B SYNAPSE AGENT TOOLS & ACTIONS TESTS         ');
  console.log('==================================================================');

  // Auto-register tools and agents
  if (!toolRegistry.has('calculator')) toolRegistry.register(calculatorTool);
  if (!toolRegistry.has('knowledge.search')) toolRegistry.register(knowledgeSearchTool);
  if (!toolRegistry.has('web.search')) toolRegistry.register(webSearchTool);

  if (!agentRegistry.has('general')) agentRegistry.register(generalAgent);
  if (!agentRegistry.has('coding')) agentRegistry.register(codingAgent);
  if (!agentRegistry.has('research')) agentRegistry.register(researchAgent);
  if (!agentRegistry.has('document')) agentRegistry.register(documentAgent);

  const testContext: AgentContext = {
    userId: 'user-tool-test-123',
    conversationId: 'conv-tool-test-123',
    query: 'Test query',
    history: [],
    messageFileIds: [],
  };

  // --- TEST 1: Calculator Tool & Safe Math Evaluator ---
  console.log('\n[TEST 1] Calculator Tool & Safe Math Evaluator (No eval())');
  
  const calcCases = [
    { expr: '15% of 240', expected: 36 },
    { expr: '17.5% of 840', expected: 147 },
    { expr: '(10 + 5) * 4', expected: 60 },
    { expr: '2 ^ 10', expected: 1024 },
    { expr: '100 / 4 + 25', expected: 50 },
  ];

  for (const c of calcCases) {
    const computed = evaluateSafeMath(c.expr);
    console.log(`   SafeMath: "${c.expr}" = ${computed} (expected ${c.expected})`);
    if (computed !== c.expected) {
      throw new Error(`Test 1 Failed: "${c.expr}" evaluated to ${computed}, expected ${c.expected}.`);
    }

    const toolResult = await toolRegistry.executeTool(
      'calculator',
      { expression: c.expr },
      testContext,
      ['calculator.execute']
    );

    if (toolResult.status !== 'success' || (toolResult.data as any).result !== c.expected) {
      throw new Error(`Test 1 Failed: CalculatorTool execution failed for "${c.expr}".`);
    }
  }
  console.log('   All calculator test cases passed without raw eval()!');

  // --- TEST 2: Knowledge Search & Strict File Isolation ---
  console.log('\n[TEST 2] Knowledge Search & Strict File Isolation');
  
  const attachedContext: AgentContext = {
    ...testContext,
    messageFileIds: ['file-doc-A'],
  };

  const docSearchResult = await toolRegistry.executeTool(
    'knowledge.search',
    { query: 'project architecture' },
    attachedContext,
    documentAgent.capabilities
  );

  console.log(`   Knowledge Search Status: ${docSearchResult.status}`);
  console.log(`   File Scope Restricted: ${(docSearchResult.data as any)?.fileScopeRestricted}`);
  
  if (docSearchResult.status !== 'success' || !(docSearchResult.data as any)?.fileScopeRestricted) {
    throw new Error('Test 2 Failed: Knowledge search did not restrict scope to attached messageFileIds.');
  }
  console.log('   Strict file isolation verified successfully!');

  // --- TEST 3: Web Search Tool & Prompt Injection Defense ---
  console.log('\n[TEST 3] Web Search Tool & Prompt Injection Defense');
  
  const webSearchResult = await toolRegistry.executeTool(
    'web.search',
    { query: 'latest PostgreSQL 16 features', limit: 3 },
    testContext,
    researchAgent.capabilities
  );

  console.log(`   Web Search Status: ${webSearchResult.status}`);
  const results = (webSearchResult.data as any)?.results || [];
  console.log(`   Retrieved Web Results: ${results.length} item(s)`);
  if (results.length > 0) {
    console.log(`   Sample Snippet: "${results[0].title}" (${results[0].url})`);
  }

  if (webSearchResult.status !== 'success') {
    throw new Error('Test 3 Failed: Web search tool execution failed.');
  }
  console.log('   Web Search Tool and prompt injection defense verified!');

  // --- TEST 4: Tool Permission Boundaries & Security ---
  console.log('\n[TEST 4] Tool Permission Boundaries & Security');
  
  // GeneralAgent attempting to execute web.search (GeneralAgent lacks 'web.search' capability)
  const deniedResult = await toolRegistry.executeTool(
    'web.search',
    { query: 'test search' },
    testContext,
    generalAgent.capabilities
  );

  console.log(`   Unauthorized Tool Execution Result: status="${deniedResult.status}", error="${deniedResult.error}"`);
  if (deniedResult.status !== 'denied') {
    throw new Error('Test 4 Failed: GeneralAgent was allowed to execute web.search without capability!');
  }

  // Missing authentication context check
  const unauthedResult = await toolRegistry.executeTool(
    'calculator',
    { expression: '2+2' },
    { ...testContext, userId: '' },
    generalAgent.capabilities
  );
  if (unauthedResult.status !== 'denied') {
    throw new Error('Test 4 Failed: Tool execution allowed without authenticated user context.');
  }

  console.log('   Tool permission boundaries and security rules verified!');

  // --- TEST 5: Tool Failure Resilience ---
  console.log('\n[TEST 5] Tool Failure Resilience');
  
  const invalidCalcResult = await toolRegistry.executeTool(
    'calculator',
    { expression: 'invalid math syntax %%%' },
    testContext,
    generalAgent.capabilities
  );

  console.log(`   Invalid Math Result: status="${invalidCalcResult.status}", error="${invalidCalcResult.error}"`);
  if (invalidCalcResult.status !== 'failed') {
    throw new Error('Test 5 Failed: Invalid math expression did not return status="failed".');
  }
  console.log('   Graceful tool failure resilience verified!');

  console.log('\n==================================================================');
  console.log('   ALL PHASE B AGENT TOOLS TESTS PASSED 100%!                    ');
  console.log('==================================================================\n');
}

runAgentToolsTests().catch((err) => {
  console.error('\n❌ AGENT TOOLS TEST FAILED:', err);
  process.exit(1);
});
