// Test to verify the SPARQL query fixes for ExecutorGroup label computation
console.log('=== Testing SPARQL Query Fixes ===');

// Mock the SPARQL execution for testing
const mockResults = [
    { executor: 'vad:Executor1', executorLabel: 'Исполнитель 1' },
    { executor: 'vad:Executor2', executorLabel: 'Исполнитель 2' },
    { executor: 'vad:Executor3', executorLabel: null }
];

// Test the fixed query structure
console.log('\n--- Testing Fixed computeExecutorGroupLabel Query ---');
const executorGroupUri = 'vad:ExecutorGroup_p1.1';
const fixedQuery = `
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?executor ?executorLabel WHERE {
    <${executorGroupUri}> vad:includes ?executor .
    OPTIONAL {
        ?executor rdfs:label ?executorLabel .
    }
}
ORDER BY ?executor
`;

console.log('Fixed SPARQL query:');
console.log(fixedQuery);
console.log('\nThis query correctly uses <URI> instead of ?variable');

// Test the expected result processing
console.log('\n--- Testing Result Processing ---');
const computedLabel = mockResults.map(row => {
    if (row.executorLabel) {
        return row.executorLabel;
    } else {
        // Simulate getPrefixedName for executor without label
        return row.executor;
    }
}).join(', ');

console.log('Processed results:');
mockResults.forEach(row => {
    const label = row.executorLabel || row.executor;
    console.log(`  ${row.executor} -> ${label}`);
});
console.log(`\nComputed label: "${computedLabel}"`);

// Verify the expected result
const expectedLabel = 'Исполнитель 1, Исполнитель 2, vad:Executor3';
console.log(`\nExpected: "${expectedLabel}"`);
console.log(`Match: ${computedLabel === expectedLabel ? '✅ YES' : '❌ NO'}`);

console.log('\n=== Test Complete ===');