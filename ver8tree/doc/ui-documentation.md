# UI Documentation (ver8tree)

Данный файл содержит описание всех окон, панелей, кнопок и особенностей их алгоритмов в приложении RDF Grapher (ver8tree).

---

## 1. Общая структура интерфейса

### 1.1 Иерархия UI компонентов

| Уровень | Компонент | ID/Class | Тип | Описание |
|---------|-----------|----------|-----|----------|
| 1 | Main Container | `.main-container` | Container | Основной контейнер приложения |
| 2 | Side Panel | `.side-panel` | Panel | Боковая панель с редактором |
| 3 | TriG Selector | `#trig-select` | Dropdown | Выбор активного TriG |
| 3 | Smart Design Section | `.smart-design-section` | Section | Секция Smart Design |
| 3 | TriG Tree Section | `#trig-tree-section` | Section | Секция дерева TriG |
| 3 | SPARQL Section | `#sparql-query-section` | Section | Секция SPARQL запросов |
| 3 | Input Section | `#input-section` | Section | Секция ввода TriG |
| 2 | Graph Container | `.graph-container` | Container | Контейнер графа |
| 3 | Graph Output | `#graph-output` | SVG | Вывод графа |
| 3 | Toolbar | `.toolbar` | Toolbar | Панель инструментов |
| 2 | Properties Panel | `#properties-panel` | Panel | Панель свойств узла (draggable) |
| 2 | New TriG Modal | `#new-trig-modal` | Modal | Модальное окно создания TriG |
| 2 | Test Modal | `#test-modal` | Modal | Модальное окно валидации |

---

## 2. Боковая панель (Side Panel)

### 2.1 Селектор TriG

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| TriG Dropdown | `#trig-select` | Выпадающий список для выбора активного TriG | Заполняется функцией `parseTriGHierarchy()` из текущих данных RDF |
| Show All | `#show-all-checkbox` | Чекбокс "Показать всё" | Переключает между отображением всех графов и только выбранного |

**Алгоритм `parseTriGHierarchy()`:**
1. Парсит все quads из `currentQuads`
2. Находит предикаты `vad:hasParentObj` для построения иерархии
3. Строит древовидную структуру с `vad:root` как корнем
4. Заполняет dropdown с отступами для визуализации иерархии

### 2.2 Smart Design

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| Subject Type | `#smart-design-subject-type` | Тип субъекта | Фильтрует доступные Subject и Predicate |
| Subject | `#smart-design-subject` | Субъект триплета | Заполняется в зависимости от Subject Type и контекста TriG |
| Predicate | `#smart-design-predicate` | Предикат | Фильтруется по `TYPE_PREDICATE_MAP` |
| Object | `#smart-design-object` | Объект триплета | Зависит от типа предиката |
| Create Button | — | Кнопка "Create" | Вызывает `smartDesignCreate()` |
| Apply Button | — | Кнопка "Apply" | Вызывает `smartDesignApply()` |
| New TriG Button | — | Кнопка "New TriG" | Открывает модальное окно `openNewTrigModal()` |

**Алгоритм `smartDesignCreate()`:**
1. Получает значения из dropdowns
2. Если Subject = "__NEW__", создаёт новый объект
3. Генерирует SPARQL INSERT запрос
4. Добавляет автоматически генерируемые триплеты (`generateAutoTriples()`)
5. Выполняет запрос через `executeSparqlUpdate()`
6. Обновляет визуализацию

**Алгоритм `smartDesignApply()`:**
1. Получает значения из dropdowns
2. Генерирует SPARQL INSERT DATA запрос
3. Определяет целевой граф по правилам хранения (PTREE_PREDICATES, RTREE_PREDICATES)
4. Выполняет запрос
5. Обновляет визуализацию

### 2.3 Дерево TriG (TriG Tree)

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| Tree Container | `#trig-tree` | Контейнер дерева | Отображает иерархию TriG графов |
| Tree Items | `.trig-tree-item` | Элементы дерева | Кликабельные для выбора TriG |
| Expand/Collapse | `.expand-icon` | Иконки сворачивания | Управление видимостью дочерних элементов |

**Алгоритм `buildTriGTreeHtml()`:**
1. Строит HTML-разметку дерева рекурсивно
2. Добавляет иконки для сворачивания/разворачивания
3. Выделяет активный TriG
4. Обрабатывает клики для выбора TriG

### 2.4 SPARQL секция

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| Query Input | `#sparql-query` | Текстовое поле запроса | Ввод SPARQL SELECT запросов |
| Execute Button | — | Кнопка выполнения | Вызывает `executeSparqlQuery()` |
| Results Table | `#sparql-results` | Таблица результатов | Отображает результаты SELECT |

**Алгоритм `executeSparqlQuery()`:**
1. Парсит SPARQL запрос
2. Создаёт Comunica engine с текущими данными
3. Выполняет запрос
4. Форматирует результаты в таблицу

### 2.5 Секция ввода

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| TriG Input | `#trig-input` | Текстовое поле ввода TriG | Ручной ввод/редактирование данных |
| Load Example | — | Кнопка загрузки примера | Загружает `loadExampleTrigVADv5()` |
| Visualize | — | Кнопка визуализации | Вызывает `visualize()` |

---

## 3. Область графа (Graph Container)

### 3.1 Панель инструментов (Toolbar)

| Кнопка | ID | Описание | Алгоритм |
|--------|-----|----------|----------|
| Zoom In | `#zoom-in` | Увеличение масштаба | `zoomIn()` - увеличивает `currentZoom *= 1.2` |
| Zoom Out | `#zoom-out` | Уменьшение масштаба | `zoomOut()` - уменьшает `currentZoom /= 1.2` |
| Zoom Reset | `#zoom-reset` | Сброс масштаба | `zoomReset()` - устанавливает `currentZoom = 1.0` |
| Zoom Fit | `#zoom-fit` | Подогнать под размер | `zoomFit()` - вычисляет оптимальный масштаб |
| Download SVG | `#download-svg` | Скачать SVG | `downloadSVG()` - экспорт в SVG файл |
| Download PNG | `#download-png` | Скачать PNG | `downloadPNG()` - экспорт в PNG через canvas |
| Test/Validate | `#test-btn` | Валидация данных | Открывает модальное окно валидации |

**Алгоритм зума (`applyZoom()`):**
1. Получает текущий SVG элемент
2. Применяет CSS transform: `scale(currentZoom)`
3. Центрирует граф в контейнере

**Алгоритм `zoomFit()`:**
1. Получает размеры SVG и контейнера
2. Вычисляет коэффициенты по ширине и высоте
3. Выбирает минимальный для сохранения пропорций
4. Применяет через `applyZoom()`

### 3.2 Вывод графа

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| Graph Output | `#graph-output` | SVG контейнер | Содержит визуализацию графа |
| Nodes | `.node` | Узлы графа | Кликабельные элементы |
| Edges | `.edge` | Рёбра графа | Связи между узлами |

**Алгоритм `visualize()`:**
1. Парсит TriG данные через N3.js
2. Вычисляет подтипы процессов (`calculateProcessSubtypes()`)
3. Определяет режим отображения (vad, vad-trig, base, notation, aggregation)
4. Генерирует DOT-код (`rdfToDot()`, `rdfToDotVAD()`, `rdfToDotAggregation()`)
5. Рендерит через Viz.js в SVG
6. Добавляет обработчики событий для интерактивности
7. Обновляет дерево TriG и dropdown

**Алгоритм `calculateProcessSubtypes()`:**
1. Находит все процессы с `vad:isSubprocessTrig` для текущего TriG
2. Для каждого процесса проверяет наличие `vad:hasTrig`
3. Если есть hasTrig, проверяет `vad:hasParentObj` дочернего TriG
4. Определяет подтип: DetailedChild, DetailedExternal, notDetailedChild, notDetailedExternal
5. Сохраняет в `virtualRDFdata` как синтетические quads

---

## 4. Панель свойств (Properties Panel)

### 4.1 Структура панели

| Элемент | ID/Class | Описание | Алгоритм |
|---------|----------|----------|----------|
| Panel Container | `#properties-panel` | Контейнер панели | Draggable панель |
| Header | `.properties-header` | Заголовок | Drag handle для перемещения |
| Close Button | `.close-properties` | Кнопка закрытия | Скрывает панель |
| Title | `#properties-title` | Заголовок узла | Отображает label узла |
| Content | `#properties-content` | Содержимое | Список свойств узла |

**Алгоритм `showNodeProperties(nodeId)`:**
1. Находит все quads с данным subject или object
2. Группирует по предикатам
3. Форматирует значения (URI → prefixed name)
4. Отображает в табличном виде
5. Позиционирует панель рядом с узлом

### 4.2 Интерактивность

| Событие | Обработчик | Описание |
|---------|------------|----------|
| Click on node | `handleNodeClick()` | Одиночный клик - показ свойств |
| Double-click on node | `handleNodeDoubleClick()` | Двойной клик - переход к детализации |
| Drag header | Drag handler | Перетаскивание панели |
| Click close | `closePropertiesPanel()` | Закрытие панели |

**Алгоритм `handleNodeDoubleClick(nodeId)`:**
1. Проверяет, является ли узел детализированным процессом
2. Находит TriG детализации через `vad:hasTrig`
3. Переключает `#trig-select` на найденный TriG
4. Вызывает `visualize()` для обновления графа

---

## 5. Модальные окна

### 5.1 Модальное окно создания TriG

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| Modal Container | `#new-trig-modal` | Контейнер модального окна | Overlay с формой |
| TriG ID Input | `#new-trig-id` | Поле ID нового TriG | Валидация формата URI |
| TriG Label Input | `#new-trig-label` | Поле label | Человекочитаемое название |
| Parent TriG Select | `#new-trig-parent` | Выбор родительского TriG | Иерархия через hasParentObj |
| Process Select | `#new-trig-process` | Выбор связанного процесса | Для definesProcess |
| Create Button | — | Кнопка создания | `createNewTrig()` |
| Cancel Button | — | Кнопка отмены | Закрывает модальное окно |

**Алгоритм `createNewTrig()`:**
1. Валидирует введённые данные
2. Генерирует SPARQL INSERT запрос для:
   - rdf:type vad:VADProcessDia
   - rdfs:label
   - vad:hasParentObj
   - vad:definesProcess (если выбран процесс)
3. Выполняет запрос
4. Обновляет визуализацию
5. Закрывает модальное окно

### 5.2 Модальное окно валидации

| Элемент | ID | Описание | Алгоритм |
|---------|-----|----------|----------|
| Modal Container | `#test-modal` | Контейнер | Overlay с результатами |
| Results Container | `#test-results` | Результаты | Список проверок |
| Close Button | — | Кнопка закрытия | Закрывает окно |

**Алгоритм `validateVAD()`:**
1. Проверяет наличие обязательных предикатов
2. Валидирует типы объектов
3. Проверяет целостность связей hasParentObj
4. Проверяет уникальность ID
5. Формирует отчёт с ошибками и предупреждениями

---

## 6. Режимы отображения

### 6.1 Доступные режимы

| Режим | Значение | Описание | Функция генерации |
|-------|----------|----------|-------------------|
| VAD | `vad` | VAD-нотация для схем процессов | `rdfToDotVAD()` |
| VAD-TriG | `vad-trig` | VAD с группировкой по TriG | `rdfToDotVAD()` |
| Base | `base` | Базовый режим (все триплеты) | `rdfToDot()` |
| Notation | `notation` | С нотацией типов | `rdfToDot()` |
| Aggregation | `aggregation` | Агрегация по типам | `rdfToDotAggregation()` |

### 6.2 Стили узлов (VADNodeStyles)

| Тип узла | Форма | Цвет заливки | Цвет границы |
|----------|-------|--------------|--------------|
| DetailedChild | pentagon | #4A90D9 | #2E5A8E |
| DetailedExternal | pentagon | #87CEEB | #5F9EA0 |
| notDetailedChild | pentagon | #90EE90 | #228B22 |
| notDetailedExternal | pentagon | #98FB98 | #32CD32 |
| NotDefinedType | pentagon | #D3D3D3 | #808080 |
| ExecutorGroup | box | #FFE4B5 | #DEB887 |
| Executor | ellipse | #FFF8DC | #DAA520 |
| VADProcessDia | folder | #E6E6FA | #9370DB |

### 6.3 Стили рёбер (VADEdgeStyles)

| Предикат | Стиль линии | Цвет | Стрелка |
|----------|-------------|------|---------|
| hasNext | solid | #333333 | normal |
| hasExecutor | dashed | #8B4513 | vee |
| includes | dotted | #DAA520 | diamond |
| hasTrig | bold | #9370DB | box |
| hasParentObj | dashed | #808080 | onormal |

---

## 7. Алгоритмы фильтрации

### 7.1 Фильтрация по Subject Type

**Функция: `updateSubjectsByType()`**

1. Получает выбранный Subject Type
2. Определяет контекст TriG (ptree, rtree, vadProcessDia)
3. В зависимости от типа и контекста:
   - TypeProcess в ptree → концепты из ptree
   - TypeProcess в vadProcessDia → индивиды с isSubprocessTrig
   - TypeExecutor в rtree → исполнители из rtree
   - ExecutorGroup → группы в текущем TriG
   - VADProcessDia → сам текущий TriG
4. Заполняет dropdown Subject

### 7.2 Фильтрация предикатов

**Функция: `updatePredicateBySubjectTypeWithAutoGen()`**

1. Получает Subject Type и контекст TriG
2. Загружает допустимые предикаты из `TYPE_PREDICATE_MAP`
3. Проверяет каждый предикат на автогенерацию через `isAutoGeneratedPredicate()`
4. Помечает автогенерируемые предикаты как "(авто)" и делает их disabled
5. Заполняет dropdown Predicate

### 7.3 Определение контекста TriG

**Функция: `getTrigContext(trigUri)`**

| URI | Контекст | Описание |
|-----|----------|----------|
| `vad:ptree` | `ptree` | Дерево процессов |
| `vad:rtree` | `rtree` | Дерево исполнителей |
| `vad:techtree` | `techtree` | Технологическое дерево |
| Другие | `vadProcessDia` | Схема процесса |

---

## 8. Экспорт и импорт

### 8.1 Экспорт SVG

**Функция: `downloadSVG()`**
1. Получает SVG элемент из `#graph-output`
2. Сериализует в строку через XMLSerializer
3. Создаёт Blob с MIME type `image/svg+xml`
4. Генерирует download link
5. Имитирует клик для скачивания

### 8.2 Экспорт PNG

**Функция: `downloadPNG()`**
1. Получает SVG элемент
2. Создаёт canvas с размерами SVG
3. Рисует SVG на canvas через Image
4. Конвертирует canvas в PNG через `toDataURL()`
5. Генерирует download link

### 8.3 Загрузка примера

**Функция: `loadExampleTrigVADv5()`**
1. Содержит встроенные данные примера в формате TriG
2. Загружает данные в `#trig-input`
3. Вызывает `visualize()`

---

## 9. SPARQL операции

### 9.1 SELECT запросы

**Функция: `executeSparqlQuery()`**
1. Создаёт Comunica QueryEngine
2. Парсит текущие quads в RDF store
3. Выполняет SELECT запрос
4. Итерирует результаты через bindingsStream
5. Форматирует в HTML таблицу

### 9.2 UPDATE операции

**Функция: `executeSparqlUpdate()`**
1. Парсит SPARQL INSERT/DELETE запрос
2. Применяет изменения к `currentQuads`
3. Сериализует обратно в TriG формат
4. Обновляет `#trig-input`
5. Вызывает `visualize()`

### 9.3 Получение значений через SPARQL

**Функция: `funSPARQLvalues(sparqlQuery)`**
1. Выполняет SELECT запрос
2. Возвращает массив значений из первой переменной
3. Используется для заполнения dropdowns

---

## 10. Технологическое приложение

### 10.1 Загрузка Tech Appendix

**Функция: `loadTechAppendix()`**
1. Загружает файл `vad-basic-ontology_tech_Appendix.ttl`
2. Парсит через N3.js
3. Извлекает определения автогенерируемых предикатов
4. Заполняет `techAppendixPredicates` Map
5. Обновляет UI для отображения "(авто)" предикатов

### 10.2 Проверка автогенерации

**Функция: `isAutoGeneratedPredicate(techObjectUri, predicateUri)`**
1. Проверяет наличие записи в `techAppendixPredicates`
2. Возвращает `true` если предикат автогенерируемый
3. Используется для отключения полей в Smart Design

---

## 11. Глобальные переменные

| Переменная | Тип | Описание |
|------------|-----|----------|
| `currentQuads` | Array | Текущие RDF quads |
| `currentPrefixes` | Object | Текущие префиксы |
| `currentZoom` | Number | Текущий уровень зума |
| `virtualRDFdata` | Array | Вычисляемые триплеты (processSubtype) |
| `techAppendixPredicates` | Map | Автогенерируемые предикаты из tech appendix |
| `PTREE_PREDICATES` | Array | Предикаты для ptree |
| `RTREE_PREDICATES` | Array | Предикаты для rtree |
| `TYPE_PREDICATE_MAP` | Object | Карта тип → предикаты |
| `VAD_ALLOWED_TYPES` | Array | Разрешённые типы VAD |
| `VAD_ALLOWED_PREDICATES` | Array | Разрешённые предикаты VAD |
| `VADNodeStyles` | Object | Стили узлов VAD |
| `VADEdgeStyles` | Object | Стили рёбер VAD |

---

## 12. События и обработчики

### 12.1 DOMContentLoaded

При загрузке страницы:
1. `loadTechAppendix()` - загрузка технологического приложения
2. Инициализация обработчиков событий
3. Загрузка начального примера (опционально)

### 12.2 Изменение dropdowns

| Dropdown | Событие | Обработчик |
|----------|---------|------------|
| `#trig-select` | change | `selectTriG()` → `visualize()` |
| `#smart-design-subject-type` | change | `updateSubjectsByType()`, `updatePredicateBySubjectTypeWithAutoGen()` |
| `#smart-design-subject` | change | Обновление Object dropdown |
| `#smart-design-predicate` | change | Обновление Object dropdown |

### 12.3 Клики на графе

| Элемент | Событие | Обработчик | Результат |
|---------|---------|------------|-----------|
| Node | click | `handleNodeClick()` | Показ панели свойств |
| Node | dblclick | `handleNodeDoubleClick()` | Переход к детализации |
| Edge | click | — | Нет действия |
| Background | click | `closePropertiesPanel()` | Закрытие панели свойств |

---

## Ссылки

- [Terminology Dictionary](term.md) — терминологический словарь
- [Appendix to Ontology](appendix-to-ontology.md) — приложение к онтологии
- [VAD Ontology](vad-basic-ontology.ttl) — основной файл онтологии
- [VAD Ontology Tech Appendix](vad-basic-ontology_tech_Appendix.ttl) — технологическое приложение
- [RDF Grapher ver8tree](index.html) — основное приложение
