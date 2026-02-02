# N3.js — функции, используемые в проекте RDF Grapher ver9b
https://github.com/bpmbpm/rdf-grapher/pull/246  
Quadstore организован на базе библиотеки **N3.js v1.17.2** (`N3.Store`, `N3.Parser`). Данные окна «RDF-данные» хранятся в `currentStore` (N3.Store) и `currentQuads` (массив квадов). Чтение и запись осуществляются через SPARQL-запросы (`funSPARQLvalues` для SELECT, `applyTripleToRdfInput` для INSERT/DELETE).

Библиотека: **N3.js v1.17.2**
CDN: `https://unpkg.com/n3@1.17.2/browser/n3.min.js`
Документация: https://github.com/rdfjs/N3.js

---

## 1. N3.Parser

Парсинг RDF-данных из текстовых форматов (TriG, Turtle, N-Triples, N-Quads) в массив квадов (RDF.js Quad objects).

### Конструктор

```js
new N3.Parser({ format: 'trig' })
new N3.Parser({ format: 'text/turtle' })
new N3.Parser({ format: inputFormat })  // inputFormat = 'turtle' | 'trig' | 'n-triples' | 'n-quads'
```

### Метод `parse(input, callback)`

Парсит строку с RDF-данными. Вызывает callback для каждого квада, а при завершении — с `quad = null` и объектом `prefixes`.

```js
parser.parse(rdfData, (error, quad, parsedPrefixes) => {
    if (error) { /* обработка ошибки */ }
    if (quad) { quads.push(quad); }
    else {
        // Парсинг завершён
        // parsedPrefixes = { rdf: 'http://...', vad: 'http://...' }
    }
});
```

### Модули, использующие N3.Parser

| Модуль | Файл | Назначение |
|--------|------|-----------|
| 5_publisher | `5_publisher/5_publisher_logic.js` (строка 48) | Парсинг RDF-данных пользователя для визуализации |
| 9_vadlib | `9_vadlib/vadlib.js` (строка 437) | Парсинг `vad-basic-ontology_tech_Appendix.ttl` при загрузке приложения |
| 2_triplestore_test | `2_triplestore/2_triplestore_test/2_triplestore_test_logic.js` (строка 35) | Парсинг RDF-данных при ручном тестировании (кнопка «Тест») |
| test | `test/test_auto.html` (строка 95) | Парсинг файла `Trig_VADv5.ttl` для автоматизированных тестов |

---

## 2. N3.Store

In-memory quadstore для хранения и запросов по RDF-квадам. Используется как хранилище данных окна «RDF-данные».

### Конструктор

```js
new N3.Store()
```

### Метод `addQuad(quad)`

Добавляет квад (RDF.js Quad object) в хранилище.

```js
currentStore = new N3.Store();
quads.forEach(q => currentStore.addQuad(q));
```

### Модули, использующие N3.Store

| Модуль | Файл | Назначение |
|--------|------|-----------|
| 8_infoSPARQL | `8_infoSPARQL/8_infoSPARQL_ui.js` (строка 6) | Инициализация store для SPARQL-движка Comunica |
| test | `test/test_auto.html` (строка 122) | Создание store для автоматизированных тестов |

---

## 3. Глобальные переменные, связанные с N3.js

Определены в `9_vadlib/vadlib.js`:

| Переменная | Тип | Описание |
|-----------|-----|----------|
| `currentQuads` | `Array<Quad>` | Массив N3.js quad objects — текущие RDF-данные |
| `currentStore` | `N3.Store \| null` | Экземпляр N3.Store — quadstore для SPARQL-запросов |
| `currentPrefixes` | `Object` | Объект префиксов `{ prefix: namespace }`, полученный из N3.Parser |

---

## 4. Структура N3.js Quad object

Каждый квад, возвращаемый `N3.Parser`, имеет структуру (RDF.js Quad interface):

```js
quad.subject.value    // URI субъекта (string)
quad.subject.termType // 'NamedNode' | 'BlankNode'

quad.predicate.value    // URI предиката (string)
quad.predicate.termType // 'NamedNode'

quad.object.value    // URI или литерал (string)
quad.object.termType // 'NamedNode' | 'Literal' | 'BlankNode'

quad.graph.value     // URI именованного графа (string, '' для дефолтного графа)
quad.graph.termType  // 'NamedNode' | 'DefaultGraph'
```

### Модули, обращающиеся к свойствам квадов

| Модуль | Файл | Используемые свойства |
|--------|------|----------------------|
| 5_publisher | `5_publisher_logic.js` | `quad.subject.value`, `quad.predicate.value`, `quad.object.value`, `quad.object.termType`, `quad.graph.value` |
| 2_triplestore | `2_triplestore_logic.js` | `quad.subject.value`, `quad.predicate.value`, `quad.object.value`, `quad.graph.value` |
| 9_vadlib | `vadlib.js` | `quad.subject.value`, `quad.predicate.value`, `quad.object.value` |
| 9_vadlib | `vadlib_sparql.js` | `quad.subject.value`, `quad.predicate.value`, `quad.object.value`, `quad.graph.value` |

---

## 5. Функции проекта, работающие с N3.js данными

Эти функции не являются частью N3.js, но реализованы в проекте для работы с N3.js quad objects:

| Функция | Файл | Описание |
|---------|------|----------|
| `funSPARQLvalues(sparqlQuery, variableName)` | `vadlib_sparql.js` | Выполняет SPARQL SELECT по `currentQuads` через pattern matching |
| `splitSparqlStatements(content)` | `vadlib_sparql.js` | Разбивает SPARQL triple patterns по `.`, игнорируя точки внутри `<URI>` |
| `parseTriplePatterns(whereClause)` | `vadlib_sparql.js` | Парсит triple patterns из WHERE клаузы SPARQL |
| `executeSimpleSelect(patterns, variables)` | `vadlib_sparql.js` | Выполняет SELECT через сопоставление паттернов с квадами |
| `matchQuadToPattern(quad, pattern, binding)` | `vadlib_sparql.js` | Сопоставляет один квад с паттерном запроса |
| `resolveValue(value)` | `vadlib_sparql.js` | Разрешает prefix:local → полный URI используя `currentPrefixes` |
| `validateVAD(quads, prefixes)` | `2_triplestore_logic.js` | Валидация квадов по правилам VAD онтологии |
| `parseTriGHierarchy(quads, prefixes)` | `2_triplestore_logic.js` | Парсинг иерархии TriG графов из квадов |
| `calculateProcessSubtypes(hierarchy, prefixes)` | `2_triplestore_logic.js` | Вычисление виртуальных подтипов процессов |
| `applyTripleToRdfInput(sparqlQuery, mode)` | `3_sd_logic.js` | Применяет INSERT/DELETE SPARQL к текстовому полю RDF |
| `getPrefixedName(uri, prefixes)` | `vadlib.js` | Преобразует полный URI в prefix:local |
| `getLocalName(uri)` | `vadlib.js` | Извлекает локальное имя из URI |

---

## 6. Не используемые функции N3.js

Следующие возможности N3.js **не используются** в текущей версии проекта:

- `N3.Writer` — сериализация квадов обратно в текстовый формат (TriG/Turtle)
- `N3.StreamParser`, `N3.StreamWriter` — потоковый парсинг/запись
- `N3.DataFactory` — создание квадов программно (`quad()`, `namedNode()`, `literal()`, `blankNode()`)
- `N3.Store.getQuads()`, `N3.Store.removeQuad()`, `N3.Store.match()` — запросы и удаление из store
- `N3.Store.size`, `N3.Store.countQuads()` — подсчёт квадов в store

Вместо `N3.Store.getQuads()` проект использует собственный SPARQL-движок (`funSPARQLvalues`) через перебор массива `currentQuads`.
