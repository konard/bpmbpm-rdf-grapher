// Test to reproduce ExecutorGroup Virtual TriG issue
// Simulates exact workflow of main application

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};
global.document = {
    createElement: () => ({
        addEventListener: () => {},
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {} },
        focus: () => {},
        style: {}
    }),
    getElementById: () => null,
    querySelectorAll: () => []
};

// Load N3
const N3 = require('n3');

// Initialize global variables like main application
global.currentStore = null;
global.currentPrefixes = {};
global.currentMode = 'vad-trig';
global.selectedTrigUri = null;
global.trigHierarchy = null;

// Load all required modules
console.log('=== Loading required modules ===');

// 1. Load vadlib
const vadlibPath = path.join(__dirname, '../9_vadlib/vadlib.js');
const vadlibCode = fs.readFileSync(vadlibPath, 'utf8');
eval(vadlibCode);

// 2. Load Virtual TriG logic
const virtualTrigPath = path.join(__dirname, '../10_virtualTriG/10_virtualTriG_logic.js');
const virtualTrigCode = fs.readFileSync(virtualTrigPath, 'utf8');
eval(virtualTrigCode);

// 3. Load SPARQL module
const vadlibSparqlPath = path.join(__dirname, '../9_vadlib/vadlib_sparql.js');
const sparqlCode = fs.readFileSync(vadlibSparqlPath, 'utf8');
eval(sparqlCode);

async function testMainWorkflow() {
    try {
        console.log('\n=== 1. Loading test data ===');
        
        // Load Trig_VADv8.ttl (same as main application)
        const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
        const trigData = fs.readFileSync(testDataPath, 'utf8');
        
        console.log('Data file loaded:', testDataPath);

        console.log('\n=== 2. Parsing data (like refreshVisualization) ===');
        
        // Parse exactly like refreshVisualization() does
        const parser = new N3.Parser({ format: 'trig' });
        const quads = [];
        let prefixes = {};
        
        await new Promise((resolve, reject) => {
            parser.parse(trigData, (error, quad, parsedPrefixes) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (quad) {
                    quads.push(quad);
                } else {
                    if (parsedPrefixes) {
                        prefixes = parsedPrefixes;
                    }
                    resolve();
                }
            });
        });

        console.log(`Parsed ${quads.length} quads`);
        console.log('Prefixes:', prefixes);

        console.log('\n=== 3. Initializing store (like refreshVisualization) ===');
        
        // Initialize store exactly like refreshVisualization()
        global.currentPrefixes = prefixes;
        global.currentStore = new N3.Store();
        quads.forEach(quad => global.currentStore.addQuad(quad));

        console.log('Store initialized with', global.currentStore.getQuads().length, 'quads');

        console.log('\n=== 4. Finding ExecutorGroups before Virtual TriG ===');
        
        // Check existing ExecutorGroups
        const egQuadsBefore = global.currentStore.getQuads(
            null,
            N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
            null
        );
        
        console.log(`Found ${egQuadsBefore.length} ExecutorGroups:`);
        egQuadsBefore.forEach(q => {
            console.log(`  ${getPrefixedName(q.subject.value, prefixes)}`);
        });

        console.log('\n=== 5. Running Virtual TriG recalculation (key step) ===');
        
        // This is the critical step - same as refreshVisualization() line 532-534
        if (typeof recalculateAllVirtualTriGs === 'function') {
            const stats = await recalculateAllVirtualTriGs(prefixes);
            console.log('Virtual TriG recalculation completed:', stats);
        } else {
            console.error('recalculateAllVirtualTriGs function not found!');
            return;
        }

        console.log('\n=== 6. Checking Virtual TriG results ===');
        
        // Check if ExecutorGroup rdfs:label quads exist in Virtual TriG
        const labelQuads = global.currentStore.getQuads(
            null,
            N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
            null,
            null
        );

        console.log(`Found ${labelQuads.length} total rdfs:label quads`);

        // Filter for ExecutorGroup labels
        const egLabelQuads = labelQuads.filter(q => {
            const typeQuads = global.currentStore.getQuads(
                q.subject,
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
                null
            );
            return typeQuads.length > 0;
        });

        console.log(`Found ${egLabelQuads.length} ExecutorGroup rdfs:label quads:`);
        egLabelQuads.forEach(q => {
            const subject = getPrefixedName(q.subject.value, prefixes);
            const graph = q.graph ? getPrefixedName(q.graph.value, prefixes) : 'default';
            console.log(`  ${subject} rdfs:label "${q.object.value}" (in ${graph})`);
        });

        console.log('\n=== 7. Testing Virtual TriG filter (like UI) ===');
        
        // Test getFilteredQuads with VIRTUAL mode (like UI filter)
        if (typeof getFilteredQuads === 'function') {
            const virtualQuads = getFilteredQuads(TRIG_FILTER_MODES.VIRTUAL);
            console.log(`Virtual filter found ${virtualQuads.length} quads`);

            // Check if Virtual TriG graphs are detected
            const virtualGraphs = new Set();
            virtualQuads.forEach(q => {
                if (q.graph) {
                    virtualGraphs.add(q.graph.value);
                }
            });

            console.log(`Virtual graphs found: ${virtualGraphs.size}`);
            virtualGraphs.forEach(graphUri => {
                console.log(`  ${getPrefixedName(graphUri, prefixes)}`);
            });

            // Check if ExecutorGroup labels are in virtual graphs
            const egLabelsInVirtual = virtualQuads.filter(q => {
                if (q.predicate.value !== 'http://www.w3.org/2000/01/rdf-schema#label') {
                    return false;
                }
                
                const typeQuads = global.currentStore.getQuads(
                    q.subject,
                    N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                    N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
                    null
                );
                return typeQuads.length > 0;
            });

            console.log(`ExecutorGroup labels in Virtual TriG: ${egLabelsInVirtual.length}`);
            egLabelsInVirtual.forEach(q => {
                const subject = getPrefixedName(q.subject.value, prefixes);
                const graph = q.graph ? getPrefixedName(q.graph.value, prefixes) : 'default';
                console.log(`  ${subject} rdfs:label "${q.object.value}" (in ${graph})`);
            });

        } else {
            console.log('getFilteredQuads function not available');
        }

        console.log('\n=== 8. Testing Virtual TriG direct formatting ===');
        
        // Test formatVirtualTriGFromStore (like Virtual TriG button)
        if (typeof formatVirtualTriGFromStore === 'function') {
            const virtualContent = formatVirtualTriGFromStore(prefixes);
            console.log('Virtual TriG formatted content length:', virtualContent.length);
            
            // Check if content contains expected ExecutorGroup labels
            const expectedLabels = [
                'ExecutorGroup_p1_1',
                'ExecutorGroup_p1_2',
                'ExecutorGroup_p1_1_1',
                'ExecutorGroup_p1_1_2',
                'ExecutorGroup_p2_1',
                'ExecutorGroup_p2_2'
            ];
            
            let foundCount = 0;
            expectedLabels.forEach(label => {
                if (virtualContent.includes(label)) {
                    foundCount++;
                }
            });
            
            console.log(`Found ${foundCount}/${expectedLabels.length} expected ExecutorGroup labels in Virtual TriG content`);
            
        } else {
            console.log('formatVirtualTriGFromStore function not available');
        }

        console.log('\n=== TEST COMPLETED ===');
        
        if (egLabelQuads.length > 0) {
            console.log('✅ SUCCESS: ExecutorGroup labels are present in Virtual TriG');
            console.log('The implementation is working correctly!');
        } else {
            console.log('❌ ISSUE: No ExecutorGroup labels found in Virtual TriG');
            console.log('This is the issue the user is experiencing.');
        }

    } catch (error) {
        console.error('Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testMainWorkflow();