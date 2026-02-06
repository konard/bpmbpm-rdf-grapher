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
 * Алгоритм создания индивида процесса:
 * 1. Пользователь выбирает тип: процесс или исполнитель
 * 2. Для процесса:
 *    - Выбирает TriG (схему процесса)
 *    - Выбирает концепт процесса
 *    - Проверяется наличие одноимённого индивида в TriG
 *    - Выбирает vad:hasNext (множественный выбор из справочника концептов)
 *    - Автоматически создаётся ExecutorGroup
 *    - Генерируется INSERT SPARQL
 * 3. Для исполнителя:
 *    - Выбирает TriG
 *    - Выбирает ExecutorGroup
 *    - Выбирает концепт исполнителя
 *    - Проверяется наличие хотя бы одного использования (vad:includes)
 *    - Генерируется INSERT SPARQL для vad:includes
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
    selectedExecutorGroup: null,
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
 * Получает ExecutorGroups в TriG
 * @param {string} trigUri - URI TriG
 * @returns {Array<{uri: string, label: string}>}
 */
function getExecutorGroupsInTrig(trigUri) {
    const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const executorGroupUri = 'http://example.org/vad#ExecutorGroup';
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';
    const groups = [];

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        currentQuads.forEach(quad => {
            if (quad.predicate.value === rdfTypeUri &&
                quad.object.value === executorGroupUri &&
                quad.graph && quad.graph.value === trigUri) {
                let label = typeof getPrefixedName === 'function'
                    ? getPrefixedName(quad.subject.value, currentPrefixes)
                    : quad.subject.value;

                currentQuads.forEach(q2 => {
                    if (q2.subject.value === quad.subject.value &&
                        q2.predicate.value === rdfsLabelUri &&
                        q2.graph && q2.graph.value === trigUri) {
                        label = q2.object.value;
                    }
                });

                groups.push({ uri: quad.subject.value, label });
            }
        });
    }
    return groups;
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
        // Выбор ExecutorGroup
        html += `
            <div class="new-individ-field">
                <label for="new-individ-executor-group">ExecutorGroup:</label>
                <select id="new-individ-executor-group" onchange="onNewIndividExecutorGroupChange()">
                    <option value="">-- Выберите ExecutorGroup --</option>
                </select>
                <small class="field-hint">Выберите группу исполнителей для добавления</small>
            </div>
        `;

        // Выбор исполнителя
        html += `
            <div class="new-individ-field">
                <label for="new-individ-executor">Концепт исполнителя:</label>
                <select id="new-individ-executor" onchange="onNewIndividExecutorChange()">
                    <option value="">-- Выберите исполнителя --</option>
                </select>
                <small class="field-hint">Выберите исполнителя для добавления в группу</small>
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
        // Заполняем ExecutorGroups
        fillNewIndividExecutorGroupDropdown(trigUri);
        // Заполняем исполнителей
        fillNewIndividExecutorDropdown();
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
 * Заполняет dropdown ExecutorGroups
 * @param {string} trigUri - URI TriG
 */
function fillNewIndividExecutorGroupDropdown(trigUri) {
    const select = document.getElementById('new-individ-executor-group');
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите ExecutorGroup --</option>';

    const groups = getExecutorGroupsInTrig(trigUri);

    const sparqlQuery = NEW_INDIVID_SPARQL.GET_EXECUTOR_GROUPS_FOR_TRIG(trigUri);
    newIndividIntermediateSparqlQueries.push({
        description: 'Получение ExecutorGroups из выбранного TriG',
        query: sparqlQuery,
        result: groups.length > 0
            ? `Найдено ${groups.length} групп: ${groups.map(g => g.label).join(', ')}`
            : 'ExecutorGroups не найдены'
    });

    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.uri;
        option.textContent = group.label || group.uri;
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
 * Обработчик выбора ExecutorGroup
 */
function onNewIndividExecutorGroupChange() {
    const select = document.getElementById('new-individ-executor-group');
    newIndividState.selectedExecutorGroup = select ? select.value : null;
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
        canCreate = newIndividState.selectedTrig != null &&
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
            showNewIndividMessage('Выберите ExecutorGroup и исполнителя', 'error');
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
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
// ==============================================================================

if (typeof window !== 'undefined') {
    window.openNewIndividModal = openNewIndividModal;
    window.closeNewIndividModal = closeNewIndividModal;
    window.onNewIndividTypeChange = onNewIndividTypeChange;
    window.onNewIndividTrigChange = onNewIndividTrigChange;
    window.onNewIndividConceptChange = onNewIndividConceptChange;
    window.onNewIndividHasNextChange = onNewIndividHasNextChange;
    window.onNewIndividExecutorGroupChange = onNewIndividExecutorGroupChange;
    window.onNewIndividExecutorChange = onNewIndividExecutorChange;
    window.toggleNewIndividIntermediateSparql = toggleNewIndividIntermediateSparql;
    window.createNewIndividSparql = createNewIndividSparql;
    window.showNewIndividMessage = showNewIndividMessage;
    window.hideNewIndividMessage = hideNewIndividMessage;
    window.NEW_INDIVID_SPARQL = NEW_INDIVID_SPARQL;
}
