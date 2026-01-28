/**
 * TTL to OWL/XML Converter for Protege (Browser-based JavaScript)
 *
 * This script converts Turtle (.ttl) files to OWL/XML format for better
 * compatibility with Protege, especially when working with ontology features.
 *
 * Usage:
 *   Include this script in an HTML page and call:
 *   const owlXml = ttlToOwl(ttlContent);
 *
 * Dependencies:
 *   None (pure JavaScript)
 *
 * Author: RDF Grapher Project
 * Date: 2026-01-27
 */

(function(global) {
    'use strict';

    // Common namespace prefixes
    const KNOWN_PREFIXES = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'owl': 'http://www.w3.org/2002/07/owl#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#',
        'dcterms': 'http://purl.org/dc/terms/',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'vad': 'http://example.org/vad#',
        'skos': 'http://www.w3.org/2004/02/skos/core#',
        'foaf': 'http://xmlns.com/foaf/0.1/'
    };

    /**
     * Parse prefix declarations from TTL content
     * @param {string} ttl - Turtle content
     * @returns {Object} Map of prefix -> namespace URI
     */
    function parsePrefixes(ttl) {
        const prefixes = {...KNOWN_PREFIXES};
        const prefixRegex = /@prefix\s+(\w*):?\s*<([^>]+)>\s*\./gi;
        let match;

        while ((match = prefixRegex.exec(ttl)) !== null) {
            const prefix = match[1] || '';
            const uri = match[2];
            prefixes[prefix] = uri;
        }

        // Also handle PREFIX (SPARQL style)
        const sparqlPrefixRegex = /PREFIX\s+(\w*):?\s*<([^>]+)>/gi;
        while ((match = sparqlPrefixRegex.exec(ttl)) !== null) {
            const prefix = match[1] || '';
            const uri = match[2];
            prefixes[prefix] = uri;
        }

        return prefixes;
    }

    /**
     * Expand a prefixed URI to full URI
     * @param {string} prefixedUri - URI like "vad:Process"
     * @param {Object} prefixes - Prefix map
     * @returns {string} Full URI
     */
    function expandUri(prefixedUri, prefixes) {
        if (prefixedUri.startsWith('<') && prefixedUri.endsWith('>')) {
            return prefixedUri.slice(1, -1);
        }

        if (prefixedUri.startsWith('http://') || prefixedUri.startsWith('https://')) {
            return prefixedUri;
        }

        const colonIndex = prefixedUri.indexOf(':');
        if (colonIndex > -1) {
            const prefix = prefixedUri.substring(0, colonIndex);
            const localName = prefixedUri.substring(colonIndex + 1);
            if (prefixes[prefix]) {
                return prefixes[prefix] + localName;
            }
        }

        return prefixedUri;
    }

    /**
     * Escape XML special characters
     * @param {string} str - Input string
     * @returns {string} Escaped string
     */
    function escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Parse a simple TTL triple pattern
     * This is a simplified parser that handles common patterns
     * @param {string} ttl - Turtle content (without prefix declarations)
     * @param {Object} prefixes - Prefix map
     * @returns {Array} Array of {subject, predicate, object} triples
     */
    function parseTriples(ttl, prefixes) {
        const triples = [];

        // Remove comments
        ttl = ttl.replace(/#[^\n]*/g, '');

        // Remove prefix declarations
        ttl = ttl.replace(/@prefix\s+\w*:\s*<[^>]+>\s*\./gi, '');
        ttl = ttl.replace(/PREFIX\s+\w*:\s*<[^>]+>/gi, '');

        // Simple state machine for parsing
        let currentSubject = null;
        let currentPredicate = null;
        let buffer = '';
        let inString = false;
        let stringDelimiter = '';
        let stringBuffer = '';
        let tripleString = false;

        const tokens = [];

        // Tokenize
        for (let i = 0; i < ttl.length; i++) {
            const char = ttl[i];
            const nextChar = ttl[i + 1] || '';
            const nextNextChar = ttl[i + 2] || '';

            if (!inString) {
                // Check for triple-quoted string
                if (char === '"' && nextChar === '"' && nextNextChar === '"') {
                    if (buffer.trim()) {
                        tokens.push(buffer.trim());
                        buffer = '';
                    }
                    inString = true;
                    tripleString = true;
                    stringDelimiter = '"""';
                    stringBuffer = '';
                    i += 2; // Skip next two quotes
                    continue;
                }
                // Check for single-quoted string
                if (char === '"' || char === "'") {
                    if (buffer.trim()) {
                        tokens.push(buffer.trim());
                        buffer = '';
                    }
                    inString = true;
                    tripleString = false;
                    stringDelimiter = char;
                    stringBuffer = '';
                    continue;
                }

                // Statement terminators
                if (char === '.') {
                    if (buffer.trim()) {
                        tokens.push(buffer.trim());
                        buffer = '';
                    }
                    tokens.push('.');
                    continue;
                }
                if (char === ';') {
                    if (buffer.trim()) {
                        tokens.push(buffer.trim());
                        buffer = '';
                    }
                    tokens.push(';');
                    continue;
                }
                if (char === ',') {
                    if (buffer.trim()) {
                        tokens.push(buffer.trim());
                        buffer = '';
                    }
                    tokens.push(',');
                    continue;
                }

                // Whitespace
                if (/\s/.test(char)) {
                    if (buffer.trim()) {
                        tokens.push(buffer.trim());
                        buffer = '';
                    }
                    continue;
                }

                buffer += char;
            } else {
                // Inside a string
                if (tripleString) {
                    if (char === '"' && nextChar === '"' && nextNextChar === '"') {
                        tokens.push('"' + stringBuffer + '"');
                        inString = false;
                        tripleString = false;
                        i += 2;
                        continue;
                    }
                } else {
                    if (char === stringDelimiter && ttl[i - 1] !== '\\') {
                        tokens.push('"' + stringBuffer + '"');
                        inString = false;
                        continue;
                    }
                }
                stringBuffer += char;
            }
        }

        if (buffer.trim()) {
            tokens.push(buffer.trim());
        }

        // Parse tokens into triples
        let state = 'subject';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // Skip empty tokens and TriG graph names
            if (!token || token.match(/^\{|\}$/)) continue;

            if (token === '.') {
                currentSubject = null;
                currentPredicate = null;
                state = 'subject';
                continue;
            }

            if (token === ';') {
                state = 'predicate';
                continue;
            }

            if (token === ',') {
                state = 'object';
                continue;
            }

            // Handle "a" as rdf:type
            if (token === 'a' && state === 'predicate') {
                currentPredicate = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
                state = 'object';
                continue;
            }

            switch (state) {
                case 'subject':
                    currentSubject = expandUri(token, prefixes);
                    state = 'predicate';
                    break;
                case 'predicate':
                    currentPredicate = expandUri(token, prefixes);
                    state = 'object';
                    break;
                case 'object':
                    let objectValue = token;
                    let objectType = 'resource';
                    let datatype = null;
                    let lang = null;

                    // Check for typed literal
                    if (objectValue.startsWith('"')) {
                        objectType = 'literal';
                        // Remove quotes
                        objectValue = objectValue.slice(1, -1);

                        // Check for datatype or language tag in next token
                        if (tokens[i + 1] && tokens[i + 1].startsWith('^^')) {
                            datatype = expandUri(tokens[i + 1].slice(2), prefixes);
                            i++;
                        } else if (tokens[i + 1] && tokens[i + 1].startsWith('@')) {
                            lang = tokens[i + 1].slice(1);
                            i++;
                        }
                    } else if (objectValue.match(/^\d+$/)) {
                        objectType = 'literal';
                        datatype = 'http://www.w3.org/2001/XMLSchema#integer';
                    } else if (objectValue.match(/^\d+\.\d+$/)) {
                        objectType = 'literal';
                        datatype = 'http://www.w3.org/2001/XMLSchema#decimal';
                    } else if (objectValue === 'true' || objectValue === 'false') {
                        objectType = 'literal';
                        datatype = 'http://www.w3.org/2001/XMLSchema#boolean';
                    } else {
                        objectValue = expandUri(objectValue, prefixes);
                    }

                    if (currentSubject && currentPredicate) {
                        triples.push({
                            subject: currentSubject,
                            predicate: currentPredicate,
                            object: objectValue,
                            objectType: objectType,
                            datatype: datatype,
                            lang: lang
                        });
                    }

                    state = 'object'; // Stay in object state for comma-separated values
                    break;
            }
        }

        return triples;
    }

    /**
     * Convert triples to OWL/XML format
     * @param {Array} triples - Array of triple objects
     * @param {Object} prefixes - Prefix map
     * @returns {string} OWL/XML content
     */
    function triplesToOwlXml(triples, prefixes) {
        // Find ontology URI
        let ontologyUri = '';
        for (const triple of triples) {
            if (triple.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                triple.object === 'http://www.w3.org/2002/07/owl#Ontology') {
                ontologyUri = triple.subject;
                break;
            }
        }

        // Build XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<rdf:RDF\n';

        // Add namespace declarations
        for (const [prefix, uri] of Object.entries(prefixes)) {
            if (prefix) {
                xml += `    xmlns:${prefix}="${escapeXml(uri)}"\n`;
            }
        }
        xml += '    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n';
        xml += '    xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"\n';
        xml += '    xmlns:owl="http://www.w3.org/2002/07/owl#"\n';
        xml += '    xmlns:xsd="http://www.w3.org/2001/XMLSchema#">\n\n';

        // Add ontology declaration if found
        if (ontologyUri) {
            xml += `    <owl:Ontology rdf:about="${escapeXml(ontologyUri)}"/>\n\n`;
        }

        // Group triples by subject
        const bySubject = {};
        for (const triple of triples) {
            if (!bySubject[triple.subject]) {
                bySubject[triple.subject] = [];
            }
            bySubject[triple.subject].push(triple);
        }

        // Generate RDF/XML for each subject
        for (const [subject, subjectTriples] of Object.entries(bySubject)) {
            // Determine the type
            let rdfType = null;
            for (const t of subjectTriples) {
                if (t.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    rdfType = t.object;
                    break;
                }
            }

            // Use typed element or rdf:Description
            let elementName = 'rdf:Description';
            if (rdfType) {
                // Convert full URI to prefixed form if possible
                for (const [prefix, uri] of Object.entries(prefixes)) {
                    if (rdfType.startsWith(uri)) {
                        elementName = prefix + ':' + rdfType.slice(uri.length);
                        break;
                    }
                }
                if (elementName === 'rdf:Description') {
                    elementName = 'rdf:Description';
                }
            }

            xml += `    <${elementName} rdf:about="${escapeXml(subject)}">\n`;

            for (const triple of subjectTriples) {
                // Skip rdf:type if we used typed element
                if (triple.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
                    triple.object === rdfType && elementName !== 'rdf:Description') {
                    continue;
                }

                // Convert predicate to prefixed form
                let predicateQName = triple.predicate;
                for (const [prefix, uri] of Object.entries(prefixes)) {
                    if (triple.predicate.startsWith(uri)) {
                        predicateQName = prefix + ':' + triple.predicate.slice(uri.length);
                        break;
                    }
                }

                if (triple.objectType === 'literal') {
                    let attrs = '';
                    if (triple.datatype) {
                        // Convert datatype to prefixed form
                        let datatypeQName = triple.datatype;
                        for (const [prefix, uri] of Object.entries(prefixes)) {
                            if (triple.datatype.startsWith(uri)) {
                                datatypeQName = prefix + ':' + triple.datatype.slice(uri.length);
                                break;
                            }
                        }
                        attrs = ` rdf:datatype="${escapeXml(triple.datatype)}"`;
                    }
                    if (triple.lang) {
                        attrs = ` xml:lang="${escapeXml(triple.lang)}"`;
                    }
                    xml += `        <${predicateQName}${attrs}>${escapeXml(triple.object)}</${predicateQName}>\n`;
                } else {
                    xml += `        <${predicateQName} rdf:resource="${escapeXml(triple.object)}"/>\n`;
                }
            }

            xml += `    </${elementName}>\n\n`;
        }

        xml += '</rdf:RDF>\n';

        return xml;
    }

    /**
     * Main conversion function: TTL to OWL/XML
     * @param {string} ttlContent - Turtle content
     * @returns {string} OWL/XML content
     */
    function ttlToOwl(ttlContent) {
        const prefixes = parsePrefixes(ttlContent);
        const triples = parseTriples(ttlContent, prefixes);
        return triplesToOwlXml(triples, prefixes);
    }

    /**
     * Download conversion result as a file
     * @param {string} content - File content
     * @param {string} filename - Desired filename
     */
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'application/rdf+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export to global scope
    global.ttlToOwl = ttlToOwl;
    global.ttlToOwlDownload = function(ttlContent, filename) {
        const owlContent = ttlToOwl(ttlContent);
        downloadFile(owlContent, filename || 'ontology.owl');
        return owlContent;
    };

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ttlToOwl, downloadFile };
    }

})(typeof window !== 'undefined' ? window : global);
