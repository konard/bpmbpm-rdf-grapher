# Концепция хранилища techtree и currentQuads (версия 3)
design/store/store_concept_v3.md 04/02/26
Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/266

## Содержание

1. [Введение](#введение)
2. [Анализ альтернатив N3.Store](#анализ-альтернатив-n3store)
   - [2.1 Текущая архитектура](#21-текущая-архитектура)
   - [2.2 quadstore-comunica](#22-quadstore-comunica)
   - [2.3 Единый Store (SPARQL-driven)](#23-единый-store-sparql-driven)
3. [virtualRDFdata и vad:Virtual](#virtualrdfdata-и-vadvirtual)
   - [3.1 SPARQL-driven подход](#31-sparql-driven-подход)
   - [3.2 Анализ функции isVirtualGraph](#32-анализ-функции-isvirtualgraph)
4. [Загрузка vad-basic-ontology.ttl в quadstore](#загрузка-vad-basic-ontologyttl-в-quadstore)
   - [4.1 Преимущества](#41-преимущества)
   - [4.2 Проблемы](#42-проблемы)
   - [4.3 Рекомендации](#43-рекомендации)
5. [Правила hasParentObj](#правила-hasparentobj)
6. [Проблемы сериализации N3.js и рекомендации (issue #268)](#проблемы-сериализации-n3js-и-рекомендации-issue-268)
   - [6.1 Проблема: Полный URI вместо prefix](#61-проблема-полный-uri-вместо-prefix)
   - [6.2 Решение проблемы в N3.Store + Comunica vs quadstore-comunica](#62-решение-проблемы-в-n3store--comunica-vs-quadstore-comunica)
   - [6.3 Как решается проблема в других JS-библиотеках](#63-как-решается-проблема-в-других-js-библиотеках)
   - [6.4 Альтернативные разделители для номеров процессов](#64-альтернативные-разделители-для-номеров-процессов)
   - [6.5 Миграция существующих данных](#65-миграция-существующих-данных)
7. [SPARQL-driven подход: анализ вспомогательных массивов и функций (issue #268)](#sparql-driven-подход-анализ-вспомогательных-массивов-и-функций-issue-268)
   - [7.1 Текущие вспомогательные массивы в коде](#71-текущие-вспомогательные-массивы-в-коде)
   - [7.2 Сводная таблица SPARQL-замен](#72-сводная-таблица-sparql-замен)
   - [7.3 Рекомендации по переходу](#73-рекомендации-по-переходу)

---

## Введение

Документ дополняет [store_concept_v2.md](store_concept_v2.md) и содержит анализ альтернативных подходов к хранению RDF-данных в соответствии с концепцией SPARQL-driven programming (Программирование на основе SPARQL).

**Ключевой принцип issue #266:** Производительность вторична, первичен принцип SPARQL-driven programming — все операции с данными должны выполняться через SPARQL-запросы, а не через прямую работу с массивами JavaScript.

---

## Анализ альтернатив N3.Store

### 2.1 Текущая архитектура

Текущая архитектура использует два хранилища данных:

| Компонент | Тип | Назначение |
|-----------|-----|------------|
| `currentQuads` | `Array<N3.Quad>` | Хранит сырые данные для сериализации и фильтрации |
| `currentStore` | `N3.Store` | Индексированное хранилище для SPARQL-запросов |

**Причины разделения (из store_concept_v2.md):**
- N3.Store не предоставляет эффективного способа получения всех квадов для сериализации
- Фильтрация через `.filter()` быстрее для массивов
- SPARQL-запросы требуют индексированного хранилища

**Недостаток:** Дублирование данных противоречит принципу SPARQL-driven programming.

### 2.2 quadstore-comunica

[quadstore-comunica](https://www.npmjs.com/package/quadstore-comunica) — это SPARQL-движок для quadstore, построенный на фреймворке Comunica.

**Преимущества quadstore-comunica:**

1. **Единое хранилище с SPARQL** — не требует отдельного массива для фильтрации
2. **Полная поддержка SPARQL 1.1** — включая CONSTRUCT, DESCRIBE, и UPDATE
3. **Персистентное хранилище** — поддержка IndexedDB в браузере через `browser-level`
4. **RDF/JS совместимость** — реализует стандартные интерфейсы Sink, Source, Store

**Недостатки quadstore-comunica:**

1. **Размер бандла** — значительно больше N3.js (несмотря на оптимизацию через Webpack)
2. **Низкая популярность** — ~69 загрузок в неделю (может быть менее стабильным)
3. **Сложность миграции** — требует переписывания логики работы с хранилищем
4. **Асинхронность** — все операции асинхронные, что усложняет код

**Пример использования quadstore-comunica:**

```javascript
import { Quadstore } from 'quadstore';
import { Engine } from 'quadstore-comunica';
import { DataFactory } from 'n3';

// Создание хранилища
const store = new Quadstore({
    backend: new BrowserLevel('rdf-grapher-db'),
    dataFactory: DataFactory
});
await store.open();

// SPARQL-запрос для получения всех квадов
const engine = new Engine(store);
const result = await engine.queryQuads(`
    SELECT ?s ?p ?o ?g WHERE {
        GRAPH ?g { ?s ?p ?o }
    }
`);

// Фильтрация через SPARQL (вместо Array.filter)
const virtualQuads = await engine.queryQuads(`
    SELECT ?s ?p ?o WHERE {
        GRAPH ?g {
            ?g rdf:type vad:Virtual .
            ?s ?p ?o .
        }
    }
`);
```

### 2.3 Единый Store (SPARQL-driven)

**Рекомендация issue #266:** Рассмотреть вариант использования одного Store (currentQuads).

**Подход 1: Использовать только N3.Store с SPARQL через Comunica**

Текущая архитектура уже использует Comunica для SPARQL-запросов. Можно отказаться от `currentQuads` и выполнять все операции через `currentStore`:

```javascript
// Текущий подход (с массивом)
function getFilteredQuads(filterMode) {
    return currentQuads.filter(quad => isVirtualGraph(quad.graph?.value));
}

// SPARQL-driven подход
async function getFilteredQuadsSPARQL(filterMode) {
    const query = `
        SELECT ?s ?p ?o ?g WHERE {
            GRAPH ?g {
                ?g rdf:type vad:Virtual .
                ?s ?p ?o .
            }
        }
    `;
    return await funSPARQLvalues(query);
}
```

**Проблема получения всех квадов из N3.Store:**

N3.Store предоставляет метод `getQuads()` для получения всех квадов:

```javascript
// Получение всех квадов из N3.Store
const allQuads = currentStore.getQuads(null, null, null, null);
```

Это решает проблему сериализации без необходимости хранить отдельный массив.

**Рекомендуемый подход:**

| Критерий | N3.Store + Comunica | quadstore-comunica |
|----------|---------------------|-------------------|
| Сложность миграции | Низкая | Высокая |
| Размер бандла | Меньше | Больше |
| SPARQL-поддержка | Полная (через Comunica) | Полная |
| Персистентность | Нет | Да (IndexedDB) |
| Стабильность | Высокая | Средняя |

**Вывод:** Для RDF Grapher рекомендуется постепенный переход к SPARQL-driven подходу с использованием текущего стека (N3.Store + Comunica), отказываясь от дублирования в `currentQuads` где это возможно. Переход на quadstore-comunica целесообразен только если потребуется персистентное хранилище.

---

## virtualRDFdata и vad:Virtual

### 3.1 SPARQL-driven подход

**issue #266:** Согласно SPARQL-driven programming нужно избавляться от хранения данных в массивах и максимально использовать SPARQL-запросы.

**virtualRDFdata** (виртуальные вычисляемые данные) теперь хранятся в TriG типа `vad:Virtual`:

```turtle
# Виртуальный TriG (бывший virtualRDFdata) для процесса p1
vad:vt_p1 {
    vad:vt_p1 rdf:type vad:Virtual ;
        vad:hasParentObj vad:t_p1 .  # Родительский физический TriG

    vad:p1.1 vad:processSubtype vad:DetailedChild .
    vad:p1.2 vad:processSubtype vad:notDetailedChild .
}
```

**Чтение vad:Virtual через SPARQL:**

```sparql
# Получить все виртуальные данные для процесса p1
SELECT ?subject ?subtype WHERE {
    GRAPH vad:vt_p1 {
        ?subject vad:processSubtype ?subtype .
    }
}

# Найти все виртуальные TriG
SELECT ?virtualTrig ?parentTrig WHERE {
    GRAPH ?virtualTrig {
        ?virtualTrig rdf:type vad:Virtual ;
            vad:hasParentObj ?parentTrig .
    }
}
```

**Изменение vad:Virtual через SPARQL UPDATE:**

```sparql
# Добавить подтип процесса
INSERT DATA {
    GRAPH vad:vt_p1 {
        vad:p1.3 vad:processSubtype vad:DetailedChild .
    }
}

# Удалить подтип процесса
DELETE DATA {
    GRAPH vad:vt_p1 {
        vad:p1.3 vad:processSubtype vad:DetailedChild .
    }
}
```

### 3.2 Анализ функции isVirtualGraph

**issue #266:** Функция `isVirtualGraph()` видимо избыточная, т.к. имеется тип TriG (`vad:Virtual`) и добавлен `hasParentObj` для привязки виртуального TriG к своему реальному TriG (двойнику).

**Текущая реализация:**

```javascript
function isVirtualGraph(graphUri) {
    if (!graphUri) return false;
    const localName = getLocalName(graphUri);
    return localName.startsWith('vt_');
}
```

**SPARQL-альтернатива:**

```sparql
# Проверка: является ли граф виртуальным
ASK {
    GRAPH <http://example.org/vad#vt_p1> {
        <http://example.org/vad#vt_p1> rdf:type vad:Virtual .
    }
}
```

**Анализ:**

| Аспект | isVirtualGraph() | SPARQL ASK |
|--------|------------------|------------|
| Производительность | O(1) — проверка строки | O(log n) — поиск в индексе |
| Надёжность | Зависит от соглашения об именах (vt_*) | Зависит от наличия rdf:type |
| SPARQL-driven | Нет | Да |
| Применимость | Синхронная проверка | Асинхронная проверка |

**Рекомендация:**

1. **Для критичных по производительности операций** (например, фильтрация в реальном времени при рендеринге) — сохранить `isVirtualGraph()` как оптимизацию
2. **Для операций валидации и CRUD** — использовать SPARQL-запросы к `rdf:type vad:Virtual`
3. **Документировать связь:** имя `vt_*` ДОЛЖНО соответствовать типу `vad:Virtual` (правило валидации)

**Правило валидации:**

```sparql
# Проверка консистентности: все vt_* графы должны иметь тип vad:Virtual
SELECT ?graph WHERE {
    GRAPH ?graph { ?s ?p ?o }
    FILTER(STRENDS(STR(?graph), "vt_"))
    FILTER NOT EXISTS {
        GRAPH ?graph { ?graph rdf:type vad:Virtual }
    }
}
```

---

## Загрузка vad-basic-ontology.ttl в quadstore

**issue #266:** Рассмотреть необходимость загрузки в общий quadstore онтологии vad-basic-ontology.ttl.

### 4.1 Преимущества

1. **SPARQL-driven валидация**
   - Можно проверять типы объектов через SPARQL-запросы к онтологии
   - Пример: проверка, что `vad:VADProcessDia` является подклассом `vad:TriG`

   ```sparql
   ASK {
       GRAPH vad:ontology {
           vad:VADProcessDia rdfs:subClassOf vad:TriG .
       }
   }
   ```

2. **Единый источник истины**
   - Вся метаинформация о классах доступна через SPARQL
   - Не нужно дублировать константы в JavaScript-коде

3. **Inference (вывод)**
   - При наличии онтологии можно использовать reasoning
   - Пример: запрос "все подклассы vad:TriG" автоматически включит VADProcessDia, ObjectTree, и т.д.

4. **Самодокументируемость**
   - Описания классов (`rdfs:comment`) доступны через SPARQL
   - Можно генерировать справку из онтологии

### 4.2 Проблемы

1. **Увеличение размера quadstore**
   - vad-basic-ontology.ttl содержит ~900 строк
   - Увеличит время загрузки и потребление памяти

2. **Смешение данных и схемы**
   - Онтология — это схема данных, не сами данные
   - При сохранении файла нужно исключать граф онтологии
   - Пользователь может случайно изменить онтологию

3. **Версионирование**
   - При обновлении онтологии нужно обновлять все файлы данных
   - Или загружать онтологию динамически при каждом старте

4. **Производительность SPARQL**
   - Большее количество квадов замедляет SPARQL-запросы
   - Особенно для запросов без указания графа

5. **Конфликты имён**
   - Если пользователь создаст объект с именем из онтологии
   - Например, `vad:Process` как экземпляр, а не класс

### 4.3 Рекомендации

**Рекомендуемый подход: Гибридная загрузка**

1. **Загружать онтологию в отдельный граф** `vad:ontology`:
   ```turtle
   vad:ontology {
       vad:Process rdf:type rdfs:Class ;
           rdfs:label "Process" ;
           rdfs:comment "Бизнес-процесс" .
       # ... остальные определения
   }
   ```

2. **Исключать граф онтологии при сохранении**:
   ```javascript
   function getQuadsForSave() {
       return currentQuads.filter(q =>
           q.graph?.value !== ONTOLOGY_GRAPH_URI
       );
   }
   ```

3. **Использовать онтологию для SPARQL-валидации**:
   ```sparql
   # Проверка: субъект имеет допустимый тип
   SELECT ?subject ?type WHERE {
       GRAPH ?dataGraph { ?subject rdf:type ?type }
       GRAPH vad:ontology { ?type rdf:type rdfs:Class }
   }
   ```

4. **Кэшировать результаты inference**:
   - Один раз вычислить все подклассы каждого класса
   - Хранить в JavaScript-объекте для быстрого доступа

**Вывод:**

| Сценарий | Рекомендация |
|----------|--------------|
| Базовое использование | Не загружать онтологию в quadstore |
| Расширенная валидация | Загружать в отдельный граф vad:ontology |
| Inference/Reasoning | Использовать специализированные reasoner-ы |

Для текущей версии RDF Grapher рекомендуется **не загружать vad-basic-ontology.ttl в quadstore**, так как:
- Это усложнит логику сохранения
- Потенциально замедлит SPARQL-запросы
- Классы и предикаты уже определены в JavaScript-константах

При переходе к полностью SPARQL-driven архитектуре можно рассмотреть загрузку онтологии в отдельный граф.

---

## Правила hasParentObj

**issue #266:** Пусть всегда `vad:techroot vad:hasParentObj = null`

**Обновлённые правила:**

| Объект | hasParentObj | Примечание |
|--------|--------------|------------|
| `vad:root` | null | Корень всего дерева объектов |
| `vad:techroot` | null | Корень технологического дерева |
| `vad:ptree` | `vad:root` | Дерево процессов |
| `vad:rtree` | `vad:root` | Дерево исполнителей |
| `vad:techtree` | `vad:techroot` | Технологические данные |
| `vad:vt_*` (Virtual) | `vad:t_*` (VADProcessDia) | Виртуальные данные привязаны к физическому TriG |

**Правило валидации:**

```sparql
# Проверка: только vad:root и vad:techroot могут не иметь hasParentObj
SELECT ?subject WHERE {
    ?subject rdf:type ?type .
    FILTER NOT EXISTS { ?subject vad:hasParentObj ?parent }
    FILTER(?subject != vad:root && ?subject != vad:techroot)
}
```

**ВАЖНО:** `vad:root` НЕ является родителем `vad:techroot`. Это два независимых корня:
- `vad:root` — корень для пользовательских данных (ptree, rtree, схемы процессов)
- `vad:techroot` — корень для технологических данных (techtree, виртуальные данные по устаревшей схеме)

---

## Проблемы сериализации N3.js и рекомендации (issue #268)

Ссылка на детальный анализ: [n3js_serialization_format.md](n3js_serialization_format.md)

### 6.1 Проблема: Полный URI вместо prefix

**Описание:** N3.Writer при сериализации может выбирать полный URI вместо prefixed-формы для URI, содержащих специальные символы (особенно точки).

**Пример:**
```turtle
# Ожидаемый формат
vad:ExecutorGroup_p1.1.1 rdf:type vad:ExecutorGroup .

# Фактический формат после N3.Writer
<http://example.org/vad#ExecutorGroup_p1.1.1> a vad:ExecutorGroup.
```

**Причина:** Точка (`.`) является специальным символом в синтаксисе Turtle и может трактоваться как терминатор триплета. N3.js предпочитает полную форму URI для безопасности.

### 6.2 Решение проблемы в N3.Store + Comunica vs quadstore-comunica

| Аспект | N3.Store + Comunica | quadstore-comunica |
|--------|---------------------|-------------------|
| Хранение URI с точками | Внутренне без проблем | Внутренне без проблем |
| Сериализация (N3.Writer) | Полный URI для "опасных" имён | Использует N3.Writer (те же проблемы) |
| Сохранение комментариев | Не поддерживается | Не поддерживается |
| Сохранение форматирования | Не поддерживается | Не поддерживается |
| Round-trip (parse → serialize) | Теряет комментарии и форматирование | Теряет комментарии и форматирование |

**Вывод:** Ни N3.Store + Comunica, ни quadstore-comunica не решают проблему сериализации URI с точками, так как обе используют N3.Writer для сериализации. Проблема находится на уровне сериализатора, а не хранилища.

### 6.3 Как решается проблема в других JS-библиотеках

#### rdflib.js

[rdflib.js](https://github.com/linkeddata/rdflib.js) — популярная RDF-библиотека для JavaScript.

| Особенность | Поведение |
|-------------|-----------|
| Сериализация точек | Использует полный URI для имён с точками |
| Настройка prefixes | Более гибкая настройка через `NamedNode.toString()` |
| Round-trip | Теряет комментарии и форматирование |

#### graphy.js

[graphy.js](https://github.com/blake-regalia/graphy.js) — высокопроизводительная RDF-библиотека.

| Особенность | Поведение |
|-------------|-----------|
| Сериализация точек | Может использовать escaping в prefixed именах |
| Prefixes | Продвинутая настройка формата вывода |
| Round-trip | Частичная поддержка (без комментариев) |

#### Заключение по библиотекам

Все основные JavaScript RDF-библиотеки имеют схожие ограничения:
- **Комментарии** не сохраняются при парсинге
- **Форматирование** теряется при сериализации
- **URI с точками** могут сериализоваться в полной форме

**Рекомендация:** Вместо поиска библиотеки, решающей эти проблемы, лучше избегать точек в локальных именах URI.

### 6.4 Альтернативные разделители для номеров процессов

**Проблема:** URI вида `vad:p1.1.1` могут сериализоваться как `<http://example.org/vad#p1.1.1>` вместо prefixed-формы.

**Рекомендуемые альтернативы:**

| Разделитель | Пример | Преимущества | Недостатки |
|-------------|--------|--------------|------------|
| Подчёркивание (`_`) | `vad:p1_1_1` | Широко используется, безопасен в URI | Визуально менее читаем |
| Дефис (`-`) | `vad:p1-1-1` | Читаемый, безопасен в URI | Может конфликтовать с математическими обозначениями |
| CamelCase | `vad:p1s1s1` | Компактный | Менее очевидная иерархия |
| Двойное подчёркивание | `vad:p1__1__1` | Явно выделяет уровни | Визуально громоздкий |
| Буквенный разделитель | `vad:p1x1x1` | Безопасен, компактен | Требует соглашения о значении "x" |

**Рекомендация:** Использовать **подчёркивание (`_`)** как основной разделитель:
- `vad:p1_1` вместо `vad:p1.1`
- `vad:p1_1_1` вместо `vad:p1.1.1`
- `vad:ExecutorGroup_p1_1_1` вместо `vad:ExecutorGroup_p1.1.1`

### 6.5 Миграция существующих данных

При переходе на новый разделитель необходимо:

1. **SPARQL UPDATE для замены:**
   ```sparql
   # Пример: замена точек на подчёркивания в идентификаторах
   # (требует кастомной логики, так как SPARQL не поддерживает
   # прямую замену в URI)
   ```

2. **JavaScript-миграция:**
   ```javascript
   function migrateUri(uri) {
       // Заменяем точки на подчёркивания в локальной части URI
       const vadPrefix = 'http://example.org/vad#';
       if (uri.startsWith(vadPrefix)) {
           const localName = uri.substring(vadPrefix.length);
           // Заменяем точки только в номерах процессов (p1.1.1 → p1_1_1)
           const migrated = localName.replace(/(\d+)\.(\d+)/g, '$1_$2');
           return vadPrefix + migrated;
       }
       return uri;
   }
   ```

3. **Валидация после миграции:**
   ```sparql
   # Проверка: не осталось ли URI с точками в номерах процессов
   SELECT ?s WHERE {
       ?s ?p ?o .
       FILTER(REGEX(STR(?s), "vad#p\\d+\\.\\d+"))
   }
   ```

---

## SPARQL-driven подход: анализ вспомогательных массивов и функций (issue #268)

### 7.1 Текущие вспомогательные массивы в коде

Анализ кодовой базы выявил следующие вспомогательные массивы и функции, которые могут быть заменены SPARQL-запросами:

| Массив/Функция | Назначение | SPARQL-альтернатива | Приоритет замены |
|----------------|------------|---------------------|------------------|
| `currentQuads` | Хранение всех квадов | `currentStore.getQuads()` | Высокий |
| `virtualRDFdata` | Виртуальные данные | Граф `vad:Virtual` + SPARQL SELECT | Выполнено в #266 |
| `isVirtualGraph()` | Проверка типа графа | `ASK { ?g rdf:type vad:Virtual }` | Средний |
| `getLocalName()` | Извлечение локального имени | `BIND(STRAFTER(...) AS ?local)` | Низкий |
| `getPrefixedName()` | Преобразование URI | Не применимо (UI логика) | Не заменять |

### 7.2 Сводная таблица SPARQL-замен

| Текущая функция | Текущий подход | SPARQL-driven подход | Сложность | Рекомендация |
|-----------------|----------------|----------------------|-----------|--------------|
| Получение всех квадов | `currentQuads` массив | `SELECT * WHERE { GRAPH ?g { ?s ?p ?o } }` | Низкая | Заменить |
| Фильтрация по типу графа | `Array.filter()` | `SELECT WHERE { GRAPH ?g { ?g rdf:type ?type } }` | Низкая | Заменить |
| Проверка существования ID | `Array.some()` | `ASK { <uri> ?p ?o }` | Низкая | Заменить |
| Получение объектов по типу | `Array.filter()` + цикл | `SELECT ?s WHERE { ?s rdf:type ?type }` | Низкая | Заменить |
| Получение предикатов объекта | Ручной перебор | `SELECT ?p ?o WHERE { <uri> ?p ?o }` | Низкая | Заменить |
| Получение дерева (иерархия) | Рекурсивные циклы | `SELECT * WHERE { ?s vad:hasParentObj* ?parent }` | Средняя | Частично заменить |
| Валидация данных | JS-функции | SPARQL ASK/SELECT с FILTER | Средняя | Заменить |
| Агрегация (подсчёт) | `Array.reduce()` | `SELECT (COUNT(?s) AS ?count)` | Низкая | Заменить |
| Группировка | JS `Map/Object` | `SELECT ?type (COUNT(?s)) GROUP BY ?type` | Низкая | Заменить |
| Поиск по подстроке | `String.includes()` | `FILTER(CONTAINS(STR(?s), "text"))` | Низкая | Опционально |

### 7.3 Рекомендации по переходу

1. **Фаза 1: Высокий приоритет**
   - Заменить `currentQuads` на `currentStore.getQuads()`
   - Использовать SPARQL для фильтрации вместо `Array.filter()`
   - Проверку существования ID делать через `ASK`

2. **Фаза 2: Средний приоритет**
   - Заменить `isVirtualGraph()` на SPARQL для операций CRUD
   - Использовать SPARQL для валидации данных

3. **Фаза 3: Низкий приоритет (опционально)**
   - Вспомогательные функции форматирования (`getLocalName`, `getPrefixedName`) оставить в JS
   - Операции, критичные по производительности, оставить в JS

**Критерий успеха:** Код содержит минимум прямых обращений к массивам квадов; все операции с данными выполняются через SPARQL-запросы.

---

*Документ создан: 2026-02-03*
*Автор: AI Assistant*
*Версия: 3.1 (обновлено для issue #268)*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/266, https://github.com/bpmbpm/rdf-grapher/issues/268*

## Источники

- [quadstore-comunica на npm](https://www.npmjs.com/package/quadstore-comunica)
- [quadstore на npm](https://www.npmjs.com/package/quadstore)
- [quadstore на GitHub](https://github.com/quadstorejs/quadstore)
- [Comunica - Usage showcase](https://comunica.dev/docs/query/usage/)
- [rdflib.js на GitHub](https://github.com/linkeddata/rdflib.js)
- [graphy.js на GitHub](https://github.com/blake-regalia/graphy.js)
- [N3.js Serialization Issues](n3js_serialization_format.md)
