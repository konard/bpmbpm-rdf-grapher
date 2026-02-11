<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/324 -->
<!-- Основа: https://github.com/bpmbpm/rdf-grapher/issues/322 -->
<!-- Дата: 2026-02-08 -->

# Взаимодействие с Quadstore v3 (Единое хранилище)

Данный документ является обновлением [quadstore_io_v2.md](./quadstore_io_v2.md) и описывает:
- Завершение миграции к единому хранилищу `currentStore` (N3.Store)
- Удаление глобальных массивов `currentQuads` и `virtualRDFdata`
- Обновление UI (VirtualTriG вместо virtualRDFdata)

## 1. Завершённая миграция (Issue #324)

### 1.1 Статус реализации

| Требование | Статус | Комментарий |
|------------|--------|-------------|
| Единое хранилище `currentStore` | ✅ Реализовано | Все операции через N3.Store |
| Удалён `currentQuads` | ✅ Удалён | Массив полностью удалён из кода |
| Удалён `virtualRDFdata` | ✅ Удалён | Объект полностью удалён из кода |
| SPARQL-driven операции | ✅ Реализовано | Чтение и вычисление через SPARQL |
| Semantic Reasoning | ✅ Реализовано | `performSemanticReasoning()` |
| UI обновлён | ✅ Реализовано | VirtualTriG вместо virtualRDFdata |

### 1.2 Удалённые глобальные переменные

В файле `9_vadlib/vadlib.js` удалены:

```javascript
// issue #324: удалены следующие глобальные переменные
// let currentQuads = [];      // Устаревший массив квадов
// let virtualRDFdata = {};    // Устаревший объект виртуальных данных
```

### 1.3 Обоснование удаления

#### currentQuads
- Дублировал данные из `currentStore`
- Требовал ручной синхронизации при каждом изменении
- Имел O(n) время поиска вместо O(1) - O(log n) у store
- Не поддерживал SPARQL запросы

#### virtualRDFdata
- Дублировал Virtual TriG данные из store
- Требовал ручного обновления при пересчёте
- Не соответствовал SPARQL-driven подходу
- Усложнял поддержку кода

---

## 2. Архитектура после миграции

### 2.1 Целевая архитектура (реализована)

```
┌───────────────────────────────────────────────────────────────────────┐
│                    РЕАЛИЗОВАННАЯ АРХИТЕКТУРА (v3)                      │
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
│  │    SPARQL     │    │   N3 Rules    │    │    store.getQuads()   │ │
│  │    SELECT     │    │  (Reasoning)  │    │   store.addQuad()     │ │
│  └───────────────┘    └───────────────┘    └───────────────────────┘ │
│                                                                       │
│  ✅ currentQuads       → Удалён полностью (issue #324)               │
│  ✅ virtualRDFdata     → Удалён, данные в store (vad:Virtual графы)  │
│  ⚠️ trigHierarchy      → Сохранён для UI дерева TriG                 │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 2.2 Сравнение с предыдущими версиями

| Аспект | v1 (до PR #321) | v2 (PR #322) | v3 (issue #324) |
|--------|-----------------|--------------|-----------------|
| `currentQuads` | ✅ Используется | ⚠️ Устаревший | ❌ Удалён |
| `virtualRDFdata` | ✅ Используется | ⚠️ Устаревший | ❌ Удалён |
| `currentStore` | ✅ Используется | ✅ Основной | ✅ Единственный |
| Дублирование данных | ⚠️ Да | ⚠️ Частично | ❌ Нет |
| SPARQL-driven | ❌ Частично | ✅ Расширено | ✅ Полностью |

---

## 3. Изменения в коде

### 3.1 Файл vadlib.js

```javascript
// ДО (v2):
let currentQuads = [];
let virtualRDFdata = {};
let currentStore = null;

// ПОСЛЕ (v3):
// issue #324: currentQuads удалён - все операции через currentStore (N3.Store)
// issue #324: virtualRDFdata удалён - виртуальные данные хранятся в TriG типа vad:Virtual (vt_*)
let currentStore = null;
```

### 3.2 Функция getFilteredQuads()

```javascript
// ДО (v2):
function getFilteredQuads(filterMode) {
    if (!currentQuads || currentQuads.length === 0) {
        return [];
    }
    // ... фильтрация через currentQuads
}

// ПОСЛЕ (v3):
function getFilteredQuads(filterMode) {
    // issue #324: Используем только currentStore
    if (!currentStore || currentStore.size === 0) {
        return [];
    }
    const allQuads = currentStore.getQuads(null, null, null, null);
    // ... фильтрация через allQuads
}
```

### 3.3 Визуализация (5_publisher_logic.js)

```javascript
// ДО (v2):
const quadsToVisualize = currentQuads;
rdfToDotVAD(quadsToVisualize, ...);

// ПОСЛЕ (v3):
// issue #324: Получаем квады напрямую из store
const quadsToVisualize = getFilteredQuads(TRIG_FILTER_MODES.OBJECT_TREE_PLUS_VAD);
rdfToDotVAD(quadsToVisualize, ...);
```

### 3.4 Virtual TriG данные

```javascript
// ДО (v2):
const virtualData = virtualRDFdata[trigUri][processUri];
displayVirtualTriG(virtualData);

// ПОСЛЕ (v3):
// issue #324: Читаем виртуальные данные из store
const virtualTrigUri = trigUri.replace('#t_', '#vt_');
const virtualQuads = currentStore.getQuads(null, null, null, virtualTrigUri);
displayVirtualTriG(virtualQuads);
```

---

## 4. Обновления UI

### 4.1 Переименование в интерфейсе

| Было | Стало | Файл |
|------|-------|------|
| "virtualRDFdata" | "VirtualTriG" | 5_publisher_ui.js |
| "virtualRDFdata" | "VirtualTriG" | 5_publisher_trig.js |
| "Virtual" (фильтр) | "Virtual TriG" | index.html |

### 4.2 Фильтр quadstore

```html
<!-- ДО (v2): -->
<option value="virtual">Virtual (виртуальный TriG вычисляемых параметров)</option>

<!-- ПОСЛЕ (v3): -->
<option value="virtual">Virtual TriG (виртуальный TriG вычисляемых параметров)</option>
```

### 4.3 Панель свойств

```javascript
// ДО (v2):
propertiesHtml += '<div class="separator-text">virtualRDFdata</div>';

// ПОСЛЕ (v3):
propertiesHtml += '<div class="separator-text">VirtualTriG</div>';
```

---

## 5. API изменения

### 5.1 Удалённые функции

| Функция | Причина удаления | Замена |
|---------|------------------|--------|
| `showVirtualRDFdataWindow()` | Устаревшее имя | `showVirtualTriGWindow()` |

### 5.2 Обновлённые функции

| Функция | Изменение |
|---------|-----------|
| `getFilteredQuads()` | Использует `currentStore.getQuads()` вместо `currentQuads` |
| `visualizeFromStoreDirectly()` | Использует `currentStore` напрямую |
| `updateSubtypesCacheFromVirtualData()` | Читает из store вместо `virtualRDFdata` |
| `displayObjectProperties()` | Использует `currentStore` для Virtual TriG |

### 5.3 Рекомендации по использованию

```javascript
// ✅ Правильный способ получения квадов (v3):
const quads = currentStore.getQuads(subject, predicate, object, graph);

// ✅ Правильный способ добавления квадов (v3):
currentStore.addQuad(quad);

// ✅ Правильный способ удаления квадов (v3):
currentStore.removeQuad(quad);

// ❌ Устаревший способ (не работает в v3):
// currentQuads.filter(...)
// virtualRDFdata[trigUri]
```

---

## 6. Миграция существующего кода

### 6.1 Замена currentQuads

| Было | Стало |
|------|-------|
| `currentQuads.length` | `currentStore.size` |
| `currentQuads.filter(...)` | `currentStore.getQuads(...).filter(...)` |
| `currentQuads.forEach(...)` | `currentStore.getQuads(...).forEach(...)` |
| `currentQuads.push(quad)` | `currentStore.addQuad(quad)` |
| `currentQuads = newQuads` | `currentStore = new N3.Store(); newQuads.forEach(q => currentStore.addQuad(q));` |

### 6.2 Замена virtualRDFdata

| Было | Стало |
|------|-------|
| `virtualRDFdata[trigUri]` | `currentStore.getQuads(null, null, null, virtualTrigUri)` |
| `virtualRDFdata = calculateProcessSubtypes()` | `await recalculateAllVirtualTriGs()` |
| `Object.keys(virtualRDFdata)` | Запрос всех `vad:Virtual` графов через SPARQL |

---

## 7. Обратная совместимость

### 7.1 Сохранённые элементы

- **trigHierarchy** — сохранён для построения UI дерева TriG
- **showVirtualRDFdataWindow()** — перенаправляет на `showVirtualTriGWindow()` с предупреждением

### 7.2 Удалённые элементы (без обратной совместимости)

Согласно issue #324, обратная совместимость не требуется:

- `currentQuads` — удалён полностью
- `virtualRDFdata` — удалён полностью

---

## Источники

- [issue #324: Удаление currentQuads и virtualRDFdata](https://github.com/bpmbpm/rdf-grapher/issues/324)
- [issue #322: ver9c_1rea1b](https://github.com/bpmbpm/rdf-grapher/issues/322)
- [quadstore_io_v2.md](./quadstore_io_v2.md) — предыдущая версия документа
- [quadstore_io.md](./quadstore_io.md) — первоначальная версия документа
- [10_virtualTriG.md](./10_virtualTriG.md)
- [base_concept_rules.md](../design/base_concept_rules.md)

---

*Документ создан: 2026-02-08*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 3.0*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/324*
