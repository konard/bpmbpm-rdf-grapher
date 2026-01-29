// ============================================================================
// ФУНКЦИИ МАСШТАБИРОВАНИЯ
// Issue #227: Вынесено из index.html в отдельный файл
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
