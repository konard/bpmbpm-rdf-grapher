// Debug script to check VADProcessDia detection
const fs = require('fs');
const path = require('path');
const N3 = require('n3');

const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
const trigData = fs.readFileSync(testDataPath, 'utf8');

async function debugVADProcessDia() {
    const store = new N3.Store();
    const parser = new N3.Parser({ format: 'trig' });
    
    await new Promise((resolve, reject) => {
        parser.parse(trigData, (error, quad, prefixes) => {
            if (error) {
                reject(error);
                return;
            }
            if (quad) {
                store.addQuad(quad);
            } else {
                resolve();
            }
        });
    });

    console.log('=== Debug VADProcessDia Detection ===');
    console.log('Total quads:', store.getQuads().length);
    
    // Find all VADProcessDia type quads
    const vadTypeQuads = store.getQuads(
        null,
        N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        N3.DataFactory.namedNode('http://example.org/vad#VADProcessDia'),
        null
    );
    
    console.log('VADProcessDia type quads:', vadTypeQuads.length);
    vadTypeQuads.forEach(q => {
        console.log(`  ${q.subject.value} rdf:type vad:VADProcessDia (graph: ${q.graph?.value || 'default'})`);
    });
    
    // Check if these are self-typed (subject = graph)
    console.log('\nSelf-typed graphs:');
    vadTypeQuads.forEach(q => {
        const graphQuads = store.getQuads(q.subject, null, null, q.subject);
        console.log(`  ${q.subject.value}: ${graphQuads.length} quads in its own graph`);
        if (graphQuads.length > 0) {
            console.log(`    -> This is a VADProcessDia graph!`);
        }
    });
    
    // List all graphs that have self-typing
    console.log('\nAll self-typed graphs:');
    const allGraphs = new Set();
    store.getQuads().forEach(q => {
        if (q.graph && q.graph.value) {
            allGraphs.add(q.graph.value);
        }
    });
    
    allGraphs.forEach(graphUri => {
        const graphQuads = store.getQuads(null, null, null, graphUri);
        const selfTypeQuads = graphQuads.filter(q => 
            q.subject.value === graphUri &&
            q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        );
        
        if (selfTypeQuads.length > 0) {
            console.log(`  ${graphUri}: ${selfTypeQuads.length} self-type quads`);
            selfTypeQuads.forEach(q => {
                console.log(`    -> ${q.subject.value} rdf:type ${q.object.value}`);
            });
        }
    });
}

debugVADProcessDia();