# Концепция хранилища quadstore (версия 4)
design/store/store_concept_v4.md 08/02/26
Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/332

## Содержание

1. [Введение](#введение)
2. [Текущее состояние Quadstore](#текущее-состояние-quadstore)
   - [2.1 Реализованные изменения](#21-реализованные-изменения)
   - [2.2 Текущая архитектура](#22-текущая-архитектура)
3. [Анализ оставшихся массивов](#анализ-оставшихся-массивов)
   - [3.1 Массивы для SPARQL-миграции](#31-массивы-для-sparql-миграции)
   - [3.2 Кэши типов объектов](#32-кэши-типов-объектов)
   - [3.3 UI-специфичные массивы](#33-ui-специфичные-массивы)
4. [Рекомендации по дальнейшей миграции](#рекомендации-по-дальнейшей-миграции)
   - [4.1 Высокий приоритет](#41-высокий-приоритет)
   - [4.2 Средний приоритет](#42-средний-приоритет)
   - [4.3 Низкий приоритет](#43-низкий-приоритет)
5. [SPARQL-запросы для замены массивов](#sparql-запросы-для-замены-массивов)
6. [Заключение](#заключение)

---

## Введение

Документ дополняет [store_concept_v3.md](store_concept_v3.md) и фиксирует **текущее состояние** quadstore в ver9c после успешной миграции (issue #324, #325). Документ также анализирует, какие массивы ещё могут быть удалены и заменены на прямые SPARQL-запросы к единственному источнику данных — `currentStore` (N3.Store).

**Принцип SPARQL-driven Programming:** Все операции с данными должны выполняться через SPARQL-запросы, а `currentStore` (N3.Store) должен быть **единственным источником истины** для всех RDF-данных.

---

## Текущее состояние Quadstore

### 2.1 Реализованные изменения

По результатам issue #324 и #325 выполнены следующие изменения:

| Требование | Статус | Комментарий |
|------------|--------|-------------|
| Единое хранилище `currentStore` | ✅ Реализовано | Все операции через N3.Store |
| Удалён `currentQuads` | ✅ Удалён | Глобальный массив полностью удалён |
| Удалён `virtualRDFdata` | ✅ Удалён | Объект полностью удалён |
| Semantic Reasoning | ✅ Реализовано | `performSemanticReasoning()` |
| Virtual TriG в store | ✅ Реализовано | Виртуальные данные в графах `vad:vt_*` |

### 2.2 Текущая архитектура

```
┌───────────────────────────────────────────────────────────────────────┐
│                    ТЕКУЩАЯ АРХИТЕКТУРА (v4)                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                 ┌─────────────────────────────┐                       │
│                 │        currentStore         │                       │
│                 │         (N3.Store)          │                       │
│                 │    Единственный источник    │                       │
│                 │        RDF-данных           │                       │
│                 └──────────────┬──────────────┘                       │
│                                │                                      │
│     ┌──────────────────────────┼──────────────────────────┐           │
│     │                          │                          │           │
│     ▼                          ▼                          ▼           │
│ ┌────────────┐          ┌────────────┐          ┌─────────────────┐   │
│ │   SPARQL   │          │ N3 Rules   │          │store.getQuads() │   │
│ │  SELECT    │          │ Reasoner   │          │ store.addQuad() │   │
│ │  UPDATE    │          │            │          │ store.removeQuad│   │
│ └────────────┘          └────────────┘          └─────────────────┘   │
│                                                                       │
│  ✅ Удалённые массивы:                                                │
│     - currentQuads (дублировал store)                                 │
│     - virtualRDFdata (теперь в vad:vt_* графах)                       │
│                                                                       │
│  ⚠️ Оставшиеся массивы для анализа:                                   │
│     - nodeTypesCache                                                  │
│     - nodeSubtypesCache                                               │
│     - trigHierarchy                                                   │
│     - allTrigGraphs                                                   │
│     - techAppendixData                                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Анализ оставшихся массивов

Анализ файла `9_vadlib/vadlib.js` и других модулей ver9c выявил следующие массивы и кэши, которые потенциально могут быть заменены SPARQL-запросами:

### 3.1 Массивы для SPARQL-миграции

| Массив | Файл | Назначение | SPARQL-альтернатива | Рекомендация |
|--------|------|------------|---------------------|--------------|
| `nodeTypesCache` | vadlib.js | Кэш типов узлов (rdf:type) | `SELECT ?type WHERE { ?s rdf:type ?type }` | **Удалить** |
| `nodeSubtypesCache` | vadlib.js | Кэш подтипов процессов | `SELECT ?subtype WHERE { ?s vad:processSubtype ?subtype }` | **Удалить** |
| `trigHierarchy` | vadlib.js | Иерархия TriG графов | `SELECT ?g ?parent WHERE { GRAPH ?g { ?g vad:hasParentObj ?parent } }` | **Удалить** |
| `allTrigGraphs` | vadlib.js | Список всех TriG графов | `SELECT DISTINCT ?g WHERE { GRAPH ?g { ?s ?p ?o } }` | **Удалить** |
| `allPredicates` | vadlib.js | Список всех предикатов | `SELECT DISTINCT ?p WHERE { ?s ?p ?o }` | **Удалить** |

### 3.2 Кэши типов объектов

**`nodeTypesCache`** — кэширует rdf:type для каждого субъекта:

```javascript
// Текущая реализация (императивная)
let nodeTypesCache = {};
// Заполняется при парсинге квадов:
nodeTypesCache[subjectUri] = [type1, type2, ...];
```

**SPARQL-альтернатива:**

```sparql
# Получить все типы для конкретного субъекта
SELECT ?type WHERE {
    <http://example.org/vad#p1> rdf:type ?type .
}

# Получить все субъекты определённого типа
SELECT ?subject WHERE {
    ?subject rdf:type vad:TypeProcess .
}
```

**Анализ:** Кэш `nodeTypesCache` можно удалить, заменив все обращения на SPARQL-запросы к `currentStore`. Производительность может незначительно снизиться, но это соответствует принципу SPARQL-driven programming.

---

**`nodeSubtypesCache`** — кэширует vad:processSubtype:

```javascript
// Текущая реализация (императивная)
let nodeSubtypesCache = {};
// Заполняется из Virtual TriG:
nodeSubtypesCache[processUri] = 'DetailedChild';
```

**SPARQL-альтернатива:**

```sparql
# Получить подтип конкретного процесса
SELECT ?subtype WHERE {
    GRAPH ?virtualGraph {
        ?virtualGraph rdf:type vad:Virtual .
        <http://example.org/vad#p1_1> vad:processSubtype ?subtype .
    }
}

# Получить все процессы с их подтипами
SELECT ?process ?subtype WHERE {
    GRAPH ?virtualGraph {
        ?virtualGraph rdf:type vad:Virtual .
        ?process vad:processSubtype ?subtype .
    }
}
```

**Анализ:** Кэш `nodeSubtypesCache` можно удалить, заменив обращения на SPARQL-запросы к виртуальным графам (`vad:vt_*`).

### 3.3 UI-специфичные массивы

| Массив | Назначение | Анализ |
|--------|------------|--------|
| `openPropertiesPanels` | Список открытых панелей свойств | UI-состояние, не RDF-данные |
| `diagramNavigationHistory` | История навигации по диаграммам | UI-состояние, не RDF-данные |
| `activeFilters` | Активные фильтры предикатов | UI-конфигурация |

**Рекомендация:** Эти массивы не содержат RDF-данных и не требуют миграции на SPARQL. Они управляют состоянием UI.

---

## Рекомендации по дальнейшей миграции

### 4.1 Высокий приоритет

Следующие массивы рекомендуется удалить в ближайшей итерации:

| Массив | Причина | SPARQL-замена | Сложность |
|--------|---------|---------------|-----------|
| `nodeTypesCache` | Дублирует данные store | `SELECT ?type WHERE { ?s rdf:type ?type }` | Низкая |
| `nodeSubtypesCache` | Дублирует Virtual TriG | `SELECT ?subtype WHERE { ?s vad:processSubtype ?subtype }` | Низкая |

**План миграции `nodeTypesCache`:**

1. Создать функцию `getNodeTypes(subjectUri)`:
   ```javascript
   function getNodeTypes(subjectUri) {
       const quads = currentStore.getQuads(
           N3.DataFactory.namedNode(subjectUri),
           N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
           null,
           null
       );
       return quads.map(q => q.object.value);
   }
   ```

2. Заменить все обращения `nodeTypesCache[uri]` на `getNodeTypes(uri)`

3. Удалить переменную `nodeTypesCache` и код её заполнения

**План миграции `nodeSubtypesCache`:**

1. Создать функцию `getProcessSubtype(processUri)`:
   ```javascript
   function getProcessSubtype(processUri) {
       const quads = currentStore.getQuads(
           N3.DataFactory.namedNode(processUri),
           N3.DataFactory.namedNode('http://example.org/vad#processSubtype'),
           null,
           null
       );
       return quads.length > 0 ? quads[0].object.value : null;
   }
   ```

2. Заменить все обращения `nodeSubtypesCache[uri]` на `getProcessSubtype(uri)`

3. Удалить переменную `nodeSubtypesCache` и связанный код

### 4.2 Средний приоритет

| Массив | Причина | SPARQL-замена | Сложность |
|--------|---------|---------------|-----------|
| `trigHierarchy` | Дублирует hasParentObj | `SELECT ?g ?parent WHERE { GRAPH ?g { ?g vad:hasParentObj ?parent } }` | Средняя |
| `allTrigGraphs` | Дублирует структуру store | `SELECT DISTINCT ?g WHERE { GRAPH ?g { ?s ?p ?o } }` | Низкая |

**Plan миграции `trigHierarchy`:**

```sparql
# SPARQL для построения иерархии TriG
SELECT ?graph ?graphType ?parentGraph WHERE {
    GRAPH ?graph {
        ?graph rdf:type ?graphType .
        OPTIONAL { ?graph vad:hasParentObj ?parentGraph }
    }
    FILTER(?graphType IN (vad:ObjectTree, vad:VADProcessDia, vad:Virtual, vad:TechnoTree))
}
ORDER BY ?parentGraph ?graph
```

### 4.3 Низкий приоритет

| Массив | Причина | Рекомендация |
|--------|---------|--------------|
| `techAppendixData` | Кэш технологической онтологии | Оставить как кэш для производительности |
| `allPredicates` | Используется для UI фильтров | Можно заменить на SPARQL, но низкий приоритет |

**Обоснование для `techAppendixData`:**
- Технологическая онтология (vad-basic-ontology_tech_Appendix.ttl) неизменна в runtime
- Данные уже загружаются в `currentStore` как граф `vad:techtree`
- Объект `techAppendixData` служит оптимизированным кэшем для частых операций
- Рекомендуется сохранить как гибридный подход для критических по производительности операций

---

## SPARQL-запросы для замены массивов

### 5.1 Получение типов узла (замена nodeTypesCache)

```sparql
# Получить все типы для субъекта
SELECT ?type WHERE {
    <${subjectUri}> rdf:type ?type .
}
```

### 5.2 Получение подтипа процесса (замена nodeSubtypesCache)

```sparql
# Получить подтип из Virtual TriG
SELECT ?subtype WHERE {
    GRAPH ?vg {
        ?vg rdf:type vad:Virtual .
        <${processUri}> vad:processSubtype ?subtype .
    }
}
```

### 5.3 Построение иерархии TriG (замена trigHierarchy)

```sparql
# Построить полную иерархию TriG
SELECT ?graph ?graphType ?graphLabel ?parentGraph WHERE {
    GRAPH ?graph {
        ?graph rdf:type ?graphType .
        OPTIONAL { ?graph rdfs:label ?graphLabel }
        OPTIONAL { ?graph vad:hasParentObj ?parentGraph }
    }
    FILTER(?graphType IN (
        vad:ObjectTree,
        vad:VADProcessDia,
        vad:Virtual,
        vad:TechnoTree,
        vad:TechTree
    ))
}
ORDER BY ?parentGraph ?graph
```

### 5.4 Получение всех графов (замена allTrigGraphs)

```sparql
# Получить все уникальные графы
SELECT DISTINCT ?graph WHERE {
    GRAPH ?graph { ?s ?p ?o }
}
```

### 5.5 Проверка типа графа (замена isVirtualGraph)

```sparql
# SPARQL ASK для проверки типа Virtual
ASK {
    GRAPH <${graphUri}> {
        <${graphUri}> rdf:type vad:Virtual .
    }
}
```

### 5.6 Получение всех предикатов (замена allPredicates)

```sparql
# Получить все уникальные предикаты
SELECT DISTINCT ?predicate WHERE {
    ?s ?predicate ?o .
}
```

---

## Заключение

### Текущий статус

После issue #324 и #325 достигнуто:
- ✅ `currentStore` (N3.Store) — единственный источник RDF-данных
- ✅ `currentQuads` — удалён
- ✅ `virtualRDFdata` — удалён (данные в vad:vt_* графах)

### Оставшиеся массивы для миграции

**Высокий приоритет (рекомендуется удалить):**
1. `nodeTypesCache` — заменить на `currentStore.getQuads()` с фильтром по rdf:type
2. `nodeSubtypesCache` — заменить на запрос к Virtual TriG графам

**Средний приоритет (можно мигрировать):**
3. `trigHierarchy` — заменить на SPARQL с vad:hasParentObj
4. `allTrigGraphs` — заменить на SPARQL SELECT DISTINCT ?graph

**Сохранить (гибридный подход):**
5. `techAppendixData` — кэш неизменяемой технологической онтологии

### Критерий успеха SPARQL-driven Programming

Код соответствует концепции SPARQL-driven programming, когда:
- Все RDF-данные хранятся только в `currentStore` (N3.Store)
- Все операции чтения данных выполняются через SPARQL или `store.getQuads()`
- Все операции модификации выполняются через SPARQL UPDATE или `store.addQuad()/removeQuad()`
- Кэши используются только для неизменяемых данных (онтология) или UI-состояния

---

*Документ создан: 2026-02-08*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 4.0*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/332*

## Источники

- [store_concept_v3.md](store_concept_v3.md) — предыдущая версия
- [store_concept_v2.md](store_concept_v2.md)
- [store_concept_v1.md](store_concept_v1.md)
- [quadstore_io_v3.md](../../doc/quadstore_io_v3.md) — документация завершённой миграции
- [base_concept_rules.md](../base_concept_rules.md) — концептуальные правила Идеального Quadstore
- [SPARQL-driven Programming](../../requirements/sparql-driven-programming_min1.md)
