// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// 2_triplestore_ui.js - UI функции для работы с RDF данными (ввод, сохранение, загрузка)

/**
 * Очищает содержимое поля RDF данных
 */
function clearRdfInput() {
    document.getElementById('rdf-input').value = '';
}

/**
 * Сохраняет содержимое RDF поля как файл
 */
function saveAsFile() {
    const content = document.getElementById('rdf-input').value;
    if (!content.trim()) {
        alert('Нет данных для сохранения');
        return;
    }

    const format = document.getElementById('input-format').value;
    let extension = 'ttl';
    if (format === 'n-triples') extension = 'nt';
    else if (format === 'n-quads') extension = 'nq';
    else if (format === 'trig') extension = 'trig';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rdf-data.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Загружает файл, выбранный пользователем
 */
function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('rdf-input').value = e.target.result;

        // Определяем формат по расширению
        const extension = file.name.split('.').pop().toLowerCase();
        let format = 'turtle';
        if (extension === 'nt') format = 'n-triples';
        else if (extension === 'nq') format = 'n-quads';
        else if (extension === 'trig') format = 'trig';

        document.getElementById('input-format').value = format;

        // Обновляем статус загрузки
        const statusEl = document.getElementById('example-status');
        statusEl.textContent = `Файл ${file.name} успешно загружен`;
        statusEl.style.display = 'block';
        statusEl.style.backgroundColor = '#d4edda';
        statusEl.style.borderColor = '#c3e6cb';
        statusEl.style.color = '#155724';

        // Сбрасываем значение input для возможности повторной загрузки того же файла
        event.target.value = '';
    };
    reader.readAsText(file);
}

/**
 * Открывает RDF данные в отдельном окне браузера
 */
function showRdfInSeparateWindow() {
    const rdfInput = document.getElementById('rdf-input');
    if (!rdfInput) return;

    const rdfContent = rdfInput.value;

    // Создаем новое окно
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

    if (newWindow) {
        // Формируем HTML для нового окна
        const htmlContent = '<!DOCTYPE html>' +
            '<html><head><title>RDF данные</title>' +
            '<style>' +
            'body { font-family: Consolas, Monaco, monospace; padding: 20px; background-color: #f5f5f5; margin: 0; }' +
            '.container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
            'h1 { color: #333; font-size: 18px; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }' +
            'pre { white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.5; margin: 0; color: #333; }' +
            '.copy-btn { background-color: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; }' +
            '.copy-btn:hover { background-color: #45a049; }' +
            '</style></head>' +
            '<body><div class="container">' +
            '<h1>RDF данные</h1>' +
            '<button class="copy-btn" id="copy-btn">Копировать в буфер</button>' +
            '<pre id="rdf-content"></pre>' +
            '</div></body></html>';

        newWindow.document.write(htmlContent);
        newWindow.document.close();

        // Заполняем содержимое после записи документа
        const preElement = newWindow.document.getElementById('rdf-content');
        if (preElement) {
            preElement.textContent = rdfContent;
        }

        // Добавляем обработчик для кнопки копирования
        const copyBtn = newWindow.document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.onclick = function() {
                newWindow.navigator.clipboard.writeText(rdfContent).then(function() {
                    newWindow.alert('Скопировано в буфер обмена');
                }).catch(function() {
                    // Fallback для старых браузеров
                    const textarea = newWindow.document.createElement('textarea');
                    textarea.value = rdfContent;
                    newWindow.document.body.appendChild(textarea);
                    textarea.select();
                    newWindow.document.execCommand('copy');
                    newWindow.document.body.removeChild(textarea);
                    newWindow.alert('Скопировано в буфер обмена');
                });
            };
        }
    } else {
        alert('Не удалось открыть новое окно. Проверьте настройки блокировки всплывающих окон.');
    }
}

/**
 * Открывает окно с виртуальными RDF данными
 */
function showVirtualRDFdataWindow() {
    const virtualContent = formatVirtualRDFdata(virtualRDFdata, currentPrefixes);

    // Создаем новое окно
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

    if (newWindow) {
        // Формируем HTML для нового окна
        const htmlContent = '<!DOCTYPE html>' +
            '<html><head><title>virtualRDFdata - Виртуальные данные</title>' +
            '<style>' +
            'body { font-family: Consolas, Monaco, monospace; padding: 20px; background-color: #f5f5f5; margin: 0; }' +
            '.container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
            'h1 { color: #333; font-size: 18px; margin-top: 0; border-bottom: 2px solid #9C27B0; padding-bottom: 10px; }' +
            '.info { background-color: #F3E5F5; border-left: 4px solid #9C27B0; padding: 10px 15px; margin-bottom: 15px; font-size: 13px; }' +
            'pre { white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.5; margin: 0; color: #333; background-color: #fafafa; padding: 15px; border-radius: 4px; }' +
            '.copy-btn { background-color: #9C27B0; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; margin-right: 10px; }' +
            '.copy-btn:hover { background-color: #7B1FA2; }' +
            '.refresh-btn { background-color: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; }' +
            '.refresh-btn:hover { background-color: #45a049; }' +
            '</style></head>' +
            '<body><div class="container">' +
            '<h1>virtualRDFdata - Виртуальные вычисляемые данные</h1>' +
            '<div class="info">' +
            '<strong>Описание:</strong> Эти данные вычисляются автоматически на основе RDF-данных и ' +
            'не хранятся в файлах. Значения vad:processSubtype определяются по наличию vad:hasTrig ' +
            'и положению процесса в иерархии схем.' +
            '</div>' +
            '<button class="copy-btn" id="copy-btn">Копировать в буфер</button>' +
            '<pre id="virtual-content"></pre>' +
            '</div></body></html>';

        newWindow.document.write(htmlContent);
        newWindow.document.close();

        // Заполняем содержимое после записи документа
        const preElement = newWindow.document.getElementById('virtual-content');
        if (preElement) {
            preElement.textContent = virtualContent;
        }

        // Добавляем обработчик для кнопки копирования
        const copyBtn = newWindow.document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.onclick = function() {
                newWindow.navigator.clipboard.writeText(virtualContent).then(function() {
                    newWindow.alert('Скопировано в буфер обмена');
                }).catch(function() {
                    // Fallback для старых браузеров
                    const textarea = newWindow.document.createElement('textarea');
                    textarea.value = virtualContent;
                    newWindow.document.body.appendChild(textarea);
                    textarea.select();
                    newWindow.document.execCommand('copy');
                    newWindow.document.body.removeChild(textarea);
                    newWindow.alert('Скопировано в буфер обмена');
                });
            };
        }
    } else {
        alert('Не удалось открыть новое окно. Проверьте настройки блокировки всплывающих окон.');
    }
}
