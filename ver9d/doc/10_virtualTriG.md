# Модуль 10_virtualTriG - Обработка Virtual TriG

<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/317 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/322 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/324 -->
<!-- Дата создания: 2026-02-08 -->

## Содержание

1. [Введение](#1-введение)
2. [Реализация: Reasoning vs JavaScript](#2-реализация-reasoning-vs-javascript)
3. [Структура модуля](#3-структура-модуля)
4. [Алгоритм формирования Virtual TriG](#4-алгоритм-формирования-virtual-trig)
5. [Типы изменений, влияющие на Virtual TriG](#5-типы-изменений-влияющие-на-virtual-trig)
6. [API модуля](#6-api-модуля)
7. [Интеграция с UI](#7-интеграция-с-ui)
8. [Примеры использования](#8-примеры-использования)

---

## 1. Введение

Модуль **10_virtualTriG** отвечает за обработку вычислимых данных (Virtual TriG) в проекте RDF Grapher ver9d.

### 1.1 Назначение

Virtual TriG (`vad:vt_*`) — это автоматически вычисляемые данные, которые:
- Хранятся в графах типа `vad:Virtual`
- Связаны с родительским `vad:VADProcessDia` через `vad:hasParentObj`
- Содержат вычисленные свойства процессов (`vad:processSubtype`)

### 1.2 Ключевые принципы

Согласно [base_concept_rules.md](../design/base_concept_rules.md):

1. **Нет дублирующих объектов хранения** — Virtual данные хранятся только в TriG типа `vad:Virtual`, глобальные массивы `virtualRDFdata` и `currentQuads` удалены (issue #324)
2. **SPARQL-driven подход** — все операции через SPARQL-запросы
3. **Единственное хранилище** — только `currentStore` (N3.Store)

### 1.3 Формат Virtual TriG

```turtle
# Виртуальный TriG для схемы процесса t_p1
vad:vt_p1 {
    # Метаданные виртуального контейнера
    vad:vt_p1 rdf:type vad:Virtual ;
        vad:hasParentObj vad:t_p1 .  # Родительский физический TriG

    # Вычисленные свойства процессов
    vad:p1_1 vad:processSubtype vad:DetailedChild .
    vad:p1_2 vad:processSubtype vad:notDetailedChild .
    vad:p1_3 vad:processSubtype vad:DetailedExternal .
}
```

---

## 2. Реализация: Reasoning vs JavaScript

### 2.1 Текущая реализация (SPARQL-driven Semantic Reasoning)

> **Issue #322:** Реализован полный переход на **semantic reasoning** через SPARQL CONSTRUCT.

#### Ключевые факты реализации:

1. **Основная функция вычисления:** `performSemanticReasoning()` в файле `11_reasoning_logic.js`
   - Использует SPARQL SELECT для получения метаданных процессов из `vad:ptree`
   - Вычисляет `processSubtype` согласно правилам вывода (N3 Rules)
   - Работает **только** с `currentStore` (N3.Store), без `currentQuads`

2. **Модуль 11_reasoning:**
   - Функция `performInference()` вызывает `performSemanticReasoning()` как основной метод
   - Флаг `forceSemanticReasoning = true` обеспечивает использование SPARQL reasoning
   - JavaScript fallback сохранён для случаев ошибок

3. **Модуль 10_virtualTriG:**
   - Использует `materializeVirtualData()` для создания Virtual TriG
   - Все операции выполняются через `currentStore.addQuad()` / `currentStore.removeQuad()`
   - `currentQuads` больше не используется (миграция к единому хранилищу)

### 2.2 Преимущества Semantic Reasoning

| Критерий | JavaScript (старый) | SPARQL Reasoning (новый) |
|----------|---------------------|--------------------------|
| **Подход** | Императивный | Декларативный |
| **Хранилище** | currentQuads + currentStore | Только currentStore |
| **Расширяемость** | Сложная (код) | Простая (правила) |
| **Консистентность** | Ручная синхронизация | Автоматическая |
| **SPARQL-driven** | Частично | Полностью |

### 2.3 Архитектура после миграции (Issue #322)

Согласно [base_concept_rules.md](../design/base_concept_rules.md), реализована **целевая архитектура**:

1. **SPARQL-driven programming**
   - Вычисление `processSubtype` через SPARQL SELECT и reasoning rules
   - Материализация выведенных данных напрямую в `currentStore`

2. **Единое хранилище (Quadstore Unification)**
   - `currentStore` (N3.Store) — единственный источник данных
   - `currentQuads` устарел и не используется для основных операций
   - Все операции через `store.getQuads()` / `store.addQuad()` / `store.removeQuad()`

3. **Резервный вариант (fallback):**
   - JavaScript-реализация сохраняется как fallback при ошибках
   - См. раздел [Резервный вариант обработки данных](11_reasoning.md#8-резервный-вариант-обработки-данных-fallback)

### 2.4 Примеры текущей vs целевой реализации

#### Текущая реализация (JavaScript):

```javascript
// 2_triplestore_logic.js: calculateProcessSubtypes()
function computeProcessSubtype(processUri, trigUri, metadata, trigDefinesProcess) {
    const hasParentObj = metadata.hasParentObj;
    const hasTrig = metadata.hasTrig;

    // Императивная логика через if-else
    if (hasParentObj && hasParentObj.endsWith('#pNotDefined')) {
        return 'NotDefinedType';
    }

    const isChild = trigDefinesProcess && hasParentObj === trigDefinesProcess;

    if (hasTrig) {
        return isChild ? 'DetailedChild' : 'DetailedExternal';
    } else {
        return isChild ? 'notDetailedChild' : 'notDetailedExternal';
    }
}
```

#### Целевая реализация (N3 Reasoning):

```notation3
# 11_reasoning_logic.js: INFERENCE_RULES_N3
# Правило 4: DetailedChild
{
    ?process vad:isDetailed true .
    ?process vad:isSubprocessTrig ?trig .
    ?trig vad:definesProcess ?parent .
    ?process vad:hasParentObj ?parent .
} => {
    ?process vad:processSubtype vad:DetailedChild .
} .
```

### 2.5 Резюме (Issue #322)

| Аспект | Статус |
|--------|--------|
| Semantic Reasoning через SPARQL | ✅ Реализовано (performSemanticReasoning) |
| JavaScript fallback | ✅ Сохранён как резервный метод |
| N3 правила определены | ✅ Да (в 11_reasoning_logic.js) |
| SPARQL запросы для данных | ✅ Да (чтение и вычисление) |
| Полный SPARQL-driven подход | ✅ Реализовано |
| Единое хранилище (currentStore) | ✅ Реализовано |
| Удалены глобальные массивы | ✅ currentQuads и virtualRDFdata удалены (issue #324) |

---

## 3. Структура модуля

```
ver9d/
├── 10_virtualTriG/
│   ├── 10_virtualTriG_logic.js    - Логика вычисления и управления Virtual TriG
│   ├── 10_virtualTriG_sparql.js   - SPARQL запросы для работы с Virtual TriG
│   ├── 10_virtualTriG_ui.js       - UI функции отображения
│   └── 10_virtualTriG.css         - Стили модуля
├── doc/
│   └── 10_virtualTriG.md          - Документация (этот файл)
```

### 2.1 Файлы модуля

| Файл | Назначение |
|------|------------|
| `10_virtualTriG_logic.js` | Основная логика: создание, удаление, пересчёт Virtual TriG |
| `10_virtualTriG_sparql.js` | Коллекция SPARQL запросов (VIRTUAL_TRIG_SPARQL) |
| `10_virtualTriG_ui.js` | UI: модальное окно Virtual TriG, секция в панели свойств |
| `10_virtualTriG.css` | CSS стили для UI компонентов |

---

## 4. Алгоритм формирования Virtual TriG

### 4.1 Общий алгоритм

```mermaid
flowchart TD
    A[Начало пересчёта] --> B[Удалить все существующие Virtual TriG]
    B --> C[Получить метаданные процессов из ptree]
    C --> D[Получить все VADProcessDia графы]
    D --> E{Для каждого VADProcessDia}
    E --> F[Найти индивиды процессов через isSubprocessTrig]
    F --> G{Для каждого индивида}
    G --> H[Вычислить processSubtype]
    H --> G
    G --> I[Создать Virtual TriG с квадами]
    I --> E
    E --> J[Конец]
```

### 4.2 Алгоритм вычисления processSubtype

```mermaid
flowchart TD
    A[Начало: для каждого процесса] --> B{hasParentObj = pNotDefined?}
    B -->|Да| C[processSubtype = NotDefinedType]
    B -->|Нет| D{Концепт имеет hasTrig в ptree?}
    D -->|Да| E[Detailed процесс]
    D -->|Нет| F[notDetailed процесс]
    E --> G{Индивид в схеме родительского процесса?}
    F --> H{Индивид в схеме родительского процесса?}
    G -->|Да| I[DetailedChild]
    G -->|Нет| J[DetailedExternal]
    H -->|Да| K[notDetailedChild]
    H -->|Нет| L[notDetailedExternal]
    C --> M[Конец]
    I --> M
    J --> M
    K --> M
    L --> M
```

### 4.3 Подтипы процессов

| Подтип | Условие | Визуализация |
|--------|---------|--------------|
| `DetailedChild` | hasTrig + в схеме родителя | Голубая заливка (#90CAF9) |
| `DetailedExternal` | hasTrig + во внешней схеме | Синяя заливка (#64B5F6) |
| `notDetailedChild` | без hasTrig + в схеме родителя | Зелёная заливка (#A5D6A7) |
| `notDetailedExternal` | без hasTrig + во внешней схеме | Светло-зелёная заливка (#C8E6C9) |
| `NotDefinedType` | hasParentObj = pNotDefined | Серая заливка (#BDBDBD), пунктир |

### 4.4 Определение "в схеме родительского процесса"

Процесс является **Child** (в схеме родителя), если:
- Его `vad:hasParentObj` (из ptree) совпадает с `vad:definesProcess` текущего TriG

Иначе процесс является **External** (во внешней схеме).

### 4.5 Вычисление rdfs:label для ExecutorGroup

#### 4.5.1 Общее описание

`rdfs:label` для объектов `vad:ExecutorGroup` является вычисляемым параметром, который формируется в Virtual TriG. Алгоритм вычисления:

1. **Сбор исполнителей**: Для каждого `ExecutorGroup` собираются все исполнители через предикат `vad:includes`
2. **Получение имен исполнителей**: Для каждого исполнителя получается его `rdfs:label` (если нет, используется префиксное имя)
3. **Формирование строки**: Имена исполнителей объединяются через запятую
4. **Сохранение в Virtual TriG**: Вычисленная метка сохраняется как `rdfs:label` в соответствующем Virtual TriG

#### 4.5.2 Пример вычисления

```turtle
# Исходные данные в VADProcessDia (например, vad:t_p1)
vad:t_p1 {
    vad:ExecutorGroup_p1.1 rdf:type vad:ExecutorGroup ;
        dcterms:description "Группа исполнителей процесса p1.1" ;
        vad:includes vad:Executor1 ;
        vad:includes vad:Executor2 ;
        vad:includes vad:Executor3 .
    
    vad:Executor1 rdf:type vad:TypeExecutor ;
        rdfs:label "Исполнитель 1" .
    
    vad:Executor2 rdf:type vad:TypeExecutor ;
        rdfs:label "Исполнитель 2" .
    
    vad:Executor3 rdf:type vad:TypeExecutor .
        # У исполнителя 3 нет rdfs:label
}
```

```turtle
# Результат в Virtual TriG (vad:vt_eg_t_p1)
vad:vt_eg_t_p1 {
    rdf:type vad:Virtual ;
    vad:hasParentObj vad:t_p1 .
    
    # Вычисленная метка ExecutorGroup
    vad:ExecutorGroup_p1.1 rdfs:label "Исполнитель 1, Исполнитель 2, vad:Executor3" .
}
```

#### 4.5.3 Правила вывода (Reasoner)

Для вычисления `rdfs:label` используются следующие правила вывода в формате N3:

```notation3
# Правило 8: ExecutorGroup rdfs:label computation
# Вычисляет rdfs:label для ExecutorGroup как перечисление всех исполнителей
{
    ?executorGroup rdf:type vad:ExecutorGroup .
    ?executorGroup vad:includes ?executor .
    ?executor rdfs:label ?executorLabel .
} => {
    ?executorGroup rdfs:label ?executorLabel .
} .

# Правило 9: ExecutorGroup aggregated label
# Агрегирует множественные метки исполнителей в одну строку через запятую
{
    ?executorGroup rdf:type vad:ExecutorGroup .
    ?executorGroup vad:includes ?executor1 .
    ?executorGroup vad:includes ?executor2 .
    ?executor1 rdfs:label ?label1 .
    ?executor2 rdfs:label ?label2 .
    FILTER(?executor1 != ?executor2)
} => {
    ?executorGroup rdfs:label ?concatenatedLabel .
    BIND(CONCAT(?label1, ", ", ?label2) AS ?concatenatedLabel)
} .
```

#### 4.5.4 Изменения в создании ExecutorGroup

При создании индивида процесса автоматически создаётся `ExecutorGroup` со следующими свойствами:

```turtle
# Раньше (до ver9d_3ExecutorGroup1):
vad:ExecutorGroup_p1.1 rdf:type vad:ExecutorGroup ;
    rdfs:label "Группа исполнителей процесса p1.1" .

# Теперь (после ver9d_3ExecutorGroup1):
vad:ExecutorGroup_p1.1 rdf:type vad:ExecutorGroup ;
    dcterms:description "Группа исполнителей процесса p1.1" .
# rdfs:label вычисляется в Virtual TriG
```

#### 4.5.5 Интеграция с визуализацией

В модуле `5_publisher_logic.js` функция `rdfToDotVAD()` была обновлена:

1. **Получение вычисленной метки**: Сначала ищется `rdfs:label` в Virtual TriG
2. **Fallback**: Если метка не найдена, используется старый способ (построение списка из имен исполнителей)
3. **Отображение**: Вычисленная метка отображается на схеме процесса как подпись к узлу ExecutorGroup

---

## 5. Типы изменений, влияющие на Virtual TriG

### 5.1 Таблица триггеров пересчёта

| Тип изменения | Затронутый граф | Влияние на Virtual TriG |
|---------------|-----------------|------------------------|
| Добавление индивида через `vad:isSubprocessTrig` | VADProcessDia | Пересчёт vad:processSubtype для нового индивида |
| Изменение `vad:hasTrig` в ptree | ptree | Пересчёт Detailed/notDetailed для затронутого процесса |
| Изменение `vad:hasParentObj` в ptree | ptree | Пересчёт Child/External для затронутого процесса |
| Изменение `vad:definesProcess` в VADProcessDia | VADProcessDia | Пересчёт Child/External для всех индивидов в этом TriG |
| Удаление VADProcessDia | VADProcessDia | Каскадное удаление соответствующего vt_* |
| Добавление нового VADProcessDia | VADProcessDia | Создание нового vt_* |
| Удаление индивида через `vad:isSubprocessTrig` | VADProcessDia | Удаление vad:processSubtype для этого индивида |

### 5.2 Предикаты-триггеры

```javascript
const TRIGGER_PREDICATES = [
    'http://example.org/vad#isSubprocessTrig',
    'http://example.org/vad#hasTrig',
    'http://example.org/vad#hasParentObj',
    'http://example.org/vad#hasParentProcess',
    'http://example.org/vad#definesProcess'
];
```

### 5.3 Стратегия оптимизации (будущее)

На текущем этапе при каждом изменении выполняется полный пересчёт всех Virtual TriG.

Для оптимизации в будущем можно реализовать:
- Инкрементальный пересчёт только затронутых Virtual TriG
- Кэширование метаданных процессов
- Отложенный пересчёт (debounce) при множественных изменениях

---

## 6. API модуля

### 6.1 Основные функции (10_virtualTriG_logic.js)

#### recalculateAllVirtualTriGs(prefixes)

Пересчитывает все Virtual TriG на основе текущих данных в store.

```javascript
/**
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Promise<Object>} - Статистика пересчёта
 *   - removedQuads: количество удалённых квадов
 *   - createdQuads: количество созданных квадов
 *   - virtualTrigsCreated: количество созданных Virtual TriG
 *   - errors: массив ошибок
 */
const stats = await recalculateAllVirtualTriGs(currentPrefixes);
```

#### createVirtualTriG(parentTrigUri, processSubtypes, prefixes)

Создаёт Virtual TriG для указанного VADProcessDia.

```javascript
/**
 * @param {string} parentTrigUri - URI родительского VADProcessDia
 * @param {Object} processSubtypes - { processUri: subtypeName }
 * @param {Object} prefixes - Словарь префиксов
 * @returns {Array} - Массив созданных квадов
 */
const quads = createVirtualTriG(
    'http://example.org/vad#t_p1',
    {
        'http://example.org/vad#p1_1': 'DetailedChild',
        'http://example.org/vad#p1_2': 'notDetailedChild'
    },
    currentPrefixes
);
```

#### removeVirtualTriG(virtualTrigUri)

Удаляет Virtual TriG из store.

```javascript
/**
 * @param {string} virtualTrigUri - URI виртуального TriG
 * @returns {number} - Количество удалённых квадов
 */
const removed = removeVirtualTriG('http://example.org/vad#vt_p1');
```

#### isVirtualGraphSPARQL(graphUri)

Проверяет, является ли граф виртуальным через SPARQL ASK.

```javascript
/**
 * @param {string} graphUri - URI графа
 * @returns {Promise<boolean>} - true если граф типа vad:Virtual
 */
const isVirtual = await isVirtualGraphSPARQL('http://example.org/vad#vt_p1');
```

#### formatVirtualTriGFromStore(prefixes)

Форматирует Virtual TriG данные из store в строку TriG.

```javascript
/**
 * @param {Object} prefixes - Словарь префиксов
 * @returns {string} - Строка в формате TriG
 */
const trigString = formatVirtualTriGFromStore(currentPrefixes);
```

### 6.2 SPARQL запросы (10_virtualTriG_sparql.js)

| Запрос | Назначение |
|--------|------------|
| `IS_VIRTUAL_GRAPH(uri)` | ASK: является ли граф виртуальным |
| `GET_ALL_VIRTUAL_TRIGS()` | SELECT: все виртуальные графы с родителями |
| `GET_PROCESS_SUBTYPES(uri)` | SELECT: все processSubtype в Virtual TriG |
| `GET_PROCESS_METADATA_FROM_PTREE()` | SELECT: метаданные процессов из ptree |
| `GET_VAD_PROCESS_DIA_GRAPHS()` | SELECT: все VADProcessDia графы |
| `GET_PROCESS_INDIVIDUALS_IN_TRIG(uri)` | SELECT: индивиды в TriG |
| `DELETE_ALL_VIRTUAL_TRIGS()` | DELETE: удалить все Virtual TriG |
| `INSERT_VIRTUAL_TRIG(uri, parent, subtypes)` | INSERT: создать Virtual TriG |
| `CHECK_VIRTUAL_TRIG_CONSISTENCY()` | SELECT: проверка консистентности |

### 6.3 UI функции (10_virtualTriG_ui.js)

| Функция | Назначение |
|---------|------------|
| `showVirtualTriGWindow()` | Показать модальное окно Virtual TriG |
| `closeVirtualTriGModal()` | Закрыть модальное окно |
| `copyVirtualTriGToClipboard()` | Копировать содержимое в буфер |
| `recalculateVirtualTriGFromUI()` | Пересчитать и обновить UI |
| `showVirtualTriGAfterApply()` | Показать после применения SPARQL |
| `updateVirtualTriGSection(nodeUri)` | Обновить секцию в панели свойств |

---

## 7. Интеграция с UI

### 7.1 Кнопка "Virtual TriG"

В окне "Result in SPARQL" унифицированы кнопки:
- ~~"Показать Virtual TriG"~~ → **"Virtual TriG"**
- ~~"virtualRDFdata"~~ → **"Virtual TriG"**

```html
<button class="show-virtual-trig-btn" onclick="showVirtualTriGWindow()">
    Virtual TriG
</button>
```

### 7.2 Секция в панели свойств

При выборе узла-процесса в панели "Карточка объекта" отображается секция Virtual TriG:

```
┌─────────────────────────────────────┐
│ Virtual TriG                        │
├─────────────────────────────────────┤
│ vad:processSubtype: DetailedChild   │
└─────────────────────────────────────┘
```

### 7.3 Модальное окно

Модальное окно "Virtual TriG (vad:Virtual)" содержит:
- Textarea с TriG-представлением всех Virtual данных
- Кнопка "Копировать" — копирует в буфер обмена
- Кнопка "Пересчитать" — выполняет пересчёт всех Virtual TriG
- Кнопка "Закрыть" — закрывает окно

---

## 8. Примеры использования

### 8.1 Пересчёт Virtual TriG после загрузки данных

```javascript
// После парсинга RDF данных и добавления в store
await recalculateAllVirtualTriGs(currentPrefixes);
```

### 8.2 Получение подтипа процесса через SPARQL

```javascript
const query = VIRTUAL_TRIG_SPARQL.GET_PROCESS_SUBTYPE('http://example.org/vad#p1_1');
const results = await funSPARQLvaluesComunica(query, currentPrefixes);

if (results.length > 0) {
    console.log('Subtype:', results[0].subtype);
}
```

### 8.3 Проверка консистентности Virtual TriG

```javascript
const query = VIRTUAL_TRIG_SPARQL.CHECK_VIRTUAL_TRIG_CONSISTENCY();
const violations = await funSPARQLvaluesComunica(query, currentPrefixes);

if (violations.length > 0) {
    console.error('Inconsistent Virtual TriG:', violations);
}
```

### 8.4 Каскадное удаление при удалении VADProcessDia

```javascript
// При удалении vad:t_p1 автоматически удаляется vad:vt_p1
function onVADProcessDiaDeleted(trigUri) {
    const virtualTrigUri = trigUri.replace('#t_', '#vt_');
    removeVirtualTriG(virtualTrigUri);
}
```

---

## Источники

- [issue #317: ver9d_1rea1](https://github.com/bpmbpm/rdf-grapher/issues/317)
- [issue #322: ver9d_1rea1b](https://github.com/bpmbpm/rdf-grapher/issues/322)
- [base_concept_rules.md](../design/base_concept_rules.md)
- [reasoner_concept_v1.md](../design/reasoner/reasoner_concept_v1.md)
- [store_concept_v3.md](../design/store/store_concept_v3.md)
- [11_reasoning.md](./11_reasoning.md)

---

*Документ создан: 2026-02-08*
*Обновлён: 2026-02-08 (issue #324)*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.2*
*Ссылки на issues: #317, #322, #324*
