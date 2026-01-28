# Предложения по соответствию ARIS ToolSet и методологии ARIS

Данный документ содержит предложения для доработки проекта [rdf-grapher](https://github.com/bpmbpm/rdf-grapher) в части кода и онтологии для более близкого соответствия ARIS ToolSet и методологии ARIS в части верхнеуровневых процессов.

---

## 1. Соответствие нотации VAD (Value-Added Chain Diagram)

### 1.1 Текущее состояние

Текущая реализация поддерживает основные элементы VAD нотации:
- Процессы (`vad:TypeProcess`) с иерархией подтипов
- Цепочки процессов через `vad:hasNext`
- Детализация процессов через `vad:hasTrig`
- Группы исполнителей (`vad:ExecutorGroup`)

### 1.2 Предложения по улучшению

#### 1.2.1 Добавить типизацию процессов по ARIS

В методологии ARIS различают несколько типов процессов на VAD диаграммах:

| Тип в ARIS | Предлагаемый URI | Описание |
|------------|------------------|----------|
| Процесс | `vad:Process` | Стандартный процесс |
| Управляющий процесс | `vad:ManagementProcess` | Процессы управления |
| Поддерживающий процесс | `vad:SupportProcess` | Вспомогательные процессы |
| Основной процесс | `vad:CoreProcess` | Ключевые бизнес-процессы |

**Предложение для онтологии:**
```turtle
vad:ProcessCategory rdf:type rdfs:Class ;
    rdfs:label "Категория процесса" .

vad:ManagementProcess rdfs:subClassOf vad:ProcessCategory ;
    rdfs:label "Управляющий процесс" .

vad:CoreProcess rdfs:subClassOf vad:ProcessCategory ;
    rdfs:label "Основной процесс" .

vad:SupportProcess rdfs:subClassOf vad:ProcessCategory ;
    rdfs:label "Поддерживающий процесс" .

vad:hasProcessCategory rdf:type rdf:Property ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:ProcessCategory ;
    rdfs:label "Категория процесса" .
```

#### 1.2.2 Поддержка Function Tree (Дерево функций)

ARIS использует Function Tree для иерархической декомпозиции функций. Текущий `vad:ptree` частично выполняет эту роль.

**Предложения:**
1. Добавить предикат `vad:hasParentProcess` для иерархии процессов в дереве `vad:ptree`
2. Добавить автоматическую нумерацию процессов (например, 1, 1.1, 1.1.1)
3. Добавить визуализацию дерева функций в режиме `vad` (не только `vad-trig`)

**Предложение для онтологии:**
```turtle
vad:hasParentProcess rdf:type rdf:Property ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:TypeProcess ;
    rdfs:label "Родительский процесс" ;
    rdfs:comment "Указывает на родительский процесс в иерархии Function Tree" .

vad:processNumber rdf:type rdf:Property ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range xsd:string ;
    rdfs:label "Номер процесса" ;
    rdfs:comment "Иерархический номер процесса (например, 1.2.3)" .
```

---

## 2. Соответствие архитектуре ARIS

### 2.1 ARIS House (Дом ARIS)

Методология ARIS определяет пять видов (views):
1. **Organization View** — организационная структура
2. **Data View** — структура данных
3. **Function View** — функции (процессы)
4. **Output View** — продукты и услуги
5. **Control View** — интеграция всех видов

### 2.2 Предложения по расширению онтологии

#### 2.2.1 Organization View

Текущий `vad:rtree` (Executor Tree) частично реализует Organization View.

**Предложения:**
1. Добавить иерархию организационных единиц
2. Добавить типы исполнителей (роль, должность, подразделение)

```turtle
vad:ExecutorType rdf:type rdfs:Class ;
    rdfs:label "Тип исполнителя" .

vad:Role rdfs:subClassOf vad:ExecutorType ;
    rdfs:label "Роль" .

vad:Position rdfs:subClassOf vad:ExecutorType ;
    rdfs:label "Должность" .

vad:OrgUnit rdfs:subClassOf vad:ExecutorType ;
    rdfs:label "Подразделение" .

vad:hasExecutorType rdf:type rdf:Property ;
    rdfs:domain vad:TypeExecutor ;
    rdfs:range vad:ExecutorType .

vad:hasParentOrgUnit rdf:type rdf:Property ;
    rdfs:domain vad:TypeExecutor ;
    rdfs:range vad:TypeExecutor ;
    rdfs:label "Родительское подразделение" .
```

#### 2.2.2 Data View

Добавить поддержку информационных объектов (данных), которые обрабатываются процессами.

```turtle
vad:DataObject rdf:type rdfs:Class ;
    rdfs:label "Информационный объект" .

vad:Document rdfs:subClassOf vad:DataObject ;
    rdfs:label "Документ" .

vad:hasInput rdf:type rdf:Property ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:DataObject ;
    rdfs:label "Входной документ" .

vad:hasOutput rdf:type rdf:Property ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:DataObject ;
    rdfs:label "Выходной документ" .
```

#### 2.2.3 Output View

Добавить поддержку продуктов и услуг.

```turtle
vad:Product rdf:type rdfs:Class ;
    rdfs:label "Продукт/Услуга" .

vad:produces rdf:type rdf:Property ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:Product ;
    rdfs:label "Производит" .
```

---

## 3. Предложения по интерфейсу (UI)

### 3.1 Режимы визуализации

| Текущий режим | Предлагаемое улучшение |
|---------------|------------------------|
| `vad` | Добавить отображение категорий процессов (цвет/форма) |
| `vad-trig` | Добавить режим "Function Tree" для иерархии |

### 3.2 Smart Design

Расширить Smart Design для поддержки новых типов объектов:
1. Добавить выбор категории процесса при создании
2. Добавить выбор типа исполнителя
3. Добавить поддержку информационных объектов

### 3.3 Карточка объекта

Расширить информацию в карточке объекта:
1. Отображать категорию процесса
2. Отображать входные и выходные документы
3. Отображать иерархический номер процесса

---

## 4. Предложения по коду

### 4.1 Константы для новых типов

Добавить в `index.html`:

```javascript
const VAD_PROCESS_CATEGORIES = [
    'vad:CoreProcess',
    'vad:ManagementProcess',
    'vad:SupportProcess'
];

const VAD_EXECUTOR_TYPES = [
    'vad:Role',
    'vad:Position',
    'vad:OrgUnit'
];
```

### 4.2 Визуализация категорий процессов

Добавить разные стили для разных категорий процессов:

```javascript
const CategoryNodeStyles = {
    'CoreProcess': { fillcolor: '#4A90D9', shape: 'pentagon' },
    'ManagementProcess': { fillcolor: '#9370DB', shape: 'hexagon' },
    'SupportProcess': { fillcolor: '#90EE90', shape: 'box' }
};
```

### 4.3 Автоматическая нумерация

Добавить функцию для автоматической генерации номера процесса:

```javascript
function generateProcessNumber(parentProcessUri) {
    // Логика генерации номера на основе родительского процесса
    // Например: если родитель имеет номер "1.2",
    // то новый процесс получит "1.2.1", "1.2.2" и т.д.
}
```

---

## 5. Приоритеты реализации

### Высокий приоритет
1. Иерархия процессов через `vad:hasParentProcess`
2. Автоматическая нумерация процессов
3. Категории процессов

### Средний приоритет
1. Типы исполнителей
2. Иерархия организационных единиц
3. Улучшение Smart Design

### Низкий приоритет
1. Информационные объекты (Data View)
2. Продукты и услуги (Output View)
3. Полная интеграция видов ARIS

---

## 6. Ссылки

### ARIS методология
- [ARIS Architecture and Reference Models for Business Process Management](https://www.researchgate.net/publication/221585916_ARIS_Architecture_and_Reference_Models_for_Business_Process_Management) (2000)
- [ARIS METHOD MANUAL](https://docs.aris.com/10.0.27.0/yaa-method-guide/en/Method-Manual.pdf) — официальное руководство
  - 3.1.1.1 Function Tree (стр. 11)
  - 3.4 Process View (стр. 61)

### Примеры VAD диаграмм
- [Рис. 1.34. Модель в нотации ARIS VAD](https://studfile.net/preview/12770842/page:11/)
- [Типичные связи объектов диаграммы цепочек добавленного качества](https://portal.tpu.ru/SHARED/h/haperskaya/Materials/IT/%D0%A3%D1%87-%D0%BC%D0%B5%D1%82.ARIS%20(1).pdf)

### Связанные проекты
- [vadtordf](https://github.com/bpmbpm/vadtordf) — конвертер VAD в RDF
- [ARIS Web Publisher](http://www.bpm.processoffice.ru/) — веб-публикация ARIS моделей

---

## Примечания

Данные предложения сформированы на основе анализа:
1. Текущей онтологии `vad-basic-ontology.ttl`
2. Документации в `ver8tree/doc/`
3. Методологии ARIS и нотации VAD
4. Существующих реализаций в ARIS ToolSet

При реализации рекомендуется:
- Сохранять обратную совместимость с текущей онтологией
- Добавлять новые предикаты как опциональные
- Тестировать на существующих примерах данных
