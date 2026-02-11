# Документация функции deleteIndividProcessFromTrig

## Общие сведения

| Параметр | Значение |
|----------|----------|
| **Файл** | `ver9d/12_method/12_method_logic.js` |
| **Issue** | [#336](https://github.com/bpmbpm/rdf-grapher/issues/336), [#370](https://github.com/bpmbpm/rdf-grapher/issues/370) |
| **Модуль** | 12_method (Методы объектов диаграммы) |
| **Версия** | ver9d |

## Назначение

Функция `deleteIndividProcessFromTrig` удаляет индивид процесса из указанного TriG-контейнера (схемы процесса). Она вызывается при выборе метода "Delete Individ Process" в выпадающем меню кнопки "Методы" в окне "Свойство объекта диаграммы".

## Сигнатура

```javascript
function deleteIndividProcessFromTrig(processUri, trigUri)
```

### Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `processUri` | `string` | URI индивида процесса, который нужно удалить |
| `trigUri` | `string` | URI TriG-контейнера (схемы процесса), из которого удаляется индивид |

### Возвращаемое значение

Функция не возвращает значение (`undefined`).

## Алгоритм работы

```
┌────────────────────────────────────────────────────────────────┐
│                  deleteIndividProcessFromTrig                   │
├────────────────────────────────────────────────────────────────┤
│ 1. Проверяем доступность функции openDeleteModal               │
│    │                                                           │
│    ├── ДА: openDeleteModal доступна                            │
│    │   │                                                       │
│    │   ├── Преобразуем URI в prefixed формат (getPrefixedName) │
│    │   │   • processUri → prefixedProcessUri                   │
│    │   │   • trigUri → prefixedTrigUri                         │
│    │   │                                                       │
│    │   └── Вызываем openDeleteModal('individ', trigUri, procUri)│
│    │       с предустановленными значениями                     │
│    │                                                           │
│    └── НЕТ: openDeleteModal недоступна (FALLBACK)              │
│        │                                                       │
│        ├── Показываем диалог подтверждения (confirm)           │
│        │                                                       │
│        ├── Пользователь подтвердил?                            │
│        │   │                                                   │
│        │   ├── ДА: Вызываем performDeleteIndividProcess()      │
│        │   │       (прямое удаление через SPARQL DELETE)       │
│        │   │                                                   │
│        │   └── НЕТ: Операция отменена                          │
│        │                                                       │
│        └── Конец                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Подробное описание

### Основной путь (openDeleteModal доступна)

Когда функция `openDeleteModal` доступна (определена в модуле `3_sd_del_concept_individ`), функция делегирует удаление существующему модальному окну удаления:

```javascript
if (typeof openDeleteModal === 'function') {
    const prefixedProcessUri = getPrefixedName(processUri, currentPrefixes);
    const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);
    openDeleteModal('individ', prefixedTrigUri, prefixedProcessUri);
}
```

Это обеспечивает единообразие интерфейса — пользователь видит тот же диалог, что и при использовании кнопки "Del Concept\Individ\Schema" в окне Smart Design.

### Fallback: выполнение удаления напрямую через SPARQL

Комментарий в коде: `// Fallback: выполняем удаление напрямую через SPARQL`

**Что это значит:**

Fallback (резервный механизм) — это альтернативный путь выполнения, который активируется, когда основной механизм недоступен. В данном случае:

1. **Основной механизм**: использование модального окна `openDeleteModal` из модуля `3_sd_del_concept_individ`
2. **Fallback**: прямое удаление через SPARQL DELETE без промежуточного модального окна

**Когда Fallback применяется:**
- Когда функция `openDeleteModal` не определена (например, модуль не загружен)
- Когда есть проблемы с инициализацией модального окна

**Реализация Fallback:**

```javascript
} else {
    // Fallback: выполняем удаление напрямую через SPARQL
    const confirmMsg = `Удалить индивид процесса ${getPrefixedName(processUri, currentPrefixes)} из схемы ${getPrefixedName(trigUri, currentPrefixes)}?`;
    if (confirm(confirmMsg)) {
        performDeleteIndividProcess(processUri, trigUri);
    }
}
```

### Функция performDeleteIndividProcess

Выполняет фактическое удаление через SPARQL DELETE:

```javascript
async function performDeleteIndividProcess(processUri, trigUri) {
    const deleteQuery = `
DELETE WHERE {
    GRAPH <${trigUri}> {
        <${processUri}> ?p ?o .
    }
}`;
    // ... применение запроса
}
```

**Запрос удаляет:**
- Все триплеты, где `processUri` является субъектом
- Только в контексте указанного TriG-графа

## Где ещё применяется Fallback

Паттерн Fallback широко используется в кодовой базе RDF Grapher для обеспечения надёжности:

### 1. Модуль 3_sd_del_concept_individ_logic.js

```javascript
function getProcessConceptsForDeletion() {
    // Пробуем через funSPARQLvalues (основной путь)
    if (typeof funSPARQLvalues === 'function') {
        concepts = funSPARQLvalues(sparqlQuery, 'concept');
    }
    // Fallback на ручной поиск
    if (concepts.length === 0) {
        concepts = getConceptsManual(...);
    }
}
```

### 2. Модуль 3_sd_create_new_individ_logic.js

```javascript
function getTrigsForIndivid() {
    // Основной путь: SPARQL через funSPARQLvalues
    if (typeof funSPARQLvalues === 'function') {
        const results = funSPARQLvalues(sparqlQuery, 'trig');
        // ...
    }
    // Fallback: ручной перебор quadstore
    if (trigs.length === 0) {
        if (currentStore) {
            const quads = currentStore.getQuads(null, null, null, null);
            // ... ручной поиск
        }
    }
}
```

### 3. Модуль vadlib_sparql.js

```javascript
function funSPARQLvalues(sparqlQuery, mainVar) {
    // Основной путь: Comunica SPARQL engine
    // Fallback: ручной перебор квадов при ошибке парсинга
}
```

### Зачем нужен Fallback

1. **Отказоустойчивость**: приложение продолжает работать даже при частичной недоступности модулей
2. **Обратная совместимость**: поддержка разных конфигураций загрузки модулей
3. **Graceful degradation**: снижение функциональности вместо полного отказа
4. **Отладка**: позволяет тестировать отдельные модули изолированно

## Используемые функции и модули

| Функция | Модуль | Описание |
|---------|--------|----------|
| `openDeleteModal` | 3_sd_del_concept_individ_logic.js | Открывает модальное окно удаления (если доступна) |
| `getPrefixedName` | vadlib_logic.js | Преобразует полный URI в prefixed формат |
| `performDeleteIndividProcess` | 12_method_logic.js | Выполняет удаление через SPARQL DELETE |
| `applyTripleToRdfInput` | 4_resSPARQL_ui.js | Применяет SPARQL запрос к quadstore |
| `refreshVisualization` | 5_publisher_logic.js | Обновляет визуализацию диаграммы |

## Связанные функции

| Функция | Описание |
|---------|----------|
| `executeObjectMethod` | Диспетчер методов объектов |
| `deleteIndividExecutorFromTrig` | Аналогичная функция для удаления исполнителей |
| `addHasNextDia` | Редактирование vad:hasNext (issue #370) |
| `toggleMethodsDropdown` | Показ/скрытие выпадающего списка методов |
| `getMethodsForType` | Получение списка методов для типа объекта |

## Пример использования

```javascript
// Вызывается из executeObjectMethod при выборе "Delete Individ Process"
executeObjectMethod('deleteIndividProcess', 'http://example.org/vad#p1.1', 'http://example.org/vad#t_p1');

// Внутренний вызов
deleteIndividProcessFromTrig(
    'http://example.org/vad#p1.1',  // processUri
    'http://example.org/vad#t_p1'    // trigUri
);
```

## Связанные issue

- **#336**: Реализация метода Delete Individ Process
- **#338**: Исправление: восстановление selectedTrigUri после applyTripleToRdfInput
- **#370**: Документация функции + добавление метода Add hasNext Dia

## Примечания

1. Функция не удаляет связанную ExecutorGroup — это выполняется отдельно при необходимости
2. После удаления автоматически вызывается `refreshVisualization()` для обновления диаграммы
3. Значение `selectedTrigUri` восстанавливается после применения SPARQL (issue #338)
