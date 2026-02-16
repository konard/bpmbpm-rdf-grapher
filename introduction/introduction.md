# Semantic ARIS / BPM — Подробное введение
Введение применительно к версиям ver9+  
Коротко см. https://github.com/bpmbpm/rdf-grapher/blob/main/introduction/theses.md

## 1. Обзор проекта RDF Grapher ver9d

### 1.1 От RDF Grapher к Semantic BPM (ARIS)

RDF Grapher — это веб-приложение для парсинга RDF данных и их визуализации в виде графов. Проект эволюционировал от простого RDF Viewer (ver1-ver3) до прототипа системы моделирования бизнес-процессов на основе семантических технологий (ver4-ver9). В качестве протоипа RDF Viewer был финский https://www.ldf.fi/service/rdf-grapher (требует VPN).  
Начиная с версии после [ver7so](https://github.com/bpmbpm/rdf-grapher/tree/main/ver7so) функции классического RDF Viewer удалены.  

**Текущая версия** [ver9d](https://github.com/bpmbpm/rdf-grapher/tree/main/ver9d) представляет собой прототип Semantic ARIS — ARIS-подобной системы моделирования ([ARIS Toolset ](https://citforum.ru/seminars/cis99/vest_03.shtml), [soware.ru](https://soware.ru/products/aris-platform)), построенной на стеке Linked Data. 

### 1.2 Технологический стек

| Технология | Назначение |
|------------|------------|
| **N3.js** | JavaScript библиотека для парсинга RDF (TriG, Turtle, N-Triples) |
| **Comunica** | SPARQL движок для выполнения запросов в браузере |
| **Viz.js** | WebAssembly версия Graphviz для визуализации графов |
| **N3.Store** | In-memory quadstore для хранения RDF данных (TriG) |

Приложение работает полностью на стороне клиента (в браузере) и не требует серверной части (для упрощения тестирования и демонстрации, основной проект планируется на node.js).

---

## 2. Архитектура хранилища данных

### 2.1 Quadstore структура

Данные хранятся в виде квадов (quads): `(subject, predicate, object, graph)`. Именованные графы (named graphs) используются для логической группировки данных.

**Основные графы в ver9d:**

| Граф | URI | Назначение |
|------|-----|------------|
| Дерево концептов процессов | `vad:ptree` | Хранение концептов процессов (TypeProcess) |
| Дерево концептов исполнителей | `vad:rtree` | Хранение концептов исполнителей (TypeExecutor) |
| Основная процессная онтология + VAD-расширение | `vad:VADontology` | Метаданные: методы, предикаты, типы, см. папку ontology/vad-basic-ontology.trig |
| Технологическое приложение к основной процессной онтологии | `vad:techtree` | Метаданные: методы, предикаты, типы, см. папку ontology/vad-basic-ontology_tech_Appendix.trig |
| Схемы процессов (VADProcessDia) | `vad:t_*` | VAD-диаграмма процесса (VADProcessDia) - - непосредственно описание верхнеуровневых процессов (VAD) компании (Индивиды процессов \ исполнителей) |
| Виртуальные данные | `vad:vt_*` | Автоматически вычисляемые данные - временное хранение вторичных данных, вычисленных из vad-basic-ontology.trig & vad-basic-ontology_tech_Appendix.trig |

### 2.2 Пример структуры TriG данных

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix vad: <http://example.org/vad#> .

# Дерево Процессов (ptree) - общий граф с метаданными всех процессов
vad:ptree {
    vad:ptree rdf:type vad:ObjectTree ;
        rdfs:label "Дерево Процессов (TriG)" ;
        vad:hasParentObj vad:root .

    vad:p1 rdf:type vad:TypeProcess ;
        rdfs:label "p1 Процесс 1" ;
        vad:hasParentObj vad:ptree ;
        vad:hasTrig vad:t_p1 .

    vad:p1_1 rdf:type vad:TypeProcess ;
        rdfs:label "p1_1 Процесс 1_1" ;
        vad:hasParentObj vad:p1 ;
        vad:hasTrig vad:t_p1_1 .
}

# Схема процесса (VAD диаграмма)
vad:t_p1 {
    vad:t_p1 rdf:type vad:VADProcessDia ;
        rdfs:label "Схема процесса p1 Процесс 1" ;
        vad:hasParentObj vad:ptree .

    # Индивид процесса на схеме
    vad:p1_1 vad:isSubprocessTrig vad:t_p1 ;
        vad:hasNext vad:p1_2 .

    # Группа исполнителей
    vad:ExecutorGroup_p1_1 rdf:type vad:ExecutorGroup ;
        vad:hasExecutor vad:p1_1 ;
        vad:includes vad:r1 .
}
```

---

## 3. SPARQL-Driven Programming

### 3.1 Принцип подхода

**SPARQL-Driven Programming** — ключевая архитектурная парадигма ver9d:

- Бизнес-логика описывается декларативно через SPARQL-запросы
- JavaScript используется минимально — только для UI и координации
- Данные и их структура определяются онтологией
- Справочники и формы генерируются динамически на основе метаданных

### 3.2 Пример из кода: получение методов объекта

**Файл:** `ver9d/12_method/12_method_sparql.js`

```javascript
/**
 * Получает список методов для указанного типа объекта через SPARQL
 * @param {string} objectMethodType - Тип объекта ('isSubprocessTrig' или 'ExecutorGroup')
 * @returns {Promise<Array>} - Массив объектов { label, functionId }
 */
async function getMethodsForType(objectMethodType) {
    const typeUri = objectMethodType === 'ExecutorGroup'
        ? 'http://example.org/vad#ExecutorGroup'
        : 'http://example.org/vad#isSubprocessTrig';

    // Запрос методов из графа vad:techtree (технологическое приложение)
    const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX vad: <http://example.org/vad#>

        SELECT ?method ?label ?functionId WHERE {
            GRAPH vad:techtree {
                ?method rdf:type vad:ObjectMethod .
                ?method vad:methodForType <${typeUri}> .
                ?method rdfs:label ?label .
                ?method vad:methodFunction ?functionId .
            }
        }
    `;

    const results = await funSPARQLvaluesComunica(query, currentPrefixes);
    return results.map(row => ({
        uri: row.method,
        label: row.label,
        functionId: row.functionId
    }));
}
```

**Под каждой кнопкой — SPARQL-запрос:** Логика работы каждой функции абсолютно прозрачна.

### 3.3 SPARQL-функции в ver9d

| Функция | Назначение |
|---------|------------|
| `funSPARQLvalues()` | Простые SELECT запросы (синхронно) |
| `funSPARQLvaluesComunica()` | Полная поддержка SPARQL 1.1 через Comunica (асинхронно) |
| `funSPARQLvaluesDouble()` | Справочник с пометкой недоступных значений |
| `funSPARQLask()` | ASK запросы (проверка существования) |
| `funSPARQLvaluesComunicaUpdate()` | UPDATE запросы (INSERT/DELETE) |

---

## 4. Сравнение с ARIS Toolset (VAD-диаграммы)

### 4.1 Value Added Chain Diagram (VAD)

VAD (Value Added Chain Diagram) — одна из ключевых нотаций в ARIS для моделирования верхнеуровневых бизнес-процессов.

**Элементы VAD:**
- Процессы (функции добавляющие ценность)
- Исполнители (роли, организационные единицы)
- Связи между процессами (последовательность выполнения)

### 4.2 Представление VAD в RDF

**ARIS Toolset (традиционный подход):**
- Проприетарный формат хранения
- Специфичные API для доступа к данным
- Ограниченная интероперабельность

**Semantic ARIS (RDF-подход):**
- Стандартный формат RDF/TriG
- Универсальный доступ через SPARQL
- Полная интероперабельность с LD-инструментами

### 4.3 Пример: SPARQL-запрос для построения матрицы исполнителей

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Получение связей процесс-исполнитель для матрицы исполнителей
SELECT ?process ?processLabel ?executor ?executorLabel WHERE {
    GRAPH ?trig {
        ?trig rdf:type vad:VADProcessDia .
        ?process vad:isSubprocessTrig ?trig .

        # ExecutorGroup связывает процесс с исполнителем
        ?eg rdf:type vad:ExecutorGroup .
        ?eg vad:hasExecutor ?process .
        ?eg vad:includes ?executor .
    }

    GRAPH vad:ptree {
        ?process rdfs:label ?processLabel .
    }

    GRAPH vad:rtree {
        ?executor rdfs:label ?executorLabel .
    }
}
```

---

## 5. Модульная архитектура ver9d

### 5.1 Структура модулей

```
ver9d/
├── index.html                    - Минимальный HTML файл-оболочка
├── styles.css                    - Основные стили приложения
├── config.json                   - Конфигурация состояния окон
├── 1_example_data/               - Загрузка примеров RDF данных
├── 2_triplestore/                - Ввод и хранение RDF данных
├── 3_sd/                         - Smart Design (SPARQL редактор)
├── 4_resSPARQL/                  - Result in SPARQL (вывод запросов)
├── 5_publisher/                  - Визуализация (Publisher)
├── 6_legend/                     - Легенда стилей
├── 7_info/                       - Prefixes
├── 8_infoSPARQL/                 - SPARQL запросы
├── 9_vadlib/                     - Общая библиотека
├── 10_virtualTriG/               - Virtual TriG (вычисляемые данные)
├── 11_reasoning/                 - Semantic Reasoning
└── 12_method/                    - Методы объектов
```

### 5.2 Соглашение об именовании файлов

Каждый модуль следует единой структуре:
- `*_ui.js` — UI функции (DOM-манипуляции, события)
- `*_logic.js` — Бизнес-логика (алгоритмы, вычисления)
- `*_sparql.js` — SPARQL запросы и работа с данными
- `*.css` — Стили модуля

---

## 6. Semantic Reasoning

### 6.1 Механизм вывода

Модуль `11_reasoning` реализует семантический вывод (inference) для автоматического вычисления данных.

**Пример правила вывода:**

Если процесс A имеет подпроцесс B, а B имеет подпроцесс C, то A имеет подпроцесс C (транзитивность).

```sparql
PREFIX vad: <http://example.org/vad#>

# CONSTRUCT для вывода транзитивных связей
CONSTRUCT {
    ?ancestor vad:hasDescendant ?descendant .
}
WHERE {
    ?ancestor vad:hasParentObj+ ?descendant .
}
```

### 6.2 Virtual TriG

Virtual TriG (`vad:vt_*`) — автоматически вычисляемые графы, которые:
- Связаны с родительским `vad:VADProcessDia` через `vad:hasParentObj`
- Имеют тип `vad:Virtual`
- Пересчитываются при изменении исходных данных

---

## 7. Пример работы: Редактирование Label концепта процесса

### 7.1 Алгоритм (issue #386)

1. Пользователь выбирает Individ Process на диаграмме
2. Открывается окно "Свойство объекта диаграммы"
3. Кликает на кнопку "Методы" и выбирает "Edit Label Concept Process"
4. Открывается модальное окно с полями:
   - ID концепта процесса (нередактируемый)
   - Label (редактируемый)
   - Информация о схеме (если есть vad:hasTrig)
5. При изменении label генерируется SPARQL запрос

### 7.2 Генерируемый SPARQL (из 12_method_logic.js)

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX vad: <http://example.org/vad#>

# Изменение rdfs:label для концепта процесса vad:p1

# Удаление старого label в ptree
DELETE DATA {
    GRAPH vad:ptree {
        vad:p1 rdfs:label "Старый label" .
    }
}
;

# Добавление нового label в ptree
INSERT DATA {
    GRAPH vad:ptree {
        vad:p1 rdfs:label "Новый label" .
    }
}
;

# Обновление label связанной схемы (TriG)
DELETE DATA {
    GRAPH vad:t_p1 {
        vad:t_p1 rdfs:label "Схема процесса Старый label" .
    }
}
;

INSERT DATA {
    GRAPH vad:t_p1 {
        vad:t_p1 rdfs:label "Схема процесса Новый label" .
    }
}
```

---

## 8. Преимущества подхода

### 8.1 Для пользователя

| Аспект | Традиционный BPM | Semantic ARIS |
|--------|------------------|---------------|
| Анализ данных | Специфичные отчёты | Любой SPARQL-запрос |
| Интеграция | Проприетарные API | Стандартные LD-протоколы |
| Расширяемость | Программирование плагинов | Добавление данных в онтологию |
| Reasoning | Ручное программирование | Автоматический вывод |

### 8.2 Для разработчика

| Аспект | Традиционный подход | SPARQL-driven |
|--------|---------------------|---------------|
| Логика | Захардкожена в коде | Описана в SPARQL/онтологии |
| Изменения | Требуют правки кода | Достаточно изменить запрос |
| Тестирование | Unit-тесты для кода | Проверка запросов в SPARQL endpoint |
| Документация | Комментарии в коде | Самодокументируемые запросы |

---

## 9. Ссылки и ресурсы

### Проект
- [RDF Grapher ver9d](https://github.com/bpmbpm/rdf-grapher/tree/main/ver9d)
- [SemanticBPM](https://github.com/bpmbpm/SemanticBPM) - основной проект (глобально)
- [draw-vad](https://github.com/bpmbpm/draw-vad)

### Статьи на Хабр 
- [Semantic BPM. Семантика и синтаксис бизнес-процессов](https://habr.com/ru/articles/795883/)
- [Semantic BPM. Онтологическое моделирование верхнеуровневых процессов. VAD](https://habr.com/ru/articles/828266/)  

### Технологии
- [N3.js](https://github.com/rdfjs/N3.js) — RDF парсер
- [Comunica](https://comunica.dev/) — SPARQL движок
- [Viz.js](https://github.com/mdaines/viz.js) — Graphviz для браузера

### BPM и ARIS
- [Нотации для моделирования бизнес-процессов](https://fox-manager.com/notacii-dlja-modelirovanija-biznes-processov/)
- [ARIS](https://en.wikipedia.org/wiki/Architecture_of_Integrated_Information_Systems)

### Неоторые проектные решения / исследования 
- [Предложения по соответствию ARIS ToolSet и методологии ARIS из ver8tree/doc/aris-alignment-proposals.md](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/doc/aris-alignment-proposals.md) (архивное)
- [Concept vs Individ в разных системах, например, ARIS различает Definition (определение объекта) vs Occurrence (вхождение на диаграмме)](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9d/analysis/new_individ_process.md) 
---

*Документ создан в рамках issue #388*
*Дата: 2026-02-13*
