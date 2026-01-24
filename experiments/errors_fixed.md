# Errors Fixed in Trig_VADv3.ttl

## Summary
Fixed syntax errors in the TriG VADv3 file as requested in issue #158.

## Errors Identified and Fixed:

### 1. Missing Process Definitions in vad:ptree
**Location:** Lines 54-66 in the ptree graph

**Added:**
- `vad:p2` process metadata with label, description, and hasTrig reference
- `vad:p2.1` process metadata with label and description
- `vad:p2.2` process metadata with label and description

### 2. Incorrect Syntax in vad:t_p2 Graph
**Location:** Line ~229 (in the original issue code)

**Error:** Used period (`.`) instead of semicolon (`;`) between predicates for the same subject:
```turtle
vad:p2.1 vad:isSubprocessTrig vad:t_p2 ;
    vad:hasExecutor vad:ExecutorGroup_p2.1 ;
    vad:processSubtype vad:Basic .
    vad:hasNext vad:p2.2 .  # ERROR: should be semicolon before this
```

**Fixed to:**
```turtle
vad:p2.1 vad:isSubprocessTrig vad:t_p2 ;
    vad:hasExecutor vad:ExecutorGroup_p2.1 ;
    vad:processSubtype vad:Basic ;
    vad:hasNext vad:p2.2 .
```

### 3. Indentation Issues
**Location:** Various lines in vad:ptree

**Fixed:**
- Corrected indentation for the commented line `#       vad:hasTrig vad:t_p1.1 .` (line 62)
- Fixed inconsistent spacing

### 4. Missing vad:t_p2 Graph
**Location:** End of file

**Added:** Complete vad:t_p2 graph section with:
- Graph metadata (rdf:type, rdfs:label, hasParentTrig, definesProcess)
- Process definitions for p2.1 and p2.2
- Executor group definitions for both processes

## Validation
The corrected file follows proper TriG syntax:
- All graph blocks are properly closed with `}`
- Triple statements use semicolons (`;`) to continue with same subject
- Triple statements use periods (`.`) to end subject and start new one
- All prefixes are properly defined
- Proper indentation throughout
