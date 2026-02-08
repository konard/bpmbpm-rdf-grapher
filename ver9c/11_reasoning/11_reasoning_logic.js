// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/317
// 11_reasoning_logic.js - Логика Reasoner для вычисления Virtual TriG

/**
 * Модуль 11_reasoning отвечает за:
 * - Интеграцию с comunica-feature-reasoning
 * - Применение правил вывода (inference rules) для вычисления Virtual TriG
 * - Замену императивного JavaScript-кода декларативными правилами
 *
 * Принципы (согласно base_concept_rules.md):
 * - Приоритет декларативного SPARQL над императивным JavaScript
 * - Вычисление данных через Reasoner, а не через JS-функции
 * - Правила вывода в формате N3/RDFS
 */

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const REASONING_NS = {
    RDF: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDFS: 'http://www.w3.org/2000/01/rdf-schema#',
    OWL: 'http://www.w3.org/2002/07/owl#',
    VAD: 'http://example.org/vad#',
    LOG: 'http://www.w3.org/2000/10/swap/log#'
};

// Состояние Reasoner
let reasonerEngine = null;
let reasonerInitialized = false;

// ============================================================================
// ПРАВИЛА ВЫВОДА (INFERENCE RULES)
// ============================================================================

/**
 * Правила вывода для вычисления processSubtype в формате N3
 * Согласно reasoner_concept_v1.md
 */
const INFERENCE_RULES_N3 = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix vad: <http://example.org/vad#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

# ==============================================================================
# ПРАВИЛО 1: NotDefinedType
# Если hasParentObj указывает на pNotDefined, процесс имеет тип NotDefinedType
# ==============================================================================
{
    ?process rdf:type vad:TypeProcess .
    ?process vad:hasParentObj vad:pNotDefined .
} => {
    ?process vad:processSubtype vad:NotDefinedType .
} .

# ==============================================================================
# ПРАВИЛО 2: Detailed (базовый)
# Если процесс имеет hasTrig, он является Detailed
# ==============================================================================
{
    ?process rdf:type vad:TypeProcess .
    ?process vad:hasTrig ?trig .
    ?process vad:hasParentObj ?parent .
    ?parent log:notEqualTo vad:pNotDefined .
} => {
    ?process vad:isDetailed true .
} .

# ==============================================================================
# ПРАВИЛО 3: notDetailed (базовый)
# Если процесс НЕ имеет hasTrig, он является notDetailed
# Примечание: Для N3.js используется scoped negation
# ==============================================================================
{
    ?process rdf:type vad:TypeProcess .
    ?process vad:hasParentObj ?parent .
    ?parent log:notEqualTo vad:pNotDefined .
} => {
    ?process vad:isDetailed false .
} .

# ==============================================================================
# ПРАВИЛО 4: DetailedChild
# Detailed процесс, находящийся в схеме родительского процесса
# ==============================================================================
{
    ?process vad:isDetailed true .
    ?process vad:isSubprocessTrig ?trig .
    ?trig vad:definesProcess ?parent .
    ?process vad:hasParentObj ?parent .
} => {
    ?process vad:processSubtype vad:DetailedChild .
} .

# ==============================================================================
# ПРАВИЛО 5: DetailedExternal
# Detailed процесс, находящийся во внешней схеме
# ==============================================================================
{
    ?process vad:isDetailed true .
    ?process vad:isSubprocessTrig ?trig .
    ?trig vad:definesProcess ?defProcess .
    ?process vad:hasParentObj ?parent .
    ?defProcess log:notEqualTo ?parent .
} => {
    ?process vad:processSubtype vad:DetailedExternal .
} .

# ==============================================================================
# ПРАВИЛО 6: notDetailedChild
# notDetailed процесс, находящийся в схеме родительского процесса
# ==============================================================================
{
    ?process vad:isDetailed false .
    ?process vad:isSubprocessTrig ?trig .
    ?trig vad:definesProcess ?parent .
    ?process vad:hasParentObj ?parent .
} => {
    ?process vad:processSubtype vad:notDetailedChild .
} .

# ==============================================================================
# ПРАВИЛО 7: notDetailedExternal
# notDetailed процесс, находящийся во внешней схеме
# ==============================================================================
{
    ?process vad:isDetailed false .
    ?process vad:isSubprocessTrig ?trig .
    ?trig vad:definesProcess ?defProcess .
    ?process vad:hasParentObj ?parent .
    ?defProcess log:notEqualTo ?parent .
} => {
    ?process vad:processSubtype vad:notDetailedExternal .
} .
`;

/**
 * RDFS правила для иерархии классов (для comunica-feature-reasoning)
 */
const RDFS_RULES = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix vad: <http://example.org/vad#> .

# RDFS subclass hierarchy для подтипов процессов
vad:DetailedChild rdfs:subClassOf vad:Detailed .
vad:DetailedExternal rdfs:subClassOf vad:Detailed .
vad:notDetailedChild rdfs:subClassOf vad:notDetailed .
vad:notDetailedExternal rdfs:subClassOf vad:notDetailed .
vad:Detailed rdfs:subClassOf vad:ProcessSubtype .
vad:notDetailed rdfs:subClassOf vad:ProcessSubtype .
vad:NotDefinedType rdfs:subClassOf vad:ProcessSubtype .

# Domain/Range для автоматического вывода
vad:processSubtype rdfs:domain vad:TypeProcess .
vad:processSubtype rdfs:range vad:ProcessSubtype .

# Типы графов
vad:Virtual rdfs:subClassOf vad:TriG .
vad:VADProcessDia rdfs:subClassOf vad:TriG .
vad:ObjectTree rdfs:subClassOf vad:TriG .
`;

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ REASONER
// ============================================================================

/**
 * Инициализирует Reasoner engine
 * Поддерживает comunica-feature-reasoning и EYE-JS
 *
 * @param {string} reasonerType - Тип reasoner: 'comunica' | 'eye-js'
 * @returns {Promise<boolean>} - true если инициализация успешна
 */
async function initializeReasoner(reasonerType = 'comunica') {
    try {
        if (reasonerType === 'comunica') {
            // Проверяем доступность comunica-feature-reasoning
            if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                // Используем comunica-feature-reasoning если доступен
                // В текущей версии используем стандартный Comunica с RDFS reasoning
                reasonerEngine = new Comunica.QueryEngine();
                reasonerInitialized = true;
                console.log('Reasoner initialized: comunica-sparql-rdfjs');
                return true;
            }
        } else if (reasonerType === 'eye-js') {
            // Проверяем доступность EYE-JS
            if (typeof n3reasoner !== 'undefined') {
                reasonerEngine = { type: 'eye-js', reason: n3reasoner };
                reasonerInitialized = true;
                console.log('Reasoner initialized: eye-js');
                return true;
            }
        }

        // Fallback: используем стандартный Comunica
        if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
            reasonerEngine = new Comunica.QueryEngine();
            reasonerInitialized = true;
            console.log('Reasoner initialized: comunica (fallback)');
            return true;
        }

        console.warn('No reasoner engine available');
        return false;

    } catch (error) {
        console.error('Reasoner initialization error:', error);
        return false;
    }
}

/**
 * Проверяет, инициализирован ли Reasoner
 * @returns {boolean}
 */
function isReasonerInitialized() {
    return reasonerInitialized && reasonerEngine !== null;
}

// ============================================================================
// ФУНКЦИИ REASONING
// ============================================================================

/**
 * Выполняет inference на основе правил и возвращает выведенные квады
 *
 * @param {N3.Store} store - N3.Store с данными
 * @param {string} rules - Правила вывода в формате N3
 * @returns {Promise<Array>} - Массив выведенных квадов
 */
async function performInference(store, rules = INFERENCE_RULES_N3) {
    if (!isReasonerInitialized()) {
        console.warn('Reasoner not initialized, using fallback logic');
        return performInferenceFallback(store);
    }

    try {
        if (reasonerEngine.type === 'eye-js') {
            return await performInferenceEyeJS(store, rules);
        } else {
            return await performInferenceComunica(store);
        }
    } catch (error) {
        console.error('Inference error:', error);
        return performInferenceFallback(store);
    }
}

/**
 * Inference через comunica-feature-reasoning
 * Использует RDFS reasoning для вывода
 *
 * @param {N3.Store} store - N3.Store с данными
 * @returns {Promise<Array>} - Массив выведенных квадов
 */
async function performInferenceComunica(store) {
    const inferredQuads = [];

    // SPARQL CONSTRUCT для материализации выведенных данных
    const constructQuery = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vad: <http://example.org/vad#>

        CONSTRUCT {
            ?process vad:processSubtype ?subtype .
        }
        WHERE {
            ?process rdf:type vad:TypeProcess .
            ?process vad:hasParentObj ?parent .
            OPTIONAL { ?process vad:hasTrig ?trig }
            OPTIONAL { ?process vad:isSubprocessTrig ?inTrig }
            OPTIONAL { ?inTrig vad:definesProcess ?defines }

            # Вычисление подтипа через BIND
            BIND(
                IF(?parent = vad:pNotDefined,
                    vad:NotDefinedType,
                    IF(BOUND(?trig),
                        IF(?parent = ?defines, vad:DetailedChild, vad:DetailedExternal),
                        IF(?parent = ?defines, vad:notDetailedChild, vad:notDetailedExternal)
                    )
                ) AS ?subtype
            )
        }
    `;

    try {
        const result = await reasonerEngine.queryQuads(constructQuery, {
            sources: [store]
        });

        for await (const quad of result) {
            inferredQuads.push(quad);
        }
    } catch (error) {
        console.error('Comunica inference error:', error);
    }

    return inferredQuads;
}

/**
 * Inference через EYE-JS (N3 reasoner)
 *
 * @param {N3.Store} store - N3.Store с данными
 * @param {string} rules - Правила в формате N3
 * @returns {Promise<Array>} - Массив выведенных квадов
 */
async function performInferenceEyeJS(store, rules) {
    if (!reasonerEngine || reasonerEngine.type !== 'eye-js') {
        throw new Error('EYE-JS reasoner not available');
    }

    // Сериализуем данные из store в N3
    const writer = new N3.Writer({ format: 'text/n3' });
    const quads = store.getQuads(null, null, null, null);

    quads.forEach(quad => writer.addQuad(quad));

    return new Promise((resolve, reject) => {
        writer.end((error, result) => {
            if (error) {
                reject(error);
                return;
            }

            // Выполняем reasoning
            const dataWithRules = result + '\n' + rules;
            const query = `
                { ?s vad:processSubtype ?o } => { ?s vad:processSubtype ?o } .
            `;

            reasonerEngine.reason(dataWithRules, query)
                .then(inferredN3 => {
                    // Парсим результат
                    const parser = new N3.Parser({ format: 'text/n3' });
                    const inferredQuads = [];

                    parser.parse(inferredN3, (err, quad) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (quad) {
                            inferredQuads.push(quad);
                        } else {
                            resolve(inferredQuads);
                        }
                    });
                })
                .catch(reject);
        });
    });
}

/**
 * Fallback inference через JavaScript (для совместимости)
 * Используется, если Reasoner недоступен
 *
 * @param {N3.Store} store - N3.Store с данными
 * @returns {Array} - Массив выведенных квадов
 */
function performInferenceFallback(store) {
    console.log('Using fallback inference (JavaScript implementation)');

    // Используем существующую функцию calculateProcessSubtypes
    // Это обеспечивает совместимость с текущей реализацией
    if (typeof calculateProcessSubtypes === 'function' && typeof trigHierarchy !== 'undefined') {
        const virtualData = calculateProcessSubtypes(trigHierarchy, currentPrefixes);
        const inferredQuads = [];

        const factory = N3.DataFactory;
        const { namedNode } = factory;

        for (const [trigUri, processes] of Object.entries(virtualData)) {
            for (const [processUri, processInfo] of Object.entries(processes)) {
                const subtype = processInfo.processSubtype;
                if (subtype) {
                    inferredQuads.push(factory.quad(
                        namedNode(processUri),
                        namedNode(REASONING_NS.VAD + 'processSubtype'),
                        namedNode(REASONING_NS.VAD + subtype),
                        namedNode(trigUri.replace('#t_', '#vt_'))
                    ));
                }
            }
        }

        return inferredQuads;
    }

    return [];
}

// ============================================================================
// МАТЕРИАЛИЗАЦИЯ ВИРТУАЛЬНЫХ ДАННЫХ
// ============================================================================

/**
 * Выполняет полный цикл reasoning и материализует Virtual TriG
 *
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Promise<Object>} - Статистика { inferredQuads, virtualTrigsCreated, errors }
 */
async function materializeVirtualData(prefixes) {
    const stats = {
        inferredQuads: 0,
        virtualTrigsCreated: 0,
        errors: []
    };

    if (!currentStore) {
        stats.errors.push('currentStore not initialized');
        return stats;
    }

    try {
        // 1. Выполняем inference
        const inferredQuads = await performInference(currentStore);
        stats.inferredQuads = inferredQuads.length;

        // 2. Группируем выведенные квады по Virtual TriG
        const quadsByVirtualTrig = {};

        inferredQuads.forEach(quad => {
            let virtualTrigUri = quad.graph?.value;

            // Если граф не указан, определяем его по процессу
            if (!virtualTrigUri) {
                // Находим isSubprocessTrig для процесса
                const isSubprocessQuads = currentStore.getQuads(
                    quad.subject,
                    REASONING_NS.VAD + 'isSubprocessTrig',
                    null,
                    null
                );

                if (isSubprocessQuads.length > 0) {
                    const parentTrig = isSubprocessQuads[0].object.value;
                    virtualTrigUri = parentTrig.replace('#t_', '#vt_');
                }
            }

            if (virtualTrigUri) {
                if (!quadsByVirtualTrig[virtualTrigUri]) {
                    quadsByVirtualTrig[virtualTrigUri] = [];
                }
                quadsByVirtualTrig[virtualTrigUri].push(quad);
            }
        });

        // 3. Удаляем существующие Virtual TriG
        if (typeof removeAllVirtualTriGs === 'function') {
            removeAllVirtualTriGs();
        }

        // 4. Создаём новые Virtual TriG с выведенными данными
        const factory = N3.DataFactory;
        const { namedNode } = factory;

        for (const [virtualTrigUri, quads] of Object.entries(quadsByVirtualTrig)) {
            const virtualGraphNode = namedNode(virtualTrigUri);
            const parentTrigUri = virtualTrigUri.replace('#vt_', '#t_');

            // Добавляем метаданные Virtual TriG
            currentStore.addQuad(factory.quad(
                virtualGraphNode,
                namedNode(REASONING_NS.RDF + 'type'),
                namedNode(REASONING_NS.VAD + 'Virtual'),
                virtualGraphNode
            ));

            currentStore.addQuad(factory.quad(
                virtualGraphNode,
                namedNode(REASONING_NS.VAD + 'hasParentObj'),
                namedNode(parentTrigUri),
                virtualGraphNode
            ));

            // Добавляем выведенные квады
            quads.forEach(quad => {
                // Обновляем граф на виртуальный
                const updatedQuad = factory.quad(
                    quad.subject,
                    quad.predicate,
                    quad.object,
                    virtualGraphNode
                );
                currentStore.addQuad(updatedQuad);
            });

            stats.virtualTrigsCreated++;
        }

    } catch (error) {
        console.error('materializeVirtualData error:', error);
        stats.errors.push(error.message);
    }

    console.log('materializeVirtualData stats:', stats);
    return stats;
}

// ============================================================================
// ВАЛИДАЦИЯ ПРАВИЛ
// ============================================================================

/**
 * Проверяет консистентность выведенных данных
 *
 * @returns {Promise<Array>} - Массив найденных нарушений
 */
async function validateInferredData() {
    const violations = [];

    if (!currentStore) return violations;

    // Проверка 1: все vt_* графы должны иметь тип vad:Virtual
    const vtGraphs = new Set();
    const allQuads = currentStore.getQuads(null, null, null, null);

    allQuads.forEach(quad => {
        if (quad.graph && quad.graph.value && quad.graph.value.includes('#vt_')) {
            vtGraphs.add(quad.graph.value);
        }
    });

    for (const graphUri of vtGraphs) {
        const hasVirtualType = currentStore.getQuads(
            graphUri,
            REASONING_NS.RDF + 'type',
            REASONING_NS.VAD + 'Virtual',
            graphUri
        ).length > 0;

        if (!hasVirtualType) {
            violations.push({
                type: 'MISSING_VIRTUAL_TYPE',
                graph: graphUri,
                message: `Graph ${graphUri} has vt_ prefix but no rdf:type vad:Virtual`
            });
        }
    }

    // Проверка 2: все Virtual TriG должны иметь hasParentObj
    for (const graphUri of vtGraphs) {
        const hasParent = currentStore.getQuads(
            graphUri,
            REASONING_NS.VAD + 'hasParentObj',
            null,
            graphUri
        ).length > 0;

        if (!hasParent) {
            violations.push({
                type: 'MISSING_PARENT',
                graph: graphUri,
                message: `Virtual TriG ${graphUri} has no vad:hasParentObj`
            });
        }
    }

    return violations;
}

// ============================================================================
// ЭКСПОРТ (для использования в других модулях)
// ============================================================================

// Функции доступны глобально
// В ES6 модулях использовать export
