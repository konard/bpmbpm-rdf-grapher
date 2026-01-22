# Appendix to VAD Ontology

This document contains the appendices to the VAD Basic Ontology (`vad-basic-ontology.ttl`).

---

## Appendix 1: Subject Type - Predicate Matrix

Allowed predicates for each Subject Type. Used for filtering in Smart Design window (Predicate field depends on Subject Type).

**Connection to JS code:** constant `TYPE_PREDICATE_MAP` in `index.html`

### Process in ptree (vad:ptree)

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:Process | rdf:type | vad:Process | vad:ptree | Object type declaration |
| vad:Process | rdfs:label | Literal (string) | vad:ptree | Process name |
| vad:Process | dcterms:description | Literal (string) | vad:ptree | Process description |
| vad:Process | vad:hasTrig | vad:VADProcessDia | vad:ptree | Reference to detailed schema (if exists) |

### Process in VADProcessDia

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:Process | vad:isSubprocessTrig | vad:VADProcessDia | VADProcessDia | Reference to containing TriG (added first!) |
| vad:Process | vad:hasExecutor | vad:ExecutorGroup | VADProcessDia | Process executor group |
| vad:Process | vad:processSubtype | vad:Basic / vad:Detailed / vad:DetailedChild / vad:DetailedExternal | VADProcessDia | Process subtype |
| vad:Process | vad:hasNext | vad:Process | VADProcessDia | Next process in the chain |

### Executor in rtree (vad:rtree)

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:Executor | rdf:type | vad:Executor | vad:rtree | Object type declaration |
| vad:Executor | rdfs:label | Literal (string) | vad:rtree | Executor name |

### ExecutorGroup in VADProcessDia

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:ExecutorGroup | rdf:type | vad:ExecutorGroup | VADProcessDia | Object type declaration |
| vad:ExecutorGroup | rdfs:label | Literal (string) | VADProcessDia | Group name (auto-generated) |
| vad:ExecutorGroup | vad:includes | vad:Executor | VADProcessDia | Included executors |

### VADProcessDia (Schema)

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:VADProcessDia | rdf:type | vad:VADProcessDia | VADProcessDia | Object type declaration |
| vad:VADProcessDia | rdfs:label | Literal (string) | VADProcessDia | Schema name |
| vad:VADProcessDia | vad:hasParentTrig | vad:VADProcessDia / vad:root | VADProcessDia | Parent TriG for hierarchy |
| vad:VADProcessDia | vad:definesProcess | vad:Process | VADProcessDia | Process that this schema defines |

### ProcessTree (vad:ptree)

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:ProcessTree | rdf:type | vad:ProcessTree | vad:ptree | Object type declaration |
| vad:ProcessTree | rdfs:label | Literal (string) | vad:ptree | Tree name |
| vad:ProcessTree | vad:hasParentTrig | vad:root | vad:ptree | Parent (always vad:root) |

### ExecutorTree (vad:rtree)

| Subject Type | Predicate | Object Type | Storage Graph | Description |
|--------------|-----------|-------------|---------------|-------------|
| vad:ExecutorTree | rdf:type | vad:ExecutorTree | vad:rtree | Object type declaration |
| vad:ExecutorTree | rdfs:label | Literal (string) | vad:rtree | Tree name |
| vad:ExecutorTree | vad:hasParentTrig | vad:root | vad:rtree | Parent (always vad:root) |

---

## Appendix 2: Property Groups

### Group 1: Common Process Properties (PTREE_PREDICATES)

Stored in `vad:ptree` for all objects of type `vad:Process`:

| # | Predicate | Object Type | Description |
|---|-----------|-------------|-------------|
| 1 | rdf:type | vad:Process | Object type declaration |
| 2 | rdfs:label | Literal (string) | Process name |
| 3 | dcterms:description | Literal (string) | Process description |
| 4 | vad:hasTrig | vad:VADProcessDia | Reference to detailed schema (if exists) |

**Connection to JS code:** constant `PTREE_PREDICATES`

### Group 2: Individual Process Properties (VADProcessDia context)

Stored in corresponding `VADProcessDia`:

| # | Predicate | Object Type | Description |
|---|-----------|-------------|-------------|
| 1 | vad:isSubprocessTrig | vad:VADProcessDia | Reference to containing TriG (added first!) |
| 2 | vad:hasExecutor | vad:ExecutorGroup | Process executor group |
| 3 | vad:processSubtype | vad:Basic / vad:Detailed / vad:DetailedChild / vad:DetailedExternal | Process subtype |
| 4 | vad:hasNext | vad:Process | Next process in the chain |

**Note:** Order of predicates when creating a new Process in VADProcessDia:
1. `vad:isSubprocessTrig` - reference to TriG (first!)
2. `vad:hasExecutor` - executor group
3. `vad:processSubtype` - process subtype
4. `vad:hasNext` - next process (optional)

### Group 3: Common Executor Properties (RTREE_PREDICATES)

Stored in `vad:rtree` for all objects of type `vad:Executor`:

| # | Predicate | Object Type | Description |
|---|-----------|-------------|-------------|
| 1 | rdf:type | vad:Executor | Object type declaration |
| 2 | rdfs:label | Literal (string) | Executor name |

**Connection to JS code:** constant `RTREE_PREDICATES`

### Group 4: ExecutorGroup Properties

Stored in corresponding `VADProcessDia`:

| # | Predicate | Object Type | Description |
|---|-----------|-------------|-------------|
| 1 | rdf:type | vad:ExecutorGroup | Object type declaration |
| 2 | rdfs:label | Literal (string) | Group name (auto-generated) |
| 3 | vad:includes | vad:Executor | Included executors |

### Group 5: Schema Properties (VADProcessDia)

Stored in corresponding TriG (`VADProcessDia`):

| # | Predicate | Object Type | Description |
|---|-----------|-------------|-------------|
| 1 | rdf:type | vad:VADProcessDia | Object type declaration |
| 2 | rdfs:label | Literal (string) | Schema name |
| 3 | vad:hasParentTrig | vad:VADProcessDia / vad:root | Parent TriG for hierarchy |
| 4 | vad:definesProcess | vad:Process | Process that this schema defines |

---

## Appendix 3: Allowed Types and Predicates

### Allowed Types (VAD_ALLOWED_TYPES)

| Type | Description |
|------|-------------|
| vad:Process | Business process |
| vad:ExecutorGroup | Executor group |
| vad:Executor | Individual executor |
| vad:VADProcessDia | Process schema (TriG) |
| vad:ProcessTree | Process tree container |
| vad:ExecutorTree | Executor tree container |
| vad:Basic | Basic process subtype (no detailing) |
| vad:Detailed | Detailed process subtype (has child schema) |
| vad:DetailedChild | Detailed subprocess (child schema has hasParent to current) |
| vad:DetailedExternal | Detailed external process (child schema does NOT have hasParent to current) |

### Allowed Predicates (VAD_ALLOWED_PREDICATES)

| Predicate | Domain | Range | Description |
|-----------|--------|-------|-------------|
| rdf:type | any | Type | Object type declaration |
| rdfs:label | any | Literal | Name/label |
| dcterms:description | vad:Process | Literal | Process description |
| vad:hasTrig | vad:Process | vad:VADProcessDia | Reference to detailed schema |
| vad:definesProcess | vad:VADProcessDia | vad:Process | Inverse of hasTrig |
| vad:hasNext | vad:Process | vad:Process | Next process in chain |
| vad:isSubprocessTrig | vad:Process | vad:VADProcessDia | Process belongs to TriG |
| vad:hasExecutor | vad:Process | vad:ExecutorGroup | Process executor group |
| vad:processSubtype | vad:Process | Subtype class | Process subtype |
| vad:hasParentTrig | TriG types | TriG types / vad:root | Parent TriG for hierarchy |
| vad:includes | vad:ExecutorGroup | vad:Executor | Include executor in group |

---

## Appendix 4: Storage Rules

### Triple Storage Rules

| Condition | Target Graph |
|-----------|--------------|
| Subject is vad:Process AND predicate is in PTREE_PREDICATES | vad:ptree |
| Subject is vad:Executor AND predicate is in RTREE_PREDICATES | vad:rtree |
| Adding rdf:type vad:Process | vad:ptree |
| Adding rdf:type vad:Executor | vad:rtree |
| Other triples | Selected TriG (VADProcessDia) |

### PTREE_PREDICATES (for Process in ptree)

```
rdf:type
rdfs:label
dcterms:description
vad:hasTrig
```

### RTREE_PREDICATES (for Executor in rtree)

```
rdf:type
rdfs:label
```

---

## Notes

1. **Process** has different allowed predicates depending on context (ptree or VADProcessDia)
2. **ProcessTree** and **ExecutorTree** are special types for ptree and rtree containers
3. Process subtypes (**Basic**, **Detailed**, **DetailedChild**, **DetailedExternal**) inherit predicates from **Process**
4. **hasParentTrig** is used ONLY for TriG graphs, NOT for Process objects
5. When creating a new Process in VADProcessDia, **vad:isSubprocessTrig** should be added first
6. Relationships not listed in the ontology or in the TrigVADv2 example (index.html) are NOT allowed

---

*This document is generated from the VAD Basic Ontology (vad-basic-ontology.ttl)*
