<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/425 -->
<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/427 -->
<!-- Pull Request: https://github.com/bpmbpm/rdf-grapher/pull/426 -->
<!-- Pull Request: https://github.com/bpmbpm/rdf-grapher/pull/428 -->
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
| `trig1`     | `string` | URI TriG-графа в любом формате: полный URI (`'http://example.org/vad#ptree'`), полный URI в угловых скобках (`'<http://example.org/vad#ptree>'`), curie (`'vad:ptree'`), или короткое имя (`'ptree'`). **issue #427**: Рекомендуется передавать полный URI для универсальности применения. |
| `type1`     | `string` | URI типа концепта в любом формате: полный URI (`'http://example.org/vad#TypeProcess'`), полный URI в угловых скобках (`'<http://example.org/vad#TypeProcess>'`), или curie (`'vad:TypeProcess'`). **issue #427**: Рекомендуется передавать полный URI. |

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
// issue #427: Рекомендуемый способ — передавать полные URI
// Список концептов процессов из ptree
var items = await funConceptList_v2(currentStore, 'http://example.org/vad#ptree', 'http://example.org/vad#TypeProcess');
// Результат: [{id: 'http://example.org/vad#p1', label: 'Процесс 1'}, ...]

// Список концептов исполнителей из rtree
var items = await funConceptList_v2(currentStore, 'http://example.org/vad#rtree', 'http://example.org/vad#TypeExecutor');
// Результат: [{id: 'http://example.org/vad#Executor1', label: 'Исполнитель 1'}, ...]

// Устаревший формат (curie/короткое имя) — по-прежнему работает, но не рекомендуется
// var items = await funConceptList_v2(currentStore, 'ptree', 'vad:TypeProcess');
```

## Соответствие trig1 и type1

| `trig1` (рекомендуемый полный URI) | `type1` (рекомендуемый полный URI) | Описание |
|------------------------------------|-------------------------------------|----------|
| `'http://example.org/vad#ptree'` | `'http://example.org/vad#TypeProcess'` | Концепты процессов из дерева процессов |
| `'http://example.org/vad#rtree'` | `'http://example.org/vad#TypeExecutor'` | Концепты исполнителей из дерева исполнителей |

Функция принимает URI в любом формате (полный URI, полный URI в угловых скобках, curie, короткое имя). Рекомендуется использовать полные URI для максимальной универсальности (issue #427).

Номенклатура TriG может быть расширена в будущем без изменения сигнатуры функции.

---

## Замены funSPARQLvalues → funConceptList_v2

### Выполненные замены (PR #426, issue #425)

В файле `ver9d/3_sd/3_sd_ui.js`, функция `updateSubjectsBySubjectType()`:

| № | Было | Стало | Комментарий |
|---|------|-------|-------------|
| 1 | `funSPARQLvalues(SPARQL_QUERIES.PROCESS_CONCEPTS_IN_PTREE, 'process')` | `await funConceptList_v2(currentStore, 'http://example.org/vad#ptree', 'http://example.org/vad#TypeProcess')` | Для `ptree` в блоке `selectedType === 'vad:TypeProcess'` |
| 2 | `funSPARQLvalues(SPARQL_QUERIES.EXECUTOR_CONCEPTS_IN_RTREE, 'executor')` | `await funConceptList_v2(currentStore, 'http://example.org/vad#rtree', 'http://example.org/vad#TypeExecutor')` | Для `rtree` в блоке `selectedType === 'vad:TypeExecutor'` |

### Выполненные замены (PR #428, issue #427)

**issue #427**: Изменён формат передачи параметров — теперь используются полные URI.
Добавлены замены для создания и удаления концептов/индивидов:

| № | Файл | Функция | Замена |
|---|------|---------|--------|
| 3 | `ver9d/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_ui.js` | `fillNewIndividConceptDropdown()` | `funSPARQLvalues` → `funConceptList_v2` (ptree, TypeProcess) |
| 4 | `ver9d/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_ui.js` | `fillNewIndividExecutorDropdown()` | `funSPARQLvalues` → `funConceptList_v2` (rtree, TypeExecutor) |
| 5 | `ver9d/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_logic.js` | `getProcessConceptsForHasNext()` | `funSPARQLvalues` → `funConceptList_v2` (ptree, TypeProcess) |
| 6 | `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js` | `getProcessConceptsForDeletion()` | `funSPARQLvalues` → `funConceptList_v2` (ptree, TypeProcess) |
| 7 | `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js` | `getExecutorConceptsForDeletion()` | `funSPARQLvalues` → `funConceptList_v2` (rtree, TypeExecutor) |

Дополнительно (issue #427):
- Функции `fillNewIndividConceptDropdown`, `fillNewIndividExecutorDropdown`, `getProcessConceptsForHasNext`, `fillNewIndividHasNextCheckboxes`, `onNewIndividTrigChange`, `onHasNextModeChange` стали `async`
- Функции `getProcessConceptsForDeletion`, `getExecutorConceptsForDeletion`, `fillConceptDropdown`, `initializeDelDropdowns`, `buildDelConceptForm`, `openDeleteModal`, `onDelOperationChange` стали `async`

### Формат отображения в справочнике

**Было:** `id (label)` — через `formatDropdownDisplayText()`, использует скобки
**Стало:** `id label` — через пробел, без скобок (для ptree/rtree в `updateSubjectsBySubjectType`)
**Без изменений:** другие справочники используют `formatDropdownDisplayText`

### funSPARQLvalues — статус (issue #427)

Функция `funSPARQLvalues` **помечена к удалению** и закомментирована в `ver9d/9_vadlib/vadlib_sparql.js`.

Оставшиеся вызовы, защищённые guard-ом `typeof funSPARQLvalues === 'function'`:
- `ver9d/3_sd/3_sd_ui.js`: `getProcessIndividualsInTriG()`, `getExecutorGroupsInTriG()` — используют fallback на direct quad search
- `ver9d/3_sd/3_sd_create_new_concept/3_sd_create_new_concept_logic.js` — запросы предикатов/объектов с fallback на ручной разбор
- `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js` — проверки trig/children с fallback
- `ver9d/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_logic.js` — получение TriG с fallback на quad search

Все оставшиеся вызовы имеют fallback-механизмы и не сломаются при удалённой `funSPARQLvalues`.

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
*Обновлён в рамках PR #428 по issue #427*
