// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/234
// 2_triplestore_validation.js - Правила валидации VAD схемы
// Перемещено из vad-validation-rules.js в модульную структуру (issue #234)

/**
 * VAD Schema Formalization and Validation Rules
 *
 * This module implements automatic validation rules for VAD ontology
 * as described in comment8a.md section 4 (Формализация VAD-схем)
 *
 * @file 2_triplestore_validation.js
 * @version 8d
 * @date 2026-01-27
 *
 * Changes in version 8d:
 * - Added hasParentObj validation for all objects (VADProcessDia, ObjectTree, TypeProcess, TypeExecutor)
 * - Updated processMetadataInPtree to include vad:hasParentObj
 * - Updated executorMetadataInRtree to include vad:hasParentObj
 * - Added new rule: vadProcessDiaHasParentObj
 * - Added new rule: objectTreeHasParentObj
 */

/**
 * VAD_VALIDATION_RULES - Правила консистентности для VAD схем
 *
 * Каждое правило проверяет определенный аспект корректности VAD данных:
 * - Наличие обязательных свойств
 * - Правильность связей между объектами
 * - Согласованность иерархии через vad:hasParentObj
 */
const VAD_VALIDATION_RULES = {
    /**
     * Правило 1: Каждый индивид процесса должен иметь isSubprocessTrig
     *
     * Все процессы (vad:TypeProcess) в схемах VADProcessDia должны иметь
     * предикат vad:isSubprocessTrig, указывающий на содержащий их TriG граф.
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    processesHaveIsSubprocessTrig: (quads, prefixes) => {
        const violations = [];

        // Найти все процессы в VADProcessDia графах
        const processesInVAD = new Set();
        const processesWithTrig = new Set();

        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            if (!graphUri) return;

            // Пропускаем ptree и rtree
            if (graphUri.includes('ptree') || graphUri.includes('rtree')) return;

            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Найти все процессы по rdf:type vad:TypeProcess (если они есть в VADProcessDia)
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#TypeProcess' ||
                 quad.object.value.endsWith('#TypeProcess'))) {
                processesInVAD.add(subjectUri);
            }

            // Найти процессы с isSubprocessTrig
            if (predicateUri === 'http://example.org/vad#isSubprocessTrig' ||
                predicateUri.endsWith('#isSubprocessTrig')) {
                processesWithTrig.add(subjectUri);
            }
        });

        // Проверить, что все процессы в VADProcessDia имеют isSubprocessTrig
        processesInVAD.forEach(processUri => {
            if (!processesWithTrig.has(processUri)) {
                violations.push({
                    rule: 'processesHaveIsSubprocessTrig',
                    subject: getPrefixedNameSafe(processUri, prefixes),
                    message: `Процесс должен иметь предикат vad:isSubprocessTrig`,
                    severity: 'error'
                });
            }
        });

        return violations;
    },

    /**
     * Правило 2: Каждый индивид процесса должен иметь hasExecutor
     *
     * Все процессы в схемах VADProcessDia должны иметь предикат vad:hasExecutor,
     * связывающий их с группой исполнителей.
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    processesHaveExecutor: (quads, prefixes) => {
        const violations = [];

        const processesInVAD = new Set();
        const processesWithExecutor = new Set();

        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            if (!graphUri) return;

            // Пропускаем ptree и rtree
            if (graphUri.includes('ptree') || graphUri.includes('rtree')) return;

            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Найти процессы с isSubprocessTrig (это индивиды процессов в VADProcessDia)
            if (predicateUri === 'http://example.org/vad#isSubprocessTrig' ||
                predicateUri.endsWith('#isSubprocessTrig')) {
                processesInVAD.add(subjectUri);
            }

            // Найти процессы с hasExecutor
            if (predicateUri === 'http://example.org/vad#hasExecutor' ||
                predicateUri.endsWith('#hasExecutor')) {
                processesWithExecutor.add(subjectUri);
            }
        });

        // Проверить, что все процессы имеют hasExecutor
        processesInVAD.forEach(processUri => {
            if (!processesWithExecutor.has(processUri)) {
                violations.push({
                    rule: 'processesHaveExecutor',
                    subject: getPrefixedNameSafe(processUri, prefixes),
                    message: `Процесс должен иметь предикат vad:hasExecutor`,
                    severity: 'error'
                });
            }
        });

        return violations;
    },

    /**
     * Правило 3: ExecutorGroup должен быть связан с конкретным TriG
     *
     * Все группы исполнителей (vad:ExecutorGroup) должны быть определены
     * внутри соответствующего именованного графа VADProcessDia.
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    executorGroupsInCorrectGraph: (quads, prefixes) => {
        const violations = [];

        const executorGroups = new Map(); // executorGroupUri -> graphUri

        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            if (!graphUri) return;

            const predicateUri = quad.predicate.value;

            // Найти все ExecutorGroup
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#ExecutorGroup' ||
                 quad.object.value.endsWith('#ExecutorGroup'))) {
                executorGroups.set(quad.subject.value, graphUri);
            }
        });

        // Проверить, что ExecutorGroup не в default graph и не в ptree/rtree
        executorGroups.forEach((graphUri, executorGroupUri) => {
            if (graphUri.includes('ptree') || graphUri.includes('rtree')) {
                violations.push({
                    rule: 'executorGroupsInCorrectGraph',
                    subject: getPrefixedNameSafe(executorGroupUri, prefixes),
                    message: `ExecutorGroup не должен находиться в ptree или rtree, только в VADProcessDia графах`,
                    severity: 'error',
                    graph: getPrefixedNameSafe(graphUri, prefixes)
                });
            }
        });

        return violations;
    },

    /**
     * Правило 4: Метаданные процессов должны быть в ptree
     *
     * Триплеты с предикатами rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasParentObj
     * для процессов (vad:TypeProcess) должны находиться в графе vad:ptree.
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    processMetadataInPtree: (quads, prefixes) => {
        const violations = [];

        const PTREE_PREDICATES = [
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
            'http://www.w3.org/2000/01/rdf-schema#label',
            'http://purl.org/dc/terms/description',
            'http://example.org/vad#hasTrig',
            'http://example.org/vad#hasParentObj'  // New in v1.2
        ];

        const processTypes = new Set();

        // Сначала найти все процессы
        quads.forEach(quad => {
            const predicateUri = quad.predicate.value;
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#TypeProcess' ||
                 quad.object.value.endsWith('#TypeProcess'))) {
                processTypes.add(quad.subject.value);
            }
        });

        // Проверить, что метаданные процессов в ptree
        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Если это процесс и предикат метаданных
            if (processTypes.has(subjectUri) && PTREE_PREDICATES.includes(predicateUri)) {
                // Должен быть в ptree
                if (!graphUri || !(graphUri.includes('ptree'))) {
                    violations.push({
                        rule: 'processMetadataInPtree',
                        subject: getPrefixedNameSafe(subjectUri, prefixes),
                        predicate: getPrefixedNameSafe(predicateUri, prefixes),
                        message: `Метаданные процесса должны находиться в графе vad:ptree`,
                        severity: 'warning',
                        graph: graphUri ? getPrefixedNameSafe(graphUri, prefixes) : 'default graph'
                    });
                }
            }
        });

        return violations;
    },

    /**
     * Правило 5: Метаданные исполнителей должны быть в rtree
     *
     * Триплеты с предикатами rdf:type, rdfs:label, vad:hasParentObj для исполнителей (vad:TypeExecutor)
     * должны находиться в графе vad:rtree.
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    executorMetadataInRtree: (quads, prefixes) => {
        const violations = [];

        const RTREE_PREDICATES = [
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
            'http://www.w3.org/2000/01/rdf-schema#label',
            'http://example.org/vad#hasParentObj'  // New in v1.2
        ];

        const executorTypes = new Set();

        // Найти все исполнители
        quads.forEach(quad => {
            const predicateUri = quad.predicate.value;
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#TypeExecutor' ||
                 quad.object.value.endsWith('#TypeExecutor'))) {
                executorTypes.add(quad.subject.value);
            }
        });

        // Проверить, что метаданные исполнителей в rtree
        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            if (executorTypes.has(subjectUri) && RTREE_PREDICATES.includes(predicateUri)) {
                if (!graphUri || !(graphUri.includes('rtree'))) {
                    violations.push({
                        rule: 'executorMetadataInRtree',
                        subject: getPrefixedNameSafe(subjectUri, prefixes),
                        predicate: getPrefixedNameSafe(predicateUri, prefixes),
                        message: `Метаданные исполнителя должны находиться в графе vad:rtree`,
                        severity: 'warning',
                        graph: graphUri ? getPrefixedNameSafe(graphUri, prefixes) : 'default graph'
                    });
                }
            }
        });

        return violations;
    },

    /**
     * Правило 6: VADProcessDia должен иметь hasParentObj
     *
     * Все схемы процессов (vad:VADProcessDia) должны иметь предикат vad:hasParentObj,
     * указывающий на концепт процесса, который они детализируют.
     * ИСКЛЮЧЕНИЕ: TechnoTree типы (techtree, vtree) не требуют hasParentObj для данного правила
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    vadProcessDiaHasParentObj: (quads, prefixes) => {
        const violations = [];

        const vadProcessDiaGraphs = new Set();
        const graphsWithParentObj = new Set();
        const technoTreeGraphs = new Set();

        quads.forEach(quad => {
            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Найти все VADProcessDia по rdf:type
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#VADProcessDia' ||
                 quad.object.value.endsWith('#VADProcessDia'))) {
                vadProcessDiaGraphs.add(subjectUri);
            }

            // Найти все TechnoTree по rdf:type (issue #262)
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#TechnoTree' ||
                 quad.object.value.endsWith('#TechnoTree'))) {
                technoTreeGraphs.add(subjectUri);
            }

            // Найти графы с hasParentObj
            if (predicateUri === 'http://example.org/vad#hasParentObj' ||
                predicateUri.endsWith('#hasParentObj')) {
                graphsWithParentObj.add(subjectUri);
            }
        });

        // Проверить, что все VADProcessDia имеют hasParentObj
        // ИСКЛЮЧЕНИЕ: TechnoTree типы (issue #262)
        vadProcessDiaGraphs.forEach(graphUri => {
            // Пропускаем TechnoTree графы
            if (technoTreeGraphs.has(graphUri)) {
                return;
            }
            if (!graphsWithParentObj.has(graphUri)) {
                violations.push({
                    rule: 'vadProcessDiaHasParentObj',
                    subject: getPrefixedNameSafe(graphUri, prefixes),
                    message: `VADProcessDia должен иметь предикат vad:hasParentObj, указывающий на концепт процесса`,
                    severity: 'error'
                });
            }
        });

        return violations;
    },

    /**
     * Правило 7: ObjectTree должен иметь hasParentObj = vad:root
     *
     * Деревья объектов (vad:ObjectTree) должны иметь vad:hasParentObj = vad:root.
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    objectTreeHasParentObj: (quads, prefixes) => {
        const violations = [];

        const objectTreeInstances = new Set();
        const objectTreeParents = new Map(); // objectTreeUri -> parentUri

        quads.forEach(quad => {
            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Найти все ObjectTree по rdf:type
            if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                 predicateUri.endsWith('#type')) &&
                (quad.object.value === 'http://example.org/vad#ObjectTree' ||
                 quad.object.value.endsWith('#ObjectTree') ||
                 quad.object.value === 'http://example.org/vad#ProcessTree' ||
                 quad.object.value.endsWith('#ProcessTree') ||
                 quad.object.value === 'http://example.org/vad#ExecutorTree' ||
                 quad.object.value.endsWith('#ExecutorTree'))) {
                objectTreeInstances.add(subjectUri);
            }

            // Найти hasParentObj для ObjectTree
            if (predicateUri === 'http://example.org/vad#hasParentObj' ||
                predicateUri.endsWith('#hasParentObj')) {
                objectTreeParents.set(subjectUri, quad.object.value);
            }
        });

        // Проверить, что все ObjectTree имеют hasParentObj = vad:root
        objectTreeInstances.forEach(treeUri => {
            if (!objectTreeParents.has(treeUri)) {
                violations.push({
                    rule: 'objectTreeHasParentObj',
                    subject: getPrefixedNameSafe(treeUri, prefixes),
                    message: `ObjectTree должен иметь предикат vad:hasParentObj, указывающий на vad:root`,
                    severity: 'error'
                });
            } else {
                const parentUri = objectTreeParents.get(treeUri);
                if (!parentUri.includes('root')) {
                    violations.push({
                        rule: 'objectTreeHasParentObj',
                        subject: getPrefixedNameSafe(treeUri, prefixes),
                        message: `ObjectTree должен иметь vad:hasParentObj = vad:root (текущее значение: ${getPrefixedNameSafe(parentUri, prefixes)})`,
                        severity: 'warning'
                    });
                }
            }
        });

        return violations;
    },

    /**
     * Правило 8: Концепты процессов должны иметь hasParentObj
     *
     * Все концепты процессов (vad:TypeProcess) в ptree должны иметь vad:hasParentObj,
     * указывающий на родительский объект (другой процесс или vad:ptree).
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    processConceptsHaveParentObj: (quads, prefixes) => {
        const violations = [];

        const processConceptsInPtree = new Set();
        const objectsWithParentObj = new Set();

        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Найти концепты процессов в ptree (по rdf:type vad:TypeProcess в графе ptree)
            if (graphUri && graphUri.includes('ptree')) {
                if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                     predicateUri.endsWith('#type')) &&
                    (quad.object.value === 'http://example.org/vad#TypeProcess' ||
                     quad.object.value.endsWith('#TypeProcess'))) {
                    processConceptsInPtree.add(subjectUri);
                }
            }

            // Найти все объекты с hasParentObj
            if (predicateUri === 'http://example.org/vad#hasParentObj' ||
                predicateUri.endsWith('#hasParentObj')) {
                objectsWithParentObj.add(subjectUri);
            }
        });

        // Проверить, что все концепты процессов имеют hasParentObj
        processConceptsInPtree.forEach(processUri => {
            if (!objectsWithParentObj.has(processUri)) {
                violations.push({
                    rule: 'processConceptsHaveParentObj',
                    subject: getPrefixedNameSafe(processUri, prefixes),
                    message: `Концепт процесса должен иметь предикат vad:hasParentObj в vad:ptree`,
                    severity: 'error'
                });
            }
        });

        return violations;
    },

    /**
     * Правило 9: Концепты исполнителей должны иметь hasParentObj
     *
     * Все концепты исполнителей (vad:TypeExecutor) в rtree должны иметь vad:hasParentObj,
     * указывающий на родительский объект (другой исполнитель или vad:rtree).
     *
     * @param {Array} quads - Массив RDF квадов
     * @param {Object} prefixes - Объект префиксов
     * @returns {Array<Object>} - Массив нарушений правила
     */
    executorConceptsHaveParentObj: (quads, prefixes) => {
        const violations = [];

        const executorConceptsInRtree = new Set();
        const objectsWithParentObj = new Set();

        quads.forEach(quad => {
            const graphUri = quad.graph ? quad.graph.value : null;
            const predicateUri = quad.predicate.value;
            const subjectUri = quad.subject.value;

            // Найти концепты исполнителей в rtree (по rdf:type vad:TypeExecutor в графе rtree)
            if (graphUri && graphUri.includes('rtree')) {
                if ((predicateUri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
                     predicateUri.endsWith('#type')) &&
                    (quad.object.value === 'http://example.org/vad#TypeExecutor' ||
                     quad.object.value.endsWith('#TypeExecutor'))) {
                    executorConceptsInRtree.add(subjectUri);
                }
            }

            // Найти все объекты с hasParentObj
            if (predicateUri === 'http://example.org/vad#hasParentObj' ||
                predicateUri.endsWith('#hasParentObj')) {
                objectsWithParentObj.add(subjectUri);
            }
        });

        // Проверить, что все концепты исполнителей имеют hasParentObj
        executorConceptsInRtree.forEach(executorUri => {
            if (!objectsWithParentObj.has(executorUri)) {
                violations.push({
                    rule: 'executorConceptsHaveParentObj',
                    subject: getPrefixedNameSafe(executorUri, prefixes),
                    message: `Концепт исполнителя должен иметь предикат vad:hasParentObj в vad:rtree`,
                    severity: 'error'
                });
            }
        });

        return violations;
    }
};

/**
 * Выполняет все правила валидации VAD схемы
 *
 * @param {Array} quads - Массив RDF квадов
 * @param {Object} prefixes - Объект префиксов
 * @returns {Object} - Результат валидации:
 *   - valid {boolean} - true если нет ошибок
 *   - violations {Array} - Массив всех нарушений
 *   - errors {Array} - Массив ошибок (severity: 'error')
 *   - warnings {Array} - Массив предупреждений (severity: 'warning')
 */
function validateVADSchema(quads, prefixes) {
    const allViolations = [];

    // Выполнить все правила
    for (const [ruleName, ruleFunction] of Object.entries(VAD_VALIDATION_RULES)) {
        const violations = ruleFunction(quads, prefixes);
        allViolations.push(...violations);
    }

    // Разделить на ошибки и предупреждения
    const errors = allViolations.filter(v => v.severity === 'error');
    const warnings = allViolations.filter(v => v.severity === 'warning');

    return {
        valid: errors.length === 0,
        violations: allViolations,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Форматирует результаты валидации схемы для отображения
 *
 * @param {Object} validationResult - Результат validateVADSchema
 * @returns {string} - Отформатированное сообщение
 */
function formatVADSchemaValidation(validationResult) {
    let message = 'ПРОВЕРКА ПРАВИЛ VAD СХЕМЫ\n';
    message += '═══════════════════════════════════════\n\n';

    if (validationResult.valid && validationResult.warnings.length === 0) {
        message += '✅ Все правила выполнены\n';
        message += 'Схема полностью соответствует требованиям VAD онтологии\n';
    } else {
        if (validationResult.errors.length > 0) {
            message += `❌ ОШИБКИ (${validationResult.errors.length}):\n\n`;
            validationResult.errors.forEach((error, index) => {
                message += `${index + 1}. ${error.subject}\n`;
                message += `   Правило: ${error.rule}\n`;
                message += `   ${error.message}\n`;
                if (error.graph) {
                    message += `   Граф: ${error.graph}\n`;
                }
                message += `\n`;
            });
        }

        if (validationResult.warnings.length > 0) {
            message += `⚠️  ПРЕДУПРЕЖДЕНИЯ (${validationResult.warnings.length}):\n\n`;
            validationResult.warnings.forEach((warning, index) => {
                message += `${index + 1}. ${warning.subject}\n`;
                message += `   Правило: ${warning.rule}\n`;
                message += `   ${warning.message}\n`;
                if (warning.graph) {
                    message += `   Граф: ${warning.graph}\n`;
                }
                message += `\n`;
            });
        }
    }

    message += '═══════════════════════════════════════\n';
    return message;
}

/**
 * Безопасное получение prefixed name (не зависит от глобальной функции)
 */
function getPrefixedNameSafe(uri, prefixes) {
    if (typeof uri !== 'string') return String(uri);
    for (const [prefix, namespace] of Object.entries(prefixes)) {
        if (uri.startsWith(namespace)) {
            const localName = uri.substring(namespace.length);
            return prefix + ':' + localName;
        }
    }
    // Вернуть локальное имя
    const hashIndex = uri.lastIndexOf('#');
    const slashIndex = uri.lastIndexOf('/');
    const splitIndex = Math.max(hashIndex, slashIndex);
    if (splitIndex !== -1 && splitIndex < uri.length - 1) {
        return uri.substring(splitIndex + 1);
    }
    return uri;
}
