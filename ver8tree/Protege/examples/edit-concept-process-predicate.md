# Example: Editing vad:ConceptProcessPredicate

This example demonstrates how to modify the `vad:ConceptProcessPredicate` object to change which predicates are available for TypeProcess in the Smart Design window.

## What is vad:ConceptProcessPredicate?

`vad:ConceptProcessPredicate` is a Tech object that defines which predicates are shown in the "Predicate" dropdown when:
- TriG = `vad:ptree`
- Subject Type = `TypeProcess`

**Current predicates:** `rdf:type`, `rdfs:label`, `dcterms:description`, `vad:hasTrig`

## Goal

Add `vad:hasStatus` predicate to allow tracking process status (active/inactive/draft).

## Step-by-Step Guide

### Step 1: Create the New Property First

Before adding a predicate to the Tech object, it must exist in the ontology.

1. Open `ver8tree/vad-basic-ontology.ttl` in Protege
2. Go to **Data Properties** tab
3. Add new property `vad:hasStatus`:
   - rdfs:label: `hasStatus`
   - rdfs:domain: `vad:TypeProcess`
   - rdfs:range: `xsd:string`
   - rdfs:comment: `Status of the process: active, inactive, draft`
4. Save the file

### Step 2: Open Tech Appendix

1. `File -> Open...`
2. Navigate to `ver8tree/vad-basic-ontology_tech_Appendix.ttl`
3. Click "Open"

### Step 3: Find vad:ConceptProcessPredicate

1. Go to **Individuals** tab
2. In the search box, type: `ConceptProcessPredicate`
3. Click on `vad:ConceptProcessPredicate` in the results

### Step 4: View Current Configuration

In the property assertions panel, you'll see:

```
Types:
  vad:Tech

Property assertions:
  rdfs:label -> "ConceptProcessPredicate"
  vad:includePredicate -> rdf:type
  vad:includePredicate -> rdfs:label
  vad:includePredicate -> dcterms:description
  vad:includePredicate -> vad:hasTrig
  rdfs:comment -> "..."
  dcterms:description -> "..."
```

### Step 5: Add New Predicate

1. Find the `vad:includePredicate` property assertions
2. Click the "+" button next to property assertions
3. In the dialog:
   - Property: `vad:includePredicate`
   - Value type: Individual
   - Value: Type `vad:hasStatus` (or select from list if defined)
4. Click "OK"

### Step 6: Verify the Change

The property assertions should now show:
```
vad:includePredicate -> rdf:type
vad:includePredicate -> rdfs:label
vad:includePredicate -> dcterms:description
vad:includePredicate -> vad:hasTrig
vad:includePredicate -> vad:hasStatus    <-- NEW
```

### Step 7: Save the File

1. `File -> Save`
2. Choose **Turtle Syntax** format
3. Confirm overwrite

## Result

### Updated vad-basic-ontology_tech_Appendix.ttl

```turtle
vad:ConceptProcessPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptProcessPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasStatus ;
    rdfs:comment """
        Group 'Common properties for all process schemas' (PTREE_PREDICATES).

        Object ConceptProcessPredicate (Tech class) includes predicates
        used for TypeProcess objects in vad:ptree:
        - rdf:type - object type (vad:Process)
        - rdfs:label - process name
        - dcterms:description - process description
        - vad:hasTrig - link to detail TriG schema
        - vad:hasStatus - process status (active/inactive/draft)

        These are concept properties common to all schemas.
    """ ;
    dcterms:description "Group of common process properties for all schemas (PTREE_PREDICATES)" .
```

## Verification in RDF Grapher

1. Clear browser cache (Ctrl+Shift+Delete)
2. Open https://bpmbpm.github.io/rdf-grapher/ver8tree/
3. Go to "SPARQL Smart Design" mode
4. In Smart Design window:
   - Select TriG: `vad:ptree`
   - Select Subject Type: `TypeProcess`
   - Open Predicate dropdown
   - **Verify:** `hasStatus` should be in the list

## Usage Example

After adding the predicate, you can use it in your process definitions:

```turtle
vad:ptree {
    vad:p1 rdf:type vad:TypeProcess ;
        rdfs:label "p1 Main Process" ;
        dcterms:description "Main business process" ;
        vad:hasParentObj vad:ptree ;
        vad:hasTrig vad:t_p1 ;
        vad:hasStatus "active" .

    vad:p1.1 rdf:type vad:TypeProcess ;
        rdfs:label "p1.1 Process 1.1" ;
        dcterms:description "First subprocess" ;
        vad:hasParentObj vad:p1 ;
        vad:hasTrig vad:t_p1.1 ;
        vad:hasStatus "draft" .
}
```

## Removing a Predicate

To remove a predicate from the list:

1. Find `vad:ConceptProcessPredicate` in Individuals
2. Find the `vad:includePredicate` assertion you want to remove
3. Select it
4. Click the "-" (delete) button
5. Save the file

## Common Modifications

### Add predicate for process categorization

```turtle
vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasCategory ;
```

### Add predicate for process owner

```turtle
vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasOwner ;
```

### Add multiple predicates

```turtle
vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig,
                     vad:hasStatus, vad:hasCategory, vad:hasOwner, vad:createdDate ;
```

## Important Notes

1. **Order matters visually:** Predicates appear in the dropdown in the order they're defined
2. **Property must exist:** Only add predicates that are defined in the ontology
3. **Context awareness:** This Tech object only affects `vad:ptree` context (see `vad:contextTriGType`)
4. **For VADProcessDia:** Use `vad:IndividProcessPredicate` instead
5. **Auto-generated:** If a predicate should be auto-filled, also add it to `vad:autoGeneratedPredicate`

## Troubleshooting

### Predicate doesn't appear in dropdown

1. Verify the property is defined in `vad-basic-ontology.ttl`
2. Check that it's added to `vad:includePredicate` (not a typo)
3. Clear browser cache
4. Check browser console for errors

### Predicate appears but shows error

1. Verify `rdfs:domain` is set correctly
2. Check that `rdfs:range` matches expected value types
3. Ensure the predicate URI matches exactly

### Changes not reflected

1. Ensure you saved the file in Turtle format
2. Reload the RDF Grapher application
3. Hard refresh: `Ctrl+Shift+R`
