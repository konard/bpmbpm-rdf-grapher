/**
 * OWL/XML to TTL Converter for Protege (Browser-based JavaScript)
 *
 * This script converts OWL/XML files (edited in Protege) back to Turtle (.ttl)
 * format for use in the RDF Grapher project.
 *
 * Usage:
 *   Include this script in an HTML page and call:
 *   const ttl = owlToTtl(owlXmlContent);
 *
 * Dependencies:
 *   None (pure JavaScript, uses browser's DOMParser)
 *
 * Author: RDF Grapher Project
 * Date: 2026-01-27
 */

(function(global) {
    'use strict';

    // Common namespace prefixes (reverse lookup)
    const URI_TO_PREFIX = {
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
        'http://www.w3.org/2000/01/rdf-schema#': 'rdfs',
        'http://www.w3.org/2002/07/owl#': 'owl',
        'http://www.w3.org/2001/XMLSchema#': 'xsd',
        'http://purl.org/dc/terms/': 'dcterms',
        'http://purl.org/dc/elements/1.1/': 'dc',
        'http://example.org/vad#': 'vad',
        'http://www.w3.org/2004/02/skos/core#': 'skos',
        'http://xmlns.com/foaf/0.1/': 'foaf'
    };

    /**
     * Extract namespace URI from a full URI
     * @param {string} uri - Full URI
     * @returns {Object} {namespace, localName}
     */
    function splitUri(uri) {
        // Try to find namespace by common patterns
        let splitIndex = uri.lastIndexOf('#');
        if (splitIndex === -1) {
            splitIndex = uri.lastIndexOf('/');
        }

        if (splitIndex > -1) {
            return {
                namespace: uri.substring(0, splitIndex + 1),
                localName: uri.substring(splitIndex + 1)
            };
        }

        return {
            namespace: '',
            localName: uri
        };
    }

    /**
     * Escape string for Turtle output
     * @param {string} str - Input string
     * @returns {string} Escaped string
     */
    function escapeTurtle(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    /**
     * Parse RDF/XML content and extract triples
     * @param {string} xmlContent - RDF/XML content
     * @returns {Object} {triples: Array, prefixes: Object}
     */
    function parseRdfXml(xmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'application/xml');

        // Check for parse errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parse error: ' + parseError.textContent);
        }

        const triples = [];
        const namespaces = {...URI_TO_PREFIX};

        // Extract namespace declarations from root element
        const root = doc.documentElement;
        for (const attr of root.attributes) {
            if (attr.name.startsWith('xmlns:')) {
                const prefix = attr.name.substring(6);
                namespaces[attr.value] = prefix;
            } else if (attr.name === 'xmlns') {
                namespaces[attr.value] = '';
            }
        }

        // Helper to resolve QName or URI
        function resolveUri(node, attrName) {
            const attr = node.getAttribute(attrName);
            if (attr) {
                return attr;
            }

            // Try with rdf: prefix
            const rdfAttr = node.getAttributeNS('http://www.w3.org/1999/02/22-rdf-syntax-ns#', attrName);
            if (rdfAttr) {
                return rdfAttr;
            }

            return null;
        }

        // Get rdf:about, rdf:ID, or rdf:nodeID
        function getSubjectUri(node) {
            let uri = resolveUri(node, 'about') || node.getAttribute('rdf:about');
            if (uri) return uri;

            uri = resolveUri(node, 'ID') || node.getAttribute('rdf:ID');
            if (uri) {
                // Resolve relative to base URI
                const base = doc.documentElement.getAttribute('xml:base') || '';
                return base + '#' + uri;
            }

            uri = resolveUri(node, 'nodeID') || node.getAttribute('rdf:nodeID');
            if (uri) return '_:' + uri;

            return null;
        }

        // Process a description element
        function processDescription(node, inheritedSubject) {
            let subject = getSubjectUri(node) || inheritedSubject;

            // If this is a typed node (not rdf:Description), add type triple
            const tagName = node.tagName || node.nodeName;
            const namespaceURI = node.namespaceURI;

            if (tagName !== 'rdf:Description' && tagName !== 'Description' &&
                namespaceURI !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#') {
                const typeUri = namespaceURI + node.localName;
                if (subject) {
                    triples.push({
                        subject: subject,
                        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                        object: typeUri,
                        objectType: 'resource'
                    });
                }
            }

            // Process child property elements
            for (const child of node.children) {
                if (!subject) continue;

                const predicateUri = child.namespaceURI + child.localName;

                // Check for rdf:resource (object property)
                let objectUri = resolveUri(child, 'resource') || child.getAttribute('rdf:resource');
                if (objectUri) {
                    triples.push({
                        subject: subject,
                        predicate: predicateUri,
                        object: objectUri,
                        objectType: 'resource'
                    });
                    continue;
                }

                // Check for nested description
                const nestedDesc = child.querySelector(':scope > *');
                if (nestedDesc) {
                    // Generate blank node or use rdf:about
                    const nestedSubject = getSubjectUri(nestedDesc) || '_:b' + triples.length;
                    triples.push({
                        subject: subject,
                        predicate: predicateUri,
                        object: nestedSubject,
                        objectType: 'resource'
                    });
                    processDescription(nestedDesc, nestedSubject);
                    continue;
                }

                // It's a literal
                const literalValue = child.textContent;
                const datatype = resolveUri(child, 'datatype') || child.getAttribute('rdf:datatype');
                const lang = child.getAttribute('xml:lang') || child.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'lang');

                triples.push({
                    subject: subject,
                    predicate: predicateUri,
                    object: literalValue,
                    objectType: 'literal',
                    datatype: datatype || null,
                    lang: lang || null
                });
            }
        }

        // Process all top-level elements
        for (const child of root.children) {
            processDescription(child, null);
        }

        // Build prefix map (reverse of namespaces)
        const prefixes = {};
        for (const [uri, prefix] of Object.entries(namespaces)) {
            if (prefix && !prefixes[prefix]) {
                prefixes[prefix] = uri;
            }
        }

        return { triples, prefixes, namespaces };
    }

    /**
     * Convert URI to prefixed form if possible
     * @param {string} uri - Full URI
     * @param {Object} namespaces - Namespace to prefix map
     * @returns {string} Prefixed URI or <full-uri>
     */
    function toPrefixed(uri, namespaces) {
        if (uri.startsWith('_:')) {
            return uri; // Blank node
        }

        const { namespace, localName } = splitUri(uri);

        if (namespace && namespaces[namespace]) {
            const prefix = namespaces[namespace];
            if (prefix === '') {
                return ':' + localName;
            }
            return prefix + ':' + localName;
        }

        return '<' + uri + '>';
    }

    /**
     * Convert triples to Turtle format
     * @param {Array} triples - Array of triple objects
     * @param {Object} prefixes - Prefix to namespace map
     * @param {Object} namespaces - Namespace to prefix map
     * @returns {string} Turtle content
     */
    function triplesToTurtle(triples, prefixes, namespaces) {
        let ttl = '';

        // Write prefix declarations
        const sortedPrefixes = Object.entries(prefixes).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [prefix, uri] of sortedPrefixes) {
            ttl += `@prefix ${prefix}: <${uri}> .\n`;
        }
        ttl += '\n';

        // Group triples by subject
        const bySubject = new Map();
        for (const triple of triples) {
            if (!bySubject.has(triple.subject)) {
                bySubject.set(triple.subject, []);
            }
            bySubject.get(triple.subject).push(triple);
        }

        // Write triples grouped by subject
        for (const [subject, subjectTriples] of bySubject) {
            const subjectPrefixed = toPrefixed(subject, namespaces);

            // Group by predicate
            const byPredicate = new Map();
            for (const triple of subjectTriples) {
                if (!byPredicate.has(triple.predicate)) {
                    byPredicate.set(triple.predicate, []);
                }
                byPredicate.get(triple.predicate).push(triple);
            }

            // Write subject
            ttl += subjectPrefixed;

            const predicates = Array.from(byPredicate.entries());
            for (let i = 0; i < predicates.length; i++) {
                const [predicate, objects] = predicates[i];
                let predicatePrefixed = toPrefixed(predicate, namespaces);

                // Use 'a' shorthand for rdf:type
                if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                    predicatePrefixed = 'a';
                }

                if (i === 0) {
                    ttl += '\n    ' + predicatePrefixed + ' ';
                } else {
                    ttl += ' ;\n    ' + predicatePrefixed + ' ';
                }

                // Write objects
                for (let j = 0; j < objects.length; j++) {
                    const obj = objects[j];

                    if (obj.objectType === 'literal') {
                        // Check if multi-line
                        const needsTripleQuote = obj.object.includes('\n') || obj.object.includes('"');

                        if (needsTripleQuote) {
                            ttl += '"""' + obj.object.replace(/"""/g, '\\"\\"\\"') + '"""';
                        } else {
                            ttl += '"' + escapeTurtle(obj.object) + '"';
                        }

                        if (obj.datatype) {
                            const datatypePrefixed = toPrefixed(obj.datatype, namespaces);
                            // Don't add datatype for xsd:string (implicit)
                            if (obj.datatype !== 'http://www.w3.org/2001/XMLSchema#string') {
                                ttl += '^^' + datatypePrefixed;
                            }
                        } else if (obj.lang) {
                            ttl += '@' + obj.lang;
                        }
                    } else {
                        ttl += toPrefixed(obj.object, namespaces);
                    }

                    if (j < objects.length - 1) {
                        ttl += ', ';
                    }
                }
            }

            ttl += ' .\n\n';
        }

        return ttl;
    }

    /**
     * Main conversion function: OWL/XML to TTL
     * @param {string} owlXmlContent - OWL/XML content
     * @returns {string} Turtle content
     */
    function owlToTtl(owlXmlContent) {
        const { triples, prefixes, namespaces } = parseRdfXml(owlXmlContent);
        return triplesToTurtle(triples, prefixes, namespaces);
    }

    /**
     * Download conversion result as a file
     * @param {string} content - File content
     * @param {string} filename - Desired filename
     */
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/turtle' });
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
    global.owlToTtl = owlToTtl;
    global.owlToTtlDownload = function(owlXmlContent, filename) {
        const ttlContent = owlToTtl(owlXmlContent);
        downloadFile(ttlContent, filename || 'ontology.ttl');
        return ttlContent;
    };

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { owlToTtl, downloadFile };
    }

})(typeof window !== 'undefined' ? window : global);
