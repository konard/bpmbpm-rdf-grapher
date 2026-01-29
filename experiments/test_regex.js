// Escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ORIGINAL buggy version
function fixTrailingSemicolonsOriginal(rdfText) {
    let result = rdfText.replace(/;\s*\n(\s*\n\s*)(vad:|<)/g, ' .\n$1$2');
    result = result.replace(/;\s*\n(\s*)\}/g, ' .\n$1}');
    result = result.replace(/;\s*\n\s*\n/g, ' .\n\n');
    // BUGGY LINE - removes } along with . and ;
    result = result.replace(/^\s*[.;}\s]+\s*$/gm, '');
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/\n\s*\n(\s*\})/g, '\n$1');
    return result;
}

// FIXED version
function fixTrailingSemicolonsFixed(rdfText) {
    let result = rdfText.replace(/;\s*\n(\s*\n\s*)(vad:|<)/g, ' .\n$1$2');
    result = result.replace(/;\s*\n(\s*)\}/g, ' .\n$1}');
    result = result.replace(/;\s*\n\s*\n/g, ' .\n\n');
    // FIXED: Only remove lines with . and ; NOT }
    result = result.replace(/^\s*[.;]+\s*$/gm, '');
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/\n\s*\n(\s*\})/g, '\n$1');
    return result;
}

// Test case from issue
const input = `        vad:hasParentObj vad:ptree .

}

# ============================================================================
# Дерево Исполнителей (rtree) - общий граф с метаданными всех исполнителей
# ============================================================================

vad:rtree {`;

console.log('=== ORIGINAL (BUGGY) ===');
const origResult = fixTrailingSemicolonsOriginal(input);
console.log(origResult);
console.log('');
console.log('Has closing brace before rtree section:', origResult.includes('}\n\n#') || origResult.includes('}\n#'));

console.log('');
console.log('=== FIXED ===');
const fixedResult = fixTrailingSemicolonsFixed(input);
console.log(fixedResult);
console.log('');
console.log('Has closing brace before rtree section:', fixedResult.includes('}\n\n#') || fixedResult.includes('}\n#'));

// Also test with line that only contains }
console.log('\n=== Test 2: Line with only } ===');
const input2 = `}`;
console.log('Original matches /^\\s*[.;}\\s]+\\s*$/:', /^\s*[.;}\s]+\s*$/.test(input2));
console.log('Fixed matches /^\\s*[.;]+\\s*$/:', /^\s*[.;]+\s*$/.test(input2));

// Test with line that has dots and semicolons
console.log('\n=== Test 3: Line with only . and ; ===');
const input3 = `    . ; `;
console.log('Original matches:', /^\s*[.;}\s]+\s*$/.test(input3));
console.log('Fixed matches:', /^\s*[.;]+\s*$/.test(input3));
