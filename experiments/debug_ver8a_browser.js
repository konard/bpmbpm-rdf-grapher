// Debug utility for ver8a - paste this into browser console
function debugVer8a() {
    console.log('=== ver8a Debug Utility ===');
    
    // Check functions exist
    const functions = ['visualize', 'clearRdfInput', 'saveAsFile', 'testRdfValidation', 'loadExampleTrigVADv4', 'updateModeDescription', 'toggleSparqlPanel'];
    console.log('Functions:');
    functions.forEach(func => {
        console.log(`  ${func}: ${typeof window[func] === 'function' ? 'EXISTS' : 'MISSING'}`);
    });
    
    // Check elements exist
    const elements = ['rdf-input', 'visualize-btn', 'visualization-mode', 'sparql-mode', 'max-vad-row-length-group', 'smart-design-container'];
    console.log('\nElements:');
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const display = window.getComputedStyle(element).display;
            const visible = display !== 'none';
            console.log(`  ${id}: EXISTS (${visible ? 'VISIBLE' : 'HIDDEN'} - ${display})`);
        } else {
            console.log(`  ${id}: MISSING`);
        }
    });
    
    // Check current values
    console.log('\nCurrent Values:');
    const vizMode = document.getElementById('visualization-mode')?.value;
    const sparqlMode = document.getElementById('sparql-mode')?.value;
    const rdfInput = document.getElementById('rdf-input')?.value?.length || 0;
    console.log(`  Visualization mode: ${vizMode}`);
    console.log(`  SPARQL mode: ${sparqlMode}`);
    console.log(`  RDF input length: ${rdfInput} characters`);
    
    // Test button clicks
    console.log('\nTesting button clicks...');
    try {
        if (typeof updateModeDescription === 'function') {
            updateModeDescription();
            console.log('  updateModeDescription: SUCCESS');
        }
        
        if (typeof toggleSparqlPanel === 'function') {
            toggleSparqlPanel();
            console.log('  toggleSparqlPanel: SUCCESS');
        }
        
        // Check if panels are now visible
        setTimeout(() => {
            const smartContainer = document.getElementById('smart-design-container');
            const maxVadGroup = document.getElementById('max-vad-row-length-group');
            
            if (smartContainer) {
                const display = window.getComputedStyle(smartContainer).display;
                console.log(`  Smart Design container after toggle: ${display}`);
            }
            
            if (maxVadGroup) {
                const display = window.getComputedStyle(maxVadGroup).display;
                console.log(`  Max VAD group after update: ${display}`);
            }
        }, 200);
        
    } catch (error) {
        console.error('  Button test error:', error);
    }
    
    console.log('=== Debug Complete ===');
}

// Auto-run debug
debugVer8a();