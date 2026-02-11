# Linked Data Libraries Functions Documentation

## Обзор

Данный документ описывает все функции (с указанием модуля), используемые в проекте из Linked Data библиотек, включая N3.js, Comunica, EYE Reasoner и другие.

---

## 1. N3.js Library

### Модуль: `n3`

#### Основные классы и конструкторы

| Функция/Класс | Модуль | Описание | Пример использования |
|--------------|--------|----------|---------------------|
| `N3.Parser()` | `n3` | Создание парсера для RDF форматов (TriG, Turtle, N-Triples и др.) | `const parser = new N3.Parser({ format: 'trig' })` |
| `N3.Store()` | `n3` | Создание in-memory quad store для хранения и запросов к RDF данным | `const store = new N3.Store()` |
| `N3.DataFactory` | `n3` | Фабрика для создания RDF терминов (узлов, литералов, квадов) | `N3.DataFactory.namedNode('http://example.org')` |

#### DataFactory методы

| Функция | Модуль | Описание | Пример использования |
|---------|--------|----------|---------------------|
| `N3.DataFactory.namedNode(uri)` | `n3` | Создает именованный узел (URI) | `N3.DataFactory.namedNode('http://example.org/vad#process1')` |
| `N3.DataFactory.literal(value, languageOrDatatype)` | `n3` | Создает литерал с опциональным языком или datatype | `N3.DataFactory.literal('Process 1', 'en')` |
| `N3.DataFactory.blankNode(id)` | `n3` | Создает пустой узел (blank node) | `N3.DataFactory.blankNode('b1')` |
| `N3.DataFactory.defaultGraph()` | `n3` | Возвращает узел графа по умолчанию | `N3.DataFactory.defaultGraph()` |
| `N3.DataFactory.quad(subject, predicate, object, graph)` | `n3` | Создает quad объект | `N3.DataFactory.quad(subject, predicate, object, graph)` |

#### Store методы

| Функция | Модуль | Описание | Пример использования |
|---------|--------|----------|---------------------|
| `store.addQuad(quad)` | `n3` | Добавляет quad в store | `store.addQuad(quad)` |
| `store.getQuads(subject, predicate, object, graph)` | `n3` | Извлекает квады из store с фильтрацией | `store.getQuads(null, null, null, null)` |
| `store.removeQuad(quad)` | `n3` | Удаляет quad из store | `store.removeQuad(quad)` |
| `store.countQuads(subject, predicate, object, graph)` | `n3` | Считает количество квадов в store | `store.countQuads(null, null, null, null)` |
| `store.addQuads(quads)` | `n3` | Добавляет массив квадов в store | `store.addQuads([quad1, quad2])` |
| `store.removeQuads(quads)` | `n3` | Удаляет массив квадов из store | `store.removeQuads([quad1, quad2])` |

#### Parser методы

| Функция | Модуль | Описание | Пример использования |
|---------|--------|----------|---------------------|
| `parser.parse(rdfData, callback)` | `n3` | Парсит RDF данные и вызывает callback для каждого quad | `parser.parse(trigData, (error, quad, prefixes) => {...})` |

---

## 2. Comunica Library

### Модуль: `@comunica/query-sparql-rdfjs` (основной)
### Модуль: `comunica` (legacy)
### Модуль: `@comunica/engine-query-sparql` (альтернативный)

#### Основные классы и конструкторы

| Функция/Класс | Модуль | Описание | Пример использования |
|--------------|--------|----------|---------------------|
| `QueryEngine` | `@comunica/query-sparql-rdfjs` | Основной класс SPARQL query engine | `const { QueryEngine } = require('@comunica/query-sparql-rdfjs')` |
| `new QueryEngine()` | `@comunica/query-sparql-rdfjs` | Создание экземпляра query engine | `const engine = new QueryEngine()` |

#### QueryEngine методы

| Функция | Модуль | Описание | Пример использования |
|---------|--------|----------|---------------------|
| `engine.queryQuads(sparqlQuery, context)` | `@comunica/query-sparql-rdfjs` | Выполняет SPARQL запрос, возвращая quads | `await engine.queryQuads('SELECT ?s ?p ?o WHERE { ?s ?p ?o }', { sources: [store] })` |
| `engine.queryBindings(sparqlQuery, context)` | `@comunica/query-sparql-rdfjs` | Выполняет SPARQL запрос, возвращая bindings | `await engine.queryBindings('SELECT ?label WHERE { ?s rdfs:label ?label }', { sources: [store] })` |
| `engine.queryBoolean(sparqlQuery, context)` | `@comunica/query-sparql-rdfjs` | Выполняет ASK запросы | `await engine.queryBoolean('ASK { ?s rdf:type vad:Process }', { sources: [store] })` |

#### Legacy методы (comunica package)

| Функция | Модуль | Описание | Пример использования |
|---------|--------|----------|---------------------|
| `Comunica.QueryEngine` | `comunica` | Legacy QueryEngine class | `const QueryEngine = require('comunica').QueryEngine` |

---

## 3. EYE Reasoner

### Модуль: `eyereasoner`

#### Основные функции

| Функция | Модуль | Описание | Пример использования |
|---------|--------|----------|---------------------|
| `n3reasoner` | `eyereasoner` | EYE reasoner для вывода новых знаний из RDF данных | `import { n3reasoner } from 'eyereasoner'` |

---

## 4. quadstore-comunica

### Модуль: `quadstore-comunica`

#### Основные классы

| Функция/Класс | Модуль | Описание | Пример использования |
|--------------|--------|----------|---------------------|
| `Engine` | `quadstore-comunica` | Интеграционный движок для quadstore + Comunica | `import { Engine } from 'quadstore-comunica'` |

---

## 5. Использование в проекте

### 5.1 Паттерны импорта

```javascript
// N3.js
const N3 = require('n3');
const { DataFactory } = require('n3');

// Comunica (новый пакет)
const { QueryEngine } = require('@comunica/query-sparql-rdfjs');

// Comunica (legacy)
const Comunica = require('comunica');

// Comunica (альтернативный)
const Comunica2 = require('@comunica/engine-query-sparql');

// EYE Reasoner
import { n3reasoner } from 'eyereasoner';

// quadstore-comunica
import { Engine } from 'quadstore-comunica';
```

### 5.2 Типичные сценарии использования

#### Парсинг TriG данных

```javascript
const N3 = require('n3');
const parser = new N3.Parser({ format: 'trig' });
const store = new N3.Store();

parser.parse(trigData, (error, quad, prefixes) => {
    if (error) {
        console.error('Parse error:', error);
        return;
    }
    if (quad) {
        store.addQuad(quad);
    } else {
        console.log('Parsing completed');
        console.log('Prefixes:', prefixes);
    }
});
```

#### SPARQL запросы через Comunica

```javascript
const { QueryEngine } = require('@comunica/query-sparql-rdfjs');

async function executeQuery(store, sparqlQuery) {
    const engine = new QueryEngine();
    
    try {
        const result = await engine.queryQuads(sparqlQuery, {
            sources: [store]
        });
        
        const quads = [];
        for await (const quad of result) {
            quads.push(quad);
        }
        
        return quads;
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}
```

#### Создание RDF терминов

```javascript
const { DataFactory } = require('n3');

const subject = DataFactory.namedNode('http://example.org/vad#process1');
const predicate = DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label');
const object = DataFactory.literal('Process 1', 'en');
const graph = DataFactory.namedNode('http://example.org/vad#t_p1');

const quad = DataFactory.quad(subject, predicate, object, graph);
```

---

## 6. Конфигурация и совместимость

### 6.1 Версии библиотек

| Библиотека | Рекомендуемая версия | Совместимость |
|------------|-------------------|---------------|
| n3 | ^1.16.0 | Полная совместимость |
| @comunica/query-sparql-rdfjs | ^2.0.0 | Основной пакет |
| comunica | ^1.0.0 | Legacy поддержка |
| eyereasoner | ^2.0.0 | Для вывода знаний |
| quadstore-comunica | ^1.0.0 | Интеграция |

### 6.2 Порядок инициализации

```javascript
// 1. Инициализация N3
const N3 = require('n3');
const { DataFactory } = N3;

// 2. Создание store
const store = new N3.Store();

// 3. Инициализация Comunica
const { QueryEngine } = require('@comunica/query-sparql-rdfjs');
const engine = new QueryEngine();

// 4. Настройка глобальных переменных (при необходимости)
global.currentStore = store;
global.currentPrefixes = {};
global.Comunica = require('@comunica/query-sparql-rdfjs');
global.comunicaEngine = engine;
```

---

## 7. Проблемы и решения

### 7.1 Общие проблемы импорта

**Проблема**: Различные структуры пакетов Comunica
**Решение**: Использовать fallback механизм

```javascript
let QueryEngine;
try {
    // Try new package structure
    QueryEngine = require('@comunica/query-sparql-rdfjs').QueryEngine;
} catch (error) {
    try {
        // Fallback to legacy package
        QueryEngine = require('comunica').QueryEngine;
    } catch (error2) {
        // Fallback to alternative package
        QueryEngine = require('@comunica/engine-query-sparql').QueryEngine;
    }
}
```

### 7.2 Оптимизация производительности

- Использовать `store.getQuads()` вместо итерации по всем квадам
- Кешировать результаты SPARQL запросов
- Использовать `currentStore` как единый источник данных

---

## 8. Справочные материалы

### 8.1 Документация библиотек

- [N3.js Documentation](https://github.com/rdfjs/N3.js)
- [Comunica Documentation](https://comunica.dev/)
- [EYE Reasoner Documentation](https://eyereasoner.github.io/)
- [RDF.js](https://rdf.js.org/)

### 8.2 Примеры в проекте

- `ver9c/experiments/test_comunica_import.js` - Тестирование импорта Comunica
- `ver9c/9_vadlib/vadlib_sparql.js` - Примеры SPARQL функций
- `ver9c/2_triplestore/2_triplestore_logic.js` - Примеры работы с N3.Store

---

*Документация создана для issue #363: Приведи описание всех функций (с указанием модуля), используемых в проекте, из Linked Data библиотек.*