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

    // issue #239: Также очищаем Result in SPARQL и его статус
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = '';
    }
    // issue #241: Очищаем текст сообщения, но не скрываем поле
    const resultMessage = document.getElementById('result-sparql-message');
    if (resultMessage) {
        resultMessage.textContent = '';
        resultMessage.className = 'smart-design-message';
    }

    // issue #241: Очищаем текст сообщения Smart Design, но не скрываем поле
    clearSmartDesignMessage();
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
        // issue #239: Реализация удаления триплетов из RDF данных
        const currentRdf = rdfInput.value;
        const escapedGraph = graphName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Проверяем тип DELETE запроса
        const isDeleteWhere = sparqlQuery.includes('DELETE WHERE');
        const isDropGraph = sparqlQuery.includes('DROP GRAPH');

        if (isDropGraph) {
            // DROP GRAPH - удаляем весь граф из RDF данных
            const graphBlockRegex = new RegExp(`\\n?${escapedGraph}\\s*\\{[\\s\\S]*?\\}\\s*`, 'g');
            const newRdf = currentRdf.replace(graphBlockRegex, '');
            rdfInput.value = newRdf.trim();
            showResultSparqlMessage('Граф удалён из RDF данных', 'success');
            return;
        }

        if (isDeleteWhere && tripleContent.includes('?p') && tripleContent.includes('?o')) {
            // DELETE WHERE { GRAPH g { s ?p ?o } } - удаляем все триплеты субъекта в графе
            const subjectMatch = tripleContent.match(/(\S+)\s+\?p\s+\?o/);
            if (subjectMatch) {
                const subjectName = subjectMatch[1].trim();
                // Ищем граф и удаляем все строки с данным субъектом
                const graphOpenRegex = new RegExp(`(${escapedGraph}\\s*\\{)`, 'g');
                const openMatch = graphOpenRegex.exec(currentRdf);
                if (openMatch) {
                    const afterOpen = openMatch.index + openMatch[0].length;
                    let braceCount = 1;
                    let closingBracePos = -1;
                    for (let i = afterOpen; i < currentRdf.length; i++) {
                        if (currentRdf[i] === '{') braceCount++;
                        if (currentRdf[i] === '}') braceCount--;
                        if (braceCount === 0) { closingBracePos = i; break; }
                    }
                    if (closingBracePos !== -1) {
                        const graphContent = currentRdf.substring(afterOpen, closingBracePos);
                        const escapedSubject = subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const lineRegex = new RegExp(`\\n?\\s*${escapedSubject}\\s+[^\\n]+`, 'g');
                        const newGraphContent = graphContent.replace(lineRegex, '');
                        rdfInput.value = currentRdf.substring(0, afterOpen) + newGraphContent + currentRdf.substring(closingBracePos);
                        showResultSparqlMessage(`Триплеты субъекта ${subjectName} удалены из графа`, 'success');
                        return;
                    }
                }
            }
        }

        // DELETE DATA - удаляем конкретный триплет
        const escapedTriple = tripleContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const tripleLineRegex = new RegExp(`\\n?\\s*${escapedTriple}`, 'g');
        const graphOpenRegex = new RegExp(`(${escapedGraph}\\s*\\{)`, 'g');
        const openMatch = graphOpenRegex.exec(currentRdf);
        if (openMatch) {
            const afterOpen = openMatch.index + openMatch[0].length;
            let braceCount = 1;
            let closingBracePos = -1;
            for (let i = afterOpen; i < currentRdf.length; i++) {
                if (currentRdf[i] === '{') braceCount++;
                if (currentRdf[i] === '}') braceCount--;
                if (braceCount === 0) { closingBracePos = i; break; }
            }
            if (closingBracePos !== -1) {
                const graphContent = currentRdf.substring(afterOpen, closingBracePos);
                const newGraphContent = graphContent.replace(tripleLineRegex, '');
                rdfInput.value = currentRdf.substring(0, afterOpen) + newGraphContent + currentRdf.substring(closingBracePos);
                showResultSparqlMessage('Триплет удалён из RDF данных', 'success');
                return;
            }
        }

        showResultSparqlMessage('Не удалось найти граф или триплет для удаления. Используйте ручное редактирование.', 'warning');
        return;
    }
    
    // Для INSERT: добавляем триплет в соответствующий граф
    const currentRdf = rdfInput.value;
    
    // issue #239: Вставляем триплет в конец графа (перед закрывающей }) вместо начала
    // Также добавляем пустую строку перед новым триплетом
    const escapedGraphName = graphName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (mode === 'simple' || mode === 'shorthand') {
        // Ищем граф и его закрывающую скобку
        const graphOpenRegex = new RegExp(`${escapedGraphName}\\s*\\{`, 'g');
        const openMatch = graphOpenRegex.exec(currentRdf);

        if (openMatch) {
            // Граф найден - ищем закрывающую } для этого графа
            const afterOpen = openMatch.index + openMatch[0].length;
            let braceCount = 1;
            let closingBracePos = -1;
            for (let i = afterOpen; i < currentRdf.length; i++) {
                if (currentRdf[i] === '{') braceCount++;
                if (currentRdf[i] === '}') braceCount--;
                if (braceCount === 0) {
                    closingBracePos = i;
                    break;
                }
            }

            if (closingBracePos !== -1) {
                // Вставляем триплет перед закрывающей скобкой с пустой строкой
                const beforeClosing = currentRdf.substring(0, closingBracePos);
                const afterClosing = currentRdf.substring(closingBracePos);
                rdfInput.value = beforeClosing + `\n    ${tripleContent}\n` + afterClosing;
            } else {
                // Fallback: вставляем после открывающей скобки
                rdfInput.value = currentRdf.substring(0, afterOpen) + `\n    ${tripleContent}` + currentRdf.substring(afterOpen);
            }
        } else {
            // Граф не найден - добавляем в конец с пустой строкой
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
 * issue #241: Очищает текст сообщения Smart Design, но не скрывает поле
 */
function clearSmartDesignMessage() {
    const messageDiv = document.getElementById('smart-design-message');
    if (messageDiv) {
        messageDiv.textContent = '';
        messageDiv.className = 'smart-design-message';
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
