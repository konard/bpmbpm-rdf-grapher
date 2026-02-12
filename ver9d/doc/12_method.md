# Модуль 12_method - Методы объектов диаграммы

<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/368 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/370 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/372 -->
<!-- Обновлено: https://github.com/bpmbpm/rdf-grapher/issues/382 -->
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
*Версия: 1.0*
*Ссылки на issues: #336, #368, #370, #372, #382*
