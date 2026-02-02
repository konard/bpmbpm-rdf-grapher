// Experiment: reproduce test 6 failure in funSPARQLvalues with full URIs
const N3 = require('n3');
const fs = require('fs');

// Load TriG data
const trigData = fs.readFileSync(__dirname + '/../ver9b/Trig_VADv5.ttl', 'utf-8');

// Global state (simulating browser environment)
let currentQuads = [];
let currentPrefixes = {};
let currentStore = null;

// Parse
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

        console.log(`Parsed ${quads.length} quads, ${Object.keys(currentPrefixes).length} prefixes`);
        console.log('Prefixes:', currentPrefixes);

        // Now run the test SPARQL query (same as test 6)
        const sparqlQuery = `
            SELECT ?process WHERE {
                GRAPH <http://example.org/vad#ptree> {
                    ?process <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.org/vad#TypeProcess> .
                }
            }
        `;

        // Inline the functions from vadlib_sparql.js
        function getPrefixedName(uri, prefixes) {
            if (typeof uri !== 'string') return String(uri);
            for (const [prefix, namespace] of Object.entries(prefixes)) {
                if (uri.startsWith(namespace)) {
                    const localName = uri.substring(namespace.length);
                    return prefix + ':' + localName;
                }
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
                const innerStatements = cleanedContent.split(/\s*\.\s*/).filter(s => s.trim());

                console.log('--- Graph URI:', graphUri);
                console.log('--- Inner statements:', innerStatements);

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

        // Parse the SPARQL query
        const selectMatch = sparqlQuery.match(/SELECT\s+(\?[\w]+(?:\s+\?[\w]+)*)/i);
        const variables = selectMatch[1].split(/\s+/).map(v => v.substring(1));
        console.log('Variables:', variables);

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
        console.log('WHERE clause:', whereClause);

        const triplePatterns = parseTriplePatterns(whereClause);
        console.log('Patterns:', triplePatterns.length);

        const bindings = executeSimpleSelect(triplePatterns, variables);
        console.log('Bindings count:', bindings.length);

        if (bindings.length > 0) {
            console.log('First 3 bindings:', bindings.slice(0, 3));
            console.log('TEST 6 WOULD PASS');
        } else {
            console.log('TEST 6 WOULD FAIL - No results');

            // Debug: check some quads manually
            console.log('\n--- Debug: checking quads in ptree graph ---');
            const ptreeQuads = currentQuads.filter(q => q.graph.value === 'http://example.org/vad#ptree');
            console.log('Quads in ptree:', ptreeQuads.length);
            if (ptreeQuads.length > 0) {
                console.log('First ptree quad:', {
                    s: ptreeQuads[0].subject.value,
                    p: ptreeQuads[0].predicate.value,
                    o: ptreeQuads[0].object.value,
                    g: ptreeQuads[0].graph.value
                });
            }

            // Check type quads specifically
            const typeQuads = ptreeQuads.filter(q =>
                q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                q.object.value === 'http://example.org/vad#TypeProcess'
            );
            console.log('TypeProcess quads in ptree:', typeQuads.length);
            if (typeQuads.length > 0) {
                console.log('First TypeProcess quad:', {
                    s: typeQuads[0].subject.value,
                    p: typeQuads[0].predicate.value,
                    o: typeQuads[0].object.value,
                    g: typeQuads[0].graph.value
                });
            }
        }
    }
});
