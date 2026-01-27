# comment8_reasoner.md - Правила вывода для processSubtype

## Описание

Данный файл содержит формальные правила вывода (OWL/SPARQL) для автоматического определения значения `vad:processSubtype` для каждого индивида процесса в каждом TriG типа `vad:VADProcessDia`.

## Подтипы процессов

| Подтип | Условие hasTrig | Условие положения | Описание |
|--------|-----------------|-------------------|----------|
| `DetailedChild` | Есть `vad:hasTrig` в ptree | Индивид в схеме родительского процесса | Детализированный подпроцесс |
| `DetailedExternal` | Есть `vad:hasTrig` в ptree | Индивид во внешней схеме | Детализированный внешний процесс |
| `notDetailedChild` | Нет `vad:hasTrig` в ptree | Индивид в схеме родительского процесса | Не детализированный подпроцесс |
| `notDetailedExternal` | Нет `vad:hasTrig` в ptree | Индивид во внешней схеме | Не детализированный внешний процесс |
| `NotDefinedType` | Любое | `hasParentObj = pNotDefined` | Процесс с неопределённым родителем |

## Алгоритм определения

```
ДЛЯ КАЖДОГО TriG типа VADProcessDia (trigUri):
    ДЛЯ КАЖДОГО индивида процесса (processUri) в этом TriG:
        1. Получить hasParentObj индивида из ptree
        2. ЕСЛИ hasParentObj == pNotDefined:
             processSubtype = NotDefinedType
             ПЕРЕЙТИ к следующему индивиду

        3. Получить hasParentObj TriG (trigParentObj)
           (это концепт процесса, которому принадлежит схема)

        4. Определить isChild:
           isChild = (hasParentObj индивида == trigParentObj)
           (индивид является подпроцессом, если его родитель == владелец схемы)

        5. Проверить наличие hasTrig для концепта процесса в ptree:
           hasDetailingSchema = (концепт имеет vad:hasTrig)

        6. Вычислить processSubtype:
           ЕСЛИ hasDetailingSchema:
               ЕСЛИ isChild: processSubtype = DetailedChild
               ИНАЧЕ: processSubtype = DetailedExternal
           ИНАЧЕ:
               ЕСЛИ isChild: processSubtype = notDetailedChild
               ИНАЧЕ: processSubtype = notDetailedExternal
```

## OWL-правила (SWRL)

### Правило 1: NotDefinedType
```
vad:TypeProcess(?p) ^ vad:hasParentObj(?p, vad:pNotDefined)
    -> vad:processSubtype(?p, vad:NotDefinedType)
```

### Правило 2: DetailedChild
```
vad:TypeProcess(?p) ^
vad:hasParentObj(?p, ?parent) ^
vad:hasTrig(?p, ?schema) ^
vad:isSubprocessTrig(?p, ?currentTrig) ^
vad:hasParentObj(?currentTrig, ?trigParent) ^
sameAs(?parent, ?trigParent) ^
differentFrom(?parent, vad:pNotDefined)
    -> vad:processSubtype(?p, vad:DetailedChild)
```

### Правило 3: DetailedExternal
```
vad:TypeProcess(?p) ^
vad:hasParentObj(?p, ?parent) ^
vad:hasTrig(?p, ?schema) ^
vad:isSubprocessTrig(?p, ?currentTrig) ^
vad:hasParentObj(?currentTrig, ?trigParent) ^
differentFrom(?parent, ?trigParent) ^
differentFrom(?parent, vad:pNotDefined)
    -> vad:processSubtype(?p, vad:DetailedExternal)
```

### Правило 4: notDetailedChild
```
vad:TypeProcess(?p) ^
vad:hasParentObj(?p, ?parent) ^
NOT EXISTS { vad:hasTrig(?p, ?schema) } ^
vad:isSubprocessTrig(?p, ?currentTrig) ^
vad:hasParentObj(?currentTrig, ?trigParent) ^
sameAs(?parent, ?trigParent) ^
differentFrom(?parent, vad:pNotDefined)
    -> vad:processSubtype(?p, vad:notDetailedChild)
```

### Правило 5: notDetailedExternal
```
vad:TypeProcess(?p) ^
vad:hasParentObj(?p, ?parent) ^
NOT EXISTS { vad:hasTrig(?p, ?schema) } ^
vad:isSubprocessTrig(?p, ?currentTrig) ^
vad:hasParentObj(?currentTrig, ?trigParent) ^
differentFrom(?parent, ?trigParent) ^
differentFrom(?parent, vad:pNotDefined)
    -> vad:processSubtype(?p, vad:notDetailedExternal)
```

## SPARQL-правила

### SPARQL 1: Определение NotDefinedType
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

CONSTRUCT {
    ?process vad:processSubtype vad:NotDefinedType .
}
WHERE {
    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process vad:hasParentObj vad:pNotDefined .
    }
}
```

### SPARQL 2: Определение DetailedChild
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

CONSTRUCT {
    ?process vad:processSubtype vad:DetailedChild .
}
WHERE {
    # Получаем TriG типа VADProcessDia
    GRAPH ?trig {
        ?trig rdf:type vad:VADProcessDia .
        ?trig vad:hasParentObj ?trigParent .
        ?process vad:isSubprocessTrig ?trig .
    }

    # Получаем метаданные из ptree
    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process vad:hasParentObj ?processParent .
        ?process vad:hasTrig ?detailingSchema .
    }

    # Условия:
    # 1. Процесс имеет схему детализации (hasTrig)
    # 2. Родитель процесса совпадает с владельцем TriG
    # 3. Родитель != pNotDefined
    FILTER(?processParent = ?trigParent)
    FILTER(?processParent != vad:pNotDefined)
}
```

### SPARQL 3: Определение DetailedExternal
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

CONSTRUCT {
    ?process vad:processSubtype vad:DetailedExternal .
}
WHERE {
    GRAPH ?trig {
        ?trig rdf:type vad:VADProcessDia .
        ?trig vad:hasParentObj ?trigParent .
        ?process vad:isSubprocessTrig ?trig .
    }

    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process vad:hasParentObj ?processParent .
        ?process vad:hasTrig ?detailingSchema .
    }

    # Условия:
    # 1. Процесс имеет схему детализации (hasTrig)
    # 2. Родитель процесса НЕ совпадает с владельцем TriG
    # 3. Родитель != pNotDefined
    FILTER(?processParent != ?trigParent)
    FILTER(?processParent != vad:pNotDefined)
}
```

### SPARQL 4: Определение notDetailedChild
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

CONSTRUCT {
    ?process vad:processSubtype vad:notDetailedChild .
}
WHERE {
    GRAPH ?trig {
        ?trig rdf:type vad:VADProcessDia .
        ?trig vad:hasParentObj ?trigParent .
        ?process vad:isSubprocessTrig ?trig .
    }

    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process vad:hasParentObj ?processParent .
        # НЕТ vad:hasTrig
        FILTER NOT EXISTS { ?process vad:hasTrig ?schema . }
    }

    # Условия:
    # 1. Процесс НЕ имеет схемы детализации
    # 2. Родитель процесса совпадает с владельцем TriG
    # 3. Родитель != pNotDefined
    FILTER(?processParent = ?trigParent)
    FILTER(?processParent != vad:pNotDefined)
}
```

### SPARQL 5: Определение notDetailedExternal
```sparql
PREFIX vad: <http://example.org/vad#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

CONSTRUCT {
    ?process vad:processSubtype vad:notDetailedExternal .
}
WHERE {
    GRAPH ?trig {
        ?trig rdf:type vad:VADProcessDia .
        ?trig vad:hasParentObj ?trigParent .
        ?process vad:isSubprocessTrig ?trig .
    }

    GRAPH vad:ptree {
        ?process rdf:type vad:TypeProcess .
        ?process vad:hasParentObj ?processParent .
        FILTER NOT EXISTS { ?process vad:hasTrig ?schema . }
    }

    # Условия:
    # 1. Процесс НЕ имеет схемы детализации
    # 2. Родитель процесса НЕ совпадает с владельцем TriG
    # 3. Родитель != pNotDefined
    FILTER(?processParent != ?trigParent)
    FILTER(?processParent != vad:pNotDefined)
}
```

## Логические нестыковки и их устранение

### Нестыковка 1: Один процесс в нескольких TriG с разными подтипами

**Проблема:** Один и тот же концепт процесса может присутствовать как индивид в нескольких TriG одновременно. При этом в одном TriG он может быть `DetailedChild`, а в другом - `DetailedExternal`.

**Пример из Trig_VADv5:**
- `vad:p1.1` присутствует как индивид в `vad:t_p1` (родительская схема) и в `vad:t_p2` (внешняя схема)
- В `vad:t_p1`: `vad:p1.1` -> `DetailedChild` (т.к. `hasParentObj(p1.1) = p1`, а `hasParentObj(t_p1) = p1`)
- В `vad:t_p2`: `vad:p1.1` -> `DetailedExternal` (т.к. `hasParentObj(p1.1) = p1`, а `hasParentObj(t_p2) = p2`)

**Решение:**
`processSubtype` должен вычисляться для каждой пары (процесс, TriG), а не глобально для процесса.

Формат хранения в virtualRDFdata:
```turtle
vad:vt_p1 {
    vad:t_p1 rdf:type vad:Virtual .
    vad:p1.1 vad:processSubtype vad:DetailedChild .
}

vad:vt_p2 {
    vad:t_p2 rdf:type vad:Virtual .
    vad:p1.1 vad:processSubtype vad:DetailedExternal .
}
```

### Нестыковка 2: Процесс без vad:isSubprocessTrig

**Проблема:** Если процесс определён в `ptree`, но не имеет `vad:isSubprocessTrig` ни в одном VADProcessDia, то для него нельзя определить подтип.

**Решение:**
- `processSubtype` вычисляется ТОЛЬКО для индивидов процессов (тех, у которых есть `vad:isSubprocessTrig`)
- Концепты процессов в `ptree` не имеют `processSubtype` - это свойство только индивидов

### Нестыковка 3: TriG без hasParentObj

**Проблема:** Если у TriG типа VADProcessDia не указан `vad:hasParentObj`, невозможно определить, является ли процесс Child или External.

**Решение:**
- При создании нового TriG через "New TriG (VADProcessDia)" `vad:hasParentObj` устанавливается автоматически
- При валидации данных выводится ошибка, если VADProcessDia не имеет `hasParentObj`
- В таком случае всем индивидам присваивается `notDetailedExternal` (как fallback)

### Нестыковка 4: Циклические ссылки в hasParentObj

**Проблема:** Теоретически возможна ситуация, когда `p1.hasParentObj = p2` и `p2.hasParentObj = p1`.

**Решение:**
- Валидация данных должна проверять отсутствие циклов в иерархии `hasParentObj`
- При обнаружении цикла выводится ошибка
- Корректная иерархия: все пути по `hasParentObj` должны заканчиваться на `vad:ptree` или `vad:rtree`

### Нестыковка 5: pNotDefined как часть иерархии

**Проблема:** Процесс `vad:pNotDefined` определён как специальный маркер для процессов с неопределённым родителем, но сам `pNotDefined` тоже является процессом.

**Решение:**
- `vad:pNotDefined` должен иметь `hasParentObj = vad:ptree` (корень дерева процессов)
- `vad:pNotDefined` не может иметь `vad:hasTrig` (не детализируется)
- Все процессы с `hasParentObj = pNotDefined` получают подтип `NotDefinedType`

## Ожидаемые результаты для Trig_VADv5

На основе данных из примера `Trig_VADv5`, ожидаются следующие значения `processSubtype`:

### В vad:vt_p1 (виртуальный двойник vad:t_p1):
| Процесс | hasParentObj | hasTrig? | Подтип |
|---------|--------------|----------|--------|
| p1.1 | p1 | t_p1.1 | **DetailedChild** |
| p1.2 | p1 | - | **notDetailedChild** |

### В vad:vt_p1.1 (виртуальный двойник vad:t_p1.1):
| Процесс | hasParentObj | hasTrig? | Подтип |
|---------|--------------|----------|--------|
| p1.1.1 | p1.1 | - | **notDetailedChild** |
| p1.1.2 | p1.1 | - | **notDetailedChild** |

### В vad:vt_p2 (виртуальный двойник vad:t_p2):
| Процесс | hasParentObj | hasTrig? | trigParentObj | Подтип |
|---------|--------------|----------|---------------|--------|
| p2.1 | p2 | - | p2 | **notDetailedChild** |
| p2.2 | p2 | - | p2 | **notDetailedChild** |
| p1.1 | p1 | t_p1.1 | p2 | **DetailedExternal** |
| p1.1.1 | p1.1 | - | p2 | **notDetailedExternal** |
| px.x | pNotDefined | - | - | **NotDefinedType** |

## Формат virtualRDFdata (согласно issue #185)

```turtle
# Виртуальный контейнер для vad:t_p1
vad:vt_p1 {
    # Свойства самого виртуального TriG
    vad:t_p1 rdf:type vad:Virtual .

    # Вычисленные свойства подпроцессов
    vad:p1.1 vad:processSubtype vad:DetailedChild .
    vad:p1.2 vad:processSubtype vad:notDetailedChild .
}

# Виртуальный контейнер для vad:t_p1.1
vad:vt_p1.1 {
    vad:t_p1.1 rdf:type vad:Virtual .

    vad:p1.1.1 vad:processSubtype vad:notDetailedChild .
    vad:p1.1.2 vad:processSubtype vad:notDetailedChild .
}

# Виртуальный контейнер для vad:t_p2
vad:vt_p2 {
    vad:t_p2 rdf:type vad:Virtual .

    vad:p2.1 vad:processSubtype vad:notDetailedChild .
    vad:p2.2 vad:processSubtype vad:notDetailedChild .
    vad:p1.1 vad:processSubtype vad:DetailedExternal .
    vad:p1.1.1 vad:processSubtype vad:notDetailedExternal .
    vad:pх.х vad:processSubtype vad:NotDefinedType .
}
```

**Важно:**
- Для `ptree` и `rtree` виртуальные контейнеры НЕ создаются
- `vad:hasTrig` НЕ включается в виртуальные данные (только `processSubtype`)
