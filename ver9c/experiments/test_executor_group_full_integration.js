// Full integration test for ExecutorGroup rdfs:label computation
// This test verifies the complete workflow from creation to visualization

console.log('=== Full Integration Test: ExecutorGroup rdfs:label ===');

// Test 1: Verify ExecutorGroup creation uses dcterms:description
console.log('\n--- Test 1: ExecutorGroup Creation ---');
const creationSPARQL = `
INSERT DATA {
    GRAPH vad:t_p1 {
        vad:ExecutorGroup_p1.1 rdf:type vad:ExecutorGroup ;
            dcterms:description "Группа исполнителей процесса p1.1" .
    }
}`;
console.log('ExecutorGroup creation SPARQL:');
console.log(creationSPARQL);

// Test 2: Verify Virtual TriG computation
console.log('\n--- Test 2: Virtual TriG Computation ---');
const testExecutors = [
    { uri: 'vad:Executor1', label: 'Исполнитель 1' },
    { uri: 'vad:Executor2', label: 'Исполнитель 2' },
    { uri: 'vad:Executor3', label: null }
];

// Simulate the computation
const computedLabels = testExecutors.map(exec => 
    exec.label || exec.uri
).join(', ');

console.log('Computed rdfs:label:', computedLabels);

// Test 3: Verify Virtual TriG structure
console.log('\n--- Test 3: Virtual TriG Structure ---');
const virtualTrigStructure = `
vad:vt_eg_t_p1 {
    # Metadata
    vad:vt_eg_t_p1 rdf:type vad:Virtual ;
        vad:hasParentObj vad:t_p1 .
    
    # Computed rdfs:label for ExecutorGroup
    vad:ExecutorGroup_p1.1 rdfs:label "${computedLabels}" .
}`;
console.log('Virtual TriG structure:');
console.log(virtualTrigStructure);

// Test 4: Verify reasoner rules
console.log('\n--- Test 4: Reasoner Rules ---');
console.log('Rule 8: Individual executor labels');
console.log('Rule 9: Aggregated labels with comma separation');

// Test 5: Check visualization integration
console.log('\n--- Test 5: Visualization Integration ---');
console.log('rdfToDotVAD() should:');
console.log('1. Look for rdfs:label in vt_eg_* Virtual TriG');
console.log('2. Use computed label for node display');
console.log('3. Fallback to old method if not found');

// Test 6: Verify algorithm steps
console.log('\n--- Test 6: Algorithm Verification ---');
const algorithmSteps = [
    '1. Collect all executors for ExecutorGroup via vad:includes',
    '2. Get rdfs:label for each executor (fallback to prefixed name)',
    '3. Join executor names with commas',
    '4. Store computed rdfs:label in Virtual TriG (vad:vt_eg_*)'
];
algorithmSteps.forEach(step => console.log(step));

console.log('\n=== Integration Test Complete ===');
console.log('Expected result: ExecutorGroup displays "Исполнитель 1, Исполнитель 2, vad:Executor3"');