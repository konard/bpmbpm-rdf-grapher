// Test various regex patterns for cleaning up after deletion

// Test cases:
const testCases = [
    { input: '}', shouldMatch: false, description: 'Line with only }' },
    { input: '    }', shouldMatch: false, description: 'Line with only } and whitespace' },
    { input: '  .  ', shouldMatch: true, description: 'Line with only .' },
    { input: '  ;  ', shouldMatch: true, description: 'Line with only ;' },
    { input: '  . ;  ', shouldMatch: true, description: 'Line with . and ;' },
    { input: '    . ; }', shouldMatch: false, description: 'Line with ., ; and }' },
    { input: '  }  }', shouldMatch: false, description: 'Line with multiple }' },
    { input: '', shouldMatch: false, description: 'Empty line' },
    { input: '   ', shouldMatch: false, description: 'Line with only spaces' },
];

// Different regex patterns to test
const patterns = [
    { name: 'Original (buggy)', regex: /^\s*[.;}\s]+\s*$/gm },
    { name: 'Fix v1: remove } only', regex: /^\s*[.;]+\s*$/gm },
    { name: 'Fix v2: . or ; with optional whitespace', regex: /^\s*[.;\s]*[.;]+[.;\s]*$/gm },
    { name: 'Fix v3: negative lookahead', regex: /^(?![^}]*$)\s*[.;\s]+\s*$/gm },
    { name: 'Fix v4: lines with . or ; but not }', regex: /^\s*(?:[.;\s]*[.;]+[.;\s]*)\s*$/gm },
    { name: 'Fix v5: simple - has . or ; no other chars', regex: /^[\s.;]+$/gm },
    { name: 'Fix v6: require at least one . or ; no }', regex: /^[.\s;]*(?:[.;])[.\s;]*$/gm },
];

console.log('Testing regex patterns:\n');

for (const pattern of patterns) {
    console.log(`=== ${pattern.name} ===`);
    console.log(`Regex: ${pattern.regex}`);

    let allPass = true;
    for (const test of testCases) {
        const matches = pattern.regex.test(test.input);
        pattern.regex.lastIndex = 0; // Reset regex state
        const pass = matches === test.shouldMatch;
        if (!pass) {
            console.log(`  FAIL: "${test.input}" (${test.description}) - expected ${test.shouldMatch}, got ${matches}`);
            allPass = false;
        }
    }

    if (allPass) {
        console.log('  All tests PASSED!');
    }
    console.log('');
}

// Now test the full function with the real-world scenario
console.log('=== Real-world test ===');

function fixTrailingSemicolonsFixed(rdfText) {
    let result = rdfText.replace(/;\s*\n(\s*\n\s*)(vad:|<)/g, ' .\n$1$2');
    result = result.replace(/;\s*\n(\s*)\}/g, ' .\n$1}');
    result = result.replace(/;\s*\n\s*\n/g, ' .\n\n');

    // FIXED: Only remove lines consisting entirely of . ; and whitespace, NOT lines with }
    // This pattern matches lines that:
    // - start with optional whitespace
    // - contain only . ; and whitespace characters
    // - but must NOT contain }
    // Note: ^\s*[.;]+\s*$ doesn't work because [.;]+ requires at least one non-whitespace
    // We need: any whitespace, at least one . or ;, any whitespace/. /;, no other chars
    result = result.replace(/^[\s.;]*[.;][\s.;]*$/gm, '');

    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/\n\s*\n(\s*\})/g, '\n$1');
    return result;
}

const input = `        vad:hasParentObj vad:ptree .

}

# ============================================================================
# Дерево Исполнителей (rtree)
# ============================================================================

vad:rtree {`;

const result = fixTrailingSemicolonsFixed(input);
console.log('Input:');
console.log(input);
console.log('\nOutput:');
console.log(result);
console.log('\nHas closing brace:', result.includes('}'));
