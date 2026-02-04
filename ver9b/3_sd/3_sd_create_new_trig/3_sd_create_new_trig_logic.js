// issue #232: Модуль создания нового TriG контейнера
// Содержит функции для работы с модальным окном New TriG

/**
 * issue #286: SPARQL-запрос для получения концептов процессов БЕЗ существующего VADProcessDia.
 * Использует FILTER NOT EXISTS для фильтрации процессов, у которых уже есть схема.
 *
 * Алгоритм:
 * 1. Выбираем процессы из ptree с типом TypeProcess
 * 2. Исключаем те, у которых есть hasTrig на граф типа VADProcessDia
 */
const SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA = `
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
            FILTER NOT EXISTS {
                ?process vad:hasTrig ?trig .
                GRAPH ?trig {
                    ?trig rdf:type vad:VADProcessDia .
                }
            }
        }
    }
`;

/**
 * Открывает модальное окно создания нового TriG
 * Вызывается из Smart Design панели
 * issue #286: SPARQL-driven фильтрация процессов через FILTER NOT EXISTS
 */
async function openNewTrigModal() {
    const modal = document.getElementById('new-trig-modal');
    if (!modal) {
        console.error('[3_sd_create_new_trig] Модальное окно new-trig-modal не найдено');
        return;
    }

    // Заполняем список концептов процессов
    const processSelect = document.getElementById('new-trig-process-concept');
    if (processSelect) {
        processSelect.innerHTML = '<option value="">-- Выберите концепт процесса --</option>';

        // issue #286: SPARQL-driven Programming - фильтрация через SPARQL запрос
        // Используем funSPARQLvaluesComunica для поддержки FILTER NOT EXISTS
        if (typeof funSPARQLvaluesComunica === 'function') {
            try {
                const filteredConcepts = await funSPARQLvaluesComunica(
                    SPARQL_PROCESSES_WITHOUT_VADPROCESSDIA,
                    'process'
                );

                console.log(`[3_sd_create_new_trig] issue #286: SPARQL returned ${filteredConcepts.length} processes without VADProcessDia`);

                filteredConcepts.forEach(concept => {
                    const option = document.createElement('option');
                    option.value = concept.uri;
                    option.textContent = concept.label || concept.uri;
                    processSelect.appendChild(option);
                });
            } catch (error) {
                console.error('[3_sd_create_new_trig] SPARQL query error:', error);
            }
        } else {
            console.error('[3_sd_create_new_trig] funSPARQLvaluesComunica not available');
        }
    }

    modal.style.display = 'block';
}

/**
 * Закрывает модальное окно создания нового TriG
 */
function closeNewTrigModal() {
    const modal = document.getElementById('new-trig-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Обновляет поля формы при выборе концепта процесса
 */
function updateNewTrigFields() {
    const processSelect = document.getElementById('new-trig-process-concept');
    const trigIdInput = document.getElementById('new-trig-id');
    const trigLabelInput = document.getElementById('new-trig-label');
    
    if (!processSelect || !trigIdInput || !trigLabelInput) return;
    
    const processUri = processSelect.value;
    if (!processUri) {
        trigIdInput.value = '';
        trigLabelInput.value = '';
        return;
    }
    
    // Извлекаем ID процесса
    const processId = typeof getPrefixedName === 'function' 
        ? getPrefixedName(processUri, currentPrefixes).replace('vad:', '')
        : processUri.split('#').pop();
    
    const processLabel = processSelect.options[processSelect.selectedIndex].textContent;
    
    trigIdInput.value = `t_${processId}`;
    trigLabelInput.value = `Схема процесса ${processLabel}`;
}

/**
 * Создаёт SPARQL запрос для нового TriG контейнера
 * issue #280: Исправлено - все триплеты размещены в именованных графах
 */
function createNewTrig() {
    const processSelect = document.getElementById('new-trig-process-concept');
    const trigIdInput = document.getElementById('new-trig-id');
    const trigLabelInput = document.getElementById('new-trig-label');

    if (!processSelect || !processSelect.value) {
        alert('Выберите концепт процесса');
        return;
    }

    const processUri = processSelect.value;
    const trigId = trigIdInput ? trigIdInput.value : '';
    const trigLabel = trigLabelInput ? trigLabelInput.value : '';

    if (!trigId) {
        alert('ID TriG не может быть пустым');
        return;
    }

    // issue #280: Получаем prefixed name для процесса
    const processPrefixed = typeof getPrefixedName === 'function'
        ? getPrefixedName(processUri, currentPrefixes)
        : '<' + processUri + '>';

    // issue #280: Формируем SPARQL INSERT запрос
    // Все триплеты размещены внутри соответствующих именованных графов:
    // - Метаданные TriG (rdf:type, rdfs:label, vad:hasParentObj) внутри нового графа vad:${trigId}
    // - Связь концепта процесса со схемой (vad:hasTrig) в графе vad:ptree
    const sparqlQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Создание нового TriG контейнера (VADProcessDia)
# issue #280: Все триплеты размещены в именованных графах
INSERT DATA {
    # Связь концепта процесса со схемой в ptree
    GRAPH vad:ptree {
        ${processPrefixed} vad:hasTrig vad:${trigId} .
    }

    # Метаданные и содержимое нового TriG
    GRAPH vad:${trigId} {
        vad:${trigId} rdf:type vad:VADProcessDia .
        vad:${trigId} rdfs:label "${trigLabel}" .
        vad:${trigId} vad:hasParentObj ${processPrefixed} .
    }
}`;

    // Выводим в Result in SPARQL
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }

    closeNewTrigModal();
}
