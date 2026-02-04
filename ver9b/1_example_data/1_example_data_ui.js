// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/260
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/272
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/280
// 1_example_data_ui.js - UI функции загрузки примеров
//
// issue #260: Убраны встроенные данные (fallback). Примеры загружаются только из файлов.
// При ошибке загрузки показывается диалог с предложением указать расположение файла.
// issue #272: Файлы примеров перемещены в подпапку dia/ (относительный путь dia/Trig_VADv5.ttl)
// issue #280: Динамическая загрузка списка примеров из config.json (diaFiles)

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

        // issue #282: Автоматически вызываем refreshVisualization после успешной загрузки примера
        // Это выполняет валидацию и парсинг данных, после чего открывается окно Publisher
        if (typeof refreshVisualization === 'function') {
            console.log('issue #282: Auto-calling refreshVisualization after successful example load');
            await refreshVisualization();

            // issue #282: После успешной загрузки разворачиваем панель Publisher, если она свёрнута
            if (typeof applyPanelCollapsedState === 'function') {
                applyPanelCollapsedState('5_publisher', false);
            }
        }
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

                        // issue #282: Автоматически вызываем refreshVisualization после загрузки файла из диалога
                        if (typeof refreshVisualization === 'function') {
                            console.log('issue #282: Auto-calling refreshVisualization after successful file dialog load');
                            await refreshVisualization();

                            // issue #282: После успешной загрузки разворачиваем панель Publisher, если она свёрнута
                            if (typeof applyPanelCollapsedState === 'function') {
                                applyPanelCollapsedState('5_publisher', false);
                            }
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
    // issue #272: Файлы примеров перемещены в подпапку dia/
    loadExampleFromFile('dia/Trig_VADv5.ttl', 'Trig_VADv5', 'trig', 'vad-trig');
}

/**
 * Issue #219 Fix #5: Загружает пример TriG VADv6 с добавленным vad:pDel для тестирования удаления
 * issue #260: Загрузка только из файла, без встроенных данных
 *
 * Содержит все то же, что и Trig_VADv5, плюс:
 * - vad:pDel: концепт процесса для тестирования удаления
 */
function loadExampleTrigVADv6() {
    // issue #272: Файлы примеров перемещены в подпапку dia/
    loadExampleFromFile('dia/Trig_VADv6.ttl', 'Trig_VADv6', 'trig', 'vad-trig');
}

/**
 * Для обратной совместимости: вызывает загрузку примера Trig_VADv5
 */
function loadExample() {
    loadExampleTrigVADv5();
}

/**
 * issue #280: Динамически загружает список примеров из config.json и отображает их в UI
 * Примеры отображаются в горизонтальную линию как кликабельные ссылки
 */
async function loadDiaFilesFromConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            console.warn('issue #280: config.json не найден, используются стандартные примеры');
            return;
        }

        const config = await response.json();
        if (!config.diaFiles || !Array.isArray(config.diaFiles) || config.diaFiles.length === 0) {
            console.log('issue #280: diaFiles не найден в config.json, используются стандартные примеры');
            return;
        }

        // Находим контейнер для примеров
        const contentEl = document.getElementById('content-1_example_data');
        if (!contentEl) {
            console.warn('issue #280: Контейнер content-1_example_data не найден');
            return;
        }

        const descriptionEl = contentEl.querySelector('.description');
        if (!descriptionEl) {
            console.warn('issue #280: Элемент .description не найден');
            return;
        }

        // Находим или создаем контейнер для ссылок на примеры
        let linksContainer = descriptionEl.querySelector('p');
        if (!linksContainer) {
            linksContainer = document.createElement('p');
            descriptionEl.insertBefore(linksContainer, descriptionEl.firstChild);
        }

        // Очищаем существующие ссылки и создаем новые из конфига
        linksContainer.innerHTML = '';

        config.diaFiles.forEach((fileConfig, index) => {
            const span = document.createElement('span');
            span.className = 'example-link';
            span.textContent = fileConfig.name;
            span.onclick = function() {
                loadExampleFromFile(
                    fileConfig.file,
                    fileConfig.name,
                    fileConfig.format || 'trig',
                    fileConfig.mode || 'vad-trig'
                );
            };
            linksContainer.appendChild(span);

            // Добавляем пробел между ссылками (кроме последней)
            if (index < config.diaFiles.length - 1) {
                linksContainer.appendChild(document.createTextNode(' '));
            }
        });

        console.log(`issue #280: Загружено ${config.diaFiles.length} примеров из config.json`);

    } catch (error) {
        console.error('issue #280: Ошибка загрузки diaFiles из config.json:', error);
    }
}

// issue #280: Автоматически загружаем список примеров при старте
document.addEventListener('DOMContentLoaded', loadDiaFilesFromConfig);
