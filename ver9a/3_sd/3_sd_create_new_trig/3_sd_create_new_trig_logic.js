// issue #232: Модуль создания нового TriG контейнера
// Содержит функции для работы с модальным окном New TriG

/**
 * Открывает модальное окно создания нового TriG
 * Вызывается из Smart Design панели
 */
function openNewTrigModal() {
    const modal = document.getElementById('new-trig-modal');
    if (!modal) {
        console.error('[3_sd_create_new_trig] Модальное окно new-trig-modal не найдено');
        return;
    }
    
    // Заполняем список концептов процессов
    const processSelect = document.getElementById('new-trig-process-concept');
    if (processSelect) {
        processSelect.innerHTML = '<option value="">-- Выберите концепт процесса --</option>';
        
        // Получаем концепты процессов из ptree
        if (typeof funSPARQLvalues === 'function') {
            const concepts = funSPARQLvalues(`
                SELECT ?process ?label WHERE {
                    GRAPH vad:ptree {
                        ?process rdf:type vad:TypeProcess .
                        ?process rdfs:label ?label .
                    }
                }
            `, 'process');
            
            concepts.forEach(concept => {
                const option = document.createElement('option');
                option.value = concept.uri;
                option.textContent = concept.label || concept.uri;
                processSelect.appendChild(option);
            });
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
    
    // Формируем SPARQL INSERT запрос
    const sparqlQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Создание нового TriG контейнера (VADProcessDia)
INSERT DATA {
    # Метаданные TriG в дефолтном графе
    vad:${trigId} rdf:type vad:VADProcessDia .
    vad:${trigId} rdfs:label "${trigLabel}" .
    
    # Связь концепта процесса со схемой в ptree
    GRAPH vad:ptree {
        ${typeof getPrefixedName === 'function' ? getPrefixedName(processUri, currentPrefixes) : '<' + processUri + '>'} vad:hasTrig vad:${trigId} .
    }
    
    # Пустой граф для нового TriG
    GRAPH vad:${trigId} {
    }
}`;
    
    // Выводим в Result in SPARQL
    const resultTextarea = document.getElementById('result-sparql-query');
    if (resultTextarea) {
        resultTextarea.value = sparqlQuery;
    }
    
    closeNewTrigModal();
}
