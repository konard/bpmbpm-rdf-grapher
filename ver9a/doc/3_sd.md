<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->

# Модуль 3_sd -- Smart Design

## Назначение

Модуль SPARQL Smart Design предоставляет интерактивный интерфейс для редактирования RDF данных через формирование SPARQL INSERT и DELETE запросов. Пользователь выбирает значения из выпадающих списков (TriG граф, тип субъекта, субъект, предикат, объект), а модуль формирует соответствующий SPARQL запрос. Реализует концепцию SPARQL-driven Programming.

## Файлы модуля

| Файл | Назначение |
|---|---|
| `3_sd_ui.js` | UI функции: выпадающие списки, кнопки (New Concept, Del Concept\Individ, New TriG), обработчики событий |
| `3_sd_logic.js` | Бизнес-логика: заполнение справочников через `funSPARQLvalues`, формирование SPARQL запросов |
| `3_sd_sparql.js` | Коллекция SPARQL запросов (`SPARQL_QUERIES`): запросы для заполнения выпадающих списков |

### Подпапка 3_sd_create_new_concept/

| Файл | Назначение |
|---|---|
| `3_sd_create_new_concept_logic.js` | Логика создания новых концептов процессов (`vad:TypeProcess` в `vad:ptree`) и исполнителей (`vad:TypeExecutor` в `vad:rtree`). Использует технологические объекты из `vad:techtree` для определения набора предикатов |

### Подпапка 3_sd_del_concept_individ/

| Файл | Назначение |
|---|---|
| `3_sd_del_concept_individ_logic.js` | Логика удаления концептов и индивидов с проверкой зависимостей. Поддерживает удаление концептов процессов/исполнителей, индивидов процессов/исполнителей, схем процессов (TriG) |

### Подпапка 3_sd_create_new_trig/

| Файл | Назначение |
|---|---|
| `3_sd_create_new_trig_logic.js` | Логика создания новых TriG графов типа `vad:VADProcessDia` с привязкой к концепту процесса через `vad:hasTrig` |

## Ключевые функции

### Основной модуль

- **populateSmartDesignDropdowns()** -- заполнение всех выпадающих списков Smart Design через SPARQL запросы
- **updateSubjectsBySubjectType()** -- обновление списка субъектов при смене типа субъекта
- **getProcessIndividualsInTriG(trigUri)** -- получение индивидов процессов в конкретном TriG графе (VADProcessDia)
- **getExecutorGroupsInTriG(trigUri)** -- получение групп исполнителей в конкретном TriG графе
- **smartDesignCreate()** -- формирование SPARQL INSERT запроса
- **smartDesignDelete()** -- формирование SPARQL DELETE запроса
- **smartDesignClear()** -- очистка полей Smart Design (текст сообщений очищается, но поля остаются видимыми)
- **copyFieldValue(selectId)** -- копирование значения поля в буфер обмена (включая TriG)
- **applyTripleToRdfInput()** -- применение изменения к текущим RDF данным

### Подмодуль создания концептов

- **openNewConceptModal()** -- открытие модального окна создания концепта
- **generateNewConceptSparql()** -- генерация SPARQL INSERT для нового концепта

### Подмодуль удаления

- **openDeleteModal()** -- открытие модального окна удаления
- **checkDependencies()** -- проверка зависимостей перед удалением
- **generateDeleteSparql()** -- генерация SPARQL DELETE запроса

### Подмодуль создания TriG

- **openNewTrigModal()** -- открытие модального окна создания TriG
- **generateNewTrigSparql()** -- генерация SPARQL INSERT для нового TriG графа

## Коллекция SPARQL запросов (3_sd_sparql.js)

| Запрос | Описание |
|---|---|
| `PROCESS_INDIVIDUALS_IN_TRIG(trigUri)` | Получение индивидов процессов в конкретном TriG |
| `PROCESS_CONCEPTS_IN_PTREE` | Получение всех концептов процессов из `vad:ptree` |
| `EXECUTOR_GROUPS_IN_TRIG(trigUri)` | Получение групп исполнителей в TriG |
| `EXECUTORS_IN_RTREE` | Получение всех исполнителей из `vad:rtree` |
| `EXECUTOR_CONCEPTS_IN_RTREE` | Получение всех концептов исполнителей (`vad:TypeExecutor`) из `vad:rtree` |
| `TECH_OBJECT_PREDICATES(techObjectUri)` | Получение предикатов из технологического объекта |

## Зависимости от других модулей

- **9_vadlib** -- `funSPARQLvalues()` для выполнения SPARQL запросов, глобальные переменные, конфигурация типов
- **2_triplestore** -- текущие RDF данные (`currentQuads`, `currentPrefixes`)
- **4_resSPARQL** -- отображение результирующих SPARQL запросов
- **ontology/** -- файлы онтологии (`vad-basic-ontology_tech_Appendix.ttl`) для технологических объектов

## Расширение модуля

- **Новая кнопка:** создайте подпапку `3_sd_имя_действия/` с файлом `3_sd_имя_действия_logic.js`, добавьте кнопку в `3_sd_ui.js`
- **Новые SPARQL запросы:** добавьте в `3_sd_sparql.js` с описанием места использования
- **Новый тип субъекта:** расширьте логику `updateSubjectType()` и добавьте соответствующий SPARQL запрос
