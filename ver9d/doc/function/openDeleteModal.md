# Документация функции openDeleteModal

## Общие сведения

| Параметр | Значение |
|----------|----------|
| **Файл** | `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js` |
| **Issue** | [#372](https://github.com/bpmbpm/rdf-grapher/issues/372), [#311](https://github.com/bpmbpm/rdf-grapher/issues/311) |
| **Модуль** | 3_sd_del_concept_individ (Удаление концептов и индивидов) |
| **Версия** | ver9d |

## Назначение

Функция `openDeleteModal` открывает модальное окно удаления концепта/индивида с предустановленными значениями. Она является точкой интеграции между модулем методов (12_method) и модулем удаления (3_sd_del_concept_individ), реализуя **SPARQL-Driven подход**.

## issue #372: SPARQL-Driven подход

Функция реализует унифицированный интерфейс удаления:
- Вызывается из модуля методов (12_method) при выборе "Delete Individ Process" или "Delete Individ Executor"
- Автоматически подставляет значения схемы (TriG) и индивида из контекста диаграммы
- Пользователь получает готовый SPARQL-запрос для применения через стандартную процедуру

## Сигнатура

```javascript
function openDeleteModal(type, prefixedTrigUri, prefixedIndividUri)
```

### Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | `string` | Тип удаления: `'individProcess'` для индивида процесса, `'individExecutor'` для индивида исполнителя. **Только эти два значения допустимы.** |
| `prefixedTrigUri` | `string` | Prefixed URI схемы (TriG), например `'vad:t_p1'` |
| `prefixedIndividUri` | `string` | Prefixed URI индивида, например `'vad:p1.1'` |

**Важно:** Параметр `type` должен быть строго `'individProcess'` или `'individExecutor'` (в стиле camelCase). Другие значения приведут к ошибке.

### Возвращаемое значение

Функция не возвращает значение (`undefined`). Результат работы — открытое модальное окно с заполненными полями.

## Алгоритм работы

```
┌────────────────────────────────────────────────────────────────┐
│                      openDeleteModal                            │
│                   (SPARQL-Driven подход)                        │
├────────────────────────────────────────────────────────────────┤
│ 1. Проверка данных quadstore                                   │
│    │                                                           │
│    └── if (!currentStore || currentStore.size === 0)           │
│        → alert('Данные quadstore пусты...')                    │
│        → return                                                │
│                                                                │
│ 2. Инициализация состояния модуля                              │
│    │                                                           │
│    └── delConceptState = { isOpen: true, ... }                 │
│                                                                │
│ 3. Проверка корректности параметра type                        │
│    │                                                           │
│    └── if (type !== 'individProcess' && type !== 'individExecutor')│
│        → alert('Неверный тип удаления...')                     │
│        → return                                                │
│                                                                │
│ 4. Определение типа операции                                   │
│    │                                                           │
│    ├── type === 'individExecutor'                              │
│    │   → INDIVID_EXECUTOR_IN_SCHEMA                            │
│    │                                                           │
│    └── type === 'individProcess'                               │
│        → INDIVID_PROCESS_IN_SCHEMA                             │
│                                                                │
│ 5. Преобразование prefixed URI в полные URI                    │
│    │                                                           │
│    ├── expandPrefixedName(prefixedTrigUri, currentPrefixes)    │
│    └── expandPrefixedName(prefixedIndividUri, currentPrefixes) │
│                                                                │
│ 6. Построение формы модального окна                            │
│    │                                                           │
│    ├── buildDelConceptForm(config, operationType)              │
│    └── initializeDelDropdowns(operationType)                   │
│                                                                │
│ 7. Автоматическое заполнение dropdowns (setTimeout)            │
│    │                                                           │
│    ├── Выбор TriG в dropdown «del-trig-select»                 │
│    │   → onDelTrigSelectForIndivid()                           │
│    │                                                           │
│    └── Выбор индивида в dropdown «del-individ-in-schema-select»│
│        → onDelIndividInSchemaSelect()                          │
│                                                                │
│ 8. Отображение модального окна                                 │
│    │                                                           │
│    ├── resetModalPosition('del-concept-modal')                 │
│    └── modal.style.display = 'block'                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Подробное описание

### Код функции

```javascript
function openDeleteModal(type, prefixedTrigUri, prefixedIndividUri) {
    // Проверяем наличие данных
    if (!currentStore || currentStore.size === 0) {
        alert('Данные quadstore пусты. Загрузите пример данных.\n\nQuadstore is empty. Load example data.');
        return;
    }

    // issue #382: Проверяем корректность параметра type (только новые обозначения)
    if (type !== 'individProcess' && type !== 'individExecutor') {
        console.error(`openDeleteModal: неверный тип "${type}". Используйте 'individProcess' или 'individExecutor'.`);
        alert(`Неверный тип удаления: "${type}".\nИспользуйте 'individProcess' или 'individExecutor'.\n\nInvalid deletion type: "${type}".\nUse 'individProcess' or 'individExecutor'.`);
        return;
    }

    // Очищаем предыдущее состояние
    delConceptState = {
        isOpen: true,
        selectedOperation: null,
        selectedConcept: null,
        selectedTrig: null,
        selectedIndividuals: [],
        foundIndividuals: [],
        foundTrigs: [],
        validationErrors: [],
        intermediateSparql: ''
    };
    delIntermediateSparqlQueries = [];

    const modal = document.getElementById('del-concept-modal');
    if (!modal) {
        console.error('Модальное окно del-concept-modal не найдено');
        return;
    }

    // Сбрасываем форму
    resetDelConceptForm();

    // issue #382: Выбираем тип операции в зависимости от параметра type
    // Используем только новые обозначения: individProcess, individExecutor
    const operationType = (type === 'individExecutor')
        ? DEL_OPERATION_TYPES.INDIVID_EXECUTOR_IN_SCHEMA
        : DEL_OPERATION_TYPES.INDIVID_PROCESS_IN_SCHEMA;

    const operationSelect = document.getElementById('del-concept-operation');
    if (operationSelect) {
        operationSelect.value = operationType;
    }

    // Устанавливаем состояние
    delConceptState.selectedOperation = operationType;

    // Преобразуем prefixed URI в полные URI
    const trigUri = expandPrefixedName(prefixedTrigUri, currentPrefixes);
    const individUri = expandPrefixedName(prefixedIndividUri, currentPrefixes);

    delConceptState.selectedTrig = trigUri;

    // Строим форму для выбранной операции
    const config = DEL_CONCEPT_CONFIG[operationType];
    buildDelConceptForm(config, operationType);

    // Инициализируем dropdowns
    initializeDelDropdowns(operationType);

    // После рендеринга формы — заполняем dropdowns предустановленными значениями
    setTimeout(() => {
        // Выбираем TriG
        const trigSelect = document.getElementById('del-trig-select');
        if (trigSelect) {
            trigSelect.value = trigUri;
            // Эмулируем событие выбора TriG
            onDelTrigSelectForIndivid();

            // После загрузки индивидов — выбираем нужный индивид
            setTimeout(() => {
                const individSelect = document.getElementById('del-individ-in-schema-select');
                if (individSelect) {
                    individSelect.value = individUri;
                    // Эмулируем событие выбора индивида
                    onDelIndividInSchemaSelect();
                }
            }, 100);
        }
    }, 50);

    // Сбрасываем позицию модального окна
    if (typeof resetModalPosition === 'function') {
        resetModalPosition('del-concept-modal');
    }

    modal.style.display = 'block';

    if (typeof updateSmartDesignFieldsState === 'function') {
        updateSmartDesignFieldsState();
    }
}
```

### Вспомогательная функция expandPrefixedName

```javascript
function expandPrefixedName(prefixedUri, prefixes) {
    if (!prefixedUri) return prefixedUri;

    // Если уже полный URI
    if (prefixedUri.startsWith('http://') || prefixedUri.startsWith('https://')) {
        return prefixedUri;
    }

    // Разбираем prefix:localName
    const colonIndex = prefixedUri.indexOf(':');
    if (colonIndex === -1) return prefixedUri;

    const prefix = prefixedUri.substring(0, colonIndex);
    const localName = prefixedUri.substring(colonIndex + 1);

    // Ищем namespace для prefix
    if (prefixes && prefixes[prefix]) {
        return prefixes[prefix] + localName;
    }

    // Стандартные префиксы
    const standardPrefixes = {
        'vad': 'http://example.org/vad#',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'owl': 'http://www.w3.org/2002/07/owl#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#'
    };

    if (standardPrefixes[prefix]) {
        return standardPrefixes[prefix] + localName;
    }

    return prefixedUri;
}
```

## Типы операций удаления

| Параметр `type` | Константа операции | Описание |
|-----------------|-------------------|----------|
| `'individProcess'` | `INDIVID_PROCESS_IN_SCHEMA` | Удаление индивида процесса в конкретной схеме |
| `'individExecutor'` | `INDIVID_EXECUTOR_IN_SCHEMA` | Удаление индивида исполнителя в конкретной схеме |

**Примечание:** Только значения `'individProcess'` и `'individExecutor'` являются допустимыми. Другие значения (в том числе устаревшие `'individ'` и `'executor'`) приведут к ошибке.

## Используемые функции и модули

| Функция | Модуль | Описание |
|---------|--------|----------|
| `resetDelConceptForm` | 3_sd_del_concept_individ_logic.js | Сбрасывает форму модального окна |
| `buildDelConceptForm` | 3_sd_del_concept_individ_logic.js | Строит HTML-форму для выбранной операции |
| `initializeDelDropdowns` | 3_sd_del_concept_individ_logic.js | Заполняет dropdowns данными |
| `onDelTrigSelectForIndivid` | 3_sd_del_concept_individ_logic.js | Обработчик выбора TriG |
| `onDelIndividInSchemaSelect` | 3_sd_del_concept_individ_logic.js | Обработчик выбора индивида |
| `expandPrefixedName` | 3_sd_del_concept_individ_logic.js | Раскрывает prefixed URI в полный URI |
| `resetModalPosition` | (общий) | Сбрасывает позицию модального окна |
| `updateSmartDesignFieldsState` | 3_sd_ui.js | Обновляет состояние полей Smart Design |

## Связанные функции

| Функция | Описание |
|---------|----------|
| `openDelConceptModal` | Открывает модальное окно без предустановленных значений (по кнопке "Del Concept\Individ\Schema") |
| `deleteIndividProcessFromTrig` | Вызывает `openDeleteModal('individProcess', ...)` для удаления индивида процесса |
| `deleteIndividExecutorFromTrig` | Вызывает `openDeleteModal('individExecutor', ...)` для удаления индивида исполнителя |
| `closeDelConceptModal` | Закрывает модальное окно |

## Пример использования

```javascript
// Вызов из deleteIndividProcessFromTrig (12_method_logic.js)
function deleteIndividProcessFromTrig(processUri, trigUri) {
    const prefixedProcessUri = getPrefixedName(processUri, currentPrefixes);
    const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

    // issue #382: Используем новое обозначение individProcess вместо individ
    openDeleteModal('individProcess', prefixedTrigUri, prefixedProcessUri);
}

// Вызов из deleteIndividExecutorFromTrig (12_method_logic.js)
function deleteIndividExecutorFromTrig(executorGroupUri, trigUri) {
    const prefixedUri = getPrefixedName(executorGroupUri, currentPrefixes);
    const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

    // issue #382: Используем новое обозначение individExecutor вместо executor
    openDeleteModal('individExecutor', prefixedTrigUri, prefixedUri);
}

// Прямой вызов
openDeleteModal(
    'individProcess',    // type - удаление индивида процесса
    'vad:t_p1',          // prefixedTrigUri - схема процесса
    'vad:p1.1'           // prefixedIndividUri - индивид процесса
);

// Результат: открывается модальное окно «Удалить индивид процесса в схеме»
// с предзаполненными значениями:
// - Схема: vad:t_p1
// - Индивид: vad:p1.1
```

## Генерируемый SPARQL запрос

После выбора всех значений и нажатия кнопки "Создать запрос на удаление" генерируется SPARQL запрос:

### Для индивида процесса (individProcess)

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

# Удаление индивида процесса vad:p1.1 из схемы vad:t_p1

# 1. Удаление всех исходящих триплетов индивида
DELETE WHERE {
    GRAPH vad:t_p1 {
        vad:p1.1 ?p ?o .
    }
}
;

# 2. Удаление объекта ExecutorGroup (если есть)
DELETE WHERE {
    GRAPH vad:t_p1 {
        ?eg vad:hasExecutor vad:p1.1 .
        ?eg ?p ?o .
    }
}
;

# 3. Удаление входящих связей vad:hasNext
DELETE WHERE {
    GRAPH vad:t_p1 {
        ?other vad:hasNext vad:p1.1 .
    }
}
```

### Для индивида исполнителя (individExecutor)

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

# Удаление индивида исполнителя vad:r1 из ExecutorGroup в схеме vad:t_p1

DELETE WHERE {
    GRAPH vad:t_p1 {
        ?eg vad:includes vad:r1 .
    }
}
```

## Связанные issue

- **#372**: SPARQL-Driven подход — вызов модального окна из методов объекта
- **#311**: Удаление индивида процесса/исполнителя в конкретной схеме
- **#336**: Реализация метода Delete Individ Process

## История изменений

| Версия | Issue | Описание |
|--------|-------|----------|
| v1 | #372 | Создание функции для SPARQL-Driven интеграции с 12_method |

## Примечания

1. Функция использует `setTimeout` для асинхронного заполнения dropdowns — это необходимо для корректного рендеринга DOM
2. Параметры передаются в prefixed-формате для удобства отображения в UI
3. Функция является частью SPARQL-Driven архитектуры и не выполняет удаление напрямую
4. SPARQL запрос генерируется только после нажатия кнопки "Создать запрос на удаление"

---

*Документ создан: 2026-02-12*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.0*
*Ссылки на issues: #372, #311, #336*
