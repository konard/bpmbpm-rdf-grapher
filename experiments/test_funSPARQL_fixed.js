// Experiment: test fix for funSPARQLvalues with full URIs
const N3 = require('n3');
const fs = require('fs');

const trigData = fs.readFileSync(__dirname + '/../ver9b/Trig_VADv5.ttl', 'utf-8');

let currentQuads = [];
let currentPrefixes = {};
let currentStore = null;

const parser = new N3.Parser({ format: 'trig' });
const quads = [];

parser.parse(trigData, (error, quad, parsedPrefixes) => {
    if (error) { console.error('Parse error:', error); return; }
    if (quad) { quads.push(quad); }
    else {
        if (parsedPrefixes) currentPrefixes = parsedPrefixes;
        currentQuads = quads;
        currentStore = new N3.Store();
        quads.forEach(q => currentStore.addQuad(q));

        console.log(`Parsed ${quads.length} quads`);

        // --- NEW: splitSparqlStatements ---
        function splitSparqlStatements(content) {
            const statements = [];
            let current = '';
            let inAngleBrackets = 0;
            let inDoubleQuotes = false;
            let inSingleQuotes = false;

            for (let i = 0; i < content.length; i++) {
                const ch = content[i];
                if (ch === '"' && !inSingleQuotes && inAngleBrackets === 0) {
                    inDoubleQuotes = !inDoubleQuotes;
                    current += ch;
                } else if (ch === "'" && !inDoubleQuotes && inAngleBrackets === 0) {
                    inSingleQuotes = !inSingleQuotes;
                    current += ch;
                } else if (ch === '<' && !inDoubleQuotes && !inSingleQuotes) {
                    inAngleBrackets++;
                    current += ch;
                } else if (ch === '>' && !inDoubleQuotes && !inSingleQuotes && inAngleBrackets > 0) {
                    inAngleBrackets--;
                    current += ch;
                } else if (ch === '.' && inAngleBrackets === 0 && !inDoubleQuotes && !inSingleQuotes) {
                    const trimmed = current.trim();
                    if (trimmed) statements.push(trimmed);
                    current = '';
                } else {
                    current += ch;
                }
            }
            const trimmed = current.trim();
            if (trimmed) statements.push(trimmed);
            return statements;
        }

        function getPrefixedName(uri, prefixes) {
            if (typeof uri !== 'string') return String(uri);
            for (const [prefix, namespace] of Object.entries(prefixes)) {
                if (uri.startsWith(namespace)) return prefix + ':' + uri.substring(namespace.length);
            }
            return uri;
        }

        function resolveValue(value) {
            if (!value) return null;
            value = value.trim();
            if (value.startsWith('?')) return { type: 'variable', name: value.substring(1) };
            if (value.startsWith('<') && value.endsWith('>')) return { type: 'uri', value: value.slice(1, -1) };
            const colonIndex = value.indexOf(':');
            if (colonIndex > 0) {
                const prefix = value.substring(0, colonIndex);
                const local = value.substring(colonIndex + 1);
                const namespace = currentPrefixes[prefix];
                if (namespace) return { type: 'uri', value: namespace + local };
            }
            if (value.startsWith('"') || value.startsWith("'")) return { type: 'literal', value: value.replace(/^["']|["']$/g, '') };
            return { type: 'uri', value: value };
        }

        function parseTriplePatterns(whereClause) {
            const patterns = [];
            const graphRegex = /GRAPH\s+(\S+)\s*\{/gi;
            let graphMatch;
            let processedRanges = [];

            while ((graphMatch = graphRegex.exec(whereClause)) !== null) {
                const graphUri = resolveValue(graphMatch[1]);
                const openBraceIndex = graphMatch.index + graphMatch[0].length - 1;
                let braceCount = 1;
                let closeIndex = openBraceIndex + 1;
                while (braceCount > 0 && closeIndex < whereClause.length) {
                    if (whereClause[closeIndex] === '{') braceCount++;
                    else if (whereClause[closeIndex] === '}') braceCount--;
                    closeIndex++;
                }
                const graphContent = whereClause.substring(openBraceIndex + 1, closeIndex - 1);
                processedRanges.push({ start: graphMatch.index, end: closeIndex });
                const cleanedContent = graphContent.replace(/OPTIONAL\s*\{[^}]*\}/gi, '');

                // FIXED: use splitSparqlStatements instead of split(/\s*\.\s*/)
                const innerStatements = splitSparqlStatements(cleanedContent);

                console.log('--- Inner statements (fixed):', innerStatements);

                innerStatements.forEach(inner => {
                    const trimmed = inner.trim();
                    if (!trimmed || trimmed.startsWith('#')) return;
                    const parts = trimmed.split(/\s+/);
                    console.log('--- Parts:', parts);
                    if (parts.length >= 3) {
                        const pattern = {
                            subject: resolveValue(parts[0]),
                            predicate: resolveValue(parts[1]),
                            object: resolveValue(parts.slice(2).join(' ')),
                            graph: graphUri
                        };
                        console.log('--- Pattern:', JSON.stringify(pattern));
                        patterns.push(pattern);
                    }
                });
            }
            return patterns;
        }

        function matchQuadToPattern(quad, pattern, currentBinding) {
            const newBinding = {};
            if (pattern.graph) {
                if (pattern.graph.type === 'variable') {
                    const boundValue = currentBinding[pattern.graph.name];
                    if (boundValue && boundValue !== quad.graph.value) return null;
                    newBinding[pattern.graph.name] = quad.graph.value;
                } else if (pattern.graph.type === 'uri') {
                    if (quad.graph.value !== pattern.graph.value) return null;
                }
            }
            if (pattern.subject) {
                if (pattern.subject.type === 'variable') {
                    const boundValue = currentBinding[pattern.subject.name];
                    if (boundValue && boundValue !== quad.subject.value) return null;
                    newBinding[pattern.subject.name] = quad.subject.value;
                } else if (pattern.subject.type === 'uri') {
                    if (quad.subject.value !== pattern.subject.value) return null;
                }
            }
            if (pattern.predicate) {
                if (pattern.predicate.type === 'variable') {
                    const boundValue = currentBinding[pattern.predicate.name];
                    if (boundValue && boundValue !== quad.predicate.value) return null;
                    newBinding[pattern.predicate.name] = quad.predicate.value;
                } else if (pattern.predicate.type === 'uri') {
                    if (quad.predicate.value !== pattern.predicate.value) return null;
                }
            }
            if (pattern.object) {
                if (pattern.object.type === 'variable') {
                    const boundValue = currentBinding[pattern.object.name];
                    const quadObjectValue = quad.object.value;
                    if (boundValue && boundValue !== quadObjectValue) return null;
                    newBinding[pattern.object.name] = quadObjectValue;
                } else if (pattern.object.type === 'uri') {
                    if (quad.object.value !== pattern.object.value) return null;
                } else if (pattern.object.type === 'literal') {
                    if (quad.object.value !== pattern.object.value) return null;
                }
            }
            return newBinding;
        }

        function executeSimpleSelect(patterns, variables) {
            const bindings = [{}];
            patterns.forEach(pattern => {
                const newBindings = [];
                bindings.forEach(binding => {
                    currentQuads.forEach(quad => {
                        const match = matchQuadToPattern(quad, pattern, binding);
                        if (match) newBindings.push({...binding, ...match});
                    });
                });
                bindings.length = 0;
                bindings.push(...newBindings);
            });
            return bindings;
        }

        // Test with full URIs
        const sparqlQuery = `
            SELECT ?process WHERE {
                GRAPH <http://example.org/vad#ptree> {
                    ?process <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/vad#TypeProcess> .
                }
            }
        `;

        const selectMatch = sparqlQuery.match(/SELECT\s+(\?[\w]+(?:\s+\?[\w]+)*)/i);
        const variables = selectMatch[1].split(/\s+/).map(v => v.substring(1));

        const whereStartIndex = sparqlQuery.search(/WHERE\s*\{/i);
        const openBraceIndex = sparqlQuery.indexOf('{', whereStartIndex);
        let braceCount = 1;
        let closeIndex = openBraceIndex + 1;
        while (braceCount > 0 && closeIndex < sparqlQuery.length) {
            if (sparqlQuery[closeIndex] === '{') braceCount++;
            else if (sparqlQuery[closeIndex] === '}') braceCount--;
            closeIndex++;
        }
        const whereClause = sparqlQuery.substring(openBraceIndex + 1, closeIndex - 1).trim();

        const triplePatterns = parseTriplePatterns(whereClause);
        console.log('Patterns count:', triplePatterns.length);

        const bindings = executeSimpleSelect(triplePatterns, variables);
        console.log('Bindings count:', bindings.length);

        if (bindings.length > 0) {
            console.log('First 3 results:', bindings.slice(0, 3).map(b => b.process));
            console.log('\n✅ TEST 6 PASSES with fix!');
        } else {
            console.log('\n❌ TEST 6 STILL FAILS');
        }

        // Also test with prefixed names (should still work)
        const sparqlQueryPrefixed = `
            SELECT ?process WHERE {
                GRAPH vad:ptree {
                    ?process rdf:type vad:TypeProcess .
                }
            }
        `;

        const selectMatch2 = sparqlQueryPrefixed.match(/SELECT\s+(\?[\w]+(?:\s+\?[\w]+)*)/i);
        const variables2 = selectMatch2[1].split(/\s+/).map(v => v.substring(1));

        const whereStartIndex2 = sparqlQueryPrefixed.search(/WHERE\s*\{/i);
        const openBraceIndex2 = sparqlQueryPrefixed.indexOf('{', whereStartIndex2);
        let braceCount2 = 1;
        let closeIndex2 = openBraceIndex2 + 1;
        while (braceCount2 > 0 && closeIndex2 < sparqlQueryPrefixed.length) {
            if (sparqlQueryPrefixed[closeIndex2] === '{') braceCount2++;
            else if (sparqlQueryPrefixed[closeIndex2] === '}') braceCount2--;
            closeIndex2++;
        }
        const whereClause2 = sparqlQueryPrefixed.substring(openBraceIndex2 + 1, closeIndex2 - 1).trim();

        const triplePatterns2 = parseTriplePatterns(whereClause2);
        const bindings2 = executeSimpleSelect(triplePatterns2, variables2);

        if (bindings2.length > 0) {
            console.log('\n✅ Prefixed names still work! Found', bindings2.length, 'results');
        } else {
            console.log('\n❌ Prefixed names broken!');
        }
    }
});
