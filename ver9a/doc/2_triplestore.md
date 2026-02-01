<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->

# Модуль 2_triplestore -- Хранилище RDF данных

## Назначение

Центральный модуль для ввода, парсинга, хранения и валидации RDF данных. Предоставляет текстовое поле для ввода данных в формате TriG, кнопки управления (Очистить, Сохранить как, Загрузить, Тест) и механизмы парсинга данных через библиотеку N3.js. Модуль строит иерархию TriG графов и вычисляет виртуальные данные (подтипы процессов).

## Файлы модуля

| Файл | Назначение |
|---|---|
| `2_triplestore_ui.js` | UI функции: текстовое поле, кнопки управления, обработчики событий, загрузка/сохранение файлов |
| `2_triplestore_logic.js` | Бизнес-логика: парсинг RDF, построение иерархии TriG, вычисление подтипов процессов, валидация |

### Подпапка 2_triplestore_test/

| Файл | Назначение |
|---|---|
| `2_triplestore_test_logic.js` | Логика автоматического тестирования: валидация VAD-схем по правилам онтологии |
| `2_triplestore_test_sparql.js` | SPARQL запросы для проверки корректности данных |

## Ключевые функции

### parseTriGHierarchy(quads, prefixes)

Парсит иерархию TriG графов из RDF квадов. Анализирует связи `vad:hasParentObj` и строит древовидную структуру от `vad:root`. Определяет типы графов: `TechTree`, `ProcessTree`, `ExecutorTree`, `VADProcessDia`, `ObjectTree`.

Подробное описание см. в [important_functions.md](important_functions.md#4-parsetrighierarchy).

### calculateProcessSubtypes(hierarchy, prefixes)

Вычисляет подтипы процессов (`Detailed`, `notDetailed`, `DetailedChild` и др.) на основе иерархии TriG и связей между процессами. Результат сохраняется в `virtualRDFdata`.

Подробное описание см. в [important_functions.md](important_functions.md#5-calculateprocesssubtypes).

### testRdfValidation()

Запускает автоматическую валидацию загруженных данных по правилам VAD-онтологии (кнопка "Тест"). Проверяет:
- Наличие обязательных предикатов (`isSubprocessTrig`, `hasParentObj`)
- Согласованность иерархии процессов
- Корректность типов и подтипов
- Наличие меток (`rdfs:label`)

### clearRdfInput() / saveAsFile() / loadFile(event)

Вспомогательные UI функции для управления содержимым текстового поля.

## Зависимости от других модулей

- **9_vadlib** -- глобальные переменные (`currentQuads`, `currentPrefixes`, `trigHierarchy`, `virtualRDFdata`), утилиты
- **N3.js** -- внешняя библиотека для парсинга RDF

## Расширение модуля

- **Новые правила валидации:** добавьте правило в `VAD_VALIDATION_RULES` в файле `2_triplestore_test_logic.js`
- **Новые форматы ввода:** расширьте логику парсинга в `2_triplestore_logic.js`
- **Новые SPARQL тесты:** добавьте запросы в `2_triplestore_test_sparql.js`
