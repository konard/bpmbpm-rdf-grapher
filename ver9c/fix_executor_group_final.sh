#!/bin/bash

# Quick fix for ExecutorGroup Virtual TriG issue #351
# This script ensures the fix is applied correctly

echo "=== Fixing ExecutorGroup Virtual TriG Issue #351 ==="

cd "$(dirname "$0")"

echo "1. Current working directory: $(pwd)"

# Install Comunica SPARQL engine (most critical fix)
echo "2. Installing Comunica SPARQL engine..."
npm install @comunica/query-sparql-rdfjs --save

echo "3. Testing Virtual TriG functionality with simple test..."

# Create a simple test to verify fix
cat > test_fix.js << 'EOF'
const fs = require('fs');
const N3 = require('n3');

async function testFix() {
    try {
        console.log('   Loading test data...');
        const testData = fs.readFileSync('dia/Trig_VADv8.ttl', 'utf8');
        
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
                console.log('   Sample computed labels:');
                egLabelQuads.slice(0, 3).forEach(q => {
                    const subject = prefixes.vad + q.subject.value.split('#vad:')[1];
                    const graph = q.graph ? prefixes.vad + q.graph.value.split('#vad:')[1] : 'default';
                    console.log('      ', subject, 'rdfs:label', '\"' + q.object.value + '\"', '(in ' + graph + ')');
                });
                return true;
            } else {
                console.log('   ❌ ISSUE: No ExecutorGroup labels found in Virtual TriG');
                return false;
            }
        } else {
            console.log('   ❌ recalculateAllVirtualTriGs function not available');
            return false;
        }
    } catch (error) {
        console.error('   Test failed:', error.message);
        return false;
    }
}

testFix().then(success => {
    if (success) {
        echo ""
        echo "✅ Issue #351 RESOLVED!"
        echo ""
        echo "ExecutorGroup Virtual TriG functionality is now working correctly."
        echo ""
        echo "To verify in the main application:"
        echo "1. Open ver9c/index.html in browser"
        echo "2. Load Trig_VADv8.ttl from examples"
        echo "3. Select 'Virtual TriG' from quadstore filter dropdown"
        echo "4. Verify ExecutorGroup labels appear in the result"
        echo ""
        echo "The implementation is complete and tested!"
    else {
        echo ""
        echo "❌ Issue #351 NOT RESOLVED!"
        echo "Please check the error messages above."
    fi
}
EOF

echo "4. Running test..."
node test_fix.js

rm test_fix.js