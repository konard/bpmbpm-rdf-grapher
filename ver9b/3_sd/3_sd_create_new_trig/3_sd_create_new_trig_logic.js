// issue #232: Модуль создания нового TriG контейнера
// issue #288: Добавлена поддержка промежуточного SPARQL и улучшено отображение концептов
// issue #290: Двухэтапная загрузка SPARQL - вначале все ptree, затем проверка существующих TriG
// Содержит функции для работы с модальным окном New TriG

// ==============================================================================
// SPARQL QUERIES
// ==============================================================================

/**
 * issue #290: SPARQL-запрос для получения ВСЕХ концептов процессов из ptree.
 * Первый этап двухэтапной загрузки.
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
 * issue #290: SPARQL-запрос для получения процессов, у которых УЖЕ ЕСТЬ VADProcessDia.
 * Второй этап двухэтапной загрузки - определяем, какие процессы запретить для выбора.
 */
const SPARQL_PROCESSES_WITH_VADPROCESSDIA = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT ?process ?trig WHERE {
    GRAPH vad:ptree {
        ?process vad:hasTrig ?trig .
    }
    GRAPH ?trig {
        ?trig rdf:type vad:VADProcessDia .
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
 *
 * issue #290: Унифицировано поведение с New Concept и Del Concept\Individ:
 * - Проверка пустого quadstore ПЕРЕД открытием модального окна
 * - Двухэтапная загрузка SPARQL для заполнения справочника:
 *   1. Получаем все концепты процессов из ptree
 *   2. Определяем, какие уже имеют VADProcessDia (подсвечиваем серым как запретные)
 */
async function openNewTrigModal() {
    // issue #290: Проверяем, что данные загружены ПЕРЕД открытием модального окна
    // Унифицировано с поведением New Concept и Del Concept\Individ
    if (typeof currentQuads === 'undefined' || currentQuads.length === 0) {
        alert('Данные quadstore пусты. Загрузите пример данных (Trig_VADv5 или Trig_VADv6) в разделе "Загрузить пример RDF данных".\n\nQuadstore is empty. Load example data (Trig_VADv5 or Trig_VADv6) in "Load example RDF data" section.');
        return;
    }

    const modal = document.getElementById('new-trig-modal');
    if (!modal) {
        console.error('[3_sd_create_new_trig] Модальное окно new-trig-modal не найдено');
        return;
    }

    // issue #288: Очищаем состояние промежуточных запросов
    newTrigIntermediateSparqlQueries = [];
    hideNewTrigIntermediateSparql();
    hideNewTrigMessage();

    // Заполняем список концептов процессов
    const processSelect = document.getElementById('new-trig-process-concept');
    if (processSelect) {
        processSelect.innerHTML = '<option value="">-- Выберите концепт процесса --</option>';

        // issue #290: Двухэтапная загрузка SPARQL
        // Этап 1: Получаем ВСЕ концепты процессов из ptree
        let allConcepts = [];

        newTrigIntermediateSparqlQueries.push({
            description: 'Этап 1: Получение ВСЕХ концептов процессов из ptree',
            query: SPARQL_ALL_PROCESS_CONCEPTS,
            result: '(выполняется...)'
        });

        if (typeof funSPARQLvaluesComunica === 'function') {
            try {
                allConcepts = await funSPARQLvaluesComunica(SPARQL_ALL_PROCESS_CONCEPTS, 'process');
                console.log(`[3_sd_create_new_trig] issue #290: Этап 1 - найдено ${allConcepts.length} концептов процессов`);
            } catch (error) {
                console.error('[3_sd_create_new_trig] SPARQL query error:', error);
            }
        }

        // Fallback на funSPARQLvalues
        if (allConcepts.length === 0 && typeof funSPARQLvalues === 'function') {
            allConcepts = funSPARQLvalues(SPARQL_ALL_PROCESS_CONCEPTS, 'process');
        }

        // Последний fallback - прямой поиск по квадам
        if (allConcepts.length === 0) {
            allConcepts = getProcessConceptsManual();
        }

        // Обновляем результат первого запроса
        const query1 = newTrigIntermediateSparqlQueries[newTrigIntermediateSparqlQueries.length - 1];
        if (query1) {
            query1.result = allConcepts.length > 0
                ? `Найдено ${allConcepts.length} концептов: ${allConcepts.map(c => c.label || c.uri).join(', ')}`
                : '(концепты не найдены)';
        }

        // Этап 2: Определяем, какие процессы уже имеют VADProcessDia
        const processesWithTrig = new Set();

        newTrigIntermediateSparqlQueries.push({
            description: 'Этап 2: Определение процессов с существующей VADProcessDia',
            query: SPARQL_PROCESSES_WITH_VADPROCESSDIA,
            result: '(выполняется...)'
        });

        if (typeof funSPARQLvaluesComunica === 'function') {
            try {
                const withTrig = await funSPARQLvaluesComunica(SPARQL_PROCESSES_WITH_VADPROCESSDIA, 'process');
                withTrig.forEach(c => processesWithTrig.add(c.uri));
                console.log(`[3_sd_create_new_trig] issue #290: Этап 2 - найдено ${processesWithTrig.size} процессов с VADProcessDia`);
            } catch (error) {
                console.error('[3_sd_create_new_trig] SPARQL query error for processes with trig:', error);
            }
        }

        // Fallback - ручной поиск по квадам
        if (processesWithTrig.size === 0) {
            if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
                currentQuads.forEach(quad => {
                    if (quad.predicate.value === 'http://example.org/vad#hasTrig' ||
                        quad.predicate.value.endsWith('#hasTrig')) {
                        processesWithTrig.add(quad.subject.value);
                    }
                });
            }
        }

        // Обновляем результат второго запроса
        const query2 = newTrigIntermediateSparqlQueries[newTrigIntermediateSparqlQueries.length - 1];
        if (query2) {
            if (processesWithTrig.size > 0) {
                const withTrigLabels = allConcepts
                    .filter(c => processesWithTrig.has(c.uri))
                    .map(c => c.label || c.uri);
                query2.result = `Найдено ${processesWithTrig.size} процессов с VADProcessDia: ${withTrigLabels.join(', ')}`;
            } else {
                query2.result = 'Процессов с существующей VADProcessDia не найдено';
            }
        }

        // issue #290: Заполняем dropdown - все процессы, но те, у которых уже есть TriG, подсвечены серым
        let availableCount = 0;
        let disabledCount = 0;

        if (allConcepts.length === 0) {
            showNewTrigMessage('Не найдено концептов процессов в ptree. Загрузите данные с концептами процессов.', 'error');
        } else {
            allConcepts.forEach(concept => {
                const option = document.createElement('option');
                option.value = concept.uri;

                const hasTrig = processesWithTrig.has(concept.uri);

                if (hasTrig) {
                    // issue #290: Процессы с существующей VADProcessDia показываем серым и запрещаем выбор
                    option.textContent = `${concept.label || concept.uri} (уже имеет VADProcessDia)`;
                    option.disabled = true;
                    option.style.color = '#999';
                    disabledCount++;
                } else {
                    option.textContent = concept.label || concept.uri;
                    availableCount++;
                }

                processSelect.appendChild(option);
            });

            // Показываем информационное сообщение
            if (availableCount === 0) {
                showNewTrigMessage('Все процессы уже имеют VADProcessDia. Новую схему создать невозможно.', 'info');
            } else if (disabledCount > 0) {
                showNewTrigMessage(`Доступно ${availableCount} процессов для создания новой схемы. ${disabledCount} процессов уже имеют VADProcessDia (выделены серым).`, 'info');
            }
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
    window.SPARQL_ALL_PROCESS_CONCEPTS = SPARQL_ALL_PROCESS_CONCEPTS;
    window.SPARQL_PROCESSES_WITH_VADPROCESSDIA = SPARQL_PROCESSES_WITH_VADPROCESSDIA;
}
