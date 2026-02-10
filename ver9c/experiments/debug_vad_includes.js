// Debug test to check vad:includes relationships in Trig_VADv8.ttl
const fs = require('fs');
const path = require('path');
const N3 = require('n3');

async function debugVadIncludes() {
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

        console.log('\n=== Finding ExecutorGroups ===');
        
        const executorGroupQuads = quads.filter(q => 
            q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
            q.object.value === 'http://example.org/vad#ExecutorGroup'
        );

        console.log(`Found ${executorGroupQuads.length} ExecutorGroups:`);
        executorGroupQuads.forEach(q => {
            console.log(`  ${getPrefixedName(q.subject.value, prefixes)} (in ${getPrefixedName(q.graph.value, prefixes)})`);
        });

        console.log('\n=== Finding vad:includes relationships ===');
        
        const includesQuads = quads.filter(q => 
            q.predicate.value === 'http://example.org/vad#includes'
        );

        console.log(`Found ${includesQuads.length} vad:includes relationships:`);
        includesQuads.forEach(q => {
            const subject = getPrefixedName(q.subject.value, prefixes);
            const object = getPrefixedName(q.object.value, prefixes);
            const graph = getPrefixedName(q.graph.value, prefixes);
            console.log(`  ${subject} vad:includes ${object} (in ${graph})`);
        });

        console.log('\n=== Finding executor rdfs:labels ===');
        
        const executorLabelQuads = quads.filter(q => 
            q.predicate.value === 'http://www.w3.org/2000/01/rdf-schema#label' &&
            q.subject.value.includes('Executor')
        );

        console.log(`Found ${executorLabelQuads.length} executor rdfs:labels:`);
        executorLabelQuads.forEach(q => {
            const subject = getPrefixedName(q.subject.value, prefixes);
            const graph = getPrefixedName(q.graph.value, prefixes);
            console.log(`  ${subject} rdfs:label "${q.object.value}" (in ${graph})`);
        });

        console.log('\n=== Testing specific query manually ===');
        
        // Test the SPARQL query used by computeExecutorGroupLabel
        const testExecutorGroupUri = 'http://example.org/vad#ExecutorGroup_p1_1';
        
        console.log(`\nTesting query for ${getPrefixedName(testExecutorGroupUri, prefixes)}:`);
        
        const store = new N3.Store();
        quads.forEach(quad => store.addQuad(quad));
        
        // Initialize global variables for SPARQL functions
        global.currentStore = store;
        global.currentPrefixes = prefixes;
        global.Comunica = require('@comunica/query-sparql-rdfjs');
        global.comunicaEngine = null;

        // Load SPARQL module
        const vadlibSparqlPath = path.join(__dirname, '../9_vadlib/vadlib_sparql.js');
        const sparqlCode = fs.readFileSync(vadlibSparqlPath, 'utf8');
        eval(sparqlCode);

        const executorsQuery = `
            PREFIX vad: <http://example.org/vad#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            SELECT ?executor ?executorLabel WHERE {
                <${testExecutorGroupUri}> vad:includes ?executor .
                OPTIONAL {
                    ?executor rdfs:label ?executorLabel .
                }
            }
            ORDER BY ?executor
        `;

        console.log('Running query:', executorsQuery);
        
        const results = await funSPARQLvaluesComunica(executorsQuery, 'executor');
        console.log(`Query returned ${results.length} results:`);
        results.forEach(result => {
            console.log(`  executor: ${getPrefixedName(result.executor, prefixes)}, label: "${result.executorLabel || 'N/A'}"`);
        });

        console.log('\n=== DEBUG COMPLETED ===');

    } catch (error) {
        console.error('Debug failed:', error);
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

// Run debug test
debugVadIncludes();