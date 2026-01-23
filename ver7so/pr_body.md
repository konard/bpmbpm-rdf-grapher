## Summary

This PR addresses issue #133 by refactoring the ver7so/index.html file:

### Changes Made:
1. **Moved all styles to separate CSS file**: Created `ver7so/styles.css` containing all CSS styles previously embedded in `<style>` tags in `index.html`
2. **Moved examples to separate TTL files**: Created individual `.ttl` files for each RDF example:
   - `Turtle.ttl` - Basic Turtle example
   - `VAD.ttl` - VAD (Value Added Chain Diagram) example  
   - `NTriples.ttl` - N-Triples example
   - `NQuads.ttl` - N-Quads example
   - `TriG.ttl` - TriG example
   - `Trig_VAD.ttl` - TriG VAD example
   - `Trig_VADv2.ttl` - TriG VADv2 with hierarchy example
3. **Updated loadExample functions**: Modified all `loadExample*()` functions to use `fetch()` to load RDF data from the corresponding `.ttl` files instead of hardcoded strings
4. **Linked CSS file**: Replaced inline `<style>` block with `<link rel="stylesheet" href="styles.css">`

### Benefits:
- Better code organization and maintainability
- Easier to edit styles and examples separately
- Reduced HTML file size
- Examples can be reused or modified independently

### Testing:
The changes maintain the same functionality - clicking example buttons will load the RDF data from the external files. Ensure the web server serves the `.ttl` files correctly for the `fetch()` calls to work.

Fixes #133
