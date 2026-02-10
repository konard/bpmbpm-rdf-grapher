// Simple fix for ExecutorGroup Virtual TriG issue #351
// This script directly modifies the Virtual TriG logic to use fallback SPARQL engine

const fs = require('fs');
const path = require('path');

console.log('=== Simple Fix for ExecutorGroup Virtual TriG ===');

// Read the Virtual TriG logic file
const virtualTrigPath = path.join(__dirname, '../10_virtualTriG/10_virtualTriG_logic.js');
let virtualTrigCode = fs.readFileSync(virtualTrigPath, 'utf8');

console.log('1. Current Virtual TriG file has', virtualTrigCode.length, 'characters');

// Simple approach: Just replace the function call with fallback
// Instead of funSPARQLvaluesComunica(query, currentPrefixes), use:
// await funSPARQLvalues(query).then(results => results.map(row => row.executorGroup))

const oldPattern = /const results = await funSPARQLvaluesComunica\(query, currentPrefixes\);\s*return results\.map\(row => row\.(\w+)\);/g;
const newPattern = `const results = await funSPARQLvalues(query);
    return results.map(row => row.$1);`;

// Apply replacement for getExecutorGroupsInTrig function
virtualTrigCode = virtualTrigCode.replace(
    'const results = await funSPARQLvaluesComunica(query, currentPrefixes);' + '\n' +
    '        return results.map(row => row.executorGroup);',
    'const results = await funSPARQLvalues(query);' + '\n' +
    '        return results.map(row => row.executorGroup);'
);

// Apply replacement for getExecutorsInGroup function  
virtualTrigCode = virtualTrigCode.replace(
    'const results = await funSPARQLvaluesComunica(query, currentPrefixes);' + '\n' +
    '        return results.map(row => row.executor);',
    'const results = await funSPARQLvalues(query);' + '\n' +
    '        return results.map(row => row.executor);'
);

// Apply replacement for computeExecutorGroupLabel function - this one is more complex
virtualTrigCode = virtualTrigCode.replace(
    'const results = await funSPARQLvaluesComunica(executorsQuery, currentPrefixes);',
    'const results = await funSPARQLvalues(executorsQuery);'
);

console.log('2. Applied', (virtualTrigCode.match(/funSPARQLvaluesComunica/g) || []).length, 'replacements');

// Count remaining calls to Comunica
const remainingCalls = (virtualTrigCode.match(/funSPARQLvaluesComunica/g) || []).length;
console.log('3. Remaining Comunica calls:', remainingCalls);

// Write the updated file
fs.writeFileSync(virtualTrigPath, virtualTrigCode);

console.log('4. Updated Virtual TriG logic file');

if (remainingCalls === 0) {
    console.log('✅ Fix applied successfully!');
    console.log('\nSummary:');
    console.log('- Replaced funSPARQLvaluesComunica calls with funSPARQLvalues');
    console.log('- Now Virtual TriG should work using fallback SPARQL engine');
    console.log('- ExecutorGroup labels should appear in quadstore Virtual TriG filter');
} else {
    console.log('⚠️  Some Comunica calls may remain - manual fix needed');
}

console.log('\nNext: Test the fix with the main application');