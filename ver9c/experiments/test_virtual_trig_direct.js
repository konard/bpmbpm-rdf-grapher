// Direct test for Virtual TriG computation
// Tests if recalculateAllVirtualTriGs() works correctly with sample data

console.log('=== Direct Virtual TriG Computation Test ===');

// Load dependencies
const N3 = require('n3');
const fs = require('fs');
const path = require('path');

// Load test data
const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
const trigData = fs.readFileSync(testDataPath, 'utf8');

// Parse and setup store
async function runTest() {
    try {
        // Setup
        global.currentStore = new N3.Store();
        global.currentPrefixes = {
            'vad': 'http://example.org/vad#',
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'dcterms': 'http://purl.org/dc/terms/'
        };

        global.N3 = N3;
        global.funSPARQLvaluesComunica = async function(query, prefixes) {
            console.log('SPARQL Query:', query.substring(0, 100) + '...');
            // Return empty results for simplicity - the computation will still work
            return [];
        };

        global.getPrefixedName = function(uri, prefixes) {
            for (const [prefix, ns] of Object.entries(prefixes)) {
                if (uri.startsWith(ns)) {
                    return prefix + ':' + uri.substring(ns.length);
                }
            }
            return uri;
        };

        global.getNodeTypes = function(uri) {
            // Simple mock implementation
            return [];
        };

        console.log('1. Parsing TriG data...');
        const parser = new N3.Parser({ format: 'trig' });
        
        await new Promise((resolve, reject) => {
            parser.parse(trigData, (error, quad, prefixes) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (quad) {
                    global.currentStore.addQuad(quad);
                } else {
                    console.log(`   Parsed ${global.currentStore.getQuads().length} quads`);
                    resolve();
                }
            });
        });

        console.log('2. Loading Virtual TriG logic...');
        // Load the Virtual TriG logic
        const virtualTrigLogic = fs.readFileSync(
            path.join(__dirname, '../10_virtualTriG/10_virtualTriG_logic.js'), 'utf8'
        );
        eval(virtualTrigLogic);

        console.log('3. Testing Virtual TriG computation...');
        const stats = await global.recalculateAllVirtualTriGs(global.currentPrefixes);
        
        console.log('4. Results:');
        console.log('   Stats:', stats);
        
        console.log('5. Checking Virtual TriG content...');
        const virtualContent = global.formatVirtualTriGFromStore(global.currentPrefixes);
        console.log('Virtual TriG Content:');
        console.log(virtualContent);

        console.log('6. Specific checks for ExecutorGroup labels...');
        
        // Check for expected Virtual TriG graphs
        const expectedGraphs = [
            'http://example.org/vad#vt_eg_t_p1',
            'http://example.org/vad#vt_eg_t_p1_1', 
            'http://example.org/vad#vt_eg_t_p2'
        ];
        
        for (const expectedGraph of expectedGraphs) {
            const quads = global.currentStore.getQuads(null, null, null, expectedGraph);
            console.log(`   ${expectedGraph}: ${quads.length} quads`);
            
            // Look for ExecutorGroup rdfs:label quads
            const labelQuads = global.currentStore.getQuads(
                null,
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                null,
                expectedGraph
            );
            
            console.log(`      Label quads: ${labelQuads.length}`);
            labelQuads.forEach(q => {
                console.log(`        ${q.subject.value} -> "${q.object.value}"`);
            });
        }

        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

runTest();