# Модуль 11_reasoning - Semantic Reasoner

<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/317 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/322 -->
<!-- Дата создания: 2026-02-08 -->

## Содержание

1. [Введение](#1-введение)
2. [Архитектура](#2-архитектура)
3. [Правила вывода](#3-правила-вывода)
4. [API модуля](#4-api-модуля)
5. [Интеграция с единственным хранилищем](#5-интеграция-с-единственным-хранилищем)
6. [Диаграммы взаимодействия](#6-диаграммы-взаимодействия)
7. [Примеры использования](#7-примеры-использования)
8. [Резервный вариант обработки данных (Fallback)](#8-резервный-вариант-обработки-данных-fallback)

---

## 1. Введение

Модуль **11_reasoning** реализует механизм семантического вывода (reasoning) для вычисления Virtual TriG в проекте RDF Grapher ver9c.

### 1.1 Назначение

Согласно [base_concept_rules.md](../design/base_concept_rules.md), виртуальные данные (`vad:processSubtype`) должны вычисляться через механизм Reasoner, а не императивным JavaScript-кодом.

### 1.2 Выбор реализации

На основе анализа в [reasoner_concept_v1.md](../design/reasoner/reasoner_concept_v1.md) выбрана библиотека **comunica-feature-reasoning**:

| Критерий | comunica-feature-reasoning |
|----------|---------------------------|
| Интеграция с проектом | Высокая (Comunica уже используется) |
| Размер бандла | Средний |
| RDFS поддержка | Да |
| Forward chaining | Да |
| Документация | Базовая |
| Лицензия | MIT |

### 1.3 Принципы

1. **SPARQL-driven подход** — правила вывода описываются декларативно
2. **Единственное хранилище** — результаты reasoning добавляются в `currentStore`
3. **Материализация** — выведенные данные сохраняются как Virtual TriG

---

## 2. Архитектура

### 2.1 Структура модуля

```
ver9c/
├── 11_reasoning/
│   ├── 11_reasoning_logic.js    - Логика reasoning и inference
│   ├── 11_reasoning_sparql.js   - SPARQL запросы для reasoning
│   └── 11_reasoning.css         - Стили (резерв)
├── doc/
│   └── 11_reasoning.md          - Документация (этот файл)
```

### 2.2 Зависимости

```mermaid
flowchart LR
    subgraph External ["Внешние библиотеки"]
        COMUNICA["comunica-browser.js<br/>(comunica-feature-reasoning)"]
        N3["N3.js"]
    end

    subgraph Modules ["Модули проекта"]
        M9["9_vadlib<br/>(currentStore, prefixes)"]
        M10["10_virtualTriG<br/>(Virtual TriG operations)"]
        M11["11_reasoning<br/>(inference engine)"]
    end

    COMUNICA --> M11
    N3 --> M11
    M9 --> M11
    M11 --> M10
```

### 2.3 Поток данных

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant UI as index.html
    participant Store as currentStore (N3.Store)
    participant Reasoner as 11_reasoning
    participant Virtual as 10_virtualTriG

    User->>UI: Загрузка/изменение данных
    UI->>Store: Добавление квадов
    UI->>Reasoner: Запрос пересчёта
    Reasoner->>Store: Чтение данных
    Reasoner->>Reasoner: Применение правил вывода
    Reasoner->>Virtual: Выведенные подтипы
    Virtual->>Store: Создание Virtual TriG
    Store-->>UI: Обновлённые данные
    UI-->>User: Визуализация
```

---

## 3. Правила вывода

### 3.1 Формат правил N3

Правила вывода описаны в формате Notation3 (N3):

```notation3
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix vad: <http://example.org/vad#> .

# Правило 1: NotDefinedType
{
    ?process rdf:type vad:TypeProcess .
    ?process vad:hasParentObj vad:pNotDefined .
} => {
    ?process vad:processSubtype vad:NotDefinedType .
} .

# Правило 2: DetailedChild
{
    ?process rdf:type vad:TypeProcess .
    ?process vad:hasTrig ?trig .
    ?process vad:isSubprocessTrig ?inTrig .
    ?inTrig vad:definesProcess ?parent .
    ?process vad:hasParentObj ?parent .
} => {
    ?process vad:processSubtype vad:DetailedChild .
} .
```

### 3.2 Таблица правил

| # | Правило | Условие | Результат |
|---|---------|---------|-----------|
| 1 | NotDefinedType | `hasParentObj = pNotDefined` | `processSubtype = NotDefinedType` |
| 2 | isDetailed | `hasTrig` существует | `isDetailed = true` |
| 3 | isNotDetailed | `hasTrig` не существует | `isDetailed = false` |
| 4 | DetailedChild | `isDetailed = true` AND `hasParentObj = definesProcess` | `processSubtype = DetailedChild` |
| 5 | DetailedExternal | `isDetailed = true` AND `hasParentObj ≠ definesProcess` | `processSubtype = DetailedExternal` |
| 6 | notDetailedChild | `isDetailed = false` AND `hasParentObj = definesProcess` | `processSubtype = notDetailedChild` |
| 7 | notDetailedExternal | `isDetailed = false` AND `hasParentObj ≠ definesProcess` | `processSubtype = notDetailedExternal` |

### 3.3 RDFS иерархия классов

```turtle
# Иерархия подтипов процессов
vad:DetailedChild rdfs:subClassOf vad:Detailed .
vad:DetailedExternal rdfs:subClassOf vad:Detailed .
vad:notDetailedChild rdfs:subClassOf vad:notDetailed .
vad:notDetailedExternal rdfs:subClassOf vad:notDetailed .
vad:Detailed rdfs:subClassOf vad:ProcessSubtype .
vad:notDetailed rdfs:subClassOf vad:ProcessSubtype .
vad:NotDefinedType rdfs:subClassOf vad:ProcessSubtype .
```

---

## 4. API модуля

### 4.1 Основные функции (11_reasoning_logic.js)

#### initializeReasoner(reasonerType)

Инициализирует Reasoner engine.

```javascript
/**
 * @param {string} reasonerType - Тип reasoner: 'comunica' | 'eye-js'
 * @returns {Promise<boolean>} - true если инициализация успешна
 */
await initializeReasoner('comunica');
```

#### performInference(store, rules)

Выполняет inference и возвращает выведенные квады.

```javascript
/**
 * @param {N3.Store} store - N3.Store с данными
 * @param {string} rules - Правила вывода в формате N3
 * @returns {Promise<Array>} - Массив выведенных квадов
 */
const inferredQuads = await performInference(currentStore, INFERENCE_RULES_N3);
```

#### materializeVirtualData(prefixes)

Выполняет полный цикл reasoning и материализует Virtual TriG.

```javascript
/**
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Promise<Object>} - Статистика:
 *   - inferredQuads: количество выведенных квадов
 *   - virtualTrigsCreated: количество созданных Virtual TriG
 *   - errors: массив ошибок
 */
const stats = await materializeVirtualData(currentPrefixes);
```

#### validateInferredData()

Проверяет консистентность выведенных данных.

```javascript
/**
 * @returns {Promise<Array>} - Массив найденных нарушений
 */
const violations = await validateInferredData();
```

### 4.2 SPARQL запросы (11_reasoning_sparql.js)

| Запрос | Назначение |
|--------|------------|
| `CONSTRUCT_PROCESS_SUBTYPES()` | Вычисление processSubtype через CONSTRUCT |
| `GET_PROCESSES_FOR_REASONING()` | Подготовка данных для reasoning |
| `INSERT_INFERRED_SUBTYPES(...)` | Материализация выведенных данных |
| `DELETE_ALL_INFERRED_SUBTYPES()` | Очистка перед пересчётом |
| `CHECK_MISSING_SUBTYPES()` | Поиск процессов без подтипа |
| `CHECK_CONFLICTING_SUBTYPES()` | Поиск конфликтов |
| `DEBUG_REASONING_DATA()` | Отладочный запрос |

---

## 5. Интеграция с единственным хранилищем

### 5.1 Принцип единственного хранилища

Согласно [base_concept_rules.md](../design/base_concept_rules.md), в системе должен быть только один источник данных — `currentStore` (N3.Store).

### 5.2 Схема взаимодействия

```mermaid
flowchart TB
    subgraph Store ["currentStore (N3.Store)"]
        PTREE["vad:ptree<br/>(концепты процессов)"]
        VADDIA["vad:t_*<br/>(VADProcessDia)"]
        VIRTUAL["vad:vt_*<br/>(Virtual TriG)"]
    end

    subgraph Reasoning ["11_reasoning"]
        RULES["Inference Rules"]
        ENGINE["Reasoner Engine"]
    end

    PTREE --> ENGINE
    VADDIA --> ENGINE
    RULES --> ENGINE
    ENGINE --> VIRTUAL

    style VIRTUAL fill:#e3f2fd
```

### 5.3 Жизненный цикл Virtual данных

1. **Инициализация** — Reasoner инициализируется при загрузке страницы
2. **Загрузка данных** — Данные парсятся и добавляются в `currentStore`
3. **Inference** — Reasoner читает данные и применяет правила
4. **Материализация** — Выведенные квады добавляются в `currentStore` как Virtual TriG
5. **Изменение** — При изменении данных повторяется шаги 3-4
6. **Сохранение** — Virtual TriG исключаются при сохранении файла

---

## 6. Диаграммы взаимодействия

### 6.1 Процесс inference

```mermaid
flowchart TD
    A[Начало inference] --> B[Получить данные из currentStore]
    B --> C{Reasoner инициализирован?}
    C -->|Да| D[Применить правила вывода]
    C -->|Нет| E[Fallback: JS-реализация]
    D --> F[Сгруппировать по Virtual TriG]
    E --> F
    F --> G[Удалить старые Virtual TriG]
    G --> H[Добавить новые Virtual TriG в store]
    H --> I[Конец]
```

### 6.2 Взаимодействие с модулями

```mermaid
sequenceDiagram
    participant M2 as 2_triplestore
    participant M9 as 9_vadlib
    participant M11 as 11_reasoning
    participant M10 as 10_virtualTriG

    M2->>M9: parseTriGHierarchy()
    M9->>M11: initializeReasoner()
    M11-->>M9: Reasoner ready

    M2->>M11: performInference(currentStore)
    M11->>M11: Применение правил N3
    M11-->>M2: inferredQuads[]

    M2->>M10: materializeVirtualData()
    M10->>M10: createVirtualTriG()
    M10-->>M9: Квады добавлены в store
```

---

## 7. Примеры использования

### 7.1 Инициализация и пересчёт

```javascript
// При загрузке приложения
await initializeReasoner('comunica');

// После загрузки данных
const stats = await materializeVirtualData(currentPrefixes);
console.log('Создано Virtual TriG:', stats.virtualTrigsCreated);
```

### 7.2 SPARQL CONSTRUCT для inference

```javascript
const query = REASONING_SPARQL.CONSTRUCT_PROCESS_SUBTYPES();
const result = await reasonerEngine.queryQuads(query, { sources: [currentStore] });

for await (const quad of result) {
    console.log('Inferred:', quad.subject.value, quad.object.value);
}
```

### 7.3 Отладка reasoning

```javascript
// Показать все данные для reasoning
const debugQuery = REASONING_SPARQL.DEBUG_REASONING_DATA();
const debugResults = await funSPARQLvaluesComunica(debugQuery, currentPrefixes);

console.table(debugResults);
```

### 7.4 Валидация выведенных данных

```javascript
const violations = await validateInferredData();

if (violations.length > 0) {
    console.error('Найдены нарушения:');
    violations.forEach(v => console.error(`  ${v.type}: ${v.message}`));
}
```

### 7.5 Fallback на JS-реализацию

Если Reasoner недоступен, используется fallback:

```javascript
if (!isReasonerInitialized()) {
    console.warn('Reasoner не инициализирован, используем JS fallback');
    const inferredQuads = performInferenceFallback(currentStore);
}
```

---

## 8. Резервный вариант обработки данных (Fallback)

<!-- issue #322: Документация причин недоступности comunica-feature-reasoning -->

### 8.1 Причины недоступности comunica-feature-reasoning

Функция `comunica-feature-reasoning` может быть недоступна по следующим причинам:

| # | Причина | Описание | Пример |
|---|---------|----------|--------|
| 1 | **Библиотека не загружена** | CDN или локальный файл с comunica-feature-reasoning недоступен | Ошибка сети, отсутствие файла в сборке |
| 2 | **Браузер не поддерживает WebAssembly** | EYE-JS требует WebAssembly для N3 reasoning | Устаревшие версии IE, некоторые мобильные браузеры |
| 3 | **Web Workers заблокированы** | Comunica использует Workers для асинхронных операций | Политики безопасности CSP, file:// протокол |
| 4 | **Недостаточно памяти** | Reasoning на больших датасетах требует много RAM | Датасеты >100k квадов на мобильных устройствах |
| 5 | **CORS ограничения** | При загрузке внешних правил или данных | Запросы к внешним SPARQL endpoints |
| 6 | **Тайм-аут выполнения** | Сложные правила могут выполняться слишком долго | Рекурсивные правила, большие цепочки вывода |
| 7 | **Ошибка парсинга N3 правил** | Синтаксические ошибки в правилах вывода | Неправильный формат N3/Notation3 |

### 8.2 Примеры кода с обработкой недоступности

#### Пример 1: Проверка доступности перед вызовом

```javascript
// Безопасная инициализация reasoner с fallback
async function safeInitializeReasoner() {
    try {
        // Проверяем доступность Comunica
        if (typeof Comunica === 'undefined') {
            console.warn('Comunica не загружена, использую JavaScript fallback');
            return false;
        }

        // Проверяем доступность QueryEngine
        if (!Comunica.QueryEngine) {
            console.warn('QueryEngine недоступен, использую JavaScript fallback');
            return false;
        }

        // Проверяем поддержку WebAssembly (для EYE-JS)
        if (typeof WebAssembly === 'undefined') {
            console.warn('WebAssembly не поддерживается, использую JavaScript fallback');
            return false;
        }

        // Инициализируем reasoner
        reasonerEngine = new Comunica.QueryEngine();
        reasonerInitialized = true;
        return true;

    } catch (error) {
        console.error('Ошибка инициализации reasoner:', error.message);
        return false;
    }
}
```

#### Пример 2: Fallback при ошибке reasoning

```javascript
// Выполнение inference с автоматическим fallback
async function performInferenceWithFallback(store) {
    // Пытаемся использовать reasoner
    if (isReasonerInitialized()) {
        try {
            const inferredQuads = await performInferenceComunica(store);
            return { method: 'comunica', quads: inferredQuads };
        } catch (error) {
            console.warn('Comunica reasoning failed:', error.message);
            console.warn('Switching to JavaScript fallback...');
        }
    }

    // Fallback на JavaScript реализацию
    const fallbackQuads = performInferenceFallback(store);
    return { method: 'javascript', quads: fallbackQuads };
}
```

#### Пример 3: Логирование причины fallback

```javascript
// Диагностика причины недоступности
function diagnoseReasonerUnavailability() {
    const diagnostics = {
        comunicaLoaded: typeof Comunica !== 'undefined',
        queryEngineAvailable: typeof Comunica?.QueryEngine === 'function',
        webAssemblySupported: typeof WebAssembly !== 'undefined',
        workersSupported: typeof Worker !== 'undefined',
        memoryInfo: navigator?.deviceMemory || 'unknown'
    };

    console.table(diagnostics);

    if (!diagnostics.comunicaLoaded) {
        return 'COMUNICA_NOT_LOADED';
    }
    if (!diagnostics.queryEngineAvailable) {
        return 'QUERY_ENGINE_UNAVAILABLE';
    }
    if (!diagnostics.webAssemblySupported) {
        return 'WEBASSEMBLY_NOT_SUPPORTED';
    }
    if (!diagnostics.workersSupported) {
        return 'WORKERS_NOT_SUPPORTED';
    }

    return 'UNKNOWN';
}
```

### 8.3 Текущее решение (JavaScript Fallback)

В текущей реализации (PR #321) используется **JavaScript fallback** как основной метод:

```mermaid
flowchart TD
    A[Запрос на вычисление processSubtype] --> B{Reasoner инициализирован?}
    B -->|Нет| C[JavaScript Fallback]
    B -->|Да| D{performInference успешен?}
    D -->|Да| E[Использовать выведенные квады]
    D -->|Нет| C
    C --> F[calculateProcessSubtypes]
    F --> G[Императивное вычисление через JS]
    G --> H[Результат: processSubtype]
    E --> H
```

#### Функция fallback (из 11_reasoning_logic.js):

```javascript
function performInferenceFallback(store) {
    console.log('Using fallback inference (JavaScript implementation)');

    // Используем существующую функцию calculateProcessSubtypes
    if (typeof calculateProcessSubtypes === 'function' && typeof trigHierarchy !== 'undefined') {
        const virtualData = calculateProcessSubtypes(trigHierarchy, currentPrefixes);
        const inferredQuads = [];

        const factory = N3.DataFactory;
        const { namedNode } = factory;

        for (const [trigUri, processes] of Object.entries(virtualData)) {
            for (const [processUri, processInfo] of Object.entries(processes)) {
                const subtype = processInfo.processSubtype;
                if (subtype) {
                    inferredQuads.push(factory.quad(
                        namedNode(processUri),
                        namedNode(REASONING_NS.VAD + 'processSubtype'),
                        namedNode(REASONING_NS.VAD + subtype),
                        namedNode(trigUri.replace('#t_', '#vt_'))
                    ));
                }
            }
        }

        return inferredQuads;
    }

    return [];
}
```

### 8.4 Предложения по полному переходу на N3.Store

#### 8.4.1 Текущая архитектура (Dual Storage)

```
┌─────────────────────────────────────────────────────────────┐
│                    Текущая архитектура                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐       ┌─────────────────────────────┐ │
│  │  currentQuads   │ sync  │     currentStore            │ │
│  │    (Array)      │◄─────►│     (N3.Store)              │ │
│  └─────────────────┘       └─────────────────────────────┘ │
│         │                            │                      │
│         ▼                            ▼                      │
│  ┌─────────────────┐       ┌─────────────────────────────┐ │
│  │ trigHierarchy   │       │  SPARQL через Comunica      │ │
│  │   (Object)      │       │                             │ │
│  └─────────────────┘       └─────────────────────────────┘ │
│         │                            │                      │
│         ▼                            ▼                      │
│  ┌─────────────────┐       ┌─────────────────────────────┐ │
│  │ virtualRDFdata  │       │  isVirtualGraph() SPARQL    │ │
│  │   (Object)      │       │                             │ │
│  └─────────────────┘       └─────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 8.4.2 Целевая архитектура (Single Storage)

```
┌─────────────────────────────────────────────────────────────┐
│                   Целевая архитектура                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│            ┌─────────────────────────────┐                  │
│            │      currentStore           │                  │
│            │       (N3.Store)            │                  │
│            │   Единственный источник     │                  │
│            └─────────────┬───────────────┘                  │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌───────────────┐ ┌───────────┐ ┌───────────────────────┐ │
│  │ Чтение через │ │ Reasoning │ │ Запись/Удаление       │ │
│  │   SPARQL     │ │   через   │ │ через SPARQL UPDATE   │ │
│  │   SELECT     │ │ N3 Rules  │ │ INSERT/DELETE         │ │
│  └───────────────┘ └───────────┘ └───────────────────────┘ │
│                                                             │
│  ❌ currentQuads (удалён)                                   │
│  ❌ trigHierarchy (вычисляется из store)                    │
│  ❌ virtualRDFdata (хранится в store как vad:Virtual)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 8.4.3 План миграции

| Этап | Действие | Статус |
|------|----------|--------|
| 1 | Добавить Virtual TriG в `currentStore` | ✅ Реализовано (PR #321) |
| 2 | Использовать `currentStore.getQuads()` вместо `currentQuads` | ⚠️ Частично |
| 3 | Вычислять `trigHierarchy` через SPARQL | ❌ Не реализовано |
| 4 | Удалить глобальный массив `currentQuads` | ❌ Требует рефакторинга |
| 5 | Заменить `calculateProcessSubtypes()` на N3 reasoning | ❌ Требует comunica-feature-reasoning |
| 6 | Удалить глобальный объект `virtualRDFdata` | ❌ Требует рефакторинга |

### 8.5 Резюме

| Компонент | Текущий статус | Целевой статус |
|-----------|----------------|----------------|
| comunica-feature-reasoning | ⚠️ Подготовлен, не используется | ✅ Основной метод |
| JavaScript fallback | ✅ Основной метод | ⚠️ Резервный метод |
| N3 правила вывода | ✅ Определены | ✅ Активно используются |
| currentQuads дублирование | ⚠️ Существует | ❌ Удалён |
| SPARQL-driven подход | ⚠️ Частично | ✅ Полностью |

---

## Источники

- [issue #317: ver9c_1rea1](https://github.com/bpmbpm/rdf-grapher/issues/317)
- [issue #322: ver9c_1rea1b](https://github.com/bpmbpm/rdf-grapher/issues/322)
- [base_concept_rules.md](../design/base_concept_rules.md)
- [reasoner_concept_v1.md](../design/reasoner/reasoner_concept_v1.md)
- [comunica-feature-reasoning на GitHub](https://github.com/comunica/comunica-feature-reasoning)
- [EYE-JS на GitHub](https://github.com/eyereasoner/eye-js)
- [Notation3 Specification](https://w3c.github.io/N3/spec/)
- [10_virtualTriG.md](./10_virtualTriG.md)

---

*Документ создан: 2026-02-08*
*Обновлён: 2026-02-08 (issue #322)*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.1*
*Ссылки на issues: #317, #322*
