<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/252 -->
<!-- Обновлено: PR #273 по issue #272, дата 2026-02-04 -->
<!-- Обновлено: issue #317 - добавлены модули 10_virtualTriG и 11_reasoning, дата 2026-02-08 -->

# Структура папок проекта RDF Grapher ver9d

## 1. Обзор структуры проекта

Проект RDF Grapher ver9d организован по модульному принципу. Каждый функциональный модуль размещен в отдельной пронумерованной папке (1_ -- 11_), что обеспечивает четкое разделение ответственности и независимость модулей. Нумерация папок отражает логический порядок работы пользователя с приложением: от загрузки данных (1_) до общей библиотеки утилит (9_) и специализированных модулей обработки данных (10_, 11_).

Корневой файл `index.html` является минимальной HTML-оболочкой, которая подключает модули и организует общую компоновку интерфейса. Конфигурация состояния окон (свернуто/развернуто) хранится в `config.json`.

## 2. Описание каждой папки

### Общая структура

```
ver9d/
├── index.html                    (700 строк)  - Минимальный HTML файл-оболочка
├── styles.css                    (2400 строк) - Основные стили приложения
├── config.json                   (38 строк)   - Конфигурация состояния окон
├── dia/                          - Папка с примерами диаграмм (issue #272)
│   ├── Trig_VADv5.ttl            (295 строк)  - Пример данных VAD v5
│   └── Trig_VADv6.ttl            (302 строк)  - Пример данных VAD v6
├── 1_example_data/               - Модуль загрузки примеров RDF данных
│   ├── 1_example_data_ui.js      (106 строк)  - UI функции загрузки примеров
│   ├── 1_example_data_logic.js   (624 строки)  - Встроенные данные примеров
│   └── 1_example_data.css        (5 строк)    - Стили модуля
├── 2_triplestore/                - Модуль ввода и хранения RDF данных
│   ├── 2_triplestore_ui.js       (199 строк)  - UI функции ввода данных
│   ├── 2_triplestore_logic.js    (726 строк)  - Логика парсинга и валидации
│   ├── 2_triplestore_validation.js (619 строк) - Валидация VAD схемы
│   ├── 2_triplestore.css         (15 строк)   - Стили модуля
│   └── 2_triplestore_test/       - Подмодуль тестирования
│       ├── 2_triplestore_test_logic.js   (208 строк) - Логика тестирования
│       └── 2_triplestore_test_sparql.js  (4 строки)  - SPARQL запросы для тестов
├── 3_sd/                         - Модуль Smart Design
│   ├── 3_sd_ui.js                (1165 строк) - UI функции Smart Design
│   ├── 3_sd_logic.js             (351 строк)  - Бизнес-логика Smart Design
│   ├── 3_sd_sparql.js            (127 строк)  - SPARQL запросы Smart Design
│   ├── 3_sd.css                  (5 строк)    - Стили модуля
│   ├── 3_sd_create_new_concept/  - Подмодуль создания концептов
│   │   ├── 3_sd_create_new_concept_sparql.js - SPARQL запросы для создания концептов
│   │   └── 3_sd_create_new_concept_logic.js  - Логика создания концептов
│   ├── 3_sd_del_concept_individ/ - Подмодуль удаления
│   │   ├── 3_sd_del_concept_individ_sparql.js - SPARQL запросы для удаления
│   │   └── 3_sd_del_concept_individ_logic.js  - Логика удаления с проверкой зависимостей
│   └── 3_sd_create_new_trig/     - Подмодуль создания TriG
│       └── 3_sd_create_new_trig_logic.js     (131 строка)
├── 4_resSPARQL/                  - Модуль Result in SPARQL
│   ├── 4_resSPARQL_ui.js         (4 строки)   - UI модуль
│   └── 4_resSPARQL.css           (5 строк)    - Стили модуля
├── 5_publisher/                  - Модуль визуализации (Publisher)
│   ├── 5_publisher_ui.js         (799 строк)  - UI функции визуализации
│   ├── 5_publisher_logic.js      (1460 строк) - Логика генерации графов
│   ├── 5_publisher_sparql.js     (39 строк)   - SPARQL запросы Publisher
│   ├── 5_publisher_trig.js       (638 строк)  - Работа с деревом TriG
│   └── 5_publisher.css           (5 строк)    - Стили модуля
├── 6_legend/                     - Модуль легенды стилей
│   ├── 6_legend_ui.js            (337 строк)  - UI генерации легенды
│   └── 6_legend.css              (5 строк)    - Стили модуля
├── 7_info/                       - Модуль Prefixes
│   ├── 7_info_ui.js              (26 строк)   - UI отображения префиксов
│   └── 7_info.css                (5 строк)    - Стили модуля
├── 8_infoSPARQL/                 - Модуль SPARQL запросов
│   ├── 8_infoSPARQL_ui.js        (215 строк)  - UI и выполнение SPARQL
│   ├── 8_infoSPARQL_sparql.js    (4 строки)   - Предустановленные запросы
│   └── 8_infoSPARQL.css          (5 строк)    - Стили модуля
├── 9_vadlib/                     - Общая библиотека
│   ├── vadlib.js                 (619 строк)  - Основные утилиты и конфигурация
│   └── vadlib_sparql.js          (274 строки)  - SPARQL движок (funSPARQLvalues)
├── 10_virtualTriG/               - Модуль Virtual TriG (issue #317)
│   ├── 10_virtualTriG_logic.js   - Логика вычисления и управления Virtual TriG
│   ├── 10_virtualTriG_sparql.js  - SPARQL запросы для Virtual TriG
│   ├── 10_virtualTriG_ui.js      - UI функции отображения
│   └── 10_virtualTriG.css        - Стили модуля
├── 11_reasoning/                 - Модуль Semantic Reasoning (issue #317)
│   ├── 11_reasoning_logic.js     - Логика reasoning и inference
│   ├── 11_reasoning_sparql.js    - SPARQL запросы для reasoning
│   └── 11_reasoning.css          - Стили (резерв)
├── doc/                          - Документация
├── ontology/                     - Файлы онтологии
├── requirements/                 - Требования к проекту
└── test/                         - Автоматизированные тесты
```

### 1_example_data/ -- Модуль загрузки примеров RDF данных

Отвечает за загрузку предустановленных примеров RDF данных (Trig_VADv5, Trig_VADv6) из подпапки `dia/`. Содержит UI-функции для кнопок загрузки примеров. При ошибке загрузки файла показывается диалог с предложением выбрать файл вручную (issue #260, #272).

**Файлы:**
- `1_example_data_ui.js` -- UI функции: `loadExampleFromFile()`, `loadExampleTrigVADv5()`, `loadExampleTrigVADv6()`
- `1_example_data_logic.js` -- Объект `EXAMPLE_DATA` со встроенными данными примеров

### 2_triplestore/ -- Модуль ввода и хранения RDF данных

Основной модуль для ввода, парсинга и хранения RDF данных. Включает текстовое поле для ввода TriG данных, функции парсинга через библиотеку N3.js, построение иерархии TriG графов, вычисление подтипов процессов и валидацию данных по правилам VAD-онтологии.

**Файлы:**
- `2_triplestore_ui.js` -- UI: текстовое поле, кнопки управления (Очистить, Сохранить, Загрузить)
- `2_triplestore_logic.js` -- Логика: `parseTriGHierarchy()`, `calculateProcessSubtypes()`, парсинг и валидация

**Подпапка `2_triplestore_test/`:**
- `2_triplestore_test_logic.js` -- Логика автоматического тестирования (кнопка "Тест")
- `2_triplestore_test_sparql.js` -- SPARQL запросы, используемые при тестировании валидации

### 3_sd/ -- Модуль Smart Design

Модуль SPARQL Smart Design для интерактивного редактирования RDF данных. Предоставляет выпадающие списки для выбора TriG графа, типа субъекта, субъекта, предиката и объекта. Формирует SPARQL INSERT/DELETE запросы на основе выбора пользователя.

**Файлы:**
- `3_sd_ui.js` -- UI: выпадающие списки, кнопки, обработчики событий
- `3_sd_logic.js` -- Бизнес-логика: формирование SPARQL запросов, обновление данных
- `3_sd_sparql.js` -- Коллекция SPARQL запросов для Smart Design (SPARQL_QUERIES)

**Подпапки (по кнопкам):**
- `3_sd_create_new_concept/` -- Кнопка "New Concept": создание новых концептов (процессов и исполнителей)
  - `3_sd_create_new_concept_logic.js` -- Логика создания концептов на основе технологических объектов
- `3_sd_del_concept_individ/` -- Кнопка "Del Concept\Individ": удаление концептов и индивидов
  - `3_sd_del_concept_individ_logic.js` -- Логика удаления с проверкой зависимостей
- `3_sd_create_new_trig/` -- Кнопка "New TriG (VADProcessDia)": создание новых TriG графов
  - `3_sd_create_new_trig_logic.js` -- Логика создания новых схем процессов

### 4_resSPARQL/ -- Модуль Result in SPARQL

Отображает результат выполнения SPARQL операций (INSERT, DELETE) в текстовом виде. Позволяет пользователю видеть сформированные SPARQL запросы перед их применением.

**Файлы:**
- `4_resSPARQL_ui.js` -- UI: текстовое поле результата, кнопки копирования и применения

### 5_publisher/ -- Модуль Publisher (визуализация)

Главный модуль визуализации RDF данных в виде графа. Генерирует DOT-код из RDF квадов с учетом режима визуализации (base, notation, aggregation, vad, vad-trig), отображает SVG через Viz.js, поддерживает масштабирование и выбор узлов.

**Файлы:**
- `5_publisher_ui.js` -- UI: область отображения SVG, масштабирование, панели свойств узлов
- `5_publisher_logic.js` -- Логика: `visualize()`, `rdfToDotVAD()`, генерация DOT-кода
- `5_publisher_sparql.js` -- SPARQL запросы для визуализации
- `5_publisher_trig.js` -- Работа с деревом TriG: отображение иерархии, выбор TriG для визуализации

### 6_legend/ -- Модуль легенды стилей

Отображает легенду используемых стилей узлов и ребер графа. По умолчанию окно свернуто.

**Файлы:**
- `6_legend_ui.js` -- UI: генерация таблицы стилей с примерами

### 7_info/ -- Модуль Prefixes

Отображает список префиксов RDF пространств имен, извлеченных из загруженных данных. По умолчанию окно свернуто.

**Файлы:**
- `7_info_ui.js` -- UI: таблица префиксов с пространствами имен

### 8_infoSPARQL/ -- Модуль SPARQL запросов

Предоставляет интерфейс для ввода и выполнения произвольных SPARQL запросов к загруженным RDF данным. Использует собственный SPARQL движок `funSPARQLvalues`.

**Файлы:**
- `8_infoSPARQL_ui.js` -- UI: текстовое поле SPARQL, кнопка выполнения, область результатов
- `8_infoSPARQL_sparql.js` -- Предустановленные SPARQL запросы и утилиты

### 9_vadlib/ -- Общая библиотека утилит

Общая библиотека, используемая всеми модулями. Содержит конфигурацию (фильтры, режимы, типы VAD), глобальные переменные, вспомогательные функции и SPARQL движок.

**Файлы:**
- `vadlib.js` (619 строк) -- Конфигурация: `Mode`, `Filter`, `VAD_ALLOWED_TYPES`, `PROCESS_SUBTYPES`; вспомогательные функции: `getPrefixedName()`, `getLocalName()`, `escapeDotString()`, `generateNodeId()` и другие
- `vadlib_sparql.js` -- SPARQL движок: `funSPARQLvalues()`, `funSPARQLvaluesComunica()`, `parseTriplePatterns()`, `executeSimpleSelect()`, `resolveValue()`, `matchQuadToPattern()`

### 10_virtualTriG/ -- Модуль Virtual TriG (issue #317)

Модуль обработки вычислимых данных (Virtual TriG). Virtual TriG (`vad:vt_*`) — это автоматически вычисляемые данные, которые хранятся в графах типа `vad:Virtual` и связаны с родительским `vad:VADProcessDia` через `vad:hasParentObj`.

**Файлы:**
- `10_virtualTriG_logic.js` -- Основная логика: `recalculateAllVirtualTriGs()`, `createVirtualTriG()`, `removeVirtualTriG()`, `isVirtualGraphSPARQL()`, `formatVirtualTriGFromStore()`
- `10_virtualTriG_sparql.js` -- Коллекция SPARQL запросов `VIRTUAL_TRIG_SPARQL`: IS_VIRTUAL_GRAPH, GET_ALL_VIRTUAL_TRIGS, GET_PROCESS_SUBTYPES, DELETE_ALL_VIRTUAL_TRIGS и др.
- `10_virtualTriG_ui.js` -- UI функции: `showVirtualTriGWindow()`, `closeVirtualTriGModal()`, `recalculateVirtualTriGFromUI()`, `updateVirtualTriGSection()`
- `10_virtualTriG.css` -- Стили для UI компонентов (секция в панели свойств, кнопки модального окна)

**Документация:** [doc/10_virtualTriG.md](10_virtualTriG.md)

### 11_reasoning/ -- Модуль Semantic Reasoning (issue #317)

Модуль семантического вывода (reasoning) для вычисления Virtual TriG. Реализует механизм inference на базе comunica-feature-reasoning с fallback на JavaScript-реализацию.

**Файлы:**
- `11_reasoning_logic.js` -- Логика reasoning: `initializeReasoner()`, `performInference()`, `materializeVirtualData()`, `validateInferredData()`, правила вывода в формате N3
- `11_reasoning_sparql.js` -- Коллекция SPARQL запросов `REASONING_SPARQL`: CONSTRUCT_PROCESS_SUBTYPES, GET_PROCESSES_FOR_REASONING, INSERT_INFERRED_SUBTYPES и др.
- `11_reasoning.css` -- Стили (резерв для будущих UI компонентов)

**Документация:** [doc/11_reasoning.md](11_reasoning.md)

## 3. Описание подпапок

### 2_triplestore_test/ -- Подмодуль тестирования

Реализует функциональность кнопки "Тест" в окне triplestore. Выполняет автоматическую валидацию загруженных RDF данных по правилам VAD-онтологии: проверка наличия обязательных предикатов (`isSubprocessTrig`, `hasParentObj`), согласованности иерархии, корректности типов.

**Связь с родительским модулем:** Использует данные из `2_triplestore` (текущие квады, префиксы). Результаты тестирования выводятся в UI модуля triplestore.

### 3_sd_create_new_concept/ -- Подмодуль создания концептов

Реализует функциональность кнопки "New Concept" в окне Smart Design. Позволяет создавать:
- Концепт процесса (`vad:TypeProcess`) в `vad:ptree`
- Концепт исполнителя (`vad:TypeExecutor`) в `vad:rtree`

Алгоритм: запрос к `vad:techtree` для получения предикатов типа -> отображение формы -> генерация SPARQL INSERT.

**Файлы:**
- `3_sd_create_new_concept_sparql.js` -- SPARQL запросы: `NEW_CONCEPT_SPARQL` (GET_PREDICATES_FROM_TECH_OBJECT, GET_AUTO_GENERATED_PREDICATES, GET_OBJECTS_BY_TYPE_IN_GRAPH, CHECK_ID_EXISTS, GENERATE_INSERT_QUERY)
- `3_sd_create_new_concept_logic.js` -- Логика создания концептов на основе технологических объектов

### 3_sd_del_concept_individ/ -- Подмодуль удаления

Реализует функциональность кнопки "Del Concept\Individ". Поддерживает удаление:
- Концептов процессов и исполнителей (с проверкой зависимостей)
- Индивидов процессов и исполнителей
- Схем процессов (TriG типа `vad:VADProcessDia`)

Перед удалением выполняются проверочные SPARQL запросы для обнаружения зависимых объектов.

**Файлы:**
- `3_sd_del_concept_individ_sparql.js` -- SPARQL запросы: `DEL_CONCEPT_SPARQL` (GET_PROCESS_CONCEPTS, GET_EXECUTOR_CONCEPTS, CHECK_PROCESS_INDIVIDUALS, CHECK_PROCESS_SCHEMA, CHECK_CHILDREN_PROCESSES, CHECK_EXECUTOR_USAGE, GET_ALL_TRIGS, GENERATE_DELETE_*_QUERY и др.)
- `3_sd_del_concept_individ_logic.js` -- Логика удаления с проверкой зависимостей

### 3_sd_create_new_trig/ -- Подмодуль создания TriG

Реализует функциональность кнопки "New TriG (VADProcessDia)". Создает новые TriG графы типа `vad:VADProcessDia` с привязкой к концепту процесса через `vad:hasTrig`.

## 4. Соглашения по именованию файлов

Каждая папка использует единую систему именования файлов с префиксом, совпадающим с именем папки:

| Суффикс файла | Назначение | Пример |
|---|---|---|
| `_ui.js` | UI модуль: рендеринг интерфейса, обработка событий, взаимодействие с DOM | `3_sd_ui.js` |
| `_logic.js` | Модуль бизнес-логики: алгоритмы, вычисления, обработка данных | `2_triplestore_logic.js` |
| `_sparql.js` | SPARQL запросы: коллекция запросов в соответствии с концепцией SPARQL-driven Programming | `5_publisher_sparql.js` |
| `.css` | CSS стили: модульные стили для конкретного компонента | `vadlib.css` |
| `.js` (без суффикса) | Основной файл библиотеки (только для `9_vadlib`) | `vadlib.js` |

### Правила именования

1. **Префикс папки** -- все файлы внутри папки начинаются с номера и имени папки: `N_имяпапки_`
2. **Суффикс типа** -- после имени папки указывается тип содержимого: `_ui`, `_logic`, `_sparql`
3. **Подпапки** -- файлы в подпапках используют полное имя подпапки как префикс: `3_sd_create_new_concept_logic.js`
4. **SPARQL запросы** -- типовые запросы размещаются в `vadlib_sparql.js`, специфичные для модуля -- в `N_имя_sparql.js`

## 5. Рекомендации по расширению номенклатуры

### Добавление нового модуля

1. Создайте папку с следующим номером: `10_имя_модуля/`
2. Внутри создайте файлы по шаблону:
   - `10_имя_модуля_ui.js` -- UI компонент
   - `10_имя_модуля_logic.js` -- бизнес-логика (при необходимости)
   - `10_имя_модуля_sparql.js` -- SPARQL запросы (при необходимости)
   - `10_имя_модуля.css` -- стили (при необходимости)
3. Добавьте запись в `config.json` для управления состоянием окна
4. Подключите файлы модуля в `index.html`
5. Создайте документацию в `doc/10_имя_модуля.md`

### Добавление подпапки (кнопки) в существующий модуль

1. Создайте подпапку с полным именем: `3_sd_имя_действия/`
2. Внутри создайте файлы:
   - `3_sd_имя_действия_logic.js` -- основная логика
   - `3_sd_имя_действия_sparql.js` -- SPARQL запросы (при необходимости)
   - `3_sd_имя_действия.css` -- стили (при необходимости)
3. Подключите файлы в `index.html`
4. Обновите документацию модуля в `doc/3_sd.md`

### Добавление нового файла в существующий модуль

1. Используйте префикс папки: `5_publisher_новый_тип.js`
2. Обновите документацию в соответствующем `doc/` файле

### Перенумерация модулей

Не рекомендуется менять номера существующих модулей, так как это потребует обновления всех ссылок. При необходимости вставить модуль между существующими используйте дробные номера или суффиксы (например, `5a_имя/`).

### Общие рекомендации

- **Минимизация зависимостей:** каждый модуль должен зависеть только от `9_vadlib` и, при необходимости, от данных в глобальных переменных
- **SPARQL-driven Programming:** все SPARQL запросы размещайте в `_sparql.js` файлах, а не inline в коде логики
- **Типовые запросы:** запросы, используемые несколькими модулями, выносите в `vadlib_sparql.js`
- **Документация:** при любых изменениях обновляйте файлы в папке `doc/` и указывайте ссылку на issue в начале изменяемых файлов
