# Simple Triple vs Shorthand Triple в quadstore (N3.js)
design/store/SimpleVsShorthandTriple.md 04/02/26  
Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/245

## 1. Используемый quadstore

В RDF Grapher ver9b используется библиотека **N3.js** (версия 1.17.2) для хранения и обработки TriG (Turtle with Named Graphs) данных.

- **Парсинг:** `N3.Parser` с параметром `{ format: 'trig' }` — парсит TriG-данные из текстового поля «RDF-данные» в массив квадов (subject, predicate, object, graph).
- **Хранение:** `N3.Store` — in-memory quadstore, хранит все квады с поддержкой именованных графов.
- **Чтение:** через `funSPARQLvalues()` (простые SELECT-запросы) или напрямую через `currentQuads` / `currentStore`.
- **Запись:** через SPARQL INSERT DATA / DELETE DATA запросы, которые применяются к текстовому полю «RDF-данные» функцией `applyTripleToRdfInput()`.

## 2. Simple Triple (простая, полная запись)

**Simple Triple** — это полная, раздельная запись каждого триплета. Каждая строка содержит ровно один триплет: субъект, предикат, объект, завершённые точкой.

### Пример в TriG:

```turtle
vad:ptree {
    vad:prosess_test rdf:type vad:TypeProcess .
    vad:prosess_test rdfs:label "Тестовый процесс" .
    vad:prosess_test dcterms:description "Описание тестового процесса" .
    vad:prosess_test vad:hasParentObj vad:p1 .
}
```

### Пример SPARQL INSERT DATA (Simple Triple):

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX vad: <http://example.org/vad#>

INSERT DATA {
    GRAPH vad:ptree {
        vad:prosess_test rdf:type vad:TypeProcess .
        vad:prosess_test rdfs:label "Тестовый процесс" .
        vad:prosess_test dcterms:description "Описание тестового процесса" .
        vad:prosess_test vad:hasParentObj vad:p1 .
    }
}
```

### Генерация в приложении:

Функция `smartDesignCreate()` в `3_sd/3_sd_logic.js` генерирует INSERT DATA запрос в формате Simple Triple. Кнопка «Создать SPARQL» создаёт запрос, а кнопка «Применить как Simple Triple» в окне «Result in SPARQL» вставляет триплет в конец соответствующего TriG-графа в текстовом поле «RDF-данные».

## 3. Shorthand Triple (сокращённая запись)

**Shorthand Triple** — это сокращённая запись с использованием знаков `;` (одинаковый субъект, разные предикаты) и `,` (одинаковый субъект и предикат, разные объекты), позволяющая компактно записать несколько триплетов.

### Синтаксис Turtle/TriG:

- **`;`** (точка с запятой) — разделяет триплеты с одинаковым субъектом, но разными предикатами:
  ```turtle
  vad:p1 rdf:type vad:TypeProcess ;
      rdfs:label "Процесс 1" ;
      vad:hasParentObj vad:ptree .
  ```
  Это эквивалентно трём отдельным триплетам:
  ```turtle
  vad:p1 rdf:type vad:TypeProcess .
  vad:p1 rdfs:label "Процесс 1" .
  vad:p1 vad:hasParentObj vad:ptree .
  ```

- **`,`** (запятая) — разделяет объекты с одинаковым субъектом и предикатом:
  ```turtle
  vad:ExecutorGroup_p1.2 vad:includes vad:Executor1, vad:Executor2 .
  ```
  Это эквивалентно двум триплетам:
  ```turtle
  vad:ExecutorGroup_p1.2 vad:includes vad:Executor1 .
  vad:ExecutorGroup_p1.2 vad:includes vad:Executor2 .
  ```

### Пример Shorthand Triple в TriG:

```turtle
vad:ptree {
    vad:prosess_test rdf:type vad:TypeProcess ;
        rdfs:label "Тестовый процесс" ;
        dcterms:description "Описание тестового процесса" ;
        vad:hasParentObj vad:p1 .
}
```

### Применение в приложении:

Кнопка «Применить как Shorthand Triple» (синяя) в окне «Result in SPARQL» вызывает `smartDesignApplyShorthand()`. В текущей реализации эта функция также вставляет триплет в конец TriG-графа (аналогично Simple Triple).

## 4. Добавление триплетов в начало или конец TriG

### В конец TriG (текущая реализация):

Функция `applyTripleToRdfInput()` в `3_sd/3_sd_logic.js` вставляет новые триплеты **в конец графа** (перед закрывающей `}`). Это стандартное поведение.

### В начало TriG:

Для вставки в начало графа (после открывающей `{`) в N3.js нет встроенной функции. В текущей реализации RDF Grapher это не поддерживается, но может быть реализовано через модификацию `applyTripleToRdfInput()` — вставка сразу после `{` вместо перед `}`.

### Позиционирование через N3.js Store:

Библиотека N3.js `N3.Store` **не поддерживает порядок** триплетов — store является множеством (set), а не упорядоченным списком. Порядок определяется только текстовым представлением TriG в текстовом поле «RDF-данные».

## 5. Преобразование Simple Triple в Shorthand Triple и обратно

### В N3.js:

Библиотека N3.js **не имеет встроенных функций** для явного преобразования между Simple и Shorthand форматами. Однако:

- **N3.Writer** автоматически группирует триплеты с одинаковым субъектом при сериализации, используя `;` и `,`:

```javascript
// Пример: N3.Writer автоматически генерирует Shorthand формат
const writer = new N3.Writer({ prefixes: currentPrefixes, format: 'trig' });

// Добавляем триплеты по одному (Simple Triple)
writer.addQuad(
    N3.DataFactory.namedNode('http://example.org/vad#prosess_test'),
    N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    N3.DataFactory.namedNode('http://example.org/vad#TypeProcess'),
    N3.DataFactory.namedNode('http://example.org/vad#ptree')
);
writer.addQuad(
    N3.DataFactory.namedNode('http://example.org/vad#prosess_test'),
    N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
    N3.DataFactory.literal('Тестовый процесс'),
    N3.DataFactory.namedNode('http://example.org/vad#ptree')
);

// N3.Writer автоматически сгруппирует по субъекту (Shorthand)
writer.end((error, result) => {
    console.log(result);
    // Вывод будет в формате Shorthand (с ;):
    // vad:prosess_test a vad:TypeProcess;
    //     rdfs:label "Тестовый процесс".
});
```

- **N3.Parser** при парсинге **всегда разбирает** оба формата (Simple и Shorthand) одинаково — на выходе получаются отдельные квады.

### Simple → Shorthand:

Для преобразования Simple Triple в Shorthand Triple можно:
1. Загрузить все триплеты в `N3.Store`
2. Сериализовать через `N3.Writer` — writer автоматически применит группировку с `;` и `,`

```javascript
// Пример преобразования всех данных в Shorthand формат
function convertToShorthand(trigText) {
    return new Promise((resolve, reject) => {
        const parser = new N3.Parser({ format: 'trig' });
        const quads = [];
        const prefixes = {};

        parser.parse(trigText, (error, quad, parsedPrefixes) => {
            if (error) { reject(error); return; }
            if (quad) { quads.push(quad); }
            else {
                Object.assign(prefixes, parsedPrefixes);
                const writer = new N3.Writer({ prefixes, format: 'application/trig' });
                quads.forEach(q => writer.addQuad(q));
                writer.end((err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            }
        });
    });
}
```

### Shorthand → Simple:

Для преобразования Shorthand в Simple Triple (каждый триплет на отдельной строке) N3.js не имеет встроенной опции. Необходимо вручную сериализовать каждый квад:

```javascript
// Пример преобразования в Simple Triple формат
function convertToSimple(trigText) {
    return new Promise((resolve, reject) => {
        const parser = new N3.Parser({ format: 'trig' });
        const quads = [];
        const prefixes = {};

        parser.parse(trigText, (error, quad, parsedPrefixes) => {
            if (error) { reject(error); return; }
            if (quad) { quads.push(quad); }
            else {
                Object.assign(prefixes, parsedPrefixes);
                // Группируем квады по графу
                const graphGroups = {};
                quads.forEach(q => {
                    const graphUri = q.graph.value || 'default';
                    if (!graphGroups[graphUri]) graphGroups[graphUri] = [];
                    graphGroups[graphUri].push(q);
                });

                // Формируем вывод
                let output = '';
                // Сначала префиксы
                for (const [prefix, uri] of Object.entries(prefixes)) {
                    output += `@prefix ${prefix}: <${uri}> .\n`;
                }
                output += '\n';

                // Затем каждый граф
                for (const [graphUri, graphQuads] of Object.entries(graphGroups)) {
                    const graphLabel = getPrefixedName(graphUri, prefixes);
                    output += `${graphLabel} {\n`;
                    graphQuads.forEach(q => {
                        const s = getPrefixedName(q.subject.value, prefixes);
                        const p = getPrefixedName(q.predicate.value, prefixes);
                        const o = q.object.termType === 'Literal'
                            ? `"${q.object.value}"`
                            : getPrefixedName(q.object.value, prefixes);
                        output += `    ${s} ${p} ${o} .\n`;
                    });
                    output += `}\n\n`;
                }
                resolve(output);
            }
        });
    });
}
```

## 6. Альтернативные библиотеки

Если требуются расширенные функции управления форматом сериализации:

| Библиотека | Возможности | Примечание |
|---|---|---|
| **N3.js** | Парсинг и сериализация TriG/Turtle. Writer автоматически группирует в Shorthand. | Используется в RDF Grapher |
| **rdf-serialize.js** | Сериализация RDF в различные форматы (Turtle, JSON-LD, N-Triples, TriG). | Часть экосистемы rdf.js |
| **Comunica** | SPARQL-движок для выполнения сложных запросов (UNION, OPTIONAL, FILTER). | Подключён в RDF Grapher для расширенных запросов |
| **rdflib.js** | Полная RDF-библиотека с поддержкой сериализации в разных форматах. | Более тяжеловесная альтернатива |
| **graphy.js** | Быстрый стриминговый парсер/сериализатор с контролем формата вывода. | Поддерживает явное управление Simple/Shorthand |

## 7. Сводная таблица

| Функция | Simple Triple | Shorthand Triple |
|---|---|---|
| Кнопка создания | «Создать SPARQL» | «Создать SPARQL (prefix)» |
| Кнопка применения | «Применить как Simple Triple» | «Применить как Shorthand Triple» |
| Функция генерации | `smartDesignCreate()` | `smartDesignCreateWithPrefix()` |
| Функция применения | `smartDesignApply()` | `smartDesignApplyShorthand()` |
| Вставка в TriG | В конец графа (перед `}`) | В конец графа (перед `}`) |
| Формат в RDF-данных | Каждый триплет отдельно `.` | Группировка через `;` и `,` |
| Парсинг N3.js | Поддерживается | Поддерживается |
| Сериализация N3.Writer | Не поддерживается напрямую | Автоматически (группировка) |
