# Example: Adding a New Class/TriG Type

This example demonstrates how to add a new TriG type (similar to `vad:ObjectTree`) using Protege.

## Goal

Create a new `vad:DocumentTree` class for organizing documents related to processes.

## Step-by-Step Guide

### Step 1: Open the Main Ontology

1. Launch Protege Desktop
2. `File -> Open...`
3. Navigate to `ver8tree/vad-basic-ontology.ttl`
4. Click "Open"

### Step 2: Create the New Class

1. Go to the **Classes** tab
2. In the class hierarchy, find `vad:TriG`
3. Right-click on `vad:TriG`
4. Select "Add subclass..."
5. Enter the name: `DocumentTree`

### Step 3: Configure the Class

In the class description panel (right side):

1. **Add rdfs:label:**
   - Click "+" next to "Annotations"
   - Select "rdfs:label"
   - Enter: `DocumentTree`

2. **Add rdfs:comment:**
   - Click "+" next to "Annotations"
   - Select "rdfs:comment"
   - Enter a detailed description:
   ```
   Document Tree (DocumentTree) - a specialized TriG container for organizing
   documents related to business processes.

   Each document tree contains:
   - References to documents (PDF, Word, etc.)
   - Document metadata (title, author, date)
   - Links to processes they relate to

   Used for maintaining process documentation.
   ```

3. **Add dcterms:description:**
   - Click "+" next to "Annotations"
   - Select "dcterms:description"
   - Enter: `Tree structure for process documentation`

4. **Ensure OWL Class type:**
   - The class should be both `rdfs:Class` and `owl:Class`

### Step 4: Create a Document Class

Add a class for individual documents:

1. In **Classes** tab, click "Add subclass" under `owl:Thing`
2. Name it: `Document`
3. Add annotations:
   - rdfs:label: `Document`
   - rdfs:comment: `A document related to a business process`

### Step 5: Create Related Properties

Go to **Object Properties** tab and add:

1. **vad:hasDocument**
   - Domain: `vad:TypeProcess`
   - Range: `vad:Document`
   - Comment: `Links a process to its documentation`

2. **vad:documentSource**
   - Domain: `vad:Document`
   - Range: (leave empty for literal values)
   - Comment: `URL or path to the document file`

### Step 6: Save the Ontology

1. `File -> Save`
2. Choose **Turtle Syntax** format

### Step 7: Create Tech Object for DocumentTree

Open `vad-basic-ontology_tech_Appendix.ttl` and add:

1. Go to **Individuals** tab
2. Click "Add Individual"
3. Create `vad:ConceptDocumentTreePredicate`
4. Set:
   - `rdf:type`: `vad:Tech`
   - `rdfs:label`: `ConceptDocumentTreePredicate`
   - `vad:includePredicate`: `rdf:type`, `rdfs:label`, `vad:hasParentObj`
   - `vad:contextTriGType`: `vad:DocumentTree`

### Step 8: Create Tech Object for Documents

Similarly create `vad:ConceptDocumentPredicate`:
- `vad:includePredicate`: `rdf:type`, `rdfs:label`, `vad:documentSource`, `vad:hasParentObj`

## Result

### In vad-basic-ontology.ttl

```turtle
# Document Tree - Container for process documentation
vad:DocumentTree
    rdf:type rdfs:Class, owl:Class ;
    rdfs:subClassOf vad:TriG ;
    rdfs:label "DocumentTree" ;
    rdfs:comment """
        Document Tree (DocumentTree) - a specialized TriG container for organizing
        documents related to business processes.

        Each document tree contains:
        - References to documents (PDF, Word, etc.)
        - Document metadata (title, author, date)
        - Links to processes they relate to

        Used for maintaining process documentation.
    """ ;
    dcterms:description "Tree structure for process documentation" .

# Document class
vad:Document
    rdf:type rdfs:Class, owl:Class ;
    rdfs:label "Document" ;
    rdfs:comment "A document related to a business process" ;
    dcterms:description "Process-related document" .

# Properties
vad:hasDocument
    rdf:type rdf:Property, owl:ObjectProperty ;
    rdfs:label "hasDocument" ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:Document ;
    rdfs:comment "Links a process to its documentation" ;
    dcterms:description "Links process to documentation" .

vad:documentSource
    rdf:type rdf:Property, owl:DatatypeProperty ;
    rdfs:label "documentSource" ;
    rdfs:domain vad:Document ;
    rdfs:range xsd:anyURI ;
    rdfs:comment "URL or path to the document file" ;
    dcterms:description "Document file location" .
```

### In vad-basic-ontology_tech_Appendix.ttl

```turtle
vad:ConceptDocumentTreePredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptDocumentTreePredicate" ;
    vad:includePredicate rdf:type, rdfs:label, vad:hasParentObj ;
    vad:contextTriGType vad:DocumentTree ;
    rdfs:comment "Predicates for DocumentTree type" ;
    dcterms:description "Group of properties for document trees" .

vad:ConceptDocumentPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptDocumentPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, vad:documentSource, vad:hasParentObj ;
    rdfs:comment "Predicates for Document type" ;
    dcterms:description "Group of properties for documents" .
```

## Example Usage in RDF Data

```turtle
# Document Tree instance
vad:dtree {
    vad:dtree rdf:type vad:DocumentTree ;
        rdfs:label "Document Tree (TriG)" ;
        vad:hasParentObj vad:root .

    # Documents
    vad:doc1 rdf:type vad:Document ;
        rdfs:label "Process 1 Documentation" ;
        vad:documentSource "https://example.com/docs/p1.pdf"^^xsd:anyURI ;
        vad:hasParentObj vad:dtree .

    vad:doc2 rdf:type vad:Document ;
        rdfs:label "Process 1.1 Specification" ;
        vad:documentSource "https://example.com/docs/p1.1-spec.docx"^^xsd:anyURI ;
        vad:hasParentObj vad:doc1 .
}

# Link documents to processes in ptree
vad:ptree {
    vad:p1 vad:hasDocument vad:doc1 .
    vad:p1.1 vad:hasDocument vad:doc2 .
}
```

## Integration with RDF Grapher

To make the new type fully functional in RDF Grapher's UI, you may need to:

1. Add `vad:DocumentTree` to `VAD_ALLOWED_TYPES` in `index.html`
2. Add `vad:Document` to `VAD_ALLOWED_TYPES` in `index.html`
3. Update any relevant SPARQL queries

**Note:** The issue specifies not to modify files in ver8tree folder directly. These JavaScript changes would be needed for full integration but are outside the scope of this example.

## Troubleshooting

### Class doesn't appear in hierarchy

1. Verify `rdfs:subClassOf` is set to `vad:TriG`
2. Reload the ontology in Protege

### Type not available in Smart Design

1. Check if the type is added to JavaScript `VAD_ALLOWED_TYPES`
2. Verify the Tech object has correct `vad:contextTriGType`
3. Clear browser cache

### Documents not showing in tree

1. Verify `vad:hasParentObj` is set correctly
2. Check that the parent exists in the same or accessible TriG
