# Модуль 12_method - Методы объектов диаграммы

<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/368 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/370 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/372 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/382 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/386 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/396 -->
<!-- Дата создания: 2026-02-12 -->

## Содержание

1. [Введение](#1-введение)
2. [Структура модуля](#2-структура-модуля)
3. [Архитектура](#3-архитектура)
4. [API модуля](#4-api-модуля)
5. [Методы объектов](#5-методы-объектов)
6. [Интеграция с UI](#6-интеграция-с-ui)
7. [Примеры использования](#7-примеры-использования)

---

## 1. Введение

Модуль **12_method** отвечает за выполнение методов объектов диаграммы в проекте RDF Grapher ver9d.

### 1.1 Назначение

Модуль предоставляет механизм для выполнения действий над объектами диаграммы:
- Удаление индивидов процессов (Delete Individ Process)
- Удаление индивидов исполнителей (Delete Individ Executor)
- Редактирование связей vad:hasNext (Add hasNext Dia)

### 1.2 Ключевые принципы

1. **SPARQL-Driven подход** — все операции выполняются через генерацию SPARQL запросов
2. **Интеграция с существующими модулями** — использует модальные окна из других модулей (3_sd_del_concept_individ)
3. **Методы из techtree** — список методов загружается динамически из графа vad:techtree через SPARQL

### 1.3 Связанные issues

| Issue | Описание |
|-------|----------|
| #336 | Реализация метода Delete Individ Process |
| #368 | Создание модуля 12_method |
| #370 | Добавление метода Add hasNext Dia |
| #372 | Переработка на SPARQL-Driven подход |
| #382 | Обновление именования констант (individProcess, individExecutor) |
| #386 | Добавление методов editLabelConceptProcess и delDia |
| #396 | Документирование структуры модуля с указанием cross-module зависимостей |

---

## 2. Структура модуля

```
ver9d/
├── 12_method/
│   ├── 12_method_logic.js    - Логика выполнения методов
│   ├── 12_method_sparql.js   - SPARQL запросы для получения методов
│   ├── 12_method_ui.js       - UI функции (кнопка "Методы", dropdown)
│   └── 12_method.css         - Стили модуля
├── doc/
│   └── 12_method.md          - Документация (этот файл)
```

### 2.1 Файлы модуля

| Файл | Назначение |
|------|------------|
| `12_method_logic.js` | Основная логика: диспетчер методов, удаление индивидов, редактирование hasNext |
| `12_method_sparql.js` | SPARQL запрос для получения методов из vad:techtree |
| `12_method_ui.js` | UI: кнопка "Методы", выпадающий список методов |
| `12_method.css` | CSS стили для UI компонентов |

### 2.2 Таблица функций модуля

#### Функции 12_method_logic.js

| Функция | Назначение | Вызываемые функции других модулей |
|---------|------------|-----------------------------------|
| `executeObjectMethod(functionId, objectUri, trigUri)` | Диспетчер методов объектов | - |
| `executeDiagramMethod(functionId, trigUri)` | Диспетчер методов диаграммы | - |
| `deleteIndividProcessFromTrig(processUri, trigUri)` | Удаление индивида процесса | `openDeleteModal()` - **3_sd_del_concept_individ_ui.js** |
| `deleteIndividExecutorFromTrig(executorGroupUri, trigUri)` | Удаление индивида исполнителя | `openDeleteModal()` - **3_sd_del_concept_individ_ui.js** |
| `openHasNextDiaModal(processUri, trigUri)` | Открытие окна редактирования hasNext | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js**, `resetModalPosition()` - глобальная функция |
| `getCurrentHasNext(processUri, trigUri)` | Получение текущих hasNext | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js** |
| `getIndividsForHasNextDia(trigUri)` | Получение индивидов для справочника hasNext | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js** |
| `fillHasNextDiaCheckboxes(trigUri)` | Заполнение чекбоксов hasNext | - |
| `createHasNextDiaSparql()` | Генерация SPARQL для hasNext | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js** |
| `openEditLabelModal(processUri, trigUri)` | Открытие окна редактирования label | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js**, `resetModalPosition()` - глобальная функция |
| `getConceptLabelData(processUri)` | Получение данных label концепта | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js** |
| `createEditLabelSparql()` | Генерация SPARQL для изменения label | `getPrefixedName()` - **9_vadlib/vadlib_sparql.js**, `getCurrentTrigLabel()` - локальная функция |
| `openDeleteSchemaModal(trigUri)` | Открытие окна удаления схемы | `openDelConceptModal()` - **3_sd_del_concept_individ_ui.js**, `onDelOperationChange()` - **3_sd_del_concept_individ_ui.js**, `onDelTrigSelect()` - **3_sd_del_concept_individ_ui.js** |
| `toggleDiagramMethodsDropdown(event)` | Показ/скрытие dropdown методов диаграммы | `getCurrentOpenTrigUri()` - локальная функция |
| `getDiagramMethods()` | Получение списка методов диаграммы | - |
| `getCurrentOpenTrigUri()` | Получение URI текущего TriG | Доступ к глобальным переменным: `selectedTrigUri`, `currentTrigUri`, `treeViewState` |

#### Функции 12_method_sparql.js

| Функция | Назначение | Вызываемые функции других модулей |
|---------|------------|-----------------------------------|
| `getMethodsForType(objectMethodType)` | Получение методов для типа объекта | `funSPARQLvaluesComunica()` - **9_vadlib/vadlib_sparql.js** |

#### Функции 12_method_ui.js

| Функция | Назначение | Вызываемые функции других модулей |
|---------|------------|-----------------------------------|
| `toggleMethodsDropdown(event, objectUri, trigUri, objectMethodType)` | Показ/скрытие dropdown методов объекта | `getMethodsForType()` - **12_method_sparql.js**, `executeObjectMethod()` - **12_method_logic.js** |

---

## 3. Архитектура

### 3.1 Диаграмма потока данных

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Окно "Свойства объекта"                       │
│                                                                      │
│  ┌────────────────────┐                                             │
│  │  Кнопка "Методы"   │                                             │
│  └─────────┬──────────┘                                             │
│            │ click                                                   │
│            ▼                                                         │
│  ┌────────────────────┐     SPARQL                                  │
│  │toggleMethodsDropdown├────────────► getMethodsForType()           │
│  └─────────┬──────────┘              (12_method_sparql.js)          │
│            │                                  │                      │
│            ▼                                  ▼                      │
│  ┌────────────────────┐     ┌─────────────────────────────┐         │
│  │  Dropdown методов  │◄────┤ Методы из vad:techtree      │         │
│  │  - Delete Individ  │     │ - vad:ObjectMethod          │         │
│  │  - Add hasNext Dia │     │ - vad:methodForType         │         │
│  └─────────┬──────────┘     │ - vad:methodFunction        │         │
│            │                └─────────────────────────────┘         │
│            │ select method                                           │
│            ▼                                                         │
│  ┌────────────────────┐                                             │
│  │executeObjectMethod │                                             │
│  │(12_method_logic.js)│                                             │
│  └─────────┬──────────┘                                             │
│            │                                                         │
│  ┌─────────┼──────────────────────────────┐                         │
│  │         │                              │                         │
│  ▼         ▼                              ▼                         │
│ deleteIndividProcessFromTrig   deleteIndividExecutorFromTrig        │
│           │                              │                openHasNext│
│           │                              │                DiaModal  │
│           └──────────────┬───────────────┘                    │     │
│                          │                                    │     │
│                          ▼                                    │     │
│                 ┌────────────────────┐                       │     │
│                 │  openDeleteModal   │                       │     │
│                 │ (3_sd_del_concept) │                       │     │
│                 └────────────────────┘                       │     │
│                                                              │     │
└──────────────────────────────────────────────────────────────┘     │
                                                                      │
                          ┌───────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │  Модальное окно hasNext    │
              │  (редактирование связей)   │
              └────────────────────────────┘
```

### 3.2 Типы объектов

| Тип объекта | objectMethodType | Описание |
|-------------|------------------|----------|
| Индивид процесса | `isSubprocessTrig` | Процесс, связанный через vad:isSubprocessTrig |
| Группа исполнителей | `ExecutorGroup` | Объект vad:ExecutorGroup |

---

## 4. API модуля

### 4.1 Основные функции (12_method_logic.js)

#### executeObjectMethod(functionId, objectUri, trigUri)

Диспетчер методов. Вызывает соответствующую функцию в зависимости от `functionId`.

```javascript
/**
 * @param {string} functionId - Идентификатор функции ('deleteIndividProcess', 'deleteIndividExecutor', 'addHasNextDia')
 * @param {string} objectUri - URI объекта
 * @param {string} trigUri - URI текущего TriG
 */
executeObjectMethod('deleteIndividProcess', 'http://example.org/vad#p1.1', 'http://example.org/vad#t_p1');
```

#### deleteIndividProcessFromTrig(processUri, trigUri)

Открывает модальное окно удаления индивида процесса с предустановленными значениями.

```javascript
/**
 * @param {string} processUri - URI индивида процесса
 * @param {string} trigUri - URI TriG-контейнера
 */
deleteIndividProcessFromTrig('http://example.org/vad#p1.1', 'http://example.org/vad#t_p1');
```

#### deleteIndividExecutorFromTrig(executorGroupUri, trigUri)

Открывает модальное окно удаления индивида исполнителя с предустановленными значениями.

```javascript
/**
 * @param {string} executorGroupUri - URI ExecutorGroup
 * @param {string} trigUri - URI TriG-контейнера
 */
deleteIndividExecutorFromTrig('http://example.org/vad#ExecutorGroup_p1.1', 'http://example.org/vad#t_p1');
```

#### openHasNextDiaModal(processUri, trigUri)

Открывает модальное окно редактирования связей vad:hasNext.

```javascript
/**
 * @param {string} processUri - URI индивида процесса
 * @param {string} trigUri - URI текущего TriG
 */
openHasNextDiaModal('http://example.org/vad#p1.1', 'http://example.org/vad#t_p1');
```

### 4.2 SPARQL функции (12_method_sparql.js)

#### getMethodsForType(objectMethodType)

Получает список методов для указанного типа объекта из vad:techtree.

```javascript
/**
 * @param {string} objectMethodType - Тип объекта ('isSubprocessTrig' или 'ExecutorGroup')
 * @returns {Promise<Array<{uri: string, label: string, functionId: string}>>}
 */
const methods = await getMethodsForType('isSubprocessTrig');
// Результат: [{ uri: '...', label: 'Delete Individ Process', functionId: 'deleteIndividProcess' }, ...]
```

### 4.3 UI функции (12_method_ui.js)

#### toggleMethodsDropdown(event, objectUri, trigUri, objectMethodType)

Показывает/скрывает выпадающий список методов.

```javascript
/**
 * @param {Event} event - Событие клика
 * @param {string} objectUri - URI объекта
 * @param {string} trigUri - URI текущего TriG
 * @param {string} objectMethodType - Тип объекта
 */
toggleMethodsDropdown(event, objectUri, trigUri, 'isSubprocessTrig');
```

---

## 5. Методы объектов

### 5.1 Delete Individ Process

**Идентификатор:** `deleteIndividProcess`

**Назначение:** Удаление индивида процесса из схемы.

**Алгоритм:**
1. Преобразование URI в prefixed формат
2. Вызов `openDeleteModal('individProcess', prefixedTrigUri, prefixedProcessUri)`
3. Модальное окно генерирует SPARQL DELETE запрос
4. Пользователь применяет запрос через "Result in SPARQL"

**Генерируемый SPARQL:**
```sparql
DELETE WHERE { GRAPH vad:t_p1 { vad:p1.1 ?p ?o . } }
;
DELETE WHERE { GRAPH vad:t_p1 { ?eg vad:hasExecutor vad:p1.1 . ?eg ?p ?o . } }
;
DELETE WHERE { GRAPH vad:t_p1 { ?other vad:hasNext vad:p1.1 . } }
```

### 5.2 Delete Individ Executor

**Идентификатор:** `deleteIndividExecutor`

**Назначение:** Удаление индивида исполнителя (vad:includes) из ExecutorGroup.

**Алгоритм:**
1. Преобразование URI в prefixed формат
2. Вызов `openDeleteModal('individExecutor', prefixedTrigUri, prefixedUri)`
3. Модальное окно генерирует SPARQL DELETE запрос

**Генерируемый SPARQL:**
```sparql
DELETE WHERE { GRAPH vad:t_p1 { ?eg vad:includes vad:r1 . } }
```

### 5.3 Add hasNext Dia

**Идентификатор:** `addHasNextDia`

**Назначение:** Редактирование связей vad:hasNext для индивида процесса.

**Алгоритм:**
1. Открытие модального окна `hasnext-dia-modal`
2. Заполнение полей TriG и процесса
3. Отображение checkboxes с текущими и доступными hasNext
4. Генерация SPARQL INSERT/DELETE DATA запроса

**Генерируемый SPARQL:**
```sparql
DELETE DATA { GRAPH vad:t_p1 { vad:p1.1 vad:hasNext vad:p1.2 . } }
;
INSERT DATA { GRAPH vad:t_p1 { vad:p1.1 vad:hasNext vad:p1.3 . } }
```

### 5.4 Edit Label Concept Process

**Идентификатор:** `editLabelConceptProcess`

**Назначение:** Редактирование rdfs:label концепта процесса.

**Алгоритм:**
1. Открытие модального окна `edit-label-modal`
2. Получение текущего label из ptree
3. Получение связанной схемы (vad:hasTrig)
4. Генерация SPARQL DELETE DATA/INSERT DATA запроса

**Генерируемый SPARQL:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Удаление старого label в ptree
DELETE DATA {
    GRAPH vad:ptree {
        vad:p1 rdfs:label "Old Label" .
    }
};

# Добавление нового label в ptree
INSERT DATA {
    GRAPH vad:ptree {
        vad:p1 rdfs:label "New Label" .
    }
}
```

### 5.5 Del Dia (Delete Diagram)

**Идентификатор:** `delDia`

**Назначение:** Удаление схемы процесса (TriG).

**Алгоритм:**
1. Открытие модального окна удаления (`openDelConceptModal`)
2. Предустановка операции "Удалить схему процесса (TriG)"
3. Выбор указанного TriG
4. Генерация SPARQL запроса на удаление

**Вызываемые функции других модулей:**
- `openDelConceptModal()` - **3_sd_del_concept_individ_ui.js**
- `onDelOperationChange()` - **3_sd_del_concept_individ_ui.js**
- `onDelTrigSelect()` - **3_sd_del_concept_individ_ui.js**

---

## 5.6 SPARQL-запросы для методов Del

Данный раздел описывает SPARQL-запросы, которые формируются при вызове методов удаления через модуль **12_method**.

### 5.6.1 Удаление индивида процесса (Delete Individ Process)

**Функция:** `deleteIndividProcessFromTrig()` в **12_method_logic.js**

**Вызов функции другого модуля:**
```javascript
openDeleteModal('individProcess', prefixedTrigUri, prefixedProcessUri)
// → 3_sd_del_concept_individ_ui.js
```

**SPARQL-запросы, генерируемые в 3_sd_del_concept_individ:**

**Поиск индивида в TriG:**
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?individ ?label WHERE {
    GRAPH <trigUri> {
        ?individ vad:isSubprocessTrig <trigUri> .
    }
    OPTIONAL {
        GRAPH vad:ptree {
            ?individ rdfs:label ?label .
        }
    }
}
```

**Поиск ExecutorGroup для индивида:**
```sparql
PREFIX vad: <http://example.org/vad#>

SELECT ?executorGroup WHERE {
    GRAPH <trigUri> {
        <individUri> vad:hasExecutor ?executorGroup .
    }
}
```

**Поиск входящих vad:hasNext:**
```sparql
PREFIX vad: <http://example.org/vad#>

SELECT ?sourceIndivid WHERE {
    GRAPH <trigUri> {
        ?sourceIndivid vad:hasNext <individUri> .
    }
}
```

**Генерация DELETE-запроса** (функция `GENERATE_DELETE_PROCESS_INDIVID_QUERY` в **3_sd_del_concept_individ_sparql.js**):
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Удаление всех исходящих триплетов индивида процесса
DELETE WHERE {
    GRAPH vad:t_p1 {
        vad:p1.1 ?p ?o .
    }
};

# Удаление объекта ExecutorGroup
DELETE WHERE {
    GRAPH vad:t_p1 {
        vad:ExecutorGroup_p1.1 ?p ?o .
    }
};

# Удаление входящей связи vad:hasNext
DELETE DATA {
    GRAPH vad:t_p1 {
        vad:p1.2 vad:hasNext vad:p1.1 .
    }
}
```

### 5.6.2 Удаление индивида исполнителя (Delete Individ Executor)

**Функция:** `deleteIndividExecutorFromTrig()` в **12_method_logic.js**

**Вызов функции другого модуля:**
```javascript
openDeleteModal('individExecutor', prefixedTrigUri, prefixedUri)
// → 3_sd_del_concept_individ_ui.js
```

**SPARQL-запросы, генерируемые в 3_sd_del_concept_individ:**

**Поиск исполнителей в TriG:**
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?executor ?label WHERE {
    GRAPH <trigUri> {
        ?group vad:includes ?executor .
    }
    OPTIONAL {
        GRAPH vad:rtree {
            ?executor rdfs:label ?label .
        }
    }
}
```

**Генерация DELETE-запроса** (функция `GENERATE_DELETE_EXECUTOR_INDIVID_QUERY` в **3_sd_del_concept_individ_sparql.js**):
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Удаление связи vad:includes для исполнителя
DELETE DATA {
    GRAPH vad:t_p1 {
        vad:p1.1 vad:includes vad:r1 .
    }
}
```

### 5.6.3 Удаление схемы процесса (Del Dia)

**Функция:** `openDeleteSchemaModal()` в **12_method_logic.js**

**Вызов функции другого модуля:**
```javascript
openDelConceptModal()
// → 3_sd_del_concept_individ_ui.js
```

**SPARQL-запросы, генерируемые в 3_sd_del_concept_individ:**

**Получение всех TriG:**
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

SELECT ?trig ?label WHERE {
    ?trig rdf:type vad:VADProcessDia .
    OPTIONAL { ?trig rdfs:label ?label }
}
```

**Генерация DELETE-запроса** (функция `GENERATE_DELETE_TRIG_QUERY` в **3_sd_del_concept_individ_sparql.js**):
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Удаление триплета vad:hasTrig в концепте процесса
DELETE DATA {
    GRAPH vad:ptree {
        vad:p1 vad:hasTrig vad:t_p1 .
    }
};

# Удаление всего графа TriG
DROP GRAPH vad:t_p1;

# Каскадное удаление связанного Virtual TriG
DROP SILENT GRAPH vad:vt_p1
```

---

## 6. Интеграция с UI

### 6.1 Кнопка "Методы"

Кнопка "Методы" отображается в окне "Свойства объекта диаграммы" для объектов типа:
- `vad:isSubprocessTrig` (индивиды процессов)
- `vad:ExecutorGroup` (группы исполнителей)

```html
<button class="methods-btn" onclick="toggleMethodsDropdown(event, objectUri, trigUri, objectMethodType)">
    Методы
</button>
```

### 6.2 Dropdown методов

Выпадающий список создаётся динамически при клике на кнопку "Методы":

```html
<div class="methods-dropdown visible">
    <div class="methods-dropdown-item" onclick="executeObjectMethod('deleteIndividProcess', ...)">
        Delete Individ Process
    </div>
    <div class="methods-dropdown-item" onclick="executeObjectMethod('addHasNextDia', ...)">
        Add hasNext Dia
    </div>
</div>
```

### 6.3 Модальное окно hasNext

Модальное окно `hasnext-dia-modal` содержит:
- Поля "Схема процесса" и "Концепт процесса" (read-only)
- Checkboxes для выбора связей hasNext
- Кнопка "Создать запрос hasNext"
- Секция промежуточного SPARQL

---

## 7. Примеры использования

### 7.1 Удаление индивида процесса

```javascript
// При выборе метода "Delete Individ Process" из dropdown
executeObjectMethod(
    'deleteIndividProcess',
    'http://example.org/vad#p1.1',
    'http://example.org/vad#t_p1'
);

// Внутренне вызывается:
deleteIndividProcessFromTrig(
    'http://example.org/vad#p1.1',
    'http://example.org/vad#t_p1'
);

// Которая вызывает:
// issue #382: Используем новое обозначение individProcess
openDeleteModal('individProcess', 'vad:t_p1', 'vad:p1.1');
```

### 7.2 Редактирование hasNext

```javascript
// При выборе метода "Add hasNext Dia" из dropdown
executeObjectMethod(
    'addHasNextDia',
    'http://example.org/vad#p1.1',
    'http://example.org/vad#t_p1'
);

// Внутренне вызывается:
openHasNextDiaModal(
    'http://example.org/vad#p1.1',
    'http://example.org/vad#t_p1'
);
```

### 7.3 Получение методов из techtree

```javascript
// Получение методов для индивида процесса
const methods = await getMethodsForType('isSubprocessTrig');
console.log(methods);
// [
//   { uri: 'vad:method_deleteIndividProcess', label: 'Delete Individ Process', functionId: 'deleteIndividProcess' },
//   { uri: 'vad:method_addHasNextDia', label: 'Add hasNext Dia', functionId: 'addHasNextDia' }
// ]

// Получение методов для ExecutorGroup
const executorMethods = await getMethodsForType('ExecutorGroup');
// [
//   { uri: 'vad:method_deleteIndividExecutor', label: 'Delete Individ Executor', functionId: 'deleteIndividExecutor' }
// ]
```

---

## Источники

- [issue #336: Реализация метода Delete Individ Process](https://github.com/bpmbpm/rdf-grapher/issues/336)
- [issue #368: Создание модуля 12_method](https://github.com/bpmbpm/rdf-grapher/issues/368)
- [issue #370: Добавление метода Add hasNext Dia](https://github.com/bpmbpm/rdf-grapher/issues/370)
- [issue #372: SPARQL-Driven подход](https://github.com/bpmbpm/rdf-grapher/issues/372)
- [issue #382: Обновление именования констант](https://github.com/bpmbpm/rdf-grapher/issues/382)
- [deleteIndividProcessFromTrig.md](./function/deleteIndividProcessFromTrig.md)
- [openDeleteModal.md](./function/openDeleteModal.md)
- [constant_naming.md](../requirements/constant_naming.md)

---

*Документ создан: 2026-02-12*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.1*
*Ссылки на issues: #336, #368, #370, #372, #382, #386, #396*
