// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/252

/**
 * ==============================================================================
 * CREATE NEW CONCEPT MODULE
 * ==============================================================================
 *
 * Модуль для создания новых Концептов (Concept) в системе RDF Grapher.
 * Позволяет создавать:
 * - Концепт процесса (vad:TypeProcess) в vad:ptree
 * - Концепт исполнителя (vad:TypeExecutor) в vad:rtree
 *
 * Алгоритм работы:
 * 1. Пользователь нажимает кнопку "New Concept" в окне Smart Design
 * 2. Выбирает тип концепта из выпадающего списка
 * 3. На основе выбранного типа формируется промежуточный SPARQL запрос
 *    к vad:techtree для получения списка предикатов данного типа
 * 4. Отображается форма с полями для ввода значений предикатов
 * 5. Автоматически генерируемые предикаты отображаются, но заблокированы
 * 6. После заполнения формируется итоговый SPARQL INSERT запрос
 *
 * Используемые технологические объекты из vad:techtree:
 * - vad:ConceptProcessPredicate - для vad:TypeProcess
 * - vad:ConceptExecutorPredicate - для vad:TypeExecutor
 *
 * @file create_new_concept.js
 * @version 1.0
 * @date 2026-01-28
 * @see vad-basic-ontology_tech_Appendix.ttl - Технологические объекты
 * @see ui-documentation.md - Документация UI
 */

// ==============================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// ==============================================================================

/**
 * Конфигурация типов концептов и соответствующих технологических объектов
 *
 * Каждый тип концепта связан с:
 * - techObject: URI технологического объекта в vad:techtree
 * - targetGraph: граф назначения для INSERT запроса
 * - displayName: отображаемое имя для пользователя
 * - autoPredicates: предикаты, заполняемые автоматически
 * - virtualPredicates: виртуальные (вычисляемые) предикаты, не заполняемые
 * - parentSelector: тип объектов для выбора родителя
 */
const NEW_CONCEPT_CONFIG = {
    'vad:TypeProcess': {
        techObject: 'http://example.org/vad#ConceptProcessPredicate',
        techObjectPrefixed: 'vad:ConceptProcessPredicate',
        targetGraph: 'vad:ptree',
        targetGraphUri: 'http://example.org/vad#ptree',
        displayName: 'Концепт процесса (vad:TypeProcess)',
        typeValue: 'vad:TypeProcess',
        typeValueUri: 'http://example.org/vad#TypeProcess',
        // Автоматически устанавливаемые предикаты (отображаются, но заблокированы)
        autoPredicates: ['rdf:type'],
        // Виртуальные предикаты (не вводятся, вычисляются)
        virtualPredicates: [],
        // Предикаты, которые отображаются, но не вводятся
        readOnlyPredicates: ['vad:hasTrig'],
        // Тип объектов для выбора родителя
        parentSelectorType: 'vad:TypeProcess',
        parentSelectorGraph: 'vad:ptree',
        // Дополнительные корневые элементы для выбора родителя
        parentRootOptions: ['vad:ptree']
        // issue #260: Fallback предикаты удалены - используются только загруженные из techtree
    },
    'vad:TypeExecutor': {
        techObject: 'http://example.org/vad#ConceptExecutorPredicate',
        techObjectPrefixed: 'vad:ConceptExecutorPredicate',
        targetGraph: 'vad:rtree',
        targetGraphUri: 'http://example.org/vad#rtree',
        displayName: 'Концепт исполнителя (vad:TypeExecutor)',
        typeValue: 'vad:TypeExecutor',
        typeValueUri: 'http://example.org/vad#TypeExecutor',
        autoPredicates: ['rdf:type'],
        virtualPredicates: [],
        readOnlyPredicates: [],
        parentSelectorType: 'vad:TypeExecutor',
        parentSelectorGraph: 'vad:rtree',
        parentRootOptions: ['vad:rtree']
        // issue #260: Fallback предикаты удалены - используются только загруженные из techtree
    }
};

// SPARQL запросы вынесены в 3_sd_create_new_concept_sparql.js
// в соответствии с концепцией SPARQL-driven Programming (issue #252)

// ==============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ МОДУЛЯ
// ==============================================================================

/**
 * Текущее состояние модуля создания концепта
 */
let newConceptState = {
    isOpen: false,
    selectedType: null,
    predicates: [],
    autoPredicates: [],
    fieldValues: {},
    intermediateSparql: '',
    idGenerationMode: 'auto' // 'auto' или 'manual'
};

/**
 * Хранилище промежуточных SPARQL запросов для отображения
 */
let intermediateSparqlQueries = [];

// ==============================================================================
// ФУНКЦИИ РАБОТЫ С SPARQL
// ==============================================================================

/**
 * Получает предикаты из технологического объекта через SPARQL для создания нового концепта
 * Использует funSPARQLvalues для выполнения запроса
 * issue #260: Fallback предикаты не используются - при отсутствии techtree показывается ошибка
 *
 * Примечание: функция названа getPredicatesForNewConcept чтобы не конфликтовать
 * с существующей функцией getPredicatesFromTechObject в index.html
 *
 * @param {string} techObjectUri - URI технологического объекта
 * @param {Object} config - Конфигурация типа концепта
 * @returns {Array<{uri: string, prefixed: string}>} Массив предикатов
 */
function getPredicatesForNewConcept(techObjectUri, config) {
    const sparqlQuery = NEW_CONCEPT_SPARQL.GET_PREDICATES_FROM_TECH_OBJECT(techObjectUri);

    let predicates = [];

    // Выполняем через funSPARQLvalues (функция из index.html)
    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'predicate');
        predicates = results.map(r => ({
            uri: r.uri,
            prefixed: getPrefixedName(r.uri, currentPrefixes)
        }));
    } else {
        // Fallback: ручной разбор если funSPARQLvalues недоступна
        predicates = getPredicatesForNewConceptManual(techObjectUri);
    }

    // Fix #2: Сохраняем промежуточный запрос вместе с результатом
    intermediateSparqlQueries.push({
        description: 'Получение предикатов из технологического объекта',
        query: sparqlQuery,
        result: predicates.length > 0
            ? predicates.map(p => p.prefixed).join(', ')
            : '(нет результатов)'
    });

    // issue #260: Если данные techtree не найдены, показываем ошибку (без fallback)
    if (predicates.length === 0) {
        console.error('ОШИБКА: techtree не загружен. Необходимо загрузить vad-basic-ontology_tech_Appendix.ttl');
        intermediateSparqlQueries.push({
            description: 'ОШИБКА: techtree не загружен',
            query: '-- ОШИБКА: Нет данных techtree.\n-- Загрузите vad-basic-ontology_tech_Appendix.ttl --',
            result: '(предикаты не найдены)'
        });

        // Показываем уведомление об ошибке
        if (typeof showErrorNotification === 'function') {
            showErrorNotification('Techtree не загружен. Загрузите vad-basic-ontology_tech_Appendix.ttl');
        }

        // Показываем диалог для загрузки файла techtree
        if (typeof showFileNotFoundDialog === 'function') {
            showFileNotFoundDialog({
                title: 'Techtree не загружен',
                message: 'Для создания нового концепта необходимо загрузить технологические данные из файла vad-basic-ontology_tech_Appendix.ttl',
                fileType: '.ttl',
                onFileSelected: async (file) => {
                    try {
                        const content = await file.text();
                        // Парсим и добавляем tech appendix в quadstore
                        if (typeof parseTechAppendix === 'function' && typeof addTechQuadsToStore === 'function') {
                            const quads = await parseTechAppendix(content);
                            if (quads && quads.length > 0) {
                                window.techAppendixQuads = quads;
                                addTechQuadsToStore();
                                if (typeof showSuccessNotification === 'function') {
                                    showSuccessNotification(`Tech appendix загружен из файла: ${file.name}`);
                                }
                                // Повторно загружаем предикаты
                                onNewConceptTypeChange();
                            }
                        }
                    } catch (parseError) {
                        console.error('Ошибка парсинга tech appendix:', parseError);
                        if (typeof showErrorNotification === 'function') {
                            showErrorNotification(`Ошибка парсинга: ${parseError.message}`);
                        }
                    }
                }
            });
        }
    }

    return predicates;
}

/**
 * Ручное получение предикатов из технологического объекта
 * Используется как fallback если funSPARQLvalues недоступна
 *
 * @param {string} techObjectUri - URI технологического объекта
 * @returns {Array<{uri: string, prefixed: string}>} Массив предикатов
 */
function getPredicatesForNewConceptManual(techObjectUri) {
    const predicates = [];
    const includePredicateUri = 'http://example.org/vad#includePredicate';

    // Ищем в currentQuads
    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        currentQuads.forEach(quad => {
            if (quad.subject.value === techObjectUri &&
                quad.predicate.value === includePredicateUri) {
                predicates.push({
                    uri: quad.object.value,
                    prefixed: typeof getPrefixedName === 'function'
                        ? getPrefixedName(quad.object.value, currentPrefixes)
                        : quad.object.value
                });
            }
        });
    }

    return predicates;
}

/**
 * Получает автоматически генерируемые предикаты
 *
 * @param {string} techObjectUri - URI технологического объекта
 * @returns {Array<string>} Массив URI автогенерируемых предикатов
 */
function getAutoGeneratedPredicates(techObjectUri) {
    const sparqlQuery = NEW_CONCEPT_SPARQL.GET_AUTO_GENERATED_PREDICATES(techObjectUri);

    let autoPredicates = [];

    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'predicate');
        autoPredicates = results.map(r => r.uri);
    }

    // Fix #2: Сохраняем промежуточный запрос вместе с результатом
    intermediateSparqlQueries.push({
        description: 'Получение автоматически генерируемых предикатов',
        query: sparqlQuery,
        result: autoPredicates.length > 0
            ? autoPredicates.map(uri => typeof getPrefixedName === 'function' ? getPrefixedName(uri, currentPrefixes) : uri).join(', ')
            : '(нет результатов)'
    });

    return autoPredicates;
}

/**
 * Получает объекты определённого типа для справочника родительских объектов.
 * Issue #250: Обновлена цепочка вызовов — сначала funSPARQLvaluesComunica (полная SPARQL),
 * затем funSPARQLvalues, затем manual fallback.
 *
 * @param {string} typeUri - URI типа
 * @param {string} graphUri - URI графа
 * @returns {Array<{uri: string, label: string}>} Массив объектов
 */
function getObjectsForParentSelector(typeUri, graphUri) {
    const sparqlQuery = NEW_CONCEPT_SPARQL.GET_OBJECTS_BY_TYPE_IN_GRAPH(typeUri, graphUri);

    let results = [];
    let querySource = 'funSPARQLvalues';

    // Issue #250: Попытка выполнить через funSPARQLvaluesComunica (поддерживает OPTIONAL)
    if (typeof funSPARQLvaluesComunica === 'function') {
        // funSPARQLvaluesComunica — async, но для совместимости используем синхронный fallback
        // В будущем весь pipeline станет async
        try {
            // Пробуем синхронный funSPARQLvalues сначала
            if (typeof funSPARQLvalues === 'function') {
                results = funSPARQLvalues(sparqlQuery, 'object');
            }
        } catch (e) {
            console.log('getObjectsForParentSelector: funSPARQLvalues error, trying manual fallback');
        }
    } else if (typeof funSPARQLvalues === 'function') {
        results = funSPARQLvalues(sparqlQuery, 'object');
    }

    // Если SPARQL не вернул результатов, используем manual fallback
    // (SPARQL парсер может не справиться с OPTIONAL и вложенными GRAPH блоками)
    if (results.length === 0) {
        console.log('getObjectsForParentSelector: SPARQL вернул пустой результат, используем manual fallback');
        results = getObjectsByTypeManual(typeUri, graphUri);
        querySource = 'manual fallback';
    }

    // Сохраняем промежуточный запрос вместе с результатом
    intermediateSparqlQueries.push({
        description: 'Получение объектов для справочника родительских элементов',
        query: sparqlQuery,
        result: results.length > 0
            ? `(${querySource}) ${results.map(obj => obj.label || obj.uri).join(', ')}`
            : '(нет результатов)'
    });

    return results;
}

/**
 * Ручное получение объектов по типу
 * Issue #209 Fix #2: Улучшено логирование для диагностики пустых результатов
 *
 * @param {string} typeUri - URI типа
 * @param {string} graphUri - URI графа
 * @returns {Array<{uri: string, label: string}>} Массив объектов
 */
function getObjectsByTypeManual(typeUri, graphUri) {
    const objects = [];
    const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';

    console.log(`getObjectsByTypeManual: Searching for type=${typeUri} in graph=${graphUri}`);

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        console.log(`getObjectsByTypeManual: currentQuads count = ${currentQuads.length}`);

        // Сначала находим все субъекты нужного типа в нужном графе
        const subjectsOfType = new Set();
        currentQuads.forEach(quad => {
            // Issue #209 Fix #2: Улучшенная проверка графа
            // Проверяем соответствие типа и графа
            const quadGraphValue = quad.graph ? quad.graph.value : null;

            if (quad.predicate.value === rdfTypeUri && quad.object.value === typeUri) {
                // Проверяем, совпадает ли граф
                if (quadGraphValue === graphUri) {
                    subjectsOfType.add(quad.subject.value);
                }
            }
        });

        console.log(`getObjectsByTypeManual: Found ${subjectsOfType.size} subjects of type ${typeUri}`);

        // Затем получаем их label
        subjectsOfType.forEach(subjectUri => {
            let label = typeof getPrefixedName === 'function'
                ? getPrefixedName(subjectUri, currentPrefixes)
                : subjectUri;

            // Ищем rdfs:label
            currentQuads.forEach(quad => {
                if (quad.subject.value === subjectUri &&
                    quad.predicate.value === rdfsLabelUri) {
                    label = quad.object.value;
                }
            });

            objects.push({ uri: subjectUri, label: label });
        });

        console.log(`getObjectsByTypeManual: Returning ${objects.length} objects`);
    } else {
        console.log('getObjectsByTypeManual: currentQuads is not available');
    }

    return objects;
}

/**
 * Проверяет существование ID в текущих данных.
 * Сохранена для обратной совместимости — использует прямой перебор currentQuads.
 *
 * @param {string} uri - URI для проверки
 * @returns {boolean} true если ID уже существует
 * @deprecated Используйте checkIdExistsSparql для SPARQL-ориентированного подхода
 */
function checkIdExists(uri) {
    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        return currentQuads.some(quad =>
            quad.subject.value === uri || quad.object.value === uri
        );
    }
    return false;
}

/**
 * Issue #250: Проверяет существование ID через SPARQL-запрос.
 * В соответствии с принципом SPARQL-driven programming (sparql-driven-programming_min1.md),
 * использует funSPARQLvalues вместо прямого обращения к currentQuads.
 *
 * Преимущества:
 * - Независимость от используемой библиотеки (при замене N3.js логика не изменится)
 * - Проверка уникальности в конкретном графе (ptree/rtree), а не во всех данных
 * - Самодокументируемый SPARQL-запрос
 *
 * @param {string} fullUri - Полный URI нового объекта
 * @param {string} graphUri - URI графа для проверки (например, vad:ptree или vad:rtree)
 * @returns {boolean} true если ID уже существует в указанном графе
 */
function checkIdExistsSparql(fullUri, graphUri) {
    const sparqlQuery = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT ?s WHERE {
    GRAPH <${graphUri}> {
        <${fullUri}> ?p ?o .
        BIND(<${fullUri}> AS ?s)
    }
}`;

    // Сохраняем промежуточный запрос для отображения
    intermediateSparqlQueries.push({
        description: 'Проверка уникальности ID нового концепта',
        query: sparqlQuery,
        result: '(выполняется...)'
    });

    let exists = false;

    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 's');
        exists = results.length > 0;
    } else {
        // Fallback на прямую проверку
        exists = checkIdExists(fullUri);
    }

    // Обновляем результат промежуточного запроса
    const lastQuery = intermediateSparqlQueries[intermediateSparqlQueries.length - 1];
    if (lastQuery && lastQuery.description === 'Проверка уникальности ID нового концепта') {
        lastQuery.result = exists
            ? `ID уже существует: ${fullUri}`
            : `ID свободен: ${fullUri}`;
    }

    return exists;
}

// ==============================================================================
// ФУНКЦИИ ГЕНЕРАЦИИ ID
// ==============================================================================

/**
 * Генерирует ID на основе label (замена пробелов на подчёркивания)
 *
 * @param {string} label - Исходный label
 * @returns {string} Сгенерированный ID
 *
 * @example
 * generateIdFromLabel("Мой процесс") // "Мой_процесс"
 * generateIdFromLabel("Process 1.1") // "Process_1.1"
 */
function generateIdFromLabel(label) {
    if (!label) return '';

    // Заменяем пробелы на подчёркивания
    let id = label.replace(/\s+/g, '_');

    // Убираем специальные символы, кроме подчёркивания, точки, тире и цифр
    id = id.replace(/[^a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u04010-9_.\-]/g, '');

    return id;
}

/**
 * Формирует полный URI для нового концепта
 *
 * @param {string} id - Локальный ID (без префикса)
 * @param {string} prefix - Префикс (по умолчанию 'vad')
 * @returns {string} Полный URI
 */
function buildConceptUri(id, prefix = 'vad') {
    if (typeof currentPrefixes !== 'undefined' && currentPrefixes[prefix]) {
        return currentPrefixes[prefix] + id;
    }
    return `http://example.org/${prefix}#${id}`;
}

// ==============================================================================
// ФУНКЦИИ UI: МОДАЛЬНОЕ ОКНО
// ==============================================================================

/**
 * Открывает модальное окно создания нового концепта
 * Вызывается по клику на кнопку "New Concept"
 */
function openNewConceptModal() {
    // Issue #223: Проверяем, что данные загружены и распарсены
    if (typeof currentQuads === 'undefined' || currentQuads.length === 0) {
        alert('Сначала загрузите и отобразите RDF данные (нажмите кнопку "Показать").\n\nFirst load and display RDF data (click "Показать" button).');
        return;
    }

    // Очищаем предыдущее состояние
    newConceptState = {
        isOpen: true,
        selectedType: null,
        predicates: [],
        autoPredicates: [],
        fieldValues: {},
        intermediateSparql: '',
        idGenerationMode: 'auto'
    };
    intermediateSparqlQueries = [];

    const modal = document.getElementById('new-concept-modal');
    if (modal) {
        // Сбрасываем форму
        resetNewConceptForm();
        modal.style.display = 'block';

        // Обновляем состояние полей Smart Design
        if (typeof updateSmartDesignFieldsState === 'function') {
            updateSmartDesignFieldsState();
        }
    } else {
        console.error('Модальное окно new-concept-modal не найдено');
    }
}

/**
 * Закрывает модальное окно создания нового концепта
 */
function closeNewConceptModal() {
    const modal = document.getElementById('new-concept-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    newConceptState.isOpen = false;

    // Обновляем состояние полей Smart Design
    if (typeof updateSmartDesignFieldsState === 'function') {
        updateSmartDesignFieldsState();
    }
}

/**
 * Сбрасывает форму создания концепта
 */
function resetNewConceptForm() {
    // Сбрасываем выбор типа концепта
    const typeSelect = document.getElementById('new-concept-type');
    if (typeSelect) {
        typeSelect.value = '';
    }

    // Очищаем контейнер полей
    const fieldsContainer = document.getElementById('new-concept-fields-container');
    if (fieldsContainer) {
        fieldsContainer.innerHTML = '<p class="new-concept-hint">Выберите тип концепта для отображения полей ввода</p>';
    }

    // Очищаем промежуточный SPARQL
    const intermediateSparqlContainer = document.getElementById('new-concept-intermediate-sparql');
    if (intermediateSparqlContainer) {
        intermediateSparqlContainer.style.display = 'none';
        intermediateSparqlContainer.querySelector('textarea').value = '';
    }

    // Сбрасываем сообщения
    hideNewConceptMessage();
}

/**
 * Обработчик изменения типа концепта
 * Вызывается при выборе типа в выпадающем списке
 */
function onNewConceptTypeChange() {
    const typeSelect = document.getElementById('new-concept-type');
    const selectedType = typeSelect ? typeSelect.value : null;

    if (!selectedType || !NEW_CONCEPT_CONFIG[selectedType]) {
        resetNewConceptForm();
        return;
    }

    newConceptState.selectedType = selectedType;
    intermediateSparqlQueries = [];

    const config = NEW_CONCEPT_CONFIG[selectedType];

    // Получаем предикаты из технологического объекта (передаём config для fallback)
    const predicates = getPredicatesForNewConcept(config.techObject, config);
    newConceptState.predicates = predicates;

    // Получаем автоматически генерируемые предикаты
    const autoPredicates = getAutoGeneratedPredicates(config.techObject);
    newConceptState.autoPredicates = autoPredicates;

    // Строим форму
    buildNewConceptForm(config, predicates, autoPredicates);

    // Отображаем промежуточный SPARQL
    displayIntermediateSparql();
}

/**
 * Строит форму ввода для нового концепта
 *
 * @param {Object} config - Конфигурация типа концепта
 * @param {Array} predicates - Список предикатов
 * @param {Array} autoPredicates - Список автоматических предикатов
 */
function buildNewConceptForm(config, predicates, autoPredicates) {
    const fieldsContainer = document.getElementById('new-concept-fields-container');
    if (!fieldsContainer) return;

    let html = '';

    // Поле ID с выбором режима генерации
    html += `
        <div class="new-concept-field new-concept-field-id">
            <label>ID нового концепта:</label>
            <div class="new-concept-id-options">
                <label class="new-concept-radio">
                    <input type="radio" name="id-generation-mode" value="auto" checked onchange="onIdGenerationModeChange()">
                    Автоматически из label (замена пробелов на _)
                </label>
                <label class="new-concept-radio">
                    <input type="radio" name="id-generation-mode" value="manual" onchange="onIdGenerationModeChange()">
                    Ввести вручную
                </label>
            </div>
            <input type="text" id="new-concept-id" placeholder="ID будет сгенерирован из label" readonly>
            <small class="field-hint">URI: vad:{ID}</small>
        </div>
    `;

    // Перебираем предикаты и создаём поля
    predicates.forEach(predicate => {
        const predicateUri = predicate.uri;
        const predicatePrefixed = predicate.prefixed;

        // Проверяем, является ли предикат автоматическим
        const isAuto = config.autoPredicates.includes(predicatePrefixed) ||
                       autoPredicates.includes(predicateUri);

        // Проверяем, является ли предикат read-only
        const isReadOnly = config.readOnlyPredicates &&
                          config.readOnlyPredicates.includes(predicatePrefixed);

        // Проверяем, является ли предикат виртуальным
        const isVirtual = config.virtualPredicates &&
                         config.virtualPredicates.includes(predicatePrefixed);

        if (isVirtual) {
            // Виртуальные предикаты не отображаем
            return;
        }

        html += buildPredicateField(predicatePrefixed, predicateUri, config, isAuto, isReadOnly);
    });

    fieldsContainer.innerHTML = html;

    // Инициализируем справочники после построения формы
    initializeParentSelector(config);
}

/**
 * Строит HTML для поля ввода предиката
 *
 * @param {string} predicatePrefixed - Предикат в префиксной форме
 * @param {string} predicateUri - URI предиката
 * @param {Object} config - Конфигурация типа концепта
 * @param {boolean} isAuto - Является ли предикат автоматическим
 * @param {boolean} isReadOnly - Является ли предикат только для чтения
 * @returns {string} HTML разметка поля
 */
function buildPredicateField(predicatePrefixed, predicateUri, config, isAuto, isReadOnly) {
    const fieldId = `new-concept-field-${predicatePrefixed.replace(':', '-')}`;
    const disabled = isAuto || isReadOnly ? 'disabled' : '';
    const fieldClass = isAuto ? 'new-concept-field-auto' : (isReadOnly ? 'new-concept-field-readonly' : '');

    let fieldHtml = `<div class="new-concept-field ${fieldClass}">`;
    fieldHtml += `<label for="${fieldId}">${predicatePrefixed}:`;

    if (isAuto) {
        fieldHtml += ' <span class="auto-badge">(авто)</span>';
    } else if (isReadOnly) {
        fieldHtml += ' <span class="readonly-badge">(только чтение)</span>';
    }

    fieldHtml += '</label>';

    // Определяем тип поля по предикату
    switch (predicatePrefixed) {
        case 'rdf:type':
            // rdf:type - автоматически заполняется типом концепта
            fieldHtml += `
                <input type="text" id="${fieldId}" value="${config.typeValue}" ${disabled}
                       data-predicate="${predicatePrefixed}" data-predicate-uri="${predicateUri}">
                <small class="field-hint">Тип объекта устанавливается автоматически</small>
            `;
            break;

        case 'rdfs:label':
            // rdfs:label - текстовое поле с обработчиком для автогенерации ID
            fieldHtml += `
                <input type="text" id="${fieldId}" placeholder="Введите название концепта" ${disabled}
                       data-predicate="${predicatePrefixed}" data-predicate-uri="${predicateUri}"
                       oninput="onLabelInput()">
                <small class="field-hint">Название будет использоваться для автогенерации ID</small>
            `;
            break;

        case 'dcterms:description':
            // dcterms:description - многострочное текстовое поле
            fieldHtml += `
                <textarea id="${fieldId}" rows="3" placeholder="Введите описание концепта" ${disabled}
                          data-predicate="${predicatePrefixed}" data-predicate-uri="${predicateUri}"></textarea>
                <small class="field-hint">Описание концепта (необязательно)</small>
            `;
            break;

        case 'vad:hasParentObj':
            // vad:hasParentObj - выпадающий список с родительскими объектами
            // Fix #3: Добавлен onchange для обновления состояния кнопки "Создать запрос"
            fieldHtml += `
                <select id="${fieldId}" ${disabled}
                        data-predicate="${predicatePrefixed}" data-predicate-uri="${predicateUri}"
                        onchange="onParentObjChange()">
                    <option value="">-- Выберите родительский элемент --</option>
                </select>
                <small class="field-hint">Родительский элемент в иерархии</small>
            `;
            break;

        case 'vad:hasTrig':
            // vad:hasTrig - показывается, но не редактируется
            fieldHtml += `
                <input type="text" id="${fieldId}" value="" disabled
                       data-predicate="${predicatePrefixed}" data-predicate-uri="${predicateUri}"
                       placeholder="TriG создаётся после создания концепта">
                <small class="field-hint">TriG-схема может быть создана только для существующего концепта процесса</small>
            `;
            break;

        default:
            // По умолчанию - текстовое поле
            fieldHtml += `
                <input type="text" id="${fieldId}" placeholder="Введите значение" ${disabled}
                       data-predicate="${predicatePrefixed}" data-predicate-uri="${predicateUri}">
            `;
    }

    fieldHtml += '</div>';
    return fieldHtml;
}

/**
 * Инициализирует справочник родительских объектов
 * Issue #209 Fix #2: Улучшено логирование для диагностики
 *
 * @param {Object} config - Конфигурация типа концепта
 */
function initializeParentSelector(config) {
    const parentSelect = document.getElementById('new-concept-field-vad-hasParentObj');
    if (!parentSelect) return;

    console.log('initializeParentSelector: Starting with config:', {
        typeValueUri: config.typeValueUri,
        targetGraphUri: config.targetGraphUri
    });

    // Получаем объекты для справочника
    const objects = getObjectsForParentSelector(
        config.typeValueUri,
        config.targetGraphUri
    );

    console.log(`initializeParentSelector: Got ${objects.length} objects from getObjectsForParentSelector`);

    // Очищаем и заполняем список
    parentSelect.innerHTML = '<option value="">-- Выберите родительский элемент --</option>';

    // Добавляем корневые опции (vad:ptree или vad:rtree)
    if (config.parentRootOptions) {
        config.parentRootOptions.forEach(rootOption => {
            const rootUri = typeof currentPrefixes !== 'undefined' && currentPrefixes['vad']
                ? currentPrefixes['vad'] + rootOption.replace('vad:', '')
                : `http://example.org/vad#${rootOption.replace('vad:', '')}`;

            const option = document.createElement('option');
            option.value = rootUri;
            option.textContent = `${rootOption} (корень)`;
            parentSelect.appendChild(option);
        });
    }

    // Добавляем найденные объекты
    objects.forEach(obj => {
        const option = document.createElement('option');
        option.value = obj.uri;
        option.textContent = obj.label || obj.uri;
        parentSelect.appendChild(option);
    });

    console.log(`initializeParentSelector: Total options in dropdown: ${parentSelect.options.length}`);

    // Fix #3: Обновляем состояние кнопки после заполнения справочника
    updateCreateButtonState();
}

/**
 * Обработчик изменения режима генерации ID
 */
function onIdGenerationModeChange() {
    const autoMode = document.querySelector('input[name="id-generation-mode"][value="auto"]');
    const idInput = document.getElementById('new-concept-id');

    if (autoMode && autoMode.checked) {
        newConceptState.idGenerationMode = 'auto';
        idInput.readOnly = true;
        idInput.placeholder = 'ID будет сгенерирован из label';
        // Обновляем ID из текущего label
        onLabelInput();
    } else {
        newConceptState.idGenerationMode = 'manual';
        idInput.readOnly = false;
        idInput.placeholder = 'Введите ID вручную';
    }
}

/**
 * Обработчик ввода в поле label
 * Автоматически генерирует ID если включён режим автогенерации
 * Issue #209 Fix #1: Также обновляет состояние кнопки создания
 */
function onLabelInput() {
    const labelInput = document.getElementById('new-concept-field-rdfs-label');
    const idInput = document.getElementById('new-concept-id');

    // Генерируем ID автоматически если режим авто
    if (newConceptState.idGenerationMode === 'auto' && labelInput && idInput) {
        const label = labelInput.value;
        const generatedId = generateIdFromLabel(label);
        idInput.value = generatedId;
    }

    // Issue #209 Fix #1: Обновляем состояние кнопки при изменении label
    updateCreateButtonState();
}

/**
 * Fix #3: Обработчик изменения выбора родительского объекта
 * Обновляет состояние кнопки "Создать запрос New Concept"
 */
function onParentObjChange() {
    updateCreateButtonState();
}

/**
 * Issue #209 Fix #1: Обновляет состояние кнопки "Создать запрос New Concept"
 * Кнопка активна только если заполнены все обязательные поля:
 * - Выбран тип концепта
 * - Заполнен rdfs:label (название)
 * - Выбран родительский объект (vad:hasParentObj)
 */
function updateCreateButtonState() {
    const createBtn = document.querySelector('.new-concept-create-btn');
    const parentSelect = document.getElementById('new-concept-field-vad-hasParentObj');
    const labelInput = document.getElementById('new-concept-field-rdfs-label');

    if (!createBtn) return;

    // Кнопка неактивна если:
    // 1. Не выбран тип концепта
    // 2. Не заполнен rdfs:label (название)
    // 3. Не выбран родительский объект
    const typeSelected = newConceptState.selectedType != null;
    const labelFilled = labelInput && labelInput.value && labelInput.value.trim() !== '';
    const parentSelected = parentSelect && parentSelect.value && parentSelect.value.trim() !== '';

    if (typeSelected && labelFilled && parentSelected) {
        createBtn.disabled = false;
        createBtn.title = '';
    } else {
        createBtn.disabled = true;
        if (!typeSelected) {
            createBtn.title = 'Сначала выберите тип концепта';
        } else if (!labelFilled) {
            createBtn.title = 'Введите название концепта (rdfs:label)';
        } else if (!parentSelected) {
            createBtn.title = 'Сначала выберите родительский элемент (vad:hasParentObj)';
        }
    }
}

/**
 * Отображает промежуточные SPARQL запросы
 * Fix #2: Теперь также показывает результаты выполнения запросов
 */
function displayIntermediateSparql() {
    const container = document.getElementById('new-concept-intermediate-sparql');
    const textarea = container ? container.querySelector('textarea') : null;

    if (!container || !textarea) return;

    if (intermediateSparqlQueries.length === 0) {
        container.style.display = 'none';
        return;
    }

    let sparqlText = '# ===== Промежуточные SPARQL запросы и результаты =====\n\n';

    intermediateSparqlQueries.forEach((query, index) => {
        sparqlText += `# --- ${index + 1}. ${query.description} ---\n`;
        sparqlText += query.query.trim() + '\n';
        // Fix #2: Добавляем результат выполнения запроса
        if (query.result) {
            sparqlText += `\n# Результат:\n# ${query.result}\n`;
        }
        sparqlText += '\n';
    });

    textarea.value = sparqlText;
    newConceptState.intermediateSparql = sparqlText;

    // Показываем контейнер
    container.style.display = 'block';
}

/**
 * Переключает видимость промежуточного SPARQL
 */
function toggleIntermediateSparql() {
    const container = document.getElementById('new-concept-intermediate-sparql');
    if (container) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
    }
}

// ==============================================================================
// ФУНКЦИИ ГЕНЕРАЦИИ ИТОГОВОГО SPARQL
// ==============================================================================

/**
 * Fix #5: Санитизирует ID концепта, удаляя лишние префиксы
 * Предотвращает ошибку вида vad:vad:Something
 *
 * @param {string} id - Исходный ID
 * @returns {string} Санитизированный ID без префикса
 */
function sanitizeConceptId(id) {
    if (!id) return '';

    let sanitized = id.trim();

    // Удаляем префиксы вида "prefix:" в начале строки
    // Поддерживаемые префиксы: vad:, rdf:, rdfs:, и др.
    const prefixPattern = /^([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/;
    const match = sanitized.match(prefixPattern);

    if (match) {
        // Если есть префикс, берём только локальную часть
        sanitized = match[2];
        console.log(`sanitizeConceptId: удалён префикс "${match[1]}:", ID: "${match[2]}"`);
    }

    return sanitized;
}

/**
 * Создаёт итоговый SPARQL запрос для нового концепта
 * Вызывается по кнопке "Создать запрос New Concept"
 */
function createNewConceptSparql() {
    hideNewConceptMessage();

    const selectedType = newConceptState.selectedType;
    if (!selectedType || !NEW_CONCEPT_CONFIG[selectedType]) {
        showNewConceptMessage('Выберите тип концепта', 'error');
        return;
    }

    const config = NEW_CONCEPT_CONFIG[selectedType];

    // Собираем значения полей
    // Fix #5: Санитизируем ID, удаляя возможные лишние префиксы
    const rawId = document.getElementById('new-concept-id')?.value?.trim();
    const id = sanitizeConceptId(rawId);
    if (!id) {
        showNewConceptMessage('Введите или сгенерируйте ID концепта', 'error');
        return;
    }

    // Проверяем уникальность ID
    // Issue #250: используем SPARQL-запрос для проверки уникальности в конкретном графе
    const fullUri = buildConceptUri(id);
    if (checkIdExistsSparql(fullUri, config.targetGraphUri)) {
        showNewConceptMessage(`Концепт с ID "${id}" уже существует в ${config.targetGraph}. Выберите другой ID.`, 'error');
        return;
    }

    // Собираем триплеты
    const triples = collectFormTriples(config, id);

    if (triples.length === 0) {
        showNewConceptMessage('Заполните хотя бы одно обязательное поле (rdfs:label)', 'error');
        return;
    }

    // Генерируем SPARQL INSERT запрос
    const prefixes = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'dcterms': 'http://purl.org/dc/terms/',
        'vad': 'http://example.org/vad#'
    };

    const sparqlQuery = NEW_CONCEPT_SPARQL.GENERATE_INSERT_QUERY(
        config.targetGraph,
        triples,
        `vad:${id}`,
        prefixes
    );

    // Выводим в поле Result in SPARQL
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }

    // Отмечаем что это запрос New Concept (аналогично isNewTrigQuery)
    if (typeof isNewTrigQuery !== 'undefined') {
        window.isNewConceptQuery = true;
    }

    // Показываем сообщение об успехе
    showNewConceptMessage(
        `SPARQL INSERT запрос для нового концепта "${id}" успешно сгенерирован. ` +
        `Запрос выведен в "Result in SPARQL".`,
        'success'
    );

    // Закрываем модальное окно
    closeNewConceptModal();
}

/**
 * Собирает значения из формы в массив триплетов
 *
 * @param {Object} config - Конфигурация типа концепта
 * @param {string} id - ID нового концепта
 * @returns {Array<{predicate: string, object: string, isLiteral: boolean}>} Массив триплетов
 */
function collectFormTriples(config, id) {
    const triples = [];

    // rdf:type - всегда добавляем
    triples.push({
        predicate: 'rdf:type',
        object: config.typeValue,
        isLiteral: false
    });

    // Перебираем поля формы
    const fields = document.querySelectorAll('#new-concept-fields-container [data-predicate]');

    fields.forEach(field => {
        const predicatePrefixed = field.dataset.predicate;
        const value = field.value?.trim();

        // Пропускаем rdf:type (уже добавлен)
        if (predicatePrefixed === 'rdf:type') return;

        // Пропускаем пустые значения
        if (!value) return;

        // Пропускаем vad:hasTrig (он read-only и пустой)
        if (predicatePrefixed === 'vad:hasTrig') return;

        // Определяем, является ли значение литералом
        const isLiteral = ['rdfs:label', 'dcterms:description'].includes(predicatePrefixed);

        // Для vad:hasParentObj преобразуем URI в prefixed форму
        let objectValue = value;
        if (predicatePrefixed === 'vad:hasParentObj' && value.startsWith('http://')) {
            objectValue = typeof getPrefixedName === 'function'
                ? getPrefixedName(value, currentPrefixes)
                : value;
        }

        triples.push({
            predicate: predicatePrefixed,
            object: objectValue,
            isLiteral: isLiteral
        });
    });

    return triples;
}

// ==============================================================================
// ФУНКЦИИ СООБЩЕНИЙ
// ==============================================================================

/**
 * Показывает сообщение в модальном окне New Concept
 *
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения: 'success', 'error', 'warning'
 */
function showNewConceptMessage(message, type = 'info') {
    const messageDiv = document.getElementById('new-concept-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `new-concept-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

/**
 * Скрывает сообщение в модальном окне New Concept
 */
function hideNewConceptMessage() {
    const messageDiv = document.getElementById('new-concept-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// ==============================================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
// ==============================================================================

// Делаем функции доступными глобально для использования из HTML
if (typeof window !== 'undefined') {
    window.openNewConceptModal = openNewConceptModal;
    window.closeNewConceptModal = closeNewConceptModal;
    window.onNewConceptTypeChange = onNewConceptTypeChange;
    window.onIdGenerationModeChange = onIdGenerationModeChange;
    window.onLabelInput = onLabelInput;
    window.onParentObjChange = onParentObjChange;           // Fix #3
    window.updateCreateButtonState = updateCreateButtonState; // Fix #3
    window.toggleIntermediateSparql = toggleIntermediateSparql;
    window.createNewConceptSparql = createNewConceptSparql;
    window.generateIdFromLabel = generateIdFromLabel;
    window.sanitizeConceptId = sanitizeConceptId;            // Fix #5
    window.checkIdExistsSparql = checkIdExistsSparql;        // Issue #250
    window.NEW_CONCEPT_CONFIG = NEW_CONCEPT_CONFIG;
    window.NEW_CONCEPT_SPARQL = NEW_CONCEPT_SPARQL;
}
