<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->

# Модуль 5_publisher -- Publisher (визуализация)

## Назначение

Главный модуль визуализации RDF данных. Генерирует DOT-код из RDF квадов с учетом режима визуализации, рендерит SVG графы через Viz.js (Graphviz), отображает дерево TriG графов для навигации, поддерживает масштабирование, выбор узлов и отображение свойств узлов во всплывающих панелях.

Модуль поддерживает несколько режимов визуализации:
- **vad-trig** -- VAD диаграмма с иерархией TriG графов (основной режим)
- **vad** -- VAD диаграмма без иерархии
- **notation** -- стандартная нотация RDF
- **aggregation** -- агрегированное представление
- **base** -- базовое представление

## Файлы модуля

| Файл | Назначение |
|---|---|
| `5_publisher_ui.js` | UI функции: область SVG, масштабирование (zoom), панели свойств узлов, обработчики кликов |
| `5_publisher_logic.js` | Логика визуализации: `visualize()`, `rdfToDotVAD()`, генерация DOT-кода, стили узлов и ребер |
| `5_publisher_sparql.js` | SPARQL запросы для визуализации (фильтрация данных) |
| `5_publisher_trig.js` | Работа с деревом TriG: построение и отображение иерархии TriG графов, выбор TriG для визуализации |

## Ключевые функции

### Основная логика (5_publisher_logic.js)

- **visualize()** -- главная функция визуализации. Оркестрирует весь процесс от парсинга данных до отображения SVG. Подробное описание см. в [important_functions.md](important_functions.md#2-visualize)
- **rdfToDotVAD(quads, prefixes, trigUri)** -- генерация DOT-кода для VAD диаграмм. Подробное описание см. в [important_functions.md](important_functions.md#3-rdftodotvad)
- **rdfToDot(quads, prefixes)** -- генерация DOT-кода для стандартных режимов визуализации

### UI (5_publisher_ui.js)

- **applyZoom() / zoomIn() / zoomOut() / zoomReset() / zoomFit()** -- управление масштабированием SVG
- **showNodeProperties(nodeUri)** -- отображение панели свойств выбранного узла
- **addNodeClickHandlers()** -- добавление обработчиков кликов на узлы SVG

### Дерево TriG (5_publisher_trig.js)

- **buildTrigTree(hierarchy)** -- построение HTML-дерева TriG графов
- **selectTrigNode(trigUri)** -- выбор TriG графа для визуализации

## Стили узлов

Модуль использует систему стилей для разных типов узлов:
- Процессы (`vad:TypeProcess`) -- различные стили в зависимости от подтипа (Detailed, notDetailed и др.)
- Исполнители (`vad:TypeExecutor`) -- стиль исполнителя
- Группы исполнителей (`vad:ExecutorGroup`) -- стиль группы
- Схемы процессов (`vad:VADProcessDia`) -- стиль TriG

## Зависимости от других модулей

- **9_vadlib** -- глобальные переменные, утилиты (`getPrefixedName`, `escapeDotString`, `generateNodeId`), конфигурация фильтров и стилей
- **2_triplestore** -- текущие RDF данные, иерархия TriG, подтипы процессов
- **Viz.js** -- внешняя библиотека для рендеринга DOT-кода в SVG

## Расширение модуля

- **Новый режим визуализации:** добавьте функцию генерации DOT-кода в `5_publisher_logic.js` и вариант выбора в UI
- **Новые стили узлов:** расширьте конфигурацию стилей в `5_publisher_logic.js` или `9_vadlib/vadlib.js`
- **Новые SPARQL запросы для фильтрации:** добавьте в `5_publisher_sparql.js`
