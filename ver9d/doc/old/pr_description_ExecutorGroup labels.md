## Summary
This PR implements the requirements from issue #340 to change how ExecutorGroup labels are handled in the process diagram.

### Key Changes:
1. **ExecutorGroup rdfs:label is now computed**: Instead of being a static property, rdfs:label for ExecutorGroup objects is now computed as a comma-separated list of all included executors.
2. **Virtual TriG integration**: The computed labels are stored in Virtual TriG (vad:vt_eg_*) as part of the virtual data computation.
3. **Reasoner implementation**: Added N3 rules to compute ExecutorGroup labels using semantic reasoning.
4. **dcterms:description**: When creating ExecutorGroup objects, they now have dcterms:description instead of rdfs:label.

### Technical Details:
- Added reasoner rules in `11_reasoning_logic.js` for label computation
- Extended Virtual TriG module in `10_virtualTriG_logic.js` to compute ExecutorGroup labels
- Updated SPARQL generation in `3_sd_create_new_individ_sparql.js` to use dcterms:description
- Modified `rdfToDotVAD()` in `5_publisher_logic.js` to use computed labels from Virtual TriG
- Added comprehensive documentation in `doc/10_virtualTriG.md`

### Algorithm:
1. Collect all executors for each ExecutorGroup via vad:includes
2. Get rdfs:label for each executor (fallback to prefixed name if missing)
3. Join executor names with commas
4. Store computed rdfs:label in Virtual TriG

### Testing:
- Added test script `experiments/test_executor_group_label.js` to verify computation
- Test passes with expected output: "Исполнитель 1, Исполнитель 2, vad:Executor3"

Fixes #340