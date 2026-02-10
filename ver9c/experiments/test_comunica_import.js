// Test to understand how to properly import Comunica
const path = require('path');

console.log('=== Testing Comunica Import ===');

try {
    // Try the new package structure
    const { QueryEngine } = require('@comunica/query-sparql-rdfjs');
    console.log('✅ Found @comunica/query-sparql-rdfjs package');
    console.log('QueryEngine:', typeof QueryEngine);
    
    // Test creating engine
    const engine = new QueryEngine();
    console.log('✅ Created QueryEngine successfully');
    
} catch (error1) {
    console.log('❌ Failed to load @comunica/query-sparql-rdfjs:', error1.message);
    
    try {
        // Try the old package structure
        const Comunica = require('comunica');
        console.log('✅ Found legacy comunica package');
        console.log('Comunica object:', typeof Comunica);
        console.log('QueryEngine:', typeof Comunica.QueryEngine);
        
    } catch (error2) {
        console.log('❌ Failed to load legacy comunica:', error2.message);
        
        try {
            // Try alternative package structures
            const Comunica2 = require('@comunica/engine-query-sparql');
            console.log('✅ Found @comunica/engine-query-sparql package');
            
        } catch (error3) {
            console.log('❌ All Comunica imports failed');
        }
    }
}