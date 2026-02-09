// Test script for ExecutorGroup rdfs:label computation in Virtual TriG
// Issue #340: ver9c_3ExecutorGroup1

console.log('=== Test ExecutorGroup rdfs:label computation ===');

// Test data
const testData = {
    prefixes: {
        'vad': 'http://example.org/vad#',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'dcterms': 'http://purl.org/dc/terms/'
    },
    trigUri: 'vad:t_p1',
    executorGroupUri: 'vad:ExecutorGroup_p1.1',
    executors: [
        { uri: 'vad:Executor1', label: 'Исполнитель 1' },
        { uri: 'vad:Executor2', label: 'Исполнитель 2' },
        { uri: 'vad:Executor3', label: null } // No label
    ]
};

// Expected result
const expectedLabel = 'Исполнитель 1, Исполнитель 2, vad:Executor3';

console.log('Test data:', JSON.stringify(testData, null, 2));
console.log('Expected label:', expectedLabel);

// Function to test label computation
function testComputeLabel(executors, prefixes) {
    const labels = executors.map(exec => {
        if (exec.label) {
            return exec.label;
        } else {
            // Use prefixed name if no label
            return exec.uri;
        }
    });
    return labels.join(', ');
}

// Run test
const computedLabel = testComputeLabel(testData.executors, testData.prefixes);
console.log('Computed label:', computedLabel);
console.log('Test passed:', computedLabel === expectedLabel);

// Test Virtual TriG generation
console.log('\n=== Virtual TriG Generation Test ===');
const virtualTrigUri = testData.trigUri.replace('#t_', '#vt_eg_');
console.log('Virtual TriG URI:', virtualTrigUri);

// Generate Virtual TriG content
const virtualTrigContent = `${virtualTrigUri} {
    # Metadata
    ${virtualTrigUri} rdf:type vad:Virtual ;
        vad:hasParentObj ${testData.trigUri} .
    
    # Computed rdfs:label for ExecutorGroup
    ${testData.executorGroupUri} rdfs:label "${computedLabel}" .
}`;

console.log('Virtual TriG content:');
console.log(virtualTrigContent);

console.log('\n=== Test Complete ===');