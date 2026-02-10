// Debug test for Comunica import issue
const path = require('path');

console.log('=== Debug Comunica Import ===');

// 1. Test Comunica import directly
try {
    const { QueryEngine } = require('@comunica/query-sparql-rdfjs');
    console.log('✅ Direct import of QueryEngine successful');
    console.log('QueryEngine type:', typeof QueryEngine);
} catch (error) {
    console.log('❌ Direct import failed:', error.message);
}

// 2. Test Comunica as object
try {
    const Comunica = require('@comunica/query-sparql-rdfjs');
    console.log('✅ Import as Comunica object successful');
    console.log('Comunica type:', typeof Comunica);
    console.log('Comunica.QueryEngine type:', typeof Comunica.QueryEngine);
} catch (error) {
    console.log('❌ Comunica object import failed:', error.message);
}

// 3. Load vadlib and check if Comunica is available
console.log('\n=== Loading vadlib ===');
const vadlibPath = path.join(__dirname, '../9_vadlib/vadlib.js');
const vadlibCode = require('fs').readFileSync(vadlibPath, 'utf8');

// Create global scope first
global.console = console;
global.require = require;
global.process = process;

eval(vadlibCode);

console.log('After loading vadlib:');
console.log('typeof Comunica:', typeof Comunica);
console.log('typeof comunicaEngine:', typeof comunicaEngine);

// 4. Load vadlib_sparql in same scope
console.log('\n=== Loading vadlib_sparql ===');
const vadlibSparqlPath = path.join(__dirname, '../9_vadlib/vadlib_sparql.js');
const sparqlCode = require('fs').readFileSync(vadlibSparqlPath, 'utf8');

eval(sparqlCode);

console.log('After loading vadlib_sparql:');
console.log('typeof Comunica:', typeof Comunica);
console.log('typeof comunicaEngine:', typeof comunicaEngine);