# Macro-Functions Architecture for ver8tree

## 1. Overview

This document proposes a macro-function grouping approach for ver8tree that enables writing higher-level, more aggregated code by combining atomic operations into reusable macro-functions with minimal JavaScript scaffolding.

## 2. Concept

### 2.1 What are Macro-Functions?

Macro-functions are high-level operations composed of multiple atomic operations that:
- Encapsulate common multi-step workflows
- Provide a declarative API for complex operations
- Minimize boilerplate JavaScript code
- Enable composition of operations through chaining

### 2.2 Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                 User Code (Minimal JS)               │
│   Macro.createProcessSchema('vad:p1', 'Process 1')  │
└───────────────────────────┬─────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────┐
│               Macro-Functions Layer                  │
│   createProcessSchema = concept + trig + default    │
└───────────────────────────┬─────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────┐
│               Atomic Operations Layer               │
│   createConcept, createTriG, addIndivid, etc.       │
└───────────────────────────┬─────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────┐
│                 SPARQL Layer                         │
│   INSERT DATA, DELETE WHERE, SELECT, CONSTRUCT      │
└─────────────────────────────────────────────────────┘
```

## 3. Atomic Operations

### 3.1 Core Atomic Operations

| Operation | Description | SPARQL Type |
|-----------|-------------|-------------|
| `createConcept` | Create TypeProcess/TypeExecutor in ptree/rtree | INSERT DATA |
| `deleteConcept` | Remove concept from ptree/rtree | DELETE WHERE |
| `createTriG` | Create VADProcessDia graph | INSERT DATA |
| `deleteTriG` | Remove entire TriG graph | DROP GRAPH |
| `addIndivid` | Add process individ to TriG | INSERT DATA |
| `removeIndivid` | Remove individ from TriG | DELETE WHERE |
| `addExecutorGroup` | Create ExecutorGroup in TriG | INSERT DATA |
| `addExecutorToGroup` | Add includes to ExecutorGroup | INSERT DATA |
| `linkConcepts` | Add hasParentObj, hasNext, etc. | INSERT DATA |
| `unlinkConcepts` | Remove predicate between concepts | DELETE DATA |
| `setLabel` | Set/update rdfs:label | DELETE/INSERT |
| `getChildren` | Get concepts with hasParentObj | SELECT |
| `getIndivids` | Get individs in TriG | SELECT |

### 3.2 Atomic Operation API

```javascript
/**
 * Atomic Operations Module
 */
const AtomicOps = {
    /**
     * Create a new concept in ptree or rtree
     * @param {Object} params
     * @returns {Object} { sparql: string, conceptUri: string }
     */
    createConcept({ type, parentUri, label, graphUri }) {
        const conceptUri = this._generateUri(type, label);
        const sparql = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH ${graphUri} {
        ${conceptUri} rdf:type ${type} ;
                      rdfs:label "${label}" ;
                      vad:hasParentObj ${parentUri} .
    }
}`;
        return { sparql, conceptUri };
    },

    /**
     * Create a new TriG (VADProcessDia)
     */
    createTriG({ conceptUri }) {
        const trigUri = `${conceptUri}_trig`;
        const sparql = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    ${trigUri} rdf:type vad:VADProcessDia ;
               vad:hasParentObj ${conceptUri} .

    GRAPH vad:ptree {
        ${conceptUri} vad:hasTrig ${trigUri} .
    }
}`;
        return { sparql, trigUri };
    },

    /**
     * Add process individ to TriG
     */
    addIndivid({ processUri, trigUri, executorUri }) {
        const groupUri = `${processUri}_ExecutorGroup_`;
        const sparql = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH ${trigUri} {
        ${processUri} vad:isSubprocessTrig ${trigUri} ;
                      vad:hasExecutor ${groupUri} .
        ${groupUri} rdf:type vad:ExecutorGroup ;
                    vad:includes ${executorUri} .
    }
}`;
        return { sparql, groupUri };
    },

    // ... more atomic operations
};
```

## 4. Macro-Functions

### 4.1 Macro-Function Definitions

```javascript
/**
 * Macro-Functions Module
 * High-level operations composed of atomic operations
 */
const MacroFunctions = {

    // ═══════════════════════════════════════════════════════════════════
    // PROCESS SCHEMA CREATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Create complete process schema (concept + TriG + default individ)
     *
     * Composes:
     *   1. createConcept (TypeProcess in ptree)
     *   2. createTriG (VADProcessDia)
     *   3. addIndivid (first subprocess)
     *
     * @example
     * Macro.createProcessSchema('vad:p1', 'Main Process', 'vad:ptree', 'vad:r1')
     */
    createProcessSchema({ conceptUri, label, parentUri, defaultExecutor }) {
        const results = [];

        // Step 1: Create concept
        const concept = AtomicOps.createConcept({
            type: 'vad:TypeProcess',
            parentUri,
            label,
            graphUri: 'vad:ptree'
        });
        results.push({ step: 'createConcept', ...concept });

        // Step 2: Create TriG
        const trig = AtomicOps.createTriG({
            conceptUri: concept.conceptUri
        });
        results.push({ step: 'createTriG', ...trig });

        // Step 3: Add default individ if executor provided
        if (defaultExecutor) {
            const individ = AtomicOps.addIndivid({
                processUri: concept.conceptUri,
                trigUri: trig.trigUri,
                executorUri: defaultExecutor
            });
            results.push({ step: 'addIndivid', ...individ });
        }

        // Combine all SPARQL
        const combinedSparql = results
            .map(r => r.sparql)
            .join(';\n\n');

        return {
            results,
            sparql: combinedSparql,
            conceptUri: concept.conceptUri,
            trigUri: trig.trigUri
        };
    },

    // ═══════════════════════════════════════════════════════════════════
    // SUBPROCESS ADDITION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Add subprocess to existing schema
     *
     * Composes:
     *   1. createConcept (child TypeProcess)
     *   2. addIndivid (in parent's TriG)
     *   3. linkConcepts (hasNext if previous provided)
     *
     * @example
     * Macro.addSubprocess('vad:p1_trig', 'vad:p1.1', 'Step 1', 'vad:r1', 'vad:p1.0')
     */
    addSubprocess({ trigUri, conceptUri, label, executorUri, previousUri = null }) {
        const results = [];

        // Step 1: Create subprocess concept
        const concept = AtomicOps.createConcept({
            type: 'vad:TypeProcess',
            parentUri: this._getParentFromTrig(trigUri),
            label,
            graphUri: 'vad:ptree'
        });
        results.push({ step: 'createConcept', ...concept });

        // Step 2: Add individ to TriG
        const individ = AtomicOps.addIndivid({
            processUri: concept.conceptUri,
            trigUri,
            executorUri
        });
        results.push({ step: 'addIndivid', ...individ });

        // Step 3: Link to previous if provided
        if (previousUri) {
            const link = AtomicOps.linkConcepts({
                subjectUri: previousUri,
                predicateUri: 'vad:hasNext',
                objectUri: concept.conceptUri,
                graphUri: trigUri
            });
            results.push({ step: 'linkConcepts', ...link });
        }

        return {
            results,
            sparql: results.map(r => r.sparql).join(';\n\n'),
            conceptUri: concept.conceptUri
        };
    },

    // ═══════════════════════════════════════════════════════════════════
    // PROCESS TREE BRANCH
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Create process tree branch (parent + multiple children)
     *
     * Composes:
     *   1. createProcessSchema (parent)
     *   2. addSubprocess × N (children)
     *
     * @example
     * Macro.createProcessBranch('vad:ptree', 'Main', [
     *   { label: 'Step 1', executor: 'vad:r1' },
     *   { label: 'Step 2', executor: 'vad:r2' },
     *   { label: 'Step 3', executor: 'vad:r1' }
     * ])
     */
    createProcessBranch({ parentUri, label, children, defaultExecutor }) {
        const results = [];

        // Step 1: Create parent schema
        const parent = this.createProcessSchema({
            conceptUri: null, // auto-generate
            label,
            parentUri,
            defaultExecutor
        });
        results.push({ step: 'createProcessSchema', ...parent });

        // Step 2: Create children with sequence
        let previousUri = null;
        children.forEach((child, index) => {
            const subprocess = this.addSubprocess({
                trigUri: parent.trigUri,
                conceptUri: null,
                label: child.label,
                executorUri: child.executor,
                previousUri
            });
            results.push({
                step: `addSubprocess[${index}]`,
                ...subprocess
            });
            previousUri = subprocess.conceptUri;
        });

        return {
            results,
            sparql: results.map(r => r.sparql).join(';\n\n'),
            rootUri: parent.conceptUri,
            trigUri: parent.trigUri
        };
    },

    // ═══════════════════════════════════════════════════════════════════
    // EXECUTOR TREE
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Create executor tree branch
     *
     * @example
     * Macro.createExecutorBranch('vad:rtree', 'Department', [
     *   'Manager',
     *   'Developer',
     *   'Tester'
     * ])
     */
    createExecutorBranch({ parentUri, label, children }) {
        const results = [];

        // Create parent executor
        const parent = AtomicOps.createConcept({
            type: 'vad:TypeExecutor',
            parentUri,
            label,
            graphUri: 'vad:rtree'
        });
        results.push({ step: 'createParent', ...parent });

        // Create children
        children.forEach((childLabel, index) => {
            const child = AtomicOps.createConcept({
                type: 'vad:TypeExecutor',
                parentUri: parent.conceptUri,
                label: childLabel,
                graphUri: 'vad:rtree'
            });
            results.push({ step: `createChild[${index}]`, ...child });
        });

        return {
            results,
            sparql: results.map(r => r.sparql).join(';\n\n'),
            rootUri: parent.conceptUri
        };
    },

    // ═══════════════════════════════════════════════════════════════════
    // DELETION MACROS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Delete process concept with all dependencies
     *
     * Composes:
     *   1. removeAllIndivids (from all TriGs)
     *   2. deleteTriG (if exists)
     *   3. unlinkFromParent
     *   4. deleteConcept
     */
    deleteProcessCascade({ conceptUri }) {
        const results = [];

        // Step 1: Find and remove individs
        const individs = AtomicOps.getIndivids({ conceptUri });
        individs.forEach(individ => {
            const remove = AtomicOps.removeIndivid(individ);
            results.push({ step: 'removeIndivid', ...remove });
        });

        // Step 2: Delete TriG if exists
        const trig = AtomicOps.getTrig({ conceptUri });
        if (trig) {
            const deleteTrig = AtomicOps.deleteTriG({ trigUri: trig });
            results.push({ step: 'deleteTriG', ...deleteTrig });
        }

        // Step 3: Unlink children (reassign to grandparent)
        const children = AtomicOps.getChildren({ conceptUri, graphUri: 'vad:ptree' });
        const parentUri = AtomicOps.getParent({ conceptUri });
        children.forEach(child => {
            const relink = AtomicOps.linkConcepts({
                subjectUri: child,
                predicateUri: 'vad:hasParentObj',
                objectUri: parentUri,
                graphUri: 'vad:ptree'
            });
            results.push({ step: 'relinkChild', ...relink });
        });

        // Step 4: Delete concept
        const del = AtomicOps.deleteConcept({
            conceptUri,
            graphUri: 'vad:ptree'
        });
        results.push({ step: 'deleteConcept', ...del });

        return {
            results,
            sparql: results.map(r => r.sparql).join(';\n\n')
        };
    }
};
```

## 5. Fluent API (Builder Pattern)

### 5.1 Chainable Operations

```javascript
/**
 * Fluent API for building complex operations
 */
class VADBuilder {
    constructor() {
        this.operations = [];
    }

    /**
     * Start building a process
     */
    static process(label) {
        const builder = new VADBuilder();
        builder.currentLabel = label;
        builder.currentType = 'process';
        return builder;
    }

    /**
     * Set parent
     */
    under(parentUri) {
        this.parentUri = parentUri;
        return this;
    }

    /**
     * Add subprocess
     */
    withSubprocess(label, executor) {
        this.subprocesses = this.subprocesses || [];
        this.subprocesses.push({ label, executor });
        return this;
    }

    /**
     * Set default executor
     */
    executedBy(executorUri) {
        this.defaultExecutor = executorUri;
        return this;
    }

    /**
     * Build and return SPARQL
     */
    build() {
        return MacroFunctions.createProcessBranch({
            parentUri: this.parentUri,
            label: this.currentLabel,
            children: this.subprocesses || [],
            defaultExecutor: this.defaultExecutor
        });
    }
}

// Usage example - Fluent API
const result = VADBuilder
    .process('Order Processing')
    .under('vad:ptree')
    .executedBy('vad:orderDept')
    .withSubprocess('Receive Order', 'vad:clerk')
    .withSubprocess('Validate Order', 'vad:validator')
    .withSubprocess('Process Payment', 'vad:cashier')
    .withSubprocess('Ship Order', 'vad:warehouse')
    .build();

console.log(result.sparql);
```

## 6. Declarative Configuration

### 6.1 JSON-based Process Definition

```javascript
/**
 * Define processes via JSON configuration
 */
const processConfig = {
    "vad:orderProcess": {
        label: "Order Processing",
        parent: "vad:ptree",
        executor: "vad:orderDept",
        subprocesses: [
            {
                id: "vad:receiveOrder",
                label: "Receive Order",
                executor: "vad:clerk",
                next: "vad:validateOrder"
            },
            {
                id: "vad:validateOrder",
                label: "Validate Order",
                executor: "vad:validator",
                next: "vad:processPayment"
            },
            {
                id: "vad:processPayment",
                label: "Process Payment",
                executor: "vad:cashier",
                next: "vad:shipOrder"
            },
            {
                id: "vad:shipOrder",
                label: "Ship Order",
                executor: "vad:warehouse"
            }
        ]
    }
};

// Convert config to SPARQL
const sparql = MacroFunctions.fromConfig(processConfig);
```

### 6.2 Template-based Generation

```javascript
/**
 * Templates for common process patterns
 */
const ProcessTemplates = {
    /**
     * Sequential process template
     */
    sequential(name, steps) {
        return {
            label: name,
            subprocesses: steps.map((step, i, arr) => ({
                label: step.label,
                executor: step.executor,
                next: i < arr.length - 1 ? arr[i + 1].id : null
            }))
        };
    },

    /**
     * Parallel process template (fork-join)
     */
    parallel(name, parallelSteps, joinStep) {
        return {
            label: name,
            fork: parallelSteps,
            join: joinStep
        };
    },

    /**
     * Approval workflow template
     */
    approvalWorkflow(name, approvers) {
        return this.sequential(name, [
            { label: 'Submit Request', executor: 'vad:requester' },
            ...approvers.map(a => ({
                label: `${a.role} Approval`,
                executor: a.executor
            })),
            { label: 'Complete', executor: 'vad:system' }
        ]);
    }
};

// Usage
const approvalProcess = ProcessTemplates.approvalWorkflow(
    'Purchase Approval',
    [
        { role: 'Manager', executor: 'vad:manager' },
        { role: 'Finance', executor: 'vad:finance' }
    ]
);
```

## 7. Integration Examples

### 7.1 Minimal JavaScript Usage

```javascript
// Traditional approach (verbose)
const concept1 = createConcept('vad:p1', 'Process 1', 'vad:ptree');
const trig1 = createTriG('vad:p1');
const individ1 = addIndivid('vad:p1.1', 'vad:p1_trig', 'vad:r1');
linkConcepts('vad:p1.1', 'vad:hasNext', 'vad:p1.2', 'vad:p1_trig');
// ... many more lines

// Macro approach (concise)
const result = Macro.createProcessBranch({
    parentUri: 'vad:ptree',
    label: 'Process 1',
    children: [
        { label: 'Step 1', executor: 'vad:r1' },
        { label: 'Step 2', executor: 'vad:r2' }
    ]
});

// Execute
executeUpdate(result.sparql);
```

### 7.2 Batch Operations

```javascript
// Create multiple processes at once
const batch = [
    Macro.createProcessSchema({ label: 'Process A', parentUri: 'vad:ptree' }),
    Macro.createProcessSchema({ label: 'Process B', parentUri: 'vad:ptree' }),
    Macro.createProcessSchema({ label: 'Process C', parentUri: 'vad:ptree' })
];

const batchSparql = batch.map(b => b.sparql).join(';\n\n');
executeUpdate(batchSparql);
```

## 8. Benefits

1. **Reduced Code Volume**: 10x less code for common operations
2. **Consistency**: Standard patterns ensure correct structure
3. **Readability**: High-level intent is clear
4. **Maintainability**: Changes in one place affect all usages
5. **Testability**: Macro-functions can be unit tested
6. **Documentation**: Self-documenting through function names

## 9. References

- [Code Structure](./code_structure.md)
- [Business Requirements](./business-requirements.md)
- [SPARQL Research](./SPARQL.md)
