<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->
<!-- Обновлено: issue #236 -->

# Модуль 9_vadlib -- Общая библиотека утилит

## Назначение

Общая библиотека функций обработки информации, используемая всеми модулями проекта. Содержит:
- Конфигурацию приложения (фильтры, режимы визуализации, типы VAD-онтологии, подтипы процессов)
- Глобальные переменные состояния приложения
- Вспомогательные функции общего назначения (обработка данных, работа с URI, форматирование)
- SPARQL движок для выполнения запросов к RDF данным

**Важно:** Модуль vadlib содержит только функции обработки информации, а не её визуализации. Функции формирования UI, отображения окон и стилей должны располагаться в соответствующих модулях (1_-8_). Стили каждого модуля определяются в CSS файлах, одноимённых с модулем и расположенных в папке модуля.

Модуль является фундаментом проекта: все остальные модули (1_ -- 8_) зависят от него.

## Файлы модуля

| Файл | Назначение |
|---|---|
| `vadlib.js` | Конфигурация, глобальные переменные, вспомогательные функции обработки данных |
| `vadlib_sparql.js` | SPARQL движок: `funSPARQLvalues()` и вспомогательные функции парсинга и выполнения запросов |

## Ключевые функции

### vadlib.js -- Конфигурация и утилиты

**Конфигурация:**
- `Mode` -- режим визуализации по умолчанию (`'notation'`)
- `Filter`, `FilterBase`, `FilterAggregation`, `FilterVAD` -- конфигурации фильтров предикатов
- `VAD_ALLOWED_TYPES` -- допустимые типы VAD-онтологии
- `VAD_ALLOWED_PREDICATES` -- допустимые предикаты VAD
- `PROCESS_SUBTYPES` -- подтипы процессов (Detailed, notDetailed и др.)
- `TRIG_TYPES` -- типы TriG графов (ObjectTree, TechTree, ProcessTree, ExecutorTree, VADProcessDia)
- `TYPE_PREDICATE_MAP` -- карта допустимых предикатов для каждого типа субъекта в контексте TriG

**Глобальные переменные:**
- `currentQuads` -- текущий массив RDF квадов
- `currentPrefixes` -- текущий словарь префиксов
- `currentStore` -- текущий RDF store (N3.js)
- `nodeTypesCache` -- кэш типов узлов
- `nodeSubtypesCache` -- кэш подтипов узлов
- `trigHierarchy` -- иерархия TriG графов
- `virtualRDFdata` -- виртуальные (вычисляемые) RDF данные
- `currentDotCode` -- текущий DOT-код для визуализации
- `selectedTrigUri` -- URI выбранного TriG графа

**Вспомогательные функции:**
- `getLocalName(uri)` -- извлечение локального имени из URI
- `getPrefixedName(uri, prefixes)` -- получение префиксного имени (например, `vad:pGA`)
- `escapeDotString(str)` -- экранирование строки для DOT-формата
- `generateNodeId(value)` -- генерация уникального идентификатора узла
- `generateVadNodeId(uri, prefixes)` -- генерация идентификатора VAD узла
- `wrapTextByWords(text, maxLength)` -- перенос текста по словам
- `formatLabelWithWrap(label, maxLength, isBold)` -- форматирование метки с HTML-переносом
- `normalizeUri(uri)` -- нормализация URI (разрешение префиксов)
- `getTrigContext(trigUri)` -- определение контекста TriG (ptree, rtree, vadProcessDia)
- `isPredicateHidden(predicateUri, predicateLabel)` -- проверка скрытости предиката
- `generateSparqlPrefixes(prefixes)` -- генерация строки PREFIX для SPARQL запросов
- `copyObjectId(id, button)` -- копирование идентификатора в буфер обмена

**Функции проверки типов:**
- `isSubjectVadProcess(subjectUri)` / `isSubjectVadExecutor(subjectUri)` -- проверка типа субъекта
- `isDetailedSubtype(subtypeUri)` / `isNotDetailedSubtype(subtypeUri)` -- проверка подтипа
- `isPtreePredicate(predicateUri)` / `isRtreePredicate(predicateUri)` -- проверка принадлежности предиката
- `isProcessTreeType(typeUri)` / `isExecutorTreeType(typeUri)` / `isVADProcessDiaType(typeUri)` -- проверка типа TriG

### vadlib_sparql.js -- SPARQL движок

- **funSPARQLvalues(sparqlQuery, variableName)** -- выполнение SPARQL SELECT запросов. Подробное описание см. в [important_functions.md](important_functions.md#1-funsparqlvalues)
- `parseTriplePatterns(whereClause)` -- парсинг triple patterns с поддержкой GRAPH блоков
- `resolveValue(value)` -- разрешение значений (переменные, URI, литералы, префиксы)
- `executeSimpleSelect(patterns, variables)` -- выполнение SELECT через сопоставление паттернов
- `matchQuadToPattern(quad, pattern, currentBinding)` -- сопоставление квада с паттерном

## Зависимости

Модуль `9_vadlib` не зависит от других модулей проекта. Все остальные модули зависят от него.

## Расширение модуля

- **Новые типы VAD:** добавьте в `VAD_ALLOWED_TYPES`, `TYPE_PREDICATE_MAP` и соответствующие функции проверки
- **Новые фильтры:** создайте объект конфигурации фильтра и обновите `getFilterConfig()`
- **Расширение SPARQL движка:** для поддержки новых конструкций SPARQL (OPTIONAL, UNION, FILTER) расширяйте функции в `vadlib_sparql.js`
- **Новые глобальные переменные:** добавляйте в `vadlib.js` с комментарием о назначении
