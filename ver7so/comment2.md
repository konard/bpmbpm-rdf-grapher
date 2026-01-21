# Предложения по оптимизации TrigVADv2 и алгоритма обработки

## 1. Явная связь между TriG и Process

### 1.1 Проблема

В текущей реализации связь между схемой процесса (TriG) и процессом задана неявно через идентификаторы:
- Процесс: `vad:p1`
- Схема процесса (TriG): `vad:t_p1` (где `t_` обозначает trig)

Это требует соглашения об именовании и не обеспечивает явной семантической связи.

### 1.2 Предложенные варианты связи

#### Вариант A: Использование vad:definesProcess (рекомендуется)

Добавить обратное свойство к `vad:hasTrig`:

```turtle
# В vad:ptree (существующее):
vad:p1 vad:hasTrig vad:t_p1 .

# В vad:t_p1 (новое):
vad:t_p1 vad:definesProcess vad:p1 .
```

**Преимущества:**
- Явная двусторонняя связь без дублирования `vad:hasParent`
- Обратное свойство (`owl:inverseOf`) позволяет автоматически выводить связь
- Хранится в соответствующем TriG, не требует синхронизации с `vad:ptree`
- Соответствует принципу "один TriG описывает один процесс"

**Реализация в онтологии:**
```turtle
vad:definesProcess
    a rdf:Property, owl:ObjectProperty ;
    rdfs:label "definesProcess" ;
    rdfs:domain vad:VADProcessDia ;
    rdfs:range vad:Process ;
    owl:inverseOf vad:hasTrig ;
    dcterms:description "Явно связывает TriG схему с процессом, который она описывает" .
```

#### Вариант B: Дублирование vad:hasParent для Process (не рекомендуется)

```turtle
# В vad:ptree:
vad:p1 vad:hasParent vad:pGA .

# В vad:t_pGA:
vad:t_pGA vad:hasParent vad:root .
```

**Недостатки:**
- Требует ручной синхронизации между двумя местами
- Семантическое смешение: `hasParent` для иерархии TriG и для иерархии процессов
- Увеличивает сложность поддержки данных

#### Вариант C: Соглашение об именовании (текущий подход)

Соглашение: `vad:t_{processId}` для TriG и `vad:{processId}` для процесса.

**Недостатки:**
- Неявная связь
- Требует парсинга идентификаторов
- Не обеспечивает семантической проверки

### 1.3 Рекомендация

Рекомендуется **Вариант A** с использованием `vad:definesProcess`.

---

## 2. SPARQL-запрос для поиска TriG схем, содержащих заданный процесс

### 2.1 Запрос для получения списка TriG, в которые входит заданный процесс

```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Найти все TriG (схемы процессов), в которые входит заданный процесс
# Замените vad:p1 на нужный идентификатор процесса

SELECT DISTINCT ?trig ?trigLabel
WHERE {
    # Процесс присутствует в TriG (имеет любой предикат в контексте этого графа)
    GRAPH ?trig {
        vad:p1 ?predicate ?object .
    }

    # TriG имеет метку (опционально, для читаемости результата)
    OPTIONAL {
        GRAPH ?trig {
            ?trig rdfs:label ?trigLabel .
        }
    }

    # Исключаем vad:ptree, так как он содержит метаданные всех процессов
    FILTER (?trig != vad:ptree)
}
ORDER BY ?trigLabel
```

### 2.2 Альтернативный запрос с использованием vad:definesProcess

Если реализован предикат `vad:definesProcess`:

```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Найти TriG, который явно определяет заданный процесс
SELECT ?trig ?trigLabel
WHERE {
    GRAPH ?trig {
        ?trig vad:definesProcess vad:p1 .
    }

    OPTIONAL {
        GRAPH ?trig {
            ?trig rdfs:label ?trigLabel .
        }
    }
}
```

### 2.3 Запрос для получения всех TriG, где процесс участвует в цепочке

```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Найти все TriG, где процесс имеет связи hasNext, hasExecutor или processSubtype
SELECT DISTINCT ?trig ?trigLabel ?role
WHERE {
    GRAPH ?trig {
        {
            vad:p1 vad:hasNext ?next .
            BIND("hasNext" AS ?role)
        }
        UNION
        {
            ?prev vad:hasNext vad:p1 .
            BIND("isNextOf" AS ?role)
        }
        UNION
        {
            vad:p1 vad:hasExecutor ?executor .
            BIND("hasExecutor" AS ?role)
        }
        UNION
        {
            vad:p1 vad:processSubtype ?subtype .
            BIND("processSubtype" AS ?role)
        }
    }

    OPTIONAL {
        GRAPH ?trig {
            ?trig rdfs:label ?trigLabel .
        }
    }

    FILTER (?trig != vad:ptree)
}
ORDER BY ?trig
```

---

## 3. Дополнительные предложения по оптимизации

### 3.1 Группировка свойств через подклассы в онтологии

Для явного выделения групп свойств добавлены в онтологию:

**Группа свойств «Общая для всех схем процессов»:**
- Класс: `vad:ProcessTree` (экземпляр `vad:ptree`)
- Предикаты (PTREE_PREDICATES): `rdf:type`, `rdfs:label`, `dcterms:description`, `vad:hasTrig`

**Группа свойств «Индивидуальная для конкретной схемы процесса»:**
- Класс: `vad:VADProcessDia`
- Предикаты: `vad:hasExecutor`, `vad:processSubtype`, `vad:hasNext`, `vad:definesProcess`

### 3.2 Новые подтипы процессов: DetailedChild и DetailedExternal

Добавлены подклассы для `vad:Detailed`:

- **vad:DetailedChild** - детализированный процесс, являющийся подпроцессом текущей схемы
  - Условие: дочерняя схема имеет `vad:hasParent` на текущую схему
  - Пример: `vad:p1` в `vad:t_pGA`, где `vad:t_p1 vad:hasParent vad:t_pGA`

- **vad:DetailedExternal** - детализированный внешний процесс
  - Условие: дочерняя схема НЕ имеет `vad:hasParent` на текущую схему
  - Пример: ссылка на процесс из другой ветви иерархии

### 3.3 Дерево исполнителей (vad:rtree)

Добавлен класс `vad:ExecutorTree` и экземпляр `vad:rtree` для хранения метаданных исполнителей:

```turtle
vad:rtree {
    vad:rtree rdf:type vad:ExecutorTree ;
        rdfs:label "Дерево Исполнителей (TriG)" ;
        vad:hasParent vad:root .

    # Метаданные исполнителей
    vad:Executor1 rdf:type vad:Executor ;
        rdfs:label "Исполнитель 1" .

    vad:Executor2 rdf:type vad:Executor ;
        rdfs:label "Исполнитель 2" .
    # ...
}
```

**Преимущества:**
- Исполнители определяются разово в `vad:rtree`, а не дублируются в каждой схеме процесса
- При отрисовке схемы используется информация из `vad:ptree` (процессы) и `vad:rtree` (исполнители)
- Упрощает поддержку данных при изменении информации об исполнителях

### 3.4 Применённые предложения из comment1.md

Из comment1.md были применены следующие предложения:

| # | Предложение | Статус |
|---|-------------|--------|
| 1.1 | Явный тип для TriG графов (`rdf:type vad:VADProcessDia`) | Рекомендуется применить в данных |
| 1.2 | Явный тип для vad:ptree (`rdf:type vad:ProcessTree`) | Рекомендуется применить в данных |
| 1.3 | dcterms:description для TriG | Опционально |
| 1.4 | processSubtype в ptree | **НЕ применено** (по требованию) |
| 1.5 | Упорядочивание процессов | Рекомендуется в данных |
| 2.1 | Валидация типов TriG | Рекомендуется в index.html |
| 2.3 | Функция getTrigType | Рекомендуется в index.html |
| 2.6 | Константы TRIG_TYPES | Рекомендуется в index.html |

---

## 4. Обновлённая структура exampleTrigVADv2

### 4.1 Рекомендуемый формат данных

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix vad: <http://example.org/vad#> .

# ============================================================================
# Дерево Процессов (ptree)
# ============================================================================

vad:ptree {
    vad:ptree rdf:type vad:ProcessTree ;
        rdfs:label "Дерево Процессов (TriG)" ;
        vad:hasParent vad:root .

    # Процессы с их общими свойствами
    vad:pGA rdf:type vad:Process ;
        rdfs:label "Группа Процессов А" ;
        dcterms:description "Группа Процессов А" ;
        vad:hasTrig vad:t_pGA .

    vad:p1 rdf:type vad:Process ;
        rdfs:label "p1 Процесс 1" ;
        dcterms:description "Первый процесс в цепочке" ;
        vad:hasTrig vad:t_p1 .
    # ...
}

# ============================================================================
# Дерево Исполнителей (rtree)
# ============================================================================

vad:rtree {
    vad:rtree rdf:type vad:ExecutorTree ;
        rdfs:label "Дерево Исполнителей (TriG)" ;
        vad:hasParent vad:root .

    # Исполнители с их общими свойствами
    vad:Executor1 rdf:type vad:Executor ;
        rdfs:label "Исполнитель 1" .

    vad:Executor2 rdf:type vad:Executor ;
        rdfs:label "Исполнитель 2" .
    # ...
}

# ============================================================================
# Схема процесса t_pGA
# ============================================================================

vad:t_pGA {
    vad:t_pGA rdf:type vad:VADProcessDia ;
        rdfs:label "Схема процесса t_pGA" ;
        vad:hasParent vad:root ;
        vad:definesProcess vad:pGA .

    # Индивидуальные свойства процессов для этой схемы
    vad:p1 vad:hasExecutor vad:ExecutorGroup1 ;
        vad:processSubtype vad:DetailedChild ;
        vad:hasNext vad:Process2 .

    # Группы исполнителей (связывают процессы с исполнителями из rtree)
    vad:ExecutorGroup1 rdf:type vad:ExecutorGroup ;
        rdfs:label "Группа исполнителей процесса Процесс 1" ;
        vad:includes vad:Executor1 .
    # ...
}

# ============================================================================
# Схема процесса t_p1 (дочерняя для t_pGA)
# ============================================================================

vad:t_p1 {
    vad:t_p1 rdf:type vad:VADProcessDia ;
        rdfs:label "Схема процесса t_p1" ;
        vad:hasParent vad:t_pGA ;
        vad:definesProcess vad:p1 .

    # Индивидуальные свойства процессов
    # ...
}
```

---

## 5. Заключение

### 5.1 Основные изменения в онтологии

1. **Новые классы:**
   - `vad:DetailedChild` - подкласс `vad:Detailed`
   - `vad:DetailedExternal` - подкласс `vad:Detailed`
   - `vad:ExecutorTree` - класс для дерева исполнителей

2. **Новые экземпляры:**
   - `vad:rtree` - единственный экземпляр `vad:ExecutorTree`

3. **Новые предикаты:**
   - `vad:definesProcess` - явная связь TriG с процессом (обратное к `vad:hasTrig`)

4. **Обновлённые предикаты:**
   - `vad:processSubtype` - расширен диапазон значений
   - `vad:hasParent` - расширен домен для `vad:ExecutorTree`

### 5.2 Необходимые изменения в index.html

1. Добавить константу `RTREE_PREDICATES` (аналогично `PTREE_PREDICATES`)
2. Добавить `vad:DetailedChild` и `vad:DetailedExternal` в `VAD_ALLOWED_TYPES`
3. Добавить `vad:definesProcess` в `VAD_ALLOWED_PREDICATES`
4. Обновить логику отрисовки для использования данных из `vad:rtree`
5. Реализовать валидацию типов TriG графов
