# Анализ замены Fallback на SPARQL-Driven подход

## Обзор

Документ описывает замены JavaScript fallback на SPARQL-Driven подход, выполненные в рамках issue #372.

## Принципы SPARQL-Driven подхода

1. **Декларативный SPARQL вместо императивного JavaScript**
2. **Отсутствие fallback на ручной перебор квадов**
3. **Прозрачность: пользователь видит SPARQL запрос**
4. **Контроль: пользователь применяет запрос явно**

## Выполненные замены

### 1. Модуль 12_method (Delete Individ Process)

**Файл:** `ver9d/12_method/12_method_logic.js`

#### Было (v1):
```javascript
function deleteIndividProcessFromTrig(processUri, trigUri) {
    if (typeof openDeleteModal === 'function') {
        openDeleteModal('individ', prefixedTrigUri, prefixedProcessUri);
    } else {
        // Fallback: выполняем удаление напрямую через SPARQL
        if (confirm(confirmMsg)) {
            performDeleteIndividProcess(processUri, trigUri);
        }
    }
}
```

#### Стало (v2 — SPARQL-Driven):
```javascript
function deleteIndividProcessFromTrig(processUri, trigUri) {
    // issue #372: SPARQL-Driven подход — всегда используем модальное окно
    const prefixedProcessUri = getPrefixedName(processUri, currentPrefixes);
    const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);
    openDeleteModal('individ', prefixedTrigUri, prefixedProcessUri);
}
```

**Удалены функции:**
- `performDeleteIndividProcess()` — прямое удаление через SPARQL
- `performDeleteIndividExecutor()` — прямое удаление исполнителей

**Причина:** Удаление теперь выполняется через модальное окно, которое генерирует SPARQL для просмотра и применения пользователем.

---

### 2. Модуль 11_reasoning (Semantic Reasoning)

**Файл:** `ver9d/11_reasoning/11_reasoning_logic.js`

#### Было:
```javascript
async function performInference(store, rules) {
    if (forceSemanticReasoning) {
        try {
            return await performSemanticReasoning(store);
        } catch (error) {
            console.warn('Falling back to JavaScript implementation');
            return performInferenceFallback(store);
        }
    }
    // ... другие fallback варианты
}
```

#### Стало (SPARQL-Driven):
```javascript
async function performInference(store, rules) {
    // issue #372: SPARQL-Driven подход — без JavaScript fallback
    console.log('performInference: Using SPARQL-Driven reasoning');
    try {
        return await performSemanticReasoning(store);
    } catch (error) {
        console.error('SPARQL reasoning failed. No fallback to JavaScript.');
        return [];
    }
}
```

**Удалена функция:**
- `performInferenceFallback()` — JavaScript-реализация вычисления processSubtype

**Причина:** Вычисление Virtual TriG должно выполняться исключительно через SPARQL CONSTRUCT.

---

### 3. Модуль 3_sd_del_concept_individ

**Файл:** `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js`

#### Функции с удалённым fallback:

| Функция | Описание замены |
|---------|-----------------|
| `getProcessConceptsForDeletion()` | Удалён fallback на `getConceptsManual()` |
| `getExecutorConceptsForDeletion()` | Удалён fallback на `getConceptsManual()` |
| `checkProcessSchema()` | Удалён fallback на ручной поиск через `currentStore.getQuads()` |
| `checkChildrenElements()` | Удалён fallback на ручной поиск |
| `checkExecutorUsage()` | Удалён fallback на ручной поиск |
| `getAllTrigs()` | Удалён fallback на ручной поиск |

#### Пример изменения:
```javascript
// Было:
function getProcessConceptsForDeletion() {
    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }
    // Fallback на ручной поиск
    if (concepts.length === 0) {
        concepts = getConceptsManual('http://example.org/vad#TypeProcess', ...);
    }
}

// Стало:
function getProcessConceptsForDeletion() {
    // issue #372: SPARQL-Driven подход — только funSPARQLvalues
    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    } else {
        console.error('funSPARQLvalues not available');
    }
}
```

**Добавлена функция:**
- `openDeleteModal(type, prefixedTrigUri, prefixedIndividUri)` — открытие модального окна с предустановленными значениями

---

## Сводная таблица изменений

| Модуль | Файл | Удалённые fallback | Новый подход |
|--------|------|-------------------|--------------|
| 12_method | 12_method_logic.js | `performDeleteIndividProcess`, `performDeleteIndividExecutor` | Модальное окно → SPARQL |
| 11_reasoning | 11_reasoning_logic.js | `performInferenceFallback` | SPARQL CONSTRUCT |
| 3_sd_del | 3_sd_del_concept_individ_logic.js | `getConceptsManual` fallback, ручной поиск | `funSPARQLvalues` |

## Преимущества SPARQL-Driven подхода

1. **Прозрачность**: пользователь видит что происходит
2. **Контроль**: пользователь подтверждает операцию
3. **Единообразие**: все операции через SPARQL
4. **Отладка**: легко отследить проблемы в запросах
5. **Расширяемость**: легко добавить новые запросы
6. **Меньше кода**: нет дублирования логики

## Требования к среде выполнения

После удаления fallback требуется:

1. **Comunica**: для выполнения SPARQL запросов
2. **funSPARQLvalues**: синхронная функция выполнения SELECT
3. **funSPARQLvaluesComunica**: асинхронная функция для сложных запросов

Если эти компоненты недоступны, операции не выполняются и выводится сообщение об ошибке.

## Миграция

При обновлении на версию с SPARQL-Driven подходом:

1. Убедитесь, что Comunica загружен (`comunica-browser.js`)
2. Проверьте доступность `funSPARQLvalues`
3. Загрузите технологические данные (`vad-basic-ontology_tech_Appendix.trig`)

## Связанные документы

- [deleteIndividProcessFromTrig.md](../function/deleteIndividProcessFromTrig.md) — новый алгоритм
- [sparql-driven-programming.md](../../requirements/sparql-driven-programming_min1.md) — концепция подхода
