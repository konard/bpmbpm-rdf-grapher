// Debug script to check process individuals in VADProcessDia graphs
const fs = require('fs');
const path = require('path');
const N3 = require('n3');

const testDataPath = path.join(__dirname, '../dia/Trig_VADv8.ttl');
const trigData = fs.readFileSync(testDataPath, 'utf8');

async function debugProcessIndividuals() {
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

    console.log('=== Debug Process Individuals in VADProcessDia ===');
    
    // Find VADProcessDia graphs
    const vadTypeQuads = store.getQuads(
        null,
        N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        N3.DataFactory.namedNode('http://example.org/vad#VADProcessDia'),
        null
    );
    
    const vadGraphs = vadTypeQuads.filter(q => {
        const graphQuads = store.getQuads(q.subject, null, null, q.subject);
        return graphQuads.length > 0;
    });
    
    console.log(`Found ${vadGraphs.length} VADProcessDia graphs:`);
    
    for (const vadQuad of vadGraphs) {
        const graphUri = vadQuad.subject.value;
        console.log(`\n${graphUri}:`);
        
        // Find all quads in this graph
        const graphQuads = store.getQuads(null, null, null, graphUri);
        console.log(`  Total quads: ${graphQuads.length}`);
        
        // Look for isSubprocessTrig relationships
        const subprocessQuads = graphQuads.filter(q => 
            q.predicate.value === 'http://example.org/vad#isSubprocessTrig' &&
            q.object.value === graphUri
        );
        
        console.log(`  Process individuals (isSubprocessTrig): ${subprocessQuads.length}`);
        subprocessQuads.forEach(q => {
            console.log(`    ${q.subject.value} vad:isSubprocessTrig ${graphUri}`);
        });
        
        // Look for ExecutorGroups
        const egQuads = graphQuads.filter(q => 
            q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
            q.object.value === 'http://example.org/vad#ExecutorGroup'
        );
        
        console.log(`  ExecutorGroups: ${egQuads.length}`);
        egQuads.forEach(q => {
            console.log(`    ${q.subject.value} rdf:type vad:ExecutorGroup`);
            
            // Find included executors
            const includesQuads = store.getQuads(
                q.subject,
                N3.DataFactory.namedNode('http://example.org/vad#includes'),
                null,
                null
            );
            
            console.log(`      includes: ${includesQuads.length} executors`);
            includesQuads.forEach(iq => {
                console.log(`        ${iq.object.value}`);
            });
        });
    }
}

debugProcessIndividuals();