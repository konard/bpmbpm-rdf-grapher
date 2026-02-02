/**
 * Test for issue #254: DELETE WHERE with Turtle shorthand notation
 * Tests that the deletion logic correctly removes all continuation lines
 * when deleting a subject that uses ; shorthand notation.
 */

// Simulate the graph content (inside vad:ptree { ... })
const graphContent = `
    vad:ptree rdf:type vad:ObjectTree ;
        rdfs:label "Дерево Процессов (TriG)" ;
        vad:hasParentObj vad:root .

    vad:p1 rdf:type vad:TypeProcess ;
        rdfs:label "p1 Процесс 1" ;
        dcterms:description "p1 Процесс 1" ;
        vad:hasParentObj vad:ptree ;
        vad:hasTrig vad:t_p1 .

    # Issue #219: Концепт для тестирования удаления
    vad:pDel rdf:type vad:TypeProcess ;
        rdfs:label "Процесс pDel на удаление" ;
        dcterms:description "Какой-то процесс" ;
        vad:hasParentObj vad:ptree .

`;

// The subject to delete
const subjectName = 'vad:pDel';

// --- NEW LOGIC (issue #254) ---
function deleteSubjectNew(graphContent, subjectName) {
    const escapedSubject = subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const subjectRegex = new RegExp(`^\\s*${escapedSubject}\\s`);
    const lines = graphContent.split('\n');
    const newLines = [];
    let skipContinuation = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (subjectRegex.test(line)) {
            skipContinuation = trimmedLine.endsWith(';');
            // Remove preceding comment
            if (newLines.length > 0) {
                const prevLine = newLines[newLines.length - 1].trim();
                if (prevLine.startsWith('#') && prevLine.length > 0) {
                    newLines.pop();
                }
            }
            continue;
        }

        if (skipContinuation) {
            if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                continue;
            }
            if (/^\s+\S/.test(line) && !subjectRegex.test(line)) {
                if (trimmedLine.endsWith('.')) {
                    skipContinuation = false;
                }
                continue;
            } else {
                skipContinuation = false;
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    }

    return newLines.join('\n');
}

// --- OLD LOGIC (pre-fix) ---
function deleteSubjectOld(graphContent, subjectName) {
    const escapedSubject = subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineRegex = new RegExp(`\\n?\\s*${escapedSubject}\\s+[^\\n]+`, 'g');
    return graphContent.replace(lineRegex, '');
}

console.log('=== Testing DELETE WHERE with Turtle shorthand ===');
console.log('');

console.log('--- OLD LOGIC (buggy) ---');
const oldResult = deleteSubjectOld(graphContent, subjectName);
console.log(oldResult);
console.log('');

// Check if old logic leaves orphaned lines
const hasOrphanedLabel = oldResult.includes('rdfs:label "Процесс pDel на удаление"');
console.log(`Old logic leaves orphaned lines: ${hasOrphanedLabel ? 'YES (BUG!)' : 'NO'}`);
console.log('');

console.log('--- NEW LOGIC (fixed) ---');
const newResult = deleteSubjectNew(graphContent, subjectName);
console.log(newResult);
console.log('');

// Verify new logic
const hasOrphanedLabelNew = newResult.includes('rdfs:label "Процесс pDel на удаление"');
const hasOrphanedDesc = newResult.includes('dcterms:description "Какой-то процесс"');
const hasOrphanedParent = newResult.includes('vad:hasParentObj vad:ptree .');
const hasPDelSubject = newResult.includes('vad:pDel');
const hasP1 = newResult.includes('vad:p1 rdf:type');
const hasPtree = newResult.includes('vad:ptree rdf:type');
const hasComment = newResult.includes('Issue #219');

console.log('Verification:');
console.log(`  pDel subject removed: ${!hasPDelSubject ? 'PASS' : 'FAIL'}`);
console.log(`  pDel label removed: ${!hasOrphanedLabelNew ? 'PASS' : 'FAIL'}`);
console.log(`  pDel description removed: ${!hasOrphanedDesc ? 'PASS' : 'FAIL'}`);
console.log(`  pDel parent removed: ${!hasOrphanedParent ? 'PASS' : 'FAIL - still has "vad:hasParentObj vad:ptree ."'}`);
console.log(`  Related comment removed: ${!hasComment ? 'PASS' : 'FAIL'}`);
console.log(`  p1 preserved: ${hasP1 ? 'PASS' : 'FAIL'}`);
console.log(`  ptree preserved: ${hasPtree ? 'PASS' : 'FAIL'}`);

// Overall
const allPass = !hasPDelSubject && !hasOrphanedLabelNew && !hasOrphanedDesc && hasP1 && hasPtree && !hasComment;
console.log('');
console.log(`Overall: ${allPass ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);

// Edge case: vad:hasParentObj vad:ptree appears in both ptree definition and pDel
// We need to verify that the ptree's own "vad:hasParentObj vad:root" is preserved
const hasPtreeParent = newResult.includes('vad:hasParentObj vad:root');
console.log(`  ptree hasParentObj preserved: ${hasPtreeParent ? 'PASS' : 'FAIL'}`);
