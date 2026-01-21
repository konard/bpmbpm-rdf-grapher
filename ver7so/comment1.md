# Предложения по корректировкам TrigVADv2 и алгоритма обработки

## 1. Предложения по корректировкам примера TrigVADv2

### 1.1 Явное указание типа TriG графов

**Текущее состояние:**
TriG графы (`vad:t_pGA`, `vad:t_p1`) не имеют явного указания типа `rdf:type`.

**Предложение:**
Добавить явное указание типа для каждого TriG графа:

```turtle
vad:t_pGA {
    vad:t_pGA rdf:type vad:VADProcessDia ;
        rdfs:label "Схема процесса t_pGA" ;
        vad:hasParent vad:root .
    # ...
}

vad:t_p1 {
    vad:t_p1 rdf:type vad:VADProcessDia ;
        rdfs:label "Схема процесса t_p1" ;
        vad:hasParent vad:t_pGA .
    # ...
}
```

**Обоснование:**
- Обеспечивает явную типизацию TriG графов
- Позволяет автоматически определять тип графа при валидации
- Соответствует принципам онтологии

### 1.2 Явное указание типа для vad:ptree

**Текущее состояние:**
`vad:ptree` не имеет явного указания типа.

**Предложение:**
```turtle
vad:ptree {
    vad:ptree rdf:type vad:ProcessTree ;
        rdfs:label "Дерево Процессов (TriG)" ;
        vad:hasParent vad:root .
    # ...
}
```

**Обоснование:**
- Явная типизация упрощает программную обработку
- Соответствует онтологии, где `vad:ptree` является экземпляром `vad:ProcessTree`

### 1.3 Добавление dcterms:description для TriG графов

**Текущее состояние:**
TriG графы имеют только `rdfs:label`.

**Предложение:**
```turtle
vad:t_pGA {
    vad:t_pGA rdf:type vad:VADProcessDia ;
        rdfs:label "Схема процесса t_pGA" ;
        dcterms:description "Верхнеуровневая схема группы процессов A" ;
        vad:hasParent vad:root .
}
```

**Обоснование:**
- Унификация структуры: процессы имеют `dcterms:description`, логично иметь его и для TriG графов
- Улучшает документированность модели

### 1.4 Явное определение подтипов процессов в vad:ptree

**Текущее состояние:**
Подтип процесса (`vad:processSubtype`) указывается только в схеме процесса (`VADProcessDia`).

**Предложение (альтернативный подход):**
Добавить в `PTREE_PREDICATES` предикат `vad:processSubtype` для обеспечения глобальной видимости подтипа:

```turtle
vad:ptree {
    vad:p1 rdf:type vad:Process ;
        rdfs:label "p1 Процесс 1" ;
        dcterms:description "Первый процесс" ;
        vad:processSubtype vad:Detailed ;  # Добавить
        vad:hasTrig vad:t_p1 .
}
```

**Обоснование:**
- Подтип процесса является характеристикой самого процесса, а не его представления на конкретной схеме
- Упрощает определение, является ли процесс детализированным, без обращения к каждой схеме

**Альтернатива:**
Оставить как есть, если считается, что один и тот же процесс может иметь разные подтипы на разных схемах (что маловероятно, но возможно в теории).

### 1.5 Упорядочивание процессов в vad:ptree

**Текущее состояние:**
Процессы в `vad:ptree` перечислены в произвольном порядке.

**Предложение:**
Группировать процессы по их принадлежности к схемам:

```turtle
vad:ptree {
    # Свойства самого ptree
    vad:ptree rdf:type vad:ProcessTree ;
        rdfs:label "Дерево Процессов (TriG)" ;
        vad:hasParent vad:root .

    # === Процессы группы pGA ===
    vad:pGA rdf:type vad:Process ;
        rdfs:label "Группа Процессов А" ;
        vad:hasTrig vad:t_pGA .

    # === Процессы схемы t_pGA ===
    vad:p1 rdf:type vad:Process ;
        rdfs:label "p1 Процесс 1" ;
        vad:hasTrig vad:t_p1 .

    vad:Process2 rdf:type vad:Process ;
        rdfs:label "Процесс 2" .
    # ...

    # === Процессы схемы t_p1 ===
    vad:Process21 rdf:type vad:Process ;
        rdfs:label "Процесс 21" .
    # ...
}
```

**Обоснование:**
- Улучшает читаемость
- Упрощает поиск процессов

---

## 2. Предложения по корректировкам алгоритма обработки (index.html)

### 2.1 Добавление валидации типов TriG графов

**Текущее состояние:**
Алгоритм не проверяет тип TriG графа (`vad:VADProcessDia`, `vad:ProcessTree`).

**Предложение:**
Добавить валидацию при загрузке данных:

```javascript
// Предлагаемая функция валидации типов TriG
function validateTrigTypes(quads, prefixes) {
    const trigGraphs = new Set();
    const trigTypes = new Map();

    // Собираем все TriG графы и их типы
    quads.forEach(quad => {
        if (quad.graph && quad.graph.value) {
            trigGraphs.add(quad.graph.value);
        }
        // Проверяем rdf:type для графов
        if (quad.predicate.value.endsWith('#type') ||
            quad.predicate.value === 'rdf:type') {
            const subject = quad.subject.value;
            if (trigGraphs.has(subject)) {
                trigTypes.set(subject, quad.object.value);
            }
        }
    });

    // Валидация: каждый TriG должен иметь тип
    const warnings = [];
    trigGraphs.forEach(graph => {
        if (!trigTypes.has(graph)) {
            warnings.push(`TriG ${graph} не имеет явного типа (rdf:type)`);
        }
    });

    return warnings;
}
```

**Обоснование:**
- Улучшает согласованность данных с онтологией
- Помогает выявить ошибки при создании данных

### 2.2 Расширение PTREE_PREDICATES для поддержки processSubtype

**Текущее состояние:**
```javascript
const PTREE_PREDICATES = [
    'rdf:type', 'rdfs:label', 'dcterms:description', 'vad:hasTrig'
];
```

**Предложение (альтернативный подход):**
Если будет принято решение хранить `processSubtype` в `vad:ptree`:

```javascript
const PTREE_PREDICATES = [
    'rdf:type',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'rdfs:label',
    'http://www.w3.org/2000/01/rdf-schema#label',
    'dcterms:description',
    'http://purl.org/dc/terms/description',
    'vad:hasTrig',
    'http://example.org/vad#hasTrig',
    'vad:processSubtype',  // Добавить
    'http://example.org/vad#processSubtype'  // Добавить
];
```

**Обоснование:**
- Подтип процесса является его неотъемлемой характеристикой
- Упрощает определение детализированных процессов

### 2.3 Добавление функции получения типа TriG графа

**Предложение:**
```javascript
/**
 * Определяет тип TriG графа
 * @param {string} trigUri - URI TriG графа
 * @param {Array} quads - Массив квадов
 * @returns {string|null} - Тип графа или null
 */
function getTrigType(trigUri, quads) {
    const typeQuad = quads.find(quad =>
        quad.subject.value === trigUri &&
        (quad.predicate.value.endsWith('#type') ||
         quad.predicate.value === 'rdf:type')
    );

    if (typeQuad) {
        return getPrefixedName(typeQuad.object.value, currentPrefixes);
    }

    // Определение типа по эвристике
    if (trigUri.endsWith('#ptree') || trigUri.includes('ptree')) {
        return 'vad:ProcessTree';
    }
    return 'vad:VADProcessDia';
}
```

**Обоснование:**
- Позволяет явно определять тип TriG графа
- Поддерживает обратную совместимость через эвристику

### 2.4 Улучшение функции buildTrigTree

**Текущее состояние:**
Функция `buildTrigTree` не учитывает типы TriG графов при построении дерева.

**Предложение:**
Добавить группировку по типам в дереве:

```javascript
function buildTrigTree() {
    // ... существующий код ...

    // Добавить разделение по типам
    const processTreeGraphs = [];
    const vadProcessDiaGraphs = [];

    Object.entries(trigNodes).forEach(([uri, node]) => {
        const trigType = getTrigType(uri, currentQuads);
        if (trigType === 'vad:ProcessTree') {
            processTreeGraphs.push(node);
        } else {
            vadProcessDiaGraphs.push(node);
        }
    });

    // ... отображение с учётом типов ...
}
```

**Обоснование:**
- Визуально разделяет разные типы графов
- Улучшает понимание структуры данных

### 2.5 Добавление импорта онтологии

**Предложение:**
Добавить возможность загрузки онтологии для валидации:

```javascript
/**
 * Загружает и парсит онтологию
 * @returns {Promise<Object>} - Объект с классами и свойствами онтологии
 */
async function loadOntology() {
    const ontologyUrl = 'vad-basic-ontology.ttl';
    try {
        const response = await fetch(ontologyUrl);
        const ontologyText = await response.text();
        const ontologyQuads = await parseRdf(ontologyText, 'turtle');

        // Извлекаем классы и свойства
        return extractOntologyMetadata(ontologyQuads);
    } catch (error) {
        console.warn('Не удалось загрузить онтологию:', error);
        return null;
    }
}
```

**Обоснование:**
- Позволяет валидировать данные относительно онтологии
- Обеспечивает автодополнение типов и свойств

### 2.6 Добавление констант для типов TriG графов

**Предложение:**
```javascript
/**
 * TRIG_TYPES - Типы TriG графов в VAD онтологии
 */
const TRIG_TYPES = {
    PROCESS_TREE: ['vad:ProcessTree', 'http://example.org/vad#ProcessTree'],
    VAD_PROCESS_DIA: ['vad:VADProcessDia', 'http://example.org/vad#VADProcessDia']
};

/**
 * Проверяет, является ли тип типом ProcessTree
 * @param {string} typeUri - URI типа
 * @returns {boolean}
 */
function isProcessTreeType(typeUri) {
    return TRIG_TYPES.PROCESS_TREE.some(t =>
        typeUri === t || typeUri.endsWith('#ProcessTree')
    );
}

/**
 * Проверяет, является ли тип типом VADProcessDia
 * @param {string} typeUri - URI типа
 * @returns {boolean}
 */
function isVADProcessDiaType(typeUri) {
    return TRIG_TYPES.VAD_PROCESS_DIA.some(t =>
        typeUri === t || typeUri.endsWith('#VADProcessDia')
    );
}
```

**Обоснование:**
- Централизует определения типов
- Упрощает поддержку кода

---

## 3. Сводная таблица предложений

| # | Область | Предложение | Приоритет | Влияние на совместимость |
|---|---------|-------------|-----------|--------------------------|
| 1.1 | TrigVADv2 | Явный тип для TriG графов | Средний | Низкое |
| 1.2 | TrigVADv2 | Явный тип для vad:ptree | Средний | Низкое |
| 1.3 | TrigVADv2 | dcterms:description для TriG | Низкий | Нет |
| 1.4 | TrigVADv2 | processSubtype в ptree | Низкий | Среднее |
| 1.5 | TrigVADv2 | Упорядочивание процессов | Низкий | Нет |
| 2.1 | index.html | Валидация типов TriG | Средний | Нет |
| 2.2 | index.html | processSubtype в PTREE_PREDICATES | Низкий | Среднее |
| 2.3 | index.html | Функция getTrigType | Средний | Нет |
| 2.4 | index.html | Улучшение buildTrigTree | Низкий | Нет |
| 2.5 | index.html | Импорт онтологии | Низкий | Нет |
| 2.6 | index.html | Константы TRIG_TYPES | Средний | Нет |

---

## 4. Заключение

Предложенные изменения направлены на:
1. **Улучшение согласованности** между данными и онтологией
2. **Повышение читаемости** и структурированности данных
3. **Упрощение программной обработки** и валидации
4. **Сохранение обратной совместимости** с существующими данными

Рекомендуется начать с внедрения изменений с низким влиянием на совместимость (1.3, 1.5, 2.1, 2.3, 2.4, 2.5, 2.6), а затем рассмотреть более существенные изменения (1.1, 1.2, 1.4, 2.2) после тестирования.
