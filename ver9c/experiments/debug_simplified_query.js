// Simplified test to understand ExecutorGroup relationships
const fs = require('fs');
const path = require('path');
const N3 = require('n3');

async function testSimplifiedQuery() {
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

        console.log('\n=== Testing simplified queries ===');

        const testExecutorGroupUri = 'http://example.org/vad#ExecutorGroup_p1_1';

        // Test: Simple query to find included executors
        console.log('\n--- Test: Simple vad:includes query ---');
        const simpleQuery = `
            PREFIX vad: <http://example.org/vad#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            SELECT ?executor WHERE {
                <${testExecutorGroupUri}> vad:includes ?executor .
            }
            ORDER BY ?executor
        `;

        console.log('Simple query:', simpleQuery);
        const simpleResults = await funSPARQLvaluesComunica(simpleQuery, 'executor');
        console.log(`Simple query returned ${simpleResults.length} results:`);
        simpleResults.forEach(result => {
            console.log(`  executor: ${getPrefixedName(result.executor, prefixes)}`);
        });

        // Test: Query with GRAPH for a specific graph
        console.log('\n--- Test: GRAPH-specific query for vad:t_p1 ---');
        const graphQuery = `
            PREFIX vad: <http://example.org/vad#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            SELECT ?executor WHERE {
                GRAPH <http://example.org/vad#t_p1> {
                    <${testExecutorGroupUri}> vad:includes ?executor .
                }
            }
            ORDER BY ?executor
        `;

        console.log('Graph query:', graphQuery);
        const graphResults = await funSPARQLvaluesComunica(graphQuery, 'executor');
        console.log(`Graph query returned ${graphResults.length} results:`);
        graphResults.forEach(result => {
            console.log(`  executor: ${getPrefixedName(result.executor, prefixes)}`);
        });

        // Test: Query with GRAPH for a specific graph and labels
        console.log('\n--- Test: GRAPH-specific query with labels for vad:t_p1 ---');
        const graphLabelQuery = `
            PREFIX vad: <http://example.org/vad#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            SELECT ?executor ?executorLabel WHERE {
                GRAPH <http://example.org/vad#t_p1> {
                    <${testExecutorGroupUri}> vad:includes ?executor .
                }
                OPTIONAL {
                    ?executor rdfs:label ?executorLabel .
                }
            }
            ORDER BY ?executor
        `;

        console.log('Graph+label query:', graphLabelQuery);
        const graphLabelResults = await funSPARQLvaluesComunica(graphLabelQuery, 'executor');
        console.log(`Graph+label query returned ${graphLabelResults.length} results:`);
        graphLabelResults.forEach(result => {
            console.log(`  executor: ${getPrefixedName(result.executor, prefixes)}, label: "${result.executorLabel || 'N/A'}"`);
        });

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
testSimplifiedQuery();