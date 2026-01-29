// ============================================================================
// ФУНКЦИИ РАБОТЫ СО СТИЛЯМИ
// Issue #227: Вынесено из index.html в отдельный файл
// ============================================================================

const BaseStyles = {
    literal: 'shape="box" style="filled" fillcolor="#ffffcc"',
    blankNode: 'shape="ellipse" style="filled" fillcolor="#e0e0e0"',
    uri: 'shape="ellipse" style="filled" fillcolor="#cce5ff"',
    edge: ''
};

function getNodeStyle(nodeUri, isLiteral, isBlankNode) {
    if (currentMode === 'base') {
        if (isLiteral) return BaseStyles.literal;
        if (isBlankNode) return BaseStyles.blankNode;
        return BaseStyles.uri;
    }

    if (currentMode === 'aggregation') {
        if (isBlankNode) return AggregationNodeStyles['BlankNodeStyle'].dot;
        const nodeTypes = nodeTypesCache[nodeUri] || [];
        for (const [styleName, styleConfig] of Object.entries(AggregationNodeStyles)) {
            if (styleName === 'default') continue;
            for (const type of styleConfig.types) {
                if (type.startsWith('_')) continue;
                if (nodeTypes.includes(type)) return styleConfig.dot;
            }
        }
        return AggregationNodeStyles['default'].dot;
    }

    if (currentMode === 'vad' || currentMode === 'vad-trig') {
        if (isBlankNode) return VADNodeStyles['default'].dot;
        const nodeTypes = nodeTypesCache[nodeUri] || [];
        const nodeSubtypes = nodeSubtypesCache[nodeUri] || [];

        // First, check styles that have subtypes defined (DetailedChild, DetailedExternal, notDetailedChild, notDetailedExternal, NotDefinedType, Detailed, notDetailed)
        for (const [styleName, styleConfig] of Object.entries(VADNodeStyles)) {
            if (styleName === 'default') continue;
            if (!styleConfig.subtypes) continue; // Skip styles without subtypes

            // Check if node has matching type
            const hasMatchingType = styleConfig.types.some(type => nodeTypes.includes(type));
            if (!hasMatchingType) continue;

            // Check if node has matching subtype
            const hasMatchingSubtype = styleConfig.subtypes.some(subtype => nodeSubtypes.includes(subtype));
            if (hasMatchingSubtype) return styleConfig.dot;
        }

        // Then, check styles without subtypes (ExecutorGroupStyle, ExecutorStyle, etc.)
        for (const [styleName, styleConfig] of Object.entries(VADNodeStyles)) {
            if (styleName === 'default') continue;
            if (styleConfig.subtypes) continue; // Skip styles with subtypes (already checked)

            for (const type of styleConfig.types) {
                if (nodeTypes.includes(type)) return styleConfig.dot;
            }
        }

        // For Process nodes without explicit subtype, default to notDetailedChild style
        // (ProcessStyleBasic не определён, используем стиль не детализированного подпроцесса как fallback)
        const isProcess = nodeTypes.some(t =>
            t === 'vad:TypeProcess' || t === 'http://example.org/vad#TypeProcess'
        );
        if (isProcess) {
            return VADNodeStyles['ProcessStyleNotDetailedChild'].dot;
        }

        return VADNodeStyles['default'].dot;
    }

    // Режим нотации
    if (isLiteral) return StyleName.nodeStyles['LiteralStyle'].dot;
    if (isBlankNode) return StyleName.nodeStyles['BlankNodeStyle'].dot;

    const nodeTypes = nodeTypesCache[nodeUri] || [];
    for (const [styleName, styleConfig] of Object.entries(StyleName.nodeStyles)) {
        if (styleName === 'default') continue;
        for (const type of styleConfig.types) {
            if (type.startsWith('_')) continue;
            if (nodeTypes.includes(type)) return styleConfig.dot;
        }
    }
    return StyleName.nodeStyles['default'].dot;
}

function getEdgeStyle(predicateUri, predicateLabel) {
    if (currentMode === 'base') return BaseStyles.edge;

    if (currentMode === 'vad') {
        for (const [styleName, styleConfig] of Object.entries(VADEdgeStyles)) {
            if (styleName === 'default') continue;
            for (const predicate of styleConfig.predicates) {
                if (predicateUri === predicate || predicateLabel === predicate) {
                    return styleConfig.dot;
                }
            }
        }
        return VADEdgeStyles['default'].dot;
    }

    // Режим нотации или агрегации
    for (const [styleName, styleConfig] of Object.entries(StyleName.edgeStyles)) {
        if (styleName === 'default') continue;
        for (const predicate of styleConfig.predicates) {
            if (predicateUri === predicate || predicateLabel === predicate) {
                return styleConfig.dot;
            }
        }
    }
    return StyleName.edgeStyles['default'].dot;
}

function buildNodeTypesCache(quads, prefixes) {
    nodeTypesCache = {};
    nodeSubtypesCache = {};
    const typePredicates = [
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        'rdf:type',
        'a'
    ];
    const subtypePredicates = [
        'http://example.org/vad#processSubtype',
        'vad:processSubtype'
    ];

    // Функция для обработки квадов и наполнения кешей
    function processQuads(quadsToProcess) {
        quadsToProcess.forEach(quad => {
            const predicateValue = quad.predicate.value;
            const predicateLabel = getPrefixedName(predicateValue, prefixes);

            // Build types cache
            if (typePredicates.includes(predicateValue) ||
                typePredicates.includes(predicateLabel) ||
                predicateLabel === 'a') {

                const subjectUri = quad.subject.value;
                const typeUri = quad.object.value;
                const typeLabel = getPrefixedName(typeUri, prefixes);

                if (!nodeTypesCache[subjectUri]) {
                    nodeTypesCache[subjectUri] = [];
                }

                if (!nodeTypesCache[subjectUri].includes(typeUri)) {
                    nodeTypesCache[subjectUri].push(typeUri);
                }
                if (!nodeTypesCache[subjectUri].includes(typeLabel)) {
                    nodeTypesCache[subjectUri].push(typeLabel);
                }
            }

            // Build subtypes cache for vad:processSubtype
            if (subtypePredicates.includes(predicateValue) ||
                subtypePredicates.includes(predicateLabel)) {

                const subjectUri = quad.subject.value;
                const subtypeUri = quad.object.value;
                const subtypeLabel = getPrefixedName(subtypeUri, prefixes);

                if (!nodeSubtypesCache[subjectUri]) {
                    nodeSubtypesCache[subjectUri] = [];
                }

                if (!nodeSubtypesCache[subjectUri].includes(subtypeUri)) {
                    nodeSubtypesCache[subjectUri].push(subtypeUri);
                }
                if (!nodeSubtypesCache[subjectUri].includes(subtypeLabel)) {
                    nodeSubtypesCache[subjectUri].push(subtypeLabel);
                }
            }
        });
    }

    // Обрабатываем переданные квады
    processQuads(quads);

    // Дополнительно: в режиме VAD TriG также включаем типы из vad:ptree
    // чтобы rdf:type vad:TypeProcess были доступны для всех TriG графов
    if (trigHierarchy && trigHierarchy[PTREE_GRAPH_URI]) {
        const ptreeQuads = trigHierarchy[PTREE_GRAPH_URI].quads;
        processQuads(ptreeQuads);
    }
}

/**
 * Обновляет nodeSubtypesCache на основе virtualRDFdata для выбранного TriG
 * Это необходимо для правильного отображения стилей на диаграмме,
 * т.к. processSubtype вычисляется автоматически и зависит от контекста TriG.
 *
 * @param {string} trigUri - URI TriG для которого обновляем кэш
 */
function updateSubtypesCacheFromVirtualData(trigUri) {
    if (!virtualRDFdata || !virtualRDFdata[trigUri]) {
        return;
    }

    const processesData = virtualRDFdata[trigUri];

    for (const [processUri, processInfo] of Object.entries(processesData)) {
        const processSubtype = processInfo.processSubtype;
        if (!processSubtype) {
            continue;
        }

        // Формируем значения подтипа в обоих форматах (prefixed и full URI)
        const subtypePrefixed = 'vad:' + processSubtype;
        const subtypeFullUri = 'http://example.org/vad#' + processSubtype;

        // Инициализируем массив подтипов если его нет
        if (!nodeSubtypesCache[processUri]) {
            nodeSubtypesCache[processUri] = [];
        }

        // Добавляем подтип если его ещё нет
        if (!nodeSubtypesCache[processUri].includes(subtypePrefixed)) {
            nodeSubtypesCache[processUri].push(subtypePrefixed);
        }
        if (!nodeSubtypesCache[processUri].includes(subtypeFullUri)) {
            nodeSubtypesCache[processUri].push(subtypeFullUri);
        }
    }
}
