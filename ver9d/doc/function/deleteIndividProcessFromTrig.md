# Документация функции deleteIndividProcessFromTrig

## Общие сведения

| Параметр | Значение |
|----------|----------|
| **Файл** | `ver9d/12_method/12_method_logic.js` |
| **Issue** | [#336](https://github.com/bpmbpm/rdf-grapher/issues/336), [#370](https://github.com/bpmbpm/rdf-grapher/issues/370), [#372](https://github.com/bpmbpm/rdf-grapher/issues/372) |
| **Модуль** | 12_method (Методы объектов диаграммы) |
| **Версия** | ver9d |

## Назначение

Функция `deleteIndividProcessFromTrig` удаляет индивид процесса из указанного TriG-контейнера (схемы процесса). Она вызывается при выборе метода "Delete Individ Process" в выпадающем меню кнопки "Методы" в окне "Свойство объекта диаграммы".

## issue #372: SPARQL-Driven подход

Начиная с issue #372, функция реализует **SPARQL-Driven подход** без JavaScript fallback:
- Вызывается окно «Удалить индивид процесса в схеме» (аналогично Add hasNext Dia)
- Значения «Схема процесса» и «Индивид процесса» подставляются автоматически
- Пользователь получает SPARQL-запрос для применения через стандартную процедуру

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

## Алгоритм работы (issue #372)

```
┌────────────────────────────────────────────────────────────────┐
│                  deleteIndividProcessFromTrig                   │
│                  (SPARQL-Driven подход)                         │
├────────────────────────────────────────────────────────────────┤
│ 1. Преобразование URI в prefixed формат                        │
│    │                                                           │
│    ├── processUri → prefixedProcessUri (getPrefixedName)       │
│    └── trigUri → prefixedTrigUri (getPrefixedName)             │
│                                                                │
│ 2. Вызов openDeleteModal с предустановленными значениями       │
│    │                                                           │
│    └── openDeleteModal('individProcess', prefixedTrigUri,      │
│                        prefixedProcessUri)                     │
│                                                                │
│ 3. Модальное окно «Удалить индивид процесса в схеме»           │
│    │                                                           │
│    ├── Автоматически выбирается тип операции                   │
│    │   «Удалить индивид процесса в схеме»                      │
│    │                                                           │
│    ├── Заполняется dropdown «Схема» значением trigUri          │
│    │                                                           │
│    └── Заполняется dropdown «Индивид» значением processUri     │
│                                                                │
│ 4. Генерация SPARQL DELETE запроса                             │
│    │                                                           │
│    └── Пользователь нажимает «Создать запрос на удаление»      │
│        │                                                       │
│        └── SPARQL запрос выводится в «Result in SPARQL»        │
│                                                                │
│ 5. Применение SPARQL через стандартную процедуру               │
│    │                                                           │
│    └── Пользователь нажимает «Применить» в Result in SPARQL    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Подробное описание

### SPARQL-Driven подход

Функция использует исключительно SPARQL-Driven подход:

```javascript
function deleteIndividProcessFromTrig(processUri, trigUri) {
    // issue #372: SPARQL-Driven подход — всегда используем модальное окно
    const prefixedProcessUri = getPrefixedName(processUri, currentPrefixes);
    const prefixedTrigUri = getPrefixedName(trigUri, currentPrefixes);

    // Вызываем окно удаления индивида в схеме с предустановленными значениями
    // issue #382: Используем новое обозначение individProcess вместо individ
    openDeleteModal('individProcess', prefixedTrigUri, prefixedProcessUri);
}
```

### Преимущества SPARQL-Driven подхода

1. **Единообразие интерфейса**: пользователь видит тот же диалог, что и при использовании кнопки "Del Concept\Individ\Schema"
2. **Прозрачность**: пользователь видит SPARQL запрос перед применением
3. **Контроль**: пользователь может модифицировать запрос при необходимости
4. **Безопасность**: удаление происходит только после явного подтверждения
5. **Отсутствие JavaScript fallback**: декларативный подход вместо императивного

### Генерируемый SPARQL запрос

Модальное окно генерирует запрос следующего вида:

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

## Используемые функции и модули

| Функция | Модуль | Описание |
|---------|--------|----------|
| `openDeleteModal` | 3_sd_del_concept_individ_logic.js | Открывает модальное окно с предустановленными значениями |
| `getPrefixedName` | vadlib_logic.js | Преобразует полный URI в prefixed формат |
| `expandPrefixedName` | 3_sd_del_concept_individ_logic.js | Раскрывает prefixed URI в полный URI |

## Связанные функции

| Функция | Описание |
|---------|----------|
| `executeObjectMethod` | Диспетчер методов объектов |
| `deleteIndividExecutorFromTrig` | Аналогичная функция для удаления исполнителей (также SPARQL-Driven) |
| `addHasNextDia` | Редактирование vad:hasNext (issue #370) — образец реализации |
| `openHasNextDiaModal` | Модальное окно редактирования hasNext |

## Пример использования

```javascript
// Вызывается из executeObjectMethod при выборе "Delete Individ Process"
executeObjectMethod('deleteIndividProcess', 'http://example.org/vad#p1.1', 'http://example.org/vad#t_p1');

// Внутренний вызов
deleteIndividProcessFromTrig(
    'http://example.org/vad#p1.1',  // processUri
    'http://example.org/vad#t_p1'    // trigUri
);

// Результат: открывается модальное окно «Удалить индивид процесса в схеме»
// с предзаполненными значениями:
// - Схема: vad:t_p1
// - Индивид: vad:p1.1
```

## Связанные issue

- **#336**: Реализация метода Delete Individ Process
- **#338**: Исправление: восстановление selectedTrigUri после applyTripleToRdfInput
- **#370**: Добавление метода Add hasNext Dia (образец SPARQL-Driven подхода)
- **#372**: Переработка на SPARQL-Driven подход, удаление JavaScript fallback

## История изменений

| Версия | Issue | Описание |
|--------|-------|----------|
| v1 | #336 | Первоначальная реализация с JavaScript fallback |
| v2 | #372 | Переработка на SPARQL-Driven подход, удаление fallback |

## Примечания

1. Функция не удаляет связанную ExecutorGroup напрямую — это выполняется через SPARQL запрос
2. После применения SPARQL автоматически вызывается `refreshVisualization()` для обновления диаграммы
3. Значение `selectedTrigUri` восстанавливается автоматически (issue #338)
4. JavaScript fallback удалён в issue #372 — только SPARQL-Driven подход
