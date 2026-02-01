// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// 1_example_data_ui.js - UI функции загрузки примеров

/**
 * Универсальная функция загрузки примера из файла.
 * Пытается загрузить файл через fetch. При ошибке CORS (локальный файл)
 * показывает информационное сообщение и использует встроенные данные как fallback.
 * @param {string} filename - Имя файла для загрузки
 * @param {string} exampleName - Человекочитаемое имя примера
 * @param {string} inputFormat - Формат ввода (turtle, n-triples, n-quads, trig)
 * @param {string} visualizationMode - Режим визуализации (notation, vad, vad-trig)
 * @param {string} fallbackDataKey - Ключ для доступа к встроенным данным EXAMPLE_DATA
 */
async function loadExampleFromFile(filename, exampleName, inputFormat, visualizationMode, fallbackDataKey) {
    const statusEl = document.getElementById('example-status');

    statusEl.textContent = `Загрузка примера ${exampleName}...`;
    statusEl.style.display = 'block';
    statusEl.style.backgroundColor = '#fff3cd';
    statusEl.style.borderColor = '#ffc107';
    statusEl.style.color = '#856404';

    // issue #236: Определяем полный путь к файлу для отображения в сообщениях об ошибках
    const fullPath = new URL(filename, window.location.href).href;

    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.text();

        document.getElementById('rdf-input').value = data;
        document.getElementById('input-format').value = inputFormat;
        document.getElementById('visualization-mode').value = visualizationMode;
        updateModeDescription();

        statusEl.textContent = `Пример ${exampleName} успешно загружен из файла ${filename}`;
        statusEl.style.backgroundColor = '#d4edda';
        statusEl.style.borderColor = '#c3e6cb';
        statusEl.style.color = '#155724';
    } catch (error) {
        console.warn(`Не удалось загрузить файл ${filename}:`, error.message);

        // Проверяем, это ошибка CORS (локальный файл) или сетевая ошибка
        const isCorsError = error.message.includes('Failed to fetch') ||
                            error.message.includes('NetworkError') ||
                            error.message.includes('CORS');

        if (isCorsError) {
            // Для локальных файлов показываем информационное сообщение и используем встроенные данные
            // issue #236: Указываем полный путь к файлу
            statusEl.textContent = `Файл ${filename} недоступен (CORS). Путь: ${fullPath}. Используются встроенные данные.`;
            statusEl.style.backgroundColor = '#fff3cd';
            statusEl.style.borderColor = '#ffc107';
            statusEl.style.color = '#856404';
        } else {
            // Для серверных ошибок показываем ошибку с путём, но всё равно используем fallback
            // issue #236: Указываем полный путь к файлу
            statusEl.textContent = `Ошибка загрузки ${filename}: ${error.message}. Путь: ${fullPath}. Используются встроенные данные.`;
            statusEl.style.backgroundColor = '#fff3cd';
            statusEl.style.borderColor = '#ffc107';
            statusEl.style.color = '#856404';
        }

        // Используем встроенные данные как fallback
        try {
            document.getElementById('rdf-input').value = EXAMPLE_DATA[fallbackDataKey];
            document.getElementById('input-format').value = inputFormat;
            document.getElementById('visualization-mode').value = visualizationMode;
            updateModeDescription();
        } catch (fallbackError) {
            console.error(`Ошибка при использовании встроенных данных:`, fallbackError);
            statusEl.textContent = `Ошибка загрузки примера ${exampleName}: ${fallbackError.message}`;
            statusEl.style.backgroundColor = '#f8d7da';
            statusEl.style.borderColor = '#f5c6cb';
            statusEl.style.color = '#721c24';
        }
    }
}

/**
 * Загружает пример TriG VADv5 с иерархией объектов через hasParentObj
 * Содержит:
 * - vad:root: корень дерева (TechTree)
 * - vad:ptree: дерево процессов (ObjectTree)
 * - vad:rtree: дерево исполнителей (ObjectTree)
 * - t_pGA, t_p1: схемы процессов (VADProcessDia)
 */
function loadExampleTrigVADv5() {
    loadExampleFromFile('Trig_VADv5.ttl', 'Trig_VADv5', 'trig', 'vad-trig', 'trig-vad-v5');
}

/**
 * Issue #219 Fix #5: Загружает пример TriG VADv6 с добавленным vad:pDel для тестирования удаления
 * Содержит все то же, что и Trig_VADv5, плюс:
 * - vad:pDel: концепт процесса для тестирования удаления
 */
function loadExampleTrigVADv6() {
    loadExampleFromFile('Trig_VADv6.ttl', 'Trig_VADv6', 'trig', 'vad-trig', 'trig-vad-v6');
}

/**
 * Для обратной совместимости: вызывает загрузку примера Trig_VADv5
 */
function loadExample() {
    loadExampleTrigVADv5();
}
