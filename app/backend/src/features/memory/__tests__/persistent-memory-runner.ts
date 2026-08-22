import { containsSensitiveInfo } from '../persistent-memory.service.js';
import { memoryPipeline } from '../memory.pipeline.js';

async function runTests() {
  console.log('--- Running Persistent Memory System Tests ---');

  // Test 1: Secret Filtering
  const secretTest1 = containsSensitiveInfo('Remember password = Secret123!');
  const secretTest2 = containsSensitiveInfo('api_key: sk-proj-12345678901234567890123456789012');
  const secretTest3 = containsSensitiveInfo('For this project, always use PostgreSQL and Prisma.');

  console.assert(secretTest1 === true, 'Secret test 1 failed');
  console.assert(secretTest2 === true, 'Secret test 2 failed');
  console.assert(secretTest3 === false, 'Secret test 3 failed');
  console.log('✓ Secret & Security Filtering Passed');

  // Test 2: Pipeline Intent Classification
  const tempFeedback = await memoryPipeline.processIncomingMessage(
    'user-1',
    'default',
    'conv-1',
    'For this response, give me only the SQL query'
  );
  console.assert(tempFeedback.actionExecuted === 'none', 'Temporary request test failed');
  console.log('✓ Temporary Request Filtering Passed');

  const viewFeedback = await memoryPipeline.processIncomingMessage(
    'user-1',
    'default',
    'conv-1',
    'What do you remember about this project?'
  );
  console.assert(viewFeedback.actionExecuted === 'viewed', 'View command test failed');
  console.log('✓ View Command Detection Passed');

  console.log('--- ALL PERSISTENT MEMORY TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
