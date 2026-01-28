# Пример: Редактирование vad:ConceptProcessPredicate

Этот пример демонстрирует, как изменить объект `vad:ConceptProcessPredicate` для изменения списка предикатов, доступных для TypeProcess в окне Smart Design.

## Что такое vad:ConceptProcessPredicate?

`vad:ConceptProcessPredicate` — это Tech-объект, определяющий, какие предикаты отображаются в выпадающем списке "Predicate" когда:
- TriG = `vad:ptree`
- Subject Type = `TypeProcess`

**Текущие предикаты:** `rdf:type`, `rdfs:label`, `dcterms:description`, `vad:hasTrig`

## Цель

Добавить предикат `vad:hasStatus` для отслеживания статуса процесса (активный/неактивный/черновик).

## Пошаговое руководство

### Шаг 1: Сначала создайте новое свойство

Перед добавлением предиката в Tech-объект он должен существовать в онтологии.

1. Откройте `ver8tree/vad-basic-ontology.ttl` в Protege
2. Перейдите на вкладку **Data Properties**
3. Добавьте новое свойство `vad:hasStatus`:
   - rdfs:label: `hasStatus`
   - rdfs:domain: `vad:TypeProcess`
   - rdfs:range: `xsd:string`
   - rdfs:comment: `Статус процесса: активный, неактивный, черновик`
4. Сохраните файл

### Шаг 2: Откройте Tech Appendix

1. `File -> Open...`
2. Перейдите к `ver8tree/vad-basic-ontology_tech_Appendix.ttl`
3. Нажмите "Open"

### Шаг 3: Найдите vad:ConceptProcessPredicate

1. Перейдите на вкладку **Individuals**
2. В поле поиска введите: `ConceptProcessPredicate`
3. Кликните на `vad:ConceptProcessPredicate` в результатах

### Шаг 4: Просмотрите текущую конфигурацию

В панели утверждений свойств вы увидите:

```
Types:
  vad:Tech

Property assertions:
  rdfs:label -> "ConceptProcessPredicate"
  vad:includePredicate -> rdf:type
  vad:includePredicate -> rdfs:label
  vad:includePredicate -> dcterms:description
  vad:includePredicate -> vad:hasTrig
  rdfs:comment -> "..."
  dcterms:description -> "..."
```

### Шаг 5: Добавьте новый предикат

1. Найдите утверждения свойства `vad:includePredicate`
2. Нажмите кнопку "+" рядом с утверждениями свойств
3. В диалоге:
   - Property: `vad:includePredicate`
   - Value type: Individual
   - Value: Введите `vad:hasStatus` (или выберите из списка, если определено)
4. Нажмите "OK"

### Шаг 6: Проверьте изменение

Утверждения свойств теперь должны показывать:
```
vad:includePredicate -> rdf:type
vad:includePredicate -> rdfs:label
vad:includePredicate -> dcterms:description
vad:includePredicate -> vad:hasTrig
vad:includePredicate -> vad:hasStatus    <-- НОВОЕ
```

### Шаг 7: Сохраните файл

1. `File -> Save`
2. Выберите формат: **Turtle Syntax**
3. Подтвердите перезапись

## Результат

### Обновлённый vad-basic-ontology_tech_Appendix.ttl

```turtle
vad:ConceptProcessPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptProcessPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasStatus ;
    rdfs:comment """
        Группа 'Общие свойства для всех схем процессов' (PTREE_PREDICATES).

        Объект ConceptProcessPredicate (класс Tech) включает предикаты,
        используемые для объектов TypeProcess в vad:ptree:
        - rdf:type - тип объекта (vad:Process)
        - rdfs:label - название процесса
        - dcterms:description - описание процесса
        - vad:hasTrig - ссылка на детализирующую TriG-схему
        - vad:hasStatus - статус процесса (активный/неактивный/черновик)

        Это концептуальные свойства, общие для всех схем.
    """ ;
    dcterms:description "Группа общих свойств процессов для всех схем (PTREE_PREDICATES)" .
```

## Проверка в RDF Grapher

1. Очистите кэш браузера (Ctrl+Shift+Delete)
2. Откройте https://bpmbpm.github.io/rdf-grapher/ver8tree/
3. Перейдите в режим "SPARQL Smart Design"
4. В окне Smart Design:
   - Выберите TriG: `vad:ptree`
   - Выберите Subject Type: `TypeProcess`
   - Откройте выпадающий список Predicate
   - **Проверьте:** `hasStatus` должен быть в списке

## Пример использования

После добавления предиката вы можете использовать его в определениях процессов:

```turtle
vad:ptree {
    vad:p1 rdf:type vad:TypeProcess ;
        rdfs:label "p1 Основной процесс" ;
        dcterms:description "Основной бизнес-процесс" ;
        vad:hasParentObj vad:ptree ;
        vad:hasTrig vad:t_p1 ;
        vad:hasStatus "активный" .

    vad:p1.1 rdf:type vad:TypeProcess ;
        rdfs:label "p1.1 Процесс 1.1" ;
        dcterms:description "Первый подпроцесс" ;
        vad:hasParentObj vad:p1 ;
        vad:hasTrig vad:t_p1.1 ;
        vad:hasStatus "черновик" .
}
```

## Удаление предиката

Для удаления предиката из списка:

1. Найдите `vad:ConceptProcessPredicate` в Individuals
2. Найдите утверждение `vad:includePredicate`, которое хотите удалить
3. Выберите его
4. Нажмите кнопку "-" (удалить)
5. Сохраните файл

## Типичные модификации

### Добавление предиката для категоризации процессов

```turtle
vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasCategory ;
```

### Добавление предиката для владельца процесса

```turtle
vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:hasOwner ;
```

### Добавление нескольких предикатов

```turtle
vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig,
                     vad:hasStatus, vad:hasCategory, vad:hasOwner, vad:createdDate ;
```

## Важные замечания

1. **Порядок важен визуально:** Предикаты появляются в выпадающем списке в порядке их определения
2. **Свойство должно существовать:** Добавляйте только предикаты, определённые в онтологии
3. **Учёт контекста:** Этот Tech-объект влияет только на контекст `vad:ptree` (см. `vad:contextTriGType`)
4. **Для VADProcessDia:** Используйте `vad:IndividProcessPredicate` вместо этого
5. **Автогенерация:** Если предикат должен автозаполняться, также добавьте его в `vad:autoGeneratedPredicate`

## Устранение неполадок

### Предикат не появляется в выпадающем списке

1. Убедитесь, что свойство определено в `vad-basic-ontology.ttl`
2. Проверьте, что оно добавлено в `vad:includePredicate` (без опечаток)
3. Очистите кэш браузера
4. Проверьте консоль браузера на наличие ошибок

### Предикат появляется, но показывает ошибку

1. Убедитесь, что `rdfs:domain` установлен правильно
2. Проверьте, что `rdfs:range` соответствует ожидаемым типам значений
3. Убедитесь, что URI предиката точно совпадает

### Изменения не отражаются

1. Убедитесь, что сохранили файл в формате Turtle
2. Перезагрузите приложение RDF Grapher
3. Жёсткое обновление: `Ctrl+Shift+R`
