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

## 2. Функция funSPARQLvalues

### 2.1 Описание

Ключевая функция для SPARQL-ориентированного подхода. Выполняет SPARQL SELECT запрос и возвращает массив значений. Использует упрощённый внутренний парсер для базовых запросов.

### 2.2 Сигнатура

```javascript
/**
 * @param {string} sparqlQuery - SPARQL SELECT запрос
 * @param {string} variableName - Имя переменной для извлечения (без '?')
 * @returns {Array<{uri: string, label: string}>} Массив результатов
 */
function funSPARQLvalues(sparqlQuery, variableName = 'value')
```

### 2.3 Примеры использования

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

### 2.4 Ограничения

- Поддерживает только простые SELECT запросы
- Для сложных запросов (UNION, OPTIONAL, FILTER) используйте `funSPARQLvaluesComunica`
- Работает с текущими данными в `currentQuads`

---

## 3. Функция funSPARQLvaluesComunica

### 3.1 Описание

Расширенная функция для выполнения SPARQL запросов с полной поддержкой SPARQL через библиотеку Comunica. Поддерживает UNION, OPTIONAL, FILTER, BIND и другие конструкции SPARQL, которые не поддерживаются в `funSPARQLvalues`.

### 3.2 Сигнатура

```javascript
/**
 * Выполняет SPARQL SELECT запрос с полной поддержкой SPARQL через Comunica.
 * @param {string} sparqlQuery - SPARQL SELECT запрос
 * @param {string} variableName - Имя переменной для извлечения (без '?')
 * @returns {Promise<Array<{uri: string, label: string}>>} Массив результатов
 */
async function funSPARQLvaluesComunica(sparqlQuery, variableName = 'value')
```

### 3.3 Примеры использования

**Пример 1: Запрос с OPTIONAL**

```javascript
const processes = await funSPARQLvaluesComunica(`
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            OPTIONAL { ?process rdfs:label ?label }
        }
    }
`, 'process');
```

**Пример 2: Запрос с UNION**

```javascript
const items = await funSPARQLvaluesComunica(`
    SELECT ?item WHERE {
        {
            GRAPH vad:ptree { ?item rdf:type vad:TypeProcess }
        }
        UNION
        {
            GRAPH vad:rtree { ?item rdf:type vad:TypeExecutor }
        }
    }
`, 'item');
```

**Пример 3: Запрос с FILTER**

```javascript
const processes = await funSPARQLvaluesComunica(`
    SELECT ?process WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
            FILTER(CONTAINS(?label, "Процесс"))
        }
    }
`, 'process');
```

### 3.4 Преимущества

- Полная поддержка SPARQL 1.1
- Поддержка UNION, OPTIONAL, FILTER, BIND, GROUP BY и других конструкций
- Автоматический fallback на `funSPARQLvalues` при ошибке Comunica
- Работает с N3.Store напрямую

---

## 4. Функция funSPARQLvaluesComunicaUpdate

### 4.1 Описание

Функция для выполнения SPARQL UPDATE запросов (INSERT/DELETE) через Comunica.

### 4.2 Сигнатура

```javascript
/**
 * Выполняет SPARQL UPDATE запрос (INSERT/DELETE) через Comunica.
 * @param {string} sparqlUpdateQuery - SPARQL UPDATE запрос
 * @returns {Promise<boolean>} true если запрос выполнен успешно
 */
async function funSPARQLvaluesComunicaUpdate(sparqlUpdateQuery)
```

### 4.3 Примеры использования

**Пример 1: INSERT DATA**

```javascript
const success = await funSPARQLvaluesComunicaUpdate(`
    PREFIX vad: <http://example.org/vad#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    INSERT DATA {
        GRAPH vad:ptree {
            vad:newProcess rdf:type vad:TypeProcess .
            vad:newProcess rdfs:label "Новый процесс" .
        }
    }
`);

if (success) {
    console.log('Процесс добавлен');
}
```

**Пример 2: DELETE WHERE**

```javascript
const success = await funSPARQLvaluesComunicaUpdate(`
    PREFIX vad: <http://example.org/vad#>

    DELETE WHERE {
        GRAPH vad:ptree {
            vad:oldProcess ?p ?o .
        }
    }
`);
```

---

## 5. Использование библиотек Comunica и N3.js

### 5.1 Приоритет внешних библиотек

Согласно [PR #255](https://github.com/bpmbpm/rdf-grapher/pull/255), приоритет отдаётся использованию внешних библиотек (Comunica, N3.js) для выполнения SPARQL запросов вместо написания собственного regex-парсера.

### 5.2 Архитектура выполнения SPARQL

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SPARQL Query                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Comunica QueryEngine                             │
│  - queryBindings() для SELECT запросов                              │
│  - queryVoid() для UPDATE запросов (INSERT/DELETE)                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         N3.Store                                     │
│  - In-memory quadstore                                              │
│  - Поддержка именованных графов (GRAPH)                             │
│  - Методы: addQuad(), removeQuad(), getQuads()                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       currentQuads[]                                 │
│  - Глобальный массив всех квадов                                    │
│  - Синхронизируется с N3.Store после UPDATE                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Сравнение подходов

| Аспект | Было (regex) | Стало (Comunica + N3.js) |
|--------|--------------|--------------------------|
| Парсинг SPARQL | Regex извлечение | `comunicaEngine.queryVoid()` |
| Обработка shorthand `;` | Построчный парсер | Автоматически через N3.js |
| Сериализация | Вставка текста в textarea | `N3.Writer` с format 'application/trig' |
| Поддержка SPARQL | Частичная | Полная (SPARQL 1.1) |

---

## 6. Выбор функции для запроса

| Тип запроса | Функция | Примечание |
|-------------|---------|------------|
| Простой SELECT | `funSPARQLvalues()` | Быстрее, синхронная |
| SELECT с OPTIONAL/UNION/FILTER | `funSPARQLvaluesComunica()` | Полная поддержка SPARQL |
| INSERT DATA | `funSPARQLvaluesComunicaUpdate()` | Через Comunica |
| DELETE WHERE | `funSPARQLvaluesComunicaUpdate()` | Через Comunica |
| DROP GRAPH | `funSPARQLvaluesComunicaUpdate()` | Через Comunica |

---

## 7. Ссылки

- [Comunica Documentation](https://comunica.dev/)
- [N3.js GitHub](https://github.com/rdfjs/N3.js)
- [PR #255 - refactor: use Comunica for SPARQL UPDATE](https://github.com/bpmbpm/rdf-grapher/pull/255)
- [Issue #256 - ver9b_1alg4test](https://github.com/bpmbpm/rdf-grapher/issues/256)
