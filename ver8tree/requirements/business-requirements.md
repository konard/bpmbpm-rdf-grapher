# Business Requirements for ver8tree

## 1. Overview

This document contains a hierarchical catalog of all business requirements for the ver8tree project, including references to original issues and implementation details in code.

## 2. Core Concepts

### 2.1 Ontology Classes

| Class | Description | Graph Location |
|-------|-------------|----------------|
| `vad:TypeProcess` | Process concept (type definition) | `vad:ptree` |
| `vad:TypeExecutor` | Executor/Role concept | `vad:rtree` |
| `vad:VADProcessDia` | Process diagram (TriG schema) | Named graph |
| `vad:ObjectTree` | Tree container (ptree, rtree) | Default graph |
| `vad:ExecutorGroup` | Group of executors for a process | TriG graph |

### 2.2 Key Predicates

| Predicate | Description | Source |
|-----------|-------------|--------|
| `vad:hasParentObj` | Parent reference in hierarchy | Ontology |
| `vad:hasTrig` | Links concept to its schema | Ontology |
| `vad:isSubprocessTrig` | Links individ to containing TriG | Ontology |
| `vad:hasExecutor` | Links process to executor group | Ontology |
| `vad:includes` | Executor group membership | Ontology |
| `vad:hasNext` | Process sequence order | Ontology |

## 3. Business Operations

### 3.1 New Concept (Process/Executor)

**Button**: "New Concept" in Smart Design window

#### 3.1.1 Requirements

| ID | Requirement | Issue | Status |
|----|-------------|-------|--------|
| NC-001 | User selects concept type (TypeProcess or TypeExecutor) | #205 | Implemented |
| NC-002 | System loads predicates from tech object based on type | #207 | Implemented |
| NC-003 | User fills predicate values in generated form | #207 | Implemented |
| NC-004 | System generates unique ID for new concept | #207 | Implemented |
| NC-005 | Concept is added to appropriate graph (ptree/rtree) | #205 | Implemented |
| NC-006 | Required predicates: rdf:type, rdfs:label, vad:hasParentObj | #209 | Implemented |
| NC-007 | Parent selection from existing concepts | #209 | Implemented |
| NC-008 | SPARQL INSERT query generated and displayed | #207 | Implemented |

#### 3.1.2 Algorithm

1. User clicks "New Concept" button
2. Modal opens with concept type selection
3. On type selection:
   - Query tech object for allowed predicates
   - Generate input fields for each predicate
4. User fills values including:
   - `rdfs:label` - Display name
   - `vad:hasParentObj` - Parent in hierarchy
5. System validates:
   - Required fields filled
   - Unique ID generated
6. Generate SPARQL INSERT DATA query
7. Display query in "Result in SPARQL" area

#### 3.1.3 Code References

- `create_new_concept.js` - Main implementation
- `NEW_CONCEPT_SPARQL.GET_PREDICATES_FROM_TECH` - Predicate query
- `buildInputField()` - Form field generation
- `generateCreateConceptSparql()` - Query generation

---

### 3.2 New TriG (VADProcessDia)

**Button**: "New TriG (VADProcessDia)" in Smart Design window

#### 3.2.1 Requirements

| ID | Requirement | Issue | Status |
|----|-------------|-------|--------|
| NT-001 | User selects parent process concept | #201 | Implemented |
| NT-002 | System validates concept has no existing TriG | #201 | Implemented |
| NT-003 | TriG URI derived from concept URI with suffix | #201 | Implemented |
| NT-004 | Required predicates: rdf:type VADProcessDia | #201 | Implemented |
| NT-005 | vad:hasTrig added to parent concept in ptree | #203 | Implemented |
| NT-006 | vad:hasParentObj links TriG to concept | #203 | Implemented |

#### 3.2.2 Algorithm

1. User clicks "New TriG (VADProcessDia)" button
2. Modal opens with concept selection dropdown
3. System filters concepts that don't have hasTrig yet
4. User selects parent concept
5. System generates:
   - TriG URI: `concept_URI + "_trig"`
   - INSERT for TriG metadata
   - INSERT for vad:hasTrig in ptree
6. Display SPARQL query in "Result in SPARQL"

#### 3.2.3 Code References

- `create_new_concept.js` - Shared with New Concept
- Functions for TriG creation (TODO: document specific functions)

---

### 3.3 Delete Concept/Individ

**Button**: "Del Concept\Individ" in Smart Design window

#### 3.3.1 Requirements

| ID | Requirement | Issue | Status |
|----|-------------|-------|--------|
| DC-001 | User selects operation type from dropdown | #211 | Implemented |
| DC-002 | Five operation types available | #211 | Implemented |
| DC-003 | Validation checks before deletion | #215 | Implemented |
| DC-004 | Intermediate SPARQL queries shown | #217 | Implemented |
| DC-005 | Cannot delete concept with individs | #217 | Implemented |
| DC-006 | Cannot delete concept with children | #219 | Implemented |
| DC-007 | Cannot delete executor used in TriGs | #221 | Implemented |
| DC-008 | Show list of found individs | #221 | Implemented |
| DC-009 | Require data loaded before opening | #223 | Implemented |
| DC-010 | Fix syntax errors in generated DELETE | #221 | Fixed |

#### 3.3.2 Operation Types

| Type | Description | Checks Required |
|------|-------------|-----------------|
| Delete Process Concept | Remove TypeProcess from ptree | No individs, no schema, no children |
| Delete Executor Concept | Remove TypeExecutor from rtree | Not used in any TriG, no children |
| Delete Process Individ | Remove process usage from TriG | Warning: ExecutorGroup not deleted |
| Delete Executor Individ | Remove vad:includes from TriG | None |
| Delete TriG Schema | Remove entire VADProcessDia | None |

#### 3.3.3 Algorithm (Delete Process Concept)

1. User selects "Delete Process Concept"
2. System loads all process concepts from ptree
3. User selects concept to delete
4. System performs validation checks:
   - **Check 1**: No individs (isSubprocessTrig references)
   - **Check 2**: No schema (hasTrig reference)
   - **Check 3**: No children (hasParentObj references)
5. If checks fail:
   - Display error with list of blocking items
   - Button disabled
6. If checks pass:
   - Generate DELETE WHERE query
   - Display in "Result in SPARQL"

#### 3.3.4 Code References

- `del_concept_individ.js` - Main implementation
- `DEL_CONCEPT_SPARQL` - Query definitions
- `DEL_OPERATION_TYPES` - Operation type constants
- `DEL_CONCEPT_CONFIG` - Configuration per operation
- `performValidationChecks()` - Validation logic
- `checkProcessIndividuals()` - Individ detection
- `checkChildrenElements()` - Children detection

---

### 3.4 Display RDF Data

**Button**: "Показать" (Show)

#### 3.4.1 Requirements

| ID | Requirement | Issue | Status |
|----|-------------|-------|--------|
| DR-001 | Parse TriG/Turtle data from textarea | #174 | Implemented |
| DR-002 | Generate DOT notation for visualization | #174 | Implemented |
| DR-003 | Render SVG diagram using Graphviz | #174 | Implemented |
| DR-004 | Display TriG tree hierarchy | #176 | Implemented |
| DR-005 | Node click shows properties | #178 | Implemented |
| DR-006 | Double-click loads subprocess | #180 | Implemented |
| DR-007 | Zoom controls (in/out/reset) | #183 | Implemented |
| DR-008 | Process subtype visualization | #185 | Implemented |

#### 3.4.2 Code References

- `ui-utils.js` - Display functions
- `sparql-queries.js` - Data queries
- Graphviz integration via CDN

---

### 3.5 Schema Validation

#### 3.5.1 Requirements

| ID | Requirement | Issue | Status |
|----|-------------|-------|--------|
| SV-001 | Validate processesHaveIsSubprocessTrig | #189 | Implemented |
| SV-002 | Validate processesHaveExecutor | #189 | Implemented |
| SV-003 | Validate executorGroupsInCorrectGraph | #189 | Implemented |
| SV-004 | Validate processMetadataInPtree | #191 | Implemented |
| SV-005 | Validate executorMetadataInRtree | #191 | Implemented |
| SV-006 | Validate vadProcessDiaHasParentObj | #193 | Implemented |
| SV-007 | Validate objectTreeHasParentObj | #193 | Implemented |
| SV-008 | Validate processConceptsHaveParentObj | #193 | Implemented |
| SV-009 | Validate executorConceptsHaveParentObj | #193 | Implemented |

#### 3.5.2 Code References

- `vad-validation-rules.js` - Rule definitions
- `VAD_VALIDATION_RULES` - Rule object
- `validateVADSchema()` - Main validation function

---

## 4. UI Windows and Components

### 4.1 Smart Design Window

| Component | Function | Location |
|-----------|----------|----------|
| "New Concept" button | Opens New Concept modal | Smart Design panel |
| "New TriG" button | Opens New TriG modal | Smart Design panel |
| "Del Concept\Individ" button | Opens Delete modal | Smart Design panel |
| Operation dropdown | Select operation type | Delete modal |
| Concept dropdown | Select target concept | All modals |
| Fields container | Dynamic form fields | All modals |
| Intermediate SPARQL | Show intermediate queries | Delete modal |

### 4.2 Result Areas

| Area | Purpose |
|------|---------|
| "Result in SPARQL" | Display generated SPARQL queries |
| "Результат:" | Display execution results |
| "DOT-код:" | Display DOT notation |
| Diagram SVG | Visual process diagram |

### 4.3 TriG Tree View

| Feature | Description |
|---------|-------------|
| Root node | vad:root with ptree/rtree children |
| Expandable nodes | Click to expand/collapse |
| Double-click | Load subprocess diagram |
| Icons | Different icons for trees vs TriGs |

---

## 5. Data Model Requirements

### 5.1 Process Hierarchy (ptree)

```turtle
vad:ptree a vad:ObjectTree ;
    vad:hasParentObj vad:root .

vad:p1 a vad:TypeProcess ;
    rdfs:label "Process 1" ;
    vad:hasParentObj vad:ptree ;
    vad:hasTrig vad:p1_trig .

vad:p1.1 a vad:TypeProcess ;
    rdfs:label "Subprocess 1.1" ;
    vad:hasParentObj vad:p1 .
```

### 5.2 Executor Hierarchy (rtree)

```turtle
vad:rtree a vad:ObjectTree ;
    vad:hasParentObj vad:root .

vad:r1 a vad:TypeExecutor ;
    rdfs:label "Role 1" ;
    vad:hasParentObj vad:rtree .
```

### 5.3 Process Schema (TriG)

```turtle
vad:p1_trig a vad:VADProcessDia ;
    vad:hasParentObj vad:p1 .

vad:p1_trig {
    vad:p1.1 vad:isSubprocessTrig vad:p1_trig ;
             vad:hasExecutor vad:p1.1_ExecutorGroup_ .

    vad:p1.1_ExecutorGroup_ a vad:ExecutorGroup ;
                             vad:includes vad:r1 .
}
```

---

## 6. Issue Reference Index

| Issue | Title | Components Affected |
|-------|-------|---------------------|
| #174 | ver8tree_1 | Initial RDF display |
| #176-180 | ver8tree_1a-1c | UI enhancements |
| #183-193 | ver8tree_2Det_1* | Diagram details, validation |
| #195-197 | ver8tree_3Prot* | Prototyping |
| #199-203 | ver8tree_2Det_1f-2a | Detail refinements |
| #205-209 | ver8tree_3Fun_1* | New Concept function |
| #211-227 | ver8tree_3Fun_1del* | Delete function |
| #230 | ver8tree_4Prog_1 | Code structure research |

---

## 7. Context Preservation Recommendations

### 7.1 Problem Statement

After long pauses, AI assistants may lose context and not follow previously fixed requirements, causing code to work incorrectly and requiring repeated explanations.

### 7.2 Recommendations

1. **Requirement Documentation**
   - Maintain this document as single source of truth
   - Reference issue numbers in code comments
   - Update document when requirements change

2. **Code Comments**
   - Add issue references: `// Issue #221: Check for individs`
   - Document business rules inline
   - Use JSDoc for function descriptions

3. **Test Cases**
   - Create tests that verify requirements
   - Test names reference requirement IDs
   - Example: `test_NC001_selectConceptType()`

4. **Session Handoff**
   - Provide this document at session start
   - Reference specific requirement IDs
   - Example: "Fix issue with DC-005 validation"

5. **Validation Checklist**
   - Before completing work, verify:
     - [ ] All modified functions documented
     - [ ] Issue references added to code
     - [ ] Requirements document updated
     - [ ] Tests added/updated

6. **Structured Context File**
   - Create `context.md` with:
     - Current state summary
     - Active requirements
     - Known issues
     - Recent changes

### 7.3 Example Context Reference

```javascript
/**
 * Delete process concept from ptree
 *
 * Requirements:
 * - DC-001: User selects operation type from dropdown
 * - DC-003: Validation checks before deletion
 * - DC-005: Cannot delete concept with individs (Issue #217)
 * - DC-006: Cannot delete concept with children (Issue #219)
 *
 * @see https://github.com/bpmbpm/rdf-grapher/issues/217
 * @see business-requirements.md Section 3.3
 */
function deleteProcessConcept(conceptUri) {
    // Implementation follows DC-003 validation requirements
}
```

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-30 | Initial requirements catalog from Issue #230 |

---

## 9. References

- [VAD Ontology](../vad-basic-ontology.ttl)
- [Technical Appendix](../vad-basic-ontology_tech_Appendix.ttl)
- [Terminology](../doc/term.md)
- [Code Structure](./code_structure.md)
