<!-- PR #296 | 2026-02-05 -->
<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/295 -->
<!-- История изменений: PR #294 (2026-02-04), PR #296 (2026-02-05) -->

# Наиболее важные функции RDF Grapher ver9d

В данном документе описаны 22 наиболее важных функции проекта, реализующих **SPARQL-driven Programming** и составляющих ядро системы обработки и визуализации RDF данных.

## Оглавление

### Группа 1: SPARQL-движок и запросы
1. [funSPARQLvalues](#1-funsparqlvalues) — выполнение SPARQL SELECT запросов
2. [funSPARQLvaluesComunica](#2-funsparqlvaluescomunica) — полная поддержка SPARQL через Comunica
3. [funSPARQLvaluesDouble](#3-funsparqlvaluesdouble) — справочники с недоступными значениями
4. [funSPARQLask](#4-funsparqlask) — выполнение SPARQL ASK запросов
5. [funSPARQLvaluesComunicaUpdate](#5-funsparqlvaluescomunicaupdate) — выполнение SPARQL UPDATE через Comunica
6. [funSPARQLvaluesDoubleSync](#6-funsparqlvaluesdoublesync) — синхронная версия funSPARQLvaluesDouble

### Группа 2: Обработка и хранение данных
7. [parseTriGHierarchy](#7-parsetrighierarchy) — построение иерархии TriG графов
8. [calculateProcessSubtypes](#8-calculateprocesssubtypes) — вычисление подтипов процессов
9. [getFilteredQuads](#9-getfilteredquads) — фильтрация квадов по режиму
10. [applyTripleToRdfInput](#10-applytripletordfinput) — применение SPARQL к quadstore

### Группа 3: Визуализация
11. [visualize](#11-visualize) — главная функция визуализации
12. [rdfToDotVAD](#12-rdftodotvad) — генерация DOT-кода для VAD диаграмм
13. [serializeStoreToTriG](#13-serializestoretotrig) — сериализация store в TriG формат

### Группа 4: Smart Design
14. [openNewConceptModal](#14-opennewconceptmodal) — создание нового концепта
15. [openNewTrigModal](#15-opennewtrigmodal) — создание нового TriG
16. [openDelConceptModal](#16-opendelconceptmodal) — удаление концепта/индивида
17. [smartDesignCreate](#17-smartdesigncreate) — генерация SPARQL INSERT/DELETE

### Группа 5: Вспомогательные функции
18. [getPrefixedName](#18-getprefixedname) — преобразование URI в prefixed форму
19. [loadTechAppendix](#19-loadtechappendix) — загрузка технологических данных
20. [isVirtualGraph](#20-isvirtualgraph) — проверка виртуального графа
21. [getPredicatesFromTechObject](#21-getpredicatesfromtechobject) — получение предикатов из techtree
22. [refreshQuadstoreFromRdfInput](#22-refreshquadstorefromrdfinput) — синхронизация quadstore

---

## Группа 1: SPARQL-движок и запросы

### 1. funSPARQLvalues

**Модуль:** `9_vadlib/vadlib_sparql.js`

#### Сигнатура

```javascript
function funSPARQLvalues(sparqlQuery, variableName = 'value')
```

#### Описание

Ключевая функция SPARQL-ориентированного программирования (SPARQL-driven Programming). Выполняет SPARQL SELECT запросы над текущим набором RDF квадов (`currentQuads`) без использования внешнего SPARQL-движка. Реализует собственный парсер SPARQL запросов с поддержкой переменных, GRAPH блоков, PREFIX-нотации и сопоставления паттернов.

Функция является центральным элементом архитектуры проекта: все модули (Smart Design, Publisher, тестирование) используют её для получения данных из RDF хранилища через SPARQL запросы.

#### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `sparqlQuery` | `string` | -- | SPARQL SELECT запрос |
| `variableName` | `string` | `'value'` | Имя переменной для извлечения значений из результатов |

#### Возвращаемое значение

`Array<{uri: string, label: string}>` — массив объектов с URI и меткой каждого результата. При отсутствии данных или ошибке возвращает пустой массив.

#### Пример использования

```javascript
// Получить все концепты процессов из дерева процессов
const processes = funSPARQLvalues(`
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
        }
    }
`, 'process');

// Результат: [{uri: "http://example.org/vad#pGA", label: "Процесс ГА"}, ...]
```

---

### 2. funSPARQLvaluesComunica

**Модуль:** `9_vadlib/vadlib_sparql.js`

#### Сигнатура

```javascript
async function funSPARQLvaluesComunica(sparqlQuery, variableName = 'value')
```

#### Описание

Выполняет SPARQL SELECT запрос с полной поддержкой SPARQL через библиотеку Comunica. Поддерживает UNION, OPTIONAL, FILTER, BIND и другие конструкции SPARQL, которые не поддерживаются в базовой функции `funSPARQLvalues`.

Используется для сложных запросов, где требуется полная мощность SPARQL (например, FILTER NOT EXISTS).

#### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `sparqlQuery` | `string` | -- | SPARQL SELECT запрос |
| `variableName` | `string` | `'value'` | Имя переменной для извлечения (без '?') |

#### Возвращаемое значение

`Promise<Array<{uri: string, label: string}>>` — промис с массивом результатов.

#### Пример использования

```javascript
// Получить процессы без VADProcessDia (использует FILTER NOT EXISTS)
const processes = await funSPARQLvaluesComunica(`
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
            FILTER NOT EXISTS {
                ?process vad:hasTrig ?trig .
            }
        }
    }
`, 'process');
```

---

### 3. funSPARQLvaluesDouble

**Модуль:** `9_vadlib/vadlib_sparql.js`

#### Сигнатура

```javascript
async function funSPARQLvaluesDouble(sparqlQuery1, variableName1, sparqlQuery2, variableName2)
```

#### Описание

Выполняет два SPARQL SELECT запроса и возвращает объединённый результат с пометкой недоступных (disabled) значений.

Функция позволяет формировать справочники, где:
- Первый запрос (sparqlQuery1) возвращает полный список значений
- Второй запрос (sparqlQuery2) возвращает подмножество значений, которые должны быть помечены как недоступные

**Применение:** В справочнике концептов процессов вывести все процессы из ptree, но подсветить серым те, которые уже имеют TriG (vad:hasTrig).

#### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `sparqlQuery1` | `string` | -- | SPARQL запрос для полного списка |
| `variableName1` | `string` | `'value'` | Имя переменной для первого запроса |
| `sparqlQuery2` | `string` | -- | SPARQL запрос для списка недоступных |
| `variableName2` | `string` | `'value'` | Имя переменной для второго запроса |

#### Возвращаемое значение

`Promise<Array<{uri: string, label: string, disabled: boolean}>>` — массив результатов, где `disabled=true` означает, что значение найдено во втором запросе.

#### Пример использования

```javascript
// Получить все процессы, пометив серым те, у которых есть TriG
const processes = await funSPARQLvaluesDouble(
    `SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
        }
    }`,
    'process',
    `SELECT ?process WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process vad:hasTrig ?trig .
        }
    }`,
    'process'
);
// Результат: [{uri: "vad:p1", label: "Процесс 1", disabled: false},
//             {uri: "vad:pGA", label: "Процесс ГА", disabled: true}, ...]
```

---

### 4. funSPARQLask

**Модуль:** `9_vadlib/vadlib_sparql.js`

#### Сигнатура

```javascript
async function funSPARQLask(sparqlQuery)
```

#### Описание

Выполняет SPARQL ASK запрос и возвращает boolean результат. Поддерживает простые ASK запросы с GRAPH паттернами. Используется для проверки существования данных без возврата самих данных.

#### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `sparqlQuery` | `string` | SPARQL ASK запрос |

#### Возвращаемое значение

`Promise<boolean>` — `true` если паттерн найден, `false` иначе.

#### Пример использования

```javascript
// Проверка: является ли граф виртуальным
const isVirtual = await funSPARQLask(`
    ASK {
        GRAPH <http://example.org/vad#vt_p1> {
            <http://example.org/vad#vt_p1> rdf:type vad:Virtual .
        }
    }
`);
```

---

### 5. funSPARQLvaluesComunicaUpdate

**Модуль:** `9_vadlib/vadlib_sparql.js`

#### Сигнатура

```javascript
async function funSPARQLvaluesComunicaUpdate(sparqlUpdateQuery)
```

#### Описание

Выполняет SPARQL UPDATE запрос (INSERT/DELETE) через Comunica. Предназначена для будущего использования при автоматическом выполнении UPDATE-запросов. В текущей архитектуре запросы генерируются Smart Design, но не выполняются автоматически — пользователь нажимает "Применить" для выполнения.

Функция поддерживает:
- INSERT DATA — добавление новых триплетов
- DELETE WHERE — удаление триплетов по паттерну
- DELETE/INSERT — комбинированные операции

#### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `sparqlUpdateQuery` | `string` | SPARQL UPDATE запрос (INSERT DATA, DELETE WHERE и т.д.) |

#### Возвращаемое значение

`Promise<boolean>` — `true` если запрос выполнен успешно, `false` при ошибке.

#### Пример использования

```javascript
// Добавление нового триплета через Comunica
const success = await funSPARQLvaluesComunicaUpdate(`
    PREFIX vad: <http://example.org/vad#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    INSERT DATA {
        GRAPH vad:ptree {
            vad:pNew rdf:type vad:TypeProcess .
        }
    }
`);

if (success) {
    console.log('Триплет добавлен');
}
```

#### Связь с PR #292

Добавлена в рамках issue #291 для поддержки SPARQL UPDATE операций при создании новых TriG контейнеров.

---

### 6. funSPARQLvaluesDoubleSync

**Модуль:** `9_vadlib/vadlib_sparql.js`

#### Сигнатура

```javascript
function funSPARQLvaluesDoubleSync(sparqlQuery1, variableName1, sparqlQuery2, variableName2)
```

#### Описание

Синхронная версия `funSPARQLvaluesDouble` для случаев, когда асинхронный вызов неудобен. Использует `funSPARQLvalues` вместо `funSPARQLvaluesComunica` для обоих запросов.

**Применение:** Используется в контекстах, где async/await недоступен (например, в некоторых обработчиках событий или при необходимости синхронного получения данных).

#### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `sparqlQuery1` | `string` | -- | SPARQL запрос для полного списка |
| `variableName1` | `string` | `'value'` | Имя переменной для первого запроса |
| `sparqlQuery2` | `string` | -- | SPARQL запрос для списка недоступных |
| `variableName2` | `string` | `'value'` | Имя переменной для второго запроса |

#### Возвращаемое значение

`Array<{uri: string, label: string, disabled: boolean}>` — массив результатов (синхронно, не Promise).

#### Пример использования

```javascript
// Синхронное получение процессов с пометкой disabled
const processes = funSPARQLvaluesDoubleSync(
    `SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
        }
    }`,
    'process',
    `SELECT ?process WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process vad:hasTrig ?trig .
        }
    }`,
    'process'
);

// Результат сразу доступен (без await)
processes.forEach(p => console.log(p.label, p.disabled));
```

#### Связь с PR #292

Добавлена в рамках issue #291 как синхронная альтернатива `funSPARQLvaluesDouble` для совместимости с кодом, где async/await неудобен.

---

## Группа 2: Обработка и хранение данных

### 7. parseTriGHierarchy

**Модуль:** `2_triplestore/2_triplestore_logic.js`

#### Сигнатура

```javascript
function parseTriGHierarchy(quads, prefixes)
```

#### Описание

Парсит иерархию TriG графов из набора RDF квадов. Анализирует связи `vad:hasParentObj` между графами и строит древовидную структуру, начиная от корневого элемента `vad:root`. Определяет типы каждого графа (`TechTree`, `ProcessTree`, `ExecutorTree`, `VADProcessDia`, `ObjectTree`).

Иерархия используется для:
- Отображения дерева TriG в интерфейсе (модуль Publisher)
- Навигации по структуре VAD данных
- Определения контекста при работе Smart Design
- Валидации структуры данных

#### Возвращаемое значение

```javascript
{
    "http://example.org/vad#root": {
        uri: "http://example.org/vad#root",
        label: "Корень Дерева",
        type: "TechTree",
        isTrig: true,
        children: ["http://example.org/vad#ptree", "http://example.org/vad#rtree"],
        parent: null
    },
    // ...
}
```

---

### 8. calculateProcessSubtypes

**Модуль:** `2_triplestore/2_triplestore_logic.js`

#### Сигнатура

```javascript
function calculateProcessSubtypes(hierarchy, prefixes)
```

#### Описание

Вычисляет подтипы процессов (`vad:processSubtype`) на основе анализа иерархии TriG графов и связей между процессами. Это виртуальные (вычисляемые) данные, которые не хранятся непосредственно в RDF, а рассчитываются алгоритмически.

Подтипы:
- **Detailed** — процесс имеет собственный TriG и привязан к текущему TriG
- **DetailedChild** — дочерний процесс с собственным TriG
- **DetailedExternal** — процесс из другого TriG с собственным TriG
- **notDetailed** — процесс без собственного TriG
- **notDetailedChild** — дочерний процесс без TriG
- **notDetailedExternal** — процесс из другого TriG без TriG

---

### 9. getFilteredQuads

**Модуль:** `9_vadlib/vadlib.js`

#### Сигнатура

```javascript
function getFilteredQuads(filterMode = TRIG_FILTER_MODES.OBJECT_TREE_PLUS_VAD)
```

#### Описание

Фильтрует текущие квады (`currentQuads`) по указанному режиму. Позволяет отображать только определённые категории данных (ObjectTree, VADProcessDia, TechTree, Virtual, All).

#### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `filterMode` | `string` | `'objectTreePlusVad'` | Режим фильтрации |

#### Возвращаемое значение

`Array<Quad>` — отфильтрованный массив квадов.

---

### 10. applyTripleToRdfInput

**Модуль:** `3_sd/3_sd_logic.js`

#### Сигнатура

```javascript
async function applyTripleToRdfInput(sparqlQuery, mode)
```

#### Описание

Применяет SPARQL INSERT/DELETE запрос к текущему quadstore. Парсит запрос, выполняет операцию над N3.Store, сериализует результат обратно в TriG формат и обновляет отображение.

Является ключевой функцией для редактирования RDF данных через Smart Design.

#### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `sparqlQuery` | `string` | SPARQL INSERT DATA или DELETE WHERE запрос |
| `mode` | `string` | Режим сериализации: `'simple'` или `'shorthand'` |

---

## Группа 3: Визуализация

### 11. visualize

**Модуль:** `5_publisher/5_publisher_logic.js`

#### Сигнатура

```javascript
async function visualize()
```

#### Описание

Главная функция визуализации RDF данных. Оркестрирует весь процесс от парсинга входных данных до отображения SVG графа. Вызывается при нажатии кнопки "Обновить" и при загрузке примеров.

Последовательность действий:
1. Считывает входные данные и параметры
2. Парсит RDF данные через N3.js
3. Извлекает префиксы и строит кэш типов узлов
4. В режиме `vad-trig`: строит иерархию TriG графов, вычисляет подтипы
5. Генерирует DOT-код через `rdfToDotVAD()`
6. Рендерит SVG через Viz.js
7. Добавляет обработчики кликов на узлы графа

---

### 12. rdfToDotVAD

**Модуль:** `5_publisher/5_publisher_logic.js`

#### Сигнатура

```javascript
function rdfToDotVAD(quads, prefixes = {}, trigUri = null)
```

#### Описание

Генерирует DOT-код для VAD (Value Added Chain) диаграмм из набора RDF квадов. Учитывает специфику VAD-онтологии: типы процессов, исполнителей, группы, подтипы процессов.

Функция создает:
- Подграфы (subgraph) для группировки процессов по исполнителям
- Узлы с цветовой кодировкой по типам
- Ребра со стилями в зависимости от предикатов
- HTML-метки с переносом строк

---

### 13. serializeStoreToTriG

**Модуль:** `3_sd/3_sd_logic.js`

#### Сигнатура

```javascript
function serializeStoreToTriG(store, prefixes)
```

#### Описание

Сериализует N3.Store в TriG формат с использованием N3.Writer. Используется после применения SPARQL INSERT/DELETE для обновления текстового представления данных.

---

## Группа 4: Smart Design

### 14. openNewConceptModal

**Модуль:** `3_sd/3_sd_create_new_concept/3_sd_create_new_concept_logic.js`

#### Сигнатура

```javascript
function openNewConceptModal()
```

#### Описание

Открывает модальное окно для создания нового Концепта (процесса или исполнителя).

Алгоритм:
1. Проверяет, что quadstore не пуст
2. Загружает предикаты из технологического объекта (vad:ConceptProcessPredicate)
3. Динамически строит форму ввода
4. Генерирует SPARQL INSERT запрос

---

### 15. openNewTrigModal

**Модуль:** `3_sd/3_sd_create_new_trig/3_sd_create_new_trig_logic.js`

#### Сигнатура

```javascript
async function openNewTrigModal()
```

#### Описание

Открывает модальное окно для создания нового TriG контейнера (VADProcessDia).

Использует `funSPARQLvaluesDouble` для формирования справочника концептов процессов, где процессы с существующим TriG отмечены серым и недоступны для выбора.

Алгоритм:
1. Проверяет, что quadstore не пуст
2. Через funSPARQLvaluesDouble получает все процессы и процессы с hasTrig
3. Формирует справочник с disabled опциями
4. Генерирует SPARQL INSERT запрос

---

### 16. openDelConceptModal

**Модуль:** `3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js`

#### Сигнатура

```javascript
function openDelConceptModal()
```

#### Описание

Открывает модальное окно для удаления Концепта или Индивида.

Поддерживает операции:
- Удаление концепта процесса
- Удаление концепта исполнителя
- Удаление индивида процесса
- Удаление индивида исполнителя
- Удаление схемы процесса (TriG)

Перед удалением выполняются проверки зависимостей.

---

### 17. smartDesignCreate

**Модуль:** `3_sd/3_sd_logic.js`

#### Сигнатура

```javascript
function smartDesignCreate()
```

#### Описание

Генерирует SPARQL INSERT запрос на основе выбранных значений в панели Smart Design (TriG, Subject, Predicate, Object). Результат выводится в поле "Result in SPARQL".

---

## Группа 5: Вспомогательные функции

### 18. getPrefixedName

**Модуль:** `9_vadlib/vadlib.js`

#### Сигнатура

```javascript
function getPrefixedName(uri, prefixes)
```

#### Описание

Преобразует полный URI в prefixed форму (например, `http://example.org/vad#pGA` → `vad:pGA`). Используется повсеместно для отображения компактных URI пользователю.

---

### 19. loadTechAppendix

**Модуль:** `9_vadlib/vadlib.js`

#### Сигнатура

```javascript
async function loadTechAppendix()
```

#### Описание

Загружает технологические данные из файла `vad-basic-ontology_tech_Appendix.ttl`. Технологические данные содержат определения предикатов для концептов и стилей узлов.

---

### 20. isVirtualGraph

**Модуль:** `9_vadlib/vadlib.js`

#### Сигнатура

```javascript
function isVirtualGraph(graphUri)
```

#### Описание

Проверяет, является ли граф виртуальным (типа `vad:Virtual`). Виртуальные графы содержат вычисляемые данные и не сохраняются в файл.

---

### 21. getPredicatesFromTechObject

**Модуль:** `9_vadlib/vadlib.js`

#### Сигнатура

```javascript
function getPredicatesFromTechObject(techObjectUri)
```

#### Описание

Получает список предикатов из технологического объекта в vad:techtree. Используется для динамического построения форм New Concept.

---

### 22. refreshQuadstoreFromRdfInput

**Модуль:** `3_sd/3_sd_logic.js`

#### Сигнатура

```javascript
function refreshQuadstoreFromRdfInput()
```

#### Описание

Синхронизирует глобальные переменные `currentQuads` и `currentStore` с текстовым содержимым textarea. Вызывается после ручного редактирования данных.

---

## Дополнительная информация

### Quadstore

Quadstore организован на базе библиотеки **N3.js v1.17.2** (`N3.Store`, `N3.Parser`). Данные окна «RDF-данные» хранятся в `currentStore` (N3.Store) и `currentQuads` (массив квадов).

Чтение и запись осуществляются через SPARQL-запросы:
- `funSPARQLvalues` / `funSPARQLvaluesComunica` для SELECT
- `applyTripleToRdfInput` для INSERT/DELETE

### Архитектура SPARQL-driven Programming

Принцип SPARQL-driven Programming заключается в максимальном использовании SPARQL-запросов для работы с данными вместо прямого обращения к структурам данных. Это обеспечивает:
- Независимость от конкретной реализации хранилища
- Самодокументируемый код (SPARQL-запросы описывают логику)
- Возможность замены библиотек без изменения бизнес-логики

---

## Наиболее важные Удаленные функции

В ходе рефакторинга проекта и перехода к SPARQL-driven Programming некоторые функции были удалены или заменены. Ниже приведены 5 наиболее значимых удалённых функций.

### 1. getProcessesWithVADProcessDia

**Удалена в:** PR #287 (issue #286)

**Причина удаления:** Заменена на SPARQL-driven подход с использованием `FILTER NOT EXISTS`. Вместо ручного построения множества процессов с VADProcessDia теперь используется единый SPARQL запрос через `funSPARQLvaluesComunica`, который фильтрует процессы непосредственно на уровне запроса.

**Было:**
```javascript
function getProcessesWithVADProcessDia() {
    // Ручной обход currentQuads и построение Set
}
```

**Стало:** Использование `funSPARQLvaluesDouble` с двумя SPARQL запросами.

---

### 2. getProcessConceptsManual

**Удалена в:** PR #290 (revert issue #288)

**Причина удаления:** Функция была добавлена как fallback для ручного получения концептов процессов из `currentQuads`, когда SPARQL запросы не работали. После стабилизации SPARQL-движка и унификации подхода через `funSPARQLvalues` / `funSPARQLvaluesComunica`, ручной fallback стал избыточным.

**Было:**
```javascript
function getProcessConceptsManual() {
    // Прямой обход currentQuads для получения концептов
}
```

---

### 3. displayNewTrigIntermediateSparql / toggleNewTrigIntermediateSparql

**Удалены в:** PR #290 (revert issue #288)

**Причина удаления:** Функции отображения промежуточных SPARQL запросов в модальном окне New TriG были удалены при откате PR #289. Функциональность промежуточного SPARQL была признана избыточной для пользователя — достаточно видеть финальный SPARQL в поле "Result in SPARQL".

**Было:**
```javascript
function displayNewTrigIntermediateSparql() { /* показ промежуточных запросов */ }
function toggleNewTrigIntermediateSparql() { /* переключение видимости */ }
```

---

### 4. showNewTrigMessage / hideNewTrigMessage

**Удалены в:** PR #292 (issue #291)

**Причина удаления:** При унификации модальных окон New Concept, New TriG и Del Concept функции сообщений были объединены в общий механизм. Вместо отдельных функций для каждого модального окна теперь используется единый подход к отображению сообщений.

**Было:**
```javascript
function showNewTrigMessage(message, type = 'info') { /* показ сообщения */ }
function hideNewTrigMessage() { /* скрытие сообщения */ }
```

---

### 5. deleteSubjectOld / deleteSubjectNew

**Удалены в:** PR связанный с issue #254

**Причина удаления:** Функции ручного удаления субъектов через строковые манипуляции с TriG контентом были заменены на SPARQL DELETE через Comunica. Переход к `applyTripleToRdfInput` с полноценными SPARQL DELETE WHERE запросами обеспечил надёжность и соответствие стандартам.

**Было:**
```javascript
function deleteSubjectOld(graphContent, subjectName) { /* regex-based удаление */ }
function deleteSubjectNew(graphContent, subjectName) { /* улучшенный regex */ }
```

**Стало:** Использование `applyTripleToRdfInput` с SPARQL DELETE WHERE запросами.
