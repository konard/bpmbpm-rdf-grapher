// ============================================================================
// ФУНКЦИИ ПАНЕЛИ СВОЙСТВ УЗЛА
// Issue #227: Вынесено из index.html в отдельный файл
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
