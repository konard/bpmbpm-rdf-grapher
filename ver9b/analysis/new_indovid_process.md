<!-- PR #296 | 2026-02-05 -->
<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/295 -->

# Анализ именования идентификаторов индивидов процессов

## Постановка проблемы

При создании Индивида процесса мы размещаем его в TriG схемы с именем (ID) концепта процесса. Когда в схеме всего один индивид процесса одного концепта — это удобно и хорошо работает, но когда два и более индивида одного концепта в рамках одной схемы процесса (одного TriG типа `vad:VADProcessDia`), то непонятно, как задавать ID второму и последующему индивиду одного концепта.

### Требование

ID индивида должен быть основан на ID концепта.

## Анализ подходов в других программах

### 1. Microsoft Visio

**Источник**: [Shape.Name property (Visio) - Microsoft Learn](https://learn.microsoft.com/en-us/office/vba/api/visio.shape.name), [Referencing Visio Shapes - bVisual](https://bvisual.net/2021/01/02/referencing-visio-shapes/)

**Механизм именования**:
- Visio присваивает уникальные имена всем фигурам на странице, используя формат **`имя.номер`**, где номер обычно является Shape ID фигуры
- При дублировании фигуры с именем "Bob", результат: "Bob", "Bob.6", "Bob.7"
- Числа после точки представляют Shape ID фигуры

**Особенность**: Если фигура имеет имя с искусственным индексом (например, "Steve.736"), при дублировании Visio создаёт "Steve.9", а не "Steve.736.9" — он удаляет искусственный индекс и добавляет следующий доступный ID.

**Ограничение**: Значения Name и NameU должны быть уникальными в коллекции фигур.

### 2. ARIS ToolSet

**Источник**: [Duplication of names for an object - ARIS BPM Community](https://ariscommunity.com/users/aminaniras/2024-02-21-duplication-names-object), [ARIS Naming Convention - ARIS BPM Community](https://www.ariscommunity.com/users/talalmlk/2012-02-12-aris-naming-convention)

**Механизм**:
- ARIS различает **Definition** (определение объекта) и **Occurrence** (вхождение на диаграмме)
- Несколько вхождений (occurrences) одного объекта на разных диаграммах ссылаются на одно и то же Definition
- При копировании как "Definition copy" создаётся новый объект с теми же атрибутами, но уникальным идентификатором
- Поддерживается поиск объектов с дублирующимися именами и их консолидация

**Подход к повторам**: ARIS рекомендует использовать одно Definition с несколькими Occurrences, а не создавать несколько объектов с одинаковыми именами.

### 3. yEd Graph Editor

**Источник**: [yedextended - PyPI](https://pypi.org/project/yedextended/), [N2G yEd Module](https://n2g.readthedocs.io/en/latest/diagram_plugins/yEd%20Module.html)

**Механизм**:
- yEd различает **node ID** (уникальный идентификатор) и **node label** (отображаемое имя)
- Допускаются дублирующиеся label при уникальных ID
- Библиотека yEdExtended поддерживает дублирующиеся имена на разных уровнях графа, сохраняя уникальные ID
- При обработке дубликатов: действие по умолчанию — `skip` (пропуск), альтернатива — `update`

### 4. draw.io (diagrams.net)

**Источник**: [Duplicate a shape - draw.io](https://www.drawio.com/doc/faq/shape-duplicate), [No custom ID numbering option - GitHub Issue](https://github.com/jgraph/drawio/issues/1125)

**Механизм**:
- Все фигуры и коннекторы имеют уникальный идентификатор (ID)
- ID можно изменить вручную (Ctrl/Cmd + двойной клик)
- При изменении система проверяет уникальность
- Автоматическая генерация ID для дубликатов не документирована подробно

## Сравнительная таблица подходов

| Программа | Подход к ID | Формат | Автоматическая генерация |
|-----------|-------------|--------|--------------------------|
| MS Visio | Суффикс-номер | `имя.ShapeID` | Да, автоматически |
| ARIS | Definition + Occurrence | Уникальный GUID | Разделение понятий |
| yEd | ID отдельно от label | Уникальный ID | Да, внутренний |
| draw.io | Уникальный ID | Автогенерация | Да, проверка уникальности |

## Варианты решения для RDF Grapher

### Вариант 1: Суффикс с порядковым номером (как MS Visio)

**Формат**: `{conceptId}_{порядковый_номер}`

**Пример**:
- Первый индивид: `pGA` (без суффикса)
- Второй индивид: `pGA_2`
- Третий индивид: `pGA_3`

**Алгоритм расчёта номера**:
```javascript
function generateIndividualId(conceptId, trigUri) {
    // Ищем существующие индивиды этого концепта в данном TriG
    const existingIndividuals = findIndividualsOfConcept(conceptId, trigUri);

    if (existingIndividuals.length === 0) {
        return conceptId; // Первый индивид без суффикса
    }

    // Находим максимальный номер
    let maxNumber = 1;
    existingIndividuals.forEach(ind => {
        const match = ind.id.match(/_(\d+)$/);
        if (match) {
            maxNumber = Math.max(maxNumber, parseInt(match[1]));
        }
    });

    return `${conceptId}_${maxNumber + 1}`;
}
```

**Плюсы**:
- Интуитивно понятно
- Аналогично MS Visio
- ID основан на концепте

**Минусы**:
- При удалении промежуточного индивида образуются "дыры" в нумерации
- Необходим SPARQL запрос для поиска максимального номера

### Вариант 2: Суффикс с UUID (как ARIS GUID)

**Формат**: `{conceptId}_{shortUUID}`

**Пример**:
- `pGA_a1b2c3`
- `pGA_d4e5f6`

**Плюсы**:
- Гарантированная уникальность
- Нет "дыр" при удалении

**Минусы**:
- Менее читаемые ID
- Сложнее отследить порядок создания

### Вариант 3: Суффикс с временной меткой

**Формат**: `{conceptId}_{timestamp}`

**Пример**:
- `pGA_20260205T043500`
- `pGA_20260205T043512`

**Плюсы**:
- Уникальность + хронология
- ID основан на концепте

**Минусы**:
- Длинные ID
- Менее читаемые

### Вариант 4: Префикс "i_" + порядковый номер в рамках TriG

**Формат**: `i_{conceptId}` или `i_{conceptId}_{номер}`

**Пример**:
- Первый: `i_pGA`
- Второй: `i_pGA_2`

**Плюсы**:
- Явное отличие индивида от концепта по префиксу "i_"
- Совместимость с текущей конвенцией `t_` для TriG

**Минусы**:
- Добавляет длину к ID

## Рекомендуемое решение

**Вариант 1** (суффикс с порядковым номером) как основной подход, аналогично MS Visio:

1. Первый индивид концепта в TriG: `{conceptId}` (без суффикса)
2. Второй и последующие: `{conceptId}_{N}`, где N — следующий свободный номер

**Алгоритм**:
1. При создании индивида выполняем SPARQL запрос для поиска существующих индивидов данного концепта в целевом TriG
2. Если индивидов нет — используем ID концепта напрямую
3. Если есть — находим максимальный суффикс и добавляем +1

**Пример SPARQL для поиска существующих индивидов**:
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX vad: <http://example.org/vad#>

SELECT ?individual WHERE {
    GRAPH vad:t_pGA {
        ?individual rdf:type vad:pGA .
    }
}
```

## Дополнительные рекомендации

1. **Валидация**: Перед созданием проверять уникальность ID в рамках TriG
2. **Миграция**: Существующие данные с единственным индивидом не требуют изменений
3. **Интерфейс**: Показывать пользователю предлагаемый ID с возможностью редактирования
4. **Документация**: Обновить `important_functions.md` с описанием алгоритма

## Ссылки

- [MS Visio Shape.Name property - Microsoft Learn](https://learn.microsoft.com/en-us/office/vba/api/visio.shape.name)
- [Referencing Visio Shapes - bVisual](https://bvisual.net/2021/01/02/referencing-visio-shapes/)
- [ARIS Naming Convention - ARIS BPM Community](https://www.ariscommunity.com/users/talalmlk/2012-02-12-aris-naming-convention)
- [yedextended - PyPI](https://pypi.org/project/yedextended/)
- [Duplicate a shape - draw.io](https://www.drawio.com/doc/faq/shape-duplicate)
