# Smart Design - Справка по работе

Данный файл содержит описание алгоритма работы с окном Smart Design, включая взаимосвязь справочников, выполняемые проверки и последовательность действий.

## 1. Общее описание

**Smart Design** - это интерфейс для создания SPARQL-запросов на добавление триплетов в RDF-данные. Интерфейс поддерживает работу с VAD (Value Added Diagram) онтологией и обеспечивает контекстную фильтрацию справочников.

### 1.1 Структура окна Smart Design

```mermaid
flowchart TB
    subgraph SD[Smart Design Panel]
        direction TB
        TRIG[TriG: выбор именованного графа]
        SUBJECT[Subject: выбор субъекта]
        SUBTYPE[Subject Type: выбор типа субъекта]
        PRED[Predicate: выбор предиката]
        OBJ[Object: выбор объекта/литерала]
        BTNS[Кнопки: New TriG, Создать SPARQL, etc.]
        MODE[Режим: Фильтр / Полный]
    end

    subgraph RS[Result in SPARQL Panel]
        QUERY[Текстовое поле SPARQL-запроса]
        APPLY[Кнопки применения]
    end

    TRIG --> SUBJECT
    TRIG --> SUBTYPE
    SUBJECT --> SUBTYPE
    SUBTYPE --> PRED
    PRED --> OBJ
    SD --> RS
```

## 2. Связанные справочники

Справочники в Smart Design взаимосвязаны и зависят друг от друга:

```mermaid
flowchart LR
    subgraph DEPS[Зависимости справочников]
        TRIG[TriG] --> |определяет доступные| SUBTYPE[Subject Type]
        TRIG --> |фильтрует| SUBJECT[Subject]
        SUBTYPE --> |фильтрует| PRED[Predicate]
        PRED --> |может фильтровать| OBJ[Object]
        SUBJECT --> |автоопределение| SUBTYPE
    end
```

### 2.1 Влияние выбора TriG

| Выбранный TriG | Доступные Subject Type | Доступные Subject |
|----------------|------------------------|-------------------|
| vad:ptree | vad:Process, vad:ProcessTree | Все Process из данных |
| vad:rtree | vad:Executor, vad:ExecutorTree | Все Executor из данных |
| VADProcessDia | vad:Process, vad:ExecutorGroup, vad:VADProcessDia | Все субъекты |

### 2.2 Влияние выбора Subject Type на Predicate

```mermaid
flowchart TB
    subgraph PT[Subject Type: vad:Process]
        direction TB
        subgraph PTREE_CTX[В контексте ptree]
            P1["rdf:type"]
            P2["rdfs:label"]
            P3["dcterms:description"]
            P4["vad:hasTrig"]
        end
        subgraph VAD_CTX[В контексте VADProcessDia]
            P5["vad:isSubprocessTrig"]
            P6["vad:hasExecutor"]
            P7["vad:processSubtype"]
            P8["vad:hasNext"]
        end
    end

    subgraph ET[Subject Type: vad:Executor]
        direction TB
        subgraph RTREE_CTX[В контексте rtree]
            E1["rdf:type"]
            E2["rdfs:label"]
        end
    end

    subgraph EG[Subject Type: vad:ExecutorGroup]
        direction TB
        subgraph EG_CTX[В контексте VADProcessDia]
            G1["rdf:type"]
            G2["rdfs:label"]
            G3["vad:includes"]
        end
    end
```

## 3. Режимы работы

Smart Design поддерживает два режима работы:

### 3.1 Режим "Фильтр" (по умолчанию)

- Справочник Predicate фильтруется по выбранному Subject Type
- Показываются только допустимые предикаты для данного типа субъекта
- Обеспечивает соответствие онтологии

### 3.2 Режим "Полный"

- Справочники отображают полный набор значений
- Нет фильтрации по типу субъекта
- Используется для нестандартных операций

Переключение режимов осуществляется кнопкой **"Режим: Фильтр"** / **"Режим: Полный"**.

## 4. Алгоритм создания триплета

### 4.1 Блок-схема алгоритма

```mermaid
flowchart TD
    START([Начало]) --> SELECT_TRIG[1. Выбрать TriG]
    SELECT_TRIG --> TRIG_TYPE{Тип TriG?}

    TRIG_TYPE -->|ptree| PTREE_MODE[Режим ptree]
    TRIG_TYPE -->|rtree| RTREE_MODE[Режим rtree]
    TRIG_TYPE -->|VADProcessDia| VAD_MODE[Режим VADProcessDia]

    PTREE_MODE --> SELECT_SUBJECT[2. Выбрать Subject]
    RTREE_MODE --> SELECT_SUBJECT
    VAD_MODE --> SELECT_SUBJECT

    SELECT_SUBJECT --> NEW_SUBJECT{Новый Subject?}

    NEW_SUBJECT -->|Да| CREATE_CONCEPT{Создать концепт?}
    NEW_SUBJECT -->|Нет| AUTO_TYPE[Автоопределение типа]

    CREATE_CONCEPT -->|ptree| NEW_PROCESS[Создать новый Process]
    CREATE_CONCEPT -->|rtree| NEW_EXECUTOR[Создать новый Executor]
    CREATE_CONCEPT -->|VADProcessDia| CHECK_CONCEPT[Проверить наличие концепта]

    CHECK_CONCEPT --> CONCEPT_EXISTS{Концепт существует?}
    CONCEPT_EXISTS -->|Нет| ERROR_NO_CONCEPT[Ошибка: сначала создайте концепт]
    CONCEPT_EXISTS -->|Да| CREATE_INDIVIDUAL[Создать индивид]

    NEW_PROCESS --> SELECT_TYPE[3. Выбрать Subject Type]
    NEW_EXECUTOR --> SELECT_TYPE
    CREATE_INDIVIDUAL --> SELECT_TYPE
    AUTO_TYPE --> SELECT_TYPE

    SELECT_TYPE --> SELECT_PRED[4. Выбрать Predicate]
    SELECT_PRED --> SELECT_OBJ[5. Выбрать Object]
    SELECT_OBJ --> GENERATE[6. Сгенерировать SPARQL]
    GENERATE --> APPLY{7. Применить?}

    APPLY -->|Да| EXECUTE[Выполнить SPARQL]
    APPLY -->|Нет| EDIT[Редактировать вручную]

    EXECUTE --> END([Конец])
    EDIT --> EXECUTE

    ERROR_NO_CONCEPT --> END

    style ERROR_NO_CONCEPT fill:#f99
```

### 4.2 Пошаговая инструкция

1. **Выбор TriG** - выберите именованный граф, в который будет добавлен триплет
2. **Выбор Subject** - выберите существующий субъект или создайте новый (New)
3. **Выбор Subject Type** - укажите тип субъекта (автоматически определяется для существующих)
4. **Выбор Predicate** - выберите предикат из отфильтрованного списка
5. **Выбор Object** - выберите объект или создайте новый литерал
6. **Создание SPARQL** - нажмите "Создать SPARQL" для генерации запроса
7. **Применение** - нажмите "Применить" для выполнения запроса

## 5. Создание концептов и индивидов

### 5.1 Концепт vs Индивид

```mermaid
flowchart LR
    subgraph CONCEPT[Концепт в ptree/rtree]
        C1[vad:p1 rdf:type vad:Process]
        C2[vad:p1 rdfs:label Процесс 1]
        C3[vad:p1 vad:hasTrig vad:t_p1]
    end

    subgraph INDIVIDUAL[Индивид в VADProcessDia]
        I1[vad:p1 vad:isSubprocessTrig vad:t_pGA]
        I2[vad:p1 vad:hasExecutor vad:ExecutorGroup_p1]
        I3[vad:p1 vad:processSubtype vad:DetailedChild]
    end

    CONCEPT -->|"Один концепт может использоваться"| INDIVIDUAL
    CONCEPT -->|"в нескольких схемах"| INDIVIDUAL2[Индивид в другом VADProcessDia]
```

### 5.2 Правила создания

#### Создание концепта (в ptree)
1. Выберите TriG = `vad:ptree`
2. Нажмите "New" в поле Subject
3. Введите имя нового процесса
4. Subject Type автоматически = `vad:Process`
5. Добавьте необходимые свойства (rdfs:label, dcterms:description, vad:hasTrig)

#### Создание индивида (в VADProcessDia)
1. Выберите TriG = схема процесса (например, `vad:t_pGA`)
2. Выберите существующий концепт из ptree
3. Subject Type = `vad:Process`
4. **ВАЖНО**: Первым добавляется `vad:isSubprocessTrig`
5. Затем добавляется `vad:hasExecutor` с автоматически созданной ExecutorGroup

### 5.3 Правило формирования ID для ExecutorGroup

При создании нового индивида Process в VADProcessDia автоматически создается связанный объект ExecutorGroup:

```
ID ExecutorGroup = "ExecutorGroup_" + ID процесса
```

Пример:
```turtle
vad:Process2 vad:hasExecutor vad:ExecutorGroup_Process2 .
vad:ExecutorGroup_Process2 rdf:type vad:ExecutorGroup ;
    rdfs:label "Группа исполнителей процесса Process2" ;
    vad:includes vad:Executor1 .
```

## 6. Выполняемые проверки

### 6.1 При создании нового индивида Process

```mermaid
flowchart TD
    START([Создание индивида Process]) --> CHECK1{Существует ли концепт в ptree?}
    CHECK1 -->|Нет| ERROR1[Ошибка: сначала создайте концепт в ptree]
    CHECK1 -->|Да| CHECK2{Выбран vad:isSubprocessTrig?}
    CHECK2 -->|Нет| WARN1[Предупреждение: рекомендуется добавить isSubprocessTrig первым]
    CHECK2 -->|Да| CHECK3{Существует ли ExecutorGroup?}
    CHECK3 -->|Нет| CREATE_EG[Автоматически создать ExecutorGroup]
    CHECK3 -->|Да| OK[Продолжить]
    CREATE_EG --> OK
    WARN1 --> OK
    OK --> END([Конец])
    ERROR1 --> END
```

### 6.2 Проверки уникальности

- При создании нового Subject проверяется уникальность имени
- При создании нового литерала проверка уникальности не выполняется

## 7. Сводная таблица «Объект-Предикат»

Данная таблица определяет допустимые предикаты для каждого типа объекта (см. Приложение 1 к онтологии):

| Тип объекта (Subject Type) | Контекст TriG | Допустимые предикаты |
|---------------------------|---------------|----------------------|
| vad:Process | ptree | rdf:type, rdfs:label, dcterms:description, vad:hasTrig |
| vad:Process | VADProcessDia | vad:isSubprocessTrig, vad:hasExecutor, vad:processSubtype, vad:hasNext |
| vad:Executor | rtree | rdf:type, rdfs:label |
| vad:ExecutorGroup | VADProcessDia | rdf:type, rdfs:label, vad:includes |
| vad:VADProcessDia | VADProcessDia | rdf:type, rdfs:label, vad:hasParentTrig, vad:definesProcess |
| vad:ProcessTree | ptree | rdf:type, rdfs:label, vad:hasParentTrig |
| vad:ExecutorTree | rtree | rdf:type, rdfs:label, vad:hasParentTrig |

## 8. Связанные файлы

- [vad-basic-ontology.ttl](vad-basic-ontology.ttl) - файл онтологии с приложениями
- [term.md](term.md) - терминологический словарь
- [vad-basic-ontology.mermaid.md](vad-basic-ontology.mermaid.md) - графическое представление онтологии
- [index.html](index.html) - основное приложение RDF Grapher

## 9. Горячие клавиши и кнопки

| Кнопка | Действие |
|--------|----------|
| New TriG | Открыть диалог создания нового TriG-контейнера |
| Создать SPARQL | Сгенерировать SPARQL INSERT запрос |
| Создать SPARQL (prefix) | Сгенерировать SPARQL с prefix-объявлениями |
| Удалить триплет | Сгенерировать SPARQL DELETE запрос |
| Очистить | Очистить все поля формы |
| Режим: Фильтр/Полный | Переключить режим фильтрации справочников |
| Применить как Simple Triple | Добавить триплет в простом формате |
| Применить как Shorthand Triple | Добавить триплет в сокращенном формате |

## 10. Типичные сценарии использования

### 10.1 Добавление нового процесса на схему

1. Создайте концепт процесса в `vad:ptree`:
   - TriG: `vad:ptree`
   - Subject: New -> введите имя (например, `myProcess`)
   - Subject Type: `vad:Process`
   - Predicate: `rdf:type` -> Object: `vad:Process`
   - Predicate: `rdfs:label` -> Object: New -> "Мой процесс"

2. Добавьте индивид на схему `vad:t_pGA`:
   - TriG: `vad:t_pGA`
   - Subject: `vad:myProcess`
   - Subject Type: `vad:Process`
   - Predicate: `vad:isSubprocessTrig` -> Object: `vad:t_pGA`
   - Predicate: `vad:hasExecutor` -> Object: `vad:ExecutorGroup_myProcess`
   - Predicate: `vad:processSubtype` -> Object: `vad:Basic`

### 10.2 Добавление связи между процессами

1. TriG: выберите схему процесса (например, `vad:t_pGA`)
2. Subject: выберите исходный процесс (например, `vad:Process1`)
3. Subject Type: `vad:Process`
4. Predicate: `vad:hasNext`
5. Object: выберите целевой процесс (например, `vad:Process2`)
6. Нажмите "Создать SPARQL" и "Применить"
