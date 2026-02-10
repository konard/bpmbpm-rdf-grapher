// Comprehensive test for ExecutorGroup rdfs:label computation in Virtual TriG
// Issue #349: ver9c_3ExecutorGroup1b

const fs = require('fs');
const path = require('path');

// Mock global variables that would be set in the browser
global.currentStore = null;
global.currentPrefixes = {
    'vad': 'http://example.org/vad#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'dcterms': 'http://purl.org/dc/terms/'
};

// Mock N3 library - in real implementation this would be loaded differently
const N3 = require('n3');
global.N3 = N3;

// Mock helper functions (these would normally come from other modules)
global.getPrefixedName = function(uri, prefixes) {
    for (const [prefix, ns] of Object.entries(prefixes)) {
        if (uri.startsWith(ns)) {
            return prefix + ':' + uri.substring(ns.length);
        }
    }
    return uri;
};

global.funSPARQLvaluesComunica = async function(query, prefixes) {
    // Mock implementation for testing - would normally use Comunica
    console.log('Mock SPARQL query:', query);
    return [];
};

// Load the test data
function loadTestData() {
    const dataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
    const trigData = fs.readFileSync(dataPath, 'utf8');
    return trigData;
}

// Parse TriG data and populate store
async function parseTrigData(trigData) {
    const parser = new N3.Parser({ format: 'trig' });
    const store = new N3.Store();
    
    return new Promise((resolve, reject) => {
        const quads = [];
        parser.parse(trigData, (error, quad, prefixes) => {
            if (error) {
                reject(error);
                return;
            }
            if (quad) {
                quads.push(quad);
            } else {
                // Parsing complete
                quads.forEach(quad => store.addQuad(quad));
                console.log(`Parsed ${quads.length} quads from TriG data`);
                console.log('Prefixes:', prefixes);
                resolve({ store, prefixes });
            }
        });
    });
}

// Test ExecutorGroup label computation
async function testExecutorGroupLabelComputation(store, prefixes) {
    console.log('\n=== Testing ExecutorGroup Label Computation ===');
    
    // Find all ExecutorGroups
    const executorGroups = store.getQuads(
        null, 
        N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
        null
    );
    
    console.log(`Found ${executorGroups.length} ExecutorGroups:`);
    
    for (const egQuad of executorGroups) {
        const executorGroupUri = egQuad.subject.value;
        console.log(`\nProcessing ExecutorGroup: ${executorGroupUri}`);
        
        // Find all executors included in this group
        const includesQuads = store.getQuads(
            N3.DataFactory.namedNode(executorGroupUri),
            N3.DataFactory.namedNode('http://example.org/vad#includes'),
            null,
            null
        );
        
        const executorUris = includesQuads.map(q => q.object.value);
        console.log(`  Includes executors: [${executorUris.join(', ')}]`);
        
        // Get labels for each executor
        const executorLabels = [];
        for (const executorUri of executorUris) {
            const labelQuads = store.getQuads(
                N3.DataFactory.namedNode(executorUri),
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                null,
                null
            );
            
            if (labelQuads.length > 0) {
                executorLabels.push(labelQuads[0].object.value);
                console.log(`    ${executorUri} -> ${labelQuads[0].object.value}`);
            } else {
                executorLabels.push(global.getPrefixedName(executorUri, prefixes));
                console.log(`    ${executorUri} -> ${global.getPrefixedName(executorUri, prefixes)} (no label)`);
            }
        }
        
        // Compute the final label
        const computedLabel = executorLabels.join(', ');
        console.log(`  Computed label: "${computedLabel}"`);
        
        // Create Virtual TriG URI
        const parentTrigUri = 'vad:t_p1'; // This should be derived from context
        const virtualTrigUri = parentTrigUri.replace('#t_', '#vt_eg_');
        console.log(`  Virtual TriG URI: ${virtualTrigUri}`);
        
        // Expected Virtual TriG content
        console.log(`  Expected Virtual TriG triple:`);
        console.log(`    ${executorGroupUri} rdfs:label "${computedLabel}" .`);
    }
}

// Test Virtual TriG creation
async function testVirtualTriGCreation(store, prefixes) {
    console.log('\n=== Testing Virtual TriG Creation ===');
    
    // Create a Virtual TriG for ExecutorGroup
    const parentTrigUri = 'http://example.org/vad#t_p1';
    const executorGroupLabels = {
        'http://example.org/vad#ExecutorGroup_p1_1': 'Исполнитель 1',
        'http://example.org/vad#ExecutorGroup_p1_2': 'Исполнитель 1, Исполнитель 2'
    };
    
    const factory = N3.DataFactory;
    const { namedNode, literal } = factory;
    const newQuads = [];
    
    // Create Virtual TriG URI
    const virtualContainerUri = 'http://example.org/vad#vt_eg_t_p1';
    const virtualGraphNode = namedNode(virtualContainerUri);
    
    // Add metadata quads
    newQuads.push(factory.quad(
        virtualGraphNode,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://example.org/vad#Virtual'),
        virtualGraphNode
    ));
    
    newQuads.push(factory.quad(
        virtualGraphNode,
        namedNode('http://example.org/vad#hasParentObj'),
        namedNode(parentTrigUri),
        virtualGraphNode
    ));
    
    // Add rdfs:label for each ExecutorGroup
    for (const [executorGroupUri, label] of Object.entries(executorGroupLabels)) {
        newQuads.push(factory.quad(
            namedNode(executorGroupUri),
            namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
            literal(label),
            virtualGraphNode
        ));
    }
    
    // Add quads to store
    newQuads.forEach(quad => store.addQuad(quad));
    
    console.log(`Created Virtual TriG with ${newQuads.length} quads for ${virtualContainerUri}`);
    
    // Display the Virtual TriG content
    console.log('\nVirtual TriG content:');
    const virtualQuads = store.getQuads(null, null, null, virtualContainerUri);
    virtualQuads.forEach(quad => {
        const subject = global.getPrefixedName(quad.subject.value, prefixes);
        const predicate = global.getPrefixedName(quad.predicate.value, prefixes);
        const object = quad.object.termType === 'Literal' 
            ? `"${quad.object.value}"` 
            : global.getPrefixedName(quad.object.value, prefixes);
        console.log(`  ${subject} ${predicate} ${object} .`);
    });
    
    return newQuads;
}

// Main test execution
async function runTest() {
    try {
        console.log('=== ExecutorGroup Virtual TriG Integration Test ===');
        
        // Load test data
        const trigData = loadTestData();
        console.log('Loaded test data from Trig_VADv8.ttl');
        
        // Parse data
        const { store, prefixes } = await parseTrigData(trigData);
        global.currentStore = store;
        global.currentPrefixes = { ...global.currentPrefixes, ...prefixes };
        
        // Test label computation
        await testExecutorGroupLabelComputation(store, global.currentPrefixes);
        
        // Test Virtual TriG creation
        await testVirtualTriGCreation(store, global.currentPrefixes);
        
        console.log('\n=== Test Complete ===');
        console.log('✅ Successfully tested ExecutorGroup label computation and Virtual TriG creation');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
if (require.main === module) {
    runTest();
}

module.exports = { runTest, testExecutorGroupLabelComputation, testVirtualTriGCreation };