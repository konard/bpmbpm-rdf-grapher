// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/309
// PR #310
// 3_sd_create_new_individ_logic.js - Модуль создания новых индивидов

/**
 * ==============================================================================
 * CREATE NEW INDIVID MODULE
 * ==============================================================================
 *
 * Модуль для создания новых Индивидов в системе RDF Grapher.
 * Позволяет создавать:
 * - Индивид процесса (с автоматическим назначением ExecutorGroup)
 * - Индивид исполнителя (добавление vad:includes в ExecutorGroup)
 *
 * Алгоритм создания индивида:
 * 1. Пользователь выбирает тип: процесс или исполнитель
 * 2. Для процесса:
 *    - Выбирает TriG (схему процесса)
 *    - Выбирает концепт процесса
 *    - Проверяется наличие одноимённого индивида в TriG
 *    - Выбирает vad:hasNext (множественный выбор из справочника концептов)
 *    - Автоматически создаётся ExecutorGroup
 *    - Генерируется INSERT SPARQL
 * 3. Для исполнителя (issue #309: связанные справочники):
 *    - Выбирает TriG (схему процесса)
 *    - Выбирает индивид процесса из выбранного TriG (связанный справочник)
 *    - ExecutorGroup определяется автоматически из выбранного индивида
 *    - Выбирает концепт исполнителя из rtree
 *    - Генерируется INSERT SPARQL для vad:includes в ExecutorGroup
 *
 * @file 3_sd_create_new_individ_logic.js
 * @version 1.0
 * @date 2026-02-06
 * @see 3_sd_create_new_concept_logic.js - Аналогичный модуль для создания концептов
 * @see new_individ_process.md - Анализ именования индивидов
 */

// ==============================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// ==============================================================================

/**
 * Типы операций создания индивида
 */
const NEW_INDIVID_TYPES = {
    PROCESS: 'individ-process',
    EXECUTOR: 'individ-executor'
};

/**
 * Конфигурация типов индивидов
 */
const NEW_INDIVID_CONFIG = {
    [NEW_INDIVID_TYPES.PROCESS]: {
        displayName: 'Индивид процесса',
        description: 'Создание индивида процесса с автоматическим ExecutorGroup'
    },
    [NEW_INDIVID_TYPES.EXECUTOR]: {
        displayName: 'Индивид исполнителя',
        description: 'Добавление исполнителя (vad:includes) в ExecutorGroup'
    }
};

// ==============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ МОДУЛЯ
// ==============================================================================

/**
 * Текущее состояние модуля создания индивида
 */
let newIndividState = {
    isOpen: false,
    selectedType: null,
    selectedTrig: null,
    selectedConcept: null,
    selectedHasNext: [],
    selectedProcessIndivid: null,    // issue #309: выбранный индивид процесса (для исполнителя)
    selectedExecutorGroup: null,     // issue #309: авто-разрешённая ExecutorGroup
    selectedExecutor: null,
    intermediateSparql: ''
};

/**
 * Хранилище промежуточных SPARQL запросов для отображения
 */
let newIndividIntermediateSparqlQueries = [];

// ==============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==============================================================================

/**
 * Получает концепты из quadstore (manual fallback)
 * @param {string} typeUri - URI типа
 * @param {string} graphUri - URI графа
 * @returns {Array<{uri: string, label: string}>}
 */
function getConceptsForIndividManual(typeUri, graphUri) {
    const concepts = [];
    const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        const conceptUris = new Set();
        currentQuads.forEach(quad => {
            if (quad.predicate.value === rdfTypeUri &&
                quad.object.value === typeUri &&
                quad.graph && quad.graph.value === graphUri) {
                conceptUris.add(quad.subject.value);
            }
        });

        conceptUris.forEach(uri => {
            let label = typeof getPrefixedName === 'function'
                ? getPrefixedName(uri, currentPrefixes) : uri;

            currentQuads.forEach(quad => {
                if (quad.subject.value === uri &&
                    quad.predicate.value === rdfsLabelUri &&
                    quad.graph && quad.graph.value === graphUri) {
                    label = quad.object.value;
                }
            });
            concepts.push({ uri, label });
        });
    }
    return concepts;
}

/**
 * Получает все TriG типа VADProcessDia
 * @returns {Array<{uri: string, label: string}>}
 */
function getTrigsForIndivid() {
    const sparqlQuery = NEW_INDIVID_SPARQL.GET_ALL_TRIGS;
    let trigs = [];

    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'trig');
        trigs = results.map(r => ({
            uri: r.uri,
            label: r.label || (typeof getPrefixedName === 'function'
                ? getPrefixedName(r.uri, currentPrefixes) : r.uri)
        }));
    }

    if (trigs.length === 0) {
        const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        const vadProcessDiaUri = 'http://example.org/vad#VADProcessDia';
        const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';

        if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
            currentQuads.forEach(quad => {
                if (quad.predicate.value === rdfTypeUri &&
                    quad.object.value === vadProcessDiaUri) {
                    let label = typeof getPrefixedName === 'function'
                        ? getPrefixedName(quad.subject.value, currentPrefixes)
                        : quad.subject.value;
                    // Find label
                    currentQuads.forEach(q2 => {
                        if (q2.subject.value === quad.subject.value &&
                            q2.predicate.value === rdfsLabelUri) {
                            label = q2.object.value;
                        }
                    });
                    trigs.push({ uri: quad.subject.value, label });
                }
            });
        }
    }

    newIndividIntermediateSparqlQueries.push({
        description: 'Получение всех TriG типа VADProcessDia',
        query: sparqlQuery,
        result: trigs.length > 0
            ? `Найдено ${trigs.length} TriG: ${trigs.map(t => t.label).join(', ')}`
            : 'TriG не найдены'
    });

    return trigs;
}

/**
 * Проверяет, существует ли индивид данного концепта в TriG
 * @param {string} conceptUri - URI концепта
 * @param {string} trigUri - URI TriG
 * @returns {boolean}
 */
function checkIndividExistsInTrig(conceptUri, trigUri) {
    const isSubprocessTrigUri = 'http://example.org/vad#isSubprocessTrig';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        return currentQuads.some(quad =>
            quad.subject.value === conceptUri &&
            quad.predicate.value === isSubprocessTrigUri &&
            quad.object.value === trigUri &&
            quad.graph && quad.graph.value === trigUri
        );
    }
    return false;
}

/**
 * Получает все индивиды процесса в TriG (для справочника hasNext)
 * @param {string} trigUri - URI TriG
 * @returns {Array<{uri: string, label: string}>}
 */
function getIndividsInTrig(trigUri) {
    const isSubprocessTrigUri = 'http://example.org/vad#isSubprocessTrig';
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';
    const ptreeUri = 'http://example.org/vad#ptree';
    const individs = [];

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        currentQuads.forEach(quad => {
            if (quad.predicate.value === isSubprocessTrigUri &&
                quad.object.value === trigUri &&
                quad.graph && quad.graph.value === trigUri) {
                let label = typeof getPrefixedName === 'function'
                    ? getPrefixedName(quad.subject.value, currentPrefixes)
                    : quad.subject.value;

                // Find label from ptree
                currentQuads.forEach(q2 => {
                    if (q2.subject.value === quad.subject.value &&
                        q2.predicate.value === rdfsLabelUri &&
                        q2.graph && q2.graph.value === ptreeUri) {
                        label = q2.object.value;
                    }
                });

                individs.push({ uri: quad.subject.value, label });
            }
        });
    }
    return individs;
}

/**
 * Получает концепты процессов для справочника hasNext
 * Возвращает все концепты процессов из ptree
 * @returns {Array<{uri: string, label: string}>}
 */
function getProcessConceptsForHasNext() {
    const sparqlQuery = NEW_INDIVID_SPARQL.GET_PROCESS_CONCEPTS;
    let concepts = [];

    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }

    if (concepts.length === 0) {
        concepts = getConceptsForIndividManual(
            'http://example.org/vad#TypeProcess',
            'http://example.org/vad#ptree'
        );
    }

    newIndividIntermediateSparqlQueries.push({
        description: 'Получение концептов процессов для справочника hasNext',
        query: sparqlQuery,
        result: concepts.length > 0
            ? `Найдено ${concepts.length} концептов`
            : '(нет результатов)'
    });

    return concepts;
}

/**
 * issue #309: Находит ExecutorGroup для указанного индивида процесса в TriG
 * @param {string} processIndividUri - URI индивида процесса
 * @param {string} trigUri - URI TriG
 * @returns {string|null} URI ExecutorGroup или null
 */
function findExecutorGroupForProcessIndivid(processIndividUri, trigUri) {
    const hasExecutorUri = 'http://example.org/vad#hasExecutor';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        for (const quad of currentQuads) {
            if (quad.subject.value === processIndividUri &&
                quad.predicate.value === hasExecutorUri &&
                quad.graph && quad.graph.value === trigUri) {
                return quad.object.value;
            }
        }
    }
    return null;
}

// ==============================================================================
// ФУНКЦИИ UI: МОДАЛЬНОЕ ОКНО
// ==============================================================================

/**
 * Открывает модальное окно создания нового индивида
 * Вызывается по клику на кнопку "New Individ"
 */
function openNewIndividModal() {
    // Проверяем, что данные загружены
    if (typeof currentQuads === 'undefined' || currentQuads.length === 0) {
        alert('Данные quadstore пусты. Загрузите пример данных (Trig_VADv5 или Trig_VADv6) в разделе "Загрузить пример RDF данных".\n\nQuadstore is empty. Load example data (Trig_VADv5 or Trig_VADv6) in "Load example RDF data" section.');
        return;
    }

    // Очищаем предыдущее состояние
    newIndividState = {
        isOpen: true,
        selectedType: null,
        selectedTrig: null,
        selectedConcept: null,
        selectedHasNext: [],
        selectedProcessIndivid: null,
        selectedExecutorGroup: null,
        selectedExecutor: null,
        intermediateSparql: ''
    };
    newIndividIntermediateSparqlQueries = [];

    const modal = document.getElementById('new-individ-modal');
    if (modal) {
        resetNewIndividForm();

        if (typeof resetModalPosition === 'function') {
            resetModalPosition('new-individ-modal');
        }

        modal.style.display = 'block';

        if (typeof updateSmartDesignFieldsState === 'function') {
            updateSmartDesignFieldsState();
        }
    } else {
        console.error('Модальное окно new-individ-modal не найдено');
    }
}

/**
 * Закрывает модальное окно
 */
function closeNewIndividModal() {
    const modal = document.getElementById('new-individ-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    newIndividState.isOpen = false;

    if (typeof updateSmartDesignFieldsState === 'function') {
        updateSmartDesignFieldsState();
    }
}

/**
 * Сбрасывает форму
 */
function resetNewIndividForm() {
    const typeSelect = document.getElementById('new-individ-type');
    if (typeSelect) typeSelect.value = '';

    const fieldsContainer = document.getElementById('new-individ-fields-container');
    if (fieldsContainer) {
        fieldsContainer.innerHTML = '<p class="new-individ-hint">Выберите тип индивида для отображения полей</p>';
    }

    const intermediateSparqlContainer = document.getElementById('new-individ-intermediate-sparql');
    if (intermediateSparqlContainer) {
        intermediateSparqlContainer.style.display = 'none';
        const textarea = intermediateSparqlContainer.querySelector('textarea');
        if (textarea) textarea.value = '';
    }

    hideNewIndividMessage();
    updateNewIndividCreateButtonState();
}

/**
 * Обработчик изменения типа индивида
 */
function onNewIndividTypeChange() {
    const typeSelect = document.getElementById('new-individ-type');
    const selectedType = typeSelect ? typeSelect.value : null;

    if (!selectedType) {
        resetNewIndividForm();
        return;
    }

    newIndividState.selectedType = selectedType;
    newIndividState.selectedTrig = null;
    newIndividState.selectedConcept = null;
    newIndividState.selectedHasNext = [];
    newIndividState.selectedProcessIndivid = null;
    newIndividState.selectedExecutorGroup = null;
    newIndividState.selectedExecutor = null;
    newIndividIntermediateSparqlQueries = [];

    buildNewIndividForm(selectedType);
    displayNewIndividIntermediateSparql();
    updateNewIndividCreateButtonState();
}

/**
 * Строит форму для выбранного типа индивида
 * @param {string} individType - Тип индивида
 */
function buildNewIndividForm(individType) {
    const fieldsContainer = document.getElementById('new-individ-fields-container');
    if (!fieldsContainer) return;

    let html = '';

    // Выбор TriG
    html += `
        <div class="new-individ-field">
            <label for="new-individ-trig">TriG (схема процесса):</label>
            <select id="new-individ-trig" onchange="onNewIndividTrigChange()">
                <option value="">-- Выберите TriG --</option>
            </select>
            <small class="field-hint">Выберите схему процесса для добавления индивида</small>
        </div>
    `;

    if (individType === NEW_INDIVID_TYPES.PROCESS) {
        // Выбор концепта процесса
        html += `
            <div class="new-individ-field">
                <label for="new-individ-concept">Концепт процесса:</label>
                <select id="new-individ-concept" onchange="onNewIndividConceptChange()">
                    <option value="">-- Выберите концепт --</option>
                </select>
                <small class="field-hint">Выберите концепт процесса для создания индивида</small>
            </div>
        `;

        // Множественный выбор hasNext (из справочника концептов)
        html += `
            <div class="new-individ-field">
                <label>vad:hasNext (выберите следующие элементы):</label>
                <div id="new-individ-hasnext-container" class="new-individ-checkbox-container">
                    <p class="new-individ-hint">Сначала выберите TriG</p>
                </div>
                <small class="field-hint">Множественный выбор из справочника концептов процесса. Предикаты типа vad:includes не заполняются при создании индивида процесса.</small>
            </div>
        `;
    } else if (individType === NEW_INDIVID_TYPES.EXECUTOR) {
        // issue #309: Связанные справочники: TriG → Индивид процесса → (ExecutorGroup авто)
        // Выбор индивида процесса в выбранном TriG
        html += `
            <div class="new-individ-field">
                <label for="new-individ-process-individ">Индивид процесса:</label>
                <select id="new-individ-process-individ" onchange="onNewIndividProcessIndividChange()">
                    <option value="">-- Сначала выберите TriG --</option>
                </select>
                <small class="field-hint">Выберите индивид процесса из выбранной схемы (TriG). ExecutorGroup определяется автоматически.</small>
            </div>
        `;

        // Информация о разрешённой ExecutorGroup (только для отображения)
        html += `
            <div class="new-individ-field" id="new-individ-executor-group-info" style="display: none;">
                <label>ExecutorGroup (автоопределение):</label>
                <div id="new-individ-executor-group-display" class="new-individ-info-display"></div>
                <small class="field-hint">ExecutorGroup создаётся при создании индивида процесса и определяется автоматически</small>
            </div>
        `;

        // Выбор концепта исполнителя из rtree
        html += `
            <div class="new-individ-field">
                <label for="new-individ-executor">Концепт исполнителя:</label>
                <select id="new-individ-executor" onchange="onNewIndividExecutorChange()">
                    <option value="">-- Выберите исполнителя --</option>
                </select>
                <small class="field-hint">Выберите концепт исполнителя (из rtree) для добавления в ExecutorGroup через vad:includes</small>
            </div>
        `;
    }

    // Контейнер для статуса проверки
    html += '<div id="new-individ-check-result" style="display: none;"></div>';

    fieldsContainer.innerHTML = html;

    // Заполняем dropdown TriG
    fillNewIndividTrigDropdown();
}

/**
 * Заполняет dropdown TriG
 */
function fillNewIndividTrigDropdown() {
    const select = document.getElementById('new-individ-trig');
    if (!select) return;

    const trigs = getTrigsForIndivid();
    trigs.forEach(trig => {
        const option = document.createElement('option');
        option.value = trig.uri;
        option.textContent = trig.label || trig.uri;
        select.appendChild(option);
    });
}

/**
 * Обработчик выбора TriG
 */
function onNewIndividTrigChange() {
    const select = document.getElementById('new-individ-trig');
    const trigUri = select ? select.value : null;

    newIndividState.selectedTrig = trigUri;
    newIndividState.selectedConcept = null;
    newIndividState.selectedHasNext = [];

    if (!trigUri) {
        updateNewIndividCreateButtonState();
        return;
    }

    const individType = newIndividState.selectedType;

    if (individType === NEW_INDIVID_TYPES.PROCESS) {
        // Заполняем концепты процессов
        fillNewIndividConceptDropdown();
        // Заполняем справочник hasNext (из концептов процессов)
        fillNewIndividHasNextCheckboxes();
    } else if (individType === NEW_INDIVID_TYPES.EXECUTOR) {
        // issue #309: Заполняем связанный справочник индивидов процесса в выбранном TriG
        fillNewIndividProcessIndividDropdown(trigUri);
        // Заполняем концепты исполнителей из rtree
        fillNewIndividExecutorDropdown();
        // Сбрасываем ExecutorGroup info
        newIndividState.selectedProcessIndivid = null;
        newIndividState.selectedExecutorGroup = null;
        const egInfo = document.getElementById('new-individ-executor-group-info');
        if (egInfo) egInfo.style.display = 'none';
    }

    displayNewIndividIntermediateSparql();
    updateNewIndividCreateButtonState();
}

/**
 * Заполняет dropdown концептов процессов
 */
function fillNewIndividConceptDropdown() {
    const select = document.getElementById('new-individ-concept');
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите концепт --</option>';

    const sparqlQuery = NEW_INDIVID_SPARQL.GET_PROCESS_CONCEPTS;
    let concepts = [];

    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }
    if (concepts.length === 0) {
        concepts = getConceptsForIndividManual(
            'http://example.org/vad#TypeProcess',
            'http://example.org/vad#ptree'
        );
    }

    newIndividIntermediateSparqlQueries.push({
        description: 'Получение концептов процессов из ptree',
        query: sparqlQuery,
        result: concepts.length > 0
            ? `Найдено ${concepts.length} концептов: ${concepts.map(c => c.label || c.uri).join(', ')}`
            : '(нет результатов)'
    });

    concepts.forEach(concept => {
        const option = document.createElement('option');
        option.value = concept.uri;
        option.textContent = concept.label || concept.uri;
        select.appendChild(option);
    });

    displayNewIndividIntermediateSparql();
}

/**
 * Заполняет checkboxes для hasNext (из справочника всех концептов процесса)
 */
function fillNewIndividHasNextCheckboxes() {
    const container = document.getElementById('new-individ-hasnext-container');
    if (!container) return;

    const concepts = getProcessConceptsForHasNext();

    if (concepts.length === 0) {
        container.innerHTML = '<p class="new-individ-hint">Концепты процессов не найдены</p>';
        return;
    }

    let html = '';
    concepts.forEach(concept => {
        const prefixedName = typeof getPrefixedName === 'function'
            ? getPrefixedName(concept.uri, currentPrefixes) : concept.uri;
        const displayLabel = concept.label || prefixedName;

        html += `
            <label class="new-individ-checkbox-label">
                <input type="checkbox" value="${concept.uri}" onchange="onNewIndividHasNextChange()">
                ${displayLabel}
            </label>
        `;
    });

    container.innerHTML = html;
    displayNewIndividIntermediateSparql();
}

/**
 * Обработчик выбора концепта процесса
 */
function onNewIndividConceptChange() {
    const select = document.getElementById('new-individ-concept');
    const conceptUri = select ? select.value : null;
    newIndividState.selectedConcept = conceptUri;

    // Проверяем, есть ли уже такой индивид в TriG
    const checkResult = document.getElementById('new-individ-check-result');
    if (checkResult && conceptUri && newIndividState.selectedTrig) {
        const exists = checkIndividExistsInTrig(conceptUri, newIndividState.selectedTrig);
        if (exists) {
            checkResult.innerHTML = '<div class="new-individ-warning"><strong>Внимание:</strong> Индивид данного концепта уже существует в выбранном TriG. Создание запрещено (допускается только один индивид каждого концепта в TriG).</div>';
            checkResult.style.display = 'block';
        } else {
            checkResult.innerHTML = '<div class="new-individ-success">Проверка пройдена: индивид данного концепта отсутствует в выбранном TriG.</div>';
            checkResult.style.display = 'block';
        }
    }

    displayNewIndividIntermediateSparql();
    updateNewIndividCreateButtonState();
}

/**
 * Обработчик изменения hasNext checkboxes
 */
function onNewIndividHasNextChange() {
    const checkboxes = document.querySelectorAll('#new-individ-hasnext-container input[type="checkbox"]:checked');
    newIndividState.selectedHasNext = Array.from(checkboxes).map(cb => cb.value);
    updateNewIndividCreateButtonState();
}

/**
 * issue #309: Заполняет dropdown индивидов процесса для выбранного TriG
 * Связанный справочник: при выборе TriG загружаются его индивиды процесса
 * @param {string} trigUri - URI TriG
 */
function fillNewIndividProcessIndividDropdown(trigUri) {
    const select = document.getElementById('new-individ-process-individ');
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите индивид процесса --</option>';

    const individs = getIndividsInTrig(trigUri);

    const sparqlQuery = NEW_INDIVID_SPARQL.GET_INDIVIDS_IN_TRIG(trigUri);
    newIndividIntermediateSparqlQueries.push({
        description: 'Получение индивидов процесса из выбранного TriG',
        query: sparqlQuery,
        result: individs.length > 0
            ? `Найдено ${individs.length} индивидов: ${individs.map(i => i.label).join(', ')}`
            : 'Индивиды процесса не найдены'
    });

    individs.forEach(individ => {
        const option = document.createElement('option');
        option.value = individ.uri;
        option.textContent = individ.label || individ.uri;
        select.appendChild(option);
    });

    displayNewIndividIntermediateSparql();
}

/**
 * Заполняет dropdown исполнителей
 */
function fillNewIndividExecutorDropdown() {
    const select = document.getElementById('new-individ-executor');
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите исполнителя --</option>';

    const sparqlQuery = NEW_INDIVID_SPARQL.GET_EXECUTOR_CONCEPTS;
    let concepts = [];

    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }
    if (concepts.length === 0) {
        concepts = getConceptsForIndividManual(
            'http://example.org/vad#TypeExecutor',
            'http://example.org/vad#rtree'
        );
    }

    newIndividIntermediateSparqlQueries.push({
        description: 'Получение концептов исполнителей из rtree',
        query: sparqlQuery,
        result: concepts.length > 0
            ? `Найдено ${concepts.length} исполнителей`
            : '(нет результатов)'
    });

    concepts.forEach(concept => {
        const option = document.createElement('option');
        option.value = concept.uri;
        option.textContent = concept.label || concept.uri;
        select.appendChild(option);
    });

    displayNewIndividIntermediateSparql();
}

/**
 * issue #309: Обработчик выбора индивида процесса (для создания исполнителя)
 * Автоматически разрешает ExecutorGroup через vad:hasExecutor
 */
function onNewIndividProcessIndividChange() {
    const select = document.getElementById('new-individ-process-individ');
    const processIndividUri = select ? select.value : null;

    newIndividState.selectedProcessIndivid = processIndividUri;
    newIndividState.selectedExecutorGroup = null;

    const egInfoContainer = document.getElementById('new-individ-executor-group-info');
    const egDisplay = document.getElementById('new-individ-executor-group-display');

    if (processIndividUri && newIndividState.selectedTrig) {
        // Авто-разрешаем ExecutorGroup для выбранного индивида процесса
        const executorGroupUri = findExecutorGroupForProcessIndivid(
            processIndividUri, newIndividState.selectedTrig
        );

        if (executorGroupUri) {
            newIndividState.selectedExecutorGroup = executorGroupUri;
            const egLabel = typeof getPrefixedName === 'function'
                ? getPrefixedName(executorGroupUri, currentPrefixes)
                : executorGroupUri;

            if (egDisplay) {
                egDisplay.textContent = egLabel;
                egDisplay.style.color = '#28a745';
            }
            if (egInfoContainer) egInfoContainer.style.display = 'block';

            newIndividIntermediateSparqlQueries.push({
                description: 'Авто-определение ExecutorGroup для индивида процесса',
                query: NEW_INDIVID_SPARQL.FIND_EXECUTOR_GROUP_FOR_PROCESS_INDIVID(
                    processIndividUri, newIndividState.selectedTrig
                ),
                result: `Найдена ExecutorGroup: ${egLabel}`
            });
        } else {
            if (egDisplay) {
                egDisplay.textContent = 'ExecutorGroup не найдена для данного индивида процесса';
                egDisplay.style.color = '#dc3545';
            }
            if (egInfoContainer) egInfoContainer.style.display = 'block';
        }
    } else {
        if (egInfoContainer) egInfoContainer.style.display = 'none';
    }

    displayNewIndividIntermediateSparql();
    updateNewIndividCreateButtonState();
}

/**
 * Обработчик выбора исполнителя
 */
function onNewIndividExecutorChange() {
    const select = document.getElementById('new-individ-executor');
    newIndividState.selectedExecutor = select ? select.value : null;
    updateNewIndividCreateButtonState();
}

/**
 * Обновляет состояние кнопки "Создать запрос"
 */
function updateNewIndividCreateButtonState() {
    const createBtn = document.querySelector('.new-individ-create-btn');
    if (!createBtn) return;

    let canCreate = false;

    if (newIndividState.selectedType === NEW_INDIVID_TYPES.PROCESS) {
        const trigSelected = newIndividState.selectedTrig != null;
        const conceptSelected = newIndividState.selectedConcept != null;
        const noConflict = !checkIndividExistsInTrig(
            newIndividState.selectedConcept,
            newIndividState.selectedTrig
        );
        canCreate = trigSelected && conceptSelected && noConflict;
    } else if (newIndividState.selectedType === NEW_INDIVID_TYPES.EXECUTOR) {
        // issue #309: Проверяем TriG + индивид процесса + авто-разрешённая ExecutorGroup + исполнитель
        canCreate = newIndividState.selectedTrig != null &&
                    newIndividState.selectedProcessIndivid != null &&
                    newIndividState.selectedExecutorGroup != null &&
                    newIndividState.selectedExecutor != null;
    }

    createBtn.disabled = !canCreate;
    createBtn.title = canCreate ? '' : 'Заполните все обязательные поля';
}

/**
 * Создаёт итоговый SPARQL запрос для нового индивида
 */
function createNewIndividSparql() {
    hideNewIndividMessage();

    const individType = newIndividState.selectedType;
    const trigUri = newIndividState.selectedTrig;

    if (!individType || !trigUri) {
        showNewIndividMessage('Выберите тип индивида и TriG', 'error');
        return;
    }

    const prefixes = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'vad': 'http://example.org/vad#'
    };

    let sparqlQuery = '';

    if (individType === NEW_INDIVID_TYPES.PROCESS) {
        const conceptUri = newIndividState.selectedConcept;
        if (!conceptUri) {
            showNewIndividMessage('Выберите концепт процесса', 'error');
            return;
        }

        // Проверяем, что индивид не существует
        if (checkIndividExistsInTrig(conceptUri, trigUri)) {
            showNewIndividMessage('Индивид данного концепта уже существует в выбранном TriG', 'error');
            return;
        }

        const trigPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(trigUri, currentPrefixes) : `<${trigUri}>`;

        const individPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(conceptUri, currentPrefixes) : `<${conceptUri}>`;

        // Формируем ID для ExecutorGroup
        const conceptLocalName = conceptUri.split('#').pop();
        const executorGroupUri = `vad:ExecutorGroup_${conceptLocalName}`;
        const individLabel = conceptLocalName;

        // hasNext URIs (prefixed)
        const hasNextPrefixed = newIndividState.selectedHasNext.map(uri =>
            typeof getPrefixedName === 'function'
                ? getPrefixedName(uri, currentPrefixes)
                : `<${uri}>`
        );

        sparqlQuery = NEW_INDIVID_SPARQL.GENERATE_INSERT_PROCESS_INDIVID_QUERY(
            trigPrefixed,
            individPrefixed,
            executorGroupUri,
            hasNextPrefixed,
            individLabel,
            prefixes
        );

    } else if (individType === NEW_INDIVID_TYPES.EXECUTOR) {
        const executorGroupUri = newIndividState.selectedExecutorGroup;
        const executorUri = newIndividState.selectedExecutor;

        if (!executorGroupUri || !executorUri) {
            showNewIndividMessage('Выберите индивид процесса и концепт исполнителя. ExecutorGroup должна определиться автоматически.', 'error');
            return;
        }

        const trigPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(trigUri, currentPrefixes) : `<${trigUri}>`;
        const groupPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(executorGroupUri, currentPrefixes) : `<${executorGroupUri}>`;
        const executorPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(executorUri, currentPrefixes) : `<${executorUri}>`;

        sparqlQuery = NEW_INDIVID_SPARQL.GENERATE_INSERT_EXECUTOR_INDIVID_QUERY(
            trigPrefixed,
            groupPrefixed,
            executorPrefixed,
            prefixes
        );
    }

    // Выводим в Result in SPARQL
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }

    window.isNewIndividQuery = true;

    showNewIndividMessage(
        `SPARQL INSERT запрос для нового индивида успешно сгенерирован. Запрос выведен в "Result in SPARQL".`,
        'success'
    );

    closeNewIndividModal();
}

// ==============================================================================
// ФУНКЦИИ ПРОМЕЖУТОЧНОГО SPARQL
// ==============================================================================

/**
 * Отображает промежуточные SPARQL запросы
 */
function displayNewIndividIntermediateSparql() {
    const container = document.getElementById('new-individ-intermediate-sparql');
    const textarea = container ? container.querySelector('textarea') : null;

    if (!container || !textarea) return;

    if (newIndividIntermediateSparqlQueries.length === 0) {
        container.style.display = 'none';
        return;
    }

    let sparqlText = '# ===== Промежуточные SPARQL запросы и результаты =====\n\n';

    newIndividIntermediateSparqlQueries.forEach((query, index) => {
        sparqlText += `# --- ${index + 1}. ${query.description} ---\n`;
        sparqlText += query.query.trim() + '\n';
        if (query.result) {
            sparqlText += `\n# Результат:\n# ${query.result}\n`;
        }
        sparqlText += '\n';
    });

    textarea.value = sparqlText;
    newIndividState.intermediateSparql = sparqlText;
    container.style.display = 'block';
}

/**
 * Переключает видимость промежуточного SPARQL
 */
function toggleNewIndividIntermediateSparql() {
    const container = document.getElementById('new-individ-intermediate-sparql');
    if (container) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
    }
}

// ==============================================================================
// ФУНКЦИИ СООБЩЕНИЙ
// ==============================================================================

/**
 * Показывает сообщение
 * @param {string} message - Текст
 * @param {string} type - Тип: 'success', 'error', 'warning'
 */
function showNewIndividMessage(message, type = 'info') {
    const messageDiv = document.getElementById('new-individ-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `new-individ-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

/**
 * Скрывает сообщение
 */
function hideNewIndividMessage() {
    const messageDiv = document.getElementById('new-individ-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// ==============================================================================
// issue #309: HELP BUTTON
// ==============================================================================

/**
 * issue #309: Показывает справку по созданию индивидов
 * По аналогии с showNewConceptHelp() в модуле создания концептов
 */
function showNewIndividHelp() {
    const helpText = `Создание нового Индивида — справка:

=== Индивид процесса ===
1. Выберите тип: "Индивид процесса"
2. Выберите TriG (схему процесса), куда будет добавлен индивид
3. Выберите концепт процесса из справочника ptree
4. (Опционально) Укажите vad:hasNext — множественный выбор
   из справочника всех концептов процесса
5. Нажмите "Создать запрос New Individ"

Автоматически создаётся ExecutorGroup с ID формата
ExecutorGroup_<id процесса>.
Предикаты типа vad:includes НЕ заполняются при создании
индивида процесса.

=== Индивид исполнителя ===
1. Выберите тип: "Индивид исполнителя"
2. Выберите TriG (схему процесса)
3. Выберите индивид процесса из выбранной схемы (связанный справочник)
   → ExecutorGroup определяется автоматически
4. Выберите концепт исполнителя из справочника rtree
5. Нажмите "Создать запрос New Individ"

Новый индивид исполнителя добавляется в ExecutorGroup выбранного
индивида процесса через vad:includes.

Примечание: ExecutorGroup создаётся автоматически при создании
индивида процесса. Создание индивида исполнителя лишь добавляет
исполнителя в существующую ExecutorGroup.`;

    alert(helpText);
}

// ==============================================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
// ==============================================================================

if (typeof window !== 'undefined') {
    window.openNewIndividModal = openNewIndividModal;
    window.closeNewIndividModal = closeNewIndividModal;
    window.onNewIndividTypeChange = onNewIndividTypeChange;
    window.onNewIndividTrigChange = onNewIndividTrigChange;
    window.onNewIndividConceptChange = onNewIndividConceptChange;
    window.onNewIndividHasNextChange = onNewIndividHasNextChange;
    window.onNewIndividProcessIndividChange = onNewIndividProcessIndividChange;  // issue #309
    window.onNewIndividExecutorChange = onNewIndividExecutorChange;
    window.toggleNewIndividIntermediateSparql = toggleNewIndividIntermediateSparql;
    window.createNewIndividSparql = createNewIndividSparql;
    window.showNewIndividMessage = showNewIndividMessage;
    window.hideNewIndividMessage = hideNewIndividMessage;
    window.showNewIndividHelp = showNewIndividHelp;  // issue #309
    window.NEW_INDIVID_SPARQL = NEW_INDIVID_SPARQL;
}
