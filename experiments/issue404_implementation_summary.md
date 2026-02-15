# Issue #404 Implementation Summary

## Overview
Successfully implemented two new methods for RDF Grapher ver9d as requested in issue #404:
1. **New Process Individ** - для создания индивида процесса из кнопки методов диаграммы
2. **New Executor Individ** - для создания индивида исполнителя из объекта индивида процесса

## Implementation Details

### 1. New Process Individ Method

**Location in UI:** Diagram → "Методы" button

**What it does:**
- Opens the existing "New Individ" window
- Pre-fills the "TriG (схема процесса):" field with the current process schema URI
- User can then select a process concept and create the individual via standard SPARQL workflow

**Code changes:**
```javascript
// In 12_method_logic.js
function openNewProcessIndividModal(trigUri) {
    // Opens New Individ window
    // Sets type to 'individ-process'
    // Pre-fills TriG field
}
```

**Ontology definition:**
```turtle
vad:NewProcessIndivid
    rdf:type vad:DiagramMethod ;
    rdfs:label "New Process Individ" ;
    vad:methodFunction "newProcessIndivid" ;
```

### 2. New Executor Individ Method

**Location in UI:** Process Individual Object → "Метод" button (in "Свойства объекта диаграммы" window)

**What it does:**
- Opens the existing "New Individ" window
- Pre-fills two fields:
  - "TriG (схема процесса):" - current schema URI
  - "Индивид процесса:" - selected process individual URI
- User can then select an executor and create the relationship via standard SPARQL workflow

**Code changes:**
```javascript
// In 12_method_logic.js
function openNewExecutorIndividModal(processUri, trigUri) {
    // Opens New Individ window
    // Sets type to 'individ-executor'
    // Pre-fills TriG and Process Individ fields
}
```

**Ontology definition:**
```turtle
vad:NewExecutorIndivid
    rdf:type vad:ObjectMethod ;
    rdfs:label "New Executor Individ" ;
    vad:methodForType vad:isSubprocessTrig ;
    vad:methodFunction "newExecutorIndivid" ;
```

## Files Modified

1. **ver9d/ontology/vad-basic-ontology_tech_Appendix.trig** (2 additions)
   - Added `vad:NewProcessIndivid` DiagramMethod definition
   - Added `vad:NewExecutorIndivid` ObjectMethod definition

2. **ver9d/12_method/12_method_logic.js** (159 lines added/modified)
   - Updated `getDiagramMethods()` to include "New Process Individ"
   - Updated `executeDiagramMethod()` to handle `newProcessIndivid`
   - Updated `executeObjectMethod()` to handle `newExecutorIndivid`
   - Added `openNewProcessIndividModal(trigUri)` function
   - Added `openNewExecutorIndividModal(processUri, trigUri)` function
   - Exported new functions to global scope

## Architecture Compliance

✅ **SPARQL-Driven Approach**: Both methods follow the established pattern of opening modal windows that generate SPARQL queries for execution via "Result in SPARQL"

✅ **Code Reuse**: Leverages existing `openNewIndividModal()` from `3_sd/3_sd_create_new_individ/` module

✅ **Consistency**: Follows the same pattern as existing methods (Del Dia, Add hasNext Dia, Edit Label)

✅ **Ontology-Based**: Methods are properly defined in the ontology and can be queried via SPARQL

## Testing Strategy

The implementation uses:
- Existing, proven UI components (`openNewIndividModal`)
- Asynchronous field pre-filling with proper timeouts
- Event simulation (`onNewIndividTypeChange`, `onNewIndividTrigChange`, etc.)
- Standard validation flows from the New Individ module

## Commit Details

**Commit:** 24aea6ef
**Message:** Add New Process Individ and New Executor Individ methods
**Branch:** issue-404-a77fb2adfe56
**PR:** https://github.com/bpmbpm/rdf-grapher/pull/405

## Next Steps

The PR is now ready for review. When approved and merged, users will be able to:

1. **From Diagram View:**
   - Click "Методы" button
   - Select "New Process Individ"
   - Create new process individuals quickly with pre-filled schema

2. **From Process Individual Object:**
   - Select an individual on the diagram
   - Click "Метод" in properties window
   - Select "New Executor Individ"
   - Add executors to that specific process individual

Both operations integrate seamlessly with the existing workflow and SPARQL query system.
