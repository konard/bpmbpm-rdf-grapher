# Domain-Specific Language (DSL) for Process Modeling

## 1. Overview

This document proposes a Domain-Specific Language (DSL) for ver8tree that reflects the core VAD ontology concepts and enables structured code generation using SPARQL-driven programming.

## 2. Core Domain Concepts

Based on [term.md](../doc/term.md) and the VAD ontology files:

### 2.1 Primary Entities

| Concept | Ontology Class | Location | Description |
|---------|----------------|----------|-------------|
| **Process Concept** | `vad:TypeProcess` | `vad:ptree` | Type definition of a process |
| **Executor Concept** | `vad:TypeExecutor` | `vad:rtree` | Type definition of a role/executor |
| **Process Individ** | (TypeProcess in TriG) | VADProcessDia | Instance of process in schema |
| **Executor Individ** | (via vad:includes) | VADProcessDia | Instance of executor in schema |
| **Process Schema** | `vad:VADProcessDia` | Named graph | Detailed process diagram |
| **Executor Group** | `vad:ExecutorGroup` | VADProcessDia | Group of executors for a process |

### 2.2 Key Relationships

| Predicate | Domain → Range | Meaning |
|-----------|----------------|---------|
| `hasParentObj` | Entity → Entity | Hierarchy parent |
| `hasTrig` | TypeProcess → VADProcessDia | Concept has schema |
| `isSubprocessTrig` | TypeProcess → VADProcessDia | Individ belongs to schema |
| `hasExecutor` | TypeProcess → ExecutorGroup | Process has executor group |
| `includes` | ExecutorGroup → TypeExecutor | Group includes executor |
| `hasNext` | TypeProcess → TypeProcess | Sequence order |

### 2.3 Process Subtypes

| Subtype | Has Schema | Used as Individ | Description |
|---------|------------|-----------------|-------------|
| `Detailed` | Yes | No | Detailed but not used elsewhere |
| `DetailedChild` | Yes | Yes (same level) | Detailed and used as child |
| `DetailedExternal` | Yes | Yes (other level) | Detailed and used externally |
| `notDetailed` | No | No | Not detailed, not used |
| `notDetailedChild` | No | Yes (same level) | Not detailed, used as child |
| `notDetailedExternal` | No | Yes (other level) | Not detailed, used externally |
| `NotDefinedType` | - | - | Type not determinable |

## 3. DSL Syntax Proposal

### 3.1 Design Goals

1. **Readable**: Human-friendly syntax
2. **Typed**: Strongly typed entities
3. **Hierarchical**: Reflects parent-child relationships
4. **Executable**: Compiles to SPARQL
5. **Validatable**: Can check constraints

### 3.2 Basic Syntax

```
// DSL for VAD Process Modeling

// Define executor hierarchy (rtree)
EXECUTOR_TREE {
    department "IT Department" {
        developer "Developer"
        tester "QA Tester"
        manager "Project Manager"
    }
    department "Sales" {
        salesRep "Sales Representative"
        accountMgr "Account Manager"
    }
}

// Define process hierarchy (ptree)
PROCESS_TREE {
    mainProcess "Order Management" {
        receiveOrder "Receive Order" [DETAILED]
        validateOrder "Validate Order"
        processPayment "Process Payment" [DETAILED]
        shipOrder "Ship Order"
    }
}

// Define process schema (TriG)
SCHEMA receiveOrder {
    SUBPROCESS checkInventory "Check Inventory"
        EXECUTOR: department.developer
        NEXT: prepareInvoice

    SUBPROCESS prepareInvoice "Prepare Invoice"
        EXECUTOR: department.salesRep
        NEXT: notifyCustomer

    SUBPROCESS notifyCustomer "Notify Customer"
        EXECUTOR: department.accountMgr
}
```

### 3.3 Formal Grammar (EBNF)

```ebnf
program       = statement* ;

statement     = executor_tree
              | process_tree
              | schema_def
              ;

executor_tree = "EXECUTOR_TREE" "{" executor_group* "}" ;
executor_group = identifier label "{" executor_def* "}" ;
executor_def   = identifier label ;

process_tree  = "PROCESS_TREE" "{" process_def* "}" ;
process_def   = identifier label attributes? "{" process_def* "}" ;
attributes    = "[" attribute ("," attribute)* "]" ;
attribute     = "DETAILED" | "NOT_DETAILED" | custom_attr ;

schema_def    = "SCHEMA" identifier "{" subprocess_def* "}" ;
subprocess_def = "SUBPROCESS" identifier label
                 "EXECUTOR:" executor_ref
                 ("NEXT:" identifier)? ;

executor_ref  = identifier ("." identifier)* ;
identifier    = [a-zA-Z][a-zA-Z0-9_]* ;
label         = '"' [^"]* '"' ;
```

## 4. DSL to SPARQL Compilation

### 4.1 Compiler Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   DSL Source │────>│    Parser    │────>│     AST      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                     ┌──────────────┐           │
                     │   SPARQL     │<──────────┘
                     │   Generator  │
                     └──────────────┘
                            │
                     ┌──────────────┐
                     │   SPARQL     │
                     │   Queries    │
                     └──────────────┘
```

### 4.2 AST Structure

```javascript
// Abstract Syntax Tree for DSL

const ast = {
    type: 'Program',
    executorTree: {
        type: 'ExecutorTree',
        groups: [
            {
                type: 'ExecutorGroup',
                id: 'department',
                label: 'IT Department',
                executors: [
                    { type: 'Executor', id: 'developer', label: 'Developer' },
                    { type: 'Executor', id: 'tester', label: 'QA Tester' }
                ]
            }
        ]
    },
    processTree: {
        type: 'ProcessTree',
        processes: [
            {
                type: 'Process',
                id: 'mainProcess',
                label: 'Order Management',
                attributes: [],
                children: [
                    { type: 'Process', id: 'receiveOrder', label: 'Receive Order', attributes: ['DETAILED'] }
                ]
            }
        ]
    },
    schemas: [
        {
            type: 'Schema',
            processId: 'receiveOrder',
            subprocesses: [
                {
                    type: 'Subprocess',
                    id: 'checkInventory',
                    label: 'Check Inventory',
                    executor: ['department', 'developer'],
                    next: 'prepareInvoice'
                }
            ]
        }
    ]
};
```

### 4.3 SPARQL Generation

```javascript
/**
 * DSL Compiler - Generates SPARQL from AST
 */
class DSLCompiler {

    /**
     * Compile executor tree to SPARQL
     */
    compileExecutorTree(tree) {
        const queries = [];

        tree.groups.forEach(group => {
            // Create group concept
            queries.push(`
INSERT DATA {
    GRAPH vad:rtree {
        vad:${group.id} a vad:TypeExecutor ;
            rdfs:label "${group.label}" ;
            vad:hasParentObj vad:rtree .
    }
}`);

            // Create child executors
            group.executors.forEach(executor => {
                queries.push(`
INSERT DATA {
    GRAPH vad:rtree {
        vad:${executor.id} a vad:TypeExecutor ;
            rdfs:label "${executor.label}" ;
            vad:hasParentObj vad:${group.id} .
    }
}`);
            });
        });

        return queries.join(';\n\n');
    }

    /**
     * Compile process tree to SPARQL
     */
    compileProcessTree(tree, parentUri = 'vad:ptree') {
        const queries = [];

        const compileProcess = (process, parent) => {
            // Create process concept
            queries.push(`
INSERT DATA {
    GRAPH vad:ptree {
        vad:${process.id} a vad:TypeProcess ;
            rdfs:label "${process.label}" ;
            vad:hasParentObj ${parent} .
    }
}`);

            // If DETAILED, create schema placeholder
            if (process.attributes.includes('DETAILED')) {
                queries.push(`
INSERT DATA {
    vad:${process.id}_trig a vad:VADProcessDia ;
        vad:hasParentObj vad:${process.id} .

    GRAPH vad:ptree {
        vad:${process.id} vad:hasTrig vad:${process.id}_trig .
    }
}`);
            }

            // Recurse for children
            if (process.children) {
                process.children.forEach(child => {
                    compileProcess(child, `vad:${process.id}`);
                });
            }
        };

        tree.processes.forEach(p => compileProcess(p, parentUri));
        return queries.join(';\n\n');
    }

    /**
     * Compile schema definition to SPARQL
     */
    compileSchema(schema) {
        const trigUri = `vad:${schema.processId}_trig`;
        const queries = [];

        let previousId = null;

        schema.subprocesses.forEach(subprocess => {
            const executorUri = `vad:${subprocess.executor.join('_')}`;
            const groupUri = `vad:${subprocess.id}_ExecutorGroup_`;

            // Add subprocess individ
            let sparql = `
INSERT DATA {
    GRAPH ${trigUri} {
        vad:${subprocess.id} vad:isSubprocessTrig ${trigUri} ;
            vad:hasExecutor ${groupUri} .

        ${groupUri} a vad:ExecutorGroup ;
            vad:includes ${executorUri} .
    }
}`;

            // Add hasNext link if there's a next
            if (subprocess.next) {
                sparql += `;\n\nINSERT DATA {
    GRAPH ${trigUri} {
        vad:${subprocess.id} vad:hasNext vad:${subprocess.next} .
    }
}`;
            }

            queries.push(sparql);
            previousId = subprocess.id;
        });

        return queries.join(';\n\n');
    }

    /**
     * Compile full program
     */
    compile(ast) {
        const parts = [];

        // Add prefixes
        parts.push(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>
`);

        // Compile each section
        if (ast.executorTree) {
            parts.push('# === EXECUTOR TREE ===');
            parts.push(this.compileExecutorTree(ast.executorTree));
        }

        if (ast.processTree) {
            parts.push('# === PROCESS TREE ===');
            parts.push(this.compileProcessTree(ast.processTree));
        }

        if (ast.schemas) {
            ast.schemas.forEach(schema => {
                parts.push(`# === SCHEMA: ${schema.processId} ===`);
                parts.push(this.compileSchema(schema));
            });
        }

        return parts.join('\n\n');
    }
}
```

## 5. DSL Examples

### 5.1 Simple Process Definition

```
// DSL
PROCESS_TREE {
    orderProcess "Order Processing" [DETAILED] {
        receiveOrder "Receive Order"
        validateOrder "Validate Order"
        fulfillOrder "Fulfill Order"
    }
}

// Generated SPARQL
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

INSERT DATA {
    GRAPH vad:ptree {
        vad:orderProcess a vad:TypeProcess ;
            rdfs:label "Order Processing" ;
            vad:hasParentObj vad:ptree .

        vad:receiveOrder a vad:TypeProcess ;
            rdfs:label "Receive Order" ;
            vad:hasParentObj vad:orderProcess .

        vad:validateOrder a vad:TypeProcess ;
            rdfs:label "Validate Order" ;
            vad:hasParentObj vad:orderProcess .

        vad:fulfillOrder a vad:TypeProcess ;
            rdfs:label "Fulfill Order" ;
            vad:hasParentObj vad:orderProcess .
    }
};

INSERT DATA {
    vad:orderProcess_trig a vad:VADProcessDia ;
        vad:hasParentObj vad:orderProcess .

    GRAPH vad:ptree {
        vad:orderProcess vad:hasTrig vad:orderProcess_trig .
    }
}
```

### 5.2 Complete Workflow Definition

```
// DSL - Complete order workflow

EXECUTOR_TREE {
    salesDept "Sales Department" {
        salesRep "Sales Representative"
        salesMgr "Sales Manager"
    }
    warehouse "Warehouse" {
        picker "Order Picker"
        shipper "Shipping Clerk"
    }
    finance "Finance" {
        accountant "Accountant"
    }
}

PROCESS_TREE {
    orderWorkflow "Order Workflow" [DETAILED] {
        receiveOrder "Receive Order"
        approveOrder "Approve Order"
        pickItems "Pick Items"
        shipOrder "Ship Order"
        invoiceCustomer "Invoice Customer"
    }
}

SCHEMA orderWorkflow {
    SUBPROCESS receiveOrder
        EXECUTOR: salesDept.salesRep
        NEXT: approveOrder

    SUBPROCESS approveOrder
        EXECUTOR: salesDept.salesMgr
        NEXT: pickItems

    SUBPROCESS pickItems
        EXECUTOR: warehouse.picker
        NEXT: shipOrder

    SUBPROCESS shipOrder
        EXECUTOR: warehouse.shipper
        NEXT: invoiceCustomer

    SUBPROCESS invoiceCustomer
        EXECUTOR: finance.accountant
}
```

### 5.3 Nested Schema Definition

```
// DSL - Nested detailed processes

PROCESS_TREE {
    mainProcess "Main Process" [DETAILED] {
        phase1 "Phase 1" [DETAILED] {
            step1_1 "Step 1.1"
            step1_2 "Step 1.2"
        }
        phase2 "Phase 2" {
            step2_1 "Step 2.1"
        }
    }
}

SCHEMA mainProcess {
    SUBPROCESS phase1
        EXECUTOR: team.lead
        NEXT: phase2

    SUBPROCESS phase2
        EXECUTOR: team.member
}

SCHEMA phase1 {
    SUBPROCESS step1_1
        EXECUTOR: team.analyst
        NEXT: step1_2

    SUBPROCESS step1_2
        EXECUTOR: team.developer
}
```

## 6. JavaScript Integration

### 6.1 DSL API

```javascript
/**
 * High-level DSL API for ver8tree
 */
const VAD = {
    /**
     * Define executor hierarchy
     */
    executors(definition) {
        return new ExecutorTreeBuilder(definition);
    },

    /**
     * Define process hierarchy
     */
    processes(definition) {
        return new ProcessTreeBuilder(definition);
    },

    /**
     * Define process schema
     */
    schema(processId, definition) {
        return new SchemaBuilder(processId, definition);
    },

    /**
     * Parse DSL string and compile
     */
    compile(dslSource) {
        const parser = new DSLParser();
        const ast = parser.parse(dslSource);
        const compiler = new DSLCompiler();
        return compiler.compile(ast);
    }
};

// Usage - Programmatic API
const executorSparql = VAD.executors({
    itDept: {
        label: 'IT Department',
        children: {
            developer: 'Developer',
            tester: 'QA Tester'
        }
    }
}).toSPARQL();

// Usage - DSL String
const dslSource = `
EXECUTOR_TREE {
    itDept "IT Department" {
        developer "Developer"
        tester "QA Tester"
    }
}
`;
const sparql = VAD.compile(dslSource);
```

### 6.2 Builder Pattern API

```javascript
/**
 * Fluent builder for DSL constructs
 */
class ProcessBuilder {
    constructor(id, label) {
        this.process = { id, label, children: [], attributes: [] };
    }

    detailed() {
        this.process.attributes.push('DETAILED');
        return this;
    }

    child(id, label) {
        const child = new ProcessBuilder(id, label);
        this.process.children.push(child);
        return child;
    }

    schema(definition) {
        this.process.schema = definition;
        return this;
    }

    build() {
        return this.process;
    }

    toSPARQL() {
        const compiler = new DSLCompiler();
        return compiler.compileProcess(this.process);
    }
}

// Usage
const process = new ProcessBuilder('orderProcess', 'Order Processing')
    .detailed()
    .child('receiveOrder', 'Receive Order')
    .child('validateOrder', 'Validate Order')
    .child('fulfillOrder', 'Fulfill Order')
    .schema({
        receiveOrder: { executor: 'sales.rep', next: 'validateOrder' },
        validateOrder: { executor: 'sales.mgr', next: 'fulfillOrder' },
        fulfillOrder: { executor: 'warehouse.staff' }
    })
    .build();

console.log(process.toSPARQL());
```

## 7. Validation Rules

### 7.1 DSL Validation

```javascript
/**
 * Validate DSL before compilation
 */
class DSLValidator {

    validate(ast) {
        const errors = [];

        // Rule 1: All referenced executors must exist
        ast.schemas?.forEach(schema => {
            schema.subprocesses.forEach(sp => {
                if (!this.executorExists(ast.executorTree, sp.executor)) {
                    errors.push({
                        type: 'UNDEFINED_EXECUTOR',
                        message: `Executor ${sp.executor.join('.')} not defined`,
                        location: { schema: schema.processId, subprocess: sp.id }
                    });
                }
            });
        });

        // Rule 2: NEXT references must exist in same schema
        ast.schemas?.forEach(schema => {
            const ids = schema.subprocesses.map(sp => sp.id);
            schema.subprocesses.forEach(sp => {
                if (sp.next && !ids.includes(sp.next)) {
                    errors.push({
                        type: 'INVALID_NEXT',
                        message: `NEXT reference ${sp.next} not found in schema`,
                        location: { schema: schema.processId, subprocess: sp.id }
                    });
                }
            });
        });

        // Rule 3: Schema must reference existing DETAILED process
        ast.schemas?.forEach(schema => {
            const process = this.findProcess(ast.processTree, schema.processId);
            if (!process) {
                errors.push({
                    type: 'SCHEMA_NO_PROCESS',
                    message: `Schema references undefined process: ${schema.processId}`
                });
            } else if (!process.attributes.includes('DETAILED')) {
                errors.push({
                    type: 'SCHEMA_NOT_DETAILED',
                    message: `Process ${schema.processId} must have DETAILED attribute`
                });
            }
        });

        return { valid: errors.length === 0, errors };
    }
}
```

## 8. Benefits of DSL Approach

1. **Abstraction**: Hide RDF/SPARQL complexity
2. **Readability**: Business analysts can understand
3. **Validation**: Catch errors before compilation
4. **Consistency**: Enforce ontology patterns
5. **Documentation**: DSL serves as specification
6. **Tooling**: Syntax highlighting, auto-complete possible

## 9. Future Extensions

### 9.1 Conditional Logic

```
SCHEMA orderProcess {
    SUBPROCESS receiveOrder
        EXECUTOR: sales.rep
        NEXT: validateOrder

    SUBPROCESS validateOrder
        EXECUTOR: sales.mgr
        IF valid THEN fulfillOrder
        ELSE rejectOrder
}
```

### 9.2 Parallel Execution

```
SCHEMA manufacturing {
    SUBPROCESS prepareComponents
        EXECUTOR: workshop.prep
        PARALLEL: [assemblyA, assemblyB]

    SUBPROCESS assemblyA
        EXECUTOR: workshop.teamA
        JOIN: finalAssembly

    SUBPROCESS assemblyB
        EXECUTOR: workshop.teamB
        JOIN: finalAssembly

    SUBPROCESS finalAssembly
        EXECUTOR: workshop.final
}
```

## 10. References

- [VAD Ontology](../vad-basic-ontology.ttl)
- [Technical Appendix](../vad-basic-ontology_tech_Appendix.ttl)
- [Terminology](../doc/term.md)
- [SPARQL Research](./SPARQL.md)
- [Macro Functions](./macro-functions.md)
