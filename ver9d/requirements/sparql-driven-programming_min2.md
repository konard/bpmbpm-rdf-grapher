# SPARQL-driven Programming: Примеры и паттерны из кода

Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/332

## Содержание

1. [Введение](#1-введение)
2. [Примеры миграции из кода ver9d](#2-примеры-миграции-из-кода-ver9d)
   - [2.1 Замена currentQuads на currentStore](#21-замена-currentquads-на-currentstore)
   - [2.2 Замена virtualRDFdata на SPARQL](#22-замена-virtualrdfdata-на-sparql)
   - [2.3 Замена nodeTypesCache на SPARQL](#23-замена-nodetypescache-на-sparql)
3. [Паттерны SPARQL-driven Programming](#3-паттерны-sparql-driven-programming)
   - [3.1 Получение данных по типу](#31-получение-данных-по-типу)
   - [3.2 Фильтрация по графу](#32-фильтрация-по-графу)
   - [3.3 Проверка существования](#33-проверка-существования)
   - [3.4 Агрегация данных](#34-агрегация-данных)
   - [3.5 Иерархические запросы](#35-иерархические-запросы)
4. [Реальные примеры из ver9d](#4-реальные-примеры-из-ver9d)
   - [4.1 Получение процессов из ptree](#41-получение-процессов-из-ptree)
   - [4.2 Получение исполнителей из rtree](#42-получение-исполнителей-из-rtree)
   - [4.3 Получение схемы процесса](#43-получение-схемы-процесса)
   - [4.4 Работа с Virtual TriG](#44-работа-с-virtual-trig)
5. [Анти-паттерны и их исправление](#5-анти-паттерны-и-их-исправление)
6. [Рекомендуемые подходы](#6-рекомендуемые-подходы)

---

## 1. Введение

Данный документ дополняет [sparql-driven-programming_min1.md](sparql-driven-programming_min1.md) и содержит **практические примеры** из кодовой базы ver9d, демонстрирующие применение концепции SPARQL-driven programming.

**Ключевой принцип:** `currentStore` (N3.Store) является **единственным источником истины** для всех RDF-данных. Все операции выполняются через SPARQL-запросы или методы N3.Store.

---

## 2. Примеры миграции из кода ver9d

### 2.1 Замена currentQuads на currentStore

**Было (до issue #324):**

```javascript
// vadlib.js - устаревший подход
let currentQuads = [];  // Дублирование данных store

function getFilteredQuads(filterMode) {
    if (!currentQuads || currentQuads.length === 0) {
        return [];
    }
    return currentQuads.filter(quad => isObjectTreeGraph(quad.graph?.value));
}
```

**Стало (после issue #324):**

```javascript
// vadlib.js - SPARQL-driven подход
// issue #324: currentQuads удалён - все операции через currentStore (N3.Store)

function getFilteredQuads(filterMode) {
    // Используем только currentStore.getQuads() как источник данных
    const sourceQuads = (currentStore && typeof currentStore.getQuads === 'function')
        ? currentStore.getQuads(null, null, null, null)
        : [];

    if (!sourceQuads || sourceQuads.length === 0) {
        return [];
    }

    return sourceQuads.filter(quad => isObjectTreeGraph(quad.graph?.value));
}
```

**SPARQL-альтернатива для полной миграции:**

```sparql
# Получить все квады из ObjectTree графов
SELECT ?s ?p ?o ?g WHERE {
    GRAPH ?g {
        ?s ?p ?o .
    }
    FILTER(?g IN (vad:ptree, vad:rtree))
}
```

### 2.2 Замена virtualRDFdata на SPARQL

**Было (до issue #324):**

```javascript
// Устаревший подход - отдельный объект для виртуальных данных
let virtualRDFdata = {};

function getProcessSubtype(processUri) {
    for (const trigUri in virtualRDFdata) {
        const trigData = virtualRDFdata[trigUri];
        if (trigData && trigData[processUri]) {
            return trigData[processUri].processSubtype;
        }
    }
    return null;
}
```

**Стало (после issue #324):**

```javascript
// SPARQL-driven подход - данные в Virtual TriG графах
function getProcessSubtype(processUri) {
    // Получаем подтип напрямую из store
    const quads = currentStore.getQuads(
        N3.DataFactory.namedNode(processUri),
        N3.DataFactory.namedNode('http://example.org/vad#processSubtype'),
        null,
        null
    );
    return quads.length > 0 ? quads[0].object.value : null;
}
```

**SPARQL-версия:**

```sparql
# Получить подтип процесса из Virtual TriG
SELECT ?subtype WHERE {
    GRAPH ?virtualGraph {
        ?virtualGraph rdf:type vad:Virtual .
        <http://example.org/vad#p1_1> vad:processSubtype ?subtype .
    }
}
```

### 2.3 Замена nodeTypesCache на SPARQL

**Было (текущее состояние):**

```javascript
// vadlib.js - кэш типов (ещё не мигрирован)
let nodeTypesCache = {};

// Заполнение при парсинге
quads.forEach(quad => {
    if (quad.predicate.value.endsWith('#type')) {
        if (!nodeTypesCache[quad.subject.value]) {
            nodeTypesCache[quad.subject.value] = [];
        }
        nodeTypesCache[quad.subject.value].push(quad.object.value);
    }
});

// Использование
function isSubjectVadProcess(subjectUri) {
    const types = nodeTypesCache[subjectUri] || [];
    return types.some(t => t === 'vad:TypeProcess' || t === 'http://example.org/vad#TypeProcess');
}
```

**Рекомендуемая миграция:**

```javascript
// SPARQL-driven подход
function getNodeTypes(subjectUri) {
    const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
    const quads = currentStore.getQuads(
        N3.DataFactory.namedNode(subjectUri),
        N3.DataFactory.namedNode(RDF_TYPE),
        null,
        null
    );
    return quads.map(q => q.object.value);
}

function isSubjectVadProcess(subjectUri) {
    const types = getNodeTypes(subjectUri);
    return types.some(t => t.endsWith('#TypeProcess'));
}
```

**SPARQL-версия:**

```sparql
# Проверка: является ли субъект процессом
ASK {
    <http://example.org/vad#p1> rdf:type vad:TypeProcess .
}

# Получить все типы субъекта
SELECT ?type WHERE {
    <http://example.org/vad#p1> rdf:type ?type .
}
```

---

## 3. Паттерны SPARQL-driven Programming

### 3.1 Получение данных по типу

**Паттерн:** Замена `Array.filter()` на SPARQL SELECT

```javascript
// Анти-паттерн (императивный)
const processes = currentQuads.filter(q =>
    q.predicate.value.endsWith('#type') &&
    q.object.value.endsWith('#TypeProcess')
);

// SPARQL-driven паттерн
const processes = funSPARQLvalues(`
    SELECT ?process ?label WHERE {
        ?process rdf:type vad:TypeProcess .
        OPTIONAL { ?process rdfs:label ?label }
    }
`, 'process');
```

### 3.2 Фильтрация по графу

**Паттерн:** Получение данных из конкретного графа

```javascript
// Анти-паттерн (императивный)
const ptreeQuads = currentQuads.filter(q => q.graph?.value === PTREE_GRAPH_URI);

// SPARQL-driven паттерн
const ptreeData = funSPARQLvalues(`
    SELECT ?s ?p ?o WHERE {
        GRAPH vad:ptree {
            ?s ?p ?o .
        }
    }
`, 's');

// Или через N3.Store
const ptreeQuads = currentStore.getQuads(null, null, null, PTREE_GRAPH_URI);
```

### 3.3 Проверка существования

**Паттерн:** Замена `Array.some()` на SPARQL ASK

```javascript
// Анти-паттерн (императивный)
const exists = currentQuads.some(q =>
    q.subject.value === processUri &&
    q.predicate.value.endsWith('#hasTrig')
);

// SPARQL-driven паттерн
const existsQuery = `
    ASK {
        <${processUri}> vad:hasTrig ?trig .
    }
`;
// Выполняется через funSPARQLvaluesComunica
```

### 3.4 Агрегация данных

**Паттерн:** Замена `Array.reduce()` на SPARQL COUNT/GROUP BY

```javascript
// Анти-паттерн (императивный)
const counts = {};
currentQuads.forEach(q => {
    const type = q.object.value;
    counts[type] = (counts[type] || 0) + 1;
});

// SPARQL-driven паттерн
const aggregation = await funSPARQLvaluesComunica(`
    SELECT ?type (COUNT(?subject) AS ?count) WHERE {
        ?subject rdf:type ?type .
    }
    GROUP BY ?type
`, 'type');
```

### 3.5 Иерархические запросы

**Паттерн:** Построение иерархии через vad:hasParentObj

```javascript
// Анти-паттерн (императивный)
function buildHierarchy(quads) {
    const hierarchy = {};
    quads.forEach(q => {
        if (q.predicate.value.endsWith('#hasParentObj')) {
            hierarchy[q.subject.value] = q.object.value;
        }
    });
    return hierarchy;
}

// SPARQL-driven паттерн
const hierarchy = await funSPARQLvaluesComunica(`
    SELECT ?child ?parent ?childLabel WHERE {
        GRAPH ?g {
            ?child vad:hasParentObj ?parent .
            OPTIONAL { ?child rdfs:label ?childLabel }
        }
    }
    ORDER BY ?parent ?child
`, 'child');
```

---

## 4. Реальные примеры из ver9d

### 4.1 Получение процессов из ptree

```javascript
// Файл: 3_sd/3_sd_sparql.js
const SPARQL_QUERIES = {
    PROCESSES_IN_PTREE: `
        SELECT ?process ?label WHERE {
            GRAPH vad:ptree {
                ?process rdf:type vad:TypeProcess .
                OPTIONAL { ?process rdfs:label ?label }
            }
        }
        ORDER BY ?label
    `
};

// Использование
const processes = funSPARQLvalues(
    SPARQL_QUERIES.PROCESSES_IN_PTREE,
    'process'
);
```

### 4.2 Получение исполнителей из rtree

```javascript
// Файл: 3_sd/3_sd_sparql.js
const SPARQL_QUERIES = {
    EXECUTORS_IN_RTREE: `
        SELECT ?executor ?label WHERE {
            GRAPH vad:rtree {
                ?executor rdf:type vad:TypeExecutor .
                OPTIONAL { ?executor rdfs:label ?label }
            }
        }
        ORDER BY ?label
    `
};

// Использование
const executors = funSPARQLvalues(
    SPARQL_QUERIES.EXECUTORS_IN_RTREE,
    'executor'
);
```

### 4.3 Получение схемы процесса

```javascript
// Получить TriG схемы для концепта процесса
const processTriGQuery = `
    SELECT ?trig WHERE {
        GRAPH vad:ptree {
            <${processUri}> vad:hasTrig ?trig .
        }
    }
`;
const trigs = funSPARQLvalues(processTriGQuery, 'trig');

// Получить все индивиды из схемы процесса
const individualsQuery = `
    SELECT ?individ ?type WHERE {
        GRAPH <${trigUri}> {
            ?individ rdf:type ?type .
            FILTER(?type IN (vad:TypeProcess, vad:ExecutorGroup))
        }
    }
`;
const individuals = funSPARQLvalues(individualsQuery, 'individ');
```

### 4.4 Работа с Virtual TriG

```javascript
// Получить все Virtual TriG графы
const virtualGraphsQuery = `
    SELECT ?virtualGraph ?parentGraph WHERE {
        GRAPH ?virtualGraph {
            ?virtualGraph rdf:type vad:Virtual ;
                vad:hasParentObj ?parentGraph .
        }
    }
`;
const virtualGraphs = funSPARQLvalues(virtualGraphsQuery, 'virtualGraph');

// Получить подтипы процессов из Virtual TriG
const subtypesQuery = `
    SELECT ?process ?subtype WHERE {
        GRAPH ?vg {
            ?vg rdf:type vad:Virtual .
            ?process vad:processSubtype ?subtype .
        }
    }
`;
const subtypes = funSPARQLvalues(subtypesQuery, 'process');

// Обновить подтип процесса через SPARQL UPDATE
const updateSubtype = `
    PREFIX vad: <http://example.org/vad#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    DELETE {
        GRAPH vad:vt_p1 {
            vad:p1_1 vad:processSubtype ?oldSubtype .
        }
    }
    INSERT {
        GRAPH vad:vt_p1 {
            vad:p1_1 vad:processSubtype vad:DetailedChild .
        }
    }
    WHERE {
        GRAPH vad:vt_p1 {
            vad:p1_1 vad:processSubtype ?oldSubtype .
        }
    }
`;
await funSPARQLvaluesComunicaUpdate(updateSubtype);
```

---

## 5. Анти-паттерны и их исправление

### 5.1 Дублирование данных в массивах

**Анти-паттерн:**
```javascript
let currentQuads = [];           // Дубликат store
let virtualRDFdata = {};         // Дубликат Virtual TriG
let nodeTypesCache = {};         // Дубликат rdf:type связей
```

**Исправление:**
```javascript
// Используем только currentStore (N3.Store)
// Все запросы через SPARQL или store.getQuads()
```

### 5.2 Императивное построение иерархии

**Анти-паттерн:**
```javascript
function buildTrigHierarchy() {
    const hierarchy = {};
    currentQuads.forEach(quad => {
        if (quad.predicate.value.endsWith('#hasParentObj')) {
            if (!hierarchy[quad.object.value]) {
                hierarchy[quad.object.value] = [];
            }
            hierarchy[quad.object.value].push(quad.subject.value);
        }
    });
    return hierarchy;
}
```

**Исправление:**
```sparql
# SPARQL для получения иерархии
SELECT ?parent ?child WHERE {
    GRAPH ?g {
        ?child vad:hasParentObj ?parent .
    }
}
ORDER BY ?parent ?child
```

### 5.3 Синхронные проверки через кэш

**Анти-паттерн:**
```javascript
function isVirtualGraph(graphUri) {
    return graphUri.startsWith('vt_');  // Только по имени
}
```

**Исправление:**
```javascript
function isVirtualGraph(graphUri) {
    // Первичная проверка через rdf:type (SPARQL-driven)
    if (currentStore) {
        const quads = currentStore.getQuads(
            N3.DataFactory.namedNode(graphUri),
            N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            N3.DataFactory.namedNode('http://example.org/vad#Virtual'),
            N3.DataFactory.namedNode(graphUri)
        );
        if (quads.length > 0) return true;
    }
    // Fallback по имени (для обратной совместимости)
    const localName = getLocalName(graphUri);
    return localName.startsWith('vt_');
}
```

---

## 6. Рекомендуемые подходы

### 6.1 Выбор функции для SPARQL

| Тип запроса | Функция | Когда использовать |
|-------------|---------|-------------------|
| Простой SELECT | `funSPARQLvalues()` | Базовые запросы без OPTIONAL/UNION |
| Сложный SELECT | `funSPARQLvaluesComunica()` | Запросы с OPTIONAL, UNION, FILTER |
| UPDATE (INSERT/DELETE) | `funSPARQLvaluesComunicaUpdate()` | Модификация данных |
| Быстрый поиск | `currentStore.getQuads()` | Когда известны subject/predicate/object/graph |

ASK - забыли? 
### 6.2 Структура SPARQL-запросов

```javascript
// Рекомендуемая структура файла *_sparql.js
const SPARQL_QUERIES = {
    // Группировка по функциональности
    GET_ALL_PROCESSES: `
        SELECT ?process ?label WHERE {
            GRAPH vad:ptree {
                ?process rdf:type vad:TypeProcess .
                OPTIONAL { ?process rdfs:label ?label }
            }
        }
    `,

    GET_PROCESS_BY_URI: (uri) => `
        SELECT ?predicate ?object WHERE {
            GRAPH vad:ptree {
                <${uri}> ?predicate ?object .
            }
        }
    `,

    CHECK_PROCESS_EXISTS: (uri) => `
        ASK {
            <${uri}> rdf:type vad:TypeProcess .
        }
    `
};
```

### 6.3 Обработка результатов SPARQL

```javascript
// Паттерн обработки результатов
async function getProcessesWithSubtypes() {
    // 1. Получить процессы
    const processes = funSPARQLvalues(SPARQL_QUERIES.GET_ALL_PROCESSES, 'process');

    // 2. Обогатить данными из Virtual TriG
    const enriched = await Promise.all(processes.map(async (p) => {
        const subtypeQuery = `
            SELECT ?subtype WHERE {
                GRAPH ?vg {
                    ?vg rdf:type vad:Virtual .
                    <${p.uri}> vad:processSubtype ?subtype .
                }
            }
        `;
        const subtypes = await funSPARQLvaluesComunica(subtypeQuery, 'subtype');
        return {
            ...p,
            subtype: subtypes.length > 0 ? subtypes[0].uri : null
        };
    }));

    return enriched;
}
```

---

## Источники

- [sparql-driven-programming_min1.md](sparql-driven-programming_min1.md) — базовое руководство
- [store_concept_v4.md](../design/store/store_concept_v4.md) — концепция единого хранилища
- [quadstore_io_v3.md](../doc/quadstore_io_v3.md) — документация миграции
- [base_concept_rules.md](../design/base_concept_rules.md) — правила Идеального Quadstore
- [Comunica Documentation](https://comunica.dev/)
- [N3.js GitHub](https://github.com/rdfjs/N3.js)

---

*Документ создан: 2026-02-08*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.0*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/332*
