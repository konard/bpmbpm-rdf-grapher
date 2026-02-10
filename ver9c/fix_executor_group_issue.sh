#!/bin/bash

# Simple fix for ExecutorGroup Virtual TriG issue #351
# This script ensures the Comunica SPARQL engine is properly installed

echo "=== Fixing ExecutorGroup Virtual TriG Issue #351 ==="

echo "1. Current working directory: $(pwd)"

# Navigate to ver9c directory
cd "$(dirname "$0")/ver9c"

echo "2. Installing Comunica SPARQL engine..."

# Install the required Comunica package
npm install @comunica/query-sparql-rdfjs --save

echo "3. Verifying installation..."

# Check if package was added
if grep -q "@comunica/query-sparql-rdfjs" package.json; then
    echo "   ✅ @comunica/query-sparql-rdfjs added to package.json"
else
    echo "   ❌ Failed to add @comunica/query-sparql-rdfjs to package.json"
    exit 1
fi

echo "4. Testing Virtual TriG functionality..."

# Test the Virtual TriG logic
node -e "
const fs = require('fs');
const N3 = require('n3');

// Load test data
const testData = fs.readFileSync('dia/Trig_VADv8.ttl', 'utf8');

// Parse like refreshVisualization does
const parser = new N3.Parser({ format: 'trig' });
const quads = [];
let prefixes = {};

await new Promise((resolve, reject) => {
    parser.parse(testData, (error, quad, parsedPrefixes) => {
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

console.log('   Parsed', quads.length, 'quads');

// Initialize store
const currentStore = new N3.Store();
quads.forEach(quad => currentStore.addQuad(quad));

// Load modules
const vadlibSparql = fs.readFileSync('9_vadlib/vadlib_sparql.js', 'utf8');
const virtualTrigLogic = fs.readFileSync('10_virtualTriG/10_virtualTriG_logic.js', 'utf8');

// Execute in context
const context = { 
    currentStore, 
    currentPrefixes: prefixes,
    require: require,
    console: console,
    N3: N3
};

eval(vadlibSparql);
eval(virtualTrigLogic);

// Test Virtual TriG recalculation
(async () => {
    try {
        console.log('   Testing Virtual TriG recalculation...');
        
        if (typeof recalculateAllVirtualTriGs === 'function') {
            const stats = await recalculateAllVirtualTriGs(prefixes);
            console.log('   Virtual TriG Stats:', stats);
            
            // Check for ExecutorGroup labels
            const labelQuads = currentStore.getQuads(
                null,
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                null,
                null
            );
            
            const egLabelQuads = labelQuads.filter(q => {
                const typeQuads = currentStore.getQuads(
                    q.subject,
                    N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                    N3.DataFactory.namedNode('http://example.org/vad#ExecutorGroup'),
                    null
                );
                return typeQuads.length > 0;
            });
            
            console.log('   Found', egLabelQuads.length, 'ExecutorGroup rdfs:label quads in Virtual TriG');
            
            if (egLabelQuads.length > 0) {
                console.log('   ✅ SUCCESS: ExecutorGroup Virtual TriG is working!');
                console.log('');
                console.log('   Sample computed labels:');
                egLabelQuads.slice(0, 3).forEach(q => {
                    const subject = prefixes.vad + q.subject.value.split('#vad:')[1];
                    const graph = q.graph ? prefixes.vad + q.graph.value.split('#vad:')[1] : 'default';
                    console.log('    ', subject, 'rdfs:label', '\"' + q.object.value + '\"', '(in ' + graph + ')');
                });
            } else {
                console.log('   ❌ ISSUE: No ExecutorGroup labels found in Virtual TriG');
            }
            
            if (egLabelQuads.length > 0) {
                console.log('');
                console.log('✅ Issue #351 RESOLVED - ExecutorGroup labels now appear in Virtual TriG!');
                console.log('');
                console.log('The user should now be able to:');
                console.log('1. Load Trig_VADv8.ttl example');
                console.log('2. Select "Virtual TriG" from quadstore filter');
                console.log('3. Click "Virtual TriG" button to see computed labels');
            } else {
                console.log('❌ Issue #351 NOT RESOLVED - Still no ExecutorGroup labels');
            }
        } else {
            console.log('   ❌ recalculateAllVirtualTriGs function not available');
        }
    } catch (error) {
        console.error('   Test failed:', error.message);
        process.exit(1);
    }
})();
"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Summary of changes:"
echo "1. Added @comunica/query-sparql-rdfjs dependency to package.json"
echo "2. Virtual TriG logic can now use proper SPARQL engine"
echo "3. ExecutorGroup rdfs:label computation should work"
echo ""
echo "To test the fix:"
echo "1. Open ver9c/index.html in browser"
echo "2. Load Trig_VADv8.ttl from examples"
echo "3. Select 'Virtual TriG' from quadstore filter dropdown"
echo "4. Verify ExecutorGroup labels appear in the result"
echo ""
echo "If labels still don't appear, check browser console for SPARQL errors."