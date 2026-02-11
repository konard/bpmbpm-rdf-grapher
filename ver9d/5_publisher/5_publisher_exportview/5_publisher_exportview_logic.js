// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/368
// 5_publisher_exportview_logic.js - Логика экспорта модуля Publisher
// Функции для экспорта визуализации (Скачать SVG, PNG, открытие в внешних сервисах)

        // ============================================================================
        // ФУНКЦИИ КОНВЕРТАЦИИ
        // ============================================================================

        /**
         * Конвертирует SVG в PNG
         * @param {string} svgString - SVG данные в виде строки
         * @returns {Promise<string>} - PNG данные в формате Data URL
         */
        function svgToPng(svgString) {
            return new Promise((resolve, reject) => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = svgString;
                const svgElement = tempDiv.querySelector('svg');

                let width = parseInt(svgElement.getAttribute('width')) || 800;
                let height = parseInt(svgElement.getAttribute('height')) || 600;

                const widthStr = svgElement.getAttribute('width') || '';
                const heightStr = svgElement.getAttribute('height') || '';

                if (widthStr.includes('pt')) {
                    width = Math.ceil(parseFloat(widthStr) * 1.33);
                }
                if (heightStr.includes('pt')) {
                    height = Math.ceil(parseFloat(heightStr) * 1.33);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width * 2;
                canvas.height = height * 2;
                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);

                const img = new Image();
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = function() {
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                    resolve(canvas.toDataURL('image/png'));
                };

                img.onerror = function() {
                    URL.revokeObjectURL(url);
                    reject(new Error('Ошибка при конвертации SVG в PNG'));
                };

                img.src = url;
            });
        }

        // ============================================================================
        // ФУНКЦИИ СКАЧИВАНИЯ (Скачать SVG, Скачать PNG)
        // ============================================================================

        /**
         * Скачивает текущую визуализацию в формате SVG
         */
        function downloadSVG() {
            if (!currentSvgElement) {
                alert('Сначала визуализируйте RDF данные');
                return;
            }

            const svgData = new XMLSerializer().serializeToString(currentSvgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(svgBlob);
            downloadLink.download = 'rdf-graph.svg';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);
        }

        /**
         * Скачивает текущую визуализацию в формате PNG
         */
        async function downloadPNG() {
            if (!currentSvgElement) {
                alert('Сначала визуализируйте RDF данные');
                return;
            }

            try {
                const svgData = new XMLSerializer().serializeToString(currentSvgElement);
                const pngDataUrl = await svgToPng(svgData);

                const downloadLink = document.createElement('a');
                downloadLink.href = pngDataUrl;
                downloadLink.download = 'rdf-graph.png';

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

            } catch (error) {
                console.error('Ошибка при скачивании PNG:', error);
                alert('Ошибка при создании PNG файла');
            }
        }

        // ============================================================================
        // ФУНКЦИИ ОТКРЫТИЯ В НОВОМ ОКНЕ (Показать в окне github, ldf.fi, GraphvizOnline)
        // ============================================================================

        // formatMapping определён в 9_vadlib/vadlib.js (issue #234)

        /**
         * Открывает визуализацию в новом окне через внешний LDF сервис
         * Формирует URL с параметрами: rdf=данные&from=формат&to=png
         * Кнопка: "Показать в окне ldf.fi"
         */
        function openInNewWindowLdfFi() {
            // Получаем входные данные
            const rdfInput = document.getElementById('rdf-input').value.trim();
            const inputFormat = document.getElementById('input-format').value;

            // Проверяем, что данные введены
            if (!rdfInput) {
                alert('Пожалуйста, введите RDF данные');
                return;
            }

            // Получаем формат для параметра URL
            const fromFormat = formatMapping[inputFormat] || 'ttl';

            // Кодируем RDF данные для URL
            // Заменяем пробелы на + для совместимости с LDF сервисом
            const encodedRdf = encodeURIComponent(rdfInput).replace(/%20/g, '+');

            // Формируем URL для внешнего сервиса
            const serviceUrl = `https://www.ldf.fi/service/rdf-grapher?rdf=${encodedRdf}&from=${fromFormat}&to=png`;

            // Открываем в новом окне
            window.open(serviceUrl, '_blank');
        }

        /**
         * Открывает визуализацию в новом окне через внешний LDF сервис с форматом TriG
         * Формирует URL с параметрами: rdf=данные&from=trig&to=png
         * Кнопка: "Показать в окне ldf.fi (TriG)"
         */
        function openInNewWindowLdfFiTrig() {
            // Получаем входные данные
            const rdfInput = document.getElementById('rdf-input').value.trim();

            // Проверяем, что данные введены
            if (!rdfInput) {
                alert('Пожалуйста, введите RDF данные');
                return;
            }

            // Кодируем RDF данные для URL
            // Заменяем пробелы на + для совместимости с LDF сервисом
            const encodedRdf = encodeURIComponent(rdfInput).replace(/%20/g, '+');

            // Формируем URL для внешнего сервиса с явным указанием формата TriG
            const serviceUrl = `https://www.ldf.fi/service/rdf-grapher?rdf=${encodedRdf}&from=trig&to=png`;

            // Открываем в новом окне
            window.open(serviceUrl, '_blank');
        }

        /**
         * Открывает визуализацию в новом окне через GitHub Pages (без внешнего сервиса)
         * Формирует URL с данными в хеше: #rdf=данные&from=формат&to=формат&mode=режим
         * Использует URL fragment (hash) вместо query params для избежания ошибки URI Too Long
         * Кнопка: "Показать в окне github"
         */
        function openInNewWindowGitHub() {
            // Получаем входные данные
            const rdfInput = document.getElementById('rdf-input').value.trim();
            const inputFormat = document.getElementById('input-format').value;
            const outputFormat = document.getElementById('output-format').value;
            const visualizationMode = document.getElementById('visualization-mode').value;

            // Проверяем, что данные введены
            if (!rdfInput) {
                alert('Пожалуйста, введите RDF данные');
                return;
            }

            // Получаем формат для параметра URL
            const fromFormat = formatMapping[inputFormat] || 'ttl';

            // Кодируем RDF данные для URL
            const encodedRdf = encodeURIComponent(rdfInput);

            // Определяем базовый URL динамически на основе текущего расположения HTML файла
            // Это позволяет корректно работать как на GitHub Pages, так и локально
            let baseUrl;
            // Используем текущую директорию HTML файла как базовый URL
            baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');

            // Формируем URL с данными в хеше (избегает ошибки URI Too Long)
            const hashParams = `rdf=${encodedRdf}&from=${fromFormat}&to=${outputFormat}&mode=${visualizationMode}`;
            const serviceUrl = `${baseUrl}#${hashParams}`;

            // Открываем в новом окне
            window.open(serviceUrl, '_blank');
        }

        /**
         * Открывает DOT-код в GraphvizOnline для интерактивного редактирования
         * Использует хеш URL для передачи DOT-кода
         * Кнопка: "Показать в окне GraphvizOnline"
         */
        function openInNewWindowGraphvizOnline() {
            // Проверяем, что DOT-код был сгенерирован
            if (!currentDotCode) {
                alert('Сначала визуализируйте RDF данные');
                return;
            }

            // Кодируем DOT-код для URL
            const encodedDot = encodeURIComponent(currentDotCode);

            // Формируем URL с DOT-кодом в хеше
            const graphvizUrl = `https://dreampuf.github.io/GraphvizOnline/#${encodedDot}`;

            // Открываем в новом окне
            window.open(graphvizUrl, '_blank');
        }
