// Simple test to verify ExecutorGroup labels in Virtual TriG
// Issue #349: Check if computed rdfs:label appears in Virtual TriG

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};
global.document = {};

// Load N3
const N3 = require('n3');

// Mock global variables
global.currentStore = new N3.Store();
global.currentPrefixes = {
    'vad': 'http://example.org/vad#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'dcterms': 'http://purl.org/dc/terms/'
};

global.N3 = N3;

// Mock SPARQL engine - return real results for this test
global.funSPARQLvaluesComunica = async function(query, prefixes) {
    console.log('SPARQL Query:', query.substring(0, 100) + '...');
    
    const store = global.currentStore;
    const results = [];
    
    // Handle specific ExecutorGroup query: "<{executorGroupUri}> vad:includes ?executor"
    const egMatch = query.match(/<([^>]+)>[^<]*vad:includes[^<]*\?executor/);
    if (egMatch) {
        const executorGroupUri = egMatch[1];
        console.log(`   Query for executors in ${global.getPrefixedName(executorGroupUri, global.currentPrefixes)}`);
        
        // Find executors included in this specific ExecutorGroup
        const includesQuads = store.getQuads(
            N3.DataFactory.namedNode(executorGroupUri),
            N3.DataFactory.namedNode('http://example.org/vad#includes'),
            null,
            null
        );
        
        for (const q of includesQuads) {
            const executorUri = q.object.value;
            
            // Find executor label
            const labelQuads = store.getQuads(
                N3.DataFactory.namedNode(executorUri),
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                null,
                null
            );
            
            results.push({
                executor: executorUri,
                executorLabel: labelQuads.length > 0 ? labelQuads[0].object.value : null
            });
        }
        
        return results;
    }
    
    // Query for ExecutorGroups in specific graph
    if (query.includes('GRAPH <') && query.includes('rdf:type vad:ExecutorGroup')) {
        const graphMatch = query.match(/GRAPH <([^>]+)>/);
        if (graphMatch) {
            const graphUri = graphMatch[1];
            const quads = store.getQuads(null, null, null, graphUri);
            const egQuads = quads.filter(q => 
                q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                q.object.value === 'http://example.org/vad#ExecutorGroup'
            );
            
            egQuads.forEach(q => {
                results.push({ executorGroup: q.subject.value });
            });
        }
    }
    
    // Query for VADProcessDia graphs
    if (query.includes('rdf:type vad:VADProcessDia')) {
        // Find all VADProcessDia graphs (they are self-typed)
        const quads = store.getQuads(
            null,
            N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            N3.DataFactory.namedNode('http://example.org/vad#VADProcessDia'),
            null
        );
        
        quads.forEach(q => {
            // Check if this is a self-typing quad (subject = graph)
            const graphQuads = store.getQuads(q.subject, null, null, q.subject);
            if (graphQuads.length > 0) {
                results.push({
                    trig: q.subject.value,
                    definesProcess: null,
                    label: null
                });
            }
        });
        
        console.log(`   Found ${results.length} VADProcessDia graphs`);
        results.forEach(r => {
            console.log(`     ${global.getPrefixedName(r.trig, global.currentPrefixes)}`);
        });
    }
    
    // Query for process metadata from ptree
    if (query.includes('GRAPH vad:ptree') && query.includes('rdf:type vad:TypeProcess')) {
        const ptreeQuads = store.getQuads(null, null, null, 'http://example.org/vad#ptree');
        const processQuads = ptreeQuads.filter(q => 
            q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
            q.object.value === 'http://example.org/vad#TypeProcess'
        );
        
        processQuads.forEach(q => {
            results.push({
                process: q.subject.value,
                hasParentObj: null,
                hasTrig: null,
                label: null
            });
        });
    }
    
    // Query for process individuals in trig - look for the specific pattern from getProcessIndividualsInTrig
    if (query.includes('SELECT DISTINCT ?process WHERE') && query.includes('vad:isSubprocessTrig')) {
        const trigMatch = query.match(/GRAPH <([^>]+)>/);
        if (trigMatch) {
            const trigUri = trigMatch[1];
            console.log(`   Looking for process individuals in ${global.getPrefixedName(trigUri, global.currentPrefixes)}`);
            
            const quads = store.getQuads(null, null, null, trigUri);
            const subprocessQuads = quads.filter(q => 
                q.predicate.value === 'http://example.org/vad#isSubprocessTrig' &&
                q.object.value === trigUri
            );
            
            console.log(`   Found ${subprocessQuads.length} process individuals`);
            subprocessQuads.forEach(q => {
                results.push({ process: q.subject.value });
                console.log(`     ${global.getPrefixedName(q.subject.value, global.currentPrefixes)}`);
            });
        }
    }
    
    return results;
};

global.funSPARQLask = async function(query) {
    // Simple mock - return false for now
    return false;
};

global.getPrefixedName = function(uri, prefixes) {
    for (const [prefix, ns] of Object.entries(prefixes)) {
        if (uri.startsWith(ns)) {
            return prefix + ':' + uri.substring(ns.length);
        }
    }
    return uri;
};

// Load test data
const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
const trigData = fs.readFileSync(testDataPath, 'utf8');

async function runTest() {
    try {
        console.log('=== ExecutorGroup Virtual TriG Test ===');
        console.log('1. Loading test data...');
        
        // Parse TriG data
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
                    Object.assign(global.currentPrefixes, prefixes);
                    resolve();
                }
            });
        });

        console.log('2. Finding ExecutorGroups...');
        
        // Find all ExecutorGroups
        const egQuads = global.currentStore.getQuads(
            null,
            N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
            null
        );
        
        console.log(`   Found ${egQuads.length} ExecutorGroups`);
        
        // Load Virtual TriG logic
        console.log('3. Loading Virtual TriG logic...');
        const virtualTrigLogic = fs.readFileSync(
            path.join(__dirname, '../10_virtualTriG/10_virtualTriG_logic.js'), 'utf8'
        );
        eval(virtualTrigLogic);
        
        // Test ExecutorGroup label computation
        console.log('4. Testing ExecutorGroup label computation...');
        
        for (const egQuad of egQuads) {
            const egUri = egQuad.subject.value;
            const label = await global.computeExecutorGroupLabel(egUri);
            console.log(`   ${global.getPrefixedName(egUri, global.currentPrefixes)} -> "${label}"`);
        }
        
        // Test Virtual TriG computation
        console.log('5. Computing Virtual TriG...');
        const stats = await global.recalculateAllVirtualTriGs(global.currentPrefixes);
        console.log('   Stats:', stats);
        
        // Check Virtual TriG content
        console.log('6. Checking Virtual TriG content...');
        const virtualContent = global.formatVirtualTriGFromStore(global.currentPrefixes);
        console.log('Virtual TriG Content:');
        console.log(virtualContent);
        
        // Look for ExecutorGroup rdfs:label in Virtual TriG
        console.log('7. Looking for ExecutorGroup rdfs:label in Virtual TriG...');
        const labelQuads = global.currentStore.getQuads(
            null,
            N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
            null,
            null
        );
        
        const egLabelQuads = labelQuads.filter(q => {
            // Check if subject is an ExecutorGroup
            const typeQuads = global.currentStore.getQuads(
                q.subject,
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
                null
            );
            return typeQuads.length > 0;
        });
        
        console.log(`   Found ${egLabelQuads.length} ExecutorGroup rdfs:label quads in Virtual TriG:`);
        egLabelQuads.forEach(q => {
            const subject = global.getPrefixedName(q.subject.value, global.currentPrefixes);
            const graph = q.graph ? global.getPrefixedName(q.graph.value, global.currentPrefixes) : 'default';
            console.log(`     ${subject} rdfs:label "${q.object.value}" (in ${graph})`);
        });
        
        if (egLabelQuads.length > 0) {
            console.log('✅ SUCCESS: ExecutorGroup rdfs:label found in Virtual TriG!');
        } else {
            console.log('❌ ISSUE: No ExecutorGroup rdfs:label found in Virtual TriG');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

runTest();