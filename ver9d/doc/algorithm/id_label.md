# Отображение ID и Label в выпадающих справочниках

**Ссылка на issue:** [#410](https://github.com/bpmbpm/rdf-grapher/issues/410) pull https://github.com/bpmbpm/rdf-grapher/pull/411
**Ссылка на issue:** [#412](https://github.com/bpmbpm/rdf-grapher/issues/412) pull https://github.com/bpmbpm/rdf-grapher/pull/413
**Ссылка на issue:** [#414](https://github.com/bpmbpm/rdf-grapher/issues/414) pull https://github.com/bpmbpm/rdf-grapher/pull/416

## Описание задачи

При создании нового концепта процесса и концепта исполнителя в поле `vad:hasParentObj` должен быть показан в выпадающем справочнике не только id, но и его label в скобках.

Эта функциональность должна быть реализована во всех окнах, включая:
- Поле «Концепт процесса:» при создании Индивида процесса
- Все аналогичные выпадающие справочники в системе

## Формат отображения

В выпадающих справочниках используется формат:
```
id (label)
```

Где:
- `id` — это prefixed форма URI (например, `vad:p1`, `vad:ExecutorGroup_p1`)
- `label` — значение предиката `rdfs:label` объекта

### Примеры:

1. Если у объекта есть и URI, и label:
   ```
   vad:p1 (Процесс согласования)
   vad:r1 (Руководитель отдела)
   vad:ptree (Корневой процесс)
   ```

2. Если label совпадает с id или отсутствует:
   ```
   vad:p1
   vad:ExecutorGroup_p1
   ```

## Реализация

### 1. Утилитная функция

Создана функция `formatDropdownDisplayText()` в модуле `9_vadlib/vadlib_logic.js`:

```javascript
/**
 * issue #410: Форматирует текст для отображения в dropdown справочниках
 * Возвращает строку в формате "id (label)" если label отличается от id,
 * иначе возвращает только id
 *
 * @param {string} uri - URI объекта
 * @param {string} label - Метка объекта (rdfs:label)
 * @param {Object} prefixes - Объект префиксов для преобразования URI
 * @returns {string} Форматированный текст для отображения
 */
function formatDropdownDisplayText(uri, label, prefixes) {
    // Получаем prefixed форму URI (например, vad:p1)
    const id = typeof getPrefixedName === 'function'
        ? getPrefixedName(uri, prefixes)
        : uri;

    // Если label не задан или совпадает с id, возвращаем только id
    if (!label || label === id || label === uri) {
        return id;
    }

    // Возвращаем формат "id (label)"
    return `${id} (${label})`;
}
```

### 2. Изменения в UI модулях

Функция применена во всех UI модулях, где заполняются выпадающие справочники:

#### 2.1. Создание концепта (`3_sd_create_new_concept_ui.js`)

**Файл:** `ver9d/3_sd/3_sd_create_new_concept/3_sd_create_new_concept_ui.js`

**Функция:** `initializeParentSelector()`

**Изменение для обычных объектов:**
```javascript
// Было:
option.textContent = obj.label || obj.uri;

// Стало:
option.textContent = typeof formatDropdownDisplayText === 'function'
    ? formatDropdownDisplayText(obj.uri, obj.label, currentPrefixes)
    : (obj.label || obj.uri);
```

**Изменение для корневых элементов (issue #412):**
```javascript
// Было:
option.textContent = `${rootOption} (корень)`;

// Стало (получаем label из RDF store и используем formatDropdownDisplayText):
let rootLabel = null;
if (currentStore) {
    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';
    const quads = currentStore.getQuads(null, rdfsLabelUri, null, null);
    quads.forEach(quad => {
        if (quad.subject.value === rootUri) {
            rootLabel = quad.object.value;
        }
    });
}
option.textContent = typeof formatDropdownDisplayText === 'function'
    ? formatDropdownDisplayText(rootUri, rootLabel, currentPrefixes)
    : (rootLabel || rootOption);
```

**Изменение для получения rdfs:label дочерних объектов (issue #414):**

Issue #413 исправил отображение label для корневых элементов, но не исправил
проблему для остальных объектов в справочнике. Причина: функция `funSPARQLvalues`
не поддерживает `OPTIONAL`-блоки в SPARQL, поэтому `rdfs:label` не возвращается
в результатах запроса.

```javascript
// Добавлена функция enrichResultsWithLabels в 3_sd_create_new_concept_logic.js
function enrichResultsWithLabels(results) {
    if (!currentStore || results.length === 0) {
        return results;
    }

    const rdfsLabelUri = 'http://www.w3.org/2000/01/rdf-schema#label';

    // Создаём карту uri -> rdfs:label из RDF store
    const labelMap = new Map();
    const quads = currentStore.getQuads(null, rdfsLabelUri, null, null);
    quads.forEach(quad => {
        labelMap.set(quad.subject.value, quad.object.value);
    });

    // Обновляем label для каждого результата
    return results.map(obj => {
        const realLabel = labelMap.get(obj.uri);
        if (realLabel) {
            return { uri: obj.uri, label: realLabel };
        }
        return obj;
    });
}
```

Эта функция вызывается в `getObjectsForParentSelector` после получения результатов
SPARQL-запроса, чтобы обогатить их реальными `rdfs:label` из RDF store.

**Применяется к:**
- Выпадающий список `vad:hasParentObj` при создании концепта процесса
- Выпадающий список `vad:hasParentObj` при создании концепта исполнителя
- Корневые элементы `vad:ptree` и `vad:rtree` (issue #412)
- Все дочерние объекты в справочнике (issue #414)

#### 2.2. Создание индивида (`3_sd_create_new_individ_ui.js`)

**Файл:** `ver9d/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_ui.js`

**Функции:**
- `fillNewIndividTrigDropdown()` — справочник TriG (схем процессов)
- `fillNewIndividConceptDropdown()` — справочник концептов процессов
- `fillNewIndividProcessIndividDropdown()` — справочник индивидов процессов
- `fillNewIndividExecutorDropdown()` — справочник концептов исполнителей

**Применяется к:**
- Выпадающий список «TriG (схема процесса)»
- Выпадающий список «Концепт процесса»
- Выпадающий список «Индивид процесса»
- Выпадающий список «Концепт исполнителя»

#### 2.3. Создание TriG (`3_sd_create_new_trig_ui.js`)

**Файл:** `ver9d/3_sd/3_sd_create_new_trig/3_sd_create_new_trig_ui.js`

**Функции:**
- `onNewTrigConceptChange()` — заполнение справочника процессов (с пометкой disabled для процессов с существующим TriG)
- Fallback метод с `FILTER NOT EXISTS`

**Применяется к:**
- Выпадающий список «Концепт процесса» при создании новой схемы (TriG)

#### 2.4. Удаление концептов и индивидов (`3_sd_del_concept_individ_ui.js`)

**Файл:** `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_ui.js`

**Функции:**
- `onDelOperationTypeChange()` — заполнение справочника индивидов процессов
- `onDelOperationTypeChange()` — заполнение справочника индивидов исполнителей
- `fillTrigDropdownForIndivid()` — заполнение справочника TriG
- `fillConceptDropdown()` — заполнение справочника концептов
- `fillTrigDropdown()` — заполнение справочника TriG (для удаления схем)

**Применяется к:**
- Все выпадающие справочники в окне удаления концептов и индивидов

#### 2.5. Главный UI модуль Smart Design (`3_sd_ui.js`)

**Файл:** `ver9d/3_sd/3_sd_ui.js`

**Функция:** `updateNodeForm()`

**Применяется к:**
- Выпадающий список субъектов при редактировании узлов

## Места применения

### Обязательные поля с vad:hasParentObj

1. **New Concept → TypeProcess**
   - Поле: `vad:hasParentObj`
   - Справочник: концепты процессов из `vad:ptree` + корневой элемент `vad:ptree`

2. **New Concept → TypeExecutor**
   - Поле: `vad:hasParentObj`
   - Справочник: концепты исполнителей из `vad:rtree` + корневой элемент `vad:rtree`

### Другие справочники

3. **New Individ → Process**
   - Поле: «TriG (схема процесса)»
   - Поле: «Концепт процесса»
   - Поле: `vad:hasNext` (checkboxes — отображается только label)

4. **New Individ → Executor**
   - Поле: «TriG (схема процесса)»
   - Поле: «Индивид процесса»
   - Поле: «Концепт исполнителя»

5. **New TriG**
   - Поле: «Концепт процесса»

6. **Del Concept/Individ**
   - Все справочники в окнах удаления

7. **Smart Design → Node Properties**
   - Справочник субъектов при редактировании узлов

## Совместимость

Функция `formatDropdownDisplayText()` использует проверку существования:
```javascript
typeof formatDropdownDisplayText === 'function'
```

Это обеспечивает:
- Совместимость с существующим кодом
- Fallback на старый формат если функция не загружена
- Отсутствие ошибок при постепенном внедрении

## Обратная совместимость

Изменения полностью обратно совместимы:
- Если label отсутствует, отображается только id (как раньше)
- Если label совпадает с id, отображается только id (избежание дублирования)
- Value выпадающих списков (URI) не изменяется — изменяется только отображаемый текст

## Тестирование

Для тестирования изменений:
1. Загрузить пример данных `Trig_VADv6.ttl` или новее
2. Открыть окно «New Concept»
3. Выбрать тип «Концепт процесса (vad:TypeProcess)»
4. Проверить поле `vad:hasParentObj` — должны отображаться как id, так и label в формате `id (label)`
5. Повторить для других окон и справочников

## Связанные файлы

- `ver9d/9_vadlib/vadlib_logic.js` — утилитная функция
- `ver9d/3_sd/3_sd_create_new_concept/3_sd_create_new_concept_ui.js` — создание концепта
- `ver9d/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_ui.js` — создание индивида
- `ver9d/3_sd/3_sd_create_new_trig/3_sd_create_new_trig_ui.js` — создание TriG
- `ver9d/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_ui.js` — удаление
- `ver9d/3_sd/3_sd_ui.js` — главный UI модуль

## Примечания

- Функция не изменяет значение `value` элемента `<option>` (остаётся полный URI)
- Изменяется только `textContent` (отображаемый текст)
- Это позволяет сохранить все существующие механизмы обработки выбора и генерации SPARQL
