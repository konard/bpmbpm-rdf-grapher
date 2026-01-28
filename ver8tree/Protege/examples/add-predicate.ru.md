# Пример: Добавление нового предиката для концептов процессов

Этот пример демонстрирует, как добавить новый предикат (`vad:priority`) для концептов процессов с использованием Protege.

## Цель

Добавить предикат `vad:priority`, позволяющий назначать уровни приоритета (1-5) процессам.

## Пошаговое руководство

### Шаг 1: Открытие основной онтологии

1. Запустите Protege Desktop
2. `File -> Open...`
3. Перейдите к `ver8tree/vad-basic-ontology.ttl`
4. Нажмите "Open"

### Шаг 2: Создание нового свойства

1. Перейдите на вкладку **Data Properties**
2. Нажмите кнопку "Add Data Property" (иконка +)
3. Введите имя: `priority`
4. Полный URI будет: `http://example.org/vad#priority`

### Шаг 3: Настройка свойства

В панели описания свойства (справа):

1. **Добавьте rdfs:label:**
   - Нажмите "+" рядом с "Annotations"
   - Выберите "rdfs:label"
   - Введите: `priority`

2. **Установите Domain (какие типы могут иметь это свойство):**
   - Нажмите "+" рядом с "Domains"
   - Выберите `vad:TypeProcess`

3. **Установите Range (допустимые значения):**
   - Нажмите "+" рядом с "Ranges"
   - Выберите `xsd:integer`

4. **Добавьте Comment:**
   - Нажмите "+" рядом с "Annotations"
   - Выберите "rdfs:comment"
   - Введите: `Уровень приоритета процесса (1-5, где 1 — наивысший приоритет)`

### Шаг 4: Сохранение онтологии

1. `File -> Save` (или `Ctrl+S`)
2. Выберите формат: **Turtle Syntax**
3. Сохраните как `vad-basic-ontology.ttl`

### Шаг 5: Обновление Tech Appendix

1. Откройте `ver8tree/vad-basic-ontology_tech_Appendix.ttl` в Protege
2. Перейдите на вкладку **Individuals**
3. Найдите `vad:ConceptProcessPredicate`
4. В панели утверждений свойств найдите `vad:includePredicate`
5. Нажмите "+" для добавления нового значения
6. Введите: `vad:priority`
7. Сохраните файл

## Результат

### В vad-basic-ontology.ttl

```turtle
vad:priority
    rdf:type rdf:Property, owl:DatatypeProperty ;
    rdfs:label "priority" ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range xsd:integer ;
    rdfs:comment "Уровень приоритета процесса (1-5, где 1 — наивысший приоритет)" ;
    dcterms:description "Уровень приоритета процесса" .
```

### В vad-basic-ontology_tech_Appendix.ttl

```turtle
vad:ConceptProcessPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptProcessPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, dcterms:description, vad:hasTrig, vad:priority ;
    # ... остальная часть определения
```

## Проверка в RDF Grapher

1. Откройте https://bpmbpm.github.io/rdf-grapher/ver8tree/
2. Загрузите обновлённые файлы онтологии
3. Перейдите в режим "SPARQL Smart Design"
4. В окне Smart Design:
   - Выберите TriG: `vad:ptree`
   - Выберите Subject Type: `TypeProcess`
   - Откройте выпадающий список Predicate — `priority` должен быть в списке

## Пример использования в RDF-данных

После добавления предиката вы можете использовать его в ваших RDF-данных:

```turtle
vad:ptree {
    vad:p1 rdf:type vad:TypeProcess ;
        rdfs:label "p1 Основной процесс" ;
        dcterms:description "Основной бизнес-процесс" ;
        vad:hasParentObj vad:ptree ;
        vad:priority 1 .  # Высокий приоритет

    vad:p2 rdf:type vad:TypeProcess ;
        rdfs:label "p2 Вторичный процесс" ;
        dcterms:description "Вторичный процесс" ;
        vad:hasParentObj vad:ptree ;
        vad:priority 3 .  # Средний приоритет
}
```

## Устранение неполадок

### Свойство не появляется в выпадающем списке

1. Очистите кэш браузера
2. Убедитесь, что свойство добавлено в список `vad:includePredicate`
3. Проверьте правильность установки `vad:contextTriGType`

### Свойство отображается для неправильных типов

1. Убедитесь, что `rdfs:domain` установлен на правильный класс
2. Проверьте, что добавили в правильный Tech-объект:
   - `vad:ConceptProcessPredicate` для контекста ptree
   - `vad:IndividProcessPredicate` для контекста VADProcessDia
