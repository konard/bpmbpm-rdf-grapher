# Таблица «Объект-Предикат»: допустимые предикаты для каждого типа объекта

## 1. Сводная таблица

| Объект (тип) | Допустимые предикаты | Место хранения |
|--------------|---------------------|----------------|
| **vad:Process** | `rdf:type`, `rdfs:label`, `dcterms:description`, `vad:hasTrig` | vad:ptree |
| **vad:Process** | `vad:hasExecutor`, `vad:processSubtype`, `vad:hasNext` | VADProcessDia |
| **vad:Executor** | `rdf:type`, `rdfs:label` | vad:rtree |
| **vad:ExecutorGroup** | `rdf:type`, `rdfs:label`, `vad:includes` | VADProcessDia |
| **vad:VADProcessDia** | `rdf:type`, `rdfs:label`, `vad:hasParent`, `vad:definesProcess` | VADProcessDia (самоописание) |
| **vad:ProcessTree** | `rdf:type`, `rdfs:label`, `vad:hasParent` | vad:ptree (самоописание) |
| **vad:ExecutorTree** | `rdf:type`, `rdfs:label`, `vad:hasParent` | vad:rtree (самоописание) |

---

## 2. Детализация по объектам

### 2.1 vad:Process (Процесс)

Объекты типа `vad:Process` имеют **две группы предикатов**, хранящихся в разных местах:

#### Группа «Общая для всех схем процессов» (PTREE_PREDICATES)
Хранится в `vad:ptree`:

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `rdf:type` | Тип объекта (`vad:Process`) | Обязательный |
| `rdfs:label` | Название процесса | Обязательный |
| `dcterms:description` | Описание процесса | Опциональный |
| `vad:hasTrig` | Ссылка на детализирующую схему (TriG) | Только для Detailed |

#### Группа «Индивидуальная для конкретной схемы процесса»
Хранится в соответствующем TriG (VADProcessDia):

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `vad:hasExecutor` | Группа исполнителей процесса | Обязательный |
| `vad:processSubtype` | Подтип процесса (`vad:Basic`, `vad:Detailed`, `vad:DetailedChild`, `vad:DetailedExternal`) | Обязательный |
| `vad:hasNext` | Следующий процесс в цепочке | Опциональный |

**Важно:** Предикат `vad:hasParent` **НЕ является** допустимым предикатом для объектов типа `vad:Process`. Он используется только для TriG-графов (см. раздел 2.4).

---

### 2.2 vad:Executor (Исполнитель)

#### Группа «Общая для всех схем процессов» (RTREE_PREDICATES)
Хранится в `vad:rtree`:

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `rdf:type` | Тип объекта (`vad:Executor`) | Обязательный |
| `rdfs:label` | Название исполнителя | Обязательный |

**Примечание:** Исполнители определяются **разово** в `vad:rtree`, а не дублируются в каждой схеме процесса.

---

### 2.3 vad:ExecutorGroup (Группа исполнителей)

Хранится в соответствующем TriG (VADProcessDia):

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `rdf:type` | Тип объекта (`vad:ExecutorGroup`) | Обязательный |
| `rdfs:label` | Название группы | Обязательный |
| `vad:includes` | Ссылка на исполнителя (`vad:Executor`) | Обязательный |

---

### 2.4 vad:VADProcessDia (Схема процесса)

Хранится в самом TriG-графе (самоописание):

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `rdf:type` | Тип графа (`vad:VADProcessDia`) | Обязательный |
| `rdfs:label` | Название схемы | Обязательный |
| `vad:hasParent` | Родительский TriG или `vad:root` | Обязательный |
| `vad:definesProcess` | Явная связь с процессом (обратное к `vad:hasTrig`) | Рекомендуется |

---

### 2.5 vad:ProcessTree (Дерево процессов)

Единственный экземпляр — `vad:ptree`. Хранится в самом графе `vad:ptree` (самоописание):

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `rdf:type` | Тип графа (`vad:ProcessTree`) | Обязательный |
| `rdfs:label` | Название дерева | Обязательный |
| `vad:hasParent` | Родительский узел (`vad:root`) | Обязательный |

---

### 2.6 vad:ExecutorTree (Дерево исполнителей)

Единственный экземпляр — `vad:rtree`. Хранится в самом графе `vad:rtree` (самоописание):

| Предикат | Описание | Обязательность |
|----------|----------|----------------|
| `rdf:type` | Тип графа (`vad:ExecutorTree`) | Обязательный |
| `rdfs:label` | Название дерева | Обязательный |
| `vad:hasParent` | Родительский узел (`vad:root`) | Обязательный |

---

## 3. Связь с константами JavaScript (index.html)

### 3.1 Константа PTREE_PREDICATES

Содержит предикаты, которые для объектов типа `vad:Process` хранятся в `vad:ptree`:

```javascript
const PTREE_PREDICATES = [
    'rdf:type',
    'rdfs:label',
    'dcterms:description',
    'vad:hasTrig'
];
```

### 3.2 Константа RTREE_PREDICATES

Содержит предикаты, которые для объектов типа `vad:Executor` хранятся в `vad:rtree`:

```javascript
const RTREE_PREDICATES = [
    'rdf:type',
    'rdfs:label'
];
```

### 3.3 Константа VAD_ALLOWED_PREDICATES

Содержит все допустимые предикаты для режима VAD:

```javascript
const VAD_ALLOWED_PREDICATES = [
    'rdf:type',
    'rdfs:label',
    'dcterms:description',
    'vad:hasNext',
    'vad:hasExecutor',
    'vad:hasParent',
    'vad:includes',
    'vad:processSubtype',
    'vad:hasTrig',
    'vad:definesProcess'
];
```

---

## 4. Пояснение по vad:hasParent

**Вопрос из Issue #117:** Почему `vad:hasParent` указан в характеристиках?

**Ответ:** Предикат `vad:hasParent` **НЕ является** допустимым предикатом для объектов типа `vad:Process`. Он используется **только для TriG-графов**:

| Субъект | Предикат | Объект |
|---------|----------|--------|
| `vad:VADProcessDia` | `vad:hasParent` | `vad:VADProcessDia` или `vad:root` |
| `vad:ProcessTree` | `vad:hasParent` | `vad:root` |
| `vad:ExecutorTree` | `vad:hasParent` | `vad:root` |

Этот предикат определяет **иерархию TriG-графов** в Окне «Дерево TriG», а не иерархию процессов.

### Примеры использования vad:hasParent:

```turtle
# Корневая схема процесса (родитель — vad:root)
vad:t_pGA vad:hasParent vad:root .

# Дочерняя схема процесса (родитель — корневая схема)
vad:t_p1 vad:hasParent vad:t_pGA .

# Дерево процессов (родитель — vad:root)
vad:ptree vad:hasParent vad:root .

# Дерево исполнителей (родитель — vad:root)
vad:rtree vad:hasParent vad:root .
```

---

## 5. Связь онтологии с PTREE_PREDICATES

В онтологии (`vad-basic-ontology.ttl`) группа «Общая для всех схем процессов» явно определена в комментариях к классу `vad:Process` (строки 82-99) и в заголовке раздела свойств (строки 461-466):

```turtle
# ==============================================================================
# ГРУППА СВОЙСТВ «ОБЩАЯ ДЛЯ ВСЕХ СХЕМ ПРОЦЕССОВ» (PTREE_PREDICATES)
# ==============================================================================
# Эти предикаты хранятся в vad:ptree для объектов типа vad:Process
# Связь с JS-кодом: константа PTREE_PREDICATES
# ==============================================================================
```

При изменении набора предикатов в группе «Общая для всех схем процессов» в онтологии необходимо соответственно обновить константу `PTREE_PREDICATES` в `index.html`.

---

## 6. Подтипы процессов и визуализация

| Подтип | Описание | Визуализация |
|--------|----------|--------------|
| `vad:Basic` | Базовый процесс без детализации | Зелёная заливка (chevron) |
| `vad:Detailed` | Детализированный процесс | Синяя заливка (chevron), кликабельный |
| `vad:DetailedChild` | Детализированный подпроцесс | Синяя заливка (chevron), кликабельный |
| `vad:DetailedExternal` | Детализированный внешний процесс | Синяя заливка (chevron), кликабельный |

**Примечание:** Все подтипы `vad:Detailed`, `vad:DetailedChild` и `vad:DetailedExternal` отображаются с синей заливкой и являются кликабельными (переход к дочерней схеме).
