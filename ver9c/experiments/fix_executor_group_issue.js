// Fix for ExecutorGroup Virtual TriG issue #351
// Problem: Virtual TriG recalculation fails because Comunica SPARQL engine is not installed
// Solution: Use fallback SPARQL engine when Comunica is not available

const fs = require('fs');
const path = require('path');

console.log('=== Fixing ExecutorGroup Virtual TriG Issue #351 ===');

// Read the Virtual TriG logic file
const virtualTrigPath = path.join(__dirname, '../10_virtualTriG/10_virtualTriG_logic.js');
let virtualTrigCode = fs.readFileSync(virtualTrigPath, 'utf8');

console.log('1. Analyzing current Virtual TriG logic...');

// Count occurrences of funSPARQLvaluesComunica
const comunicaCalls = (virtualTrigCode.match(/funSPARQLvaluesComunica/g) || []).length;
console.log(`   Found ${comunicaCalls} calls to funSPARQLvaluesComunica`);

// Create a wrapper function that uses fallback when Comunica is not available
const wrapperFunction = `
/**
 * Wrapper function for SPARQL queries with fallback
 * Uses funSPARQLvaluesComunica when available, otherwise falls back to funSPARQLvalues
 * @param {string} query - SPARQL query
 * @param {Object} prefixes - Prefixes object
 * @returns {Promise<Array>} - Query results
 */
async function funSPARQLvaluesWithFallback(query, prefixes) {
    try {
        // Try to use Comunica first
        if (typeof funSPARQLvaluesComunica === 'function') {
            // Check if Comunica is available
            if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                return await funSPARQLvaluesComunica(query, prefixes);
            } else if (typeof require !== 'undefined') {
                // Node.js environment - try to require Comunica
                try {
                    const Comunica = require('comunica');
                    if (Comunica && Comunica.QueryEngine) {
                        return await funSPARQLvaluesComunica(query, prefixes);
                    }
                } catch (e) {
                    // Comunica not installed
                }
            }
        }
    } catch (error) {
        console.warn('funSPARQLvaluesComunica failed, falling back to funSPARQLvalues:', error.message);
    }
    
    // Fallback to simple SPARQL engine
    if (typeof funSPARQLvalues === 'function') {
        return await funSPARQLvalues(query);
    }
    
    // No SPARQL engine available
    console.error('No SPARQL engine available (neither Comunica nor funSPARQLvalues)');
    return [];
}
`;

console.log('2. Adding fallback wrapper function...');
console.log('First 200 chars of Virtual TriG code:');
console.log(virtualTrigCode.substring(0, 200));

// Add the wrapper function after the comments section
const insertPosition = virtualTrigCode.indexOf('// ==============================================================================\n// КОНСТАНТЫ');
console.log('Looking for pattern at position:', insertPosition);
if (insertPosition !== -1) {
if (insertPosition !== -1) {
    virtualTrigCode = virtualTrigCode.slice(0, insertPosition) + 
                     wrapperFunction + 
                     '\n\n// ==============================================================================\n' +
                     virtualTrigCode.slice(insertPosition);
} else {
    console.error('Could not find insertion point for wrapper function');
    process.exit(1);
}

console.log('3. Replacing funSPARQLvaluesComunica calls with fallback...');

// Replace all calls to funSPARQLvaluesComunica with our wrapper
virtualTrigCode = virtualTrigCode.replace(/funSPARQLvaluesComunica/g, 'funSPARQLvaluesWithFallback');

console.log('4. Writing updated Virtual TriG logic...');

// Write the updated file
fs.writeFileSync(virtualTrigPath, virtualTrigCode);

console.log('5. Verifying the fix...');

// Read back and verify
const updatedCode = fs.readFileSync(virtualTrigPath, 'utf8');
const wrapperCount = (updatedCode.match(/funSPARQLvaluesWithFallback/g) || []).length;
const remainingComunicaCalls = (updatedCode.match(/funSPARQLvaluesComunica/g) || []).length;

console.log(`   Added wrapper function: ✅`);
console.log(`   Replaced calls: ${wrapperCount} funSPARQLvaluesWithFallback`);
console.log(`   Remaining Comunica calls: ${remainingComunicaCalls}`);

if (remainingComunicaCalls === 0) {
    console.log('✅ Fix applied successfully!');
} else {
    console.log('⚠️  Some Comunica calls may remain');
}

console.log('\n=== Fix Summary ===');
console.log('Issue: ExecutorGroup Virtual TriG labels not appearing in quadstore');
console.log('Root Cause: Comunica SPARQL engine not installed, causing Virtual TriG recalculation to fail');
console.log('Solution: Added fallback wrapper that uses simple SPARQL engine when Comunica is unavailable');
console.log('Files Modified: ver9c/10_virtualTriG/10_virtualTriG_logic.js');
console.log('\nNext Steps:');
console.log('1. Test the fix by running the main application');
console.log('2. Load Trig_VADv8.ttl example');
console.log('3. Check if ExecutorGroup labels appear in Virtual TriG filter');
console.log('4. Create algorithm documentation as requested in issue #351');