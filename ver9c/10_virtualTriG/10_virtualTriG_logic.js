// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/317
// 10_virtualTriG_logic.js - Логика обработки Virtual TriG (vad:Virtual)

/**
 * Модуль 10_virtualTriG отвечает за:
 * - Создание виртуальных TriG контейнеров (vad:vt_*)
 * - Вычисление и добавление Virtual Quads в store
 * - Пересчёт Virtual TriG при изменении данных
 * - Каскадное удаление Virtual TriG при удалении родительского VADProcessDia
 *
 * Принципы (согласно base_concept_rules.md):
 * - Виртуальные данные хранятся ТОЛЬКО в TriG типа vad:Virtual
 * - Глобальный объект virtualRDFdata НЕ используется для хранения
 * - Все операции через SPARQL (SPARQL-driven programming)
 */

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const VIRTUAL_TRIG_NS = 'http://example.org/vad#';
const VIRTUAL_TYPE_URI = VIRTUAL_TRIG_NS + 'Virtual';
const RDF_TYPE_URI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const HAS_PARENT_OBJ_URI = VIRTUAL_TRIG_NS + 'hasParentObj';
const PROCESS_SUBTYPE_URI = VIRTUAL_TRIG_NS + 'processSubtype';

// URI подтипов процессов
const SUBTYPE_URIS = {
    DETAILED_CHILD: VIRTUAL_TRIG_NS + 'DetailedChild',
    DETAILED_EXTERNAL: VIRTUAL_TRIG_NS + 'DetailedExternal',
    NOT_DETAILED_CHILD: VIRTUAL_TRIG_NS + 'notDetailedChild',
    NOT_DETAILED_EXTERNAL: VIRTUAL_TRIG_NS + 'notDetailedExternal',
    NOT_DEFINED_TYPE: VIRTUAL_TRIG_NS + 'NotDefinedType'
};

// ============================================================================
// SPARQL-DRIVEN ФУНКЦИИ ПРОВЕРКИ
// ============================================================================

/**
 * Проверяет, является ли граф виртуальным через SPARQL ASK
 * Согласно base_concept_rules.md: используем SPARQL вместо проверки имени
 *
 * @param {string} graphUri - URI графа
 * @returns {Promise<boolean>} - true если граф типа vad:Virtual
 */
async function isVirtualGraphSPARQL(graphUri) {
    if (!graphUri || !currentStore) return false;

    const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vad: <http://example.org/vad#>

        ASK {
            GRAPH <${graphUri}> {
                <${graphUri}> rdf:type vad:Virtual .
            }
        }
    `;

    try {
        const result = await funSPARQLask(query);
        return result;
    } catch (error) {
        console.error('isVirtualGraphSPARQL error:', error);
        return false;
    }
}

/**
 * Получает родительский TriG для виртуального графа через SPARQL
 *
 * @param {string} virtualGraphUri - URI виртуального графа
 * @returns {Promise<string|null>} - URI родительского TriG или null
 */
async function getVirtualTrigParent(virtualGraphUri) {
    if (!virtualGraphUri || !currentStore) return null;

    const query = `
        PREFIX vad: <http://example.org/vad#>

        SELECT ?parent WHERE {
            GRAPH <${virtualGraphUri}> {
                <${virtualGraphUri}> vad:hasParentObj ?parent .
            }
        }
        LIMIT 1
    `;

    try {
        const results = await funSPARQLvaluesComunica(query, currentPrefixes);
        if (results && results.length > 0) {
            return results[0].parent;
        }
        return null;
    } catch (error) {
        console.error('getVirtualTrigParent error:', error);
        return null;
    }
}

// ============================================================================
// ФУНКЦИИ ВЫЧИСЛЕНИЯ ПОДТИПОВ
// ============================================================================

/**
 * Вычисляет processSubtype для процесса на основе данных из ptree
 * Согласно алгоритму из reasoner_concept_v1.md
 *
 * @param {string} processUri - URI процесса
 * @param {string} trigUri - URI TriG, в котором находится индивид
 * @param {Object} processMetadata - Метаданные процесса из ptree
 * @param {string} trigDefinesProcess - URI процесса, который определяет TriG
 * @returns {string} - Название подтипа (DetailedChild, notDetailedExternal, etc.)
 */
function computeProcessSubtype(processUri, trigUri, processMetadata, trigDefinesProcess) {
    const NOT_DEFINED_URIS = [
        VIRTUAL_TRIG_NS + 'pNotDefined',
        VIRTUAL_TRIG_NS + 'NotDefined'
    ];

    const hasParentObj = processMetadata.hasParentObj;
    const hasTrig = processMetadata.hasTrig;

    // 1. Проверяем NotDefined (неопределённый родитель)
    if (hasParentObj && NOT_DEFINED_URIS.some(uri =>
        hasParentObj === uri ||
        hasParentObj.endsWith('#pNotDefined') ||
        hasParentObj.endsWith('#NotDefined'))) {
        return 'NotDefinedType';
    }

    // 2. Определяем, находится ли индивид в схеме родительского процесса
    // Процесс является подпроцессом (Child), если его hasParentObj
    // совпадает с definesProcess TriG (процессом-владельцем схемы)
    const isChild = trigDefinesProcess && hasParentObj === trigDefinesProcess;

    // 3. Вычисляем подтип на основе hasTrig и isChild
    if (hasTrig) {
        // Детализированный процесс
        return isChild ? 'DetailedChild' : 'DetailedExternal';
    } else {
        // Не детализированный процесс
        return isChild ? 'notDetailedChild' : 'notDetailedExternal';
    }
}

/**
 * Собирает метаданные процессов из ptree через SPARQL
 *
 * @returns {Promise<Object>} - { processUri: { hasParentObj, hasTrig, label } }
 */
async function getAllProcessMetadataFromPtree() {
    const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX vad: <http://example.org/vad#>

        SELECT ?process ?hasParentObj ?hasTrig ?label WHERE {
            GRAPH vad:ptree {
                ?process rdf:type vad:TypeProcess .
                OPTIONAL { ?process vad:hasParentObj ?hasParentObj }
                OPTIONAL { ?process vad:hasParentProcess ?hasParentProcess }
                OPTIONAL { ?process vad:hasTrig ?hasTrig }
                OPTIONAL { ?process rdfs:label ?label }
            }
        }
    `;

    try {
        const results = await funSPARQLvaluesComunica(query, currentPrefixes);
        const metadata = {};

        results.forEach(row => {
            const processUri = row.process;
            metadata[processUri] = {
                hasParentObj: row.hasParentObj || row.hasParentProcess || null,
                hasTrig: row.hasTrig || null,
                label: row.label || null
            };
        });

        return metadata;
    } catch (error) {
        console.error('getAllProcessMetadataFromPtree error:', error);
        return {};
    }
}

/**
 * Получает все VADProcessDia графы с их definesProcess через SPARQL
 *
 * @returns {Promise<Array>} - [{ trigUri, definesProcess, label }]
 */
async function getVADProcessDiaGraphs() {
    const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX vad: <http://example.org/vad#>

        SELECT DISTINCT ?trig ?definesProcess ?label WHERE {
            GRAPH ?trig {
                ?trig rdf:type vad:VADProcessDia .
                OPTIONAL { ?trig vad:definesProcess ?definesProcess }
                OPTIONAL { ?trig vad:hasParentObj ?hasParent }
                OPTIONAL { ?trig rdfs:label ?label }
            }
        }
    `;

    try {
        const results = await funSPARQLvaluesComunica(query, currentPrefixes);
        return results.map(row => ({
            trigUri: row.trig,
            definesProcess: row.definesProcess || row.hasParent || null,
            label: row.label || null
        }));
    } catch (error) {
        console.error('getVADProcessDiaGraphs error:', error);
        return [];
    }
}

/**
 * Получает индивиды процессов в TriG через isSubprocessTrig
 *
 * @param {string} trigUri - URI TriG графа
 * @returns {Promise<Array>} - [processUri, ...]
 */
async function getProcessIndividualsInTrig(trigUri) {
    const query = `
        PREFIX vad: <http://example.org/vad#>

        SELECT DISTINCT ?process WHERE {
            GRAPH <${trigUri}> {
                ?process vad:isSubprocessTrig <${trigUri}> .
            }
        }
    `;

    try {
        const results = await funSPARQLvaluesComunica(query, currentPrefixes);
        return results.map(row => row.process);
    } catch (error) {
        console.error('getProcessIndividualsInTrig error:', error);
        return [];
    }
}

// ============================================================================
// ФУНКЦИИ СОЗДАНИЯ И ОБНОВЛЕНИЯ VIRTUAL TRIG
// ============================================================================

/**
 * Создаёт Virtual TriG для указанного VADProcessDia
 * Добавляет квады напрямую в currentStore (без использования currentQuads)
 *
 * @param {string} parentTrigUri - URI родительского VADProcessDia
 * @param {Object} processSubtypes - { processUri: subtypeName }
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Array} - Массив созданных квадов
 */
function createVirtualTriG(parentTrigUri, processSubtypes, prefixes) {
    if (!parentTrigUri || !currentStore) {
        console.error('createVirtualTriG: missing parentTrigUri or currentStore');
        return [];
    }

    const factory = N3.DataFactory;
    const { namedNode } = factory;
    const newQuads = [];

    // Формируем URI виртуального контейнера (vt_ вместо t_)
    let virtualContainerUri;
    if (parentTrigUri.includes('#t_')) {
        virtualContainerUri = parentTrigUri.replace('#t_', '#vt_');
    } else {
        const localName = parentTrigUri.split('#').pop() || parentTrigUri.split('/').pop();
        virtualContainerUri = VIRTUAL_TRIG_NS + 'vt_' + localName;
    }

    const virtualGraphNode = namedNode(virtualContainerUri);

    // 1. rdf:type vad:Virtual
    newQuads.push(factory.quad(
        virtualGraphNode,
        namedNode(RDF_TYPE_URI),
        namedNode(VIRTUAL_TYPE_URI),
        virtualGraphNode
    ));

    // 2. vad:hasParentObj <parentTrigUri>
    newQuads.push(factory.quad(
        virtualGraphNode,
        namedNode(HAS_PARENT_OBJ_URI),
        namedNode(parentTrigUri),
        virtualGraphNode
    ));

    // 3. Добавляем processSubtype для каждого процесса
    for (const [processUri, subtypeName] of Object.entries(processSubtypes)) {
        const subtypeUri = VIRTUAL_TRIG_NS + subtypeName;
        newQuads.push(factory.quad(
            namedNode(processUri),
            namedNode(PROCESS_SUBTYPE_URI),
            namedNode(subtypeUri),
            virtualGraphNode
        ));
    }

    // Добавляем квады в store (SPARQL-driven: только store, без currentQuads)
    newQuads.forEach(quad => currentStore.addQuad(quad));

    console.log(`createVirtualTriG: Created ${newQuads.length} quads for ${virtualContainerUri}`);
    return newQuads;
}

/**
 * Удаляет Virtual TriG из store
 *
 * @param {string} virtualTrigUri - URI виртуального TriG
 * @returns {number} - Количество удалённых квадов
 */
function removeVirtualTriG(virtualTrigUri) {
    if (!virtualTrigUri || !currentStore) {
        return 0;
    }

    // Получаем все квады из виртуального графа
    const quadsToRemove = currentStore.getQuads(null, null, null, virtualTrigUri);
    const count = quadsToRemove.length;

    // Удаляем квады из store
    quadsToRemove.forEach(quad => currentStore.removeQuad(quad));

    console.log(`removeVirtualTriG: Removed ${count} quads from ${virtualTrigUri}`);
    return count;
}

/**
 * Удаляет все Virtual TriG из store
 *
 * @returns {number} - Количество удалённых квадов
 */
function removeAllVirtualTriGs() {
    if (!currentStore) return 0;

    // Находим все виртуальные графы через SPARQL-подобную выборку
    const virtualTypeQuads = currentStore.getQuads(
        null,
        RDF_TYPE_URI,
        VIRTUAL_TYPE_URI,
        null
    );

    let totalRemoved = 0;
    const virtualGraphUris = new Set();

    // Собираем URI виртуальных графов
    virtualTypeQuads.forEach(quad => {
        if (quad.graph && quad.graph.value) {
            virtualGraphUris.add(quad.graph.value);
        }
    });

    // Удаляем каждый виртуальный граф
    virtualGraphUris.forEach(graphUri => {
        totalRemoved += removeVirtualTriG(graphUri);
    });

    console.log(`removeAllVirtualTriGs: Removed ${totalRemoved} total quads from ${virtualGraphUris.size} virtual graphs`);
    return totalRemoved;
}

// ============================================================================
// ФУНКЦИИ ВЫЧИСЛЕНИЯ EXECUTORGROUP LABELS
// ============================================================================

/**
 * Получает все ExecutorGroup в указанном TriG
 *
 * @param {string} trigUri - URI TriG графа
 * @returns {Promise<Array>} - Массив URI ExecutorGroup
 */
async function getExecutorGroupsInTrig(trigUri) {
    const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vad: <http://example.org/vad#>

        SELECT DISTINCT ?executorGroup WHERE {
            GRAPH <${trigUri}> {
                ?executorGroup rdf:type vad:ExecutorGroup .
            }
        }
    `;

    try {
        const results = await funSPARQLvaluesComunica(query, currentPrefixes);
        return results.map(row => row.executorGroup);
    } catch (error) {
        console.error('getExecutorGroupsInTrig error:', error);
        return [];
    }
}

/**
 * Получает исполнителей для ExecutorGroup
 *
 * @param {string} executorGroupUri - URI ExecutorGroup
 * @returns {Promise<Array>} - Массив URI исполнителей
 */
async function getExecutorsInGroup(executorGroupUri) {
    const query = `
        PREFIX vad: <http://example.org/vad#>

        SELECT DISTINCT ?executor WHERE {
            <${executorGroupUri}> vad:includes ?executor .
        }
    `;

    try {
        const results = await funSPARQLvaluesComunica(query, currentPrefixes);
        return results.map(row => row.executor);
    } catch (error) {
        console.error('getExecutorsInGroup error:', error);
        return [];
    }
}

/**
 * Вычисляет rdfs:label для ExecutorGroup как перечисление исполнителей через запятую
 *
 * @param {string} executorGroupUri - URI ExecutorGroup
 * @returns {Promise<string>} - Вычисленная метка
 */
async function computeExecutorGroupLabel(executorGroupUri) {
    // Получаем всех исполнителей в группе
    const executorsQuery = `
        PREFIX vad: <http://example.org/vad#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?executor ?executorLabel WHERE {
            <${executorGroupUri}> vad:includes ?executor .
            OPTIONAL {
                ?executor rdfs:label ?executorLabel .
            }
        }
        ORDER BY ?executor
    `;

    try {
        const results = await funSPARQLvaluesComunica(executorsQuery, currentPrefixes);
        
        if (results.length === 0) {
            return '';
        }

        // Собираем метки исполнителей
        const executorLabels = results.map(row => {
            if (row.executorLabel) {
                return row.executorLabel;
            } else {
                // Если у исполнителя нет rdfs:label, используем префиксное имя
                return getPrefixedName(row.executor, currentPrefixes);
            }
        });

        // Объединяем через запятую
        return executorLabels.join(', ');
    } catch (error) {
        console.error('computeExecutorGroupLabel error:', error);
        return '';
    }
}

/**
 * Создаёт Virtual TriG для ExecutorGroup с вычисленным rdfs:label
 *
 * @param {string} parentTrigUri - URI родительского VADProcessDia
 * @param {Object} executorGroupLabels - { executorGroupUri: label }
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Array} - Массив созданных квадов
 */
function createExecutorGroupVirtualTriG(parentTrigUri, executorGroupLabels, prefixes) {
    if (!parentTrigUri || !currentStore || Object.keys(executorGroupLabels).length === 0) {
        return [];
    }

    const factory = N3.DataFactory;
    const { namedNode, literal } = factory;
    const newQuads = [];

    // Формируем URI виртуального контейнера для ExecutorGroup
    let virtualContainerUri;
    if (parentTrigUri.includes('#t_')) {
        virtualContainerUri = parentTrigUri.replace('#t_', '#vt_eg_');
    } else {
        const localName = parentTrigUri.split('#').pop() || parentTrigUri.split('/').pop();
        virtualContainerUri = VIRTUAL_TRIG_NS + 'vt_eg_' + localName;
    }

    const virtualGraphNode = namedNode(virtualContainerUri);

    // 1. rdf:type vad:Virtual
    newQuads.push(factory.quad(
        virtualGraphNode,
        namedNode(RDF_TYPE_URI),
        namedNode(VIRTUAL_TYPE_URI),
        virtualGraphNode
    ));

    // 2. vad:hasParentObj <parentTrigUri>
    newQuads.push(factory.quad(
        virtualGraphNode,
        namedNode(HAS_PARENT_OBJ_URI),
        namedNode(parentTrigUri),
        virtualGraphNode
    ));

    // 3. Добавляем rdfs:label для каждого ExecutorGroup
    for (const [executorGroupUri, label] of Object.entries(executorGroupLabels)) {
        if (label) {
            newQuads.push(factory.quad(
                namedNode(executorGroupUri),
                namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                literal(label),
                virtualGraphNode
            ));
        }
    }

    // Добавляем квады в store
    newQuads.forEach(quad => currentStore.addQuad(quad));

    console.log(`createExecutorGroupVirtualTriG: Created ${newQuads.length} quads for ${virtualContainerUri}`);
    return newQuads;
}

// ============================================================================
// ГЛАВНАЯ ФУНКЦИЯ ПЕРЕСЧЁТА
// ============================================================================

/**
 * Пересчитывает все Virtual TriG на основе текущих данных в store
 * Вызывается при изменении quadstore
 *
 * Алгоритм:
 * 1. Удаляем все существующие Virtual TriG
 * 2. Получаем метаданные процессов из ptree
 * 3. Для каждого VADProcessDia:
 *    - Находим индивиды процессов
 *    - Вычисляем processSubtype для каждого
 *    - Создаём Virtual TriG
 *
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Promise<Object>} - Статистика пересчёта
 */
async function recalculateAllVirtualTriGs(prefixes) {
    const stats = {
        removedQuads: 0,
        createdQuads: 0,
        virtualTrigsCreated: 0,
        errors: []
    };

    try {
        // 1. Удаляем существующие Virtual TriG
        stats.removedQuads = removeAllVirtualTriGs();

        // 2. Получаем метаданные процессов из ptree
        const processMetadata = await getAllProcessMetadataFromPtree();

        // 3. Получаем все VADProcessDia
        const vadProcessDias = await getVADProcessDiaGraphs();

        // 4. Для каждого VADProcessDia создаём Virtual TriG
        for (const trigInfo of vadProcessDias) {
            const { trigUri, definesProcess } = trigInfo;

            // Получаем индивиды процессов в этом TriG
            const processUris = await getProcessIndividualsInTrig(trigUri);

            if (processUris.length === 0) {
                continue;
            }

            // Вычисляем подтипы для каждого процесса
            const processSubtypes = {};
            for (const processUri of processUris) {
                const metadata = processMetadata[processUri] || {};
                const subtype = computeProcessSubtype(
                    processUri,
                    trigUri,
                    metadata,
                    definesProcess
                );
                processSubtypes[processUri] = subtype;
            }

            // Создаём Virtual TriG для процессов
            const newQuads = createVirtualTriG(trigUri, processSubtypes, prefixes);
            stats.createdQuads += newQuads.length;
            stats.virtualTrigsCreated++;

            // 5. Вычисляем rdfs:label для ExecutorGroup
            const executorGroups = await getExecutorGroupsInTrig(trigUri);
            if (executorGroups.length > 0) {
                const executorGroupLabels = {};
                for (const executorGroupUri of executorGroups) {
                    const label = await computeExecutorGroupLabel(executorGroupUri);
                    if (label) {
                        executorGroupLabels[executorGroupUri] = label;
                    }
                }

                // Создаём Virtual TriG для ExecutorGroup
                if (Object.keys(executorGroupLabels).length > 0) {
                    const egQuads = createExecutorGroupVirtualTriG(trigUri, executorGroupLabels, prefixes);
                    stats.createdQuads += egQuads.length;
                }
            }
        }

    } catch (error) {
        console.error('recalculateAllVirtualTriGs error:', error);
        stats.errors.push(error.message);
    }

    console.log('recalculateAllVirtualTriGs stats:', stats);
    return stats;
}

// ============================================================================
// ФУНКЦИИ ФОРМАТИРОВАНИЯ
// ============================================================================

/**
 * Форматирует Virtual TriG данные из store в строку TriG
 * Используется для отображения в UI (кнопка "Virtual TriG")
 *
 * @param {Object} prefixes - Словарь префиксов
 * @returns {string} - Строка в формате TriG
 */
function formatVirtualTriGFromStore(prefixes) {
    if (!currentStore) return '# Нет данных в store\n';

    let output = '# ==============================================================================\n';
    output += '# VIRTUAL TRIG DATA - Автоматически вычисленные свойства процессов\n';
    output += '# ==============================================================================\n';
    output += '# Эти данные хранятся в графах типа vad:Virtual (vt_*)\n';
    output += '# Пересчёт происходит при изменении схемы процесса через Reasoner.\n';
    output += '# ==============================================================================\n\n';

    // Добавляем префиксы
    output += '@prefix rdf:      <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n';
    output += '@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .\n';
    output += '@prefix vad:      <http://example.org/vad#> .\n\n';

    // Находим все виртуальные графы
    const virtualTypeQuads = currentStore.getQuads(
        null,
        RDF_TYPE_URI,
        VIRTUAL_TYPE_URI,
        null
    );

    const virtualGraphUris = new Set();
    virtualTypeQuads.forEach(quad => {
        if (quad.graph && quad.graph.value) {
            virtualGraphUris.add(quad.graph.value);
        }
    });

    // Выводим каждый виртуальный граф
    virtualGraphUris.forEach(graphUri => {
        const graphLabel = getPrefixedName(graphUri, prefixes);
        const quads = currentStore.getQuads(null, null, null, graphUri);

        if (quads.length === 0) return;

        output += `# Virtual TriG: ${graphLabel}\n`;
        output += `${graphLabel} {\n`;

        quads.forEach(quad => {
            const subjectLabel = getPrefixedName(quad.subject.value, prefixes);
            const predicateLabel = getPrefixedName(quad.predicate.value, prefixes);
            const objectLabel = quad.object.termType === 'Literal'
                ? `"${quad.object.value}"`
                : getPrefixedName(quad.object.value, prefixes);

            output += `    ${subjectLabel} ${predicateLabel} ${objectLabel} .\n`;
        });

        output += `}\n\n`;
    });

    if (virtualGraphUris.size === 0) {
        output += '# Нет виртуальных графов (vad:Virtual) в store\n';
    }

    return output;
}

// ============================================================================
// ОБРАБОТЧИКИ ИЗМЕНЕНИЙ STORE
// ============================================================================

/**
 * Обработчик добавления квада в store
 * Проверяет, требуется ли пересчёт Virtual TriG
 *
 * @param {N3.Quad} quad - Добавленный квад
 */
function onQuadAdded(quad) {
    // Типы изменений, влияющие на Virtual TriG:
    // - Добавление индивида в VADProcessDia (isSubprocessTrig)
    // - Изменение vad:hasTrig в ptree
    // - Изменение vad:hasParentObj в ptree
    // - Добавление VADProcessDia

    const predicateUri = quad.predicate.value;
    const graphUri = quad.graph?.value;

    const triggerPredicates = [
        VIRTUAL_TRIG_NS + 'isSubprocessTrig',
        VIRTUAL_TRIG_NS + 'hasTrig',
        VIRTUAL_TRIG_NS + 'hasParentObj',
        VIRTUAL_TRIG_NS + 'hasParentProcess'
    ];

    // Проверяем, является ли это rdf:type vad:VADProcessDia
    const isNewVADProcessDia =
        predicateUri === RDF_TYPE_URI &&
        quad.object.value === VIRTUAL_TRIG_NS + 'VADProcessDia';

    if (triggerPredicates.includes(predicateUri) || isNewVADProcessDia) {
        console.log('onQuadAdded: Triggering Virtual TriG recalculation');
        // Пересчёт будет выполнен через событие или явный вызов
        // recalculateAllVirtualTriGs(currentPrefixes);
    }
}

/**
 * Обработчик удаления квада из store
 * Проверяет, требуется ли удаление связанного Virtual TriG
 *
 * @param {N3.Quad} quad - Удалённый квад
 */
function onQuadRemoved(quad) {
    const predicateUri = quad.predicate.value;

    // Если удаляется VADProcessDia, удаляем связанный Virtual TriG
    if (predicateUri === RDF_TYPE_URI &&
        quad.object.value === VIRTUAL_TRIG_NS + 'VADProcessDia') {

        const trigUri = quad.subject.value;
        const virtualTrigUri = trigUri.replace('#t_', '#vt_');

        console.log('onQuadRemoved: Removing Virtual TriG for deleted VADProcessDia:', virtualTrigUri);
        removeVirtualTriG(virtualTrigUri);
    }
}

// ============================================================================
// ЭКСПОРТ ФУНКЦИЙ (для использования в других модулях)
// ============================================================================

// Функции доступны глобально для вызова из других модулей
// В модульной системе ES6 использовать export
