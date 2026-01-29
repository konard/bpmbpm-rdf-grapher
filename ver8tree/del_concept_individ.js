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
 * @file del_concept_individ.js
 * @version 1.0
 * @date 2026-01-29
 * @see create_new_concept.js - Аналогичный модуль для создания
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
        hasDeleteIndividualsButton: true
    },
    [DEL_OPERATION_TYPES.INDIVID_EXECUTOR]: {
        displayName: 'Удалить индивид исполнителя',
        description: 'Удаление vad:includes из TriG типа vad:VADProcessDia',
        hasShowIndividualsButton: true,
        hasDeleteIndividualsButton: true
    },
    [DEL_OPERATION_TYPES.TRIG_SCHEMA]: {
        displayName: 'Удалить схему процесса (TriG)',
        description: 'Удаление TriG типа vad:VADProcessDia и связи vad:hasTrig'
    }
};

/**
 * SPARQL запросы для модуля удаления концептов/индивидов
 * Использует концепцию максимального использования SPARQL-запросов
 */
const DEL_CONCEPT_SPARQL = {
    /**
     * Получение всех концептов процессов из ptree
     * Используется для выбора концепта для удаления
     */
    GET_PROCESS_CONCEPTS: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?concept ?label WHERE {
    GRAPH vad:ptree {
        ?concept rdf:type vad:TypeProcess .
        OPTIONAL { ?concept rdfs:label ?label }
    }
}`,

    /**
     * Получение всех концептов исполнителей из rtree
     * Используется для выбора концепта для удаления
     */
    GET_EXECUTOR_CONCEPTS: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?concept ?label WHERE {
    GRAPH vad:rtree {
        ?concept rdf:type vad:TypeExecutor .
        OPTIONAL { ?concept rdfs:label ?label }
    }
}`,

    /**
     * Проверка наличия индивидов процесса для концепта
     * Ищет все индивиды во всех TriG типа VADProcessDia
     * @param {string} conceptUri - URI концепта процесса
     */
    CHECK_PROCESS_INDIVIDUALS: (conceptUri) => `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?individ ?trig ?label WHERE {
    GRAPH ?trig {
        ?individ vad:isSubprocessTrig ?trig .
    }
    GRAPH vad:ptree {
        <${conceptUri}> vad:hasTrig ?trig .
    }
    OPTIONAL {
        GRAPH vad:ptree {
            ?individ rdfs:label ?label .
        }
    }
}`,

    /**
     * Проверка наличия схемы процесса (hasTrig)
     * @param {string} conceptUri - URI концепта процесса
     */
    CHECK_PROCESS_SCHEMA: (conceptUri) => `
PREFIX vad: <http://example.org/vad#>

SELECT ?trig WHERE {
    GRAPH vad:ptree {
        <${conceptUri}> vad:hasTrig ?trig .
    }
}`,

    /**
     * Проверка наличия дочерних процессов
     * @param {string} conceptUri - URI родительского концепта
     */
    CHECK_CHILDREN_PROCESSES: (conceptUri) => `
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?child ?label WHERE {
    GRAPH vad:ptree {
        ?child vad:hasParentObj <${conceptUri}> .
        OPTIONAL { ?child rdfs:label ?label }
    }
}`,

    /**
     * Проверка наличия дочерних исполнителей
     * @param {string} conceptUri - URI родительского концепта
     */
    CHECK_CHILDREN_EXECUTORS: (conceptUri) => `
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?child ?label WHERE {
    GRAPH vad:rtree {
        ?child vad:hasParentObj <${conceptUri}> .
        OPTIONAL { ?child rdfs:label ?label }
    }
}`,

    /**
     * Проверка использования исполнителя в TriG
     * @param {string} executorUri - URI исполнителя
     */
    CHECK_EXECUTOR_USAGE: (executorUri) => `
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?trig ?processIndivid WHERE {
    GRAPH ?trig {
        ?processIndivid vad:includes <${executorUri}> .
    }
    ?trig rdf:type vad:VADProcessDia .
}`,

    /**
     * Получение всех TriG типа VADProcessDia
     */
    GET_ALL_TRIGS: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?trig ?label WHERE {
    ?trig rdf:type vad:VADProcessDia .
    OPTIONAL { ?trig rdfs:label ?label }
}`,

    /**
     * Получение всех индивидов процесса из всех TriG для указанного концепта
     * @param {string} conceptUri - URI концепта процесса
     */
    GET_PROCESS_INDIVIDUALS_FOR_CONCEPT: (conceptUri) => `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?individ ?trig ?label WHERE {
    GRAPH vad:ptree {
        <${conceptUri}> vad:hasTrig ?trig .
    }
    GRAPH ?trig {
        ?individ vad:isSubprocessTrig ?trig .
    }
    OPTIONAL {
        GRAPH vad:ptree {
            ?individ rdfs:label ?label .
        }
    }
}`,

    /**
     * Получение всех TriG, где используется исполнитель
     * @param {string} executorUri - URI исполнителя
     */
    GET_TRIGS_WITH_EXECUTOR: (executorUri) => `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT DISTINCT ?trig ?processIndivid WHERE {
    GRAPH ?trig {
        ?processIndivid vad:includes <${executorUri}> .
    }
    ?trig rdf:type vad:VADProcessDia .
}`,

    /**
     * Генерирует DELETE SPARQL запрос для удаления концепта
     * @param {string} graphUri - URI графа (ptree или rtree)
     * @param {string} conceptUri - URI концепта для удаления
     * @param {Object} prefixes - Объект префиксов
     */
    GENERATE_DELETE_CONCEPT_QUERY: (graphUri, conceptUri, prefixes) => {
        const prefixDeclarations = Object.entries(prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');

        const conceptPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(conceptUri, currentPrefixes)
            : `<${conceptUri}>`;

        return `${prefixDeclarations}

DELETE WHERE {
    GRAPH ${graphUri} {
        ${conceptPrefixed} ?p ?o .
    }
}`;
    },

    /**
     * Генерирует DELETE SPARQL запрос для удаления индивида процесса
     * @param {string} trigUri - URI TriG графа
     * @param {string} individUri - URI индивида процесса
     * @param {Object} prefixes - Объект префиксов
     */
    GENERATE_DELETE_PROCESS_INDIVID_QUERY: (trigUri, individUri, prefixes) => {
        const prefixDeclarations = Object.entries(prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');

        const trigPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(trigUri, currentPrefixes)
            : `<${trigUri}>`;

        const individPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(individUri, currentPrefixes)
            : `<${individUri}>`;

        return `${prefixDeclarations}

# Удаление всех триплетов индивида процесса
DELETE WHERE {
    GRAPH ${trigPrefixed} {
        ${individPrefixed} ?p ?o .
    }
}`;
    },

    /**
     * Генерирует DELETE SPARQL запрос для удаления индивида исполнителя (vad:includes)
     * @param {string} trigUri - URI TriG графа
     * @param {string} processIndividUri - URI индивида процесса
     * @param {string} executorUri - URI исполнителя
     * @param {Object} prefixes - Объект префиксов
     */
    GENERATE_DELETE_EXECUTOR_INDIVID_QUERY: (trigUri, processIndividUri, executorUri, prefixes) => {
        const prefixDeclarations = Object.entries(prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');

        const trigPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(trigUri, currentPrefixes)
            : `<${trigUri}>`;

        const processIndividPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(processIndividUri, currentPrefixes)
            : `<${processIndividUri}>`;

        const executorPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(executorUri, currentPrefixes)
            : `<${executorUri}>`;

        return `${prefixDeclarations}

# Удаление связи vad:includes для исполнителя
DELETE DATA {
    GRAPH ${trigPrefixed} {
        ${processIndividPrefixed} vad:includes ${executorPrefixed} .
    }
}`;
    },

    /**
     * Генерирует DELETE SPARQL запрос для удаления TriG схемы
     * @param {string} trigUri - URI TriG графа
     * @param {string} conceptUri - URI концепта процесса
     * @param {Object} prefixes - Объект префиксов
     */
    GENERATE_DELETE_TRIG_QUERY: (trigUri, conceptUri, prefixes) => {
        const prefixDeclarations = Object.entries(prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');

        const trigPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(trigUri, currentPrefixes)
            : `<${trigUri}>`;

        const conceptPrefixed = typeof getPrefixedName === 'function'
            ? getPrefixedName(conceptUri, currentPrefixes)
            : `<${conceptUri}>`;

        return `${prefixDeclarations}

# Удаление триплета vad:hasTrig в концепте процесса
DELETE DATA {
    GRAPH vad:ptree {
        ${conceptPrefixed} vad:hasTrig ${trigPrefixed} .
    }
};

# Удаление всего графа TriG
DROP GRAPH ${trigPrefixed}`;
    }
};

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
 * @returns {Array<{uri: string, label: string}>} Массив концептов
 */
function getProcessConceptsForDeletion() {
    const sparqlQuery = DEL_CONCEPT_SPARQL.GET_PROCESS_CONCEPTS;

    let concepts = [];

    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    } else {
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
 * @returns {Array<{uri: string, label: string}>} Массив концептов
 */
function getExecutorConceptsForDeletion() {
    const sparqlQuery = DEL_CONCEPT_SPARQL.GET_EXECUTOR_CONCEPTS;

    let concepts = [];

    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    } else {
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

            currentQuads.forEach(quad => {
                if (quad.subject.value === uri && quad.predicate.value === rdfsLabelUri) {
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
 * @param {string} conceptUri - URI концепта
 * @returns {Array<{uri: string, trig: string, label: string}>} Найденные индивиды
 */
function checkProcessIndividuals(conceptUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_PROCESS_INDIVIDUALS(conceptUri);

    let individuals = [];

    // Используем manual поиск, т.к. funSPARQLvalues может не работать с GRAPH переменными
    individuals = findProcessIndividualsManual(conceptUri);

    delIntermediateSparqlQueries.push({
        description: 'Проверка наличия индивидов процесса',
        query: sparqlQuery,
        result: individuals.length > 0
            ? `Найдено ${individuals.length} индивидов: ${individuals.map(i => i.label || i.uri).join(', ')}`
            : 'Индивиды не найдены'
    });

    return individuals;
}

/**
 * Ручной поиск индивидов процесса
 * @param {string} conceptUri - URI концепта
 * @returns {Array} Найденные индивиды
 */
function findProcessIndividualsManual(conceptUri) {
    const individuals = [];
    const isSubprocessTrigUri = 'http://example.org/vad#isSubprocessTrig';
    const hasTrigUri = 'http://example.org/vad#hasTrig';
    const ptreeUri = 'http://example.org/vad#ptree';

    if (typeof currentQuads !== 'undefined' && Array.isArray(currentQuads)) {
        // Сначала находим TriG, связанные с концептом
        const conceptTrigs = new Set();
        currentQuads.forEach(quad => {
            if (quad.subject.value === conceptUri &&
                quad.predicate.value === hasTrigUri &&
                quad.graph && quad.graph.value === ptreeUri) {
                conceptTrigs.add(quad.object.value);
            }
        });

        // Затем ищем индивиды в этих TriG
        currentQuads.forEach(quad => {
            if (quad.predicate.value === isSubprocessTrigUri &&
                quad.graph && conceptTrigs.has(quad.graph.value)) {
                individuals.push({
                    uri: quad.subject.value,
                    trig: quad.graph.value,
                    label: typeof getPrefixedName === 'function'
                        ? getPrefixedName(quad.subject.value, currentPrefixes)
                        : quad.subject.value
                });
            }
        });
    }

    return individuals;
}

/**
 * Проверяет наличие схемы (hasTrig) для концепта
 * @param {string} conceptUri - URI концепта
 * @returns {Array<string>} URI найденных TriG
 */
function checkProcessSchema(conceptUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_PROCESS_SCHEMA(conceptUri);

    let trigs = [];

    // Manual поиск
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

    // Manual поиск
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
 * @param {string} executorUri - URI исполнителя
 * @returns {Array<{trig: string, processIndivid: string}>} Найденные использования
 */
function checkExecutorUsage(executorUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_EXECUTOR_USAGE(executorUri);

    let usages = [];

    // Manual поиск
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
 * @returns {Array<{uri: string, label: string}>} Массив TriG
 */
function getAllTrigs() {
    const sparqlQuery = DEL_CONCEPT_SPARQL.GET_ALL_TRIGS;

    let trigs = [];

    // Manual поиск
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
            // Проверка индивидов
            const individuals = checkProcessIndividuals(conceptUri);
            if (individuals.length > 0) {
                delConceptState.validationErrors.push({
                    type: 'individuals',
                    message: `Найдено ${individuals.length} индивидов процесса. Сначала удалите все индивиды.`,
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
    const deleteIndividualsBtn = document.getElementById('del-delete-individuals-btn');
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

    // Кнопка "Удалить индивиды"
    if (deleteIndividualsBtn) {
        const showButton = config && config.hasDeleteIndividualsButton &&
                          hasSelectedConcept && delConceptState.foundIndividuals.length > 0;
        deleteIndividualsBtn.style.display = showButton ? 'inline-block' : 'none';
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

// ==============================================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
// ==============================================================================

if (typeof window !== 'undefined') {
    window.openDelConceptModal = openDelConceptModal;
    window.closeDelConceptModal = closeDelConceptModal;
    window.onDelOperationChange = onDelOperationChange;
    window.onDelConceptSelect = onDelConceptSelect;
    window.onDelTrigSelect = onDelTrigSelect;
    window.showIndividuals = showIndividuals;
    window.deleteIndividuals = deleteIndividuals;
    window.createDeleteSparql = createDeleteSparql;
    window.toggleDelIntermediateSparql = toggleDelIntermediateSparql;
    window.DEL_CONCEPT_CONFIG = DEL_CONCEPT_CONFIG;
    window.DEL_CONCEPT_SPARQL = DEL_CONCEPT_SPARQL;
    window.DEL_OPERATION_TYPES = DEL_OPERATION_TYPES;
}
