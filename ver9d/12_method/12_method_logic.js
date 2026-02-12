// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/368
// issue #370: Добавлен метод addHasNextDia
// 12_method_logic.js - Логика модуля Методы
// Выполнение методов объектов диаграммы

        // ==============================================================================
        // issue #370: Состояние модуля редактирования hasNext
        // ==============================================================================

        let hasNextDiaState = {
            isOpen: false,
            processUri: null,       // URI индивида процесса
            trigUri: null,          // URI текущего TriG
            currentHasNext: [],     // Текущие значения hasNext
            selectedHasNext: [],    // Выбранные значения hasNext
            intermediateSparql: ''
        };

        let hasNextDiaIntermediateSparqlQueries = [];

        /**
         * Выполняет метод объекта
         * @param {string} functionId - Идентификатор функции ('deleteIndividProcess', 'deleteIndividExecutor' или 'addHasNextDia')
         * @param {string} objectUri - URI объекта
         * @param {string} trigUri - URI текущего TriG
         */
        function executeObjectMethod(functionId, objectUri, trigUri) {
            console.log(`Executing method: ${functionId} for ${objectUri} in ${trigUri}`);

            switch (functionId) {
                case 'deleteIndividProcess':
                    deleteIndividProcessFromTrig(objectUri, trigUri);
                    break;
                case 'deleteIndividExecutor':
                    deleteIndividExecutorFromTrig(objectUri, trigUri);
                    break;
                case 'addHasNextDia':
                    // issue #370: Открываем диалог редактирования hasNext
                    openHasNextDiaModal(objectUri, trigUri);
                    break;
                default:
                    console.warn(`Unknown method function: ${functionId}`);
                    alert(`Метод "${functionId}" не реализован`);
            }
        }

        /**
         * Удаляет индивид процесса из указанного TriG
         * issue #336: Реализация метода Delete Individ Process
         * issue #372: Переработан на SPARQL-Driven подход (без JavaScript fallback)
         *
         * Алгоритм работы (аналогично Add hasNext Dia):
         * 1. Вызывается окно «Удалить индивид процесса в схеме» (openDeleteModal)
         * 2. Значения «Схема процесса» и «Индивид процесса» подставляются из текущей схемы
         * 3. По кнопке «Создать запрос на удаление» SPARQL-запрос передаётся в Result in SPARQL
         * 4. Пользователь применяет запрос через стандартную процедуру
         *
         * @param {string} processUri - URI процесса
         * @param {string} trigUri - URI TriG
         */
        function deleteIndividProcessFromTrig(processUri, trigUri) {
            // issue #372: SPARQL-Driven подход — всегда используем модальное окно
            // Преобразуем URI в prefixed формат для отображения в UI
            const prefixedProcessUri = getPrefixedName(processUri, currentPrefixes);
            const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

            // Вызываем окно удаления индивида в схеме с предустановленными значениями
            // Функция openDeleteModal определена в 3_sd_del_concept_individ_logic.js
            // https://github.com/bpmbpm/rdf-grapher/blob/main/ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js    
            // issue #382: Используем новое обозначение individProcess вместо individ
            openDeleteModal('individProcess', prefixedTrigUri, prefixedProcessUri);
        }

        /**
         * Удаляет все предикаты vad:includes для ExecutorGroup из указанного TriG
         * issue #336: Реализация метода Delete Individ Executor
         * issue #372: Переработан на SPARQL-Driven подход (без JavaScript fallback)
         *
         * Алгоритм работы (аналогично deleteIndividProcessFromTrig):
         * 1. Вызывается окно «Удалить индивид исполнителя в схеме» (openDeleteModal)
         * 2. Значения «Схема» и «Исполнитель» подставляются из текущего контекста
         * 3. По кнопке «Создать запрос на удаление» SPARQL-запрос передаётся в Result in SPARQL
         *
         * @param {string} executorGroupUri - URI ExecutorGroup
         * @param {string} trigUri - URI TriG
         */
        function deleteIndividExecutorFromTrig(executorGroupUri, trigUri) {
            // issue #372: SPARQL-Driven подход — всегда используем модальное окно
            const prefixedUri = getPrefixedName(executorGroupUri, currentPrefixes);
            const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

            // Вызываем окно удаления индивида исполнителя в схеме с предустановленными значениями
            // issue #382: Используем новое обозначение individExecutor вместо executor
            openDeleteModal('individExecutor', prefixedTrigUri, prefixedUri);
        }

        // ==============================================================================
        // issue #372: Удалены функции performDeleteIndividProcess и performDeleteIndividExecutor
        // Теперь используется SPARQL-Driven подход — удаление выполняется через
        // модальное окно Del Concept\Individ\Schema, которое генерирует SPARQL запрос
        // для применения через стандартную процедуру в Result in SPARQL.
        // ==============================================================================

        // ==============================================================================
        // issue #370: ФУНКЦИИ МОДУЛЯ РЕДАКТИРОВАНИЯ vad:hasNext (Add hasNext Dia)
        // ==============================================================================

        /**
         * issue #370: Открывает модальное окно редактирования vad:hasNext
         * @param {string} processUri - URI индивида процесса
         * @param {string} trigUri - URI текущего TriG
         */
        function openHasNextDiaModal(processUri, trigUri) {
            // Инициализируем состояние
            hasNextDiaState = {
                isOpen: true,
                processUri: processUri,
                trigUri: trigUri,
                currentHasNext: [],
                selectedHasNext: [],
                intermediateSparql: ''
            };
            hasNextDiaIntermediateSparqlQueries = [];

            const modal = document.getElementById('hasnext-dia-modal');
            if (!modal) {
                console.error('Модальное окно hasnext-dia-modal не найдено');
                return;
            }

            // Заполняем предустановленные поля
            const trigInput = document.getElementById('hasnext-dia-trig');
            const conceptInput = document.getElementById('hasnext-dia-concept');

            const prefixedTrig = typeof getPrefixedName === 'function'
                ? getPrefixedName(trigUri, currentPrefixes) : trigUri;
            const prefixedProcess = typeof getPrefixedName === 'function'
                ? getPrefixedName(processUri, currentPrefixes) : processUri;

            if (trigInput) trigInput.value = prefixedTrig;
            if (conceptInput) conceptInput.value = prefixedProcess;

            // Получаем текущие hasNext для процесса
            hasNextDiaState.currentHasNext = getCurrentHasNext(processUri, trigUri);
            hasNextDiaState.selectedHasNext = [...hasNextDiaState.currentHasNext];

            // Заполняем checkboxes
            fillHasNextDiaCheckboxes(trigUri);

            // Сбрасываем позицию модального окна
            if (typeof resetModalPosition === 'function') {
                resetModalPosition('hasnext-dia-modal');
            }

            hideHasNextDiaMessage();
            modal.style.display = 'block';
        }

        /**
         * issue #370: Закрывает модальное окно редактирования hasNext
         */
        function closeHasNextDiaModal() {
            const modal = document.getElementById('hasnext-dia-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            hasNextDiaState.isOpen = false;
        }

        /**
         * issue #370: Получает текущие значения vad:hasNext для процесса
         * @param {string} processUri - URI процесса
         * @param {string} trigUri - URI TriG
         * @returns {Array<string>} Массив URI следующих процессов
         */
        function getCurrentHasNext(processUri, trigUri) {
            const hasNextUri = 'http://example.org/vad#hasNext';
            const hasNextUris = [];

            if (currentStore) {
                const quads = currentStore.getQuads(processUri, hasNextUri, null, trigUri);
                quads.forEach(quad => {
                    hasNextUris.push(quad.object.value);
                });
            }

            hasNextDiaIntermediateSparqlQueries.push({
                description: 'Получение текущих vad:hasNext для процесса',
                query: `SELECT ?next WHERE {\n    GRAPH <${trigUri}> {\n        <${processUri}> vad:hasNext ?next .\n    }\n}`,
                result: hasNextUris.length > 0
                    ? `Найдено ${hasNextUris.length} hasNext: ${hasNextUris.map(u => typeof getPrefixedName === 'function' ? getPrefixedName(u, currentPrefixes) : u).join(', ')}`
                    : 'hasNext не найдены'
            });

            return hasNextUris;
        }

        /**
         * issue #370: Получает все индивиды процесса в TriG для справочника hasNext
         * @param {string} trigUri - URI TriG
         * @returns {Array<{uri: string, label: string}>}
         */
        function getIndividsForHasNextDia(trigUri) {
            const isSubprocessTrigUri = 'http://example.org/vad#isSubprocessTrig';
            const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';
            const ptreeUri = 'http://example.org/vad#ptree';
            const individs = [];

            if (currentStore) {
                const quads = currentStore.getQuads(null, null, null, null);
                quads.forEach(quad => {
                    if (quad.predicate.value === isSubprocessTrigUri &&
                        quad.object.value === trigUri &&
                        quad.graph && quad.graph.value === trigUri) {
                        // Не добавляем текущий процесс в список
                        if (quad.subject.value === hasNextDiaState.processUri) return;

                        let label = typeof getPrefixedName === 'function'
                            ? getPrefixedName(quad.subject.value, currentPrefixes)
                            : quad.subject.value;

                        // Ищем label из ptree
                        quads.forEach(q2 => {
                            if (q2.subject.value === quad.subject.value &&
                                q2.predicate.value === rdfsLabelUri &&
                                q2.graph && q2.graph.value === ptreeUri) {
                                label = q2.object.value;
                            }
                        });

                        individs.push({ uri: quad.subject.value, label });
                    }
                });
            }

            return individs;
        }

        /**
         * issue #370: Заполняет checkboxes для hasNext
         * @param {string} trigUri - URI TriG
         */
        function fillHasNextDiaCheckboxes(trigUri) {
            const container = document.getElementById('hasnext-dia-checkbox-container');
            if (!container) return;

            const individs = getIndividsForHasNextDia(trigUri);

            hasNextDiaIntermediateSparqlQueries.push({
                description: 'Получение индивидов процесса из TriG для справочника hasNext',
                query: `SELECT ?individ WHERE {\n    GRAPH <${trigUri}> {\n        ?individ vad:isSubprocessTrig <${trigUri}> .\n    }\n}`,
                result: individs.length > 0
                    ? `Найдено ${individs.length} индивидов: ${individs.map(i => i.label).join(', ')}`
                    : 'Индивиды не найдены'
            });

            if (individs.length === 0) {
                container.innerHTML = '<p class="hasnext-dia-hint">Другие индивиды процессов в TriG не найдены</p>';
                return;
            }

            let html = '';
            individs.forEach(item => {
                const isChecked = hasNextDiaState.currentHasNext.includes(item.uri);
                const prefixedName = typeof getPrefixedName === 'function'
                    ? getPrefixedName(item.uri, currentPrefixes) : item.uri;
                const displayLabel = item.label || prefixedName;

                html += `
                    <label class="hasnext-dia-checkbox-label">
                        <input type="checkbox" value="${item.uri}" ${isChecked ? 'checked' : ''} onchange="onHasNextDiaCheckboxChange()">
                        ${displayLabel}
                    </label>
                `;
            });

            container.innerHTML = html;
            displayHasNextDiaIntermediateSparql();
        }

        /**
         * issue #370: Обработчик изменения checkbox
         */
        function onHasNextDiaCheckboxChange() {
            const checkboxes = document.querySelectorAll('#hasnext-dia-checkbox-container input[type="checkbox"]:checked');
            hasNextDiaState.selectedHasNext = Array.from(checkboxes).map(cb => cb.value);
        }

        /**
         * issue #370: Обработчик смены режима hasNext
         */
        function onHasNextDiaModeChange() {
            // В текущей версии поддерживается только режим "existing"
            fillHasNextDiaCheckboxes(hasNextDiaState.trigUri);
        }

        /**
         * issue #370: Генерирует SPARQL запрос для обновления hasNext
         */
        function createHasNextDiaSparql() {
            hideHasNextDiaMessage();

            const processUri = hasNextDiaState.processUri;
            const trigUri = hasNextDiaState.trigUri;
            const currentHasNext = hasNextDiaState.currentHasNext;
            const selectedHasNext = hasNextDiaState.selectedHasNext;

            if (!processUri || !trigUri) {
                showHasNextDiaMessage('Ошибка: не выбран процесс или TriG', 'error');
                return;
            }

            // Определяем что добавить и что удалить
            const toAdd = selectedHasNext.filter(uri => !currentHasNext.includes(uri));
            const toRemove = currentHasNext.filter(uri => !selectedHasNext.includes(uri));

            if (toAdd.length === 0 && toRemove.length === 0) {
                showHasNextDiaMessage('Изменений нет. Добавьте или снимите отметки для изменения hasNext.', 'error');
                return;
            }

            const prefixes = {
                'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
                'vad': 'http://example.org/vad#'
            };

            const prefixDeclarations = Object.entries(prefixes)
                .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
                .join('\n');

            const trigPrefixed = typeof getPrefixedName === 'function'
                ? getPrefixedName(trigUri, currentPrefixes) : `<${trigUri}>`;
            const processPrefixed = typeof getPrefixedName === 'function'
                ? getPrefixedName(processUri, currentPrefixes) : `<${processUri}>`;

            let sparqlQuery = `${prefixDeclarations}\n\n`;
            sparqlQuery += `# issue #370: Изменение vad:hasNext для ${processPrefixed}\n`;

            // Удаление старых hasNext
            if (toRemove.length > 0) {
                sparqlQuery += `\n# Удаление существующих hasNext\n`;
                sparqlQuery += `DELETE DATA {\n`;
                sparqlQuery += `    GRAPH ${trigPrefixed} {\n`;
                toRemove.forEach(uri => {
                    const prefixedUri = typeof getPrefixedName === 'function'
                        ? getPrefixedName(uri, currentPrefixes) : `<${uri}>`;
                    sparqlQuery += `        ${processPrefixed} vad:hasNext ${prefixedUri} .\n`;
                });
                sparqlQuery += `    }\n`;
                sparqlQuery += `}`;
            }

            // Добавление новых hasNext
            if (toAdd.length > 0) {
                if (toRemove.length > 0) {
                    sparqlQuery += `\n;\n`;
                }
                sparqlQuery += `\n# Добавление новых hasNext\n`;
                sparqlQuery += `INSERT DATA {\n`;
                sparqlQuery += `    GRAPH ${trigPrefixed} {\n`;
                toAdd.forEach(uri => {
                    const prefixedUri = typeof getPrefixedName === 'function'
                        ? getPrefixedName(uri, currentPrefixes) : `<${uri}>`;
                    sparqlQuery += `        ${processPrefixed} vad:hasNext ${prefixedUri} .\n`;
                });
                sparqlQuery += `    }\n`;
                sparqlQuery += `}`;
            }

            // Выводим в Result in SPARQL
            const resultTextarea = document.getElementById('result-sparql-query');
            if (resultTextarea) {
                resultTextarea.value = sparqlQuery;
            }

            showHasNextDiaMessage(
                `SPARQL запрос для изменения vad:hasNext успешно сгенерирован. Добавлено: ${toAdd.length}, Удалено: ${toRemove.length}. Запрос выведен в "Result in SPARQL".`,
                'success'
            );

            closeHasNextDiaModal();
        }

        /**
         * issue #370: Показывает сообщение в диалоге hasNext
         * @param {string} message - Текст сообщения
         * @param {string} type - Тип: 'success' или 'error'
         */
        function showHasNextDiaMessage(message, type) {
            const messageDiv = document.getElementById('hasnext-dia-message');
            if (messageDiv) {
                messageDiv.textContent = message;
                messageDiv.className = `hasnext-dia-message ${type}`;
                messageDiv.style.display = 'block';
            }
        }

        /**
         * issue #370: Скрывает сообщение в диалоге hasNext
         */
        function hideHasNextDiaMessage() {
            const messageDiv = document.getElementById('hasnext-dia-message');
            if (messageDiv) {
                messageDiv.style.display = 'none';
            }
        }

        /**
         * issue #370: Отображает промежуточные SPARQL запросы
         */
        function displayHasNextDiaIntermediateSparql() {
            const container = document.getElementById('hasnext-dia-intermediate-sparql');
            const textarea = container ? container.querySelector('textarea') : null;

            if (!container || !textarea) return;

            if (hasNextDiaIntermediateSparqlQueries.length === 0) {
                container.style.display = 'none';
                return;
            }

            let sparqlText = '# ===== Промежуточные SPARQL запросы и результаты =====\n\n';

            hasNextDiaIntermediateSparqlQueries.forEach((query, index) => {
                sparqlText += `# --- ${index + 1}. ${query.description} ---\n`;
                sparqlText += query.query.trim() + '\n';
                if (query.result) {
                    sparqlText += `\n# Результат:\n# ${query.result}\n`;
                }
                sparqlText += '\n';
            });

            textarea.value = sparqlText;
            hasNextDiaState.intermediateSparql = sparqlText;
        }

        /**
         * issue #370: Переключает видимость промежуточного SPARQL
         */
        function toggleHasNextDiaIntermediateSparql() {
            const container = document.getElementById('hasnext-dia-intermediate-sparql');
            if (container) {
                const isVisible = container.style.display !== 'none';
                container.style.display = isVisible ? 'none' : 'block';
            }
        }

        /**
         * issue #370: Показывает справку по редактированию hasNext
         */
        function showHasNextDiaHelp() {
            const helpText = `Редактирование vad:hasNext — справка:

=== Назначение ===
Данный диалог позволяет изменять связи vad:hasNext
для выбранного индивида процесса.

=== Как пользоваться ===
1. Поля "Схема процесса" и "Концепт процесса" заполнены
   автоматически и не изменяемы
2. В чекбоксах отмечены текущие значения vad:hasNext
3. Добавьте или снимите отметки для изменения связей
4. Нажмите "Создать запрос hasNext"

=== Результат ===
Генерируется SPARQL запрос с операциями DELETE DATA
и/или INSERT DATA для изменения значений vad:hasNext.

Запрос выводится в окно "Result in SPARQL" для
стандартной процедуры применения.

=== Примечание ===
В списке отображаются только другие индивиды процесса,
находящиеся в той же схеме (TriG).`;

            alert(helpText);
        }

        // ==============================================================================
        // ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
        // ==============================================================================

        if (typeof window !== 'undefined') {
            window.openHasNextDiaModal = openHasNextDiaModal;
            window.closeHasNextDiaModal = closeHasNextDiaModal;
            window.onHasNextDiaCheckboxChange = onHasNextDiaCheckboxChange;
            window.onHasNextDiaModeChange = onHasNextDiaModeChange;
            window.toggleHasNextDiaIntermediateSparql = toggleHasNextDiaIntermediateSparql;
            window.createHasNextDiaSparql = createHasNextDiaSparql;
            window.showHasNextDiaHelp = showHasNextDiaHelp;
        }
