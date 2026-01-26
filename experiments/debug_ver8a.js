// Проверяем основные проблемы с ver8a

console.log('=== VER8A DEBUG TEST ===');

// 1. Проверяем наличие основных элементов
function checkElements() {
    const elements = [
        'rdf-input',
        'input-format', 
        'output-format',
        'layout-engine',
        'visualization-mode',
        'sparql-mode',
        'visualize-btn',
        'max-label-length',
        'max-vad-row-length',
        'smart-design-container',
        'result-sparql-panel',
        'sparql-panel'
    ];
    
    console.log('=== ELEMENT CHECK ===');
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'EXISTS' : 'MISSING'}`);
        if (element) {
            console.log(`  - display: ${window.getComputedStyle(element).display}`);
            console.log(`  - visible: ${element.offsetWidth > 0 && element.offsetHeight > 0}`);
        }
    });
}

// 2. Проверяем наличие функций
function checkFunctions() {
    const functions = [
        'visualize',
        'clearRdfInput',
        'saveAsFile', 
        'testRdfValidation',
        'loadExampleTrigVADv4',
        'updateModeDescription',
        'toggleSparqlPanel'
    ];
    
    console.log('\n=== FUNCTION CHECK ===');
    functions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        console.log(`${funcName}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });
}

// 3. Проверяем текущие значения
function checkCurrentValues() {
    console.log('\n=== CURRENT VALUES ===');
    
    const vizMode = document.getElementById('visualization-mode');
    const sparqlMode = document.getElementById('sparql-mode');
    
    if (vizMode) console.log(`visualization-mode: ${vizMode.value}`);
    if (sparqlMode) console.log(`sparql-mode: ${sparqlMode.value}`);
    
    // Проверяем видимость полей
    const maxVadGroup = document.getElementById('max-vad-row-length-group');
    if (maxVadGroup) {
        console.log(`max-vad-row-length-group display: ${maxVadGroup.style.display}`);
    }
    
    const smartDesignContainer = document.getElementById('smart-design-container');
    if (smartDesignContainer) {
        console.log(`smart-design-container classes: ${smartDesignContainer.className}`);
    }
}

// Запускаем проверки
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        checkElements();
        checkFunctions();
        checkCurrentValues();
        
        // Пробуем вызвать updateModeDescription
        if (typeof window.updateModeDescription === 'function') {
            console.log('\n=== CALLING updateModeDescription ===');
            window.updateModeDescription();
            
            // Проверяем результат
            setTimeout(() => {
                checkCurrentValues();
            }, 100);
        }
    }, 1000);
});