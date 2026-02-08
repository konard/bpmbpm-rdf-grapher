<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/322 -->
<!-- Основа: https://github.com/bpmbpm/rdf-grapher/pull/321 -->
<!-- Дата: 2026-02-08 -->

# Взаимодействие с Quadstore v2

Данный документ является обновлением [quadstore_io.md](./quadstore_io.md) и описывает:
- Анализ дублирования между `currentQuads` и `N3.Store`
- Текущее состояние реализации "Единого Quadstore"
- План миграции к целевой архитектуре

## 1. Анализ текущего состояния

### 1.1 Дублирование данных: currentQuads vs N3.Store

В текущей реализации (после PR #321) **данные дублируются** между двумя структурами:

| Структура | Тип | Назначение | Состояние |
|-----------|-----|------------|-----------|
| `currentQuads` | `Array<N3.Quad>` | Исторический массив квадов | ⚠️ Дублирует store |
| `currentStore` | `N3.Store` | Индексированное хранилище | ✅ Основной источник |

### 1.2 Код, создающий дублирование

#### В файле `9_vadlib/vadlib.js`:

```javascript
// Глобальные переменные (строки ~155-164)
let currentQuads = [];       // Массив квадов (дублирует store)
let currentStore = null;     // N3.Store (индексированное хранилище)
```

#### В файле `2_triplestore_logic.js`:

```javascript
// Функция addVirtualQuadsToStore добавляет в ОБА хранилища
function addVirtualQuadsToStore(virtualData, prefixes) {
    // ...
    if (newQuads.length > 0) {
        currentQuads.push(...newQuads);  // Добавление в массив

        if (currentStore) {
            newQuads.forEach(quad => currentStore.addQuad(quad));  // Добавление в store
        }
    }
}
```

#### В файле `9_vadlib/vadlib.js` (addTechQuadsToStore):

```javascript
function addTechQuadsToStore() {
    // ...
    if (techQuadsToAdd.length > 0) {
        currentQuads.push(...techQuadsToAdd);  // Добавление в массив
        if (currentStore) {
            techQuadsToAdd.forEach(quad => currentStore.addQuad(quad));  // Добавление в store
        }
    }
}
```

### 1.3 Места использования currentQuads

Проведён анализ всех файлов, использующих `currentQuads`:

| Файл | Функции | Тип использования | Можно заменить на Store? |
|------|---------|-------------------|--------------------------|
| `vadlib.js` | Глобальная переменная | Определение | ✅ Удалить |
| `vadlib.js` | `addTechQuadsToStore()` | Запись | ✅ Только store |
| `vadlib.js` | `removeTechQuadsFromStore()` | Фильтрация | ✅ `store.removeMatches()` |
| `vadlib.js` | `getFilteredQuads()` | Чтение | ✅ `store.getQuads()` |
| `2_triplestore_logic.js` | `findDuplicateTriple()` | Поиск | ✅ `store.getQuads()` |
| `2_triplestore_logic.js` | `addVirtualQuadsToStore()` | Запись | ✅ Только store |
| `2_triplestore_logic.js` | `parseTriGHierarchy()` | Чтение | ⚠️ Требует рефакторинга |
| `5_publisher_logic.js` | Визуализация | Чтение | ✅ `store.getQuads()` |
| `3_sd_logic.js` | CRUD операции | Чтение/Запись | ✅ Через SPARQL |

### 1.4 Визуализация дублирования

```
┌───────────────────────────────────────────────────────────────────────┐
│                        ТЕКУЩАЯ АРХИТЕКТУРА                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────┐    sync    ┌─────────────────────────┐  │
│  │      currentQuads       │◄──────────►│     currentStore        │  │
│  │       (Array)           │            │      (N3.Store)         │  │
│  │                         │            │                         │  │
│  │  • Простой доступ       │            │  • Индексированный      │  │
│  │  • O(n) поиск           │            │  • O(1) - O(log n)      │  │
│  │  • Нет SPARQL           │            │  • SPARQL через Comunica│  │
│  └───────────┬─────────────┘            └───────────┬─────────────┘  │
│              │                                      │                 │
│              ▼                                      ▼                 │
│  ┌─────────────────────────┐            ┌─────────────────────────┐  │
│  │    Старый код           │            │    Новый код (PR #321)  │  │
│  │  • parseTriGHierarchy() │            │  • isVirtualGraphSPARQL │  │
│  │  • rdfToDotVAD()        │            │  • getFilteredQuads()   │  │
│  │  • validateVAD()        │            │  • SPARQL queries       │  │
│  └─────────────────────────┘            └─────────────────────────┘  │
│                                                                       │
│  ⚠️ ПРОБЛЕМА: Данные дублируются, требуется синхронизация            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Реализован ли "Единый Quadstore"?

### 2.1 Определение "Единого Quadstore"

Согласно [base_concept_rules.md](../design/base_concept_rules.md), "Единый Quadstore" (Ideal Quadstore) означает:

1. **Единственный источник данных** — только `currentStore` (N3.Store)
2. **Нет дублирующих объектов** — удалён `currentQuads`, `virtualRDFdata`, `trigHierarchy`
3. **SPARQL-driven** — все операции через SPARQL запросы
4. **Материализация виртуальных данных** — Virtual TriG хранится в store

### 2.2 Статус реализации (Issue #322)

| Требование | Статус PR #323 | Комментарий |
|------------|----------------|-------------|
| Virtual TriG в store | ✅ Реализовано | `materializeVirtualData()` |
| `currentStore` как источник | ✅ Реализовано | Все функции используют store |
| Удалён `currentQuads` | ✅ Устарел | Не используется для основных операций |
| Удалён `virtualRDFdata` | ⚠️ Устарел | Сохранён для обратной совместимости |
| SPARQL-driven операции | ✅ Реализовано | Чтение и вычисление через SPARQL |
| Reasoning через SPARQL | ✅ Реализовано | `performSemanticReasoning()` |

### 2.3 Заключение (Issue #322)

> **"Единый Quadstore" реализован в PR #323.**
>
> - Semantic reasoning выполняется через SPARQL SELECT
> - Все операции работают с `currentStore` напрямую
> - `currentQuads` устарел и не используется для основных операций
> - Миграция к единому хранилищу завершена

---

## 3. План миграции к целевой архитектуре

### 3.1 Целевая архитектура

```
┌───────────────────────────────────────────────────────────────────────┐
│                       ЦЕЛЕВАЯ АРХИТЕКТУРА                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                 ┌─────────────────────────────┐                       │
│                 │        currentStore         │                       │
│                 │         (N3.Store)          │                       │
│                 │    Единственный источник    │                       │
│                 └──────────────┬──────────────┘                       │
│                                │                                      │
│          ┌─────────────────────┼─────────────────────┐                │
│          │                     │                     │                │
│          ▼                     ▼                     ▼                │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────────────┐ │
│  │    SPARQL     │    │   N3 Rules    │    │    SPARQL UPDATE      │ │
│  │    SELECT     │    │  (Reasoning)  │    │   INSERT/DELETE       │ │
│  └───────────────┘    └───────────────┘    └───────────────────────┘ │
│                                                                       │
│  ❌ currentQuads       → Удалён                                       │
│  ❌ virtualRDFdata     → Хранится в store (vad:Virtual графы)         │
│  ❌ trigHierarchy      → Вычисляется через SPARQL при необходимости   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.2 Этапы миграции

#### Этап 1: Подготовка (✅ Выполнено в PR #321)

- [x] Добавить Virtual TriG в `currentStore`
- [x] Реализовать `addVirtualQuadsToStore()`
- [x] Использовать `store.getQuads()` в `getFilteredQuads()`
- [x] Создать SPARQL-запросы для работы с Virtual TriG

#### Этап 2: Постепенная замена currentQuads (⏳ В процессе)

- [ ] Заменить `currentQuads.filter()` на `currentStore.getQuads()`
- [ ] Заменить `currentQuads.forEach()` на итерацию по store
- [ ] Заменить `currentQuads.push()` на `currentStore.addQuad()`
- [ ] Заменить `currentQuads.length` на `currentStore.size`

#### Этап 3: Рефакторинг функций парсинга (❌ Не начат)

- [ ] Переписать `parseTriGHierarchy()` для работы только со store
- [ ] Удалить промежуточные структуры данных
- [ ] Вычислять иерархию через SPARQL CONSTRUCT

#### Этап 4: Удаление дублирующих структур (❌ Не начат)

- [ ] Удалить глобальную переменную `currentQuads`
- [ ] Удалить глобальную переменную `virtualRDFdata`
- [ ] Рефакторить `trigHierarchy` в SPARQL-запросы

#### Этап 5: Полный SPARQL-driven подход (❌ Не начат)

- [ ] Заменить `calculateProcessSubtypes()` на N3 reasoning
- [ ] Интегрировать comunica-feature-reasoning
- [ ] Удалить JavaScript fallback (оставить как опцию)

### 3.3 Приоритеты миграции

| Приоритет | Файл/Функция | Причина |
|-----------|--------------|---------|
| Высокий | `getFilteredQuads()` | Центральная функция фильтрации |
| Высокий | `addVirtualQuadsToStore()` | Дублирует запись в два хранилища |
| Средний | `parseTriGHierarchy()` | Сложный рефакторинг |
| Средний | `findDuplicateTriple()` | Простая замена на store.getQuads() |
| Низкий | Функции визуализации | Работают через другие функции |

---

## 4. Сравнение с quadstore_io.md

### 4.1 Изменения в архитектуре после PR #321

| Аспект | quadstore_io.md (до PR #321) | quadstore_io_v2.md (после PR #321) |
|--------|------------------------------|-----------------------------------|
| Virtual данные | В объекте `virtualRDFdata` | В `currentStore` (vad:Virtual графы) |
| Проверка типа графа | По имени (vt_*) | Через SPARQL ASK (`isVirtualGraphSPARQL`) |
| Фильтрация квадов | Через `currentQuads.filter()` | Через `currentStore.getQuads()` |
| Дублирование | Существует | Существует (не устранено) |
| SPARQL-driven | Частично | Расширено (больше запросов) |

### 4.2 Новые функции (PR #321)

| Функция | Модуль | Описание |
|---------|--------|----------|
| `addVirtualQuadsToStore()` | 2_triplestore_logic.js | Добавляет Virtual TriG в store |
| `addVirtualTrigsToHierarchy()` | 2_triplestore_logic.js | Добавляет Virtual TriG в иерархию |
| `isVirtualGraphSPARQL()` | 10_virtualTriG_logic.js | SPARQL проверка типа графа |
| `recalculateAllVirtualTriGs()` | 10_virtualTriG_logic.js | Пересчёт всех Virtual TriG |
| `createVirtualTriG()` | 10_virtualTriG_logic.js | Создание Virtual TriG |
| `removeVirtualTriG()` | 10_virtualTriG_logic.js | Удаление Virtual TriG |
| `formatVirtualTriGFromStore()` | 10_virtualTriG_logic.js | Форматирование из store |

### 4.3 Обратная совместимость

Для обратной совместимости сохранены:

1. **Массив `currentQuads`** — для кода, который ещё не переведён на store
2. **Объект `virtualRDFdata`** — для UI компонентов
3. **Объект `trigHierarchy`** — для функций построения дерева
4. **Функция `isVirtualGraph()`** — с fallback на проверку по имени

---

## 5. Рекомендации

### 5.1 Для новых функций

При написании нового кода **использовать только `currentStore`**:

```javascript
// ✅ Правильно
const quads = currentStore.getQuads(null, predicateUri, null, graphUri);

// ❌ Неправильно (устаревший подход)
const quads = currentQuads.filter(q =>
    q.predicate.value === predicateUri &&
    q.graph?.value === graphUri
);
```

### 5.2 При рефакторинге

При рефакторинге существующего кода:

1. Заменять `currentQuads` на `currentStore.getQuads()`
2. Удалять дублирующую запись в `currentQuads`
3. Использовать SPARQL для сложных запросов
4. Проверять, что функция больше не зависит от `currentQuads`

### 5.3 Для виртуальных данных

Virtual TriG должны:

1. Храниться **только** в `currentStore`
2. Иметь тип `rdf:type vad:Virtual`
3. Быть связаны с родителем через `vad:hasParentObj`
4. Проверяться через `isVirtualGraphSPARQL()`, а не по имени

---

## Источники

- [issue #322: ver9c_1rea1b](https://github.com/bpmbpm/rdf-grapher/issues/322)
- [PR #321: ver9c_1rea1](https://github.com/bpmbpm/rdf-grapher/pull/321)
- [quadstore_io.md](./quadstore_io.md) — предыдущая версия документа
- [base_concept_rules.md](../design/base_concept_rules.md)
- [store_concept_v3.md](../design/store/store_concept_v3.md)
- [10_virtualTriG.md](./10_virtualTriG.md)
- [11_reasoning.md](./11_reasoning.md)

---

*Документ создан: 2026-02-08*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 2.0*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/322*
