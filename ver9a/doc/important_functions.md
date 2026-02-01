<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->

# Наиболее важные функции RDF Grapher ver9a

В данном документе описаны 5 наиболее важных функций проекта, которые составляют ядро системы обработки и визуализации RDF данных.

---

## 1. funSPARQLvalues

**Модуль:** `9_vadlib/vadlib_sparql.js`

### Сигнатура

```javascript
function funSPARQLvalues(sparqlQuery, variableName = 'value')
```

### Описание

Ключевая функция SPARQL-ориентированного программирования (SPARQL-driven Programming). Выполняет SPARQL SELECT запросы над текущим набором RDF квадов (`currentQuads`) без использования внешнего SPARQL-движка. Реализует собственный парсер SPARQL запросов с поддержкой переменных, GRAPH блоков, PREFIX-нотации и сопоставления паттернов.

Функция является центральным элементом архитектуры проекта: все модули (Smart Design, Publisher, тестирование) используют её для получения данных из RDF хранилища через SPARQL запросы.

### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `sparqlQuery` | `string` | -- | SPARQL SELECT запрос |
| `variableName` | `string` | `'value'` | Имя переменной для извлечения значений из результатов |

### Возвращаемое значение

`Array<{uri: string, label: string}>` -- массив объектов с URI и меткой каждого результата. При отсутствии данных или ошибке возвращает пустой массив.

### Пример использования

```javascript
// Получить все концепты процессов из дерева процессов
const processes = funSPARQLvalues(`
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:Process .
            ?process rdfs:label ?label .
        }
    }
`, 'process');

// Результат: [{uri: "http://example.org/vad#pGA", label: "Процесс ГА"}, ...]
```

### Внутренние вспомогательные функции

- `parseTriplePatterns(whereClause)` -- парсинг triple patterns из WHERE клаузы
- `resolveValue(value)` -- разрешение значений (префиксы, URI, переменные, литералы)
- `executeSimpleSelect(patterns, variables)` -- выполнение SELECT через сопоставление паттернов
- `matchQuadToPattern(quad, pattern, currentBinding)` -- сопоставление квада с паттерном

---

## 2. visualize

**Модуль:** `5_publisher/5_publisher_logic.js` (в текущей реализации -- `index.html`)

### Сигнатура

```javascript
async function visualize()
```

### Описание

Главная функция визуализации RDF данных. Оркестрирует весь процесс от парсинга входных данных до отображения SVG графа. Вызывается при нажатии кнопки "Визуализировать" и при загрузке примеров.

Последовательность действий:
1. Считывает входные данные и параметры (формат, режим визуализации, движок компоновки)
2. Парсит RDF данные через N3.js
3. Извлекает префиксы и строит кэш типов узлов
4. В режиме `vad-trig`: строит иерархию TriG графов, вычисляет подтипы процессов
5. Генерирует DOT-код через `rdfToDotVAD()` или `rdfToDot()`
6. Рендерит SVG через Viz.js
7. Добавляет обработчики кликов на узлы графа

### Параметры

Функция не принимает параметров. Все входные данные считываются из DOM-элементов.

### Возвращаемое значение

`Promise<void>` -- асинхронная функция, не возвращает значение. Результат визуализации отображается в DOM.

### Пример использования

```javascript
// Вызов после загрузки данных в текстовое поле
document.getElementById('rdf-input').value = trigData;
await visualize();
```

---

## 3. rdfToDotVAD

**Модуль:** `5_publisher/5_publisher_logic.js` (в текущей реализации -- `index.html`)

### Сигнатура

```javascript
function rdfToDotVAD(quads, prefixes = {}, trigUri = null)
```

### Описание

Генерирует DOT-код для VAD (Value Added Chain) диаграмм из набора RDF квадов. Учитывает специфику VAD-онтологии: типы процессов, исполнителей, группы, подтипы процессов (Detailed, notDetailed и др.), иерархию TriG графов.

Функция создает:
- Подграфы (subgraph) для группировки процессов по исполнителям
- Узлы с цветовой кодировкой по типам (процесс, исполнитель, группа)
- Ребра со стилями в зависимости от предикатов (hasNext, includes, hasExecutor)
- HTML-метки с переносом строк для длинных названий

### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `quads` | `Array` | -- | Массив RDF квадов (объекты N3.js) |
| `prefixes` | `Object` | `{}` | Словарь префиксов пространств имен |
| `trigUri` | `string\|null` | `null` | URI конкретного TriG графа для визуализации. Если `null`, визуализируются все данные |

### Возвращаемое значение

`string` -- DOT-код, пригодный для рендеринга через Viz.js (Graphviz).

### Пример использования

```javascript
const dotCode = rdfToDotVAD(currentQuads, currentPrefixes, 'http://example.org/vad#t_pGA');
// Результат: "digraph { ... }" -- DOT-код VAD диаграммы
const svgElement = viz.renderSVGElement(dotCode);
```

---

## 4. parseTriGHierarchy

**Модуль:** `2_triplestore/2_triplestore_logic.js` (в текущей реализации -- `index.html`)

### Сигнатура

```javascript
function parseTriGHierarchy(quads, prefixes)
```

### Описание

Парсит иерархию TriG графов из набора RDF квадов. Анализирует связи `vad:hasParentObj` между графами и строит древовидную структуру, начиная от корневого элемента `vad:root`. Определяет типы каждого графа (`TechTree`, `ProcessTree`, `ExecutorTree`, `VADProcessDia`, `ObjectTree`).

Иерархия используется для:
- Отображения дерева TriG в интерфейсе (модуль Publisher)
- Навигации по структуре VAD данных
- Определения контекста при работе Smart Design
- Валидации структуры данных

### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `quads` | `Array` | Массив RDF квадов |
| `prefixes` | `Object` | Словарь префиксов пространств имен |

### Возвращаемое значение

`Object` -- объект иерархии вида:

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
    "http://example.org/vad#ptree": {
        uri: "http://example.org/vad#ptree",
        label: "Дерево Процессов",
        type: "ProcessTree",
        isTrig: true,
        children: ["http://example.org/vad#t_pGA"],
        parent: "http://example.org/vad#root"
    }
    // ...
}
```

### Пример использования

```javascript
const hierarchy = parseTriGHierarchy(currentQuads, currentPrefixes);
// Построение дерева навигации
buildTrigTree(hierarchy);
```

---

## 5. calculateProcessSubtypes

**Модуль:** `2_triplestore/2_triplestore_logic.js` (в текущей реализации -- `index.html`)

### Сигнатура

```javascript
function calculateProcessSubtypes(hierarchy, prefixes)
```

### Описание

Вычисляет подтипы процессов (`vad:processSubtype`) на основе анализа иерархии TriG графов и связей между процессами. Это виртуальные (вычисляемые) данные, которые не хранятся непосредственно в RDF, а рассчитываются алгоритмически.

Подтипы определяются по правилам:
- **Detailed** -- процесс имеет собственный TriG (`vad:hasTrig`) и привязан к текущему TriG
- **DetailedChild** -- процесс является дочерним и имеет собственный TriG
- **DetailedExternal** -- процесс принадлежит другому TriG, но имеет собственный TriG
- **notDetailed** -- процесс не имеет собственного TriG
- **notDetailedChild** -- дочерний процесс без собственного TriG
- **notDetailedExternal** -- процесс из другого TriG без собственного TriG
- **NotDefinedType** -- подтип не определен

Результат сохраняется в глобальную переменную `virtualRDFdata` и используется при визуализации для определения стиля отображения узлов процессов.

### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `hierarchy` | `Object` | Объект иерархии TriG графов (результат `parseTriGHierarchy`) |
| `prefixes` | `Object` | Словарь префиксов пространств имен |

### Возвращаемое значение

`Object` -- объект вида:

```javascript
{
    "http://example.org/vad#t_pGA": {
        "http://example.org/vad#pGA": {
            processSubtype: "Detailed",
            label: "Процесс ГА",
            hasParentObj: "http://example.org/vad#root",
            hasTrig: "http://example.org/vad#t_pGA"
        },
        "http://example.org/vad#p1": {
            processSubtype: "notDetailed",
            label: "Процесс 1",
            hasParentObj: "http://example.org/vad#pGA",
            hasTrig: null
        }
    }
}
```

### Пример использования

```javascript
const hierarchy = parseTriGHierarchy(currentQuads, currentPrefixes);
const subtypes = calculateProcessSubtypes(hierarchy, currentPrefixes);
// subtypes используется для стилизации узлов в rdfToDotVAD
virtualRDFdata = subtypes;
```
