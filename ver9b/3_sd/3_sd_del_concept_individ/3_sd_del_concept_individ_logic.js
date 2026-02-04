// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/252
// 3_sd_del_concept_individ_logic.js - Модуль удаления концептов и индивидов
/**
 * ==============================================================================
 * DELETE CONCEPT/INDIVID MODULE
 * ==============================================================================
 *
 * Модуль для удаления Концептов и Индивидов в системе RDF Grapher.
 * Позволяет удалять:
 * - Концепт процесса (vad:TypeProcess) из vad:ptree
 * - Концепт исполнителя (vad:TypeExecutor) из vad:rtree
 * - Индивид процесса из vad:VADProcessDia
 * - Индивид исполнителя из vad:VADProcessDia
 * - Схему процесса (TriG типа vad:VADProcessDia)
 *
 * Алгоритм работы:
 * 1. Пользователь нажимает кнопку "Del Concept\Individ" в окне Smart Design
 * 2. Выбирает тип операции удаления из выпадающего списка:
 *    - Удалить концепт процесса
 *    - Удалить концепт исполнителя
 *    - Удалить индивид процесса
 *    - Удалить индивид исполнителя
 *    - Удалить схему процесса (TriG)
 * 3. В зависимости от типа операции:
 *    - Для концептов: проверяется наличие индивидов и дочерних элементов
 *    - Для индивидов: показывается список индивидов для удаления
 *    - Для схем: показывается список TriG для удаления
 * 4. Формируются промежуточные SPARQL запросы для проверок
 * 5. Генерируется итоговый SPARQL DELETE запрос
 *
 * Правила удаления:
 *
 * 1. Удаление концепта процесса (vad:TypeProcess):
 *    - Проверка наличия индивидов процесса (isSubprocessTrig)
 *    - Проверка наличия схемы процесса (hasTrig)
 *    - Проверка наличия дочерних процессов (hasParentObj)
 *    - Если найдены индивиды/схема - ошибка, сначала удалите их
 *    - Если найдены дочерние - ошибка, сначала исправьте hasParentObj
 *
 * 2. Удаление концепта исполнителя (vad:TypeExecutor):
 *    - Проверка использования исполнителя в TriG (vad:includes)
 *    - Если найден - ошибка со списком TriG, где используется
 *
 * 3. Удаление индивида процесса:
 *    - Выбор концепта процесса
 *    - Показ всех индивидов (кнопка "Показать индивиды")
 *    - Удаление всех триплетов с subject = id удаляемого индивида
 *
 * 4. Удаление индивида исполнителя:
 *    - Выбор концепта исполнителя
 *    - Показ всех TriG, где используется (кнопка "Показать индивиды")
 *    - Удаление vad:includes из соответствующих TriG
 *
 * 5. Удаление схемы процесса (TriG):
 *    - Выбор TriG для удаления
 *    - Удаление всего графа TriG
 *    - Удаление триплета vad:hasTrig в концепте процесса
 *
 * @file 3_sd_del_concept_individ_logic.js
 * @version 1.0
 * @date 2026-01-29
 * @see 3_sd_create_new_concept_logic.js - Аналогичный модуль для создания
 * @see sparql-driven-programming.md - Концепция SPARQL-driven программирования
 */

// ==============================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// ==============================================================================

/**
 * Типы операций удаления
 */
const DEL_OPERATION_TYPES = {
    CONCEPT_PROCESS: 'concept-process',
    CONCEPT_EXECUTOR: 'concept-executor',
    INDIVID_PROCESS: 'individ-process',
    INDIVID_EXECUTOR: 'individ-executor',
    TRIG_SCHEMA: 'trig-schema'
};

/**
 * Конфигурация типов операций удаления
 */
const DEL_CONCEPT_CONFIG = {
    [DEL_OPERATION_TYPES.CONCEPT_PROCESS]: {
        displayName: 'Удалить концепт процесса',
        description: 'Удаление концепта процесса (vad:TypeProcess) из vad:ptree',
        targetGraph: 'vad:ptree',
        targetGraphUri: 'http://example.org/vad#ptree',
        typeValue: 'vad:TypeProcess',
        typeValueUri: 'http://example.org/vad#TypeProcess',
        // Проверки перед удалением
        checks: ['individuals', 'schema', 'children']
    },
    [DEL_OPERATION_TYPES.CONCEPT_EXECUTOR]: {
        displayName: 'Удалить концепт исполнителя',
        description: 'Удаление концепта исполнителя (vad:TypeExecutor) из vad:rtree',
        targetGraph: 'vad:rtree',
        targetGraphUri: 'http://example.org/vad#rtree',
        typeValue: 'vad:TypeExecutor',
        typeValueUri: 'http://example.org/vad#TypeExecutor',
        // Проверки перед удалением
        checks: ['usedInTrigs']
    },
    [DEL_OPERATION_TYPES.INDIVID_PROCESS]: {
        displayName: 'Удалить индивид процесса',
        description: 'Удаление индивида процесса из TriG типа vad:VADProcessDia',
        // Индивиды находятся в разных TriG
        hasShowIndividualsButton: true,
        // ВНИМАНИЕ: Функция не рекомендована, т.к. не удаляет объекты vad:ExecutorGroup_
        // и предикаты vad:hasNext других индивидов процесса.
        // WARNING: This function is not recommended because it does not delete
        // vad:ExecutorGroup_ objects and vad:hasNext predicates of other process individuals.
        notRecommended: true,
        warningMessage: 'Функция не рекомендована, т.к. не удаляет объекты vad:ExecutorGroup_ и предикаты vad:hasNext других индивидов процесса.'
    },
    [DEL_OPERATION_TYPES.INDIVID_EXECUTOR]: {
        displayName: 'Удалить индивид исполнителя',
        description: 'Удаление vad:includes из TriG типа vad:VADProcessDia',
        hasShowIndividualsButton: true
    },
    [DEL_OPERATION_TYPES.TRIG_SCHEMA]: {
        displayName: 'Удалить схему процесса (TriG)',
        description: 'Удаление TriG типа vad:VADProcessDia и связи vad:hasTrig'
    }
};

// SPARQL запросы вынесены в 3_sd_del_concept_individ_sparql.js
// в соответствии с концепцией SPARQL-driven Programming (issue #252)

// ==============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ МОДУЛЯ
// ==============================================================================

/**
 * Текущее состояние модуля удаления
 */
let delConceptState = {
    isOpen: false,
    selectedOperation: null,
    selectedConcept: null,
    selectedIndividuals: [],
    foundIndividuals: [],
    foundTrigs: [],
    validationErrors: [],
    intermediateSparql: ''
};

/**
 * Хранилище промежуточных SPARQL запросов для отображения
 */
let delIntermediateSparqlQueries = [];

// ==============================================================================
// ФУНКЦИИ РАБОТЫ С SPARQL
// ==============================================================================

/**
 * Получает концепты процессов из ptree для dropdown
 * Issue #252: Обновлена цепочка вызовов — funSPARQLvaluesComunica → funSPARQLvalues → manual fallback
 * @returns {Array<{uri: string, label: string}>} Массив концептов
 */
function getProcessConceptsForDeletion() {
    const sparqlQuery = DEL_CONCEPT_SPARQL.GET_PROCESS_CONCEPTS;

    let concepts = [];

    // Issue #252: Пробуем сначала через funSPARQLvalues (синхронный)
    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }

    // Issue #252: Если funSPARQLvalues вернул пустой результат, используем ручной поиск
    // (funSPARQLvaluesComunica async — для полной поддержки OPTIONAL требуется async pipeline)
    if (concepts.length === 0) {
        concepts = getConceptsManual('http://example.org/vad#TypeProcess', 'http://example.org/vad#ptree');
    }

    delIntermediateSparqlQueries.push({
        description: 'Получение концептов процессов из ptree',
        query: sparqlQuery,
        result: concepts.length > 0
            ? concepts.map(c => c.label || c.uri).join(', ')
            : '(нет результатов)'
    });

    return concepts;
}

/**
 * Получает концепты исполнителей из rtree для dropdown
 * Issue #252: Обновлена цепочка вызовов — funSPARQLvaluesComunica → funSPARQLvalues → manual fallback
 * @returns {Array<{uri: string, label: string}>} Массив концептов
 */
function getExecutorConceptsForDeletion() {
    const sparqlQuery = DEL_CONCEPT_SPARQL.GET_EXECUTOR_CONCEPTS;

    let concepts = [];

    // Issue #252: Пробуем сначала через funSPARQLvalues (синхронный)
    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }

    // Issue #252: Если funSPARQLvalues вернул пустой результат, используем ручной поиск
    if (concepts.length === 0) {
        concepts = getConceptsManual('http://example.org/vad#TypeExecutor', 'http://example.org/vad#rtree');
    }

    delIntermediateSparqlQueries.push({
        description: 'Получение концептов исполнителей из rtree',
        query: sparqlQuery,
        result: concepts.length > 0
            ? concepts.map(c => c.label || c.uri).join(', ')
            : '(нет результатов)'
    });

    return concepts;
}

/**
 * Ручное получение концептов (fallback)
 * @param {string} typeUri - URI типа концепта
 * @param {string} graphUri - URI графа
 * @returns {Array<{uri: string, label: string}>} Массив концептов
 */
function getConceptsManual(typeUri, graphUri) {
    const concepts = [];
    const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        const conceptUris = new Set();

        // Найти все концепты с указанным типом в указанном графе
        currentQuads.forEach(quad => {
            if (quad.predicate.value === rdfTypeUri &&
                quad.object.value === typeUri &&
                quad.graph && quad.graph.value === graphUri) {
                conceptUris.add(quad.subject.value);
            }
        });

        conceptUris.forEach(uri => {
            let label = typeof getPrefixedName === 'function'
                ? getPrefixedName(uri, currentPrefixes)
                : uri;

            // Ищем label В ТОМ ЖЕ ГРАФЕ, где находится концепт
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
 * Проверяет наличие индивидов для концепта процесса
 * Issue #217: Теперь также проверяет, используется ли сам концепт как индивид в других TriG
 * @param {string} conceptUri - URI концепта
 * @returns {Array<{uri: string, trig: string, label: string}>} Найденные индивиды
 */
function checkProcessIndividuals(conceptUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_PROCESS_INDIVIDUALS(conceptUri);

    // 1. Ищем индивиды ВНУТРИ схемы данного концепта (через hasTrig)
    let individuals = findProcessIndividualsManual(conceptUri);

    delIntermediateSparqlQueries.push({
        description: 'Проверка наличия индивидов В схеме концепта',
        query: sparqlQuery,
        result: individuals.length > 0
            ? `Найдено ${individuals.length} индивидов: ${individuals.map(i => i.label || i.uri).join(', ')}`
            : 'Индивиды в схеме не найдены'
    });

    // 2. Issue #217: Проверяем, используется ли сам концепт как индивид в ДРУГИХ TriG
    const conceptAsIndividual = findConceptAsIndividualInTrigs(conceptUri);

    const checkConceptAsIndividSparql = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

# Проверка: используется ли концепт как индивид (подпроцесс) в каких-либо TriG
SELECT ?trig WHERE {
    GRAPH ?trig {
        <${conceptUri}> vad:isSubprocessTrig ?trig .
    }
}`;

    delIntermediateSparqlQueries.push({
        description: 'Проверка использования концепта как индивида в TriG',
        query: checkConceptAsIndividSparql,
        result: conceptAsIndividual.length > 0
            ? `Концепт используется как индивид в ${conceptAsIndividual.length} TriG: ${conceptAsIndividual.map(i => typeof getPrefixedName === 'function' ? getPrefixedName(i.trig, currentPrefixes) : i.trig).join(', ')}`
            : 'Концепт не используется как индивид'
    });

    // Объединяем результаты: возвращаем индивиды из схемы + использования концепта как индивида
    return [...individuals, ...conceptAsIndividual];
}

/**
 * Issue #221 Fix #2: Ручной поиск индивидов процесса для операции "Удалить индивид процесса"
 *
 * Индивид процесса - это использование концепта процесса (из ptree) в схеме процесса (TriG типа VADProcessDia).
 * Индивид идентифицируется по предикату vad:isSubprocessTrig в TriG типа VADProcessDia.
 *
 * При выборе концепта процесса (например vad:p2.2) эта функция ищет ВСЕ использования
 * данного концепта как индивида (подпроцесса) во всех TriG типа VADProcessDia.
 *
 * @param {string} conceptUri - URI концепта процесса
 * @returns {Array} Найденные индивиды (использования концепта в схемах)
 */
function findProcessIndividualsManual(conceptUri) {
    const individuals = [];
    const isSubprocessTrigUri = 'http://example.org/vad#isSubprocessTrig';
    const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const vadProcessDiaUri = 'http://example.org/vad#VADProcessDia';

    // Issue #221 Fix #2: Отладочная информация (отключена по умолчанию)
    const DEBUG_INDIVID_SEARCH = false;

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        if (DEBUG_INDIVID_SEARCH) {
            console.log(`[findProcessIndividualsManual] Поиск индивидов для концепта: ${conceptUri}`);
            console.log(`[findProcessIndividualsManual] Всего квадов: ${currentQuads.length}`);
        }

        // Issue #221 Fix #2: Находим все TriG типа VADProcessDia
        const vadProcessDiaTrigs = new Set();
        currentQuads.forEach(quad => {
            if (quad.predicate.value === rdfTypeUri &&
                quad.object.value === vadProcessDiaUri) {
                vadProcessDiaTrigs.add(quad.subject.value);
                if (DEBUG_INDIVID_SEARCH) {
                    console.log(`[findProcessIndividualsManual] Найден TriG типа VADProcessDia: ${quad.subject.value}`);
                }
            }
        });

        if (DEBUG_INDIVID_SEARCH) {
            console.log(`[findProcessIndividualsManual] Всего TriG типа VADProcessDia: ${vadProcessDiaTrigs.size}`);
        }

        // Issue #221 Fix #2: Ищем использования данного концепта как индивида (vad:isSubprocessTrig)
        // во ВСЕХ TriG типа VADProcessDia
        currentQuads.forEach(quad => {
            // Проверяем предикат vad:isSubprocessTrig
            const predicateMatches = quad.predicate.value === isSubprocessTrigUri ||
                quad.predicate.value.endsWith('#isSubprocessTrig');

            if (!predicateMatches) return;

            // Проверяем, что subject совпадает с искомым концептом
            const subjectMatches = quad.subject.value === conceptUri ||
                (typeof getPrefixedName === 'function' &&
                 getPrefixedName(quad.subject.value, currentPrefixes) === getPrefixedName(conceptUri, currentPrefixes));

            if (!subjectMatches) return;

            // Проверяем, что граф является TriG типа VADProcessDia
            if (quad.graph && vadProcessDiaTrigs.has(quad.graph.value)) {
                individuals.push({
                    uri: quad.subject.value,
                    trig: quad.graph.value,
                    label: typeof getPrefixedName === 'function'
                        ? getPrefixedName(quad.subject.value, currentPrefixes)
                        : quad.subject.value
                });

                if (DEBUG_INDIVID_SEARCH) {
                    console.log(`[findProcessIndividualsManual] Найден индивид: ${quad.subject.value} в TriG: ${quad.graph.value}`);
                }
            }
        });

        if (DEBUG_INDIVID_SEARCH) {
            console.log(`[findProcessIndividualsManual] Итого найдено индивидов: ${individuals.length}`);
        }
    }

    return individuals;
}

/**
 * Issue #217: Проверяет, используется ли концепт процесса как индивид (подпроцесс)
 * в каких-либо TriG схемах (vad:isSubprocessTrig).
 * Это проверка для операции "Удаление концепта" - нельзя удалить концепт,
 * если он используется как индивид в схемах процессов.
 * @param {string} conceptUri - URI концепта процесса
 * @returns {Array} Найденные использования концепта как индивида
 */
function findConceptAsIndividualInTrigs(conceptUri) {
    const usages = [];
    const isSubprocessTrigUri = 'http://example.org/vad#isSubprocessTrig';

    // Issue #219 Fix #1: Отладочная информация (отключена по умолчанию)
    const DEBUG_INDIVID_DETECTION = false;

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        if (DEBUG_INDIVID_DETECTION) {
            console.log(`[findConceptAsIndividualInTrigs] Поиск для концепта: ${conceptUri}`);
            console.log(`[findConceptAsIndividualInTrigs] Всего квадов: ${currentQuads.length}`);
        }

        // Ищем все случаи, где данный концепт используется как индивид (subject с isSubprocessTrig)
        currentQuads.forEach(quad => {
            // Issue #219 Fix #1: Расширенная проверка - также поддерживаем сокращенные URI
            const subjectMatches = quad.subject.value === conceptUri ||
                (typeof getPrefixedName === 'function' &&
                 getPrefixedName(quad.subject.value, currentPrefixes) === getPrefixedName(conceptUri, currentPrefixes));

            const predicateMatches = quad.predicate.value === isSubprocessTrigUri ||
                quad.predicate.value.endsWith('#isSubprocessTrig');

            if (DEBUG_INDIVID_DETECTION && predicateMatches) {
                console.log(`[findConceptAsIndividualInTrigs] Найден isSubprocessTrig: subject=${quad.subject.value}, graph=${quad.graph ? quad.graph.value : 'undefined'}`);
            }

            if (subjectMatches && predicateMatches && quad.graph) {
                usages.push({
                    uri: conceptUri,
                    trig: quad.graph.value,
                    label: typeof getPrefixedName === 'function'
                        ? getPrefixedName(conceptUri, currentPrefixes)
                        : conceptUri
                });

                if (DEBUG_INDIVID_DETECTION) {
                    console.log(`[findConceptAsIndividualInTrigs] Добавлено использование в TriG: ${quad.graph.value}`);
                }
            }
        });

        if (DEBUG_INDIVID_DETECTION) {
            console.log(`[findConceptAsIndividualInTrigs] Найдено использований: ${usages.length}`);
        }
    } else {
        if (DEBUG_INDIVID_DETECTION) {
            console.log(`[findConceptAsIndividualInTrigs] currentQuads не определён или не массив`);
        }
    }

    return usages;
}

/**
 * Проверяет наличие схемы (hasTrig) для концепта
 * Issue #252: Обновлён — сначала пробует funSPARQLvalues, затем manual fallback
 * @param {string} conceptUri - URI концепта
 * @returns {Array<string>} URI найденных TriG
 */
function checkProcessSchema(conceptUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_PROCESS_SCHEMA(conceptUri);

    let trigs = [];

    // Issue #252: Пробуем через funSPARQLvalues (запрос простой, без OPTIONAL)
    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'trig');
        trigs = results.map(r => r.uri);
    }

    // Fallback на manual поиск при пустом результате
    if (trigs.length === 0) {
        const hasTrigUri = 'http://example.org/vad#hasTrig';
        const ptreeUri = 'http://example.org/vad#ptree';

        if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
            currentQuads.forEach(quad => {
                if (quad.subject.value === conceptUri &&
                    quad.predicate.value === hasTrigUri &&
                    quad.graph && quad.graph.value === ptreeUri) {
                    trigs.push(quad.object.value);
                }
            });
        }
    }

    delIntermediateSparqlQueries.push({
        description: 'Проверка наличия схемы процесса (hasTrig)',
        query: sparqlQuery,
        result: trigs.length > 0
            ? `Найдено ${trigs.length} схем: ${trigs.map(t => typeof getPrefixedName === 'function' ? getPrefixedName(t, currentPrefixes) : t).join(', ')}`
            : 'Схемы не найдены'
    });

    return trigs;
}

/**
 * Проверяет наличие дочерних элементов
 * Issue #252: Обновлён — сначала пробует funSPARQLvalues, затем manual fallback
 * @param {string} conceptUri - URI родительского концепта
 * @param {string} graphUri - URI графа (ptree или rtree)
 * @returns {Array<{uri: string, label: string}>} Найденные дочерние элементы
 */
function checkChildrenElements(conceptUri, graphUri) {
    const isProcess = graphUri.includes('ptree');
    const sparqlQuery = isProcess
        ? DEL_CONCEPT_SPARQL.CHECK_CHILDREN_PROCESSES(conceptUri)
        : DEL_CONCEPT_SPARQL.CHECK_CHILDREN_EXECUTORS(conceptUri);

    let children = [];

    // Issue #252: Пробуем через funSPARQLvalues
    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'child');
        children = results.map(r => ({
            uri: r.uri,
            label: r.label || (typeof getPrefixedName === 'function'
                ? getPrefixedName(r.uri, currentPrefixes)
                : r.uri)
        }));
    }

    // Fallback на manual поиск при пустом результате
    if (children.length === 0) {
        const hasParentObjUri = 'http://example.org/vad#hasParentObj';

        if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
            currentQuads.forEach(quad => {
                if (quad.predicate.value === hasParentObjUri &&
                    quad.object.value === conceptUri &&
                    quad.graph && quad.graph.value === graphUri) {
                    children.push({
                        uri: quad.subject.value,
                        label: typeof getPrefixedName === 'function'
                            ? getPrefixedName(quad.subject.value, currentPrefixes)
                            : quad.subject.value
                    });
                }
            });
        }
    }

    delIntermediateSparqlQueries.push({
        description: `Проверка наличия дочерних ${isProcess ? 'процессов' : 'исполнителей'}`,
        query: sparqlQuery,
        result: children.length > 0
            ? `Найдено ${children.length} дочерних элементов: ${children.map(c => c.label).join(', ')}`
            : 'Дочерние элементы не найдены'
    });

    return children;
}

/**
 * Проверяет использование исполнителя в TriG
 * Issue #252: Обновлён — сначала пробует funSPARQLvalues, затем manual fallback
 * @param {string} executorUri - URI исполнителя
 * @returns {Array<{trig: string, processIndivid: string}>} Найденные использования
 */
function checkExecutorUsage(executorUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_EXECUTOR_USAGE(executorUri);

    let usages = [];

    // Issue #252: Пробуем через funSPARQLvalues
    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'trig');
        usages = results.map(r => ({
            trig: r.uri,
            processIndivid: r.label || r.uri // label содержит processIndivid если доступен
        }));
    }

    // Fallback на manual поиск при пустом результате
    if (usages.length === 0) {
        const includesUri = 'http://example.org/vad#includes';

        if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
            currentQuads.forEach(quad => {
                if (quad.predicate.value === includesUri &&
                    quad.object.value === executorUri &&
                    quad.graph) {
                    usages.push({
                        trig: quad.graph.value,
                        processIndivid: quad.subject.value
                    });
                }
            });
        }
    }

    delIntermediateSparqlQueries.push({
        description: 'Проверка использования исполнителя в TriG',
        query: sparqlQuery,
        result: usages.length > 0
            ? `Найдено ${usages.length} использований в TriG: ${usages.map(u => typeof getPrefixedName === 'function' ? getPrefixedName(u.trig, currentPrefixes) : u.trig).join(', ')}`
            : 'Исполнитель не используется'
    });

    return usages;
}

/**
 * Получает все TriG типа VADProcessDia
 * Issue #252: Обновлён — сначала пробует funSPARQLvalues, затем manual fallback
 * @returns {Array<{uri: string, label: string}>} Массив TriG
 */
function getAllTrigs() {
    const sparqlQuery = DEL_CONCEPT_SPARQL.GET_ALL_TRIGS;

    let trigs = [];

    // Issue #252: Пробуем через funSPARQLvalues
    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'trig');
        trigs = results.map(r => ({
            uri: r.uri,
            label: r.label || (typeof getPrefixedName === 'function'
                ? getPrefixedName(r.uri, currentPrefixes)
                : r.uri)
        }));
    }

    // Fallback на manual поиск при пустом результате
    if (trigs.length === 0) {
        const rdfTypeUri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        const vadProcessDiaUri = 'http://example.org/vad#VADProcessDia';

        if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
            currentQuads.forEach(quad => {
                if (quad.predicate.value === rdfTypeUri &&
                    quad.object.value === vadProcessDiaUri) {
                    trigs.push({
                        uri: quad.subject.value,
                        label: typeof getPrefixedName === 'function'
                            ? getPrefixedName(quad.subject.value, currentPrefixes)
                            : quad.subject.value
                    });
                }
            });
        }
    }

    delIntermediateSparqlQueries.push({
        description: 'Получение всех TriG типа VADProcessDia',
        query: sparqlQuery,
        result: trigs.length > 0
            ? `Найдено ${trigs.length} TriG: ${trigs.map(t => t.label).join(', ')}`
            : 'TriG не найдены'
    });

    return trigs;
}

/**
 * Находит концепт процесса для указанного TriG
 * @param {string} trigUri - URI TriG
 * @returns {string|null} URI концепта или null
 */
function findConceptForTrig(trigUri) {
    const hasTrigUri = 'http://example.org/vad#hasTrig';
    const ptreeUri = 'http://example.org/vad#ptree';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        for (const quad of currentQuads) {
            if (quad.predicate.value === hasTrigUri &&
                quad.object.value === trigUri &&
                quad.graph && quad.graph.value === ptreeUri) {
                return quad.subject.value;
            }
        }
    }

    return null;
}

// ==============================================================================
// ФУНКЦИИ UI: МОДАЛЬНОЕ ОКНО
// ==============================================================================

/**
 * Открывает модальное окно удаления концепта/индивида
 * Вызывается по клику на кнопку "Del Concept\Individ"
 */
function openDelConceptModal() {
    // Issue #223, #282: Проверяем, что данные загружены и распарсены
    // issue #282: Удалено сообщение "нажмите кнопку Показать" - данные загружаются автоматически
    if (typeof currentQuads === 'undefined' || currentQuads.length === 0) {
        alert('Данные quadstore пусты. Загрузите пример данных (Trig_VADv5 или Trig_VADv6) в разделе "Загрузить пример RDF данных".\n\nQuadstore is empty. Load example data (Trig_VADv5 or Trig_VADv6) in "Load example RDF data" section.');
        return;
    }

    // Очищаем предыдущее состояние
    delConceptState = {
        isOpen: true,
        selectedOperation: null,
        selectedConcept: null,
        selectedIndividuals: [],
        foundIndividuals: [],
        foundTrigs: [],
        validationErrors: [],
        intermediateSparql: ''
    };
    delIntermediateSparqlQueries = [];

    const modal = document.getElementById('del-concept-modal');
    if (modal) {
        resetDelConceptForm();
        modal.style.display = 'block';

        if (typeof updateSmartDesignFieldsState === 'function') {
            updateSmartDesignFieldsState();
        }
    } else {
        console.error('Модальное окно del-concept-modal не найдено');
    }
}

/**
 * Закрывает модальное окно удаления
 */
function closeDelConceptModal() {
    const modal = document.getElementById('del-concept-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    delConceptState.isOpen = false;

    if (typeof updateSmartDesignFieldsState === 'function') {
        updateSmartDesignFieldsState();
    }
}

/**
 * Сбрасывает форму удаления
 */
function resetDelConceptForm() {
    const operationSelect = document.getElementById('del-concept-operation');
    if (operationSelect) {
        operationSelect.value = '';
    }

    const fieldsContainer = document.getElementById('del-concept-fields-container');
    if (fieldsContainer) {
        fieldsContainer.innerHTML = '<p class="del-concept-hint">Выберите тип операции для отображения полей</p>';
    }

    const resultsContainer = document.getElementById('del-concept-results-container');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }

    const intermediateSparqlContainer = document.getElementById('del-concept-intermediate-sparql');
    if (intermediateSparqlContainer) {
        intermediateSparqlContainer.style.display = 'none';
        const textarea = intermediateSparqlContainer.querySelector('textarea');
        if (textarea) {
            textarea.value = '';
        }
    }

    hideDelConceptMessage();
    updateDelButtonsState();
}

/**
 * Обработчик изменения типа операции
 */
function onDelOperationChange() {
    const operationSelect = document.getElementById('del-concept-operation');
    const selectedOperation = operationSelect ? operationSelect.value : null;

    if (!selectedOperation || !DEL_CONCEPT_CONFIG[selectedOperation]) {
        resetDelConceptForm();
        return;
    }

    delConceptState.selectedOperation = selectedOperation;
    delConceptState.selectedConcept = null;
    delConceptState.foundIndividuals = [];
    delConceptState.validationErrors = [];
    delIntermediateSparqlQueries = [];

    const config = DEL_CONCEPT_CONFIG[selectedOperation];

    buildDelConceptForm(config, selectedOperation);
    displayDelIntermediateSparql();
    updateDelButtonsState();
}

/**
 * Строит форму для выбранной операции удаления
 * @param {Object} config - Конфигурация операции
 * @param {string} operationType - Тип операции
 */
function buildDelConceptForm(config, operationType) {
    const fieldsContainer = document.getElementById('del-concept-fields-container');
    if (!fieldsContainer) return;

    let html = '';

    // Добавляем предупреждение, если функция не рекомендована
    if (config && config.notRecommended && config.warningMessage) {
        html += `<div class="del-concept-warning" style="background-color: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
            <strong>⚠️ Внимание:</strong> ${config.warningMessage}
        </div>`;
    }

    switch (operationType) {
        case DEL_OPERATION_TYPES.CONCEPT_PROCESS:
        case DEL_OPERATION_TYPES.INDIVID_PROCESS:
            // Dropdown для выбора концепта процесса
            html += buildConceptSelector('process', 'Выберите концепт процесса:');
            break;

        case DEL_OPERATION_TYPES.CONCEPT_EXECUTOR:
        case DEL_OPERATION_TYPES.INDIVID_EXECUTOR:
            // Dropdown для выбора концепта исполнителя
            html += buildConceptSelector('executor', 'Выберите концепт исполнителя:');
            break;

        case DEL_OPERATION_TYPES.TRIG_SCHEMA:
            // Dropdown для выбора TriG
            html += buildTrigSelector();
            break;
    }

    // Добавляем контейнер для результатов
    html += '<div id="del-concept-results-container" style="display: none;"></div>';

    fieldsContainer.innerHTML = html;

    // Инициализируем dropdown после построения формы
    initializeDelDropdowns(operationType);
}

/**
 * Строит HTML для выбора концепта
 * @param {string} type - Тип: 'process' или 'executor'
 * @param {string} label - Текст label
 * @returns {string} HTML
 */
function buildConceptSelector(type, label) {
    return `
        <div class="del-concept-field">
            <label for="del-concept-select">${label}</label>
            <select id="del-concept-select" onchange="onDelConceptSelect()">
                <option value="">-- Выберите ${type === 'process' ? 'процесс' : 'исполнителя'} --</option>
            </select>
            <small class="field-hint">Выберите элемент для проверки и удаления</small>
        </div>
    `;
}

/**
 * Строит HTML для выбора TriG
 * @returns {string} HTML
 */
function buildTrigSelector() {
    return `
        <div class="del-concept-field">
            <label for="del-trig-select">Выберите схему (TriG) для удаления:</label>
            <select id="del-trig-select" onchange="onDelTrigSelect()">
                <option value="">-- Выберите TriG --</option>
            </select>
            <small class="field-hint">Будет удалён весь граф TriG и связь vad:hasTrig</small>
        </div>
    `;
}

/**
 * Инициализирует dropdowns для выбранной операции
 * @param {string} operationType - Тип операции
 */
function initializeDelDropdowns(operationType) {
    switch (operationType) {
        case DEL_OPERATION_TYPES.CONCEPT_PROCESS:
        case DEL_OPERATION_TYPES.INDIVID_PROCESS:
            fillConceptDropdown('process');
            break;

        case DEL_OPERATION_TYPES.CONCEPT_EXECUTOR:
        case DEL_OPERATION_TYPES.INDIVID_EXECUTOR:
            fillConceptDropdown('executor');
            break;

        case DEL_OPERATION_TYPES.TRIG_SCHEMA:
            fillTrigDropdown();
            break;
    }

    displayDelIntermediateSparql();
}

/**
 * Заполняет dropdown концептов
 * @param {string} type - Тип: 'process' или 'executor'
 */
function fillConceptDropdown(type) {
    const select = document.getElementById('del-concept-select');
    if (!select) return;

    const concepts = type === 'process'
        ? getProcessConceptsForDeletion()
        : getExecutorConceptsForDeletion();

    concepts.forEach(concept => {
        const option = document.createElement('option');
        option.value = concept.uri;
        option.textContent = concept.label || concept.uri;
        select.appendChild(option);
    });
}

/**
 * Заполняет dropdown TriG
 */
function fillTrigDropdown() {
    const select = document.getElementById('del-trig-select');
    if (!select) return;

    const trigs = getAllTrigs();

    trigs.forEach(trig => {
        const option = document.createElement('option');
        option.value = trig.uri;
        option.textContent = trig.label || trig.uri;
        select.appendChild(option);
    });
}

/**
 * Обработчик выбора концепта
 */
function onDelConceptSelect() {
    const select = document.getElementById('del-concept-select');
    const conceptUri = select ? select.value : null;

    if (!conceptUri) {
        delConceptState.selectedConcept = null;
        hideDelResults();
        updateDelButtonsState();
        return;
    }

    delConceptState.selectedConcept = conceptUri;
    delConceptState.validationErrors = [];
    delConceptState.foundIndividuals = [];

    // Выполняем проверки в зависимости от типа операции
    performValidationChecks();
    displayDelIntermediateSparql();
    updateDelButtonsState();
}

/**
 * Обработчик выбора TriG
 */
function onDelTrigSelect() {
    const select = document.getElementById('del-trig-select');
    const trigUri = select ? select.value : null;

    if (!trigUri) {
        delConceptState.selectedConcept = null;
        hideDelResults();
        updateDelButtonsState();
        return;
    }

    delConceptState.selectedConcept = trigUri;
    delConceptState.validationErrors = [];

    displayDelIntermediateSparql();
    updateDelButtonsState();
}

/**
 * Выполняет проверки перед удалением
 */
function performValidationChecks() {
    const operationType = delConceptState.selectedOperation;
    const conceptUri = delConceptState.selectedConcept;
    const config = DEL_CONCEPT_CONFIG[operationType];

    if (!config || !conceptUri) return;

    const resultsContainer = document.getElementById('del-concept-results-container');
    if (!resultsContainer) return;

    let resultsHtml = '';
    delConceptState.validationErrors = [];

    switch (operationType) {
        case DEL_OPERATION_TYPES.CONCEPT_PROCESS:
            // Issue #217: Проверка индивидов (включая проверку использования концепта как индивида)
            const individuals = checkProcessIndividuals(conceptUri);
            if (individuals.length > 0) {
                // Разделяем индивиды на два типа для более понятного сообщения
                const individualsInSchema = individuals.filter(i => i.uri !== conceptUri);
                const conceptAsIndividual = individuals.filter(i => i.uri === conceptUri);

                let errorMessage = '';
                if (individualsInSchema.length > 0 && conceptAsIndividual.length > 0) {
                    errorMessage = `Найдено ${individualsInSchema.length} индивидов в схеме концепта и концепт используется как индивид в ${conceptAsIndividual.length} TriG. Сначала удалите все индивиды и использования концепта.`;
                } else if (conceptAsIndividual.length > 0) {
                    errorMessage = `Концепт используется как индивид (подпроцесс) в ${conceptAsIndividual.length} TriG. Сначала удалите эти индивиды процесса из соответствующих схем.`;
                } else {
                    errorMessage = `Найдено ${individualsInSchema.length} индивидов процесса в схеме. Сначала удалите все индивиды.`;
                }

                delConceptState.validationErrors.push({
                    type: 'individuals',
                    message: errorMessage,
                    items: individuals
                });
            }

            // Проверка схемы
            const schemas = checkProcessSchema(conceptUri);
            if (schemas.length > 0) {
                delConceptState.validationErrors.push({
                    type: 'schema',
                    message: `Найдено ${schemas.length} схем процесса. Сначала удалите все схемы.`,
                    items: schemas.map(s => ({ uri: s }))
                });
            }

            // Проверка дочерних элементов
            const children = checkChildrenElements(conceptUri, config.targetGraphUri);
            if (children.length > 0) {
                delConceptState.validationErrors.push({
                    type: 'children',
                    message: `Найдено ${children.length} дочерних процессов. Сначала измените их vad:hasParentObj.`,
                    items: children
                });
            }
            break;

        case DEL_OPERATION_TYPES.CONCEPT_EXECUTOR:
            // Проверка использования в TriG
            const usages = checkExecutorUsage(conceptUri);
            if (usages.length > 0) {
                delConceptState.validationErrors.push({
                    type: 'usedInTrigs',
                    message: `Исполнитель используется в ${usages.length} TriG. Сначала удалите эти индивиды исполнителя.`,
                    items: usages.map(u => ({ uri: u.trig, processIndivid: u.processIndivid }))
                });
            }

            // Проверка дочерних исполнителей
            const childExecutors = checkChildrenElements(conceptUri, config.targetGraphUri);
            if (childExecutors.length > 0) {
                delConceptState.validationErrors.push({
                    type: 'children',
                    message: `Найдено ${childExecutors.length} дочерних исполнителей. Сначала измените их vad:hasParentObj.`,
                    items: childExecutors
                });
            }
            break;

        case DEL_OPERATION_TYPES.INDIVID_PROCESS:
            // Для индивидов процесса показываем список найденных индивидов
            const processIndividuals = findProcessIndividualsManual(conceptUri);
            delConceptState.foundIndividuals = processIndividuals;
            break;

        case DEL_OPERATION_TYPES.INDIVID_EXECUTOR:
            // Для индивидов исполнителя показываем использования
            const executorUsages = checkExecutorUsage(conceptUri);
            delConceptState.foundIndividuals = executorUsages.map(u => ({
                uri: u.processIndivid,
                trig: u.trig,
                label: typeof getPrefixedName === 'function'
                    ? getPrefixedName(u.processIndivid, currentPrefixes)
                    : u.processIndivid
            }));
            break;
    }

    // Формируем HTML для отображения результатов
    if (delConceptState.validationErrors.length > 0) {
        resultsHtml = buildValidationErrorsHtml();
    } else if (delConceptState.foundIndividuals.length > 0) {
        resultsHtml = buildFoundIndividualsHtml();
    } else if (operationType === DEL_OPERATION_TYPES.CONCEPT_PROCESS ||
               operationType === DEL_OPERATION_TYPES.CONCEPT_EXECUTOR) {
        resultsHtml = '<div class="del-concept-success">Проверки пройдены. Концепт можно удалить.</div>';
    }

    if (resultsHtml) {
        resultsContainer.innerHTML = resultsHtml;
        resultsContainer.style.display = 'block';
    } else {
        resultsContainer.style.display = 'none';
    }
}

/**
 * Формирует HTML для ошибок валидации
 * @returns {string} HTML
 */
function buildValidationErrorsHtml() {
    let html = '<div class="del-concept-errors">';
    html += '<h4>Удаление невозможно:</h4>';

    delConceptState.validationErrors.forEach(error => {
        html += `<div class="del-concept-error-item">`;
        html += `<p class="error-message">${error.message}</p>`;

        if (error.items && error.items.length > 0) {
            html += '<ul class="error-items">';
            error.items.forEach(item => {
                const label = item.label || (typeof getPrefixedName === 'function'
                    ? getPrefixedName(item.uri, currentPrefixes)
                    : item.uri);
                html += `<li>${label}</li>`;
            });
            html += '</ul>';
        }

        html += '</div>';
    });

    html += '</div>';
    return html;
}

/**
 * Формирует HTML для найденных индивидов
 * @returns {string} HTML
 */
function buildFoundIndividualsHtml() {
    const operationType = delConceptState.selectedOperation;
    const config = DEL_CONCEPT_CONFIG[operationType];

    let html = '<div class="del-concept-individuals">';

    if (delConceptState.foundIndividuals.length === 0) {
        html += '<p class="no-individuals">Индивиды не найдены</p>';
    } else {
        html += `<h4>Найденные индивиды (${delConceptState.foundIndividuals.length}):</h4>`;
        html += '<ul class="individuals-list">';

        delConceptState.foundIndividuals.forEach(individ => {
            const label = individ.label || (typeof getPrefixedName === 'function'
                ? getPrefixedName(individ.uri, currentPrefixes)
                : individ.uri);

            const trigLabel = individ.trig
                ? (typeof getPrefixedName === 'function'
                    ? getPrefixedName(individ.trig, currentPrefixes)
                    : individ.trig)
                : '';

            html += `<li>`;
            html += `<span class="individ-label">${label}</span>`;
            if (trigLabel) {
                html += ` <span class="individ-trig">(в ${trigLabel})</span>`;
            }
            html += `</li>`;
        });

        html += '</ul>';
    }

    html += '</div>';
    return html;
}

/**
 * Скрывает контейнер результатов
 */
function hideDelResults() {
    const resultsContainer = document.getElementById('del-concept-results-container');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

/**
 * Обновляет состояние кнопок
 */
function updateDelButtonsState() {
    const showIndividualsBtn = document.getElementById('del-show-individuals-btn');
    const createDeleteBtn = document.querySelector('.del-concept-create-btn');

    const operationType = delConceptState.selectedOperation;
    const hasSelectedConcept = delConceptState.selectedConcept != null;
    const hasErrors = delConceptState.validationErrors.length > 0;
    const config = operationType ? DEL_CONCEPT_CONFIG[operationType] : null;

    // Кнопка "Показать индивиды"
    if (showIndividualsBtn) {
        const showButton = config && config.hasShowIndividualsButton && hasSelectedConcept;
        showIndividualsBtn.style.display = showButton ? 'inline-block' : 'none';
    }

    // Кнопка "Создать запрос на удаление"
    if (createDeleteBtn) {
        // Для концептов - активна только если нет ошибок валидации
        // Для индивидов - активна если есть найденные индивиды
        // Для TriG - активна если выбран TriG
        let canCreate = false;

        switch (operationType) {
            case DEL_OPERATION_TYPES.CONCEPT_PROCESS:
            case DEL_OPERATION_TYPES.CONCEPT_EXECUTOR:
                canCreate = hasSelectedConcept && !hasErrors;
                break;

            case DEL_OPERATION_TYPES.INDIVID_PROCESS:
            case DEL_OPERATION_TYPES.INDIVID_EXECUTOR:
                canCreate = hasSelectedConcept && delConceptState.foundIndividuals.length > 0;
                break;

            case DEL_OPERATION_TYPES.TRIG_SCHEMA:
                canCreate = hasSelectedConcept;
                break;
        }

        createDeleteBtn.disabled = !canCreate;
        createDeleteBtn.title = canCreate ? '' : 'Сначала выберите элемент и пройдите проверки';
    }
}

/**
 * Обработчик кнопки "Показать индивиды"
 * Issue #221 Fix #2: Обновлена логика для корректного поиска индивидов процесса
 */
function showIndividuals() {
    const operationType = delConceptState.selectedOperation;
    const conceptUri = delConceptState.selectedConcept;

    if (!conceptUri) {
        showDelConceptMessage('Сначала выберите концепт', 'error');
        return;
    }

    // Перезапускаем поиск индивидов
    if (operationType === DEL_OPERATION_TYPES.INDIVID_PROCESS) {
        const individuals = findProcessIndividualsManual(conceptUri);
        delConceptState.foundIndividuals = individuals;

        // Issue #221 Fix #2: Добавляем промежуточный SPARQL для отображения
        const sparqlQuery = DEL_CONCEPT_SPARQL.GET_PROCESS_INDIVIDUALS_FOR_CONCEPT(conceptUri);
        delIntermediateSparqlQueries.push({
            description: 'Поиск использований концепта как индивида в схемах процессов (VADProcessDia)',
            query: sparqlQuery,
            result: individuals.length > 0
                ? `Найдено ${individuals.length} использований: ${individuals.map(i => {
                    const trigLabel = typeof getPrefixedName === 'function'
                        ? getPrefixedName(i.trig, currentPrefixes)
                        : i.trig;
                    return `${i.label || i.uri} в ${trigLabel}`;
                }).join(', ')}`
                : 'Индивиды не найдены'
        });
    } else if (operationType === DEL_OPERATION_TYPES.INDIVID_EXECUTOR) {
        const usages = checkExecutorUsage(conceptUri);
        delConceptState.foundIndividuals = usages.map(u => ({
            uri: u.processIndivid,
            trig: u.trig,
            label: typeof getPrefixedName === 'function'
                ? getPrefixedName(u.processIndivid, currentPrefixes)
                : u.processIndivid
        }));
    }

    // Обновляем отображение
    const resultsContainer = document.getElementById('del-concept-results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = buildFoundIndividualsHtml();
        resultsContainer.style.display = 'block';
    }

    displayDelIntermediateSparql();
    updateDelButtonsState();
}

/**
 * Обработчик кнопки "Удалить индивиды"
 * Формирует SPARQL DELETE запрос для всех найденных индивидов
 */
function deleteIndividuals() {
    const operationType = delConceptState.selectedOperation;
    const conceptUri = delConceptState.selectedConcept;

    if (!conceptUri || delConceptState.foundIndividuals.length === 0) {
        showDelConceptMessage('Нет индивидов для удаления', 'error');
        return;
    }

    const prefixes = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'vad': 'http://example.org/vad#'
    };

    let sparqlQuery = '';

    if (operationType === DEL_OPERATION_TYPES.INDIVID_PROCESS) {
        // Формируем запросы на удаление всех индивидов процесса
        const queries = delConceptState.foundIndividuals.map(individ =>
            DEL_CONCEPT_SPARQL.GENERATE_DELETE_PROCESS_INDIVID_QUERY(
                individ.trig,
                individ.uri,
                prefixes
            )
        );
        sparqlQuery = queries.join('\n;\n\n');
    } else if (operationType === DEL_OPERATION_TYPES.INDIVID_EXECUTOR) {
        // Формируем запросы на удаление vad:includes
        const queries = delConceptState.foundIndividuals.map(individ =>
            DEL_CONCEPT_SPARQL.GENERATE_DELETE_EXECUTOR_INDIVID_QUERY(
                individ.trig,
                individ.uri,
                conceptUri,
                prefixes
            )
        );
        sparqlQuery = queries.join('\n;\n\n');
    }

    outputDeleteSparql(sparqlQuery, `индивидов (${delConceptState.foundIndividuals.length})`);
}

/**
 * Создаёт итоговый SPARQL DELETE запрос
 */
function createDeleteSparql() {
    hideDelConceptMessage();

    const operationType = delConceptState.selectedOperation;
    const selectedUri = delConceptState.selectedConcept;

    if (!operationType || !selectedUri) {
        showDelConceptMessage('Выберите тип операции и элемент для удаления', 'error');
        return;
    }

    // Проверяем ошибки валидации для концептов
    if ((operationType === DEL_OPERATION_TYPES.CONCEPT_PROCESS ||
         operationType === DEL_OPERATION_TYPES.CONCEPT_EXECUTOR) &&
        delConceptState.validationErrors.length > 0) {
        showDelConceptMessage('Невозможно удалить концепт. Сначала устраните найденные проблемы.', 'error');
        return;
    }

    const config = DEL_CONCEPT_CONFIG[operationType];
    const prefixes = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'vad': 'http://example.org/vad#'
    };

    let sparqlQuery = '';
    let elementDescription = '';

    switch (operationType) {
        case DEL_OPERATION_TYPES.CONCEPT_PROCESS:
        case DEL_OPERATION_TYPES.CONCEPT_EXECUTOR:
            sparqlQuery = DEL_CONCEPT_SPARQL.GENERATE_DELETE_CONCEPT_QUERY(
                config.targetGraph,
                selectedUri,
                prefixes
            );
            elementDescription = `концепта ${operationType === DEL_OPERATION_TYPES.CONCEPT_PROCESS ? 'процесса' : 'исполнителя'}`;
            break;

        case DEL_OPERATION_TYPES.INDIVID_PROCESS:
            if (delConceptState.foundIndividuals.length === 0) {
                showDelConceptMessage('Сначала нажмите "Показать индивиды"', 'error');
                return;
            }
            // Используем deleteIndividuals для генерации
            deleteIndividuals();
            return;

        case DEL_OPERATION_TYPES.INDIVID_EXECUTOR:
            if (delConceptState.foundIndividuals.length === 0) {
                showDelConceptMessage('Сначала нажмите "Показать индивиды"', 'error');
                return;
            }
            // Используем deleteIndividuals для генерации
            deleteIndividuals();
            return;

        case DEL_OPERATION_TYPES.TRIG_SCHEMA:
            const conceptForTrig = findConceptForTrig(selectedUri);
            if (!conceptForTrig) {
                showDelConceptMessage('Не найден концепт процесса для данного TriG', 'warning');
            }
            sparqlQuery = DEL_CONCEPT_SPARQL.GENERATE_DELETE_TRIG_QUERY(
                selectedUri,
                conceptForTrig || 'UNKNOWN_CONCEPT',
                prefixes
            );
            elementDescription = 'схемы процесса (TriG)';
            break;
    }

    outputDeleteSparql(sparqlQuery, elementDescription);
}

/**
 * Выводит SPARQL DELETE запрос в "Result in SPARQL"
 * @param {string} sparqlQuery - SPARQL запрос
 * @param {string} elementDescription - Описание удаляемого элемента
 */
function outputDeleteSparql(sparqlQuery, elementDescription) {
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }

    // Отмечаем что это запрос удаления
    window.isDeleteQuery = true;

    showDelConceptMessage(
        `SPARQL DELETE запрос для ${elementDescription} успешно сгенерирован. ` +
        `Запрос выведен в "Result in SPARQL".`,
        'success'
    );

    closeDelConceptModal();
}

/**
 * Отображает промежуточные SPARQL запросы
 */
function displayDelIntermediateSparql() {
    const container = document.getElementById('del-concept-intermediate-sparql');
    const textarea = container ? container.querySelector('textarea') : null;

    if (!container || !textarea) return;

    if (delIntermediateSparqlQueries.length === 0) {
        container.style.display = 'none';
        return;
    }

    let sparqlText = '# ===== Промежуточные SPARQL запросы и результаты =====\n\n';

    delIntermediateSparqlQueries.forEach((query, index) => {
        sparqlText += `# --- ${index + 1}. ${query.description} ---\n`;
        sparqlText += query.query.trim() + '\n';
        if (query.result) {
            sparqlText += `\n# Результат:\n# ${query.result}\n`;
        }
        sparqlText += '\n';
    });

    textarea.value = sparqlText;
    delConceptState.intermediateSparql = sparqlText;

    container.style.display = 'block';
}

/**
 * Переключает видимость промежуточного SPARQL
 */
function toggleDelIntermediateSparql() {
    const container = document.getElementById('del-concept-intermediate-sparql');
    if (container) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
    }
}

// ==============================================================================
// ФУНКЦИИ СООБЩЕНИЙ
// ==============================================================================

/**
 * Показывает сообщение в модальном окне
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип: 'success', 'error', 'warning'
 */
function showDelConceptMessage(message, type = 'info') {
    const messageDiv = document.getElementById('del-concept-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `del-concept-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

/**
 * Скрывает сообщение
 */
function hideDelConceptMessage() {
    const messageDiv = document.getElementById('del-concept-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}
