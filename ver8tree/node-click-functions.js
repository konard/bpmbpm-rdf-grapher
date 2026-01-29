// ============================================================================
// ФУНКЦИИ ДЛЯ КЛИКОВ ПО УЗЛАМ
// Issue #227: Вынесено из index.html в отдельный файл
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
