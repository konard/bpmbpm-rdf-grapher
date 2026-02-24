# Форматирование при сериализации N3.js (версия 2)
design/store/n3js_serialization_format_v2.md
Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/429
Предыдущая версия: [n3js_serialization_format.md](n3js_serialization_format.md) (issue #264)

---

## Часть 1. Почему при создании концепта процесса в quadstore появляется полный URI?

### Пример из issue #429

При создании концепта процесса с ID `333` в quadstore появилась запись с полным URI:

```turtle
<http://example.org/vad#333> a vad:TypeProcess;
    rdfs:label "l3333";
    vad:hasParentObj vad:p1
```

Тогда как ожидалась запись в сокращённом виде:

```turtle
vad:333 a vad:TypeProcess;
    rdfs:label "l3333";
    vad:hasParentObj vad:p1
```

### Ответ на вопрос

Это вызвано **ограничением спецификации Turtle/TriG** — синтаксиса сокращённых URI (CURIE/prefixed names).

Согласно [спецификации Turtle 1.1 (раздел 6.3, PN_LOCAL)](https://www.w3.org/TR/turtle/#grammar-production-PN_LOCAL):

> Локальная часть prefixed name **не может начинаться с цифры**.

Идентификатор `333` начинается с цифры, поэтому N3.Writer **не может** записать его как `vad:333`. Вместо этого он выводит полный URI `<http://example.org/vad#333>`.

Это **не ошибка N3.js** — это корректное поведение согласно стандарту RDF/Turtle.

---

## Часть 2. Все ситуации, приводящие к полным URI вместо сокращённых (PREFIX)

### Ситуация 1: Локальная часть начинается с цифры

**Пример:** `vad:333`, `vad:1process`, `vad:42_task`

**Правило Turtle:** PN_LOCAL не может начинаться с цифры.

**В N3.Writer:** записывается как `<http://example.org/vad#333>`.

**Решение:** Использовать ID с буквенным началом: `vad:p333`, `vad:process1`, `vad:task42`.

---

### Ситуация 2: Локальная часть содержит точки в середине или конце

**Пример:** `vad:p1.1.1`, `vad:ExecutorGroup_p1.1.1`

**Правило Turtle:** Точка в конце локальной части недопустима. Точки в середине допустимы, но N3.Writer проявляет осторожность и предпочитает полный URI для имён с точками.

**В N3.Writer:** записывается как `<http://example.org/vad#p1.1.1>`.

**Решение:**
- Заменить точки на подчёркивания: `vad:p1_1_1`
- Или использовать отдельные числа как суффиксы: `vad:p1v1v1`
- Текущая версия системы (ver9d) допускает точки в ID, но это приводит к полным URI при сериализации.

---

### Ситуация 3: Локальная часть содержит специальные символы, требующие экранирования

**Пример:** `vad:p1/task`, `vad:process@home`, `vad:task#1`

**Правило Turtle:** Символы `/`, `@`, `#`, `?` и другие специальные символы недопустимы без экранирования в локальной части prefixed name.

**В N3.Writer:** записывается как полный URI.

**Решение:** Использовать только буквы, цифры, подчёркивания и дефисы в ID.

---

### Ситуация 4: Prefix не был объявлен при инициализации N3.Writer

**Пример:** URI `http://purl.org/dc/terms/description` при отсутствии `PREFIX dcterms: <http://purl.org/dc/terms/>`

**В N3.Writer:** записывается как `<http://purl.org/dc/terms/description>`.

**Решение:** Передавать все используемые prefixes при создании N3.Writer:
```javascript
const writer = new N3.Writer({
    prefixes: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        vad: 'http://example.org/vad#',
        dcterms: 'http://purl.org/dc/terms/'
    },
    format: 'application/trig'
});
```

---

### Ситуация 5: Локальная часть пустая

**Пример:** URI `http://example.org/vad#` (пустая локальная часть после `#`)

**В N3.Writer:** записывается как `<http://example.org/vad#>`.

**Решение:** Всегда указывать непустой локальный ID.

---

### Ситуация 6: URI не соответствует ни одному объявленному prefix

**Пример:** URI `http://other-system.org/data#process1` при prefix только для `vad:`, `rdf:`, `rdfs:`

**В N3.Writer:** записывается как `<http://other-system.org/data#process1>`.

**Решение:** Добавить соответствующий prefix или убедиться, что используемые namespace совпадают с объявленными.

---

### Ситуация 7: Blank nodes (анонимные узлы)

**Пример:** Анонимные узлы в форме `_:b0`, `_:b1`

**В N3.Writer:** записываются как `_:b0_0` и т.д. — это корректное поведение для blank nodes, но не для именованных ресурсов.

**Решение:** Использовать именованные URI вместо blank nodes для создаваемых концептов и индивидов.

---

## Часть 3. Рекомендации для получения сокращённых URI (через PREFIX) в quadstore

### Рекомендация 1 (Основная): Правила для ID концептов и индивидов

Для гарантии использования сокращённых форм URI при сериализации:

1. **ID должен начинаться с буквы**: `p1`, `Executor1`, `task_001`
   ❌ Неправильно: `333`, `1process`
   ✓ Правильно: `p333`, `process1`

2. **Не использовать точки в ID**: `p1_1_1` вместо `p1.1.1`
   ❌ Неправильно: `vad:p1.1.1`
   ✓ Правильно: `vad:p1_1_1`

3. **Использовать только безопасные символы**: буквы (включая кириллицу), цифры, подчёркивание `_`, дефис `-`

### Рекомендация 2: Настройка N3.Writer

Всегда передавать актуальный словарь prefixes:

```javascript
const writer = new N3.Writer({
    prefixes: currentPrefixes,  // словарь {prefix: namespace}
    format: 'application/trig'
});
```

### Рекомендация 3: Валидация ID перед созданием

Добавить проверку ID в модуль создания концепта (`3_sd_create_new_concept_logic.js`):

```javascript
/**
 * Проверяет, будет ли ID корректно сериализоваться как prefixed name
 * @param {string} id - Локальный ID концепта (без prefix)
 * @returns {{ valid: boolean, reason: string }}
 */
function validateConceptIdForPrefix(id) {
    if (!id) return { valid: false, reason: 'ID не задан' };

    // Правило 1: не начинается с цифры
    if (/^\d/.test(id)) {
        return {
            valid: false,
            reason: `ID "${id}" начинается с цифры. Turtle/TriG не допускает prefixed name начинающийся с цифры. Используйте буквенный префикс, например "p${id}".`
        };
    }

    // Правило 2: не содержит точек
    if (id.includes('.')) {
        return {
            valid: false,
            reason: `ID "${id}" содержит точку. N3.Writer использует полный URI для таких имён. Замените точки на подчёркивания.`
        };
    }

    // Правило 3: допустимые символы
    if (!/^[a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u04010-9_\-][a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u04010-9_\-]*$/.test(id)) {
        return {
            valid: false,
            reason: `ID "${id}" содержит недопустимые символы. Используйте только буквы, цифры, подчёркивание и дефис.`
        };
    }

    return { valid: true, reason: '' };
}
```

### Рекомендация 4: Отображение предупреждения пользователю

В модуле `3_sd_create_new_concept_ui.js` добавить предупреждение при вводе ID с цифрового символа:

> ⚠️ ID начинается с цифры — в quadstore будет сохранён полный URI вместо `vad:333`. Рекомендуется добавить буквенный префикс, например `p333`.

---

## Часть 4. Кириллица в ID (ответ на issue #431)

### Вопрос

Можно ли использовать кириллицу в ID, и будет ли при этом формироваться сокращённый URI (prefixed name)?

### Ответ

**Да**, кирилличные символы поддерживаются стандартом Turtle/TriG для prefixed names.

Согласно [спецификации Turtle 1.1 (PN_CHARS_BASE)](https://www.w3.org/TR/turtle/#grammar-production-PN_CHARS_BASE), в локальной части prefixed name допустимы символы Unicode, включая диапазон `[U+037F–U+1FFF]`, в который входят кирилличные символы (`U+0400–U+04FF`).

Это означает, что **N3.Writer должен записывать** `vad:яяя` как prefixed name (при соблюдении остальных правил).

### Пример из issue #431

```turtle
<http://example.org/vad#яяя> a vad:TypeProcess;
    rdfs:label "яяя 444 4444";
    vad:hasParentObj vad:p1
```

При корректной настройке N3.Writer (с объявленным prefix `vad:`) данный URI должен сериализоваться как:

```turtle
vad:яяя a vad:TypeProcess;
    rdfs:label "яяя 444 4444";
    vad:hasParentObj vad:p1
```

### Условия для сокращённого URI с кириллицей

1. **ID не должен начинаться с цифры** — правило остаётся в силе
2. **ID не должен содержать точки** — правило остаётся в силе
3. **Кириллические буквы являются допустимыми символами** — `яяя`, `процесс1`, `ПроцессА`
4. **Prefix должен быть объявлен** в N3.Writer

### Метод именования с кириллицей и формирование сокращённого URI

Для создания концепта/индивида с кирилличным ID:

```javascript
// Пример: создать концепт с ID "яяя"
const id = "яяя";  // Кириллический ID
const conceptUri = "http://example.org/vad#" + id;
// URI: http://example.org/vad#яяя

// При сериализации N3.Writer с prefix vad: <http://example.org/vad#>
// будет выведено: vad:яяя (сокращённый URI)
```

### Ограничения при использовании кириллицы

| Ситуация | Пример | Результат | Причина |
|---|---|---|---|
| Кирилличный ID (правильно) | `яяя` | `vad:яяя` ✓ | Unicode буквы допустимы в PN_CHARS_BASE |
| Кириллица + начинается с цифры | `333яяя` | `<http://example.org/vad#333яяя>` ✗ | PN_LOCAL не может начинаться с цифры |
| Кириллица с точкой | `яяя.1` | `<http://example.org/vad#яяя.1>` ✗ | Точки вызывают полный URI |

### Исправление функции валидации

В `n3js_serialization_format_v2.md` (Рекомендация 3) имеется опечатка в regex. Исправленная версия:

```javascript
function validateConceptIdForPrefix(id) {
    if (!id) return { valid: false, reason: 'ID не задан' };

    // Правило 1: не начинается с цифры
    if (/^\d/.test(id)) {
        return {
            valid: false,
            reason: `ID "${id}" начинается с цифры. Используйте буквенный префикс, например "p${id}".`
        };
    }

    // Правило 2: не содержит точек
    if (id.includes('.')) {
        return {
            valid: false,
            reason: `ID "${id}" содержит точку. Замените точки на подчёркивания.`
        };
    }

    // Правило 3: допустимые символы (латиница, кириллица, цифры, _ и -)
    // Кирилличные символы: U+0400-U+04FF (включая ё U+0451 и Ё U+0401)
    if (!/^[a-zA-Z\u0400-\u04FF_][a-zA-Z\u0400-\u04FF0-9_\-]*$/.test(id)) {
        return {
            valid: false,
            reason: `ID "${id}" содержит недопустимые символы. Используйте только буквы (латиницу или кириллицу), цифры, подчёркивание и дефис.`
        };
    }

    return { valid: true, reason: '' };
}
```

---

## Сводная таблица ситуаций

| Ситуация | Пример ID | Что сохраняется в quadstore | Решение |
|---|---|---|---|
| ID начинается с цифры | `333` | `<http://example.org/vad#333>` | Добавить букву: `p333` |
| ID содержит точки | `p1.1.1` | `<http://example.org/vad#p1.1.1>` | Заменить: `p1_1_1` |
| Спецсимволы в ID | `p1/t` | `<http://example.org/vad#p1/t>` | Убрать: `p1_t` |
| Prefix не объявлен | `dcterms:desc` | `<http://purl.org/dc/terms/desc>` | Объявить prefix в Writer |
| Пустая локальная часть | `vad:` | `<http://example.org/vad#>` | Указать непустой ID |
| Чужой namespace | `http://other/x` | `<http://other/x>` | Использовать свой namespace |
| Кирилличный ID (корректный) | `яяя` | `vad:яяя` ✓ | Unicode буквы допустимы |
| Кириллица с цифры | `333яяя` | `<http://example.org/vad#333яяя>` | Добавить букву: `p333яяя` |

---

## Связь с кодом

### Где создаются концепты с полным URI?

Функция `buildConceptUri` в `3_sd_create_new_concept_logic.js:542`:
```javascript
function buildConceptUri(id, prefix = 'vad') {
    if (typeof currentPrefixes !== 'undefined' && currentPrefixes[prefix]) {
        return currentPrefixes[prefix] + id;  // например: 'http://example.org/vad#' + '333'
    }
    return `http://example.org/${prefix}#${id}`;
}
```

URI формируется как полный (`http://example.org/vad#333`). При записи в quadstore через N3.js он сохраняется как полный URI. При последующей сериализации N3.Writer **пытается** использовать prefixed name, но не может для ID `333` (начинается с цифры), поэтому выводит `<http://example.org/vad#333>`.

### Где происходит сериализация?

При нажатии кнопки "Показать" в разделе "Triplestore" используется N3.Writer. Он получает из store набор квадов и сериализует их в текст. URI `http://example.org/vad#333` при наличии prefix `vad: <http://example.org/vad#>` должен был бы стать `vad:333`, но Turtle-парсер N3.js отклоняет `vad:333` как невалидный prefixed name (локальная часть начинается с цифры) и сохраняет `<http://example.org/vad#333>`.

---

## Заключение

**Причина** появления полных URI в quadstore при создании концепта процесса:
Идентификатор `333` начинается с цифры, что нарушает правила синтаксиса Turtle/TriG для prefixed names.

**Рекомендации:**
1. Для немедленного исправления: переименовать `333` в `p333` или другой ID с буквенным началом
2. Для предотвращения в будущем: добавить валидацию ID в форме создания концепта (функция `validateConceptIdForPrefix`)
3. Избегать точек в ID концептов и индивидов

---

*Документ создан: 2026-02-24*
*Версия: 3*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/429*
*Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/431*
*Предыдущая версия: n3js_serialization_format.md (issue #264)*
