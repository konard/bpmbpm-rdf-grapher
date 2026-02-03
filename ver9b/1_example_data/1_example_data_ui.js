// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/260
// 1_example_data_ui.js - UI функции загрузки примеров
//
// issue #260: Убраны встроенные данные (fallback). Примеры загружаются только из файлов.
// При ошибке загрузки показывается диалог с предложением указать расположение файла.

/**
 * Универсальная функция загрузки примера из файла.
 * issue #260: Встроенные данные (fallback) не используются.
 * При ошибке загрузки показывается диалог с предложением выбрать файл.
 *
 * @param {string} filename - Имя файла для загрузки
 * @param {string} exampleName - Человекочитаемое имя примера
 * @param {string} inputFormat - Формат ввода (turtle, n-triples, n-quads, trig)
 * @param {string} visualizationMode - Режим визуализации (notation, vad, vad-trig)
 */
async function loadExampleFromFile(filename, exampleName, inputFormat, visualizationMode) {
    const statusEl = document.getElementById('example-status');

    statusEl.textContent = `Загрузка примера ${exampleName}...`;
    statusEl.style.display = 'block';
    statusEl.style.backgroundColor = '#fff3cd';
    statusEl.style.borderColor = '#ffc107';
    statusEl.style.color = '#856404';

    // issue #236: Вычисляем полный путь к файлу для информативных сообщений об ошибках
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

        statusEl.textContent = `Пример ${exampleName} успешно загружен из файла ${fullPath}`;
        statusEl.style.backgroundColor = '#d4edda';
        statusEl.style.borderColor = '#c3e6cb';
        statusEl.style.color = '#155724';
    } catch (error) {
        console.warn(`Не удалось загрузить файл ${fullPath}:`, error.message);

        // issue #260: Показываем диалог с предложением выбрать файл (без fallback на встроенные данные)
        statusEl.textContent = `Ошибка загрузки ${fullPath}: ${error.message}`;
        statusEl.style.backgroundColor = '#f8d7da';
        statusEl.style.borderColor = '#f5c6cb';
        statusEl.style.color = '#721c24';

        // Показываем диалог выбора файла
        if (typeof showFileNotFoundDialog === 'function') {
            showFileNotFoundDialog({
                title: `Ошибка загрузки примера ${exampleName}`,
                message: `Файл не найден по пути: ${fullPath}`,
                fileType: '.ttl,.trig',
                onFileSelected: async (file) => {
                    try {
                        const content = await file.text();
                        document.getElementById('rdf-input').value = content;
                        document.getElementById('input-format').value = inputFormat;
                        document.getElementById('visualization-mode').value = visualizationMode;
                        updateModeDescription();

                        statusEl.textContent = `Пример загружен из файла: ${file.name}`;
                        statusEl.style.backgroundColor = '#d4edda';
                        statusEl.style.borderColor = '#c3e6cb';
                        statusEl.style.color = '#155724';

                        if (typeof showSuccessNotification === 'function') {
                            showSuccessNotification(`Пример ${exampleName} загружен из файла: ${file.name}`);
                        }
                    } catch (parseError) {
                        statusEl.textContent = `Ошибка парсинга файла: ${parseError.message}`;
                        statusEl.style.backgroundColor = '#f8d7da';
                        statusEl.style.borderColor = '#f5c6cb';
                        statusEl.style.color = '#721c24';

                        if (typeof showErrorNotification === 'function') {
                            showErrorNotification(`Ошибка парсинга: ${parseError.message}`);
                        }
                    }
                }
            });
        }
    }
}

/**
 * Загружает пример TriG VADv5 с иерархией объектов через hasParentObj
 * issue #260: Загрузка только из файла, без встроенных данных
 *
 * Содержит:
 * - vad:root: корень дерева (TechTree)
 * - vad:ptree: дерево процессов (ObjectTree)
 * - vad:rtree: дерево исполнителей (ObjectTree)
 * - t_pGA, t_p1: схемы процессов (VADProcessDia)
 */
function loadExampleTrigVADv5() {
    loadExampleFromFile('Trig_VADv5.ttl', 'Trig_VADv5', 'trig', 'vad-trig');
}

/**
 * Issue #219 Fix #5: Загружает пример TriG VADv6 с добавленным vad:pDel для тестирования удаления
 * issue #260: Загрузка только из файла, без встроенных данных
 *
 * Содержит все то же, что и Trig_VADv5, плюс:
 * - vad:pDel: концепт процесса для тестирования удаления
 */
function loadExampleTrigVADv6() {
    loadExampleFromFile('Trig_VADv6.ttl', 'Trig_VADv6', 'trig', 'vad-trig');
}

/**
 * Для обратной совместимости: вызывает загрузку примера Trig_VADv5
 */
function loadExample() {
    loadExampleTrigVADv5();
}
