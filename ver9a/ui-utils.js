// issue #232: Модуль утилит UI
/**
 * ==============================================================================
 * UI UTILITIES MODULE
 * ==============================================================================
 *
 * Contains utility functions for:
 * - Style management (getNodeStyle, getEdgeStyle, buildNodeTypesCache)
 * - Zoom/scaling operations (applyZoom, zoomIn, zoomOut, zoomReset, zoomFit)
 * - Properties panel management (showNodeProperties, closePropertiesPanel, etc.)
 * - Node click handlers (addNodeClickHandlers, handleNodeClick, handleNodeDoubleClick)
 *
 * Note: These functions depend on global variables from index.html.
 * They are extracted here for code organization but run in global scope.
 *
 * @file ui-utils.js
 * @version 1.0
 * @date 2026-01-29
 */

// ============================================================================
// ФУНКЦИИ РАБОТЫ СО СТИЛЯМИ
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

// ============================================================================
// ФУНКЦИИ МАСШТАБИРОВАНИЯ
// ============================================================================

function applyZoom() {
    // Применяем масштаб к обоим контейнерам (обычный и VAD TriG)
    const zoomContent = document.getElementById('zoom-content');
    const zoomLevel = document.getElementById('zoom-level');
    const vadTrigZoomContent = document.getElementById('vad-trig-zoom-content');
    const vadTrigZoomLevel = document.getElementById('vad-trig-zoom-level');

    if (zoomContent) zoomContent.style.transform = `scale(${currentScale})`;
    if (zoomLevel) zoomLevel.textContent = Math.round(currentScale * 100) + '%';
    if (vadTrigZoomContent) vadTrigZoomContent.style.transform = `scale(${currentScale})`;
    if (vadTrigZoomLevel) vadTrigZoomLevel.textContent = Math.round(currentScale * 100) + '%';
}

function zoomIn() {
    if (currentScale < 3.0) { currentScale += 0.1; applyZoom(); }
}

function zoomOut() {
    if (currentScale > 0.1) { currentScale -= 0.1; applyZoom(); }
}

function zoomReset() {
    currentScale = 1.0;
    applyZoom();
}

function zoomFit() {
    // Определяем, какой контейнер сейчас активен
    const vadTrigContainer = document.getElementById('vad-trig-container');
    const isVadTrigMode = vadTrigContainer && vadTrigContainer.style.display !== 'none';

    let zoomContainer, output;
    if (isVadTrigMode) {
        zoomContainer = document.getElementById('vad-trig-zoom-container');
        output = document.getElementById('vad-trig-output');
    } else {
        zoomContainer = document.getElementById('zoom-container');
        output = document.getElementById('output');
    }

    const svg = output ? output.querySelector('svg') : null;
    if (!zoomContainer || !svg) return;

    const containerWidth = zoomContainer.clientWidth - 20;
    const containerHeight = zoomContainer.clientHeight - 20;

    let svgWidth = parseFloat(svg.getAttribute('width')) || svg.getBoundingClientRect().width;
    let svgHeight = parseFloat(svg.getAttribute('height')) || svg.getBoundingClientRect().height;

    const widthStr = svg.getAttribute('width') || '';
    const heightStr = svg.getAttribute('height') || '';
    if (widthStr.includes('pt')) svgWidth = parseFloat(widthStr) * 1.33;
    if (heightStr.includes('pt')) svgHeight = parseFloat(heightStr) * 1.33;

    const scaleX = containerWidth / svgWidth;
    const scaleY = containerHeight / svgHeight;
    currentScale = Math.min(scaleX, scaleY, 1.0);
    applyZoom();
}

// ============================================================================
// ФУНКЦИИ ПАНЕЛИ СВОЙСТВ УЗЛА
// ============================================================================

function closePropertiesPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.remove();
        openPropertiesPanels = openPropertiesPanels.filter(p => p.id !== panelId);
    }
    if (selectedNodeElement) {
        selectedNodeElement.classList.remove('selected');
        selectedNodeElement = null;
    }
}

function closeAllPropertiesPanels() {
    const container = document.getElementById('properties-panels-container');
    if (container) container.innerHTML = '';
    openPropertiesPanels = [];
    if (selectedNodeElement) {
        selectedNodeElement.classList.remove('selected');
        selectedNodeElement = null;
    }
}

function getNodeProperties(nodeUri) {
    const properties = [];
    currentQuads.forEach(quad => {
        if (quad.subject.value === nodeUri) {
            const predicateLabel = getPrefixedName(quad.predicate.value, currentPrefixes);
            const isLiteral = quad.object.termType === 'Literal';
            const objectLabel = isLiteral
                ? `"${quad.object.value}"`
                : getPrefixedName(quad.object.value, currentPrefixes);
            const graphUri = quad.graph ? quad.graph.value : null;

            properties.push({
                predicate: quad.predicate.value,
                predicateLabel: predicateLabel,
                object: quad.object.value,
                objectLabel: objectLabel,
                isLiteral: isLiteral,
                graphUri: graphUri
            });
        }
    });
    return properties;
}

function showNodeProperties(nodeUri, nodeLabel) {
    const container = document.getElementById('properties-panels-container');
    if (!container) return;

    const existingPanel = openPropertiesPanels.find(p => p.uri === nodeUri);
    if (existingPanel) {
        const panel = document.getElementById(existingPanel.id);
        if (panel) bringPanelToFront(panel);
        return;
    }

    propertiesPanelCounter++;
    const panelId = 'properties-panel-' + propertiesPanelCounter;

    const offsetMultiplier = openPropertiesPanels.length % 5;
    const rightOffset = 20 + (offsetMultiplier * 30);
    const topOffset = 100 + (offsetMultiplier * 30);

    const properties = getNodeProperties(nodeUri);

    // Разделяем свойства на индивидуальные (из текущего TriG) и концептные (из ptree)
    const trigProperties = [];
    const conceptProperties = [];
    const seenTrigProps = new Set();
    const seenConceptProps = new Set();

    properties.forEach(prop => {
        // Создаём уникальный ключ для дедупликации
        const propKey = `${prop.predicateLabel}|${prop.objectLabel}`;

        if (prop.graphUri === PTREE_GRAPH_URI) {
            // Дедупликация свойств концепта
            if (!seenConceptProps.has(propKey)) {
                seenConceptProps.add(propKey);
                conceptProperties.push(prop);
            }
        } else if (selectedTrigUri && prop.graphUri === selectedTrigUri) {
            // Дедупликация свойств индивида
            if (!seenTrigProps.has(propKey)) {
                seenTrigProps.add(propKey);
                trigProperties.push(prop);
            }
        } else {
            // Если нет выбранного TriG, показываем все не-ptree свойства
            if (!selectedTrigUri) {
                if (!seenTrigProps.has(propKey)) {
                    seenTrigProps.add(propKey);
                    trigProperties.push(prop);
                }
            }
        }
    });

    let propertiesHtml = '';

    // Блок 1: Свойства индивида из текущего TriG
    if (trigProperties.length === 0 && conceptProperties.length === 0) {
        propertiesHtml = '<div class="properties-empty">У этого узла нет свойств</div>';
    } else {
        trigProperties.forEach(prop => {
            propertiesHtml += '<div class="property-item">';
            propertiesHtml += `<div class="property-predicate">${prop.predicateLabel}</div>`;
            propertiesHtml += `<div class="property-value ${prop.isLiteral ? 'literal' : 'uri'}">${prop.objectLabel}</div>`;
            propertiesHtml += '</div>';
        });
    }

    // Добавляем virtualRDFdata секцию (вычисляемые свойства)
    let virtualData = null;
    if (selectedTrigUri && virtualRDFdata[selectedTrigUri]) {
        virtualData = virtualRDFdata[selectedTrigUri][nodeUri];
    }

    if (virtualData && virtualData.processSubtype) {
        // Добавляем разделитель
        propertiesHtml += '<div class="trig-property-separator" style="margin-top: 15px;">';
        propertiesHtml += '<div class="separator-line"></div>';
        propertiesHtml += '<div class="separator-text">virtualRDFdata</div>';
        propertiesHtml += '<div class="separator-line"></div>';
        propertiesHtml += '</div>';

        propertiesHtml += '<div class="property-item" style="margin-top: 10px;">';
        propertiesHtml += '<div class="property-predicate">vad:processSubtype</div>';
        propertiesHtml += `<div class="property-value uri" style="color: #6a1b9a; font-style: italic;">vad:${virtualData.processSubtype}</div>`;
        propertiesHtml += '</div>';
    }

    // Блок 3: Свойства концепта из ptree (отделённые линией)
    if (conceptProperties.length > 0) {
        // Добавляем разделитель
        propertiesHtml += '<div class="trig-property-separator" style="margin-top: 15px;">';
        propertiesHtml += '<div class="separator-line"></div>';
        propertiesHtml += '<div class="separator-text">Свойства концепта (ptree)</div>';
        propertiesHtml += '<div class="separator-line"></div>';
        propertiesHtml += '</div>';

        conceptProperties.forEach(prop => {
            propertiesHtml += '<div class="property-item concept-property" style="margin-top: 10px;">';
            propertiesHtml += `<div class="property-predicate">${prop.predicateLabel}</div>`;
            propertiesHtml += `<div class="property-value ${prop.isLiteral ? 'literal' : 'uri'}">${prop.objectLabel}</div>`;
            propertiesHtml += '</div>';
        });
    }

    const nodeTypes = nodeTypesCache[nodeUri] || [];
    if (nodeTypes.length > 0) {
        const prefixedTypes = nodeTypes.filter(t => t.includes(':') && !t.startsWith('http'));
        if (prefixedTypes.length > 0) {
            propertiesHtml += '<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">';
            propertiesHtml += '<div style="font-size: 12px; color: #666; margin-bottom: 5px;">Тип узла:</div>';
            prefixedTypes.forEach(type => {
                propertiesHtml += `<span class="properties-type-badge">${type}</span> `;
            });
            propertiesHtml += '</div>';
        }
    }

    const escapedNodeLabel = nodeLabel.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const panelHtml = `
        <div class="properties-panel visible" id="${panelId}" style="right: ${rightOffset}px; top: ${topOffset}px;">
            <div class="properties-header" onmousedown="startDragPanel(event, '${panelId}')">
                <div class="properties-header-content">
                    <div class="properties-header-title">Свойства объекта</div>
                    <div class="properties-header-row">
                        <h3>${nodeLabel}</h3>
                        <button class="properties-copy-btn" onclick="event.stopPropagation(); copyObjectId('${escapedNodeLabel}', this)">Копировать</button>
                    </div>
                </div>
                <button class="properties-close-btn" onclick="closePropertiesPanel('${panelId}')">&times;</button>
            </div>
            <div class="properties-content">
                ${propertiesHtml}
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', panelHtml);
    openPropertiesPanels.push({ id: panelId, uri: nodeUri, label: nodeLabel });

    const newPanel = document.getElementById(panelId);
    if (newPanel) bringPanelToFront(newPanel);
}

function bringPanelToFront(panel) {
    let maxZIndex = 1000;
    openPropertiesPanels.forEach(p => {
        const el = document.getElementById(p.id);
        if (el) {
            const z = parseInt(el.style.zIndex) || 1000;
            if (z > maxZIndex) maxZIndex = z;
        }
    });
    panel.style.zIndex = maxZIndex + 1;
}

function startDragPanel(event, panelId) {
    if (event.target.classList.contains('properties-close-btn')) return;
    const panel = document.getElementById(panelId);
    if (!panel) return;

    draggedPanel = panel;
    const rect = panel.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;

    bringPanelToFront(panel);
    document.addEventListener('mousemove', dragPanel);
    document.addEventListener('mouseup', stopDragPanel);
    event.preventDefault();
}

function dragPanel(event) {
    if (!draggedPanel) return;
    const newLeft = event.clientX - dragOffsetX;
    const newTop = event.clientY - dragOffsetY;
    draggedPanel.style.left = newLeft + 'px';
    draggedPanel.style.top = newTop + 'px';
    draggedPanel.style.right = 'auto';
}

function stopDragPanel() {
    draggedPanel = null;
    document.removeEventListener('mousemove', dragPanel);
    document.removeEventListener('mouseup', stopDragPanel);
}

// ============================================================================
// ФУНКЦИИ ДЛЯ КЛИКОВ ПО УЗЛАМ
// ============================================================================

function addNodeClickHandlers() {
    // Add click handlers to both regular output and VAD TriG output
    const regularSvg = document.querySelector('#output svg');
    const vadTrigSvg = document.querySelector('#vad-trig-output svg');

    const svgElements = [regularSvg, vadTrigSvg].filter(svg => svg !== null);

    svgElements.forEach(svg => {
        const nodes = svg.querySelectorAll('.node');
        nodes.forEach(node => {
            node.addEventListener('click', handleNodeClick);
            node.addEventListener('dblclick', handleNodeDoubleClick);
        });
    });
}

function handleNodeClick(event) {
    const nodeElement = event.currentTarget;
    const titleElement = nodeElement.querySelector('title');
    if (!titleElement) return;

    const dotId = titleElement.textContent;

    let nodeUri = null;
    let nodeLabel = null;

    for (const [label, info] of Object.entries(nodeLabelToUri)) {
        if (info.dotId === dotId) {
            nodeUri = info.uri;
            nodeLabel = label;
            break;
        }
    }

    if (!nodeUri) return;

    // НЕ снимаем выделение с элемента TriG-дерева при клике на узел диаграммы.
    // Выделенный элемент TriG дерева всегда должен отражать, чья схема отображается на диаграмме.
    // Снимаем только выделение с процессов в списке "Состав объектов" и подсветку на диаграмме.
    const processItems = document.querySelectorAll('.process-item.process-selected');
    processItems.forEach(item => {
        item.classList.remove('process-selected');
    });
    const highlightedProcesses = document.querySelectorAll('.node.process-highlighted');
    highlightedProcesses.forEach(node => {
        node.classList.remove('process-highlighted');
    });

    if (selectedNodeElement) {
        selectedNodeElement.classList.remove('selected');
    }
    nodeElement.classList.add('selected');
    selectedNodeElement = nodeElement;

    showNodeProperties(nodeUri, nodeLabel);
}

/**
 * Обработчик двойного клика по узлу диаграммы
 * Для процессов с подтипом "Детализированный" (vad:Detailed) открывает соответствующую схему TriG
 * @param {Event} event - Событие двойного клика
 */
function handleNodeDoubleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const nodeElement = event.currentTarget;
    const titleElement = nodeElement.querySelector('title');
    if (!titleElement) return;

    const dotId = titleElement.textContent;

    let nodeUri = null;
    let nodeLabel = null;

    for (const [label, info] of Object.entries(nodeLabelToUri)) {
        if (info.dotId === dotId) {
            nodeUri = info.uri;
            nodeLabel = label;
            break;
        }
    }

    if (!nodeUri) return;

    // Ищем свойство vad:hasTrig для данного узла
    const hasTrigPredicate = 'http://example.org/vad#hasTrig';
    let targetTrigUri = null;

    // Сначала проверяем в vad:ptree (там хранятся метаданные процессов, включая hasTrig)
    if (trigHierarchy && trigHierarchy[PTREE_GRAPH_URI]) {
        const ptreeQuads = trigHierarchy[PTREE_GRAPH_URI].quads;
        for (const quad of ptreeQuads) {
            if (quad.subject.value === nodeUri && quad.predicate.value === hasTrigPredicate) {
                targetTrigUri = quad.object.value;
                break;
            }
        }
    }

    // Если не найдено в ptree, проверяем в текущем графе или во всех графах
    if (!targetTrigUri) {
        const quadsToCheck = selectedTrigUri && trigHierarchy[selectedTrigUri]
            ? trigHierarchy[selectedTrigUri].quads
            : currentQuads;

        for (const quad of quadsToCheck) {
            if (quad.subject.value === nodeUri && quad.predicate.value === hasTrigPredicate) {
                targetTrigUri = quad.object.value;
                break;
            }
        }
    }

    // Если найден связанный TriG, открываем его
    if (targetTrigUri && trigHierarchy[targetTrigUri]) {
        selectTriG(targetTrigUri);
    }
}

/**
 * Снимает выделение со всех элементов TriG-дерева
 */
function clearTriGTreeSelection() {
    // Снимаем выделение с TriG-элементов дерева
    const treeItems = document.querySelectorAll('.trig-tree-item');
    treeItems.forEach(item => {
        item.classList.remove('selected', 'active');
    });

    // Снимаем выделение с процессов в дереве
    const processItems = document.querySelectorAll('.process-item.process-selected');
    processItems.forEach(item => {
        item.classList.remove('process-selected');
    });

    // Снимаем подсветку процесса на диаграмме
    const highlightedProcesses = document.querySelectorAll('.node.process-highlighted');
    highlightedProcesses.forEach(node => {
        node.classList.remove('process-highlighted');
    });
}
