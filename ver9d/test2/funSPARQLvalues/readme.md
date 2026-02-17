## DP
Сравнение funSPARQLvalues и funSPARQLvaluesComunica

## Сравнение функций `funSPARQLvalues` и `funSPARQLvaluesComunica`

### Краткое описание
- **`funSPARQLvalues`** – синхронная реализация SPARQL SELECT, которая анализирует запрос «вручную» и выполняет сопоставление тройных паттернов с данными в `currentStore`. Поддерживает только базовые шаблоны (тройки, GRAPH) без сложных конструкций (OPTIONAL, FILTER, UNION и т.п.). Возвращает массив объектов `{uri, label}` для указанной переменной.
- **`funSPARQLvaluesComunica`** – асинхронная функция, использующая библиотеку **Comunica** для выполнения полноценных SPARQL 1.1 запросов. Поддерживает любые операторы (OPTIONAL, FILTER, BIND, UNION и др.) и возвращает массив объектов, где ключами являются имена всех SELECT-переменных. Для обратной совместимости добавляет поля `uri` и `label` для основной переменной.

Ниже представлены два HTML-файла с демонстрацией работы каждой функции. Они подключают необходимые библиотеки (`N3`, `Comunica` для второго примера) и файл `vadlib_sparql.js`. В каждом примере создаётся хранилище `N3.Store` с тестовыми данными, после чего выполняется запрос и выводятся результаты.

---

## 1. Демонстрация `funSPARQLvalues`

**Файл:** `demo_funSPARQLvalues.html`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Демо: funSPARQLvalues (простой SPARQL)</title>
    <!-- Подключаем N3.js для работы с RDF -->
    <script src="https://cdn.jsdelivr.net/npm/n3@1.16.2/browser/n3.min.js"></script>
    <!-- Подключаем сам файл с функциями (предполагается, что он лежит рядом) -->
    <script src="vadlib_sparql.js"></script>
</head>
<body>
    <h1>Демонстрация функции funSPARQLvalues</h1>
    <p>Синхронное выполнение простого SELECT-запроса без использования Comunica.</p>
    <hr>
    <h2>Исходные данные в хранилище (N3.Store)</h2>
    <pre id="data"></pre>
    <h2>SPARQL запрос</h2>
    <pre id="query"></pre>
    <h2>Результат</h2>
    <pre id="result"></pre>

    <script>
        (async function() {
            // 1. Инициализируем хранилище N3.Store и наполняем тестовыми данными
            const store = new N3.Store();

            // Добавим несколько триплетов (в разных графах)
            // Граф <http://example.org/graph1>
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Alice'),
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/class/Person'),
                N3.DataFactory.namedNode('http://example.org/graph1')
            );
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Alice'),
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                N3.DataFactory.literal('Alice'),
                N3.DataFactory.namedNode('http://example.org/graph1')
            );

            // Граф <http://example.org/graph2>
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Bob'),
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/class/Person'),
                N3.DataFactory.namedNode('http://example.org/graph2')
            );
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Bob'),
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                N3.DataFactory.literal('Bob'),
                N3.DataFactory.namedNode('http://example.org/graph2')
            );

            // Дополнительный триплет без графа (default graph)
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Charlie'),
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/class/Person')
            );

            // 2. Устанавливаем глобальные переменные, необходимые для vadlib_sparql.js
            window.currentStore = store;
            window.currentPrefixes = {
                'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
                'ex': 'http://example.org/'
            };

            // Отображаем исходные данные (для наглядности)
            const quads = store.getQuads(null, null, null, null);
            document.getElementById('data').textContent = 
                quads.map(q => `${q.subject.value} ${q.predicate.value} ${q.object.value} ${q.graph.value ? 'GRAPH ' + q.graph.value : ''}`).join('\n');

            // 3. Определяем простой SPARQL SELECT запрос (только тройные паттерны)
            const sparqlQuery = `
                SELECT ?person ?label WHERE {
                    GRAPH ?g {
                        ?person rdf:type ex:class/Person .
                        ?person rdfs:label ?label .
                    }
                }
            `;

            document.getElementById('query').textContent = sparqlQuery;

            try {
                // 4. Вызываем funSPARQLvalues (синхронно)
                //    Передаём имя переменной, которую будем использовать как основную для uri (по умолчанию 'value', но здесь 'person')
                const results = funSPARQLvalues(sparqlQuery, 'person');

                // 5. Выводим результат
                document.getElementById('result').textContent = 
                    results.length === 0 ? 'Нет результатов' : JSON.stringify(results, null, 2);
            } catch (e) {
                document.getElementById('result').textContent = 'Ошибка: ' + e.message;
            }
        })();
    </script>
    <hr>
    <p><strong>Особенности:</strong> Функция <code>funSPARQLvalues</code> работает синхронно и поддерживает только базовые паттерны. В запросе выше используется GRAPH, который она умеет обрабатывать. Однако, если добавить OPTIONAL или FILTER, результат будет пустым или некорректным.</p>
</body>
</html>
```

### Описание примера для `funSPARQLvalues`
- **Цель**: показать работу простого синхронного исполнителя SPARQL, встроенного в `vadlib_sparql.js`.
- **Данные**: хранилище содержит три персоны (Alice, Bob, Charlie) с типами и метками в разных графах. Charlie не имеет графа (triple в default graph).
- **Запрос**: выбирает все персоны и их метки из всех графов (используется GRAPH ?g).
- **Ожидаемый результат**: функция должна вернуть массив объектов с полями `uri` (значение переменной `person`) и `label` (значение `?label`). Для данных выше должны быть найдены Alice и Bob (Charlie не попадает, так как его тройка не в графе).
- **Примечание**: функция не поддерживает OPTIONAL, FILTER и др. – это демонстрируется только концептуально.

---

## 2. Демонстрация `funSPARQLvaluesComunica`

**Файл:** `demo_funSPARQLvaluesComunica.html`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Демо: funSPARQLvaluesComunica (полноценный SPARQL)</title>
    <!-- Подключаем N3.js -->
    <script src="https://cdn.jsdelivr.net/npm/n3@1.16.2/browser/n3.min.js"></script>
    <!-- Подключаем Comunica (браузерная версия) -->
    <script src="https://cdn.jsdelivr.net/npm/@comunica/actor-init-query@2.6.6/dist/query-init.js"></script>
    <!-- Подключаем vadlib_sparql.js -->
    <script src="vadlib_sparql.js"></script>
</head>
<body>
    <h1>Демонстрация функции funSPARQLvaluesComunica</h1>
    <p>Асинхронное выполнение SPARQL SELECT с полной поддержкой языка через Comunica.</p>
    <hr>
    <h2>Исходные данные в хранилище (N3.Store)</h2>
    <pre id="data"></pre>
    <h2>SPARQL запрос (с OPTIONAL)</h2>
    <pre id="query"></pre>
    <h2>Результат</h2>
    <pre id="result"></pre>

    <script>
        (async function() {
            // 1. Создаём и наполняем store теми же данными, что и в первом примере
            const store = new N3.Store();

            // Граф <http://example.org/graph1>
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Alice'),
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/class/Person'),
                N3.DataFactory.namedNode('http://example.org/graph1')
            );
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Alice'),
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                N3.DataFactory.literal('Alice'),
                N3.DataFactory.namedNode('http://example.org/graph1')
            );
            // Добавим для Alice возраст (не у всех)
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Alice'),
                N3.DataFactory.namedNode('http://example.org/property/age'),
                N3.DataFactory.literal('30'),
                N3.DataFactory.namedNode('http://example.org/graph1')
            );

            // Граф <http://example.org/graph2>
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Bob'),
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/class/Person'),
                N3.DataFactory.namedNode('http://example.org/graph2')
            );
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Bob'),
                N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
                N3.DataFactory.literal('Bob'),
                N3.DataFactory.namedNode('http://example.org/graph2')
            );
            // У Bob нет возраста

            // Charlie без графа
            store.addQuad(
                N3.DataFactory.namedNode('http://example.org/Person/Charlie'),
                N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
                N3.DataFactory.namedNode('http://example.org/class/Person')
            );

            window.currentStore = store;
            window.currentPrefixes = {
                'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
                'ex': 'http://example.org/'
            };

            // Отображаем данные
            const quads = store.getQuads(null, null, null, null);
            document.getElementById('data').textContent = 
                quads.map(q => `${q.subject.value} ${q.predicate.value} ${q.object.value} ${q.graph.value ? 'GRAPH ' + q.graph.value : ''}`).join('\n');

            // 2. Запрос с OPTIONAL – демонстрация возможностей Comunica
            const sparqlQuery = `
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX ex: <http://example.org/>
                SELECT ?person ?label ?age WHERE {
                    ?person rdf:type ex:class/Person .
                    ?person rdfs:label ?label .
                    OPTIONAL { ?person ex:property/age ?age }
                }
            `;

            document.getElementById('query').textContent = sparqlQuery;

            try {
                // 3. Вызываем асинхронную функцию. Второй параметр – имя основной переменной (person)
                const results = await funSPARQLvaluesComunica(sparqlQuery, 'person');

                // 4. Выводим результат (теперь каждый объект содержит person, label, age, а также uri и label для обратной совместимости)
                document.getElementById('result').textContent = 
                    results.length === 0 ? 'Нет результатов' : JSON.stringify(results, null, 2);
            } catch (e) {
                document.getElementById('result').textContent = 'Ошибка: ' + e.message;
            }
        })();
    </script>
    <hr>
    <p><strong>Особенности:</strong> Благодаря Comunica запрос содержит OPTIONAL. В результате для Alice появится возраст, для Bob – возраст отсутствует (поле <code>age</code> не включено в объект). Функция возвращает все переменные SELECT, а также дублирует основную переменную в поле <code>uri</code> и пытается добавить <code>label</code> из префиксов.</p>
</body>
</html>
```

### Описание примера для `funSPARQLvaluesComunica`
- **Цель**: продемонстрировать преимущество использования Comunica – поддержку сложных конструкций SPARQL, таких как `OPTIONAL`.
- **Данные**: те же персоны, но у Alice дополнительно есть возраст (свойство `ex:age`), у Bob и Charlie возраста нет.
- **Запрос**: выбирает все персоны с их метками, а также опционально возраст. Используется `OPTIONAL`.
- **Ожидаемый результат**: массив объектов с ключами `person`, `label`, `age` (только у Alice), плюс служебные поля `uri` (равно `person`) и `label` (скопировано из `?label`). Charlie не попадёт, так как не имеет типа в графе? В данном запросе граф не ограничен, поэтому Charlie тоже будет найден (у него есть rdf:type). Однако у него нет метки, поэтому условие `?person rdfs:label ?label` не выполнится – он не попадёт в результаты. Чтобы включить Charlie, нужно было бы использовать OPTIONAL для метки или другой паттерн.
- **Примечание**: функция асинхронная, поэтому используется `await`. При отсутствии Comunica произойдёт автоматический fallback на `funSPARQLvalues` (но с потерей OPTIONAL).

---

## Заключение

- **`funSPARQLvalues`** – лёгкая синхронная замена для очень простых запросов, не требующая внешних движков.
- **`funSPARQLvaluesComunica`** – мощная асинхронная обёртка над Comunica, обеспечивающая полную совместимость со SPARQL 1.1. Рекомендуется для всех случаев, кроме крайне простых.

Оба примера используют одно и то же хранилище данных и наглядно показывают различия в функциональности. Для работы второго примера необходимо подключение Comunica с CDN.
