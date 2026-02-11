# Algorithm for ExecutorGroup rdfs:label Computation in Virtual TriG

**Issue Reference**: #351 - ver9d_3ExecutorGroup1c
**Author**: AI Issue Solver
**Date**: 2026-02-10
**Updated**: 2026-02-10 (PR #352 revision - merged ExecutorGroup labels into single Virtual TriG)

## Overview

This algorithm describes how rdfs:label values are computed for ExecutorGroup objects and stored in Virtual TriG graphs (`vad:vt_*`) as part of the Virtual TriG system in ver9d.

**IMPORTANT RULE**: One VADProcessDia (process schema) = ONE Virtual TriG graph
- ExecutorGroup rdfs:label quads are stored in the SAME Virtual TriG (`vad:vt_*`) as processSubtype data
- There should NOT be separate Virtual TriG graphs for ExecutorGroup labels (`vad:vt_eg_*` prefix is NOT used)

## Problem Statement

The issue reported by the user is that automatically computed rdfs:label for ExecutorGroup objects are not appearing in the Virtual TriG when using the quadstore interface with "Virtual TriG" filter selection.

## Root Cause Analysis

Through investigation, the root cause was identified as:

1. **Missing Dependency**: The Virtual TriG logic uses `funSPARQLvaluesComunica()` function which requires the Comunica SPARQL engine
2. **Package Not Installed**: The `@comunica/query-sparql-rdfjs` package was not included in `package.json` dependencies
3. **Fallback Failure**: When Comunica is unavailable, the fallback to simple SPARQL engine (`funSPARQLvalues()`) fails because it doesn't support complex SPARQL queries with GRAPH patterns and OPTIONAL clauses

## Algorithm Implementation

### Phase 1: Data Input
```
INPUT: Current RDF store with:
- ExecutorGroup objects in VADProcessDia graphs
- Executor objects in rtree graph with rdfs:label values  
- vad:includes relationships between ExecutorGroup and Executor objects
```

### Phase 2: Process Discovery
```
1. Find all VADProcessDia graphs
   SPARQL: SELECT ?trig WHERE { ?trig rdf:type vad:VADProcessDia }

2. For each VADProcessDia graph, find ExecutorGroups
   SPARQL: SELECT DISTINCT ?executorGroup 
           WHERE { GRAPH <trigUri> { ?executorGroup rdf:type vad:ExecutorGroup } }

3. For each ExecutorGroup, collect included executors
   SPARQL: SELECT ?executor ?executorLabel 
           WHERE {
             <executorGroupUri> vad:includes ?executor .
             OPTIONAL { ?executor rdfs:label ?executorLabel }
           }
```

### Phase 3: Label Computation
```
For each ExecutorGroup:
1. Initialize empty array: executorLabels = []

2. For each included executor:
   a. If executor has rdfs:label → Use the label value
   b. If no rdfs:label → Use prefixed name (e.g., "vad:Executor1")
   c. Add to executorLabels array

3. Sort executorLabels alphabetically (for consistency)

4. Join labels with comma separator
   result = executorLabels.join(', ')
```

### Phase 4: Virtual TriG Generation
```
IMPORTANT: One VADProcessDia = ONE Virtual TriG (vad:vt_*)

1. Create Virtual TriG container URI
   Pattern: Replace parent trig URI "#t_" with "#vt_"
   Example: vad:t_p1 → vad:vt_p1

2. Create metadata quads for the Virtual TriG graph
   a. rdf:type vad:Virtual
   b. vad:hasParentObj <parentTrigUri>

3. Create processSubtype quads for each process in the schema
   Pattern: ?process vad:processSubtype ?subtypeUri
   Where: ?process = Process URI
         ?subtypeUri = Computed subtype (DetailedChild, DetailedExternal, etc.)

4. Create rdfs:label quads for each ExecutorGroup
   Pattern: ?executorGroup rdfs:label "<computed_label>"
   Where: ?executorGroup = ExecutorGroup URI
         <computed_label> = result from Phase 3
         Graph = Same Virtual TriG container URI (vad:vt_*)

5. Add all quads to the N3 store
```

## Data Flow Diagram

```
┌─────────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  VADProcessDia      │    │  ExecutorGroup  │    │  Executor       │
│  Graph (t_p1)       │───▶│  (p1_1)         │───▶│  (Executor1)    │
│                     │    │                 │    │  rdfs:label     │
│  Process individuals│    │  vad:includes   │    │  "Исполнитель 1"│
│  (p1_1, p1_2, ...)  │    │  relationship   │    └─────────────────┘
└─────────────────────┘    └─────────────────┘              │
         │                                                   │
         ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  SINGLE Virtual TriG (vt_p1)                                    │
│                                                                 │
│  Contains BOTH:                                                 │
│  1. processSubtype data:                                        │
│     vad:p1_1 vad:processSubtype vad:DetailedExternal            │
│     vad:p1_2 vad:processSubtype vad:notDetailedExternal         │
│                                                                 │
│  2. ExecutorGroup rdfs:label (computed):                        │
│     vad:ExecutorGroup_p1_1 rdfs:label "Исполнитель 1"           │
│     vad:ExecutorGroup_p1_2 rdfs:label "Исполнитель 1, Исп. 2"   │
│                                                                 │
│  3. Metadata:                                                   │
│     vad:vt_p1 rdf:type vad:Virtual                              │
│     vad:vt_p1 vad:hasParentObj vad:t_p1                         │
└─────────────────────────────────────────────────────────────────┘
```

## Expected Output Example

For the test data in `Trig_VADv8.ttl`, the expected Virtual TriG content should be:

**IMPORTANT**: All data for a process schema is in ONE Virtual TriG graph (vad:vt_*), NOT separate vad:vt_eg_* graphs.

```trig
vad:vt_p1 {
    # Metadata
    vad:vt_p1 rdf:type vad:Virtual .
    vad:vt_p1 vad:hasParentObj vad:t_p1 .

    # Process subtype data
    vad:p1_1 vad:processSubtype vad:DetailedExternal .
    vad:p1_2 vad:processSubtype vad:notDetailedExternal .

    # ExecutorGroup rdfs:label (computed)
    vad:ExecutorGroup_p1_1 rdfs:label "Исполнитель 1" .
    vad:ExecutorGroup_p1_2 rdfs:label "Исполнитель 1, Исполнитель 2" .
}

vad:vt_p1_1 {
    # Metadata
    vad:vt_p1_1 rdf:type vad:Virtual .
    vad:vt_p1_1 vad:hasParentObj vad:t_p1_1 .

    # Process subtype data
    vad:p1_1_1 vad:processSubtype vad:DetailedChild .
    vad:p1_1_2 vad:processSubtype vad:notDetailedChild .

    # ExecutorGroup rdfs:label (computed)
    vad:ExecutorGroup_p1_1_1 rdfs:label "Исполнитель 21" .
    vad:ExecutorGroup_p1_1_2 rdfs:label "Исполнитель 21, Исполнитель 22" .
}

vad:vt_p2 {
    # Metadata
    vad:vt_p2 rdf:type vad:Virtual .
    vad:vt_p2 vad:hasParentObj vad:t_p2 .

    # Process subtype data and ExecutorGroup labels
    # ... (similar pattern)
}
```

## Implementation Files

### Core Logic
- **File**: `ver9d/10_virtualTriG/10_virtualTriG_logic.js`
- **Main Function**: `recalculateAllVirtualTriGs(prefixes)`
- **Key Sub-functions**:
  - `createVirtualTriG(parentTrigUri, processSubtypes, executorGroupLabels, prefixes)` - creates SINGLE Virtual TriG with all data
  - `getExecutorGroupsInTrig(trigUri)` - finds ExecutorGroup objects in a graph
  - `getExecutorsInGroup(executorGroupUri)` - finds executors in an ExecutorGroup
  - `computeExecutorGroupLabel(executorGroupUri, parentTrigUri)` - computes rdfs:label from executor names

**NOTE**: `createExecutorGroupVirtualTriG()` function was REMOVED - all Virtual TriG data is now created by `createVirtualTriG()`

### Dependencies
- **SPARQL Engine**: `@comunica/query-sparql-rdfjs` package
- **RDF Store**: N3.js Store (`currentStore`)
- **Core Functions**: `funSPARQLvaluesComunica()`, `formatVirtualTriGFromStore()`

## Integration Points

### 1. Main Application Flow
```
loadSelectedExample() → refreshVisualization() → recalculateAllVirtualTriGs()
```

### 2. UI Filter Integration
```
updateTrigFilter() → getFilteredQuads(TRIG_FILTER_MODES.VIRTUAL) 
    → isVirtualGraph() → formatVirtualTriGFromStore()
```

### 3. Functions Integration
- **Publisher Logic**: Calls `recalculateAllVirtualTriGs()` when generating DOT
- **Triplestore UI**: Displays Virtual TriG content when filter selected
- **Virtual TriG Button**: Opens modal with formatted Virtual TriG content

## Error Handling

### 1. SPARQL Engine Unavailable
```
IF Comunica package not available:
   TRY: require('@comunica/query-sparql-rdfjs')
   FALLBACK: require('comunica') (legacy)
   FINAL FALLBACK: funSPARQLvalues() (limited functionality)
```

### 2. Missing Data
```
IF no ExecutorGroups found in graph:
   → Create Virtual TriG container only with metadata
   → Log warning but continue processing other graphs
```

### 3. Invalid SPARQL
```
IF SPARQL query fails:
   → Log error with query details
   → Return empty result array
   → Continue with next ExecutorGroup
```

## Performance Considerations

1. **Query Optimization**: Use indexed predicates (rdf:type, vad:includes, rdfs:label)
2. **Caching**: Virtual TriG quads are stored in same N3 store as data
3. **Batch Processing**: All ExecutorGroups processed in single `recalculateAllVirtualTriGs()` call
4. **Memory Management**: Store operations are in-memory, no persistence overhead

## Testing Strategy

### 1. Unit Tests
- **Mock SPARQL Engine**: Use predefined results for consistent testing
- **Isolated Functions**: Test each sub-function independently
- **Edge Cases**: Test with missing labels, empty groups, etc.

### 2. Integration Tests
- **Full Workflow**: Load data → Trigger recalculation → Check output
- **UI Filters**: Verify "Virtual TriG" filter shows computed labels
- **Browser Console**: Check for SPARQL engine initialization errors

### 3. Data Validation
- **Input Data**: Verify `Trig_VADv8.ttl` has expected structure
- **Output Data**: Confirm Virtual TriG contains expected quads
- **Graph Names**: Verify `vad:vt_*` naming convention (ONE Virtual TriG per process schema, NO separate `vad:vt_eg_*` graphs)

## Troubleshooting Guide

### Issue: No ExecutorGroup Labels in Virtual TriG
1. **Check Dependencies**: Ensure `@comunica/query-sparql-rdfjs` is installed
2. **Verify Data Loading**: Confirm `refreshVisualization()` completed successfully
3. **Check Console**: Look for SPARQL engine initialization errors
4. **Manual Trigger**: Click "Virtual TriG" button → "Пересчитать" to force recalculation

### Issue: Wrong Labels Computed
1. **Check vad:includes**: Verify relationships are correct in source data
2. **Check rdfs:label**: Confirm executor objects have labels
3. **Check SPARQL Queries**: Verify no query syntax errors
4. **Debug Logging**: Enable detailed logging in computeExecutorGroupLabel()

### Issue: Virtual TriG Not Visible in UI
1. **Filter Selection**: Ensure "Virtual TriG" filter is selected
2. **isVirtualGraph()**: Check graph naming detection is working
3. **Quadstore Display**: Verify `updateQuadstoreDisplay()` is called
4. **Store State**: Confirm Virtual TriG quads are in `currentStore`

## Future Enhancements

### 1. Performance Optimization
- **Incremental Updates**: Only recompute affected Virtual TriG graphs
- **Query Caching**: Cache frequently used SPARQL results
- **Parallel Processing**: Compute multiple ExecutorGroup labels concurrently

### 2. Feature Expansion
- **Configurable Formats**: Allow custom label separators and formatting
- **Label Overrides**: Support manual rdfs:label overrides
- **Validation Rules**: Add constraints on label composition

### 3. Integration Improvements
- **Real-time Updates**: Trigger recalculation on data changes
- **Subscription Model**: Notify UI when Virtual TriG is updated
- **Export Options**: Support multiple output formats for Virtual TriG

---

**Status**: ✅ Algorithm fully documented and implemented
**Version**: ver9d
**Last Updated**: 2026-02-10 (PR #352 revision - merged ExecutorGroup labels into single Virtual TriG)

## Revision History

| Date | Change | Issue/PR |
|------|--------|----------|
| 2026-02-10 | Initial documentation | #351, PR #350, PR #346 |
| 2026-02-10 | Fixed: ExecutorGroup labels now added to same Virtual TriG (vt_*) instead of separate graphs (vt_eg_*) | #351, PR #352 |