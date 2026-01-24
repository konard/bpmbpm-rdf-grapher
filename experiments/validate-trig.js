#!/usr/bin/env node
/**
 * Simple TriG syntax validator using N3.js
 */

const fs = require('fs');
const path = require('path');

// Try to use N3.js if available
let N3;
try {
    N3 = require('n3');
} catch (e) {
    console.log('N3.js not installed. Installing...');
    require('child_process').execSync('npm install n3', { stdio: 'inherit' });
    N3 = require('n3');
}

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node validate-trig.js <file.ttl>');
    process.exit(1);
}

const fullPath = path.resolve(filePath);
if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
}

console.log(`Validating: ${fullPath}`);

const trigContent = fs.readFileSync(fullPath, 'utf-8');
const parser = new N3.Parser({ format: 'TriG' });
const quads = [];
let parseError = null;

parser.parse(trigContent, (error, quad, prefixes) => {
    if (error) {
        parseError = error;
        return;
    }

    if (quad) {
        quads.push(quad);
    } else {
        // Parsing completed successfully
        if (!parseError) {
            console.log('✓ Syntax validation passed!');
            console.log(`  Total quads parsed: ${quads.length}`);

            // Count graphs
            const graphs = new Set();
            quads.forEach(q => {
                if (q.graph && q.graph.value) {
                    graphs.add(q.graph.value);
                }
            });
            console.log(`  Named graphs: ${graphs.size}`);

            if (graphs.size > 0) {
                console.log('  Graph names:');
                [...graphs].sort().forEach(g => {
                    const quadCount = quads.filter(q => q.graph && q.graph.value === g).length;
                    console.log(`    - ${g} (${quadCount} quads)`);
                });
            }

            process.exit(0);
        }
    }
});

// Handle parse error
process.on('exit', (code) => {
    if (parseError) {
        console.error('✗ Syntax validation failed!');
        console.error(`  Error: ${parseError.message}`);
        process.exit(1);
    }
});
