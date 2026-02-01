// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// vadlib.js - Основная библиотека утилит RDF Grapher

// ============================================================================
// РЕЖИМ ВИЗУАЛИЗАЦИИ
// ============================================================================
const Mode = 'notation';

// ============================================================================
// КОНФИГУРАЦИЯ ФИЛЬТРОВ
// ============================================================================
const Filter = {
    hiddenPredicates: [
        'rdf:type', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        'rdfs:subClassOf', 'http://www.w3.org/2000/01/rdf-schema#subClassOf'
    ]
};
const FilterBase = { hiddenPredicates: [] };
const FilterAggregation = {
    hiddenPredicates: [
        'rdf:type', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        'rdfs:subClassOf', 'http://www.w3.org/2000/01/rdf-schema#subClassOf'
    ]
};
const FilterVAD = {
    hiddenPredicates: [
        'rdf:type', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        'vad:hasParentObj', 'http://example.org/vad#hasParentObj'
    ]
};

function getFilterConfig(mode) {
    if (mode === 'base') return FilterBase;
    else if (mode === 'aggregation') return FilterAggregation;
    else if (mode === 'vad' || mode === 'vad-trig') return FilterVAD;
    return Filter;
}

// ============================================================================
// КОНФИГУРАЦИЯ АГРЕГАЦИИ
// ============================================================================
const MaxAggregationParams = 5;
const DEFAULT_MAX_LABEL_LENGTH = 25;
let currentMaxLabelLength = DEFAULT_MAX_LABEL_LENGTH;
const DEFAULT_MAX_VAD_ROW_LENGTH = 8;
let currentMaxVadRowLength = DEFAULT_MAX_VAD_ROW_LENGTH;

// ============================================================================
// КОНФИГУРАЦИЯ VAD
// ============================================================================
const VAD_ALLOWED_TYPES = [
    'vad:TypeProcess', 'http://example.org/vad#TypeProcess',
    'vad:ExecutorGroup', 'http://example.org/vad#ExecutorGroup',
    'vad:TypeExecutor', 'http://example.org/vad#TypeExecutor',
    'vad:VADProcessDia', 'http://example.org/vad#VADProcessDia',
    'vad:ObjectTree', 'http://example.org/vad#ObjectTree',
    'vad:TechTree', 'http://example.org/vad#TechTree',
    'vad:ProcessTree', 'http://example.org/vad#ProcessTree',
    'vad:ExecutorTree', 'http://example.org/vad#ExecutorTree',
    'vad:Detailed', 'http://example.org/vad#Detailed',
    'vad:DetailedChild', 'http://example.org/vad#DetailedChild',
    'vad:DetailedExternal', 'http://example.org/vad#DetailedExternal',
    'vad:notDetailed', 'http://example.org/vad#notDetailed',
    'vad:notDetailedChild', 'http://example.org/vad#notDetailedChild',
    'vad:notDetailedExternal', 'http://example.org/vad#notDetailedExternal',
    'vad:NotDefinedType', 'http://example.org/vad#NotDefinedType'
];

const VAD_ALLOWED_PREDICATES = [
    'rdf:type', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'rdfs:label', 'http://www.w3.org/2000/01/rdf-schema#label',
    'dcterms:description', 'http://purl.org/dc/terms/description',
    'vad:hasNext', 'http://example.org/vad#hasNext',
    'vad:hasExecutor', 'http://example.org/vad#hasExecutor',
    'vad:hasParentObj', 'http://example.org/vad#hasParentObj',
    'vad:includes', 'http://example.org/vad#includes',
    'vad:processSubtype', 'http://example.org/vad#processSubtype',
    'vad:hasTrig', 'http://example.org/vad#hasTrig',
    'vad:hasParentProcess', 'http://example.org/vad#hasParentProcess',
    'vad:definesProcess', 'http://example.org/vad#definesProcess',
    'vad:isSubprocessTrig', 'http://example.org/vad#isSubprocessTrig'
];

const PTREE_PREDICATES = [
    'rdf:type', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'rdfs:label', 'http://www.w3.org/2000/01/rdf-schema#label',
    'dcterms:description', 'http://purl.org/dc/terms/description',
    'vad:hasTrig', 'http://example.org/vad#hasTrig',
    'vad:hasParentProcess', 'http://example.org/vad#hasParentProcess',
    'vad:hasParentObj', 'http://example.org/vad#hasParentObj'
];

const RTREE_PREDICATES = [
    'rdf:type', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'rdfs:label', 'http://www.w3.org/2000/01/rdf-schema#label',
    'vad:hasParentObj', 'http://example.org/vad#hasParentObj'
];

const TRIG_TYPES = {
    OBJECT_TREE: ['vad:ObjectTree', 'http://example.org/vad#ObjectTree'],
    TECH_TREE: ['vad:TechTree', 'http://example.org/vad#TechTree'],
    PROCESS_TREE: ['vad:ProcessTree', 'http://example.org/vad#ProcessTree'],
    EXECUTOR_TREE: ['vad:ExecutorTree', 'http://example.org/vad#ExecutorTree'],
    VAD_PROCESS_DIA: ['vad:VADProcessDia', 'http://example.org/vad#VADProcessDia']
};

const PROCESS_SUBTYPES = {
    DETAILED: ['vad:Detailed', 'http://example.org/vad#Detailed'],
    DETAILED_CHILD: ['vad:DetailedChild', 'http://example.org/vad#DetailedChild'],
    DETAILED_EXTERNAL: ['vad:DetailedExternal', 'http://example.org/vad#DetailedExternal'],
    NOT_DETAILED: ['vad:notDetailed', 'http://example.org/vad#notDetailed'],
    NOT_DETAILED_CHILD: ['vad:notDetailedChild', 'http://example.org/vad#notDetailedChild'],
    NOT_DETAILED_EXTERNAL: ['vad:notDetailedExternal', 'http://example.org/vad#notDetailedExternal'],
    NOT_DEFINED_TYPE: ['vad:NotDefinedType', 'http://example.org/vad#NotDefinedType']
};

const TYPE_PREDICATE_MAP = {
    'vad:TypeProcess': {
        ptree: ['rdf:type', 'rdfs:label', 'dcterms:description', 'vad:hasTrig', 'vad:hasParentObj'],
        vadProcessDia: ['vad:isSubprocessTrig', 'vad:hasExecutor', 'vad:processSubtype', 'vad:hasNext']
    },
    'vad:TypeExecutor': {
        rtree: ['rdf:type', 'rdfs:label', 'vad:hasParentObj']
    },
    'vad:ExecutorGroup': {
        vadProcessDia: ['rdf:type', 'rdfs:label', 'vad:includes']
    },
    'vad:VADProcessDia': {
        vadProcessDia: ['rdf:type', 'rdfs:label', 'vad:hasParentObj', 'vad:definesProcess']
    },
    'vad:ObjectTree': {
        objectTree: ['rdf:type', 'rdfs:label', 'vad:hasParentObj']
    },
    'vad:TechTree': {
        techTree: ['rdf:type', 'rdfs:label']
    },
    'vad:ProcessTree': {
        ptree: ['rdf:type', 'rdfs:label', 'vad:hasParentObj']
    },
    'vad:ExecutorTree': {
        rtree: ['rdf:type', 'rdfs:label', 'vad:hasParentObj']
    }
};

// ============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================================
let currentSvgElement = null;
let currentScale = 1.0;
let currentPrefixes = {};
let nodeTypesCache = {};
let nodeSubtypesCache = {};
let currentQuads = [];
let nodeLabelToUri = {};
let selectedNodeElement = null;
let propertiesPanelCounter = 0;
let openPropertiesPanels = [];
let currentMode = Mode;
let draggedPanel = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentStore = null;
let comunicaEngine = null;
let currentDotCode = '';
let virtualRDFdata = {};
let smartDesignMode = 'filtered';
let activeFilters = [...getFilterConfig(Mode).hiddenPredicates];
let allPredicates = [];
let trigHierarchy = {};
let selectedTrigUri = null;
let allTrigGraphs = [];
let isNewTrigQuery = false;
const PTREE_GRAPH_URI = 'http://example.org/vad#ptree';
const RTREE_GRAPH_URI = 'http://example.org/vad#rtree';
let techAppendixData = {
    loaded: false,
    predicateGroups: {},
    autoGeneratedPredicates: {},
    contextTriGTypes: {}
};

const PROCESS_OBJECT_PREDICATES = [
    'vad:hasNext', 'http://example.org/vad#hasNext'
];

const defaultSparqlQuery = `SELECT ?s ?p ?o\nWHERE {\n    ?s ?p ?o .\n}`;

const formatMapping = {
    'turtle': 'ttl', 'n-triples': 'nt', 'n-quads': 'nq', 'trig': 'trig'
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function getLocalName(uri) {
    if (typeof uri !== 'string') return String(uri);
    const hashIndex = uri.lastIndexOf('#');
    const slashIndex = uri.lastIndexOf('/');
    const splitIndex = Math.max(hashIndex, slashIndex);
    if (splitIndex !== -1 && splitIndex < uri.length - 1) {
        return uri.substring(splitIndex + 1);
    }
    return uri;
}

function getPrefixedName(uri, prefixes) {
    if (typeof uri !== 'string') return String(uri);
    for (const [prefix, namespace] of Object.entries(prefixes)) {
        if (uri.startsWith(namespace)) {
            const localName = uri.substring(namespace.length);
            return prefix + ':' + localName;
        }
    }
    return getLocalName(uri);
}

function escapeDotString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function generateNodeId(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'node' + Math.abs(hash);
}

function generateVadNodeId(uri, prefixes) {
    const prefixedName = getPrefixedName(uri, prefixes);
    return prefixedName.replace(/[:\-\.\s]/g, '_');
}

function isNameOrLabelPredicate(predicateLabel) {
    const lowerPredicate = predicateLabel.toLowerCase();
    return lowerPredicate.includes('name') || lowerPredicate.includes('label');
}

function escapeHtmlLabel(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function wrapTextByWords(text, maxLength) {
    if (!text || text.length <= maxLength) return [text];
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        if (currentLine.length === 0) { currentLine = word; }
        else if (currentLine.length + 1 + word.length <= maxLength) { currentLine += ' ' + word; }
        else { lines.push(currentLine); currentLine = word; }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
}

function formatLabelWithWrap(label, maxLength, isBold = false) {
    const lines = wrapTextByWords(label, maxLength);
    const needsWrap = lines.length > 1;
    if (!needsWrap) {
        if (isBold) return `<B>${escapeHtmlLabel(label)}</B>`;
        return escapeHtmlLabel(label);
    }
    let result = '';
    for (let i = 0; i < lines.length; i++) {
        if (i > 0) result += '<BR/>';
        const escapedLine = escapeHtmlLabel(lines[i]);
        if (isBold) { result += `<FONT POINT-SIZE="9"><B>${escapedLine}</B></FONT>`; }
        else { result += `<FONT POINT-SIZE="9">${escapedLine}</FONT>`; }
    }
    return result;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isPtreePredicate(predicateUri) {
    return PTREE_PREDICATES.some(allowed =>
        predicateUri === allowed || predicateUri.endsWith('#' + allowed.split(':')[1])
    );
}

function isRtreePredicate(predicateUri) {
    return RTREE_PREDICATES.some(allowed =>
        predicateUri === allowed || predicateUri.endsWith('#' + allowed.split(':')[1])
    );
}

function isSubjectVadProcess(subjectUri) {
    const types = nodeTypesCache[subjectUri] || [];
    return types.some(t => t === 'vad:TypeProcess' || t === 'http://example.org/vad#TypeProcess');
}

function isSubjectVadExecutor(subjectUri) {
    const types = nodeTypesCache[subjectUri] || [];
    return types.some(t => t === 'vad:TypeExecutor' || t === 'http://example.org/vad#TypeExecutor');
}

function isProcessTreeType(typeUri) {
    return TRIG_TYPES.PROCESS_TREE.some(t => typeUri === t || typeUri.endsWith('#ProcessTree'));
}

function isExecutorTreeType(typeUri) {
    return TRIG_TYPES.EXECUTOR_TREE.some(t => typeUri === t || typeUri.endsWith('#ExecutorTree'));
}

function isVADProcessDiaType(typeUri) {
    return TRIG_TYPES.VAD_PROCESS_DIA.some(t => typeUri === t || typeUri.endsWith('#VADProcessDia'));
}

function isDetailedSubtype(subtypeUri) {
    return PROCESS_SUBTYPES.DETAILED.some(t => subtypeUri === t || subtypeUri.endsWith('#Detailed')) ||
           PROCESS_SUBTYPES.DETAILED_CHILD.some(t => subtypeUri === t || subtypeUri.endsWith('#DetailedChild')) ||
           PROCESS_SUBTYPES.DETAILED_EXTERNAL.some(t => subtypeUri === t || subtypeUri.endsWith('#DetailedExternal'));
}

function isNotDetailedSubtype(subtypeUri) {
    return PROCESS_SUBTYPES.NOT_DETAILED.some(t => subtypeUri === t || subtypeUri.endsWith('#notDetailed')) ||
           PROCESS_SUBTYPES.NOT_DETAILED_CHILD.some(t => subtypeUri === t || subtypeUri.endsWith('#notDetailedChild')) ||
           PROCESS_SUBTYPES.NOT_DETAILED_EXTERNAL.some(t => subtypeUri === t || subtypeUri.endsWith('#notDetailedExternal'));
}

function isNotDefinedTypeSubtype(subtypeUri) {
    return PROCESS_SUBTYPES.NOT_DEFINED_TYPE.some(t => subtypeUri === t || subtypeUri.endsWith('#NotDefinedType'));
}

function getProcessSubtypeName(subtypeUri) {
    if (PROCESS_SUBTYPES.DETAILED_CHILD.some(t => subtypeUri === t || subtypeUri.endsWith('#DetailedChild'))) return 'DetailedChild';
    if (PROCESS_SUBTYPES.DETAILED_EXTERNAL.some(t => subtypeUri === t || subtypeUri.endsWith('#DetailedExternal'))) return 'DetailedExternal';
    if (PROCESS_SUBTYPES.NOT_DETAILED_CHILD.some(t => subtypeUri === t || subtypeUri.endsWith('#notDetailedChild'))) return 'notDetailedChild';
    if (PROCESS_SUBTYPES.NOT_DETAILED_EXTERNAL.some(t => subtypeUri === t || subtypeUri.endsWith('#notDetailedExternal'))) return 'notDetailedExternal';
    if (PROCESS_SUBTYPES.NOT_DEFINED_TYPE.some(t => subtypeUri === t || subtypeUri.endsWith('#NotDefinedType'))) return 'NotDefinedType';
    if (PROCESS_SUBTYPES.DETAILED.some(t => subtypeUri === t || subtypeUri.endsWith('#Detailed'))) return 'Detailed';
    if (PROCESS_SUBTYPES.NOT_DETAILED.some(t => subtypeUri === t || subtypeUri.endsWith('#notDetailed'))) return 'notDetailed';
    return null;
}

function isPredicateHidden(predicateUri, predicateLabel) {
    return activeFilters.includes(predicateUri) || activeFilters.includes(predicateLabel);
}

function generateSparqlPrefixes(prefixes) {
    if (!prefixes || Object.keys(prefixes).length === 0) return '';
    let prefixLines = [];
    for (const [prefix, uri] of Object.entries(prefixes)) {
        prefixLines.push(`PREFIX ${prefix}: <${uri}>`);
    }
    return prefixLines.join('\n') + '\n\n';
}

function isProcessObjectPredicate(predicateUri) {
    return PROCESS_OBJECT_PREDICATES.some(allowed =>
        predicateUri === allowed || predicateUri.endsWith('#hasNext')
    );
}

function normalizeUri(uri) {
    if (!uri) return uri;
    for (const [prefix, namespace] of Object.entries(currentPrefixes)) {
        if (uri.startsWith(prefix + ':')) {
            return namespace + uri.substring(prefix.length + 1);
        }
    }
    return uri;
}

function getTrigContext(trigUri) {
    if (!trigUri) return '';
    if (trigUri === 'vad:ptree' || trigUri === 'http://example.org/vad#ptree' || trigUri.endsWith('#ptree')) return 'ptree';
    if (trigUri === 'vad:rtree' || trigUri === 'http://example.org/vad#rtree' || trigUri.endsWith('#rtree')) return 'rtree';
    return 'vadProcessDia';
}

function getPredicatesForSubjectType(subjectType, trigContext) {
    const typeConfig = TYPE_PREDICATE_MAP[subjectType];
    if (!typeConfig) return [];
    if (trigContext === 'ptree' && typeConfig.ptree) return typeConfig.ptree;
    if (trigContext === 'rtree' && typeConfig.rtree) return typeConfig.rtree;
    if (trigContext === 'vadProcessDia' && typeConfig.vadProcessDia) return typeConfig.vadProcessDia;
    return [];
}

function copyObjectId(id, button) {
    navigator.clipboard.writeText(id).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Скопировано!';
        button.classList.add('copied');
        setTimeout(() => { button.textContent = originalText; button.classList.remove('copied'); }, 2000);
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        const textArea = document.createElement('textarea');
        textArea.value = id;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            button.textContent = 'Скопировано!';
            button.classList.add('copied');
            setTimeout(() => { button.textContent = 'Копировать'; button.classList.remove('copied'); }, 2000);
        } catch (e) { console.error('Fallback copy failed:', e); }
        document.body.removeChild(textArea);
    });
}

// ============================================================================
// ЗАГРУЗКА ТЕХНОЛОГИЧЕСКОГО ПРИЛОЖЕНИЯ (issue #234: перенесено из ver8tree)
// ============================================================================

/**
 * Загружает vad-basic-ontology_tech_Appendix.ttl и парсит технологические объекты
 * Вызывается при старте приложения
 */
async function loadTechAppendix() {
    try {
        const response = await fetch('ontology/vad-basic-ontology_tech_Appendix.ttl');
        if (!response.ok) {
            console.warn('Tech appendix file not found, using default configuration');
            return;
        }

        const ttlContent = await response.text();

        // Парсим TTL файл с использованием Promise для ожидания завершения
        const techQuads = await new Promise((resolve, reject) => {
            const parser = new N3.Parser({ format: 'text/turtle' });
            const quads = [];

            parser.parse(ttlContent, (error, quad, prefixes) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (quad) {
                    quads.push(quad);
                } else {
                    // quad is null, parsing is complete
                    resolve(quads);
                }
            });
        });

        // Извлекаем группы предикатов
        extractPredicateGroups(techQuads);

        techAppendixData.loaded = true;
        console.log('Tech appendix loaded successfully');
        console.log('Predicate groups:', Object.keys(techAppendixData.predicateGroups).length);
        console.log('Auto-generated predicates:', Object.keys(techAppendixData.autoGeneratedPredicates).length);

    } catch (error) {
        console.error('Error loading tech appendix:', error);
    }
}

/**
 * Извлекает группы предикатов из технологических объектов
 */
function extractPredicateGroups(quads) {
    const VAD_NS = 'http://example.org/vad#';

    quads.forEach(quad => {
        const subject = quad.subject.value;
        const predicate = quad.predicate.value;
        const object = quad.object.value;

        // Извлекаем includePredicate
        if (predicate === VAD_NS + 'includePredicate' ||
            predicate.endsWith('#includePredicate')) {
            if (!techAppendixData.predicateGroups[subject]) {
                techAppendixData.predicateGroups[subject] = [];
            }
            techAppendixData.predicateGroups[subject].push(object);
        }

        // Извлекаем autoGeneratedPredicate
        if (predicate === VAD_NS + 'autoGeneratedPredicate' ||
            predicate.endsWith('#autoGeneratedPredicate')) {
            if (!techAppendixData.autoGeneratedPredicates[subject]) {
                techAppendixData.autoGeneratedPredicates[subject] = [];
            }
            techAppendixData.autoGeneratedPredicates[subject].push(object);
        }

        // Извлекаем contextTriGType
        if (predicate === VAD_NS + 'contextTriGType' ||
            predicate.endsWith('#contextTriGType')) {
            techAppendixData.contextTriGTypes[subject] = object;
        }

        // Извлекаем hasNodeStyle (стили узлов в формате DOT)
        if (predicate === VAD_NS + 'hasNodeStyle' ||
            predicate.endsWith('#hasNodeStyle')) {
            if (!techAppendixData.nodeStyles) {
                techAppendixData.nodeStyles = {};
            }
            if (!techAppendixData.nodeStyles[subject]) {
                techAppendixData.nodeStyles[subject] = {};
            }
            techAppendixData.nodeStyles[subject].dot = object;
        }

        // Извлекаем styleLegendLabel (названия для легенды)
        if (predicate === VAD_NS + 'styleLegendLabel' ||
            predicate.endsWith('#styleLegendLabel')) {
            if (!techAppendixData.nodeStyles) {
                techAppendixData.nodeStyles = {};
            }
            if (!techAppendixData.nodeStyles[subject]) {
                techAppendixData.nodeStyles[subject] = {};
            }
            techAppendixData.nodeStyles[subject].label = object;
        }
    });

    // После извлечения стилей, обновляем VADNodeStyles
    updateVADNodeStylesFromTech();
}

/**
 * Обновляет VADNodeStyles на основе стилей из tech appendix
 * Стили из TTL имеют приоритет над встроенными стилями
 */
function updateVADNodeStylesFromTech() {
    if (!techAppendixData.nodeStyles) return;

    const VAD_NS = 'http://example.org/vad#';

    for (const [subjectUri, styleData] of Object.entries(techAppendixData.nodeStyles)) {
        if (!styleData.dot) continue;

        // Извлекаем имя подтипа из URI (например, http://example.org/vad#DetailedChild -> DetailedChild)
        let subtypeName = subjectUri;
        if (subjectUri.startsWith(VAD_NS)) {
            subtypeName = subjectUri.substring(VAD_NS.length);
        }

        // Ищем соответствующий стиль в VADNodeStyles
        const styleMapping = {
            'DetailedChild': 'ProcessStyleDetailedChild',
            'DetailedExternal': 'ProcessStyleDetailedExternal',
            'notDetailedChild': 'ProcessStyleNotDetailedChild',
            'notDetailedExternal': 'ProcessStyleNotDetailedExternal',
            'NotDefinedType': 'ProcessStyleNotDefinedType'
        };

        const styleName = styleMapping[subtypeName];
        if (styleName && typeof VADNodeStyles !== 'undefined' && VADNodeStyles[styleName]) {
            // Обновляем DOT-стиль из TTL
            VADNodeStyles[styleName].dot = styleData.dot;
            // Обновляем label если указан
            if (styleData.label) {
                VADNodeStyles[styleName].label = styleData.label;
            }
            console.log(`Updated style ${styleName} from TTL:`, styleData);
        }
    }
}

/**
 * Получает предикаты для заданного технологического объекта
 * @param {string} techObjectUri - URI технологического объекта
 * @returns {Array} - Массив URI предикатов
 */
function getPredicatesFromTechObject(techObjectUri) {
    // Нормализуем URI
    let normalizedUri = techObjectUri;
    if (techObjectUri.startsWith('vad:')) {
        normalizedUri = 'http://example.org/vad#' + techObjectUri.substring(4);
    }

    return techAppendixData.predicateGroups[normalizedUri] || [];
}

/**
 * Проверяет, является ли предикат автоматически генерируемым
 * Если techObjectUri не указан, проверяет во всех технологических объектах
 * @param {string} predicateUri - URI предиката
 * @param {string} [techObjectUri] - URI технологического объекта (опционально)
 * @returns {boolean}
 */
function isAutoGeneratedPredicate(predicateUri, techObjectUri) {
    if (!predicateUri) return false;

    let normalizedPredUri = predicateUri;
    if (predicateUri.startsWith('vad:')) {
        normalizedPredUri = 'http://example.org/vad#' + predicateUri.substring(4);
    }

    // Если techObjectUri указан, проверяем только в этом объекте
    if (techObjectUri) {
        let normalizedTechUri = techObjectUri;
        if (techObjectUri.startsWith('vad:')) {
            normalizedTechUri = 'http://example.org/vad#' + techObjectUri.substring(4);
        }
        const autoGenerated = techAppendixData.autoGeneratedPredicates[normalizedTechUri] || [];
        return autoGenerated.includes(normalizedPredUri);
    }

    // Если techObjectUri не указан, проверяем во всех технологических объектах
    for (const techUri in techAppendixData.autoGeneratedPredicates) {
        const autoGenerated = techAppendixData.autoGeneratedPredicates[techUri];
        if (autoGenerated && autoGenerated.includes(normalizedPredUri)) {
            return true;
        }
    }
    return false;
}
