# SPARQL Research for ver8tree

## 1. Overview

This document addresses research questions about SPARQL libraries, triplestore options, SPARQL-driven programming concepts, and PL/SPARQL extensions for the ver8tree project.

---

## 2. N3.js vs Comunica: Library Comparison

### 2.1 Question

Why are N3.js (for RDF parsing) and Comunica (for SPARQL queries) used separately? Wouldn't it be better to use one more functional library?

### 2.2 Analysis

#### N3.js
- **Purpose**: Fast RDF parsing and serialization
- **Strengths**:
  - Lightweight (~50KB minified)
  - Very fast parsing (optimized streaming parser)
  - Excellent Turtle/TriG/N-Triples/N-Quads support
  - Simple, focused API
  - Works in browser and Node.js
- **Limitations**:
  - No built-in SPARQL query engine
  - No query federation
  - Manual triple manipulation only

#### Comunica
- **Purpose**: Full SPARQL query engine
- **Strengths**:
  - Complete SPARQL 1.1 support
  - Query federation across sources
  - Modular architecture
  - Supports multiple data sources
- **Limitations**:
  - Large bundle size (~500KB+ with dependencies)
  - Higher memory usage
  - More complex API
  - Overhead for simple operations

### 2.3 Why Use Both?

The current approach makes sense for ver8tree:

1. **Performance**: N3.js is faster for initial parsing and simple triple iteration
2. **Bundle Size**: For browser apps, keeping the bundle small matters
3. **Flexibility**: Can choose when to use heavy SPARQL vs simple iteration
4. **Current Usage**: Most operations are simple triple lookups, not complex queries

### 2.4 Recommendation

**Keep using both libraries** with this strategy:
- N3.js for parsing, serialization, and simple triple operations
- Comunica (loaded on-demand) for complex SPARQL queries when needed

**Alternative**: If bundle size isn't critical, consider:
- **rdflib.js** - Full-featured library with parsing AND SPARQL
- **Oxigraph WASM** - Rust-based triplestore with SPARQL (new, performant)

---

## 3. Triplestore Options for Browser JS

### 3.1 Current Issue

The project uses custom functions for triplet addition/deletion, leading to syntax errors (Issue #221). Why not use Comunica's triplestore capabilities?

### 3.2 Analysis of Current Approach

The project manually manipulates quads array:
```javascript
// Current approach - prone to errors
currentQuads.push(newQuad);
currentQuads = currentQuads.filter(q => q !== quadToRemove);
```

This causes issues because:
- No validation of quad structure
- No transaction support
- Serialization to TriG is manual
- Easy to create invalid RDF

### 3.3 Browser-Compatible Triplestore Options

| Library | Type | SPARQL | Size | Notes |
|---------|------|--------|------|-------|
| **N3.js Store** | In-memory | No | ~50KB | Fast, simple, good for small datasets |
| **Comunica** | Query engine | Yes | ~500KB | Not a store, queries data sources |
| **rdflib.js** | In-memory | Basic | ~150KB | Formula-based, decent SPARQL |
| **Graphy.js** | In-memory | No | ~100KB | Fast, tree-based indexing |
| **Oxigraph WASM** | In-memory | Full | ~2MB | Rust-compiled, full SPARQL, fast |
| **LevelGraph** | Disk/IndexedDB | Partial | ~50KB | Persistent, triple pattern matching |
| **Quadstore** | Disk/IndexedDB | Via Comunica | ~100KB | Persistent, works with Comunica |

### 3.4 Recommendation for ver8tree

**Short-term**: Use N3.js Store
```javascript
const N3 = require('n3');
const store = new N3.Store();

// Add quads
store.addQuad(subject, predicate, object, graph);

// Query with pattern matching
const results = store.getQuads(null, predicate, null, graph);

// Delete
store.removeQuad(quad);

// Serialize
const writer = new N3.Writer({ format: 'application/trig' });
store.forEach(quad => writer.addQuad(quad));
writer.end((error, result) => console.log(result));
```

**Long-term**: Consider Oxigraph WASM
```javascript
import init, { Store } from "oxigraph/web";

await init();
const store = new Store();

// SPARQL INSERT
store.update("INSERT DATA { GRAPH <g> { <s> <p> <o> } }");

// SPARQL SELECT
for (const binding of store.query("SELECT * WHERE { ?s ?p ?o }")) {
    console.log(binding);
}

// SPARQL DELETE
store.update("DELETE WHERE { GRAPH <g> { <s> <p> ?o } }");
```

Benefits of using a proper store:
- Automatic syntax validation
- Transaction support
- Index-based querying
- Standard SPARQL UPDATE support

### 3.5 Flat Files vs Database

For ver8tree, **flat files (TriG) are preferable**:
- Human-readable and editable
- Version control friendly
- No server required
- Easy backup/sharing
- Sufficient for typical dataset sizes (<100K triples)

Use IndexedDB-backed store only if:
- Need offline persistence
- Dataset exceeds ~50K triples
- Frequent updates required

---

## 4. SPARQL-Driven Programming

### 4.1 Core Concept

SPARQL-driven programming treats SPARQL queries as the primary interface to data, rather than direct object manipulation. The code focuses on:
1. **Declarative data access** via SPARQL queries
2. **Query-based business logic**
3. **SPARQL UPDATE for modifications**

### 4.2 Key Principles

1. **Query Before Act**: Use SELECT to understand data state
2. **Validate via Query**: Check constraints with ASK queries
3. **Modify via UPDATE**: Use INSERT/DELETE DATA for changes
4. **Compose Queries**: Build complex operations from simple queries

### 4.3 Current ver8tree Examples

#### Example 1: funSPARQLvalues Function
```javascript
/**
 * Execute SPARQL and return array of values for a variable
 * @param {string} query - SPARQL SELECT query
 * @param {string} variable - Variable name to extract
 * @returns {Array} Values array
 */
function funSPARQLvalues(query, variable) {
    // Execute query against triplestore
    // Extract values for specified variable
    // Return as array for dropdown population
}

// Usage - populate concept dropdown
const concepts = funSPARQLvalues(`
    SELECT ?concept WHERE {
        GRAPH vad:ptree { ?concept a vad:TypeProcess }
    }
`, 'concept');
```

#### Example 2: Validation Query
```javascript
// From del_concept_individ.js - Check if concept has individs
const CHECK_PROCESS_INDIVIDUALS = (conceptUri) => `
    SELECT ?individ ?trig WHERE {
        GRAPH ?trig {
            <${conceptUri}> vad:isSubprocessTrig ?trig .
        }
    }
`;

// Usage
const individuals = executeSPARQL(CHECK_PROCESS_INDIVIDUALS(selectedConcept));
if (individuals.length > 0) {
    showError("Cannot delete - has individs");
}
```

#### Example 3: Query-Generated INSERT
```javascript
// Generate INSERT query based on form data
function generateCreateConceptSparql(formData) {
    const { graphUri, subjectUri, predicates } = formData;

    let triples = predicates
        .map(p => `${subjectUri} ${p.predicate} ${p.value}`)
        .join(' .\n        ');

    return `
PREFIX vad: <http://example.org/vad#>
INSERT DATA {
    GRAPH ${graphUri} {
        ${triples} .
    }
}`;
}
```

### 4.4 Proposed: funSPARQLtriplestore Function

New function that returns a triplestore subset based on SPARQL CONSTRUCT:

```javascript
/**
 * Execute SPARQL CONSTRUCT and return resulting triplestore
 * @param {string} constructQuery - SPARQL CONSTRUCT query
 * @returns {N3.Store} Store containing constructed triples
 */
function funSPARQLtriplestore(constructQuery) {
    const store = new N3.Store();

    // Execute CONSTRUCT query
    const constructedQuads = executeConstruct(constructQuery);

    // Add results to new store
    constructedQuads.forEach(quad => store.addQuad(quad));

    return store;
}

// Usage Example 1: Get all triples for a specific concept
const conceptStore = funSPARQLtriplestore(`
    CONSTRUCT { ?s ?p ?o }
    WHERE {
        GRAPH vad:ptree {
            vad:p1 ?p ?o .
            BIND(vad:p1 AS ?s)
        }
    }
`);

// Usage Example 2: Get process schema with executors
const schemaStore = funSPARQLtriplestore(`
    CONSTRUCT {
        ?process vad:isSubprocessTrig ?trig .
        ?process vad:hasExecutor ?group .
        ?group vad:includes ?executor .
    }
    WHERE {
        GRAPH ?trig {
            ?process vad:isSubprocessTrig ?trig .
            ?process vad:hasExecutor ?group .
            ?group vad:includes ?executor .
        }
    }
`);

// Usage Example 3: Create subgraph for export
const exportStore = funSPARQLtriplestore(`
    CONSTRUCT { ?s ?p ?o }
    WHERE {
        { GRAPH vad:ptree { ?s ?p ?o } }
        UNION
        { GRAPH vad:rtree { ?s ?p ?o } }
    }
`);

// Then serialize the store
const writer = new N3.Writer({ format: 'application/trig' });
exportStore.forEach(quad => writer.addQuad(quad));
```

### 4.5 Benefits of funSPARQLtriplestore

1. **Subset Extraction**: Create focused datasets for specific operations
2. **Data Transformation**: Use CONSTRUCT to reshape data
3. **Export/Import**: Easily serialize subsets
4. **Testing**: Create isolated test datasets
5. **Caching**: Store frequently-used query results

---

## 5. PL/SPARQL Concept

### 5.1 Background

PL/SQL (Procedural Language for SQL) extends SQL with:
- Variables and types
- Control flow (IF, LOOP, CASE)
- Procedures and functions
- Exception handling
- Cursors

### 5.2 Proposed PL/SPARQL for ver8tree

A procedural extension for SPARQL operations, making complex operations more readable.

### 5.3 Similar Existing Libraries

| Library | Description | Status |
|---------|-------------|--------|
| **SPARQL Algebra** | Parse SPARQL to algebraic representation | Academic |
| **SPARQLWrapper** | Python library for SPARQL endpoints | Active |
| **Linked Data-Fu** | Rule-based RDF processing | Research |
| **SPIN** | SPARQL Inferencing Notation | W3C Note |
| **SHACL** | Shapes Constraint Language | W3C Rec |
| **RML** | RDF Mapping Language | Active |

### 5.4 Custom PL/SPARQL Concept for ver8tree

#### 5.4.1 Syntax Proposal

```
PROCEDURE NewConcept(
    @type: URI,           -- vad:TypeProcess or vad:TypeExecutor
    @parent: URI,         -- Parent object URI
    @label: STRING,       -- rdfs:label value
    @graph: URI           -- Target graph (ptree or rtree)
)
BEGIN
    -- Generate unique ID
    DECLARE @newId = GenerateId(@type);

    -- Check parent exists
    IF NOT EXISTS(SELECT * FROM @graph WHERE subject = @parent)
        RAISE ERROR 'Parent not found';
    END IF;

    -- Insert concept
    INSERT INTO @graph {
        @newId a @type ;
            rdfs:label @label ;
            vad:hasParentObj @parent .
    };

    -- Return new ID
    RETURN @newId;
END;
```

#### 5.4.2 JavaScript Implementation

```javascript
/**
 * PL/SPARQL-style procedure definitions for ver8tree
 */
const PLSPARQL = {
    /**
     * Create new concept (TypeProcess or TypeExecutor)
     *
     * Equivalent PL/SPARQL:
     *   PROCEDURE NewConcept(@type, @parent, @label, @graph)
     *
     * @param {Object} params - Procedure parameters
     * @returns {Object} Result with newId and sparqlQuery
     */
    NewConcept: ({ type, parent, label, graph }) => {
        // Step 1: Generate ID
        const newId = generateUniqueId(type);

        // Step 2: Validate parent exists
        const parentCheck = funSPARQLvalues(`
            SELECT ?parent WHERE {
                GRAPH ${graph} { ${parent} a ?type }
            }
        `, 'parent');

        if (parentCheck.length === 0) {
            return { error: 'Parent not found', code: 'PARENT_NOT_EXISTS' };
        }

        // Step 3: Generate INSERT query
        const sparqlQuery = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH ${graph} {
        ${newId} rdf:type ${type} ;
                 rdfs:label "${label}" ;
                 vad:hasParentObj ${parent} .
    }
}`;

        return { newId, sparqlQuery };
    },

    /**
     * Delete concept with validation
     *
     * Equivalent PL/SPARQL:
     *   PROCEDURE DeleteConcept(@concept, @graph)
     */
    DeleteConcept: ({ concept, graph }) => {
        // Step 1: Check for individs
        const individCheck = funSPARQLvalues(`
            SELECT ?trig WHERE {
                GRAPH ?trig { ${concept} vad:isSubprocessTrig ?trig }
            }
        `, 'trig');

        if (individCheck.length > 0) {
            return {
                error: `Cannot delete: used as individ in ${individCheck.length} TriGs`,
                code: 'HAS_INDIVIDS',
                details: individCheck
            };
        }

        // Step 2: Check for children
        const childCheck = funSPARQLvalues(`
            SELECT ?child WHERE {
                GRAPH ${graph} { ?child vad:hasParentObj ${concept} }
            }
        `, 'child');

        if (childCheck.length > 0) {
            return {
                error: `Cannot delete: has ${childCheck.length} children`,
                code: 'HAS_CHILDREN',
                details: childCheck
            };
        }

        // Step 3: Generate DELETE query
        const sparqlQuery = `
PREFIX vad: <http://example.org/vad#>

DELETE WHERE {
    GRAPH ${graph} {
        ${concept} ?p ?o .
    }
}`;

        return { sparqlQuery };
    },

    /**
     * Create new TriG (VADProcessDia)
     *
     * Equivalent PL/SPARQL:
     *   PROCEDURE NewTriG(@concept)
     */
    NewTriG: ({ concept }) => {
        // Step 1: Check concept doesn't have TriG
        const existingTrig = funSPARQLvalues(`
            SELECT ?trig WHERE {
                GRAPH vad:ptree { ${concept} vad:hasTrig ?trig }
            }
        `, 'trig');

        if (existingTrig.length > 0) {
            return {
                error: 'Concept already has TriG',
                code: 'TRIG_EXISTS',
                details: existingTrig
            };
        }

        // Step 2: Generate TriG URI
        const trigUri = `${concept}_trig`;

        // Step 3: Generate compound query
        const sparqlQuery = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

# Create TriG metadata
INSERT DATA {
    ${trigUri} rdf:type vad:VADProcessDia ;
               vad:hasParentObj ${concept} .
};

# Link concept to TriG in ptree
INSERT DATA {
    GRAPH vad:ptree {
        ${concept} vad:hasTrig ${trigUri} .
    }
}`;

        return { trigUri, sparqlQuery };
    }
};

// Usage
const result = PLSPARQL.NewConcept({
    type: 'vad:TypeProcess',
    parent: 'vad:ptree',
    label: 'New Process',
    graph: 'vad:ptree'
});

if (result.error) {
    console.error(result.error);
} else {
    console.log('Generated SPARQL:', result.sparqlQuery);
    // Execute or display query
}
```

### 5.5 Benefits of PL/SPARQL Approach

1. **Readability**: Complex operations documented as procedures
2. **Reusability**: Procedures can be called from multiple places
3. **Validation**: Built-in checks before operations
4. **Documentation**: Self-documenting code structure
5. **Testing**: Easy to test individual procedures

### 5.6 Compact Operation Descriptions

```javascript
// Compact PL/SPARQL-style descriptions

// NewConcept: type, parent, label → graph
// 1. CHECK parent EXISTS in graph
// 2. GENERATE unique ID from type
// 3. INSERT { newId type, label, hasParentObj parent }

// DeleteConcept: concept → graph
// 1. CHECK no individs (isSubprocessTrig)
// 2. CHECK no schema (hasTrig)
// 3. CHECK no children (hasParentObj)
// 4. DELETE { concept ?p ?o }

// NewTriG: concept → default graph + ptree
// 1. CHECK concept has no hasTrig
// 2. GENERATE trigUri = concept + "_trig"
// 3. INSERT trigUri metadata
// 4. INSERT hasTrig in ptree
```

---

## 6. Summary and Recommendations

### 6.1 Library Strategy
- Continue using N3.js for parsing
- Consider N3.Store for in-memory operations
- Use Comunica only for complex SPARQL when needed
- Evaluate Oxigraph WASM for future full SPARQL support

### 6.2 Triplestore
- Short-term: Migrate to N3.Store for quad management
- This eliminates manual quad manipulation errors
- Keep TriG flat files for persistence

### 6.3 SPARQL-Driven Programming
- Implement funSPARQLtriplestore for CONSTRUCT queries
- Use SPARQL as primary data interface
- Document all queries in centralized modules

### 6.4 PL/SPARQL
- Adopt procedure-based structure for business operations
- Implement validation checks as query steps
- Document operations in compact pseudocode format

---

## 7. References

- [N3.js Documentation](https://github.com/rdfjs/N3.js)
- [Comunica](https://comunica.dev/)
- [Oxigraph](https://github.com/oxigraph/oxigraph)
- [SPARQL 1.1 Update](https://www.w3.org/TR/sparql11-update/)
- [SPIN - SPARQL Inferencing Notation](https://www.w3.org/Submission/spin-overview/)
