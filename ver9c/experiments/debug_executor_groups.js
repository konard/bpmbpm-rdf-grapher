// Debug test for ExecutorGroup Virtual TriG creation
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

async function debugExecutorGroupWorkflow() {
    try {
        console.log('\n=== 1. Loading test data ===');
        
        // Load Trig_VADv8.ttl
        const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
        const trigData = fs.readFileSync(testDataPath, 'utf8');
        
        console.log('Data file loaded:', testDataPath);

        console.log('\n=== 2. Parsing data ===');
        
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

        console.log('\n=== 3. Initializing store ===');
        
        // Initialize store exactly like refreshVisualization()
        global.currentPrefixes = prefixes;
        global.currentStore = new N3.Store();
        quads.forEach(quad => global.currentStore.addQuad(quad));

        console.log('Store initialized with', global.currentStore.getQuads().length, 'quads');

        console.log('\n=== 4. Testing getExecutorGroupsInTrig ===');
        
        // Test getExecutorGroupsInTrig for each trig
        const trigUris = [
            'http://example.org/vad#t_p1',
            'http://example.org/vad#t_p1_1', 
            'http://example.org/vad#t_p2'
        ];

        for (const trigUri of trigUris) {
            console.log(`\n--- Checking ${trigUri} ---`);
            
            const executorGroups = await getExecutorGroupsInTrig(trigUri);
            console.log(`Found ${executorGroups.length} ExecutorGroups:`);
            executorGroups.forEach(eg => {
                console.log(`  ${getPrefixedName(eg, prefixes)}`);
            });

            if (executorGroups.length > 0) {
                for (const executorGroupUri of executorGroups) {
                    console.log(`\nComputing label for ${getPrefixedName(executorGroupUri, prefixes)}:`);
                    
                    const label = await computeExecutorGroupLabel(executorGroupUri);
                    console.log(`  Computed label: "${label}"`);
                }
            }
        }

        console.log('\n=== 5. Running Virtual TriG recalculation ===');
        
        const stats = await recalculateAllVirtualTriGs(prefixes);
        console.log('Virtual TriG recalculation completed:', stats);

        console.log('\n=== 6. Checking final Virtual TriG content ===');
        
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

        console.log('\n=== DEBUG COMPLETED ===');

    } catch (error) {
        console.error('Debug failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run debug test
debugExecutorGroupWorkflow();