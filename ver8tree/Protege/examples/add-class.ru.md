# Пример: Добавление нового класса/типа TriG

Этот пример демонстрирует, как добавить новый тип TriG (аналогичный `vad:ObjectTree`) с использованием Protege.

## Цель

Создать новый класс `vad:DocumentTree` для организации документов, связанных с процессами.

## Пошаговое руководство

### Шаг 1: Открытие основной онтологии

1. Запустите Protege Desktop
2. `File -> Open...`
3. Перейдите к `ver8tree/vad-basic-ontology.ttl`
4. Нажмите "Open"

### Шаг 2: Создание нового класса

1. Перейдите на вкладку **Classes**
2. В иерархии классов найдите `vad:TriG`
3. Щёлкните правой кнопкой мыши на `vad:TriG`
4. Выберите "Add subclass..."
5. Введите имя: `DocumentTree`

### Шаг 3: Настройка класса

В панели описания класса (справа):

1. **Добавьте rdfs:label:**
   - Нажмите "+" рядом с "Annotations"
   - Выберите "rdfs:label"
   - Введите: `DocumentTree`

2. **Добавьте rdfs:comment:**
   - Нажмите "+" рядом с "Annotations"
   - Выберите "rdfs:comment"
   - Введите подробное описание:
   ```
   Дерево документов (DocumentTree) — специализированный TriG-контейнер
   для организации документов, связанных с бизнес-процессами.

   Каждое дерево документов содержит:
   - Ссылки на документы (PDF, Word и т.д.)
   - Метаданные документов (название, автор, дата)
   - Связи с процессами, к которым они относятся

   Используется для ведения документации процессов.
   ```

3. **Добавьте dcterms:description:**
   - Нажмите "+" рядом с "Annotations"
   - Выберите "dcterms:description"
   - Введите: `Древовидная структура для документации процессов`

4. **Убедитесь в типе OWL Class:**
   - Класс должен быть одновременно `rdfs:Class` и `owl:Class`

### Шаг 4: Создание класса Document

Добавьте класс для отдельных документов:

1. На вкладке **Classes** нажмите "Add subclass" под `owl:Thing`
2. Назовите его: `Document`
3. Добавьте аннотации:
   - rdfs:label: `Document`
   - rdfs:comment: `Документ, связанный с бизнес-процессом`

### Шаг 5: Создание связанных свойств

Перейдите на вкладку **Object Properties** и добавьте:

1. **vad:hasDocument**
   - Domain: `vad:TypeProcess`
   - Range: `vad:Document`
   - Comment: `Связывает процесс с его документацией`

2. **vad:documentSource**
   - Domain: `vad:Document`
   - Range: (оставьте пустым для литеральных значений)
   - Comment: `URL или путь к файлу документа`

### Шаг 6: Сохранение онтологии

1. `File -> Save`
2. Выберите формат: **Turtle Syntax**

### Шаг 7: Создание Tech-объекта для DocumentTree

Откройте `vad-basic-ontology_tech_Appendix.ttl` и добавьте:

1. Перейдите на вкладку **Individuals**
2. Нажмите "Add Individual"
3. Создайте `vad:ConceptDocumentTreePredicate`
4. Установите:
   - `rdf:type`: `vad:Tech`
   - `rdfs:label`: `ConceptDocumentTreePredicate`
   - `vad:includePredicate`: `rdf:type`, `rdfs:label`, `vad:hasParentObj`
   - `vad:contextTriGType`: `vad:DocumentTree`

### Шаг 8: Создание Tech-объекта для Documents

Аналогично создайте `vad:ConceptDocumentPredicate`:
- `vad:includePredicate`: `rdf:type`, `rdfs:label`, `vad:documentSource`, `vad:hasParentObj`

## Результат

### В vad-basic-ontology.ttl

```turtle
# Дерево документов - Контейнер для документации процессов
vad:DocumentTree
    rdf:type rdfs:Class, owl:Class ;
    rdfs:subClassOf vad:TriG ;
    rdfs:label "DocumentTree" ;
    rdfs:comment """
        Дерево документов (DocumentTree) — специализированный TriG-контейнер
        для организации документов, связанных с бизнес-процессами.

        Каждое дерево документов содержит:
        - Ссылки на документы (PDF, Word и т.д.)
        - Метаданные документов (название, автор, дата)
        - Связи с процессами, к которым они относятся

        Используется для ведения документации процессов.
    """ ;
    dcterms:description "Древовидная структура для документации процессов" .

# Класс Document
vad:Document
    rdf:type rdfs:Class, owl:Class ;
    rdfs:label "Document" ;
    rdfs:comment "Документ, связанный с бизнес-процессом" ;
    dcterms:description "Документ, связанный с процессом" .

# Свойства
vad:hasDocument
    rdf:type rdf:Property, owl:ObjectProperty ;
    rdfs:label "hasDocument" ;
    rdfs:domain vad:TypeProcess ;
    rdfs:range vad:Document ;
    rdfs:comment "Связывает процесс с его документацией" ;
    dcterms:description "Связь процесса с документацией" .

vad:documentSource
    rdf:type rdf:Property, owl:DatatypeProperty ;
    rdfs:label "documentSource" ;
    rdfs:domain vad:Document ;
    rdfs:range xsd:anyURI ;
    rdfs:comment "URL или путь к файлу документа" ;
    dcterms:description "Расположение файла документа" .
```

### В vad-basic-ontology_tech_Appendix.ttl

```turtle
vad:ConceptDocumentTreePredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptDocumentTreePredicate" ;
    vad:includePredicate rdf:type, rdfs:label, vad:hasParentObj ;
    vad:contextTriGType vad:DocumentTree ;
    rdfs:comment "Предикаты для типа DocumentTree" ;
    dcterms:description "Группа свойств для деревьев документов" .

vad:ConceptDocumentPredicate
    rdf:type vad:Tech ;
    rdfs:label "ConceptDocumentPredicate" ;
    vad:includePredicate rdf:type, rdfs:label, vad:documentSource, vad:hasParentObj ;
    rdfs:comment "Предикаты для типа Document" ;
    dcterms:description "Группа свойств для документов" .
```

## Пример использования в RDF-данных

```turtle
# Экземпляр дерева документов
vad:dtree {
    vad:dtree rdf:type vad:DocumentTree ;
        rdfs:label "Дерево документов (TriG)" ;
        vad:hasParentObj vad:root .

    # Документы
    vad:doc1 rdf:type vad:Document ;
        rdfs:label "Документация процесса 1" ;
        vad:documentSource "https://example.com/docs/p1.pdf"^^xsd:anyURI ;
        vad:hasParentObj vad:dtree .

    vad:doc2 rdf:type vad:Document ;
        rdfs:label "Спецификация процесса 1.1" ;
        vad:documentSource "https://example.com/docs/p1.1-spec.docx"^^xsd:anyURI ;
        vad:hasParentObj vad:doc1 .
}

# Связь документов с процессами в ptree
vad:ptree {
    vad:p1 vad:hasDocument vad:doc1 .
    vad:p1.1 vad:hasDocument vad:doc2 .
}
```

## Интеграция с RDF Grapher

Чтобы новый тип полностью функционировал в UI RDF Grapher, может потребоваться:

1. Добавить `vad:DocumentTree` в `VAD_ALLOWED_TYPES` в `index.html`
2. Добавить `vad:Document` в `VAD_ALLOWED_TYPES` в `index.html`
3. Обновить соответствующие SPARQL-запросы

**Примечание:** В issue указано не изменять файлы в папке ver8tree напрямую. Эти изменения JavaScript необходимы для полной интеграции, но выходят за рамки данного примера.

## Устранение неполадок

### Класс не появляется в иерархии

1. Убедитесь, что `rdfs:subClassOf` установлен на `vad:TriG`
2. Перезагрузите онтологию в Protege

### Тип недоступен в Smart Design

1. Проверьте, добавлен ли тип в JavaScript `VAD_ALLOWED_TYPES`
2. Убедитесь, что Tech-объект имеет правильный `vad:contextTriGType`
3. Очистите кэш браузера

### Документы не отображаются в дереве

1. Убедитесь, что `vad:hasParentObj` установлен правильно
2. Проверьте, что родитель существует в том же или доступном TriG
