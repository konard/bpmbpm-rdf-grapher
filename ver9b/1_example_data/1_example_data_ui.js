// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/260
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/272
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/280
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/284
// 1_example_data_ui.js - UI функции загрузки примеров
//
// issue #260: Убраны встроенные данные (fallback). Примеры загружаются только из файлов.
// При ошибке загрузки показывается диалог с предложением указать расположение файла.
// issue #272: Файлы примеров перемещены в подпапку dia/ (относительный путь dia/Trig_VADv5.ttl)
// issue #280: Динамическая загрузка списка примеров из config.json (diaFiles)
// issue #284: Упрощение - сканирование папки dia/ через файл files.txt, удаление config.json зависимости

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
 * issue #284: Загружает выбранный пример из выпадающего списка
 * Вызывается при выборе файла в dropdown
 */
function loadSelectedExample() {
    const selectEl = document.getElementById('example-select');
    if (!selectEl || !selectEl.value) {
        return;
    }

    const filename = selectEl.value;
    const displayName = filename;

    // Все файлы в папке dia/ - это TriG формат с режимом vad-trig
    loadExampleFromFile('dia/' + filename, displayName, 'trig', 'vad-trig');
}

/**
 * issue #284: Сканирует папку dia/ через файл files.txt и заполняет выпадающий список
 * Файл files.txt содержит список .ttl файлов, по одному на строку
 */
async function scanDiaFolder() {
    const selectEl = document.getElementById('example-select');
    if (!selectEl) {
        console.warn('issue #284: Элемент example-select не найден');
        return;
    }

    try {
        const response = await fetch('dia/files.txt');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        const files = text.trim().split('\n').filter(line => line.trim() && line.endsWith('.ttl'));

        if (files.length === 0) {
            console.warn('issue #284: В файле dia/files.txt не найдено .ttl файлов');
            return;
        }

        // Очищаем список и добавляем опцию по умолчанию
        selectEl.innerHTML = '<option value="">-- Выберите пример --</option>';

        // Добавляем каждый файл как опцию
        files.forEach(filename => {
            const option = document.createElement('option');
            const trimmedFilename = filename.trim();
            option.value = trimmedFilename;
            option.textContent = trimmedFilename;
            selectEl.appendChild(option);
        });

        console.log(`issue #284: Загружено ${files.length} примеров из dia/files.txt`);

    } catch (error) {
        console.error('issue #284: Ошибка загрузки dia/files.txt:', error);

        // При ошибке показываем сообщение в статусе
        const statusEl = document.getElementById('example-status');
        if (statusEl) {
            statusEl.textContent = `Ошибка загрузки списка примеров: ${error.message}`;
            statusEl.style.display = 'block';
            statusEl.style.backgroundColor = '#f8d7da';
            statusEl.style.borderColor = '#f5c6cb';
            statusEl.style.color = '#721c24';
        }
    }
}

// issue #284: Автоматически сканируем папку dia/ при старте
document.addEventListener('DOMContentLoaded', scanDiaFolder);
