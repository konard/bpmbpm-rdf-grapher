<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/252 -->

# Алгоритмы создания и удаления концептов и индивидов (v2)

Данный документ является доработкой [io_concept_individ.md](io_concept_individ.md) с учётом рекомендаций из issue #250.

Основные изменения:
1. Замена `checkIdExists(fullUri)` на SPARQL-запрос через `funSPARQLvalues` (п.1)
2. Детальное описание промежуточных SPARQL-запросов (п.3, п.4)
3. Создание `funSPARQLvaluesComunica` для поддержки сложных запросов (п.2)
4. Предложения по корректировке модуля удаления (п.5)
5. Предложения по `funSPARQLvaluesComunicaUpdate` для DELETE/UPDATE операций (п.6)

---

## 1. Создание концепта процесса — SPARQL-ориентированный подход

### 1.1 Проверки при создании (обновлённые)

В соответствии с принципом максимального использования SPARQL-запросов ([sparql-driven-programming_min1.md](../../requirements/sparql-driven-programming_min1.md)), проверки при создании пересмотрены:

| № | Проверка | Функция / Подход | Описание | SPARQL-реализуемость |
|---|----------|------------------|----------|---------------------|
| 1 | **Уникальность ID в ptree** | `funSPARQLvalues` (SPARQL-запрос) | Вместо `checkIdExists(fullUri)`, который напрямую обращается к `currentQuads`, используется SPARQL-запрос через `funSPARQLvalues`. Если результат пустой — объекта нет в запрашиваемом графе | **Да** — реализуется через SPARQL |
| 2 | **Допустимость символов в ID** | `generateIdFromLabel(label)` — JS regex | Regex `[^a-zA-Zа-яА-ЯёЁ0-9_.\-]` удаляет недопустимые символы. Пробелы заменяются на `_` | **Нет** — валидация символов требует JS, SPARQL не имеет средств для проверки формата URI |
| 3 | **Непустое значение rdfs:label** | Проверка формы — JS | Название процесса обязательно для заполнения | **Нет** — проверка UI-формы, выполняется на стороне JS |
| 4 | **Выбор родительского объекта** | `funSPARQLvalues` (SPARQL-запрос) | Справочник родительских элементов формируется SPARQL-запросом. Уже реализовано через `getObjectsForParentSelector` → `funSPARQLvalues` | **Да** — реализуется через SPARQL |

### 1.2 Замена checkIdExists на SPARQL-запрос

**Было (старый подход):**
```javascript
// Прямое обращение к currentQuads — зависимость от библиотеки N3.js
function checkIdExists(uri) {
    return currentQuads.some(quad =>
        quad.subject.value === uri || quad.object.value === uri
    );
}
```

**Стало (SPARQL-ориентированный подход):**
```javascript
// SPARQL-запрос — независимость от используемой библиотеки
function checkIdExistsSparql(fullUri, graphUri) {
    const sparqlQuery = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT ?s WHERE {
    GRAPH <${graphUri}> {
        { <${fullUri}> ?p ?o . BIND(<${fullUri}> AS ?s) }
    }
}`;
    const results = funSPARQLvalues(sparqlQuery, 's');
    return results.length > 0;
}
```

#### Положительные стороны SPARQL-подхода:
1. **Независимость от библиотеки** — при смене JS-библиотеки для работы с quadstore (например, замена N3.js на другую) логика на основе SPARQL-запроса не изменится
2. **Единообразие** — все проверки данных выполняются через один механизм (SPARQL), что упрощает понимание и поддержку кода
3. **Самодокументируемость** — SPARQL-запрос сам по себе описывает, что именно проверяется
4. **Контекст графа** — SPARQL-запрос может проверять уникальность в конкретном графе (ptree или rtree), а не во всех данных сразу, что точнее отражает бизнес-логику
5. **Расширяемость** — легко добавить дополнительные условия в запрос (например, проверку типа объекта)

#### Негативные стороны SPARQL-подхода:
1. **Производительность** — SPARQL-запрос через `funSPARQLvalues` (простой парсер) медленнее прямого перебора `currentQuads`, т.к. добавляется этап парсинга запроса и сопоставления паттернов
2. **Ограничения парсера** — текущий `funSPARQLvalues` не поддерживает UNION, поэтому запрос `CHECK_ID_EXISTS` с конструкцией `{ <uri> ?p ?o } UNION { ?s ?p <uri> }` требует либо `funSPARQLvaluesComunica`, либо упрощения запроса
3. **Сложность отладки** — при ошибке в SPARQL-запросе сложнее понять причину, чем при прямом обращении к массиву

**Рекомендация:** Подход верен и соответствует принципам SPARQL-driven programming. Для проверки уникальности ID достаточно упрощённого запроса (без UNION), проверяющего наличие субъекта в конкретном графе. Для более сложных проверок (наличие URI как объекта) следует использовать `funSPARQLvaluesComunica`.

### 1.3 SPARQL-запросы для создания концепта процесса

#### Промежуточные SPARQL-запросы

**Запрос 1: Получение предикатов из технологического объекта**

```sparql
# --- 1. Получение предикатов из технологического объекта ---
# Вызывается из: getPredicatesForNewConcept(techObjectUri, config)
# Функция выполнения: funSPARQLvalues(sparqlQuery, 'predicate')
# Источник данных: vad:techtree (технологические объекты)
# Назначение: определяет набор полей для формы создания концепта

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?predicate WHERE {
    <http://example.org/vad#ConceptProcessPredicate> vad:includePredicate ?predicate .
}

# Результат funSPARQLvalues:
# [{uri: 'rdf:type'}, {uri: 'rdfs:label'}, {uri: 'dcterms:description'},
#  {uri: 'vad:hasParentObj'}, {uri: 'vad:hasTrig'}]
#
# Если techtree не загружен — результат пустой, используются fallbackPredicates из конфигурации
```

**Запрос 2: Fallback при отсутствии techtree**

```
# --- 2. Fallback: используются предикаты из конфигурации (techtree не загружен) ---
# Вызывается из: getPredicatesForNewConcept(techObjectUri, config)
# Условие: techtree не загружен или SPARQL-запрос вернул пустой результат
# Назначение: обеспечивает работоспособность формы без techtree
#
# -- Нет данных techtree, используются предикаты по умолчанию --
#
# Предикаты по умолчанию берутся из NEW_CONCEPT_CONFIG['vad:TypeProcess'].fallbackPredicates:
# rdf:type, rdfs:label, dcterms:description, vad:hasParentObj, vad:hasTrig
```

**Зачем нужен fallback (п.4 из issue):**
- Файл `vad-basic-ontology_tech_Appendix.ttl` загружается асинхронно при старте приложения функцией `loadTechAppendix()` в `vadlib.js`
- Если файл не найден или не загружен (ошибка сети, первый запуск без TTL файла), techtree будет пустым
- Fallback предикаты обеспечивают минимальный набор полей для создания концепта
- **Предложение:** выводить более явное предупреждение пользователю при использовании fallback, например: `console.warn('ВНИМАНИЕ: techtree не загружен, используются предикаты по умолчанию. Загрузите vad-basic-ontology_tech_Appendix.ttl')` и показывать предупреждение в UI модального окна

**Запрос 3: Получение автоматически генерируемых предикатов**

```sparql
# --- 3. Получение автоматически генерируемых предикатов ---
# Вызывается из: getAutoGeneratedPredicates(techObjectUri)
# Функция выполнения: funSPARQLvalues(sparqlQuery, 'predicate')
# Источник данных: vad:techtree (технологические объекты)
# Назначение: определяет предикаты, которые заполняются автоматически
#             и отображаются серым цветом (заблокированы для редактирования)
#
# В таблице "Проверки при создании" эти предикаты НЕ указаны отдельно,
# т.к. они не являются проверками, а определяют режим отображения полей формы.
# rdf:type — единственный автогенерируемый предикат, его значение устанавливается
# из config.typeValue (например, vad:TypeProcess).

PREFIX vad: <http://example.org/vad#>

SELECT ?predicate WHERE {
    <http://example.org/vad#ConceptProcessPredicate> vad:autoGeneratedPredicate ?predicate .
}

# Результат funSPARQLvalues:
# [{uri: 'rdf:type'}]
# Или пустой массив, если autoGeneratedPredicate не определён в techtree
```

**Запрос 4: Получение объектов для справочника родительских элементов**

```sparql
# --- 4. Получение объектов для справочника родительских элементов ---
# Вызывается из: getObjectsForParentSelector(typeUri, graphUri)
# Функция выполнения: funSPARQLvalues(sparqlQuery, 'object')
# Источник данных: указанный граф (vad:ptree для процессов, vad:rtree для исполнителей)
# Назначение: формирует список объектов для dropdown выбора родительского элемента
#
# ВАЖНО: В таблице "Проверки при создании" (пункт 4) указана функция
# getObjectsForParentSelector(typeUri, graphUri), а не funSPARQLvalues напрямую.
# Причина: getObjectsForParentSelector — это обёртка, которая:
# 1. Формирует SPARQL-запрос
# 2. Вызывает funSPARQLvalues для его выполнения
# 3. При пустом результате использует manual fallback (getObjectsByTypeManual)
#    из-за ограничений funSPARQLvalues (не поддерживает OPTIONAL)
# 4. Сохраняет промежуточный SPARQL-запрос для отображения пользователю

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?object ?label WHERE {
    GRAPH vad:ptree {
        ?object rdf:type vad:TypeProcess .
        OPTIONAL { ?object rdfs:label ?label }
    }
}

# Результат funSPARQLvalues:
# [{uri: 'http://example.org/vad#p1', label: 'p1 Процесс 1'}, ...]
#
# Текущая проблема: funSPARQLvalues не поддерживает OPTIONAL,
# поэтому при отсутствии rdfs:label объект не попадает в результат.
# Решение: использовать funSPARQLvaluesComunica (см. раздел 2).
```

**Запрос 5 (НОВЫЙ): Проверка уникальности ID через SPARQL**

```sparql
# --- 5. Проверка уникальности ID нового концепта ---
# Вызывается из: checkIdExistsSparql(fullUri, graphUri)
# Функция выполнения: funSPARQLvalues(sparqlQuery, 's')
# Назначение: заменяет прямое обращение к currentQuads в checkIdExists()
# Если результат пустой — ID уникален в данном графе

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT ?s WHERE {
    GRAPH vad:ptree {
        { <http://example.org/vad#newId> ?p ?o . BIND(<http://example.org/vad#newId> AS ?s) }
    }
}

# Результат funSPARQLvalues:
# Пустой массив — ID уникален
# [{uri: 'http://example.org/vad#newId'}] — ID уже существует
#
# Примечание: Для полной проверки (URI как subject И как object) требуется UNION:
# { <uri> ?p ?o } UNION { ?s ?p <uri> }
# Это требует funSPARQLvaluesComunica. Для большинства случаев
# достаточно проверки только по subject.
```

### 1.4 Итоговый SPARQL для создания концепта процесса

```sparql
# Генерируется функцией: createNewConceptSparql()
# Вызывает: NEW_CONCEPT_SPARQL.GENERATE_INSERT_QUERY(graphUri, triples, subjectUri, prefixes)

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:ptree {
        vad:p_new rdf:type vad:TypeProcess .
        vad:p_new rdfs:label "Новый процесс" .
        vad:p_new dcterms:description "Описание нового процесса" .
        vad:p_new vad:hasParentObj vad:ptree .
    }
}
```

---

## 2. Создание концепта исполнителя (rtree) — аналогичные требования

Все рекомендации из раздела 1 применимы к созданию концепта исполнителя:

| Аспект | Концепт процесса (ptree) | Концепт исполнителя (rtree) |
|--------|--------------------------|----------------------------|
| Граф | `vad:ptree` | `vad:rtree` |
| Тип | `vad:TypeProcess` | `vad:TypeExecutor` |
| Технологический объект | `vad:ConceptProcessPredicate` | `vad:ConceptExecutorPredicate` |
| Проверка уникальности ID | В графе `vad:ptree` | В графе `vad:rtree` |
| Справочник родителей | Объекты типа `vad:TypeProcess` в ptree | Объекты типа `vad:TypeExecutor` в rtree |
| Fallback предикаты | rdf:type, rdfs:label, dcterms:description, vad:hasParentObj, vad:hasTrig | rdf:type, rdfs:label, dcterms:description, vad:hasParentObj |

**SPARQL для проверки уникальности ID в rtree:**

```sparql
PREFIX vad: <http://example.org/vad#>

SELECT ?s WHERE {
    GRAPH vad:rtree {
        { <http://example.org/vad#newExecutorId> ?p ?o . BIND(<http://example.org/vad#newExecutorId> AS ?s) }
    }
}
```

**Итоговый SPARQL для создания концепта исполнителя:**

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:rtree {
        vad:NewExecutor rdf:type vad:TypeExecutor .
        vad:NewExecutor rdfs:label "Новый исполнитель" .
        vad:NewExecutor vad:hasParentObj vad:Org-structure .
    }
}
```

---

## 3. funSPARQLvaluesComunica — полная поддержка SPARQL

### 3.1 Обоснование

Текущая функция `funSPARQLvalues` (модуль `9_vadlib/vadlib_sparql.js`) имеет ограничения:
- Поддерживает только простые SELECT запросы
- Не поддерживает UNION, OPTIONAL, FILTER, BIND и другие конструкции SPARQL
- Реализована через упрощённый парсер triple patterns

Для полноценного SPARQL-ориентированного программирования необходима функция с полной поддержкой SPARQL через Comunica.

### 3.2 Сигнатура

```javascript
/**
 * Выполняет SPARQL SELECT запрос с полной поддержкой SPARQL через Comunica
 *
 * @param {string} sparqlQuery - SPARQL SELECT запрос (поддерживает UNION, OPTIONAL, FILTER и т.д.)
 * @param {string} variableName - Имя переменной для извлечения (без '?')
 * @returns {Promise<Array<{uri: string, label: string}>>} Массив результатов
 */
async function funSPARQLvaluesComunica(sparqlQuery, variableName = 'value')
```

### 3.3 Ключевые отличия от funSPARQLvalues

| Аспект | funSPARQLvalues | funSPARQLvaluesComunica |
|--------|----------------|------------------------|
| Движок | Собственный парсер triple patterns | Comunica QueryEngine |
| UNION | Не поддерживается | Поддерживается |
| OPTIONAL | Не поддерживается | Поддерживается |
| FILTER | Не поддерживается | Поддерживается |
| BIND | Не поддерживается | Поддерживается |
| ASK | Не поддерживается | Поддерживается (через обёртку) |
| Синхронность | Синхронная | Асинхронная (async/await) |
| Зависимости | Нет (только N3.js для данных) | Comunica библиотека |

### 3.4 Реализация

Файл: `9_vadlib/vadlib_sparql.js` (добавление новой функции)

```javascript
async function funSPARQLvaluesComunica(sparqlQuery, variableName = 'value') {
    const results = [];

    if (!currentStore || currentQuads.length === 0) {
        console.log('funSPARQLvaluesComunica: No data in store');
        return results;
    }

    try {
        // Инициализируем Comunica engine если нужно
        if (!comunicaEngine) {
            if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                comunicaEngine = new Comunica.QueryEngine();
            } else {
                console.error('funSPARQLvaluesComunica: Comunica не загружена');
                return results;
            }
        }

        // Инициализируем store если нужно
        if (!currentStore) {
            currentStore = new N3.Store();
            currentQuads.forEach(quad => currentStore.addQuad(quad));
        }

        // Выполняем запрос через Comunica
        const bindingsStream = await comunicaEngine.queryBindings(sparqlQuery, {
            sources: [currentStore]
        });

        const bindings = await bindingsStream.toArray();

        const seen = new Set();
        bindings.forEach(binding => {
            // Получаем значение основной переменной
            const mainTerm = binding.get(variableName);
            if (!mainTerm) return;

            const value = mainTerm.value;
            if (seen.has(value)) return;
            seen.add(value);

            // Получаем label если есть
            const labelTerm = binding.get('label');
            const label = labelTerm
                ? labelTerm.value
                : getPrefixedName(value, currentPrefixes);

            results.push({ uri: value, label: label });
        });

    } catch (error) {
        console.error('funSPARQLvaluesComunica error:', error);
    }

    return results;
}
```

---

## 4. Предложения по удалению концепта процесса

### 4.1 SPARQL-запросы для удаления концепта процесса

Модуль `3_sd_del_concept_individ_logic.js` уже использует SPARQL-запросы декларативно (через объект `DEL_CONCEPT_SPARQL`), но фактически выполняет проверки через ручной перебор `currentQuads` (manual fallback). Предложения по переводу на SPARQL-ориентированный подход:

**Запрос 1: Получение списка концептов процессов**

```sparql
# Текущий: DEL_CONCEPT_SPARQL.GET_PROCESS_CONCEPTS
# Выполняется через: funSPARQLvalues → manual fallback (getConceptsManual)
# Причина fallback: OPTIONAL в запросе не поддерживается funSPARQLvalues
# Предложение: использовать funSPARQLvaluesComunica

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?concept ?label WHERE {
    GRAPH vad:ptree {
        ?concept rdf:type vad:TypeProcess .
        OPTIONAL { ?concept rdfs:label ?label }
    }
}

# Функция выполнения (предлагаемая): funSPARQLvaluesComunica(sparqlQuery, 'concept')
```

**Запрос 2: Проверка наличия индивидов (использования концепта как подпроцесса)**

```sparql
# Проверка: есть ли использования концепта как индивида в схемах процессов
# Функция: checkProcessIndividuals → findConceptAsIndividualInTrigs (manual)
# Предложение: использовать funSPARQLvaluesComunica

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT ?trig WHERE {
    ?trig rdf:type vad:VADProcessDia .
    GRAPH ?trig {
        <CONCEPT_URI> vad:isSubprocessTrig ?trig .
    }
}

# Функция выполнения (предлагаемая): funSPARQLvaluesComunica(sparqlQuery, 'trig')
```

**Запрос 3: Проверка наличия схемы (hasTrig)**

```sparql
# Текущий: DEL_CONCEPT_SPARQL.CHECK_PROCESS_SCHEMA
# Выполняется через: manual перебор currentQuads
# Предложение: использовать funSPARQLvaluesComunica

PREFIX vad: <http://example.org/vad#>

SELECT ?trig WHERE {
    GRAPH vad:ptree {
        <CONCEPT_URI> vad:hasTrig ?trig .
    }
}

# Функция выполнения (предлагаемая): funSPARQLvaluesComunica(sparqlQuery, 'trig')
# Примечание: этот запрос достаточно простой для funSPARQLvalues,
# но для единообразия лучше использовать funSPARQLvaluesComunica
```

**Запрос 4: Проверка дочерних процессов**

```sparql
# Текущий: DEL_CONCEPT_SPARQL.CHECK_CHILDREN_PROCESSES
# Предложение: использовать funSPARQLvaluesComunica

PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?child ?label WHERE {
    GRAPH vad:ptree {
        ?child vad:hasParentObj <CONCEPT_URI> .
        OPTIONAL { ?child rdfs:label ?label }
    }
}

# Функция выполнения (предлагаемая): funSPARQLvaluesComunica(sparqlQuery, 'child')
```

**Запрос 5: Итоговый DELETE-запрос**

```sparql
# Текущий: DEL_CONCEPT_SPARQL.GENERATE_DELETE_CONCEPT_QUERY
# Генерируется JS-функцией, выводится в "Result in SPARQL"

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

DELETE WHERE {
    GRAPH vad:ptree {
        vad:conceptToDelete ?p ?o .
    }
}
```

### 4.2 funSPARQLvaluesComunicaUpdate — для UPDATE/DELETE операций

Для выполнения DELETE и UPDATE операций через Comunica необходима отдельная функция, т.к. Comunica поддерживает SPARQL Update через отдельный API (`queryVoid`).

**Важно:** В текущей архитектуре приложения DELETE/INSERT запросы **не выполняются** напрямую — они генерируются и выводятся в панель "Result in SPARQL". Пользователь затем решает, применять ли запрос. Поэтому `funSPARQLvaluesComunicaUpdate` на данный момент **не требуется** для модуля удаления.

Однако, если в будущем планируется автоматическое выполнение UPDATE-запросов, реализация может выглядеть так:

```javascript
/**
 * Выполняет SPARQL UPDATE запрос (INSERT/DELETE) через Comunica
 *
 * @param {string} sparqlUpdateQuery - SPARQL UPDATE запрос
 * @returns {Promise<boolean>} true если запрос выполнен успешно
 */
async function funSPARQLvaluesComunicaUpdate(sparqlUpdateQuery) {
    if (!currentStore || currentQuads.length === 0) {
        console.log('funSPARQLvaluesComunicaUpdate: No data in store');
        return false;
    }

    try {
        if (!comunicaEngine) {
            if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                comunicaEngine = new Comunica.QueryEngine();
            } else {
                console.error('funSPARQLvaluesComunicaUpdate: Comunica не загружена');
                return false;
            }
        }

        await comunicaEngine.queryVoid(sparqlUpdateQuery, {
            sources: [currentStore]
        });

        // Обновляем currentQuads после изменения store
        currentQuads = currentStore.getQuads(null, null, null, null);

        return true;
    } catch (error) {
        console.error('funSPARQLvaluesComunicaUpdate error:', error);
        return false;
    }
}
```

### 4.3 Рекомендации по корректировке модуля удаления

1. **Заменить manual fallback на funSPARQLvaluesComunica:**
   - Функции `getConceptsManual`, `findProcessIndividualsManual`, `findConceptAsIndividualInTrigs` — заменить на вызовы `funSPARQLvaluesComunica` с существующими SPARQL-запросами из `DEL_CONCEPT_SPARQL`
   - Это устранит дублирование логики (SPARQL-запрос описан, но не выполняется)

2. **Перевести checkProcessSchema, checkChildrenElements, checkExecutorUsage на funSPARQLvaluesComunica:**
   - Эти функции уже содержат SPARQL-запросы, но выполняют ручной перебор `currentQuads`
   - Замена на `funSPARQLvaluesComunica` сделает код единообразным

3. **Добавить async/await:**
   - `funSPARQLvaluesComunica` асинхронная, поэтому вызывающие функции тоже станут async
   - Это затронет: `onDelConceptSelect`, `performValidationChecks`, `showIndividuals`, `fillConceptDropdown`

4. **Не менять итоговые DELETE-запросы:**
   - Генерация DELETE-запросов в `GENERATE_DELETE_*` функциях корректна
   - Запросы выводятся в "Result in SPARQL" и не выполняются автоматически

---

## 5. Сводная таблица изменённых файлов

| № | Файл | Тип изменения | Описание |
|---|------|---------------|----------|
| 1 | `ver9b/doc/algorithm/io_concept_individ_v2.md` | **Новый** | Данный документ — обновлённые алгоритмы с комментариями |
| 2 | `ver9b/9_vadlib/vadlib_sparql.js` | **Изменён** | Добавлена функция `funSPARQLvaluesComunica` |
| 3 | `ver9b/3_sd/3_sd_create_new_concept/3_sd_create_new_concept_sparql.js` | **Новый** | SPARQL запросы вынесены из _logic.js (issue #252) |
| 4 | `ver9b/3_sd/3_sd_create_new_concept/3_sd_create_new_concept_logic.js` | **Изменён** | Замена `checkIdExists` на `checkIdExistsSparql`, SPARQL запросы вынесены в _sparql.js |
| 5 | `ver9b/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_sparql.js` | **Новый** | SPARQL запросы вынесены из _logic.js (issue #252) |
| 6 | `ver9b/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js` | **Изменён** | Замена manual fallback на funSPARQLvalues (issue #252), SPARQL запросы вынесены в _sparql.js |
| 7 | `ver9b/doc/Folder_Structure.md` | **Изменён** | Обновлена структура папок с учётом новых _sparql.js файлов |
| 8 | `ver9b/index.html` | **Изменён** | Подключены новые _sparql.js файлы |

---

## 6. Общая схема зависимостей (без изменений)

```
vad:ptree (ProcessTree)
 └── vad:p1 (TypeProcess — концепт)
      ├── rdfs:label "p1 Процесс 1"
      ├── dcterms:description "Описание"
      ├── vad:hasParentObj vad:ptree
      ├── vad:hasTrig vad:t_p1 ─────────────────┐
      │                                           │
      └── vad:p1.1 (TypeProcess — дочерний)       │
           └── vad:hasParentObj vad:p1             │
                                                   ▼
                                          vad:t_p1 (VADProcessDia — схема)
                                           ├── rdf:type vad:VADProcessDia
                                           ├── rdfs:label "Схема t_p1 ..."
                                           └── содержит индивидов:
                                                ├── vad:p1.1 (индивид)
                                                │    ├── vad:isSubprocessTrig vad:t_p1
                                                │    ├── vad:hasExecutor vad:ExecutorGroup_p1.1
                                                │    └── vad:hasNext vad:p1.2
                                                └── vad:p1.2 (индивид)
                                                     └── vad:isSubprocessTrig vad:t_p1

vad:rtree (ExecutorTree)
 └── vad:Executor1 (TypeExecutor — концепт)
      ├── rdfs:label "Исполнитель 1"
      └── vad:hasParentObj vad:Org-structure
           │
           └── используется в TriG через:
                vad:ExecutorGroup_p1.1 vad:includes vad:Executor1
```
