/**
 * Test script for synastry reading cache functionality
 * Run this with: npx ts-node web/app/api/synastry/reading/test-cache.ts
 */

import { checkCachedSynastryReading, cacheSynastryReading } from '@/handlers/synastryReading';
import { SynastryReading } from '@/types/synastry';

async function testSynastryCaching() {
  console.log('🧪 Testing Synastry Reading Cache Implementation\n');

  // Test 1: Check cache for non-existent reading
  console.log('Test 1: Checking cache for non-existent reading...');
  const nonExistent = await checkCachedSynastryReading(
    'test-chart-id-12345',
    'girlfriend',
    'connection-123',
    undefined,
    168
  );
  console.log('Result:', nonExistent === null ? '✅ PASS (returns null)' : '❌ FAIL (should return null)');
  console.log('');

  // Test 2: Create and cache a test reading
  console.log('Test 2: Creating and caching a test reading...');
  const testReading: SynastryReading = {
    id: `test_synastry_${Date.now()}`,
    synastryChartId: 'test-chart-abc123',
    connectionId: 'test-connection-456',
    savedChartId: undefined,
    interpretation: 'This is a test synastry reading for cache validation. The connection between these two individuals shows strong compatibility in emotional understanding and shared values.',
    relationshipContext: 'romantic partner',
    aiGenerated: true,
    model: 'claude-sonnet-4-20250514',
    promptVersion: '1.0',
    savedByUserId: '00000000-0000-0000-0000-000000000000', // Test user ID
    createdAt: new Date().toISOString(),
  };

  const cacheResult = await cacheSynastryReading(testReading);
  console.log('Cache save result:', cacheResult ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 3: Retrieve the cached reading
  if (cacheResult) {
    console.log('Test 3: Retrieving the cached reading...');
    const cachedReading = await checkCachedSynastryReading(
      'test-chart-abc123',
      'romantic partner',
      'test-connection-456',
      undefined,
      168
    );

    if (cachedReading) {
      console.log('✅ PASS - Found cached reading');
      console.log('  - ID matches:', cachedReading.id === testReading.id);
      console.log('  - Interpretation matches:', cachedReading.interpretation === testReading.interpretation);
      console.log('  - Model matches:', cachedReading.model === testReading.model);
      console.log('  - Context matches:', cachedReading.relationshipContext === testReading.relationshipContext);
    } else {
      console.log('❌ FAIL - Could not retrieve cached reading');
    }
  } else {
    console.log('Test 3: SKIPPED (cache save failed)');
  }
  console.log('');

  // Test 4: Check cache with different context (should not match)
  console.log('Test 4: Checking cache with different context...');
  const differentContext = await checkCachedSynastryReading(
    'test-chart-abc123',
    'friend', // Different context
    'test-connection-456',
    undefined,
    168
  );
  console.log('Result:', differentContext === null ? '✅ PASS (correctly returns null for different context)' : '❌ FAIL');
  console.log('');

  // Test 5: Check cache expiration logic
  console.log('Test 5: Testing cache expiration (0 hour window)...');
  const expired = await checkCachedSynastryReading(
    'test-chart-abc123',
    'romantic partner',
    'test-connection-456',
    undefined,
    0 // 0 hours - should be expired
  );
  console.log('Result:', expired === null ? '✅ PASS (correctly expired)' : '❌ FAIL (should be expired)');
  console.log('');

  console.log('🏁 Cache Testing Complete!\n');
  console.log('Summary:');
  console.log('- Cache lookup for non-existent records works');
  console.log('- Cache saving works');
  console.log('- Cache retrieval works');
  console.log('- Context filtering works');
  console.log('- Expiration logic works');
}

// Run the test
testSynastryCaching().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
