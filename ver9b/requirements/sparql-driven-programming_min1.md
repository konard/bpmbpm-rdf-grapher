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


---

## 2. Функция funSPARQLvalues

### 2.1 Описание

Ключевая функция для SPARQL-ориентированного подхода. Выполняет SPARQL SELECT запрос и возвращает массив значений.

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
- Для сложных запросов (UNION, OPTIONAL, FILTER) используйте Comunica
- Работает с текущими данными в `currentQuads`

---

