<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/425 -->
<!-- Pull Request: https://github.com/bpmbpm/rdf-grapher/pull/426 -->
<!-- Дата: 2026-02-24 -->

# funConceptList_v2 — список концептов из TriG

## Назначение

Функция `funConceptList_v2` возвращает список доступных концептов из указанного TriG-графа в заданном квадсторе.

Результат — массив пар `{id, label}`. Если у концепта нет `rdfs:label`, в поле `label` возвращается пустая строка.

## Сигнатура

```javascript
async function funConceptList_v2(quadstore1, trig1, type1)
```

### Параметры

| Параметр    | Тип      | Описание |
|-------------|----------|----------|
| `quadstore1` | `N3.Store` | Квадстор с загруженными RDF-данными. Передаётся явно для поддержки нескольких квадсторов в будущем. |
| `trig1`     | `string` | Короткое имя TriG-графа: `'ptree'` или `'rtree'` (может быть расширено). Используется как `vad:<trig1>` в SPARQL-запросе. |
| `type1`     | `string` | URI типа концепта в формате curie (`vad:TypeProcess`, `vad:TypeExecutor`) или полного URI (`<http://example.org/vad#TypeProcess>`). |

### Возвращаемое значение

`Promise<Array<{id: string, label: string}>>` — массив объектов:

- `id` — полный URI концепта
- `label` — значение `rdfs:label`, или пустая строка если метка отсутствует

## SPARQL-запрос

Функция выполняет следующий SPARQL SELECT запрос через Comunica:

```sparql
prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
prefix vad: <http://example.org/vad#>
SELECT ?id_concept ?label_concept WHERE {
    GRAPH vad:<trig1> {
        ?id_concept rdf:type <type1> .
        OPTIONAL { ?id_concept rdfs:label ?label_concept . }
    }
}
```

Ключевые особенности запроса:
- `GRAPH vad:<trig1>` — ограничивает поиск конкретным именованным графом
- `OPTIONAL { ?id_concept rdfs:label ?label_concept }` — позволяет вернуть концепт, даже если у него нет метки
- Тип `type1` подставляется напрямую в текст запроса

## Расположение

Функция размещена в модуле:
```
ver9d/9_vadlib/vadlib_sparql_v2.js
```

Модуль `vadlib_sparql_v2.js` содержит функции, добавляемые по прямому указанию.

## Пример использования

```javascript
// Список концептов процессов из ptree
var items = await funConceptList_v2(currentStore, 'ptree', 'vad:TypeProcess');
// Результат: [{id: 'http://example.org/vad#p1', label: 'Процесс 1'}, ...]

// Список концептов исполнителей из rtree
var items = await funConceptList_v2(currentStore, 'rtree', 'vad:TypeExecutor');
// Результат: [{id: 'http://example.org/vad#Executor1', label: 'Исполнитель 1'}, ...]
```

## Соответствие trig1 и type1

| `trig1` | `type1` | Описание |
|---------|---------|----------|
| `'ptree'` | `vad:TypeProcess` | Концепты процессов из дерева процессов |
| `'rtree'` | `vad:TypeExecutor` | Концепты исполнителей из дерева исполнителей |

Номенклатура TriG может быть расширена в будущем без изменения сигнатуры функции.

---

## Замены funSPARQLvalues → funConceptList_v2

### Выполненные замены

В файле `ver9d/3_sd/3_sd_ui.js`, функция `updateSubjectsBySubjectType()`:

| № | Было | Стало | Комментарий |
|---|------|-------|-------------|
| 1 | `funSPARQLvalues(SPARQL_QUERIES.PROCESS_CONCEPTS_IN_PTREE, 'process')` | `await funConceptList_v2(currentStore, 'ptree', 'vad:TypeProcess')` | Для `ptree` в блоке `selectedType === 'vad:TypeProcess'` |
| 2 | `funSPARQLvalues(SPARQL_QUERIES.EXECUTOR_CONCEPTS_IN_RTREE, 'executor')` | `await funConceptList_v2(currentStore, 'rtree', 'vad:TypeExecutor')` | Для `rtree` в блоке `selectedType === 'vad:TypeExecutor'` |

Дополнительно:
- Функция `updateSubjectsBySubjectType()` стала `async` для поддержки `await`
- Формат отображения изменён с `"id (label)"` на `"id label"` (через пробел) для ptree и rtree

### Формат отображения в справочнике

**Было:** `id (label)` — через `formatDropdownDisplayText()`, использует скобки
**Стало:** `id label` — через пробел, без скобок

Пример:
- Было: `vad:p1 (Процесс 1 Изготовление скрепки)`
- Стало: `vad:p1 Процесс 1 Изготовление скрепки`

### Где funSPARQLvalues используется ещё

Функция `funSPARQLvalues` по-прежнему используется в следующих местах:

| Файл | Контекст | Запрос |
|------|----------|--------|
| `ver9d/3_sd/3_sd_ui.js` | `getProcessConceptsForHasNext()` | `SPARQL_QUERIES.PROCESS_CONCEPTS_IN_PTREE` |
| `ver9d/3_sd/3_sd_ui.js` | Другие справочники (не ptree/rtree) | Различные `SPARQL_QUERIES.*` |
| `ver9d/9_vadlib/vadlib_sparql.js` | Базовый синхронный движок | — |

### Варианты замены оставшихся вызовов funSPARQLvalues

По аналогии с выполненными заменами, другие вызовы `funSPARQLvalues` для получения концептов из именованных графов могут быть заменены на `funConceptList_v2`:

- Для концептов в ptree: `funConceptList_v2(currentStore, 'ptree', 'vad:TypeProcess')`
- Для концептов в rtree: `funConceptList_v2(currentStore, 'rtree', 'vad:TypeExecutor')`
- Для концептов в других графах: `funConceptList_v2(currentStore, '<trig_name>', '<type_uri>')`

Основная цель — максимальная простота кода и использование библиотечных функций SPARQL-обработки (Comunica).

---

## Автономный пример

Автономный HTML-пример работы `funConceptList_v2` находится в:

```
ver9d/test2/funSPARQLvalues/v3/demo_funConceptList_v2.html
```

Пример использует данные из `ver9d/dia/rdf-data_clip.ttl` и демонстрирует:
1. Заполнение справочника концептов процессов (из `ptree`, тип `vad:TypeProcess`)
2. Заполнение справочника концептов исполнителей (из `rtree`, тип `vad:TypeExecutor`)

---

*Документ создан в рамках PR #426 по issue #425*
