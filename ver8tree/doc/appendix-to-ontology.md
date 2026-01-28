# Appendix to VAD Ontology (ver8tree)

This document contains the appendices to the VAD Ontology (`vad-basic-ontology.ttl` and `vad-basic-ontology_tech_Appendix.ttl`).

---

## Appendix 1: Class Hierarchy

### 1.1 Complete Type Hierarchy Table

| Level | Class | Parent Class | Type | Description |
|-------|-------|--------------|------|-------------|
| 1 | `vad:ObjectTree` | — | Base class | Base class for object trees |
| 2 | `vad:ProcessTree` | `vad:ObjectTree` | Tree container | Process tree container (ptree) |
| 2 | `vad:ExecutorTree` | `vad:ObjectTree` | Tree container | Executor tree container (rtree) |
| 2 | `vad:TechTree` | `vad:ObjectTree` | Tree container | Technology tree container (techtree) |
| 1 | `vad:VADProcessDia` | — | Named graph | Process diagram (TriG named graph) |
| 1 | `vad:TypeProcess` | — | Meta-type | Process meta-type |
| 2 | `vad:Detailed` | `vad:TypeProcess` | Process subtype | Detailed process (has child schema) |
| 3 | `vad:DetailedChild` | `vad:Detailed` | Process subtype | Detailed child subprocess |
| 3 | `vad:DetailedExternal` | `vad:Detailed` | Process subtype | Detailed external process |
| 2 | `vad:notDetailed` | `vad:TypeProcess` | Process subtype | Non-detailed process (no detailing) |
| 3 | `vad:notDetailedChild` | `vad:notDetailed` | Process subtype | Non-detailed child subprocess |
| 3 | `vad:notDetailedExternal` | `vad:notDetailed` | Process subtype | Non-detailed external process |
| 2 | `vad:NotDefinedType` | `vad:TypeProcess` | Process subtype | Undefined process type |
| 1 | `vad:TypeExecutor` | — | Meta-type | Executor meta-type |
| 1 | `vad:ExecutorGroup` | — | Group class | Executor group class |

### 1.2 Technology Objects Hierarchy

| Level | Object | Parent | Type | Description |
|-------|--------|--------|------|-------------|
| 1 | `vad:techtree` | `vad:root` | `vad:TechTree` | Technology tree instance |
| 2 | `vad:ConceptProcessPredicate` | `vad:techtree` | Tech object | Process concept predicates definition |
| 2 | `vad:IndividProcessPredicate` | `vad:techtree` | Tech object | Process individual predicates definition |
| 2 | `vad:ConceptExecutorPredicate` | `vad:techtree` | Tech object | Executor concept predicates definition |
| 2 | `vad:ConceptExecutorGroupPredicate` | `vad:techtree` | Tech object | Executor group predicates definition |
| 2 | `vad:ConceptTriGPredicate` | `vad:techtree` | Tech object | TriG predicates definition |

---

## Appendix 2: Subject Type - Predicate Matrix

Allowed predicates for each Subject Type. Used for filtering in Smart Design window (Predicate field depends on Subject Type).

**Connection to JS code:** constant `TYPE_PREDICATE_MAP` in `index.html`

### 2.1 Process in ptree (vad:ptree)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:TypeProcess | rdf:type | vad:TypeProcess | vad:ptree | Yes | Object type declaration |
| vad:TypeProcess | rdfs:label | Literal (string) | vad:ptree | No | Process name |
| vad:TypeProcess | dcterms:description | Literal (string) | vad:ptree | No | Process description |
| vad:TypeProcess | vad:hasTrig | vad:VADProcessDia | vad:ptree | No | Reference to detailed schema (if exists) |

### 2.2 Process in VADProcessDia (Individual)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:TypeProcess | vad:isSubprocessTrig | vad:VADProcessDia | VADProcessDia | Yes | Reference to containing TriG (added first!) |
| vad:TypeProcess | vad:hasExecutor | vad:ExecutorGroup | VADProcessDia | Yes | Process executor group |
| vad:TypeProcess | vad:processSubtype | Process subtype | VADProcessDia | Yes* | Process subtype (computed via virtualRDFdata) |
| vad:TypeProcess | vad:hasNext | vad:TypeProcess | VADProcessDia | No | Next process in the chain |

*Note: `vad:processSubtype` is computed dynamically by `calculateProcessSubtypes()` function and stored in `virtualRDFdata`.

### 2.3 Executor in rtree (vad:rtree)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:TypeExecutor | rdf:type | vad:TypeExecutor | vad:rtree | Yes | Object type declaration |
| vad:TypeExecutor | rdfs:label | Literal (string) | vad:rtree | No | Executor name |

### 2.4 ExecutorGroup in VADProcessDia

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:ExecutorGroup | rdf:type | vad:ExecutorGroup | VADProcessDia | Yes | Object type declaration |
| vad:ExecutorGroup | rdfs:label | Literal (string) | VADProcessDia | Yes | Group name (auto-generated) |
| vad:ExecutorGroup | vad:includes | vad:TypeExecutor | VADProcessDia | No | Included executors |

### 2.5 VADProcessDia (Schema)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:VADProcessDia | rdf:type | vad:VADProcessDia | VADProcessDia | Yes | Object type declaration |
| vad:VADProcessDia | rdfs:label | Literal (string) | VADProcessDia | No | Schema name |
| vad:VADProcessDia | vad:hasParentObj | vad:VADProcessDia / vad:root | VADProcessDia | No | Parent TriG for hierarchy |
| vad:VADProcessDia | vad:definesProcess | vad:TypeProcess | VADProcessDia | No | Process that this schema defines |

### 2.6 ProcessTree (vad:ptree)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:ProcessTree | rdf:type | vad:ProcessTree | vad:ptree | Yes | Object type declaration |
| vad:ProcessTree | rdfs:label | Literal (string) | vad:ptree | No | Tree name |
| vad:ProcessTree | vad:hasParentObj | vad:root | vad:ptree | No | Parent (always vad:root) |

### 2.7 ExecutorTree (vad:rtree)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:ExecutorTree | rdf:type | vad:ExecutorTree | vad:rtree | Yes | Object type declaration |
| vad:ExecutorTree | rdfs:label | Literal (string) | vad:rtree | No | Tree name |
| vad:ExecutorTree | vad:hasParentObj | vad:root | vad:rtree | No | Parent (always vad:root) |

### 2.8 TechTree (vad:techtree)

| Subject Type | Predicate | Object Type | Storage Graph | Auto-gen | Description |
|--------------|-----------|-------------|---------------|----------|-------------|
| vad:TechTree | rdf:type | vad:TechTree | vad:techtree | Yes | Object type declaration |
| vad:TechTree | rdfs:label | Literal (string) | vad:techtree | No | Tree name |
| vad:TechTree | vad:hasParentObj | vad:root | vad:techtree | No | Parent (always vad:root) |

---

## Appendix 3: Property Groups

### Group 1: Common Process Properties (PTREE_PREDICATES)

Stored in `vad:ptree` for all objects of type `vad:TypeProcess`:

| # | Predicate | Object Type | Auto-gen | Description |
|---|-----------|-------------|----------|-------------|
| 1 | rdf:type | vad:TypeProcess | Yes | Object type declaration |
| 2 | rdfs:label | Literal (string) | No | Process name |
| 3 | dcterms:description | Literal (string) | No | Process description |
| 4 | vad:hasTrig | vad:VADProcessDia | No | Reference to detailed schema (if exists) |

**Connection to JS code:** constant `PTREE_PREDICATES`

### Group 2: Individual Process Properties (VADProcessDia context)

Stored in corresponding `VADProcessDia`:

| # | Predicate | Object Type | Auto-gen | Description |
|---|-----------|-------------|----------|-------------|
| 1 | vad:isSubprocessTrig | vad:VADProcessDia | Yes | Reference to containing TriG (added first!) |
| 2 | vad:hasExecutor | vad:ExecutorGroup | Yes | Process executor group |
| 3 | vad:processSubtype | Process subtype | Yes* | Process subtype (computed dynamically) |
| 4 | vad:hasNext | vad:TypeProcess | No | Next process in the chain |

**Note:** Order of predicates when creating a new Process in VADProcessDia:
1. `vad:isSubprocessTrig` - reference to TriG (first!)
2. `vad:hasExecutor` - executor group
3. `vad:processSubtype` - process subtype (auto-computed)
4. `vad:hasNext` - next process (optional)

### Group 3: Common Executor Properties (RTREE_PREDICATES)

Stored in `vad:rtree` for all objects of type `vad:TypeExecutor`:

| # | Predicate | Object Type | Auto-gen | Description |
|---|-----------|-------------|----------|-------------|
| 1 | rdf:type | vad:TypeExecutor | Yes | Object type declaration |
| 2 | rdfs:label | Literal (string) | No | Executor name |

**Connection to JS code:** constant `RTREE_PREDICATES`

### Group 4: ExecutorGroup Properties

Stored in corresponding `VADProcessDia`:

| # | Predicate | Object Type | Auto-gen | Description |
|---|-----------|-------------|----------|-------------|
| 1 | rdf:type | vad:ExecutorGroup | Yes | Object type declaration |
| 2 | rdfs:label | Literal (string) | Yes | Group name (auto-generated) |
| 3 | vad:includes | vad:TypeExecutor | No | Include executor in group |

### Group 5: Schema Properties (VADProcessDia)

Stored in corresponding TriG (`VADProcessDia`):

| # | Predicate | Object Type | Auto-gen | Description |
|---|-----------|-------------|----------|-------------|
| 1 | rdf:type | vad:VADProcessDia | Yes | Object type declaration |
| 2 | rdfs:label | Literal (string) | No | Schema name |
| 3 | vad:hasParentObj | vad:VADProcessDia / vad:root | No | Parent TriG for hierarchy |
| 4 | vad:definesProcess | vad:TypeProcess | No | Process that this schema defines |

---

## Appendix 4: Allowed Types and Predicates

### 4.1 Allowed Types (VAD_ALLOWED_TYPES)

| Type | Category | Description |
|------|----------|-------------|
| vad:TypeProcess | Meta-type | Business process meta-type |
| vad:ExecutorGroup | Class | Executor group |
| vad:TypeExecutor | Meta-type | Individual executor meta-type |
| vad:VADProcessDia | Class | Process schema (TriG) |
| vad:ProcessTree | Tree class | Process tree container |
| vad:ExecutorTree | Tree class | Executor tree container |
| vad:TechTree | Tree class | Technology tree container |
| vad:ObjectTree | Base class | Base tree class |
| vad:Detailed | Subtype | Detailed process subtype (has child schema) |
| vad:DetailedChild | Subtype | Detailed subprocess (child schema has hasParentObj to current) |
| vad:DetailedExternal | Subtype | Detailed external process (child schema does NOT have hasParentObj to current) |
| vad:notDetailed | Subtype | Non-detailed process subtype (no detailing) |
| vad:notDetailedChild | Subtype | Non-detailed child subprocess |
| vad:notDetailedExternal | Subtype | Non-detailed external subprocess |
| vad:NotDefinedType | Subtype | Undefined process type |

### 4.2 Allowed Predicates (VAD_ALLOWED_PREDICATES)

| Predicate | Domain | Range | Description |
|-----------|--------|-------|-------------|
| rdf:type | any | Type | Object type declaration |
| rdfs:label | any | Literal | Name/label |
| dcterms:description | vad:TypeProcess | Literal | Process description |
| vad:hasTrig | vad:TypeProcess | vad:VADProcessDia | Reference to detailed schema |
| vad:definesProcess | vad:VADProcessDia | vad:TypeProcess | Inverse of hasTrig |
| vad:hasNext | vad:TypeProcess | vad:TypeProcess | Next process in chain |
| vad:isSubprocessTrig | vad:TypeProcess | vad:VADProcessDia | Process belongs to TriG |
| vad:hasExecutor | vad:TypeProcess | vad:ExecutorGroup | Process executor group |
| vad:processSubtype | vad:TypeProcess | Subtype class | Process subtype (computed) |
| vad:hasParentObj | TriG/Tree types | TriG/Tree types / vad:root | Parent object for hierarchy |
| vad:includes | vad:ExecutorGroup | vad:TypeExecutor | Include executor in group |
| vad:hasAutoGenPredicate | Tech object | Predicate | Auto-generated predicate definition |

---

## Appendix 5: Storage Rules

### 5.1 Triple Storage Rules

| Condition | Target Graph |
|-----------|--------------|
| Subject is vad:TypeProcess AND predicate is in PTREE_PREDICATES | vad:ptree |
| Subject is vad:TypeExecutor AND predicate is in RTREE_PREDICATES | vad:rtree |
| Adding rdf:type vad:TypeProcess | vad:ptree |
| Adding rdf:type vad:TypeExecutor | vad:rtree |
| Other triples | Selected TriG (VADProcessDia) |

### 5.2 PTREE_PREDICATES (for Process in ptree)

```
rdf:type
rdfs:label
dcterms:description
vad:hasTrig
```

### 5.3 RTREE_PREDICATES (for Executor in rtree)

```
rdf:type
rdfs:label
```

---

## Appendix 6: Technology Appendix (vad-basic-ontology_tech_Appendix.ttl)

### 6.1 Auto-Generated Predicates

The technology appendix defines which predicates are automatically generated when creating new objects.

| Tech Object | Predicate | Auto-gen Predicates |
|-------------|-----------|---------------------|
| vad:ConceptProcessPredicate | vad:hasAutoGenPredicate | rdf:type |
| vad:IndividProcessPredicate | vad:hasAutoGenPredicate | vad:isSubprocessTrig, vad:hasExecutor, vad:processSubtype |
| vad:ConceptExecutorPredicate | vad:hasAutoGenPredicate | rdf:type |
| vad:ConceptExecutorGroupPredicate | vad:hasAutoGenPredicate | rdf:type, rdfs:label |
| vad:ConceptTriGPredicate | vad:hasAutoGenPredicate | rdf:type |

### 6.2 Usage in Application

The `loadTechAppendix()` function loads the technology appendix and populates the `techAppendixPredicates` map, which is used by `isAutoGeneratedPredicate()` to mark predicates as "(auto)" in the Smart Design dropdown.

---

## Appendix 7: Process Subtype Computation (virtualRDFdata)

### 7.1 Algorithm Overview

Process subtypes are computed dynamically by `calculateProcessSubtypes()` function based on:
1. Presence of `vad:hasTrig` predicate (determines Detailed vs notDetailed)
2. Relationship between parent TriG and child TriG via `vad:hasParentObj`
3. Current TriG context

### 7.2 Subtype Determination Logic

| Condition | Computed Subtype |
|-----------|------------------|
| No hasTrig AND isSubprocessTrig to current TriG | notDetailedChild |
| No hasTrig AND no isSubprocessTrig to current TriG | notDetailedExternal |
| Has hasTrig AND child TriG has hasParentObj to current TriG | DetailedChild |
| Has hasTrig AND child TriG does NOT have hasParentObj to current TriG | DetailedExternal |
| Unable to determine | NotDefinedType |

### 7.3 Storage

Computed subtypes are stored in `virtualRDFdata` array as synthetic quads with predicate `vad:processSubtype`. These quads are merged with actual RDF data during visualization but are not persisted.

---

## Notes

1. **TypeProcess** replaces **Process** from earlier versions (ver7so)
2. **hasParentObj** replaces **hasParentTrig** from earlier versions
3. **ObjectTree** is new base class for ProcessTree, ExecutorTree, and TechTree
4. **TechTree** is new in ver8tree for technology metadata
5. Process subtypes are now computed via `virtualRDFdata` instead of stored explicitly
6. Auto-generated predicates are defined in the technology appendix
7. When creating a new Process in VADProcessDia, **vad:isSubprocessTrig** should be added first
8. Relationships not listed in the ontology are NOT allowed

---

*This document is generated from the VAD Ontology (vad-basic-ontology.ttl) and Technology Appendix (vad-basic-ontology_tech_Appendix.ttl)*
