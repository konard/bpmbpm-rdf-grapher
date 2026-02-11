<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/256 -->
# Тесты Quadstore для RDF Grapher ver9d

## Описание

Данная папка содержит автоматизированные тесты для проверки работы quadstore (N3.Store) с SPARQL операциями INSERT и DELETE через библиотеку Comunica.

## Запуск тестов

Откройте любой HTML-файл теста в браузере. Тесты выполняются автоматически при загрузке страницы.

---

## Состав тестов

### 1. test_simple_triple.html

**Сценарий Simple Triple: 4 фазы**

Тестирует полный цикл создания и удаления концептов с применением SPARQL через кнопку "Применить как Simple Triple".

| Фаза | Описание | Операция |
|------|----------|----------|
| 1 | Создание концепта процесса в ptree | INSERT DATA (Simple) |
| 2 | Создание концепта исполнителя в rtree | INSERT DATA (Simple) |
| 3 | Удаление концепта процесса из ptree | DELETE WHERE (Simple) |
| 4 | Удаление концепта исполнителя из rtree | DELETE WHERE (Simple) |

**Формат Simple Triple:**
```sparql
INSERT DATA {
    GRAPH vad:ptree {
        vad:process_test rdf:type vad:TypeProcess .
        vad:process_test rdfs:label "Тестовый процесс" .
    }
}
```

---

### 2. test_shorthand_triple.html

**Сценарий Shorthand Triple: 4 фазы**

Тестирует полный цикл создания и удаления концептов с применением SPARQL через кнопку "Применить как Shorthand Triple".

| Фаза | Описание | Операция |
|------|----------|----------|
| 1 | Создание концепта процесса в ptree | INSERT DATA (Shorthand) |
| 2 | Создание концепта исполнителя в rtree | INSERT DATA (Shorthand) |
| 3 | Удаление концепта процесса из ptree | DELETE WHERE (Shorthand) |
| 4 | Удаление концепта исполнителя из rtree | DELETE WHERE (Shorthand) |

**Формат Shorthand Triple (с использованием `;`):**
```sparql
INSERT DATA {
    GRAPH vad:ptree {
        vad:process_test_sh rdf:type vad:TypeProcess ;
            rdfs:label "Тестовый процесс (Shorthand)" ;
            vad:hasParentObj vad:p1 .
    }
}
```

---

### 3. test_individ.html

**Сценарий Individ: 4 фазы**

> Issue #319, PR #320. Два режима hasNext: issue #313, PR #314.

Тестирует полный цикл создания и удаления **индивидов процесса и исполнителя** в соответствии с [io_concept_individ_v4.md](../../doc/algorithm/io_concept_individ_v4.md).

| Фаза | Описание | Операция |
|------|----------|----------|
| 1 | Создание индивида процесса в vad:t_p1 | INSERT DATA (с hasNext на существующий) |
| 2 | Создание индивида исполнителя | INSERT DATA (vad:includes в ExecutorGroup) |
| 3 | Удаление индивида исполнителя | DELETE DATA (vad:includes) |
| 4 | Удаление индивида процесса (3 этапа) | DELETE WHERE (исходящие, ExecutorGroup, входящие hasNext) |

**Два режима vad:hasNext (issue #313):**
- **"vad:hasNext на существующий"** (по умолчанию): справочник содержит только индивиды, уже добавленные в выбранный TriG
- **"vad:hasNext на любой"**: справочник содержит все концепты процессов из ptree

**Структура индивида процесса (vad:t_p1):**
```sparql
INSERT DATA {
    GRAPH vad:t_p1 {
        vad:p2.1 vad:isSubprocessTrig vad:t_p1 ;
            vad:hasExecutor vad:ExecutorGroup_p2.1 ;
            vad:hasNext vad:p1.1 .  # hasNext на существующий индивид

        vad:ExecutorGroup_p2.1 rdf:type vad:ExecutorGroup ;
            rdfs:label "Группа исполнителей процесса p2.1" .
    }
}
```

**Структура индивида исполнителя:**
```sparql
INSERT DATA {
    GRAPH vad:t_p1 {
        vad:ExecutorGroup_p2.1 vad:includes vad:Executor3 .
    }
}
```

---

### 4. test_mixed_triple.html

**Сценарий Mixed Triple: 8 фаз**

Тестирует смешанные операции с использованием Simple Triple для добавления и Shorthand Triple для удаления (и наоборот).

**Блок A: Simple INSERT → Shorthand DELETE**

| Фаза | Описание | Режим |
|------|----------|-------|
| 1 | Создание концепта процесса | Simple Triple |
| 2 | Создание концепта исполнителя | Simple Triple |
| 3 | Удаление концепта процесса | Shorthand Triple |
| 4 | Удаление концепта исполнителя | Shorthand Triple |

**Блок B: Shorthand INSERT → Simple DELETE**

| Фаза | Описание | Режим |
|------|----------|-------|
| 5 | Создание концепта процесса | Shorthand Triple |
| 6 | Создание концепта исполнителя | Shorthand Triple |
| 7 | Удаление концепта процесса | Simple Triple |
| 8 | Удаление концепта исполнителя | Simple Triple |

---

## Технические детали

### Используемые библиотеки

- **N3.js v1.17.2** — парсинг RDF данных и хранение в N3.Store
- **Comunica v4** — выполнение SPARQL UPDATE запросов (INSERT/DELETE)

### Архитектура выполнения SPARQL

```
SPARQL Query → Comunica.queryVoid() → N3.Store → currentQuads
```

1. SPARQL запрос передаётся в `comunicaEngine.queryVoid()`
2. Comunica выполняет запрос над N3.Store
3. После выполнения обновляется массив `currentQuads`

### Структура концептов

**Концепт процесса (vad:ptree):**
- `rdf:type vad:TypeProcess`
- `rdfs:label "Название процесса"`
- `dcterms:description "Описание"`
- `vad:hasParentObj vad:p1` (родительский элемент)

**Концепт исполнителя (vad:rtree):**
- `rdf:type vad:TypeExecutor`
- `rdfs:label "Название исполнителя"`
- `vad:hasParentObj vad:Org-structure` (родительская организация)

### Структура индивидов (io_concept_individ_v4.md)

**Индивид процесса (vad:VADProcessDia TriG):**
- `vad:isSubprocessTrig <TRIG_URI>` — связь с TriG схемой
- `vad:hasExecutor <ExecutorGroup_URI>` — связь с группой исполнителей
- `vad:hasNext <другой_индивид>` — связь со следующим элементом (опционально)

**ExecutorGroup (автоматически создаётся при создании индивида процесса):**
- `rdf:type vad:ExecutorGroup`
- `rdfs:label "Группа исполнителей процесса {id}"`
- `vad:includes <Executor_URI>` — связи с исполнителями (добавляются при создании индивида исполнителя)

**Индивид исполнителя:**
- Добавляет `vad:includes` связь в существующий ExecutorGroup

---

## Папка old/

Содержит предыдущие версии тестов (до issue #256):
- `test_quad_scenario1.html` — старый тест добавления концепта процесса
- `test_quad_scenario2.html` — старый тест удаления концепта процесса

---

## Ожидаемый результат

Все тесты должны завершиться со статусом "PASSED" (зелёный цвет).
При наличии ошибок тест показывает "FAILED" (красный цвет) с описанием проблемы.

---

## Ссылки

- [Issue #256 - ver9d_1alg4test](https://github.com/bpmbpm/rdf-grapher/issues/256)
- [Issue #313 - hasNext modes](https://github.com/bpmbpm/rdf-grapher/issues/313) — два режима vad:hasNext
- [Issue #319 - test_individ](https://github.com/bpmbpm/rdf-grapher/issues/319) — тест индивидов
- [PR #255 - refactor: use Comunica for SPARQL UPDATE](https://github.com/bpmbpm/rdf-grapher/pull/255)
- [PR #314 - hasNext mode toggle](https://github.com/bpmbpm/rdf-grapher/pull/314)
- [PR #320 - test_individ.html](https://github.com/bpmbpm/rdf-grapher/pull/320)
- [io_concept_individ_v4.md](../../doc/algorithm/io_concept_individ_v4.md) — алгоритмы создания/удаления индивидов
- [Документация Comunica](https://comunica.dev/)
- [Документация N3.js](https://github.com/rdfjs/N3.js)
