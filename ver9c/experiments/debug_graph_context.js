// Test to understand which graph should be used for ExecutorGroup relationships
const fs = require('fs');
const path = require('path');
const N3 = require('n3');

async function testGraphContext() {
    try {
        console.log('=== Loading test data ===');
        
        const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
        const trigData = fs.readFileSync(testDataPath, 'utf8');
        
        console.log('Data file loaded:', testDataPath);

        console.log('\n=== Parsing data ===');
        
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

        const store = new N3.Store();
        quads.forEach(quad => store.addQuad(quad));
        
        // Initialize global variables
        global.currentStore = store;
        global.currentPrefixes = prefixes;
        global.Comunica = require('@comunica/query-sparql-rdfjs');
        global.comunicaEngine = null;

        // Load SPARQL module
        const vadlibSparqlPath = path.join(__dirname, '../9_vadlib/vadlib_sparql.js');
        const sparqlCode = fs.readFileSync(vadlibSparqlPath, 'utf8');
        eval(sparqlCode);

        console.log('\n=== Testing GRAPH-specific query ===');

        const testExecutorGroupUri = 'http://example.org/vad#ExecutorGroup_p1_1';

        // Test 1: Query without GRAPH (current approach)
        console.log('\n--- Test 1: Without GRAPH ---');
        const query1 = `
            PREFIX vad: <http://example.org/vad#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            SELECT ?executor ?executorLabel ?graph WHERE {
                <${testExecutorGroupUri}> vad:includes ?executor .
                OPTIONAL {
                    ?executor rdfs:label ?executorLabel .
                }
                ?graph { ?executorGroup rdf:type vad:ExecutorGroup }
            }
            ORDER BY ?executor
        `;

        console.log('Query 1:', query1);
        const results1 = await funSPARQLvaluesComunica(query1, 'executor');
        console.log(`Query 1 returned ${results1.length} results:`);
        results1.forEach(result => {
            console.log(`  executor: ${getPrefixedName(result.executor, prefixes)}, label: "${result.executorLabel || 'N/A'}", graph: ${getPrefixedName(result.graph, prefixes)}`);
        });

        // Test 2: Query with specific GRAPH
        console.log('\n--- Test 2: With specific GRAPH ---');
        const graphsToTest = ['vad:t_p1', 'vad:t_p2'];
        
        for (const graphUri of graphsToTest) {
            console.log(`\nTesting in graph: ${graphUri}`);
            
            const query2 = `
                PREFIX vad: <http://example.org/vad#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

                SELECT ?executor ?executorLabel WHERE {
                    GRAPH <http://example.org/vad#${graphUri.split('#')[1]}> {
                        <${testExecutorGroupUri}> vad:includes ?executor .
                    }
                    OPTIONAL {
                        ?executor rdfs:label ?executorLabel .
                    }
                }
                ORDER BY ?executor
            `;

            console.log(`Query for ${graphUri}:`, query2);
            const results2 = await funSPARQLvaluesComunica(query2, 'executor');
            console.log(`Query for ${graphUri} returned ${results2.length} results:`);
            results2.forEach(result => {
                console.log(`  executor: ${getPrefixedName(result.executor, prefixes)}, label: "${result.executorLabel || 'N/A'}"`);
            });
        }

        console.log('\n=== Testing actual function behavior ===');
        
        // Load Virtual TriG logic
        const virtualTrigPath = path.join(__dirname, '../10_virtualTriG/10_virtualTriG_logic.js');
        const virtualTrigCode = fs.readFileSync(virtualTrigPath, 'utf8');
        eval(virtualTrigCode);

        // Test getExecutorGroupsInTrig to see which graph it uses
        console.log('\n--- getExecutorGroupsInTrig results ---');
        const t_p1_results = await getExecutorGroupsInTrig('http://example.org/vad#t_p1');
        console.log('getExecutorGroupsInTrig("http://example.org/vad#t_p1"):', t_p1_results.map(uri => getPrefixedName(uri, prefixes)));

        const t_p2_results = await getExecutorGroupsInTrig('http://example.org/vad#t_p2');
        console.log('getExecutorGroupsInTrig("http://example.org/vad#t_p2"):', t_p2_results.map(uri => getPrefixedName(uri, prefixes)));

        console.log('\n=== TEST COMPLETED ===');

    } catch (error) {
        console.error('Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Simple getPrefixedName function
function getPrefixedName(uri, prefixes) {
    if (!uri) return '';
    
    for (const [prefix, ns] of Object.entries(prefixes)) {
        if (uri.startsWith(ns)) {
            return uri.replace(ns, prefix + ':');
        }
    }
    
    // Fallback to last part after # or /
    if (uri.includes('#')) {
        return uri.split('#').pop();
    } else if (uri.includes('/')) {
        return uri.split('/').pop();
    }
    return uri;
}

// Run test
testGraphContext();