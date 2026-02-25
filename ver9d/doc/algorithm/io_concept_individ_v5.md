<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/437 -->
<!-- Pull Request: https://github.com/bpmbpm/rdf-grapher/pull/438 -->
<!-- Дата: 2026-02-25 -->

# Алгоритмы создания и удаления концептов, индивидов и схем (v5)

Данный документ является доработкой [io_concept_individ_v4.md](io_concept_individ_v4.md) с учётом отказа от `funSPARQLvalues` и перехода на `funSPARQLvaluesComunica`, `funConceptList_v2` и `funTrigNameList_v2`.

## Основные изменения относительно v4

1. **Отказ от `funSPARQLvalues`** — функция закомментирована в `vadlib_sparql.js` и помечена к удалению (issue #427). Все вызовы `funSPARQLvalues` в модуле удаления заменены.
2. **Проверки при удалении концепта исполнителя восстановлены** (issue #437) — ранее вызов `checkExecutorUsage()` использовал `funSPARQLvalues` и при её отсутствии молча завершался с ошибкой, что приводило к отсутствию проверки на наличие индивидов исполнителя.
3. **Функции проверок переведены на `async/await`** — `checkProcessSchema`, `checkChildrenElements`, `checkExecutorUsage` стали асинхронными; `performValidationChecks`, `onDelConceptSelect`, `showIndividuals` — также сделаны `async`.
4. **Используемые функции замены** (вместо `funSPARQLvalues`):
   - `funSPARQLvaluesComunica` — для SPARQL SELECT запросов с поддержкой OPTIONAL, UNION, FILTER
   - `funConceptList_v2` — для получения списков концептов из ptree/rtree (issue #427)
   - `funTrigNameList_v2` — для получения списков TriG заданного типа (issue #433)

---

## Таблица замены функций в модуле удаления (3_sd_del_concept_individ)

| Функция | Было (v4) | Стало (v5) | Async | Issue |
|---------|-----------|-----------|-------|-------|
| `getProcessConceptsForDeletion()` | `funSPARQLvalues` | `funConceptList_v2` | да | #427 |
| `getExecutorConceptsForDeletion()` | `funSPARQLvalues` | `funConceptList_v2` | да | #427 |
| `getAllTrigs()` | `funSPARQLvalues` | `funTrigNameList_v2` | да | #433 |
| `checkProcessSchema()` | `funSPARQLvalues` | `funSPARQLvaluesComunica` | да | #437 |
| `checkChildrenElements()` | `funSPARQLvalues` | `funSPARQLvaluesComunica` | да | #437 |
| `checkExecutorUsage()` | `funSPARQLvalues` | `funSPARQLvaluesComunica` | да | #437 |

---

## 1–10. Алгоритмы операций (без изменений относительно v4)

Алгоритмы всех 10 операций (создание/удаление концептов, индивидов, схем) остаются неизменными относительно v4. Изменились только используемые SPARQL-функции.

Все алгоритмы по-прежнему описаны в [io_concept_individ_v4.md](io_concept_individ_v4.md) и в данном документе дублироваться не будут. Ниже приводится только обновлённая сводная таблица SPARQL-функций.

---

## 11. Обновлённая сводная таблица SPARQL-функций (v5)

| Функция | Тип запроса | Использование | Модуль | Статус |
|---------|-------------|---------------|--------|--------|
| `funSPARQLvalues()` | SELECT (простой) | ~~Получение списков, проверки без OPTIONAL~~ | ~~`vadlib_sparql.js`~~ | **УДАЛЕНА** (закомментирована в issue #427) |
| `funSPARQLvaluesComunica()` | SELECT (полный) | Запросы с OPTIONAL, UNION, FILTER; проверки при удалении | `vadlib_sparql.js` | Активна |
| `funSPARQLask()` | ASK | Проверки существования | `vadlib_sparql.js` | Активна |
| `funSPARQLvaluesComunicaUpdate()` | UPDATE | INSERT/DELETE операции | `vadlib_sparql.js` | Активна |
| `funConceptList_v2()` | SELECT (Comunica) | Получение списков концептов из ptree/rtree | `vadlib_sparql_v2.js` | Активна (добавлена в issue #425, #427) |
| `funTrigNameList_v2()` | SELECT (Comunica) | Получение списков TriG заданного типа | `vadlib_sparql_v2.js` | Активна (добавлена в issue #433) |

### 11.1 Обновлённое распределение функций по операциям (v5)

| Операция | `funSPARQLask()` | `funConceptList_v2()` | `funTrigNameList_v2()` | `funSPARQLvaluesComunica()` | UPDATE |
|----------|:----------------:|:---------------------:|:----------------------:|:---------------------------:|:------:|
| 1. Создание концепта процесса | + | — | — | + | INSERT DATA |
| 2. Создание концепта исполнителя | + | — | — | + | INSERT DATA |
| 3. Удаление концепта процесса | — | — | — | + | DELETE WHERE |
| 4. Удаление концепта исполнителя | — | — | — | + | DELETE WHERE |
| 5. Создание индивида процесса | + | — | + | + | INSERT DATA |
| 6. Создание индивида исполнителя | — | — | + | — | INSERT DATA |
| 7. Удаление индивида процесса во всех схемах | — | + | — | — | DELETE WHERE |
| 7b. Удаление индивида процесса в схеме | — | — | + | — | DELETE WHERE |
| 8. Удаление индивида исполнителя во всех схемах | — | + | — | + | DELETE DATA |
| 8b. Удаление индивида исполнителя в схеме | — | — | + | + | DELETE DATA |
| 9. Создание схемы процесса | + | + | — | — | INSERT DATA |
| 10. Удаление схемы процесса | + | — | + | + | DELETE + DROP GRAPH |

> **Примечание:** В таблице v5 убрана колонка `funSPARQLvalues()` — функция удалена. Колонки `funConceptList_v2()` и `funTrigNameList_v2()` добавлены для отражения новых специализированных функций.

---

## 12. Детали реализации: проверки при удалении (v5)

### 12.1 Удаление концепта процесса — проверки

```javascript
// v5: все проверки используют funSPARQLvaluesComunica (async)

// Проверка 1: наличие схемы процесса (hasTrig)
async function checkProcessSchema(conceptUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_PROCESS_SCHEMA(conceptUri);
    // issue #437: Заменяем funSPARQLvalues на funSPARQLvaluesComunica
    const results = await funSPARQLvaluesComunica(sparqlQuery, 'trig');
    return results.map(r => r.uri || r.trig);
}

// Проверка 2: наличие дочерних концептов
async function checkChildrenElements(conceptUri, graphUri) {
    const sparqlQuery = /* CHECK_CHILDREN_PROCESSES или CHECK_CHILDREN_EXECUTORS */;
    // issue #437: Заменяем funSPARQLvalues на funSPARQLvaluesComunica
    const results = await funSPARQLvaluesComunica(sparqlQuery, 'child');
    return results.map(r => ({ uri: r.uri || r.child, label: r.label || ... }));
}
```

### 12.2 Удаление концепта исполнителя — проверки (восстановлены в v5)

```javascript
// v5: checkExecutorUsage стала async, использует funSPARQLvaluesComunica

async function checkExecutorUsage(executorUri) {
    const sparqlQuery = DEL_CONCEPT_SPARQL.CHECK_EXECUTOR_USAGE(executorUri);
    // issue #437: Заменяем funSPARQLvalues на funSPARQLvaluesComunica
    // Проверка восстановлена — ранее молча завершалась с ошибкой (funSPARQLvalues была удалена)
    const results = await funSPARQLvaluesComunica(sparqlQuery, 'trig');
    return results.map(r => ({
        trig: r.uri || r.trig,
        processIndivid: r.processIndivid || r.label || r.uri || r.trig
    }));
}
```

**SPARQL-запрос проверки использования исполнителя (без изменений):**

```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?trig ?processIndivid WHERE {
    GRAPH ?trig {
        ?processIndivid vad:includes <EXECUTOR_URI> .
    }
    ?trig rdf:type vad:VADProcessDia .
}
```

Если результат не пустой — у исполнителя есть индивиды (концепт включён в ExecutorGroup через `vad:includes`), удаление блокируется.

### 12.3 Цепочка async/await в UI

```javascript
// Обновлённая цепочка вызовов (все async):

async function onDelConceptSelect() {
    // ...
    await performValidationChecks(); // ← async в v5
    // ...
}

async function performValidationChecks() {
    // ...
    const schemas = await checkProcessSchema(conceptUri);        // ← async в v5
    const children = await checkChildrenElements(conceptUri, ...); // ← async в v5
    const usages = await checkExecutorUsage(conceptUri);          // ← async в v5
    // ...
}

async function showIndividuals() {
    // ...
    const usages = await checkExecutorUsage(conceptUri); // ← async в v5
    // ...
}
```

---

## 13. Почему произошёл отказ от funSPARQLvalues

`funSPARQLvalues` была реализована как упрощённый SPARQL-движок на основе ручного разбора квадов без полной поддержки SPARQL. Это приводило к следующим ограничениям:

- Не поддерживала OPTIONAL, UNION, FILTER, BIND
- Не поддерживала запросы с GRAPH-клаузой
- Некорректно обрабатывала сложные паттерны соответствия триплетов

После появления `funSPARQLvaluesComunica` (использующей движок Comunica с полной поддержкой SPARQL), `funSPARQLvalues` стала избыточной. В issue #427 она была закомментирована для постепенного удаления.

### 13.1 Последствия закомментирования funSPARQLvalues

Закомментирование `funSPARQLvalues` привело к тому, что функции `checkProcessSchema`, `checkChildrenElements` и `checkExecutorUsage` выполнялись с проверкой `if (typeof funSPARQLvalues === 'function')`, которая возвращала `false`, и тихо завершались, не выполняя проверки. В частности:

- **Проверка наличия индивидов исполнителя при удалении концепта исполнителя стала нерабочей** — пользователь мог удалить концепт исполнителя, даже если в схемах существовали индивиды этого исполнителя (issue #437).
- Аналогично стали нерабочими проверки схемы процесса и дочерних элементов при удалении концепта процесса.

### 13.2 Решение в v5

Все три функции (`checkProcessSchema`, `checkChildrenElements`, `checkExecutorUsage`) переведены на `funSPARQLvaluesComunica` и стали асинхронными. Цепочка async/await распространена на все вызывающие функции UI модуля.

---

## 14. Сводная таблица условий создания и удаления (обновлена для v5)

| № | Операция | Условие | Функция проверки | Блокировка |
|---|----------|---------|-----------------|------------|
| 1 | Создание концепта процесса | Уникальность ID в ptree | `checkIdExistsAsk` + `funSPARQLask` | Да |
| 2 | Создание концепта процесса | Непустое rdfs:label | UI-валидация | Да |
| 3 | Создание концепта процесса | Выбор родителя | `funSPARQLvaluesComunica` | Нет (опционально) |
| 4 | Создание концепта исполнителя | Уникальность ID в rtree | `checkIdExistsAsk` + `funSPARQLask` | Да |
| 5 | Создание концепта исполнителя | Непустое rdfs:label | UI-валидация | Да |
| 6 | **Удаление концепта процесса** | **Нет индивидов в TriG** | `checkProcessIndividuals` (manual quadstore) | **Да** |
| 7 | **Удаление концепта процесса** | **Нет схемы (hasTrig)** | `checkProcessSchema` → `funSPARQLvaluesComunica` | **Да** |
| 8 | **Удаление концепта процесса** | **Нет дочерних концептов** | `checkChildrenElements` → `funSPARQLvaluesComunica` | **Да** |
| 9 | **Удаление концепта исполнителя** | **Нет индивидов исполнителя (vad:includes)** | `checkExecutorUsage` → `funSPARQLvaluesComunica` | **Да** |
| 10 | **Удаление концепта исполнителя** | **Нет дочерних исполнителей** | `checkChildrenElements` → `funSPARQLvaluesComunica` | **Да** |
| 11 | Создание индивида процесса | Концепт существует в ptree | `checkIdExistsAsk` + `funSPARQLask` | Да |
| 12 | Создание индивида процесса | Индивид не существует в TriG | `checkIndividualInTrig` + `funSPARQLask` | Да |
| 13 | Создание индивида процесса | TriG существует и является VADProcessDia | `checkTrigType` + `funSPARQLask` | Да |
| 14 | Создание индивида исполнителя | ExecutorGroup определена | `findExecutorGroupForProcessIndivid` (manual) | Да |
| 15 | Удаление схемы процесса | Нет индивидов в TriG | `findProcessIndividualsInTrig` (manual quadstore) | Да |

> **Примечание:** В строках 9 проверка «Нет индивидов исполнителя» была неработающей в версии кода между PR #427 и PR #438, так как `funSPARQLvalues` была закомментирована, а `checkExecutorUsage` ещё не переведена на `funSPARQLvaluesComunica`. В v5 (issue #437) эта проверка восстановлена.

---

## 15. Связанные документы

- [io_concept_individ_v4.md](io_concept_individ_v4.md) — предыдущая версия алгоритмов
- [io_concept_individ_v3.md](io_concept_individ_v3.md) — версия с унификацией SPARQL-функций
- [funConceptList_v2.md](funConceptList_v2.md) — документация по funConceptList_v2
- [checklistTestButton.md](../checklistTestButton.md) — перечень проверок по кнопке "Тест"

---

*Документ создан в рамках PR #438 по issue #437*
