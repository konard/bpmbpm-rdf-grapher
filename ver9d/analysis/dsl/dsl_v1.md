# DSL для BPM/EA: Надстройка над SPARQL

**Ссылка на issue:** https://github.com/bpmbpm/rdf-grapher/issues/415
**Версия:** 1.0
**Дата:** 2026-02-17

---

## Содержание

1. [Введение](#1-введение)
2. [Анализ требований](#2-анализ-требований)
3. [Обзор существующих подходов](#3-обзор-существующих-подходов)
4. [Варианты DSL для BPM/EA](#4-варианты-dsl-для-bpmea)
5. [Детальное описание предлагаемого DSL](#5-детальное-описание-предлагаемого-dsl)
6. [Трансляция DSL в SPARQL](#6-трансляция-dsl-в-sparql)
7. [Интеграция с текущим проектом](#7-интеграция-с-текущим-проектом)
8. [Примеры использования](#8-примеры-использования)
9. [Сравнение подходов](#9-сравнение-подходов)
10. [Рекомендации](#10-рекомендации)

---

## 1. Введение

### 1.1 Цель документа

Данный документ представляет анализ и предложение по созданию Domain-Specific Language (DSL) для моделирования бизнес-процессов и enterprise-архитектуры (BPM/EA), который:
- Является надстройкой над SPARQL
- Использует терминологию проекта: концепт процесса, индивид процесса, схема процесса
- Обеспечивает прямую трансляцию в набор SPARQL-запросов
- Позволяет работать с "процессной механикой" в связке с онтологией

### 1.2 Контекст

Проект RDF Grapher использует подход **SPARQL-driven programming**, при котором:
- Бизнес-логика описывается декларативно через SPARQL-запросы
- JavaScript используется минимально — только для UI и координации
- Данные и их структура определяются онтологией VAD (Value Added Diagram)
- Справочники и формы генерируются динамически на основе метаданных

DSL призван обеспечить более высокий уровень абстракции для работы с процессной механикой, сохраняя при этом полный контроль над кодом через трансляцию в SPARQL.

### 1.3 Ключевые термины

| Термин | Описание | Онтология |
|--------|----------|-----------|
| **Концепт процесса** | Общее понятие процесса, хранится в `vad:ptree` | `vad:TypeProcess` |
| **Индивид процесса** | Конкретное воплощение концепта в схеме | Instance в `VADProcessDia` |
| **Схема процесса** | Именованный граф TriG со связями между индивидами | `vad:VADProcessDia` |
| **Исполнитель** | Роль/должность/подразделение | `vad:TypeExecutor` |
| **Группа исполнителей** | Группировка исполнителей для процесса | `vad:ExecutorGroup` |

---

## 2. Анализ требований

### 2.1 Основные требования из issue #415

1. **DSL как надстройка над SPARQL** — более агрегированные запросы
2. **Терминология BPM/EA** — концепт процесса, индивид процесса, схема процесса
3. **Прямая трансляция в SPARQL** — возможность видеть результирующие SPARQL-запросы
4. **Абсолютный контроль над кодом** — проще контролировать агрегированные функции, чем SPARQL напрямую
5. **Связка с онтологией** — работа в терминах VAD Ontology

### 2.2 Функциональные требования

| ID | Требование | Приоритет |
|----|------------|-----------|
| F1 | Создание концепта процесса в ptree | Высокий |
| F2 | Создание индивида процесса в схеме | Высокий |
| F3 | Создание схемы процесса (TriG) | Высокий |
| F4 | Связывание процессов через hasNext | Высокий |
| F5 | Назначение исполнителей процессам | Высокий |
| F6 | Создание иерархии процессов (hasParentObj) | Средний |
| F7 | Создание исполнителей в rtree | Средний |
| F8 | Запросы к данным (поиск, фильтрация) | Средний |
| F9 | Валидация данных | Низкий |
| F10 | Batch-операции | Низкий |

### 2.3 Нефункциональные требования

1. **Читаемость** — синтаксис понятен бизнес-аналитикам
2. **Расширяемость** — возможность добавления новых конструкций
3. **Отладка** — возможность просмотра сгенерированных SPARQL
4. **Интеграция** — совместимость с текущим кодом (funSPARQLvalues, funSPARQLvaluesComunica)
5. **Производительность** — не хуже чем прямое использование SPARQL

---

## 3. Обзор существующих подходов

### 3.1 Текущее состояние проекта

#### 3.1.1 SPARQL-driven programming

Проект уже использует SPARQL-driven подход через следующие функции:
- `funSPARQLvalues()` — простые SELECT запросы
- `funSPARQLvaluesComunica()` — сложные запросы (UNION, OPTIONAL, FILTER)
- `funSPARQLvaluesComunicaUpdate()` — INSERT/DELETE операции

#### 3.1.2 Существующие SPARQL-паттерны (из 3_sd_sparql.js)

```javascript
const SPARQL_QUERIES = {
    // Получение индивидов процессов в TriG
    PROCESS_INDIVIDUALS_IN_TRIG: (trigUri) => `
        SELECT ?process ?label WHERE {
            GRAPH <${trigUri}> {
                ?process vad:isSubprocessTrig <${trigUri}> .
            }
            GRAPH vad:ptree {
                ?process rdfs:label ?label .
            }
        }
    `,

    // Получение концептов процессов из ptree
    PROCESS_CONCEPTS_IN_PTREE: `
        SELECT ?process ?label WHERE {
            GRAPH vad:ptree {
                ?process rdf:type vad:Process .
                ?process rdfs:label ?label .
            }
        }
    `
};
```

### 3.2 DSL-подход из ver8tree (dsl-concepts.md)

В проекте уже есть наработки DSL (см. `ver8tree/requirements/dsl-concepts.md`):

```
// Существующий синтаксис DSL
PROCESS_TREE {
    mainProcess "Order Management" {
        receiveOrder "Receive Order" [DETAILED]
        validateOrder "Validate Order"
    }
}

SCHEMA receiveOrder {
    SUBPROCESS checkInventory "Check Inventory"
        EXECUTOR: department.developer
        NEXT: prepareInvoice
}
```

### 3.3 Сравнение подходов

| Аспект | Чистый SPARQL | Существующий DSL | Предлагаемый DSL |
|--------|---------------|------------------|------------------|
| Абстракция | Низкая | Средняя | Высокая |
| Терминология | RDF/SPARQL | Смешанная | BPM/EA |
| Читаемость | Низкая | Средняя | Высокая |
| Гибкость | Максимальная | Ограниченная | Сбалансированная |
| Контроль | Прямой | Опосредованный | Прозрачный |

---

## 4. Варианты DSL для BPM/EA

### 4.1 Вариант A: Декларативный DSL (JSON-подобный)

#### Синтаксис

```javascript
const model = {
    processConcepts: {
        orderManagement: {
            label: "Управление заказами",
            parent: "ptree",
            schema: {
                processes: [
                    { concept: "receiveOrder", executor: ["sales.manager"] },
                    { concept: "validateOrder", executor: ["qa.specialist"], next: "processPayment" },
                    { concept: "processPayment", executor: ["finance.accountant"] }
                ]
            }
        }
    }
};
```

#### Преимущества
- Нативная интеграция с JavaScript
- IDE-поддержка (автодополнение, проверка типов)
- Легко сериализуется в JSON

#### Недостатки
- Многословность
- Не похож на естественный язык

### 4.2 Вариант B: Текстовый DSL (BPM-ориентированный)

#### Синтаксис

```
# Определение концептов процессов
КОНЦЕПТ ПРОЦЕССА "Управление заказами" AS orderManagement {
    РОДИТЕЛЬ: ptree
    ОПИСАНИЕ: "Основной процесс управления заказами клиентов"
}

КОНЦЕПТ ПРОЦЕССА "Приём заказа" AS receiveOrder {
    РОДИТЕЛЬ: orderManagement
}

# Определение схемы процесса
СХЕМА ПРОЦЕССА orderManagement {
    ИНДИВИД receiveOrder {
        ИСПОЛНИТЕЛЬ: sales.manager
        ДАЛЕЕ: validateOrder
    }

    ИНДИВИД validateOrder {
        ИСПОЛНИТЕЛЬ: qa.specialist
        ДАЛЕЕ: processPayment
    }

    ИНДИВИД processPayment {
        ИСПОЛНИТЕЛЬ: finance.accountant
    }
}
```

#### Преимущества
- Русскоязычная терминология (или английская альтернатива)
- Близость к естественному языку
- Понятен бизнес-аналитикам

#### Недостатки
- Требует парсера
- Менее интегрирован с JavaScript

### 4.3 Вариант C: Fluent API (JavaScript-цепочки)

#### Синтаксис

```javascript
BPM.concept("Управление заказами")
    .as("orderManagement")
    .parent("ptree")
    .description("Основной процесс управления заказами")
    .schema(schema => schema
        .individual("receiveOrder")
            .executor("sales.manager")
            .next("validateOrder")
        .individual("validateOrder")
            .executor("qa.specialist")
            .next("processPayment")
        .individual("processPayment")
            .executor("finance.accountant")
    )
    .toSPARQL();
```

#### Преимущества
- Полная интеграция с JavaScript
- IDE-поддержка
- Цепочечный синтаксис читаем
- Не требует парсера

#### Недостатки
- Сложнее для не-программистов

### 4.4 Вариант D: Гибридный подход (Macro Functions)

#### Синтаксис

```javascript
// Макро-функции для типичных операций
const sparql = DSL.createProcessConcept({
    id: "orderManagement",
    label: "Управление заказами",
    parent: "ptree",
    description: "Основной процесс"
});

// Комбинирование макросов
const batch = DSL.batch([
    DSL.createProcessConcept({ ... }),
    DSL.createProcessSchema({ ... }),
    DSL.linkProcesses("receiveOrder", "validateOrder"),
    DSL.assignExecutor("receiveOrder", "sales.manager")
]);

// Получение итогового SPARQL
console.log(batch.toSPARQL());
// или выполнение
await batch.execute();
```

#### Преимущества
- Максимальный контроль
- Прозрачность трансляции
- Легко расширяется

#### Недостатки
- Императивный стиль

---

## 5. Детальное описание предлагаемого DSL

### 5.1 Рекомендуемый подход: Гибридный (Вариант D + элементы C)

Комбинация **Macro Functions** с **Fluent API** обеспечивает:
1. Прозрачность трансляции в SPARQL (требование абсолютного контроля)
2. Читаемость для разработчиков
3. Расширяемость
4. Интеграцию с существующим кодом

### 5.2 Архитектура DSL

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DSL Layer                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Concepts   │  │   Schemas    │  │   Executors  │               │
│  │   Builder    │  │   Builder    │  │   Builder    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SPARQL Generator Layer                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  INSERT DATA / DELETE WHERE / SELECT / ASK generators        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Execution Layer                                │
│  ┌────────────────────┐  ┌────────────────────┐                     │
│  │ funSPARQLvalues    │  │ funSPARQLvalues   │                     │
│  │ ComunicaUpdate     │  │ Comunica          │                     │
│  └────────────────────┘  └────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Основные классы/модули DSL

#### 5.3.1 ProcessConceptBuilder — Работа с концептами процессов

```javascript
/**
 * DSL для работы с концептами процессов (vad:TypeProcess в vad:ptree)
 */
class ProcessConceptBuilder {
    constructor(id) {
        this.id = id;
        this.properties = {};
    }

    label(text) {
        this.properties.label = text;
        return this;
    }

    parent(parentId) {
        this.properties.parent = parentId;
        return this;
    }

    description(text) {
        this.properties.description = text;
        return this;
    }

    hasTrig(trigId) {
        this.properties.hasTrig = trigId;
        return this;
    }

    /**
     * Генерирует SPARQL INSERT DATA запрос
     */
    toSPARQL() {
        const triples = [
            `vad:${this.id} rdf:type vad:TypeProcess`,
            `vad:${this.id} rdfs:label "${this.properties.label}"`,
            `vad:${this.id} vad:hasParentObj vad:${this.properties.parent || 'ptree'}`
        ];

        if (this.properties.description) {
            triples.push(`vad:${this.id} dcterms:description "${this.properties.description}"`);
        }

        if (this.properties.hasTrig) {
            triples.push(`vad:${this.id} vad:hasTrig vad:${this.properties.hasTrig}`);
        }

        return `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:ptree {
        ${triples.join(' .\n        ')} .
    }
}`;
    }

    /**
     * Выполняет SPARQL через funSPARQLvaluesComunicaUpdate
     */
    async execute() {
        const sparql = this.toSPARQL();
        return await funSPARQLvaluesComunicaUpdate(sparql);
    }
}
```

#### 5.3.2 SchemaBuilder — Работа со схемами процессов

```javascript
/**
 * DSL для работы со схемами процессов (vad:VADProcessDia)
 */
class SchemaBuilder {
    constructor(id) {
        this.id = id;
        this.individuals = [];
        this.properties = {};
    }

    label(text) {
        this.properties.label = text;
        return this;
    }

    parent(parentId) {
        this.properties.parent = parentId;
        return this;
    }

    /**
     * Добавляет индивид процесса в схему
     */
    individual(conceptId) {
        const indiv = new IndividualBuilder(conceptId, this.id);
        this.individuals.push(indiv);
        return indiv;
    }

    /**
     * Генерирует SPARQL для создания схемы со всеми индивидами
     */
    toSPARQL() {
        const schemaTriples = [
            `vad:${this.id} rdf:type vad:VADProcessDia`,
            `vad:${this.id} vad:hasParentObj vad:${this.properties.parent || 'root'}`
        ];

        if (this.properties.label) {
            schemaTriples.push(`vad:${this.id} rdfs:label "${this.properties.label}"`);
        }

        const individualTriples = this.individuals.flatMap(ind => ind.getTriples());

        const allTriples = [...schemaTriples, ...individualTriples];

        return `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:${this.id} {
        ${allTriples.join(' .\n        ')} .
    }
}`;
    }
}

/**
 * Вспомогательный класс для индивидов в схеме
 */
class IndividualBuilder {
    constructor(conceptId, schemaId) {
        this.conceptId = conceptId;
        this.schemaId = schemaId;
        this.properties = {};
    }

    executor(...executorIds) {
        this.properties.executors = executorIds;
        return this;
    }

    next(nextConceptId) {
        this.properties.next = nextConceptId;
        return this;
    }

    /**
     * Возвращает триплеты для этого индивида
     */
    getTriples() {
        const triples = [
            `vad:${this.conceptId} vad:isSubprocessTrig vad:${this.schemaId}`
        ];

        if (this.properties.executors && this.properties.executors.length > 0) {
            const groupId = `ExecutorGroup_${this.conceptId}`;
            triples.push(`vad:${this.conceptId} vad:hasExecutor vad:${groupId}`);
            triples.push(`vad:${groupId} rdf:type vad:ExecutorGroup`);
            this.properties.executors.forEach(ex => {
                triples.push(`vad:${groupId} vad:includes vad:${ex}`);
            });
        }

        if (this.properties.next) {
            triples.push(`vad:${this.conceptId} vad:hasNext vad:${this.properties.next}`);
        }

        return triples;
    }
}
```

#### 5.3.3 ExecutorBuilder — Работа с исполнителями

```javascript
/**
 * DSL для работы с исполнителями (vad:TypeExecutor в vad:rtree)
 */
class ExecutorBuilder {
    constructor(id) {
        this.id = id;
        this.properties = {};
    }

    label(text) {
        this.properties.label = text;
        return this;
    }

    parent(parentId) {
        this.properties.parent = parentId;
        return this;
    }

    description(text) {
        this.properties.description = text;
        return this;
    }

    toSPARQL() {
        const triples = [
            `vad:${this.id} rdf:type vad:TypeExecutor`,
            `vad:${this.id} rdfs:label "${this.properties.label}"`,
            `vad:${this.id} vad:hasParentObj vad:${this.properties.parent || 'rtree'}`
        ];

        if (this.properties.description) {
            triples.push(`vad:${this.id} dcterms:description "${this.properties.description}"`);
        }

        return `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:rtree {
        ${triples.join(' .\n        ')} .
    }
}`;
    }
}
```

### 5.4 Главный DSL API

```javascript
/**
 * Главный API для DSL
 * Точка входа для всех операций
 */
const BPM = {
    /**
     * Создаёт концепт процесса
     * @param {string} id - Идентификатор концепта
     * @returns {ProcessConceptBuilder}
     */
    concept(id) {
        return new ProcessConceptBuilder(id);
    },

    /**
     * Создаёт схему процесса
     * @param {string} id - Идентификатор схемы (без префикса t_)
     * @returns {SchemaBuilder}
     */
    schema(id) {
        return new SchemaBuilder(`t_${id}`);
    },

    /**
     * Создаёт исполнителя
     * @param {string} id - Идентификатор исполнителя
     * @returns {ExecutorBuilder}
     */
    executor(id) {
        return new ExecutorBuilder(id);
    },

    /**
     * Запросы к данным
     */
    query: {
        /**
         * Получить все концепты процессов
         */
        allProcessConcepts() {
            return funSPARQLvalues(SPARQL_QUERIES.PROCESS_CONCEPTS_IN_PTREE, 'process');
        },

        /**
         * Получить индивидов процессов в схеме
         */
        processIndividualsIn(schemaId) {
            return funSPARQLvalues(
                SPARQL_QUERIES.PROCESS_INDIVIDUALS_IN_TRIG(`http://example.org/vad#${schemaId}`),
                'process'
            );
        },

        /**
         * Получить все исполнителей
         */
        allExecutors() {
            return funSPARQLvalues(SPARQL_QUERIES.EXECUTORS_IN_RTREE, 'executor');
        },

        /**
         * Проверить существование концепта
         */
        async conceptExists(conceptId) {
            const result = await funSPARQLvaluesComunica(`
                ASK {
                    GRAPH vad:ptree {
                        vad:${conceptId} rdf:type vad:TypeProcess .
                    }
                }
            `, 'exists');
            return result.length > 0;
        }
    },

    /**
     * Batch-операции
     */
    batch(operations) {
        return {
            toSPARQL() {
                return operations.map(op => op.toSPARQL()).join('\n;\n\n');
            },
            async execute() {
                for (const op of operations) {
                    await op.execute();
                }
            }
        };
    }
};
```

---

## 6. Трансляция DSL в SPARQL

### 6.1 Таблица соответствия операций DSL и SPARQL

| DSL Операция | SPARQL Шаблон | Граф |
|--------------|---------------|------|
| Создание концепта процесса | INSERT DATA + rdf:type vad:TypeProcess | vad:ptree |
| Создание индивида процесса | INSERT DATA + vad:isSubprocessTrig | VADProcessDia (vad:t_*) |
| Создание схемы процесса | INSERT DATA + rdf:type vad:VADProcessDia | Metadata |
| Связь hasNext | INSERT DATA + vad:hasNext | VADProcessDia |
| Назначение исполнителя | INSERT DATA + vad:hasExecutor + vad:includes | VADProcessDia |
| Удаление концепта | DELETE WHERE | vad:ptree |
| Запрос концептов | SELECT | vad:ptree |
| Запрос индивидов | SELECT + GRAPH | VADProcessDia |

### 6.2 Примеры трансляции

#### DSL → SPARQL: Создание концепта процесса

**DSL:**
```javascript
BPM.concept("orderManagement")
    .label("Управление заказами")
    .parent("ptree")
    .description("Основной процесс управления заказами")
    .toSPARQL();
```

**SPARQL:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:ptree {
        vad:orderManagement rdf:type vad:TypeProcess .
        vad:orderManagement rdfs:label "Управление заказами" .
        vad:orderManagement vad:hasParentObj vad:ptree .
        vad:orderManagement dcterms:description "Основной процесс управления заказами" .
    }
}
```

#### DSL → SPARQL: Создание схемы с индивидами

**DSL:**
```javascript
BPM.schema("orderManagement")
    .label("Схема управления заказами")
    .parent("orderManagement")
    .individual("receiveOrder")
        .executor("salesManager")
        .next("validateOrder")
    .individual("validateOrder")
        .executor("qaSpecialist")
        .next("processPayment")
    .individual("processPayment")
        .executor("accountant")
    .toSPARQL();
```

**SPARQL:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:t_orderManagement {
        vad:t_orderManagement rdf:type vad:VADProcessDia .
        vad:t_orderManagement vad:hasParentObj vad:orderManagement .
        vad:t_orderManagement rdfs:label "Схема управления заказами" .

        vad:receiveOrder vad:isSubprocessTrig vad:t_orderManagement .
        vad:receiveOrder vad:hasExecutor vad:ExecutorGroup_receiveOrder .
        vad:receiveOrder vad:hasNext vad:validateOrder .
        vad:ExecutorGroup_receiveOrder rdf:type vad:ExecutorGroup .
        vad:ExecutorGroup_receiveOrder vad:includes vad:salesManager .

        vad:validateOrder vad:isSubprocessTrig vad:t_orderManagement .
        vad:validateOrder vad:hasExecutor vad:ExecutorGroup_validateOrder .
        vad:validateOrder vad:hasNext vad:processPayment .
        vad:ExecutorGroup_validateOrder rdf:type vad:ExecutorGroup .
        vad:ExecutorGroup_validateOrder vad:includes vad:qaSpecialist .

        vad:processPayment vad:isSubprocessTrig vad:t_orderManagement .
        vad:processPayment vad:hasExecutor vad:ExecutorGroup_processPayment .
        vad:ExecutorGroup_processPayment rdf:type vad:ExecutorGroup .
        vad:ExecutorGroup_processPayment vad:includes vad:accountant .
    }
}
```

---

## 7. Интеграция с текущим проектом

### 7.1 Файловая структура

```
ver9d/
├── 3_sd/
│   ├── dsl/
│   │   ├── dsl_core.js              # Основные классы DSL
│   │   ├── dsl_process_builder.js   # ProcessConceptBuilder
│   │   ├── dsl_schema_builder.js    # SchemaBuilder
│   │   ├── dsl_executor_builder.js  # ExecutorBuilder
│   │   ├── dsl_queries.js           # Готовые запросы
│   │   └── dsl_api.js               # Главный API (BPM объект)
│   └── ...
├── analysis/
│   └── dsl/
│       └── dsl_v1.md                # Этот документ
└── ...
```

### 7.2 Интеграция с существующими функциями

```javascript
// Файл: dsl_api.js

// Импорт существующих функций
// (в реальном коде через глобальные функции или модули)

/**
 * DSL использует существующую инфраструктуру SPARQL
 */
const DSL_EXECUTOR = {
    /**
     * Выполняет INSERT/DELETE через существующую функцию
     */
    async executeUpdate(sparql) {
        return await funSPARQLvaluesComunicaUpdate(sparql);
    },

    /**
     * Выполняет SELECT через существующую функцию
     */
    async executeQuery(sparql, variable) {
        return await funSPARQLvaluesComunica(sparql, variable);
    },

    /**
     * Выполняет простой SELECT (синхронно)
     */
    executeSimpleQuery(sparql, variable) {
        return funSPARQLvalues(sparql, variable);
    }
};
```

### 7.3 Пример использования в UI

```javascript
// Использование DSL в обработчике кнопки "Create Process"
async function handleCreateProcess(formData) {
    // Создание концепта через DSL
    const concept = BPM.concept(formData.id)
        .label(formData.label)
        .parent(formData.parent)
        .description(formData.description);

    // Показать пользователю сгенерированный SPARQL (для контроля)
    document.getElementById('sparqlPreview').textContent = concept.toSPARQL();

    // Выполнить
    const success = await concept.execute();

    if (success) {
        showMessage('Концепт процесса создан');
        refreshUI();
    }
}
```

---

## 8. Примеры использования

### 8.1 Сценарий: Создание полной структуры процесса

```javascript
// 1. Создаём исполнителей
await BPM.executor("salesDept")
    .label("Отдел продаж")
    .parent("rtree")
    .execute();

await BPM.executor("salesManager")
    .label("Менеджер по продажам")
    .parent("salesDept")
    .execute();

// 2. Создаём концепты процессов
await BPM.concept("orderProcess")
    .label("Обработка заказа")
    .parent("ptree")
    .execute();

await BPM.concept("receiveOrder")
    .label("Приём заказа")
    .parent("orderProcess")
    .execute();

await BPM.concept("validateOrder")
    .label("Проверка заказа")
    .parent("orderProcess")
    .execute();

// 3. Создаём схему со связями
await BPM.schema("orderProcess")
    .label("Схема обработки заказа")
    .parent("orderProcess")
    .individual("receiveOrder")
        .executor("salesManager")
        .next("validateOrder")
    .individual("validateOrder")
        .executor("salesManager")
    .execute();
```

### 8.2 Сценарий: Batch-создание

```javascript
const batch = BPM.batch([
    BPM.executor("dept1").label("Подразделение 1"),
    BPM.executor("dept2").label("Подразделение 2"),
    BPM.concept("process1").label("Процесс 1"),
    BPM.concept("process2").label("Процесс 2")
]);

// Просмотр всего SPARQL перед выполнением
console.log(batch.toSPARQL());

// Выполнение всех операций
await batch.execute();
```

### 8.3 Сценарий: Запросы к данным

```javascript
// Получить все концепты процессов
const processes = BPM.query.allProcessConcepts();
console.log(processes);
// [{uri: 'http://example.org/vad#orderProcess', label: 'Обработка заказа'}, ...]

// Получить индивидов в схеме
const individuals = BPM.query.processIndividualsIn('t_orderProcess');
console.log(individuals);
// [{uri: 'http://example.org/vad#receiveOrder', label: 'Приём заказа'}, ...]

// Проверить существование
const exists = await BPM.query.conceptExists('orderProcess');
console.log(exists); // true
```

---

## 9. Сравнение подходов

### 9.1 Сложность реализации

| Подход | Сложность | Время реализации |
|--------|-----------|------------------|
| Чистый SPARQL | Низкая (уже есть) | - |
| Вариант A (JSON) | Средняя | 1-2 дня |
| Вариант B (Текстовый) | Высокая (парсер) | 3-5 дней |
| Вариант C (Fluent) | Средняя | 2-3 дня |
| **Вариант D (Гибрид)** | Средняя | 2-3 дня |

### 9.2 Соответствие требованиям

| Требование | Чистый SPARQL | DSL |
|------------|---------------|-----|
| Терминология BPM/EA | ❌ | ✅ |
| Прозрачность трансляции | ✅ (нативно) | ✅ (toSPARQL) |
| Контроль над кодом | ✅ | ✅ |
| Читаемость | ❌ | ✅ |
| Уровень агрегации | Низкий | Высокий |
| Работа с онтологией | Ручная | Автоматическая |

### 9.3 Производительность

DSL не добавляет overhead при выполнении — трансляция происходит на этапе компиляции в SPARQL, а выполнение идёт через те же `funSPARQLvaluesComunica*` функции.

---

## 10. Рекомендации

### 10.1 Рекомендуемый план внедрения

| Этап | Описание | Приоритет |
|------|----------|-----------|
| 1 | Реализация ProcessConceptBuilder | Высокий |
| 2 | Реализация SchemaBuilder с IndividualBuilder | Высокий |
| 3 | Реализация ExecutorBuilder | Средний |
| 4 | Реализация BPM.query API | Средний |
| 5 | Интеграция с UI (показ SPARQL) | Средний |
| 6 | Batch-операции | Низкий |
| 7 | Валидация | Низкий |

### 10.2 Дальнейшее развитие

1. **Расширение DSL:**
   - Поддержка условий (IF/ELSE в схемах)
   - Параллельные потоки (PARALLEL)
   - Подсхемы

2. **Инструментарий:**
   - VS Code расширение с подсветкой синтаксиса
   - Визуальный редактор схем с генерацией DSL

3. **Валидация:**
   - Проверка ссылочной целостности
   - Проверка на соответствие онтологии

### 10.3 Заключение

Предлагаемый **гибридный DSL** (Macro Functions + Fluent API) обеспечивает:

1. **Абсолютный контроль** — каждая операция транслируется в видимый SPARQL
2. **Терминологию BPM/EA** — работа в терминах концепт/индивид/схема процесса
3. **Агрегированные операции** — одна команда DSL может генерировать множество триплетов
4. **Интеграцию с существующим кодом** — использует `funSPARQLvalues*` функции
5. **Расширяемость** — легко добавлять новые Builder-классы

DSL является "прозрачной надстройкой" над SPARQL — пользователь всегда может увидеть результирующие запросы через метод `.toSPARQL()`, что обеспечивает требуемый уровень контроля.

---

## Ссылки

- [Issue #415 - ver9d_10dsl](https://github.com/bpmbpm/rdf-grapher/issues/415)
- [term.md - Терминологический словарь](../../../ontology/term.md)
- [VAD Ontology](../../../ontology/vad-basic-ontology.trig)
- [SPARQL-driven Programming Guide](../../requirements/sparql-driven-programming_min1.md)
- [DSL Concepts (ver8tree)](../../../ver8tree/requirements/dsl-concepts.md)
- [N3.js Documentation](https://github.com/rdfjs/N3.js)
- [Comunica Documentation](https://comunica.dev/)

---

*Документ создан: 2026-02-17*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.0*
