// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/368
// 12_method_logic.js - Логика модуля Методы
// Выполнение методов объектов диаграммы

        /**
         * Выполняет метод объекта
         * @param {string} functionId - Идентификатор функции ('deleteIndividProcess' или 'deleteIndividExecutor')
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
                default:
                    console.warn(`Unknown method function: ${functionId}`);
                    alert(`Метод "${functionId}" не реализован`);
            }
        }

        /**
         * Удаляет индивид процесса из указанного TriG
         * issue #336: Реализация метода Delete Individ Process
         * @param {string} processUri - URI процесса
         * @param {string} trigUri - URI TriG
         */
        function deleteIndividProcessFromTrig(processUri, trigUri) {
            // Проверяем, доступна ли функция удаления индивида
            if (typeof openDeleteModal === 'function') {
                // Устанавливаем контекст для удаления
                // Используем существующую логику из 3_sd_del_concept_individ
                const prefixedProcessUri = getPrefixedName(processUri, currentPrefixes);
                const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

                // Вызываем окно удаления с предустановленными значениями
                openDeleteModal('individ', prefixedTrigUri, prefixedProcessUri);
            } else {
                // Fallback: выполняем удаление напрямую через SPARQL
                const confirmMsg = `Удалить индивид процесса ${getPrefixedName(processUri, currentPrefixes)} из схемы ${getPrefixedName(trigUri, currentPrefixes)}?`;
                if (confirm(confirmMsg)) {
                    performDeleteIndividProcess(processUri, trigUri);
                }
            }
        }

        /**
         * Удаляет все предикаты vad:includes для ExecutorGroup из указанного TriG
         * issue #336: Реализация метода Delete Individ Executor
         * @param {string} executorGroupUri - URI ExecutorGroup
         * @param {string} trigUri - URI TriG
         */
        function deleteIndividExecutorFromTrig(executorGroupUri, trigUri) {
            const prefixedUri = getPrefixedName(executorGroupUri, currentPrefixes);
            const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

            const confirmMsg = `Удалить всех исполнителей из группы ${prefixedUri}?`;
            if (confirm(confirmMsg)) {
                performDeleteIndividExecutor(executorGroupUri, trigUri);
            }
        }

        /**
         * Выполняет фактическое удаление индивида процесса через SPARQL DELETE
         * @param {string} processUri - URI процесса
         * @param {string} trigUri - URI TriG
         */
        async function performDeleteIndividProcess(processUri, trigUri) {
            const prefixedProcess = getPrefixedName(processUri, currentPrefixes);
            const prefixedTrig = getPrefixedName(trigUri, currentPrefixes);

            // Формируем SPARQL DELETE запрос для удаления всех триплетов процесса из TriG
            const deleteQuery = `
DELETE WHERE {
    GRAPH <${trigUri}> {
        <${processUri}> ?p ?o .
    }
}`;

            try {
                // Применяем запрос через существующую функцию
                if (typeof applyTripleToRdfInput === 'function') {
                    await applyTripleToRdfInput(deleteQuery, 'delete');
                    console.log(`Deleted individ process ${prefixedProcess} from ${prefixedTrig}`);

                    // issue #338: Восстанавливаем selectedTrigUri после applyTripleToRdfInput,
                    // так как она сбрасывает selectedTrigUri в null (issue #274).
                    // Это позволяет refreshVisualization корректно отобразить текущую схему.
                    selectedTrigUri = trigUri;

                    // Обновляем визуализацию
                    if (typeof refreshVisualization === 'function') {
                        refreshVisualization();
                    }
                } else {
                    alert('Функция удаления недоступна');
                }
            } catch (error) {
                console.error('Error deleting individ process:', error);
                alert('Ошибка при удалении индивида процесса: ' + error.message);
            }
        }

        /**
         * Выполняет фактическое удаление предикатов vad:includes для ExecutorGroup
         * @param {string} executorGroupUri - URI ExecutorGroup
         * @param {string} trigUri - URI TriG
         */
        async function performDeleteIndividExecutor(executorGroupUri, trigUri) {
            const prefixedGroup = getPrefixedName(executorGroupUri, currentPrefixes);
            const prefixedTrig = getPrefixedName(trigUri, currentPrefixes);

            // Формируем SPARQL DELETE запрос для удаления всех vad:includes
            const deleteQuery = `
DELETE WHERE {
    GRAPH <${trigUri}> {
        <${executorGroupUri}> <http://example.org/vad#includes> ?executor .
    }
}`;

            try {
                // Применяем запрос через существующую функцию
                if (typeof applyTripleToRdfInput === 'function') {
                    await applyTripleToRdfInput(deleteQuery, 'delete');
                    console.log(`Deleted all executors from ${prefixedGroup} in ${prefixedTrig}`);

                    // issue #338: Восстанавливаем selectedTrigUri после applyTripleToRdfInput,
                    // так как она сбрасывает selectedTrigUri в null (issue #274).
                    // Это позволяет refreshVisualization корректно отобразить текущую схему.
                    selectedTrigUri = trigUri;

                    // Обновляем визуализацию
                    if (typeof refreshVisualization === 'function') {
                        refreshVisualization();
                    }
                } else {
                    alert('Функция удаления недоступна');
                }
            } catch (error) {
                console.error('Error deleting executors:', error);
                alert('Ошибка при удалении исполнителей: ' + error.message);
            }
        }
