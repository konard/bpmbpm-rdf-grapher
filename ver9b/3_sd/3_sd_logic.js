// issue #232: Модуль бизнес-логики Smart Design
// Содержит функции создания, удаления триплетов и применения SPARQL запросов
// issue #254: Рефакторинг - использование Comunica для выполнения SPARQL UPDATE и N3.Writer для сериализации

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
 * issue #254: Применяет SPARQL запрос к quadstore через Comunica и обновляет RDF данные
 * Делегирует выполнение SPARQL запроса внешней библиотеке Comunica вместо использования regex
 * @param {string} sparqlQuery - SPARQL запрос (INSERT DATA, DELETE DATA, DELETE WHERE)
 * @param {string} mode - Режим: 'simple' или 'shorthand' (влияет только на сообщение)
 */
async function applyTripleToRdfInput(sparqlQuery, mode) {
    const rdfInput = document.getElementById('rdf-input');
    if (!rdfInput) {
        showResultSparqlMessage('Текстовое поле RDF не найдено', 'error');
        return;
    }

    // Определяем тип запроса для сообщения
    const isDelete = sparqlQuery.includes('DELETE');
    const isInsert = sparqlQuery.includes('INSERT');
    const isDrop = sparqlQuery.includes('DROP');

    try {
        // issue #254: Инициализируем N3.Store если нужно
        if (!currentStore) {
            currentStore = new N3.Store();
            currentQuads.forEach(q => currentStore.addQuad(q));
        }

        // issue #254: Инициализируем Comunica engine если нужно
        if (!comunicaEngine) {
            if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                comunicaEngine = new Comunica.QueryEngine();
            } else {
                throw new Error('Comunica не загружена. Проверьте подключение библиотеки.');
            }
        }

        // issue #254: Выполняем SPARQL UPDATE запрос через Comunica
        // queryVoid используется для SPARQL UPDATE (INSERT/DELETE/DROP)
        await comunicaEngine.queryVoid(sparqlQuery, {
            sources: [currentStore]
        });

        // issue #254: Обновляем currentQuads из store после изменения
        currentQuads = currentStore.getQuads(null, null, null, null);

        // issue #254: Сериализуем обновлённые данные обратно в TriG через N3.Writer
        const trigText = await serializeStoreToTriG(currentStore, currentPrefixes);

        // issue #254: Обновляем текстовое поле RDF данных
        rdfInput.value = trigText;

        // Формируем сообщение об успехе
        let message = '';
        if (isDrop) {
            message = 'Граф удалён из RDF данных';
        } else if (isDelete) {
            message = 'Триплеты удалены из RDF данных';
        } else if (isInsert) {
            message = `Триплет применён в формате ${mode === 'simple' ? 'Simple Triple' : 'Shorthand Triple'}`;
        } else {
            message = 'SPARQL запрос выполнен';
        }

        console.log(`issue #254: SPARQL UPDATE выполнен через Comunica, ${currentQuads.length} триплетов в store`);
        showResultSparqlMessage(message, 'success');

    } catch (error) {
        console.error('issue #254: Ошибка выполнения SPARQL UPDATE:', error);
        showResultSparqlMessage(`Ошибка выполнения SPARQL: ${error.message}`, 'error');
    }
}

/**
 * issue #254: Сериализует N3.Store в формат TriG через N3.Writer
 * @param {N3.Store} store - N3.Store с квадами
 * @param {Object} prefixes - Словарь префиксов {prefix: namespace}
 * @returns {Promise<string>} - Текст в формате TriG
 */
function serializeStoreToTriG(store, prefixes) {
    return new Promise((resolve, reject) => {
        // N3.Writer с format 'application/trig' сериализует квады с именованными графами
        const writer = new N3.Writer({
            prefixes: prefixes || {},
            format: 'application/trig'
        });

        // Получаем все квады из store
        const quads = store.getQuads(null, null, null, null);

        // Добавляем квады в writer
        quads.forEach(quad => writer.addQuad(quad));

        // Завершаем сериализацию
        writer.end((error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * issue #254: Обновляет quadstore (currentQuads, currentPrefixes, currentStore) из содержимого textarea RDF данных
 * Используется при ручном редактировании textarea или при нажатии кнопки "Показать"
 * Примечание: функция applyTripleToRdfInput теперь использует Comunica напрямую и не вызывает эту функцию
 */
function refreshQuadstoreFromRdfInput() {
    const rdfInput = document.getElementById('rdf-input');
    if (!rdfInput) return;

    const rdfText = rdfInput.value.trim();
    if (!rdfText) return;

    const inputFormat = document.getElementById('input-format');
    const format = inputFormat ? inputFormat.value : 'trig';

    try {
        const parser = new N3.Parser({ format: format });
        const quads = [];
        let prefixes = {};

        parser.parse(rdfText, (error, quad, parsedPrefixes) => {
            if (error) {
                console.warn('issue #254: Ошибка при обновлении quadstore:', error.message);
                return;
            }
            if (quad) {
                quads.push(quad);
            } else {
                if (parsedPrefixes) {
                    prefixes = parsedPrefixes;
                }
            }
        });

        // Обновляем глобальные переменные
        if (quads.length > 0) {
            currentQuads = quads;
            currentPrefixes = prefixes;
            // issue #254: Также обновляем currentStore для синхронизации
            currentStore = new N3.Store();
            quads.forEach(q => currentStore.addQuad(q));
            console.log(`issue #254: Quadstore обновлён из textarea, ${quads.length} триплетов`);
        }
    } catch (e) {
        console.warn('issue #254: Не удалось обновить quadstore:', e.message);
    }
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
