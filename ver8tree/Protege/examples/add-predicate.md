# Example: Adding a New Predicate to Process Concepts

This example demonstrates how to add a new predicate (`vad:priority`) to process concepts using Protege.

## Goal

Add a `vad:priority` predicate that allows assigning priority levels (1-5) to processes.

## Step-by-Step Guide

### Step 1: Open the Main Ontology

1. Launch Protege Desktop
2. `File -> Open...`
3. Navigate to `ver8tree/vad-basic-ontology.ttl`
4. Click "Open"

### Step 2: Create the New Property

1. Go to the **Data Properties** tab
2. Click the "Add Data Property" button (+ icon)
3. Enter the name: `priority`
4. The full URI will be: `http://example.org/vad#priority`

### Step 3: Configure the Property

In the property description panel (right side):

1. **Add rdfs:label:**
   - Click "+" next to "Annotations"
   - Select "rdfs:label"
   - Enter: `priority`

2. **Set Domain (what types can have this property):**
   - Click "+" next to "Domains"
   - Select `vad:TypeProcess`

3. **Set Range (allowed values):**
   - Click "+" next to "Ranges"
   - Select `xsd:integer`

4. **Add Comment:**
   - Click "+" next to "Annotations"
   - Select "rdfs:comment"
   - Enter: `Priority level of the process (1-5, where 1 is highest priority)`

### Step 4: Save the Ontology

1. `File -> Save` (or `Ctrl+S`)
2. Choose **Turtle Syntax** format
3. Save as `vad-basic-ontology.ttl`

### Step 5: Update Tech Appendix

1. Open `ver8tree/vad-basic-ontology_tech_Appendix.ttl` in Protege
2. Go to **Individuals** tab
3. Find `vad:ConceptProcessPredicate`
4. In the property assertions panel, find `vad:includePredicate`
5. Click "+" to add a new value
6. Enter: `vad:priority`
7. Save the file

## Result

### In vad-basic-ontology.ttl

```turtle
vad:priority
    rdf:type rdf:Property, owl:DatatypeProperty ;
    rdfs:label "priority" ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range xsd:integer ;
    rdfs:comment "Priority level of the process (1-5, where 1 is highest priority)" ;
    dcterms:description "Process priority level" .
```

### In vad-basic-ontology_tech_Appendix.ttl

```turtle
vad:ConceptProcessPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptProcessPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:priority ;
    # ... rest of definition
```

## Verification in RDF Grapher

1. Open https://bpmbpm.github.io/rdf-grapher/ver8tree/
2. Load the updated ontology files
3. Go to "SPARQL Smart Design" mode
4. In Smart Design window:
   - Select TriG: `vad:ptree`
   - Select Subject Type: `TypeProcess`
   - Check Predicate dropdown - `priority` should be available

## Example Usage in RDF Data

After adding the predicate, you can use it in your RDF data:

```turtle
vad:ptree {
    vad:p1 rdf:type vad:TypeProcess ;
        rdfs:label "p1 Main Process" ;
        dcterms:description "Main business process" ;
        vad:hasParentObj vad:ptree ;
        vad:priority 1 .  # High priority

    vad:p2 rdf:type vad:TypeProcess ;
        rdfs:label "p2 Secondary Process" ;
        dcterms:description "Secondary process" ;
        vad:hasParentObj vad:ptree ;
        vad:priority 3 .  # Medium priority
}
```

## Troubleshooting

### Property doesn't appear in dropdown

1. Clear browser cache
2. Verify the property is in `vad:includePredicate` list
3. Check that `vad:contextTriGType` is set correctly

### Property shows for wrong types

1. Verify the `rdfs:domain` is set to the correct class
2. Check that you added to the correct Tech object:
   - `vad:ConceptProcessPredicate` for ptree context
   - `vad:IndividProcessPredicate` for VADProcessDia context
