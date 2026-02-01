// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// 5_publisher_ui.js - UI функции модуля Publisher (отображение результатов визуализации)

        function showLoading() {
            const output = document.getElementById('output');
            const resultContainer = document.getElementById('result-container');

            resultContainer.style.display = 'block';
            output.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Обработка RDF данных...</p>
                </div>
            `;

            document.getElementById('export-buttons').style.display = 'none';
            document.getElementById('zoom-controls').style.display = 'none';
            document.getElementById('prefixes-panel').style.display = 'none';
            document.getElementById('legend-panel').style.display = 'none';
            // filter-panel removed in minimization
        }

        /**
         * Улучшает сообщение об ошибке парсинга, добавляя содержимое проблемной строки
         * @param {string} errorMessage - Исходное сообщение об ошибке
         * @param {string} rdfInput - Исходные RDF данные
         * @returns {string} - Улучшенное сообщение об ошибке
         */
        function enhanceParseError(errorMessage, rdfInput) {
            // Ищем номер строки в сообщении об ошибке (паттерн "on line N" или "line N")
            const lineMatch = errorMessage.match(/(?:on\s+)?line\s+(\d+)/i);
            if (lineMatch && rdfInput) {
                const lineNumber = parseInt(lineMatch[1], 10);
                const lines = rdfInput.split('\n');
                if (lineNumber > 0 && lineNumber <= lines.length) {
                    const problemLine = lines[lineNumber - 1];
                    return `${errorMessage}\nСтрока ${lineNumber}: ${problemLine}`;
                }
            }
            return errorMessage;
        }

        function showError(message) {
            const output = document.getElementById('output');
            const resultContainer = document.getElementById('result-container');
            const vadTrigOutput = document.getElementById('vad-trig-output');
            const vadTrigContainer = document.getElementById('vad-trig-container');

            resultContainer.style.display = 'block';
            // Заменяем переносы строк на <br> для корректного отображения в HTML
            const formattedMessage = message.replace(/\n/g, '<br>');
            const errorHtml = `<div class="error"><strong>Ошибка:</strong> ${formattedMessage}</div>`;

            // Если активен режим VAD-TriG, показываем ошибку также в его контейнере
            const isVadTrigMode = vadTrigContainer && vadTrigContainer.style.display !== 'none';
            if (isVadTrigMode && vadTrigOutput) {
                vadTrigOutput.innerHTML = errorHtml;
            }

            // Всегда показываем ошибку в основном output (для не-VAD-TriG режимов или при переключении)
            output.innerHTML = errorHtml;

            // Скрываем VAD-TriG панели при ошибке, чтобы показать основной output
            toggleVADTriGPanels(false);

            document.getElementById('export-buttons').style.display = 'none';
            document.getElementById('zoom-controls').style.display = 'none';
            document.getElementById('prefixes-panel').style.display = 'none';
            document.getElementById('legend-panel').style.display = 'none';
            // filter-panel removed in minimization
        }

        function showValidationError(message) {
            const output = document.getElementById('output');
            const resultContainer = document.getElementById('result-container');
            const vadTrigOutput = document.getElementById('vad-trig-output');
            const vadTrigContainer = document.getElementById('vad-trig-container');

            resultContainer.style.display = 'block';
            const errorHtml = `<div class="validation-error">${message}</div>`;

            // Если активен режим VAD-TriG, показываем ошибку также в его контейнере
            const isVadTrigMode = vadTrigContainer && vadTrigContainer.style.display !== 'none';
            if (isVadTrigMode && vadTrigOutput) {
                vadTrigOutput.innerHTML = errorHtml;
            }

            // Всегда показываем ошибку в основном output (для не-VAD-TriG режимов или при переключении)
            output.innerHTML = errorHtml;

            // Скрываем VAD-TriG панели при ошибке, чтобы показать основной output
            toggleVADTriGPanels(false);

            document.getElementById('export-buttons').style.display = 'none';
            document.getElementById('zoom-controls').style.display = 'none';
            document.getElementById('prefixes-panel').style.display = 'none';
            document.getElementById('legend-panel').style.display = 'none';
            // filter-panel removed in minimization
        }

        /**
         * Показывает или скрывает панели VAD TriG режима
         * @param {boolean} show - Показать или скрыть
         */
        function toggleVADTriGPanels(show) {
            const vadTrigContainer = document.getElementById('vad-trig-container');
            const regularZoomContainer = document.getElementById('zoom-container');
            const regularZoomControls = document.getElementById('zoom-controls');
            const regularOutput = document.getElementById('output');

            if (vadTrigContainer) {
                vadTrigContainer.style.display = show ? 'flex' : 'none';
            }

            // Hide regular zoom container and clear output when showing VAD TriG panels
            if (regularZoomContainer) {
                regularZoomContainer.style.display = show ? 'none' : 'block';
            }
            if (regularZoomControls && show) {
                regularZoomControls.style.display = 'none';
            }
            if (regularOutput && show) {
                regularOutput.innerHTML = '';
            }
        }
