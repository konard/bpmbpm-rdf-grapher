// issue #232: Модуль создания нового TriG контейнера
// issue #288: Добавлена поддержка промежуточного SPARQL и улучшено отображение концептов
// Содержит функции для работы с модальным окном New TriG

// ==============================================================================
// SPARQL QUERIES
// ==============================================================================

/**
 * issue #286: SPARQL-запрос для получения концептов процессов БЕЗ существующего VADProcessDia.
 * Использует FILTER NOT EXISTS для фильтрации процессов, у которых уже есть схема.
 *
 * Алгоритм:
 * 1. Выбираем процессы из ptree с типом TypeProcess
 * 2. Исключаем те, у которых есть hasTrig на граф типа VADProcessDia
 */
const SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?process ?label WHERE {
    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process rdfs:label ?label .
        FILTER NOT EXISTS {
            ?process vad:hasTrig ?trig .
            GRAPH ?trig {
                ?trig rdf:type vad:VADProcessDia .
            }
        }
    }
}
`;

/**
 * issue #288: Упрощённый SPARQL-запрос для получения ВСЕХ концептов процессов.
 * Используется как fallback если Comunica не поддерживает FILTER NOT EXISTS.
 */
const SPARQL_ALL_PROCESS_CONCEPTS = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?process ?label WHERE {
    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process rdfs:label ?label .
    }
}
`;

/**
 * issue #288: SPARQL-запрос для проверки существования VADProcessDia у процесса.
 */
const SPARQL_CHECK_PROCESS_HAS_TRIG = (processUri) => `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

ASK {
    GRAPH vad:ptree {
        <${processUri}> vad:hasTrig ?trig .
    }
}
`;

// ==============================================================================
// STATE MANAGEMENT
// ==============================================================================

/**
 * issue #288: Хранилище промежуточных SPARQL запросов для отображения
 */
let newTrigIntermediateSparqlQueries = [];

// ==============================================================================
// MODAL FUNCTIONS
// ==============================================================================

/**
 * Открывает модальное окно создания нового TriG
 * Вызывается из Smart Design панели
 * issue #286: SPARQL-driven фильтрация процессов через FILTER NOT EXISTS
 * issue #288: Добавлено отображение промежуточных SPARQL запросов
 */
async function openNewTrigModal() {
    const modal = document.getElementById('new-trig-modal');
    if (!modal) {
        console.error('[3_sd_create_new_trig] Модальное окно new-trig-modal не найдено');
        return;
    }

    // issue #288: Очищаем состояние промежуточных запросов
    newTrigIntermediateSparqlQueries = [];
    hideNewTrigIntermediateSparql();
    hideNewTrigMessage();

    // issue #282: Проверяем, что данные загружены
    if (typeof currentQuads === 'undefined' || currentQuads.length === 0) {
        showNewTrigMessage('Данные quadstore пусты. Загрузите пример данных в разделе "Загрузить пример RDF данных".', 'error');
        modal.style.display = 'block';
        return;
    }

    // Заполняем список концептов процессов
    const processSelect = document.getElementById('new-trig-process-concept');
    if (processSelect) {
        processSelect.innerHTML = '<option value="">-- Выберите концепт процесса --</option>';

        let filteredConcepts = [];

        // issue #286: SPARQL-driven Programming - фильтрация через SPARQL запрос
        // issue #288: Используем Comunica с fallback на ручную фильтрацию
        if (typeof funSPARQLvaluesComunica === 'function') {
            try {
                // Сохраняем промежуточный запрос
                newTrigIntermediateSparqlQueries.push({
                    description: 'Получение концептов процессов БЕЗ VADProcessDia (FILTER NOT EXISTS)',
                    query: SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA,
                    result: '(выполняется...)'
                });

                filteredConcepts = await funSPARQLvaluesComunica(
                    SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA,
                    'process'
                );

                console.log(`[3_sd_create_new_trig] issue #286: SPARQL returned ${filteredConcepts.length} processes without VADProcessDia`);

                // Обновляем результат
                const lastQuery = newTrigIntermediateSparqlQueries[newTrigIntermediateSparqlQueries.length - 1];
                if (lastQuery) {
                    lastQuery.result = filteredConcepts.length > 0
                        ? `Найдено ${filteredConcepts.length} концептов: ${filteredConcepts.map(c => c.label || c.uri).join(', ')}`
                        : '(нет концептов без VADProcessDia)';
                }

            } catch (error) {
                console.error('[3_sd_create_new_trig] SPARQL query error:', error);

                // Обновляем результат с ошибкой
                const lastQuery = newTrigIntermediateSparqlQueries[newTrigIntermediateSparqlQueries.length - 1];
                if (lastQuery) {
                    lastQuery.result = `Ошибка: ${error.message}`;
                }
            }
        }

        // issue #288: Fallback - получаем все концепты и фильтруем вручную
        if (filteredConcepts.length === 0) {
            console.log('[3_sd_create_new_trig] issue #288: Fallback - ручная фильтрация процессов');

            newTrigIntermediateSparqlQueries.push({
                description: 'Fallback: Получение ВСЕХ концептов процессов',
                query: SPARQL_ALL_PROCESS_CONCEPTS,
                result: '(выполняется...)'
            });

            let allConcepts = [];

            if (typeof funSPARQLvaluesComunica === 'function') {
                try {
                    allConcepts = await funSPARQLvaluesComunica(SPARQL_ALL_PROCESS_CONCEPTS, 'process');
                } catch (e) {
                    console.log('[3_sd_create_new_trig] funSPARQLvaluesComunica failed, trying funSPARQLvalues');
                }
            }

            if (allConcepts.length === 0 && typeof funSPARQLvalues === 'function') {
                allConcepts = funSPARQLvalues(SPARQL_ALL_PROCESS_CONCEPTS, 'process');
            }

            // issue #288: Ручная фильтрация - проверяем у каких процессов нет vad:hasTrig
            if (allConcepts.length === 0) {
                // Последний fallback - прямой поиск по квадам
                allConcepts = getProcessConceptsManual();
            }

            // Обновляем результат fallback запроса
            const lastQuery = newTrigIntermediateSparqlQueries[newTrigIntermediateSparqlQueries.length - 1];
            if (lastQuery) {
                lastQuery.result = allConcepts.length > 0
                    ? `Найдено ${allConcepts.length} концептов`
                    : '(концепты не найдены)';
            }

            // Фильтруем концепты - оставляем только те, у которых нет vad:hasTrig
            newTrigIntermediateSparqlQueries.push({
                description: 'Ручная фильтрация: исключаем процессы с существующей VADProcessDia',
                query: '-- Проверка vad:hasTrig для каждого концепта --',
                result: '(выполняется...)'
            });

            const processesWithTrig = new Set();
            if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
                currentQuads.forEach(quad => {
                    if (quad.predicate.value === 'http://example.org/vad#hasTrig' ||
                        quad.predicate.value.endsWith('#hasTrig')) {
                        processesWithTrig.add(quad.subject.value);
                    }
                });
            }

            filteredConcepts = allConcepts.filter(c => !processesWithTrig.has(c.uri));

            // Обновляем результат фильтрации
            const filterQuery = newTrigIntermediateSparqlQueries[newTrigIntermediateSparqlQueries.length - 1];
            if (filterQuery) {
                filterQuery.result = `Исключено ${processesWithTrig.size} процессов с VADProcessDia, осталось ${filteredConcepts.length} концептов`;
            }

            console.log(`[3_sd_create_new_trig] issue #288: Manual filter - ${filteredConcepts.length} processes without VADProcessDia`);
        }

        // Заполняем dropdown
        if (filteredConcepts.length === 0) {
            showNewTrigMessage('Не найдено концептов процессов без VADProcessDia. Все процессы уже имеют схемы, или данные ptree не загружены.', 'info');
        } else {
            filteredConcepts.forEach(concept => {
                const option = document.createElement('option');
                option.value = concept.uri;
                option.textContent = concept.label || concept.uri;
                processSelect.appendChild(option);
            });
        }

        // Отображаем промежуточные запросы
        displayNewTrigIntermediateSparql();
    }

    modal.style.display = 'block';

    // Обновляем состояние полей Smart Design
    if (typeof updateSmartDesignFieldsState === 'function') {
        updateSmartDesignFieldsState();
    }
}

/**
 * issue #288: Ручное получение концептов процессов из currentQuads
 * Используется как последний fallback если SPARQL запросы не работают
 */
function getProcessConceptsManual() {
    const concepts = [];
    const seen = new Set();
    const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';
    const typeProcessUri = 'http://example.org/vad#TypeProcess';
    const ptreeGraphUri = 'http://example.org/vad#ptree';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        // Сначала находим все процессы в ptree
        const processSubjects = new Set();
        currentQuads.forEach(quad => {
            const graphValue = quad.graph ? quad.graph.value : null;
            if ((graphValue === ptreeGraphUri || (graphValue && graphValue.endsWith('#ptree'))) &&
                (quad.predicate.value === rdfTypeUri || quad.predicate.value.endsWith('#type')) &&
                (quad.object.value === typeProcessUri || quad.object.value.endsWith('#TypeProcess'))) {
                processSubjects.add(quad.subject.value);
            }
        });

        // Затем получаем их label
        processSubjects.forEach(subjectUri => {
            if (seen.has(subjectUri)) return;
            seen.add(subjectUri);

            let label = typeof getPrefixedName === 'function'
                ? getPrefixedName(subjectUri, currentPrefixes)
                : subjectUri;

            currentQuads.forEach(quad => {
                if (quad.subject.value === subjectUri &&
                    (quad.predicate.value === rdfsLabelUri || quad.predicate.value.endsWith('#label'))) {
                    label = quad.object.value;
                }
            });

            concepts.push({ uri: subjectUri, label: label });
        });
    }

    return concepts.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
}

/**
 * Закрывает модальное окно создания нового TriG
 */
function closeNewTrigModal() {
    const modal = document.getElementById('new-trig-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Сбрасываем форму
    const processSelect = document.getElementById('new-trig-process-concept');
    const trigIdInput = document.getElementById('new-trig-id');
    const trigLabelInput = document.getElementById('new-trig-label');

    if (processSelect) processSelect.value = '';
    if (trigIdInput) trigIdInput.value = '';
    if (trigLabelInput) trigLabelInput.value = '';

    hideNewTrigMessage();
    hideNewTrigIntermediateSparql();

    // Обновляем состояние полей Smart Design
    if (typeof updateSmartDesignFieldsState === 'function') {
        updateSmartDesignFieldsState();
    }
}

/**
 * Обновляет поля формы при выборе концепта процесса
 */
function updateNewTrigFields() {
    const processSelect = document.getElementById('new-trig-process-concept');
    const trigIdInput = document.getElementById('new-trig-id');
    const trigLabelInput = document.getElementById('new-trig-label');

    if (!processSelect || !trigIdInput || !trigLabelInput) return;

    const processUri = processSelect.value;
    if (!processUri) {
        trigIdInput.value = '';
        trigLabelInput.value = '';
        return;
    }

    // Извлекаем ID процесса
    const processId = typeof getPrefixedName === 'function'
        ? getPrefixedName(processUri, currentPrefixes).replace('vad:', '')
        : processUri.split('#').pop();

    const processLabel = processSelect.options[processSelect.selectedIndex].textContent;

    trigIdInput.value = `t_${processId}`;
    trigLabelInput.value = `Схема процесса ${processLabel}`;
}

/**
 * Создаёт SPARQL запрос для нового TriG контейнера
 * issue #280: Исправлено - все триплеты размещены в именованных графах
 * issue #288: Добавлено сообщение об успехе
 */
function createNewTrig() {
    hideNewTrigMessage();

    const processSelect = document.getElementById('new-trig-process-concept');
    const trigIdInput = document.getElementById('new-trig-id');
    const trigLabelInput = document.getElementById('new-trig-label');

    if (!processSelect || !processSelect.value) {
        showNewTrigMessage('Выберите концепт процесса', 'error');
        return;
    }

    const processUri = processSelect.value;
    const trigId = trigIdInput ? trigIdInput.value : '';
    const trigLabel = trigLabelInput ? trigLabelInput.value : '';

    if (!trigId) {
        showNewTrigMessage('ID TriG не может быть пустым', 'error');
        return;
    }

    // issue #280: Получаем prefixed name для процесса
    const processPrefixed = typeof getPrefixedName === 'function'
        ? getPrefixedName(processUri, currentPrefixes)
        : '<' + processUri + '>';

    // issue #280: Формируем SPARQL INSERT запрос
    // Все триплеты размещены внутри соответствующих именованных графов:
    // - Метаданные TriG (rdf:type, rdfs:label, vad:hasParentObj) внутри нового графа vad:${trigId}
    // - Связь концепта процесса со схемой (vad:hasTrig) в графе vad:ptree
    const sparqlQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Создание нового TriG контейнера (VADProcessDia)
# issue #280: Все триплеты размещены в именованных графах
INSERT DATA {
    # Связь концепта процесса со схемой в ptree
    GRAPH vad:ptree {
        ${processPrefixed} vad:hasTrig vad:${trigId} .
    }

    # Метаданные и содержимое нового TriG
    GRAPH vad:${trigId} {
        vad:${trigId} rdf:type vad:VADProcessDia .
        vad:${trigId} rdfs:label "${trigLabel}" .
        vad:${trigId} vad:hasParentObj ${processPrefixed} .
    }
}`;

    // Выводим в Result in SPARQL
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }

    // issue #288: Показываем сообщение об успехе
    showNewTrigMessage(
        `SPARQL INSERT запрос для нового TriG "${trigId}" успешно сгенерирован. Запрос выведен в "Result in SPARQL".`,
        'success'
    );

    closeNewTrigModal();
}

// ==============================================================================
// INTERMEDIATE SPARQL FUNCTIONS (issue #288)
// ==============================================================================

/**
 * issue #288: Отображает промежуточные SPARQL запросы
 */
function displayNewTrigIntermediateSparql() {
    const container = document.getElementById('new-trig-intermediate-sparql');
    const textarea = container ? container.querySelector('textarea') : null;

    if (!container || !textarea) return;

    if (newTrigIntermediateSparqlQueries.length === 0) {
        container.style.display = 'none';
        return;
    }

    let sparqlText = '# ===== Промежуточные SPARQL запросы и результаты =====\n\n';

    newTrigIntermediateSparqlQueries.forEach((query, index) => {
        sparqlText += `# --- ${index + 1}. ${query.description} ---\n`;
        sparqlText += query.query.trim() + '\n';
        if (query.result) {
            sparqlText += `\n# Результат:\n# ${query.result}\n`;
        }
        sparqlText += '\n';
    });

    textarea.value = sparqlText;

    // Показываем контейнер
    container.style.display = 'block';
}

/**
 * issue #288: Скрывает промежуточный SPARQL
 */
function hideNewTrigIntermediateSparql() {
    const container = document.getElementById('new-trig-intermediate-sparql');
    if (container) {
        container.style.display = 'none';
        const textarea = container.querySelector('textarea');
        if (textarea) textarea.value = '';
    }
}

/**
 * issue #288: Переключает видимость промежуточного SPARQL
 */
function toggleNewTrigIntermediateSparql() {
    const container = document.getElementById('new-trig-intermediate-sparql');
    if (container) {
        const isVisible = container.style.display !== 'none';
        if (isVisible) {
            container.style.display = 'none';
        } else {
            displayNewTrigIntermediateSparql();
        }
    }
}

// ==============================================================================
// MESSAGE FUNCTIONS (issue #288)
// ==============================================================================

/**
 * issue #288: Показывает сообщение в модальном окне New TriG
 *
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения: 'success', 'error', 'info'
 */
function showNewTrigMessage(message, type = 'info') {
    const messageDiv = document.getElementById('new-trig-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `new-trig-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

/**
 * issue #288: Скрывает сообщение в модальном окне New TriG
 */
function hideNewTrigMessage() {
    const messageDiv = document.getElementById('new-trig-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// ==============================================================================
// GLOBAL EXPORTS
// ==============================================================================

// Делаем функции доступными глобально для использования из HTML
if (typeof window !== 'undefined') {
    window.openNewTrigModal = openNewTrigModal;
    window.closeNewTrigModal = closeNewTrigModal;
    window.updateNewTrigFields = updateNewTrigFields;
    window.createNewTrig = createNewTrig;
    window.toggleNewTrigIntermediateSparql = toggleNewTrigIntermediateSparql;
    window.showNewTrigMessage = showNewTrigMessage;
    window.hideNewTrigMessage = hideNewTrigMessage;
    window.SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA = SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA;
    window.SPARQL_ALL_PROCESS_CONCEPTS = SPARQL_ALL_PROCESS_CONCEPTS;
}
