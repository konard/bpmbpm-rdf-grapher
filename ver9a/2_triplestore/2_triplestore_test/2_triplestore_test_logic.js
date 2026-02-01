// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232
// 2_triplestore_test_logic.js - Функции тестирования и валидации RDF данных

/**
 * Тестирует валидность RDF данных вручную
 *
 * Выполняет комплексную проверку RDF данных из текстового поля:
 * 1. Проверяет синтаксическую корректность (парсинг через N3.js)
 * 2. Проверяет соответствие правилам VAD онтологии (через validateVAD)
 *
 * Вызывается при нажатии кнопки "Тест" в заголовке поля RDF данных.
 * Результаты отображаются в модальном окне с возможностью выделения и копирования.
 *
 * @returns {void}
 *
 * @example
 * // Вызов при нажатии кнопки "Тест"
 * <button onclick="testRdfValidation()">Тест</button>
 *
 * @see validateVAD - Функция валидации правил VAD
 * @see formatVADErrors - Форматирование ошибок валидации
 */
function testRdfValidation() {
    const rdfInput = document.getElementById('rdf-input');
    const inputFormat = document.getElementById('input-format').value;

    if (!rdfInput || !rdfInput.value.trim()) {
        showTestResultModal('Ошибка', 'Нет данных для проверки. Введите RDF данные в поле выше.', true);
        return;
    }

    const rdfData = rdfInput.value;

    // Создаем парсер N3
    const parser = new N3.Parser({ format: inputFormat });

    const quads = [];
    const prefixes = {};

    try {
        parser.parse(rdfData, (error, quad, prefixesParsed) => {
            if (error) {
                showTestResultModal('❌ ОШИБКА СИНТАКСИСА RDF', `${error.message}\n\nПроверьте корректность синтаксиса RDF данных.`, true);
                return;
            }

            if (quad) {
                quads.push(quad);
            } else {
                // Parsing complete
                Object.assign(prefixes, prefixesParsed);

                // Выполняем валидацию VAD онтологии
                const validation = validateVAD(quads, prefixes);

                // Выполняем валидацию VAD схемы
                const schemaValidation = validateVADSchema(quads, prefixes);

                // Формируем итоговое сообщение
                let resultMessage = '';

                if (validation.valid && schemaValidation.valid) {
                    resultMessage = 'RDF данные полностью соответствуют правилам VAD онтологии и схемы.\n\n' +
                          `Всего триплетов: ${quads.length}\n` +
                          `Префиксов: ${Object.keys(prefixes).length}`;
                    showTestResultModal('✅ ВАЛИДАЦИЯ УСПЕШНА', resultMessage, false);
                } else {
                    // Есть ошибки - показываем детали
                    if (!validation.valid) {
                        resultMessage += formatVADErrors(validation.errors);
                        resultMessage += '\n\n';
                    }
                    if (!schemaValidation.valid || schemaValidation.warnings.length > 0) {
                        resultMessage += formatVADSchemaValidation(schemaValidation);
                    }
                    showTestResultModal('❌ ОШИБКИ ВАЛИДАЦИИ', resultMessage, true);
                }
            }
        });
    } catch (error) {
        showTestResultModal('❌ ОШИБКА ПРИ ПРОВЕРКЕ', `${error.message}\n\nПроверьте корректность RDF данных.`, true);
    }
}

/**
 * Открывает модальное окно с результатами тестирования
 * @param {string} title - Заголовок окна
 * @param {string} message - Текст сообщения
 * @param {boolean} isError - true если это ошибка
 */
function showTestResultModal(title, message, isError = false) {
    const modal = document.getElementById('test-result-modal');
    const titleEl = document.getElementById('test-result-modal-title');
    const textEl = document.getElementById('test-result-modal-text');
    const headerEl = modal.querySelector('.test-result-modal-header');

    titleEl.textContent = title;
    textEl.value = message;

    if (isError) {
        headerEl.classList.add('error');
    } else {
        headerEl.classList.remove('error');
    }

    modal.style.display = 'block';
}

/**
 * Закрывает модальное окно результатов тестирования
 */
function closeTestResultModal() {
    const modal = document.getElementById('test-result-modal');
    modal.style.display = 'none';
}

/**
 * Копирует содержимое результата тестирования в буфер обмена
 */
function copyTestResultToClipboard() {
    const textEl = document.getElementById('test-result-modal-text');
    const copyBtn = document.querySelector('.test-result-copy-btn');

    textEl.select();
    textEl.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(textEl.value).then(function() {
        copyBtn.textContent = 'Скопировано!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Копировать';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(function() {
        document.execCommand('copy');
        copyBtn.textContent = 'Скопировано!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Копировать';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
}

// Закрытие модального окна результатов тестирования при клике вне его
window.addEventListener('click', function(event) {
    const modal = document.getElementById('test-result-modal');
    if (event.target === modal) {
        closeTestResultModal();
    }
});
