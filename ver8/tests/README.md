# RDF Grapher Tests

This directory contains unit tests for the RDF Grapher application.

## Test Files

- `sparql-functions.test.js` - Tests for SPARQL query functions (funSPARQLvalues, parseTriplePatterns, etc.)

## Running Tests

### Browser Environment

1. Open `ver8/index.html` in a web browser
2. Load test RDF data (use the "Загрузить пример" button or paste test data)
3. Open the browser console (F12)
4. Load the test file:
   ```javascript
   const script = document.createElement('script');
   script.src = 'tests/sparql-functions.test.js';
   document.body.appendChild(script);
   ```
5. Run the tests:
   ```javascript
   TestFramework.runAll();
   ```

### Test Data

Sample test data is included in the test files. You can also use the example TriG VADv2 data from the main application.

## Test Coverage

The test suite covers:

1. **SPARQL Functions**
   - `funSPARQLvalues` - Query execution and result extraction
   - `parseTriplePatterns` - SPARQL WHERE clause parsing
   - `resolveValue` - Variable, URI, and literal resolution
   - `executeSimpleSelect` - Pattern matching against quads

2. **Test Scenarios**
   - Simple SELECT queries
   - Cross-graph queries (multiple GRAPH blocks)
   - Queries with labels
   - Empty result handling
   - Variable, URI, and literal handling

## Adding New Tests

To add a new test, use the TestFramework:

```javascript
TestFramework.test('description of test', () => {
    // Test setup
    const input = ...;

    // Call function under test
    const result = functionToTest(input);

    // Assertions
    assert.equals(result, expected, 'error message');
});
```

## Future Improvements

- Add automated test runner (e.g., Jest, Mocha)
- Add tests for validation functions (validateVAD, formatVADErrors)
- Add tests for graph visualization functions
- Add integration tests for Smart Design UI
- Add performance tests for large datasets

## Notes

The current tests are structural tests that verify the test framework and expected behavior. For full integration testing, the tests need to be run in the context of a loaded application with RDF data.
