# SPARQL-driven Programming Guide

## Руководство по SPARQL-ориентированному программированию в RDF Grapher

Данное руководство описывает подход к программированию, используемый в проекте RDF Grapher, где логика приложения максимально реализуется через SPARQL-запросы, а не через традиционное кодирование на JavaScript.

---

## 1. Введение

### 1.1 Концепция

**SPARQL-ориентированное программирование** (SPARQL-driven programming) — это подход к разработке приложений, работающих с RDF данными, при котором:

- Бизнес-логика описывается декларативно через SPARQL-запросы
- JavaScript используется минимально — только для UI и координации
- Данные и их структура определяются онтологией
- Справочники и формы генерируются динамически на основе метаданных

### 1.2 Преимущества подхода

| Аспект | Традиционный подход | SPARQL-driven подход |
|--------|---------------------|---------------------|
| Логика | Захардкожена в JS | Описана в SPARQL/онтологии |
| Изменения | Требуют правки кода | Достаточно изменить запрос |
| Тестирование | Unit-тесты для кода | Проверка запросов в SPARQL endpoint |
| Документация | Комментарии в коде | Самодокументируемые запросы |
| Расширяемость | Добавление JS-кода | Добавление данных в онтологию |

---

## 2. Архитектура модуля create_new_concept.js

### 2.1 Общая структура

```
create_new_concept.js
├── Константы и конфигурация (NEW_CONCEPT_CONFIG)
├── SPARQL-запросы (NEW_CONCEPT_SPARQL)
├── Функции работы с SPARQL
├── Функции генерации ID
├── Функции UI (модальные окна)
└── Функции генерации итогового SPARQL
```

### 2.2 Конфигурация типов концептов

Вместо хардкода логики для каждого типа, используется конфигурационный объект:

```javascript
const NEW_CONCEPT_CONFIG = {
    'vad:TypeProcess': {
        techObject: 'http://example.org/vad#ConceptProcessPredicate',
        targetGraph: 'vad:ptree',
        displayName: 'Концепт процесса (vad:TypeProcess)',
        autoPredicates: ['rdf:type'],
        readOnlyPredicates: ['vad:hasTrig'],
        parentSelectorType: 'vad:TypeProcess',
        parentRootOptions: ['vad:ptree']
    },
    'vad:TypeExecutor': {
        // аналогичная структура
    }
};
```

### 2.3 Алгоритм работы модуля

```
1. Пользователь нажимает "New Concept"
         ↓
2. Выбирает тип концепта из dropdown
         ↓
3. Система формирует SPARQL к vad:techtree
   GET_PREDICATES_FROM_TECH_OBJECT(techObjectUri)
         ↓
4. Получает список предикатов для формы
   [rdf:type, rdfs:label, dcterms:description, vad:hasParentObj, vad:hasTrig]
         ↓
5. Строит форму, помечая auto/readonly поля
         ↓
6. Пользователь заполняет форму
         ↓
7. Система генерирует SPARQL INSERT DATA
         ↓
8. Запрос выводится в "Result in SPARQL"
```

---

## 3. Функция funSPARQLvalues

### 3.1 Описание

Ключевая функция для SPARQL-ориентированного подхода. Выполняет SPARQL SELECT запрос и возвращает массив значений.

### 3.2 Сигнатура

```javascript
/**
 * @param {string} sparqlQuery - SPARQL SELECT запрос
 * @param {string} variableName - Имя переменной для извлечения (без '?')
 * @returns {Array<{uri: string, label: string}>} Массив результатов
 */
function funSPARQLvalues(sparqlQuery, variableName = 'value')
```

### 3.3 Примеры использования

**Пример 1: Получение всех процессов**

```javascript
const processes = funSPARQLvalues(`
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
        }
    }
`, 'process');

// Результат: [{uri: 'http://example.org/vad#p1', label: 'Процесс 1'}, ...]
```

**Пример 2: Получение предикатов из технологического объекта**

```javascript
const predicates = funSPARQLvalues(`
    SELECT ?predicate WHERE {
        vad:ConceptProcessPredicate vad:includePredicate ?predicate .
    }
`, 'predicate');

// Результат: [{uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', label: 'rdf:type'}, ...]
```

**Пример 3: Получение исполнителей для справочника**

```javascript
const executors = funSPARQLvalues(
    SPARQL_QUERIES.EXECUTORS_IN_RTREE,
    'executor'
);
```

### 3.4 Ограничения

- Поддерживает только простые SELECT запросы
- Для сложных запросов (UNION, OPTIONAL, FILTER) используйте Comunica
- Работает с текущими данными в `currentQuads`

---

## 4. Технологические объекты в vad:techtree

### 4.1 Структура vad:techtree

```
vad:techtree (TechTree)
├── vad:ConceptProcessPredicate      # Предикаты для концептов процессов
├── vad:IndividProcessPredicate      # Предикаты для индивидов процессов
├── vad:ConceptExecutorPredicate     # Предикаты для концептов исполнителей
├── vad:ConceptExecutorGroupPredicate # Предикаты для групп исполнителей
├── vad:ConceptTriGPredicate         # Предикаты для TriG контейнеров
├── vad:ConceptProcessTreePredicate  # Предикаты для ptree
└── vad:ConceptExecutorTreePredicate # Предикаты для rtree
```

### 4.2 Структура технологического объекта

```turtle
vad:ConceptProcessPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptProcessPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasParentObj, vad:hasTrig ;
    vad:contextTriGType vad:ProcessTree ;
    rdfs:comment "Группа предикатов для концептов процессов в ptree" .
```

### 4.3 Использование в коде

```javascript
// Получение предикатов для типа концепта
const QUERY = `
    SELECT ?predicate WHERE {
        <${techObjectUri}> vad:includePredicate ?predicate .
    }
`;
const predicates = funSPARQLvalues(QUERY, 'predicate');

// Получение автогенерируемых предикатов
const AUTO_QUERY = `
    SELECT ?predicate WHERE {
        <${techObjectUri}> vad:autoGeneratedPredicate ?predicate .
    }
`;
const autoPredicates = funSPARQLvalues(AUTO_QUERY, 'predicate');
```

---

## 5. Генерация форм на основе метаданных

### 5.1 Алгоритм генерации формы

```javascript
function buildNewConceptForm(config, predicates, autoPredicates) {
    predicates.forEach(predicate => {
        const isAuto = config.autoPredicates.includes(predicate.prefixed);
        const isReadOnly = config.readOnlyPredicates.includes(predicate.prefixed);

        // Генерируем поле в зависимости от типа предиката
        switch (predicate.prefixed) {
            case 'rdf:type':
                // Автоматически заполненное поле
                buildAutoField(predicate, config.typeValue);
                break;
            case 'rdfs:label':
                // Текстовое поле с автогенерацией ID
                buildLabelField(predicate);
                break;
            case 'vad:hasParentObj':
                // Выпадающий список родительских объектов
                buildParentSelector(predicate, config);
                break;
            // ... другие типы полей
        }
    });
}
```

### 5.2 Динамическое заполнение справочников

```javascript
function initializeParentSelector(config) {
    // SPARQL запрос для получения объектов
    const objects = getObjectsForParentSelector(
        config.typeValueUri,
        config.targetGraphUri
    );

    // Заполнение dropdown
    const select = document.getElementById('parent-select');
    objects.forEach(obj => {
        const option = document.createElement('option');
        option.value = obj.uri;
        option.textContent = obj.label;
        select.appendChild(option);
    });
}
```

---

## 6. Генерация SPARQL INSERT запросов

### 6.1 Шаблон генерации

```javascript
GENERATE_INSERT_QUERY: (graphUri, triples, subjectUri, prefixes) => {
    const prefixDeclarations = Object.entries(prefixes)
        .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
        .join('\n');

    const triplesStr = triples
        .map(t => {
            const obj = t.isLiteral ? `"${t.object}"` : t.object;
            return `    ${subjectUri} ${t.predicate} ${obj} .`;
        })
        .join('\n');

    return `${prefixDeclarations}

INSERT DATA {
    GRAPH ${graphUri} {
${triplesStr}
    }
}`;
}
```

### 6.2 Пример сгенерированного запроса

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:ptree {
        vad:NewProcess rdf:type vad:TypeProcess .
        vad:NewProcess rdfs:label "Новый процесс" .
        vad:NewProcess dcterms:description "Описание нового процесса" .
        vad:NewProcess vad:hasParentObj vad:ptree .
    }
}
```

---

## 7. Сравнение с другими подходами

### 7.1 Схожие техники программирования

| Подход | Описание | Сходство с SPARQL-driven |
|--------|----------|--------------------------|
| **Model-Driven Development (MDD)** | Генерация кода из UML-моделей | Генерация UI из онтологии |
| **Domain-Specific Languages (DSL)** | Специализированные языки для предметной области | SPARQL как DSL для RDF |
| **Declarative Programming** | Описание "что", а не "как" | SPARQL запросы декларативны |
| **Data-Driven UI** | UI генерируется из данных | Формы из метаданных онтологии |
| **Schema-First API Design** | API из схемы данных | UI из RDF Schema/OWL |

### 7.2 Связанные технологии и фреймворки

1. **Linked Data Platform (LDP)** — стандарт W3C для RESTful операций с RDF
2. **SHACL** — язык ограничений для валидации RDF данных
3. **R2RML** — отображение реляционных данных в RDF
4. **GraphQL** — аналогичный декларативный подход для не-RDF данных
5. **ORM (Object-Relational Mapping)** — концептуально схоже, но для SQL

### 7.3 Преимущества перед традиционным подходом

```javascript
// Традиционный подход (НЕ рекомендуется)
function getProcessPredicates() {
    return ['rdf:type', 'rdfs:label', 'dcterms:description',
            'vad:hasParentObj', 'vad:hasTrig'];
}

// SPARQL-driven подход (рекомендуется)
function getProcessPredicates() {
    return funSPARQLvalues(`
        SELECT ?predicate WHERE {
            vad:ConceptProcessPredicate vad:includePredicate ?predicate .
        }
    `, 'predicate');
}
```

---

## 8. Рекомендации по применению

### 8.1 Когда использовать SPARQL-driven подход

✅ **Используйте**, когда:
- Данные описаны в онтологии
- Логика зависит от структуры данных
- Нужна расширяемость без изменения кода
- Есть сложные связи между сущностями

❌ **Не используйте**, когда:
- Производительность критична (прямой JS быстрее)
- Логика не зависит от данных
- Нужны сложные вычисления

### 8.2 Паттерны использования

**Паттерн 1: Конфигурация из онтологии**
```javascript
// Плохо
const CONFIG = { processType: 'vad:TypeProcess', ... };

// Хорошо
const CONFIG = funSPARQLvalues('SELECT ?type WHERE { ?type rdf:type vad:ConceptType }', 'type');
```

**Паттерн 2: Динамические справочники**
```javascript
// Плохо
const PARENT_OPTIONS = ['ptree', 'p1', 'p2'];

// Хорошо
const PARENT_OPTIONS = funSPARQLvalues(
    'SELECT ?parent WHERE { ?parent rdf:type vad:TypeProcess }',
    'parent'
);
```

**Паттерн 3: Валидация через запросы**
```javascript
// Проверка существования ID
const exists = funSPARQLvalues(
    `ASK WHERE { <${newUri}> ?p ?o }`,
    'exists'
).length > 0;
```

---

## 9. Заключение

SPARQL-ориентированное программирование позволяет создавать гибкие, расширяемые приложения для работы с RDF данными. Ключевые принципы:

1. **Декларативность** — описывайте "что", а не "как"
2. **Метаданные** — используйте онтологию для конфигурации
3. **Динамичность** — генерируйте UI из данных
4. **Расширяемость** — добавляйте функционал через данные, не код

---

## Ссылки

- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [RDF 1.1 Concepts](https://www.w3.org/TR/rdf11-concepts/)
- [OWL 2 Web Ontology Language](https://www.w3.org/TR/owl2-overview/)
- [RDF Grapher Documentation](ui-documentation.md)
- [VAD Ontology](../vad-basic-ontology.ttl)
- [Tech Appendix](../vad-basic-ontology_tech_Appendix.ttl)
