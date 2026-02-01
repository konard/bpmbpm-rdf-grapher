// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/236
// panel_config.js - Управление состоянием сворачивания/развертывания панелей
// Загружает конфигурацию из config.json и предоставляет функции для всех панелей приложения

/**
 * Конфигурация окон, загруженная из config.json
 */
let windowConfig = null;

/**
 * Переключает состояние свернутости панели
 * @param {string} panelName - Имя панели (например, 'legend', 'prefixes', 'triplestore', 'publisher')
 */
function togglePanel(panelName) {
    const body = document.getElementById(panelName + '-body');
    const toggle = document.getElementById(panelName + '-toggle');
    if (!body || !toggle) return;

    const isCollapsed = body.classList.toggle('collapsed');
    if (isCollapsed) {
        toggle.classList.add('collapsed');
    } else {
        toggle.classList.remove('collapsed');
    }
}

/**
 * Применяет начальное состояние свернутости для панели из config.json
 * @param {string} panelName - Имя панели (например, 'legend', 'prefixes', 'triplestore')
 * @param {string} configKey - Ключ в config.json (например, '6_legend', '7_info', '2_triplestore')
 */
function applyPanelCollapsedState(panelName, configKey) {
    if (!windowConfig || !windowConfig.windows || !windowConfig.windows[configKey]) return;

    const collapsed = windowConfig.windows[configKey].collapsed;
    if (collapsed) {
        const body = document.getElementById(panelName + '-body');
        const toggle = document.getElementById(panelName + '-toggle');
        if (body) body.classList.add('collapsed');
        if (toggle) toggle.classList.add('collapsed');
    }
}

/**
 * Загружает config.json с конфигурацией состояния окон
 */
async function loadWindowConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            console.warn('config.json not found, using default window states');
            return;
        }
        windowConfig = await response.json();
    } catch (error) {
        console.warn('Error loading config.json:', error.message);
    }
}
