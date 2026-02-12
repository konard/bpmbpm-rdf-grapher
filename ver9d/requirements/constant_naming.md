# Naming Constants and Variables

<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/382 -->
<!-- Дата создания: 2026-02-12 -->

## 1. Введение

Данный документ определяет соглашения по именованию констант и переменных для ключевых сущностей проекта RDF Grapher ver9d. Соглашения основаны на чёткой иерархии понятий:

- **Концепт (Concept)** — тип, хранящийся в соответствующем дереве (ptree/rtree)
- **Индивид (Individ)** — экземпляр концепта, используемый в схеме процесса (TriG типа VADProcessDia)

## 2. Основные сущности
**Key naming conventions:**
| Entity | Code Name | RDF Graph | Description |
|--------|-----------|-----------|-------------|
| Process concept | `conceptProcess` | vad:ptree | Type from process tree |
| Process individ | `individProcess` | vad:VADProcessDia | Instance in schema |
| Executor concept | `conceptExecutor` | vad:rtree | Type from role tree |
| Executor individ | `individExecutor` | vad:VADProcessDia | Instance in schema |

### 2.1 Процессы (Process)

| Понятие | Обозначение в коде | RDF граф | Описание |
|---------|-------------------|----------|----------|
| Концепт процесса | `conceptProcess` | vad:ptree | Тип процесса (vad:TypeProcess) из дерева процессов |
| Индивид процесса | `individProcess` | vad:VADProcessDia | Экземпляр процесса в схеме (связан через vad:isSubprocessTrig) |

**Примеры в коде:**

```javascript
// Концепт процесса - тип из ptree
const conceptProcess = 'http://example.org/vad#p1';  // vad:p1 в ptree

// Индивид процесса - экземпляр в схеме
const individProcess = 'http://example.org/vad#p1.1';  // vad:p1.1 в t_p1
```

### 2.2 Исполнители (Executor)

| Понятие | Обозначение в коде | RDF граф | Описание |
|---------|-------------------|----------|----------|
| Концепт исполнителя | `conceptExecutor` | vad:rtree | Тип исполнителя (vad:TypeExecutor) из дерева ролей |
| Индивид исполнителя | `individExecutor` | vad:VADProcessDia | Использование исполнителя в схеме (через vad:includes в ExecutorGroup) |

**Примеры в коде:**

```javascript
// Концепт исполнителя - тип из rtree
const conceptExecutor = 'http://example.org/vad#r1';  // vad:r1 в rtree

// Индивид исполнителя - использование в схеме
const individExecutor = 'http://example.org/vad#r1';  // vad:r1 через vad:includes в t_p1
```

### 2.3 Группы сущностей

| Обозначение | Описание | Включает |
|-------------|----------|----------|
| `Process` | Общее обозначение процесса | conceptProcess + individProcess |
| `Executor` | Общее обозначение исполнителя | conceptExecutor + individExecutor |
| `individ` | Общее обозначение индивида | individProcess + individExecutor |

## 3. Таблица соответствий

### 3.1 Стандартные обозначения (обязательные)

| Обозначение | Контекст | Описание |
|-------------|----------|----------|
| `individProcess` | Удаление/создание индивида процесса | Экземпляр процесса в схеме VADProcessDia |
| `individExecutor` | Удаление/создание индивида исполнителя | Использование исполнителя в схеме через vad:includes |
| `type: 'individProcess'` | Параметр функции openDeleteModal | Тип для удаления индивида процесса |
| `type: 'individExecutor'` | Параметр функции openDeleteModal | Тип для удаления индивида исполнителя |

**Важно:** Устаревшие обозначения (`individ`, `executor`) больше **не поддерживаются**. Используйте только указанные выше стандартные обозначения в стиле camelCase.

### 3.2 Константы DEL_OPERATION_TYPES

| Константа | Описание |
|-----------|----------|
| `CONCEPT_PROCESS` | Удаление концепта процесса из ptree |
| `CONCEPT_EXECUTOR` | Удаление концепта исполнителя из rtree |
| `INDIVID_PROCESS` | Удаление индивида процесса во всех схемах |
| `INDIVID_EXECUTOR` | Удаление индивида исполнителя во всех схемах |
| `INDIVID_PROCESS_IN_SCHEMA` | Удаление индивида процесса в конкретной схеме |
| `INDIVID_EXECUTOR_IN_SCHEMA` | Удаление индивида исполнителя в конкретной схеме |
| `TRIG_SCHEMA` | Удаление схемы процесса (TriG) |

## 4. Правила именования

### 4.1 Стиль camelCase

Все переменные, константы и параметры функций в проекте должны использовать стиль **camelCase** (нижний верблюжий регистр):

**Правила camelCase:**
- Первое слово начинается с маленькой буквы
- Каждое последующее слово начинается с заглавной буквы
- Слова пишутся слитно, без разделителей

**Примеры правильного именования:**
```javascript
// Переменные
const conceptProcess = 'http://example.org/vad#p1';
const individExecutor = 'http://example.org/vad#r1';
const trigUri = 'http://example.org/vad#t_p1';
const selectedOperation = 'individProcess';

// Параметры функций
function openDeleteModal(type, prefixedTrigUri, prefixedIndividUri) { ... }
function deleteIndividProcessFromTrig(processUri, trigUri) { ... }

// Константы типов
const TYPE_INDIVID_PROCESS = 'individProcess';
const TYPE_INDIVID_EXECUTOR = 'individExecutor';
```

**Примеры неправильного именования (НЕ использовать):**
```javascript
// snake_case - НЕ использовать
const concept_process = '...';  // Неверно!
const individ_executor = '...'; // Неверно!

// SCREAMING_SNAKE_CASE для значений строковых констант - НЕ использовать
const type = 'INDIVID_PROCESS';  // Неверно для значений!

// PascalCase для переменных - НЕ использовать
const ConceptProcess = '...';   // Неверно!
const IndividExecutor = '...';  // Неверно!
```

**Примечание:** SCREAMING_SNAKE_CASE допускается только для имён констант-перечислений (enum-like), например `DEL_OPERATION_TYPES.INDIVID_PROCESS`. Но значения этих констант должны быть в camelCase: `'individProcess'`.

### 4.2 Переменные для URI

```javascript
// Концепты (типы из деревьев)
const conceptProcessUri = 'http://example.org/vad#p1';
const conceptExecutorUri = 'http://example.org/vad#r1';

// Индивиды (экземпляры в схемах)
const individProcessUri = 'http://example.org/vad#p1.1';
const individExecutorUri = 'http://example.org/vad#r1';

// TriG (схемы)
const trigUri = 'http://example.org/vad#t_p1';
```

### 4.2 Параметры функций

```javascript
// Правильно
function deleteIndividProcess(individProcessUri, trigUri) { ... }
function deleteIndividExecutor(individExecutorUri, trigUri) { ... }

// Устаревшее (не рекомендуется)
function deleteIndivid(type, uri, trigUri) { ... }  // type: 'individ' или 'executor'
```

### 4.3 Константы типов

```javascript
// Рекомендуемые константы
const TYPE_INDIVID_PROCESS = 'individProcess';
const TYPE_INDIVID_EXECUTOR = 'individExecutor';
const TYPE_CONCEPT_PROCESS = 'conceptProcess';
const TYPE_CONCEPT_EXECUTOR = 'conceptExecutor';
```

## 5. Диаграмма иерархии

```
                        ┌─────────────────────────────────────────┐
                        │              RDF Grapher                 │
                        └─────────────────┬───────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
    ┌─────────▼─────────┐       ┌─────────▼─────────┐       ┌─────────▼─────────┐
    │      Process      │       │     Executor      │       │       TriG        │
    │   (Процесс)       │       │   (Исполнитель)   │       │     (Схема)       │
    └─────────┬─────────┘       └─────────┬─────────┘       └───────────────────┘
              │                           │
    ┌─────────┴─────────┐       ┌─────────┴─────────┐
    │                   │       │                   │
┌───▼────────┐    ┌─────▼──────┐┌───▼────────┐    ┌─────▼──────┐
│conceptProc.│    │individProc.││conceptExec.│    │individExec.│
│            │    │            ││            │    │            │
│  (ptree)   │    │(VADProc.Dia)││  (rtree)   │    │(VADProc.Dia)│
└────────────┘    └────────────┘└────────────┘    └────────────┘
```

## 6. Примеры использования

### 6.1 Функция openDeleteModal

```javascript
// Удаление индивида процесса
openDeleteModal('individProcess', prefixedTrigUri, prefixedIndividProcessUri);

// Удаление индивида исполнителя
openDeleteModal('individExecutor', prefixedTrigUri, prefixedIndividExecutorUri);
```

### 6.2 SPARQL запросы

```sparql
# Получение концептов процессов из ptree
SELECT ?conceptProcess WHERE {
    GRAPH vad:ptree {
        ?conceptProcess rdf:type vad:TypeProcess .
    }
}

# Получение индивидов процессов из схемы
SELECT ?individProcess WHERE {
    GRAPH ?trig {
        ?individProcess vad:isSubprocessTrig ?trig .
        ?trig rdf:type vad:VADProcessDia .
    }
}

# Получение концептов исполнителей из rtree
SELECT ?conceptExecutor WHERE {
    GRAPH vad:rtree {
        ?conceptExecutor rdf:type vad:TypeExecutor .
    }
}

# Получение индивидов исполнителей из схемы
SELECT ?individExecutor WHERE {
    GRAPH ?trig {
        ?eg vad:includes ?individExecutor .
        ?trig rdf:type vad:VADProcessDia .
    }
}
```

## 7. Обязательные обозначения

Код проекта использует **только** следующие обозначения (без обратной совместимости):

| Обозначение | Использование | Примечание |
|-------------|---------------|------------|
| `'individProcess'` | Параметр type в функциях | Единственно допустимое значение для индивида процесса |
| `'individExecutor'` | Параметр type в функциях | Единственно допустимое значение для индивида исполнителя |

**Внимание:** Устаревшие обозначения `'individ'` и `'executor'` **не поддерживаются** и приведут к ошибке при вызове функций.

## 8. Связанные документы

- [file_naming.md](./file_naming.md) — соглашения по именованию файлов
- [sparql-driven-programming_min2.md](./sparql-driven-programming_min2.md) — концепция SPARQL-driven Programming
- [deleteIndividProcessFromTrig.md](../doc/function/deleteIndividProcessFromTrig.md) — документация функции удаления
- [openDeleteModal.md](../doc/function/openDeleteModal.md) — документация функции открытия модального окна

---

*Документ создан: 2026-02-12*
*Автор: AI Assistant (Claude Opus 4.5)*
*Версия: 1.0*
*Ссылка на issue: [#382](https://github.com/bpmbpm/rdf-grapher/issues/382)*
