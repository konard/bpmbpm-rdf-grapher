// issue #232: Модуль бизнес-логики Smart Design
// Содержит функции создания, удаления триплетов и применения SPARQL запросов

/**
 * Создаёт SPARQL INSERT запрос на основе выбранных полей Smart Design
 * Формат: Simple Triple (полная запись)
 */
function smartDesignCreate() {
    const trigSelect = document.getElementById('smart-design-trig');
    const subjectSelect = document.getElementById('smart-design-subject');
    const predicateSelect = document.getElementById('smart-design-predicate');
    const objectSelect = document.getElementById('smart-design-object');
    
    if (!trigSelect || !subjectSelect || !predicateSelect || !objectSelect) return;
    
    const trigUri = trigSelect.value;
    const subjectUri = subjectSelect.value;
    const predicateUri = predicateSelect.value;
    const objectUri = objectSelect.value;
    
    if (!trigUri || !subjectUri || !predicateUri || !objectUri) {
        showSmartDesignMessage('Заполните все поля: TriG, Subject, Predicate и Object', 'error');
        return;
    }
    
    // Формируем SPARQL INSERT запрос
    const trigPrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(trigUri, currentPrefixes) : `<${trigUri}>`;
    const subjectPrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(subjectUri, currentPrefixes) : `<${subjectUri}>`;
    const predicatePrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(predicateUri, currentPrefixes) : `<${predicateUri}>`;
    const objectPrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(objectUri, currentPrefixes) : `<${objectUri}>`;
    
    // Формируем префиксы
    const prefixLines = Object.entries(currentPrefixes || {})
        .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
        .join('\n');
    
    const sparqlQuery = `${prefixLines}

INSERT DATA {
    GRAPH ${trigPrefixed} {
        ${subjectPrefixed} ${predicatePrefixed} ${objectPrefixed} .
    }
}`;
    
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }
    
    showSmartDesignMessage('SPARQL INSERT запрос создан (Simple Triple)', 'success');
}

/**
 * Создаёт SPARQL INSERT запрос в формате Shorthand Triple (с префиксами)
 */
function smartDesignCreateWithPrefix() {
    // Используем ту же логику, что и smartDesignCreate
    smartDesignCreate();
}

/**
 * Создаёт SPARQL DELETE запрос для удаления выбранного триплета
 */
function smartDesignDelete() {
    const trigSelect = document.getElementById('smart-design-trig');
    const subjectSelect = document.getElementById('smart-design-subject');
    const predicateSelect = document.getElementById('smart-design-predicate');
    const objectSelect = document.getElementById('smart-design-object');
    
    if (!trigSelect || !subjectSelect || !predicateSelect || !objectSelect) return;
    
    const trigUri = trigSelect.value;
    const subjectUri = subjectSelect.value;
    const predicateUri = predicateSelect.value;
    const objectUri = objectSelect.value;
    
    if (!trigUri || !subjectUri || !predicateUri || !objectUri) {
        showSmartDesignMessage('Заполните все поля для удаления триплета', 'error');
        return;
    }
    
    const trigPrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(trigUri, currentPrefixes) : `<${trigUri}>`;
    const subjectPrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(subjectUri, currentPrefixes) : `<${subjectUri}>`;
    const predicatePrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(predicateUri, currentPrefixes) : `<${predicateUri}>`;
    const objectPrefixed = typeof getPrefixedName === 'function' ? getPrefixedName(objectUri, currentPrefixes) : `<${objectUri}>`;
    
    const prefixLines = Object.entries(currentPrefixes || {})
        .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
        .join('\n');
    
    const sparqlQuery = `${prefixLines}

DELETE DATA {
    GRAPH ${trigPrefixed} {
        ${subjectPrefixed} ${predicatePrefixed} ${objectPrefixed} .
    }
}`;
    
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }
    
    showSmartDesignMessage('SPARQL DELETE запрос создан', 'success');
}

/**
 * Очищает поля Smart Design
 */
function smartDesignClear() {
    const fields = ['smart-design-subject-type', 'smart-design-subject', 'smart-design-predicate', 'smart-design-object'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    hideSmartDesignMessage();
}

/**
 * Применяет SPARQL запрос как Simple Triple (полная форма)
 * Вставляет триплет непосредственно в текстовое поле RDF данных
 */
function smartDesignApply() {
    const resultTextarea = document.getElementById('result-sparql-query');
    if (!resultTextarea || !resultTextarea.value.trim()) {
        showResultSparqlMessage('Нет SPARQL запроса для применения', 'error');
        return;
    }
    
    applyTripleToRdfInput(resultTextarea.value, 'simple');
}

/**
 * Применяет SPARQL запрос как Shorthand Triple (сокращённая форма)
 */
function smartDesignApplyShorthand() {
    const resultTextarea = document.getElementById('result-sparql-query');
    if (!resultTextarea || !resultTextarea.value.trim()) {
        showResultSparqlMessage('Нет SPARQL запроса для применения', 'error');
        return;
    }
    
    applyTripleToRdfInput(resultTextarea.value, 'shorthand');
}

/**
 * Применяет триплет к текстовому полю RDF данных
 * @param {string} sparqlQuery - SPARQL запрос
 * @param {string} mode - Режим: 'simple' или 'shorthand'
 */
function applyTripleToRdfInput(sparqlQuery, mode) {
    const rdfInput = document.getElementById('rdf-input');
    if (!rdfInput) {
        showResultSparqlMessage('Текстовое поле RDF не найдено', 'error');
        return;
    }
    
    // Извлекаем триплет из SPARQL запроса
    const tripleMatch = sparqlQuery.match(/GRAPH\s+(\S+)\s*\{([^}]+)\}/);
    if (!tripleMatch) {
        showResultSparqlMessage('Не удалось извлечь триплет из SPARQL запроса', 'error');
        return;
    }
    
    const graphName = tripleMatch[1];
    const tripleContent = tripleMatch[2].trim();
    
    // Определяем является ли это INSERT или DELETE
    const isDelete = sparqlQuery.includes('DELETE');
    
    if (isDelete) {
        // Для DELETE: удаляем триплет из RDF данных
        showResultSparqlMessage('Удаление триплетов через применение пока не поддержано. Используйте ручное редактирование.', 'warning');
        return;
    }
    
    // Для INSERT: добавляем триплет в соответствующий граф
    const currentRdf = rdfInput.value;
    
    if (mode === 'simple') {
        // Simple Triple: добавляем полный триплет
        const insertLine = `\n    ${tripleContent}`;
        
        // Ищем граф в текущих данных
        const graphRegex = new RegExp(`(${graphName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{)`, 'g');
        const match = graphRegex.exec(currentRdf);
        
        if (match) {
            // Граф найден - вставляем триплет после открывающей скобки
            const insertPos = match.index + match[0].length;
            rdfInput.value = currentRdf.substring(0, insertPos) + insertLine + currentRdf.substring(insertPos);
        } else {
            // Граф не найден - добавляем в конец
            rdfInput.value = currentRdf + `\n\n${graphName} {\n    ${tripleContent}\n}`;
        }
    } else {
        // Shorthand Triple: аналогичная логика
        const graphRegex = new RegExp(`(${graphName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{)`, 'g');
        const match = graphRegex.exec(currentRdf);
        
        if (match) {
            const insertPos = match.index + match[0].length;
            rdfInput.value = currentRdf.substring(0, insertPos) + `\n    ${tripleContent}` + currentRdf.substring(insertPos);
        } else {
            rdfInput.value = currentRdf + `\n\n${graphName} {\n    ${tripleContent}\n}`;
        }
    }
    
    showResultSparqlMessage(`Триплет применён в формате ${mode === 'simple' ? 'Simple Triple' : 'Shorthand Triple'}`, 'success');
}

/**
 * Показывает сообщение в панели Smart Design
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип: 'success', 'error', 'warning'
 */
function showSmartDesignMessage(message, type) {
    const messageDiv = document.getElementById('smart-design-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `smart-design-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

/**
 * Скрывает сообщение Smart Design
 */
function hideSmartDesignMessage() {
    const messageDiv = document.getElementById('smart-design-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

/**
 * Показывает сообщение в панели Result in SPARQL
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения
 */
function showResultSparqlMessage(message, type) {
    const messageDiv = document.getElementById('result-sparql-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `smart-design-message ${type}`;
        messageDiv.style.display = 'block';
    }
}
