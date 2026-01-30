# Code Structure Proposal for ver8tree

## 1. Overview

This document proposes a modular code structure for the ver8tree project with the following goals:
- Maximum module autonomy for reuse in other projects
- Module size limit of 1000 lines
- Organization by both business operations (UI windows/buttons) and categories (CSS, UI JS, business logic JS, SPARQL queries)

## 2. Proposed Folder Structure

```
ver8tree/
├── index.html                    # Main entry point
├── styles/                       # CSS modules
│   ├── base.css                  # Base styles, variables, reset
│   ├── layout.css                # Grid, flexbox, containers
│   ├── components.css            # UI components (buttons, panels, modals)
│   ├── diagram.css               # SVG diagram styles, node/edge styles
│   └── themes/                   # Theme variations
│       └── vad-theme.css         # VAD-specific color schemes
│
├── core/                         # Core infrastructure modules
│   ├── rdf-parser.js             # N3.js wrapper for RDF parsing (~300 lines)
│   ├── sparql-engine.js          # SPARQL query execution (~400 lines)
│   ├── triplestore.js            # In-memory triplestore operations (~500 lines)
│   ├── prefix-manager.js         # URI prefix handling (~150 lines)
│   └── event-bus.js              # Module communication (~200 lines)
│
├── ui/                           # UI modules (rendering, interaction)
│   ├── zoom-controls.js          # Zoom functionality (~150 lines)
│   ├── properties-panel.js       # Node properties display (~300 lines)
│   ├── node-click-handlers.js    # Click/double-click handling (~200 lines)
│   ├── trig-tree-view.js         # TriG hierarchy tree (~400 lines)
│   ├── diagram-renderer.js       # DOT/SVG rendering (~500 lines)
│   └── style-manager.js          # Node/edge style application (~300 lines)
│
├── business/                     # Business logic modules
│   ├── smart-design/             # Smart Design window operations
│   │   ├── smart-design-ui.js    # UI components for Smart Design (~400 lines)
│   │   ├── smart-design-logic.js # Business logic (~500 lines)
│   │   └── smart-design-sparql.js# SPARQL queries (~200 lines)
│   │
│   ├── new-concept/              # New Concept operation
│   │   ├── new-concept-ui.js     # UI: form rendering (~300 lines)
│   │   ├── new-concept-logic.js  # Logic: validation, ID generation (~400 lines)
│   │   └── new-concept-sparql.js # SPARQL: INSERT queries (~200 lines)
│   │
│   ├── new-trig/                 # New TriG (VADProcessDia) operation
│   │   ├── new-trig-ui.js        # UI: modal, form (~300 lines)
│   │   ├── new-trig-logic.js     # Logic: graph creation (~400 lines)
│   │   └── new-trig-sparql.js    # SPARQL: INSERT queries (~200 lines)
│   │
│   ├── del-concept/              # Delete Concept/Individ operation
│   │   ├── del-concept-ui.js     # UI: confirmation, results (~300 lines)
│   │   ├── del-concept-logic.js  # Logic: validation checks (~500 lines)
│   │   └── del-concept-sparql.js # SPARQL: DELETE queries (~200 lines)
│   │
│   └── validation/               # VAD schema validation
│       ├── validation-rules.js   # Rule definitions (~400 lines)
│       └── validation-ui.js      # Results display (~200 lines)
│
├── sparql/                       # Centralized SPARQL query modules
│   ├── queries-ptree.js          # Queries for process tree (~200 lines)
│   ├── queries-rtree.js          # Queries for executor tree (~150 lines)
│   ├── queries-trig.js           # Queries for TriG graphs (~200 lines)
│   ├── queries-techtree.js       # Queries for tech objects (~150 lines)
│   └── query-builder.js          # Dynamic query construction (~300 lines)
│
├── ontology/                     # Ontology-related files
│   ├── vad-basic-ontology.ttl    # Main VAD ontology
│   ├── vad-basic-ontology_tech_Appendix.ttl  # Tech appendix
│   └── constants.js              # URI constants, predicates (~150 lines)
│
├── data/                         # Data files
│   ├── example-data.js           # Example RDF data
│   └── sample-process.trig       # Sample TriG file
│
├── doc/                          # Documentation
│   ├── term.md                   # Terminology dictionary
│   └── ui-documentation.md       # UI documentation
│
├── requirements/                 # Research and requirements
│   ├── code_structure.md         # This file
│   ├── business-requirements.md  # Business requirements
│   ├── SPARQL.md                 # SPARQL research
│   ├── macro-functions.md        # Macro-function architecture
│   ├── code-navigator.md         # Code navigation concept
│   └── dsl-concepts.md           # DSL proposal
│
└── tests/                        # Test files
    ├── unit/                     # Unit tests
    └── integration/              # Integration tests
```

## 3. Module Organization Principles

### 3.1 Four-Module Pattern per Business Operation

Each business operation (e.g., New Concept, New TriG, Delete) follows a four-module pattern:

| Module Type | Responsibility | Max Lines |
|-------------|----------------|-----------|
| `*-ui.js` | DOM manipulation, event binding, rendering | 400 |
| `*-logic.js` | Business rules, validation, state management | 500 |
| `*-sparql.js` | SPARQL query definitions, query building | 300 |
| `*.css` | Styles specific to the operation | 300 |

### 3.2 Module Communication

Modules communicate through:
1. **Event Bus** - Loose coupling via events
2. **Dependency Injection** - Explicit dependencies passed to module init
3. **Shared State** - Minimal global state in a centralized store

```javascript
// Example: event-bus.js
const EventBus = {
    events: {},
    on(event, callback) { /* ... */ },
    emit(event, data) { /* ... */ },
    off(event, callback) { /* ... */ }
};

// Example usage in new-concept-logic.js
EventBus.on('concept:created', (concept) => {
    // Update UI, refresh lists, etc.
});
```

### 3.3 Module Independence Rules

1. **No direct DOM access** in logic modules - use UI modules
2. **No business logic** in UI modules - delegate to logic modules
3. **SPARQL queries** isolated in dedicated modules
4. **Explicit exports** - each module declares its public API
5. **No circular dependencies** - use event bus for cross-module communication

## 4. Current Code Mapping

### 4.1 Existing Files to New Structure

| Current File | New Location | Notes |
|--------------|--------------|-------|
| `styles.css` | `styles/` (split) | Split into base, components, diagram |
| `ui-utils.js` | `ui/` (split) | Split into zoom, properties, handlers |
| `sparql-queries.js` | `sparql/` | Organize by context (ptree, rtree, trig) |
| `create_new_concept.js` | `business/new-concept/` | Split into ui, logic, sparql |
| `del_concept_individ.js` | `business/del-concept/` | Split into ui, logic, sparql |
| `vad-validation-rules.js` | `business/validation/` | Keep as validation-rules.js |
| `example-data.js` | `data/` | No changes |

### 4.2 Current File Sizes

| File | Lines | Status |
|------|-------|--------|
| `ui-utils.js` | 692 | OK (under 1000) |
| `sparql-queries.js` | 112 | OK |
| `create_new_concept.js` | 1157 | NEEDS SPLIT |
| `del_concept_individ.js` | 1765 | NEEDS SPLIT |
| `vad-validation-rules.js` | 616 | OK |

## 5. Refactoring Plan

### Phase 1: Extract SPARQL Queries
1. Move SPARQL queries from `create_new_concept.js` to `new-concept-sparql.js`
2. Move SPARQL queries from `del_concept_individ.js` to `del-concept-sparql.js`
3. Create centralized query modules in `sparql/`

### Phase 2: Separate UI and Logic
1. Split `create_new_concept.js`:
   - UI functions -> `new-concept-ui.js`
   - Logic functions -> `new-concept-logic.js`
2. Split `del_concept_individ.js`:
   - UI functions -> `del-concept-ui.js`
   - Logic functions -> `del-concept-logic.js`

### Phase 3: Create Core Infrastructure
1. Extract RDF parsing to `core/rdf-parser.js`
2. Create SPARQL engine wrapper in `core/sparql-engine.js`
3. Implement triplestore operations in `core/triplestore.js`

### Phase 4: CSS Modularization
1. Extract base styles to `styles/base.css`
2. Extract component styles to `styles/components.css`
3. Extract diagram styles to `styles/diagram.css`

## 6. Module Templates

### 6.1 SPARQL Module Template

```javascript
/**
 * @file new-concept-sparql.js
 * @module new-concept-sparql
 * @description SPARQL queries for New Concept operation
 */

const NewConceptSPARQL = {
    /**
     * Get predicates from tech object
     * @param {string} techObjectUri - URI of tech object
     * @returns {string} SPARQL SELECT query
     */
    GET_PREDICATES: (techObjectUri) => `
        PREFIX vad: <http://example.org/vad#>
        SELECT ?predicate WHERE {
            <${techObjectUri}> vad:includePredicate ?predicate .
        }
    `,

    /**
     * Generate INSERT query for new concept
     * @param {Object} params - Query parameters
     * @returns {string} SPARQL INSERT DATA query
     */
    INSERT_CONCEPT: ({ graphUri, subjectUri, triples }) => {
        // Build query
    }
};

export { NewConceptSPARQL };
```

### 6.2 Logic Module Template

```javascript
/**
 * @file new-concept-logic.js
 * @module new-concept-logic
 * @description Business logic for New Concept operation
 */

import { NewConceptSPARQL } from './new-concept-sparql.js';
import { EventBus } from '../../core/event-bus.js';

const NewConceptLogic = {
    state: {
        selectedType: null,
        predicates: [],
        fieldValues: {}
    },

    /**
     * Initialize the module
     */
    init() {
        EventBus.on('concept-type:selected', this.onTypeSelected.bind(this));
    },

    /**
     * Handle concept type selection
     * @param {string} type - Selected concept type
     */
    onTypeSelected(type) {
        this.state.selectedType = type;
        this.loadPredicates(type);
    },

    /**
     * Load predicates for concept type
     * @param {string} type - Concept type
     */
    loadPredicates(type) {
        // Execute SPARQL query and process results
    }
};

export { NewConceptLogic };
```

### 6.3 UI Module Template

```javascript
/**
 * @file new-concept-ui.js
 * @module new-concept-ui
 * @description UI components for New Concept operation
 */

import { EventBus } from '../../core/event-bus.js';

const NewConceptUI = {
    elements: {
        modal: null,
        typeSelect: null,
        fieldsContainer: null
    },

    /**
     * Initialize UI elements
     */
    init() {
        this.elements.modal = document.getElementById('new-concept-modal');
        this.bindEvents();
    },

    /**
     * Bind UI event handlers
     */
    bindEvents() {
        this.elements.typeSelect?.addEventListener('change', (e) => {
            EventBus.emit('concept-type:selected', e.target.value);
        });
    },

    /**
     * Render predicate fields
     * @param {Array} predicates - List of predicates
     */
    renderFields(predicates) {
        // Build and insert HTML
    }
};

export { NewConceptUI };
```

## 7. Benefits of Proposed Structure

1. **Reusability**: Core modules (`rdf-parser.js`, `sparql-engine.js`) can be used in other projects
2. **Maintainability**: Clear separation makes code easier to understand and modify
3. **Testability**: Small, focused modules are easier to unit test
4. **Scalability**: New business operations follow established patterns
5. **Collaboration**: Multiple developers can work on different modules simultaneously

## 8. Migration Strategy

1. **Incremental Approach**: Refactor one business operation at a time
2. **Backward Compatibility**: Keep original files until migration complete
3. **Test Coverage**: Add tests before refactoring
4. **Documentation**: Update docs as modules are created

## 9. References

- Issue #230: Original requirements for code structure
- [VAD Ontology Documentation](../doc/term.md)
- [Current Implementation](../index.html)
