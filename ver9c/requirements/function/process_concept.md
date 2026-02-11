## process \ executor concept + Dia (New + Del)
Создание и удаление концепта процесса. 
### N1 New concept process
Функциональные требования к Созданию концепта процесса. При создании Концепта процесса.  
Ввести 
- обязательно: id, label, Parent (из справочника ptree) 
- не обязательно: decription  
**Аналогично и для концепта Исполнителя**

Не забыть проверки: 
- отсутствие одноименного в ptree (имеющегося c таким же именем), допустимость id (укажи ограничения quadstore на формат id для subject) + рекомендации по id (не точки).
- 
#### N1.1

При создании Индивида процесса:
```
vad:t_p1 {
vad:t_p1 a vad:VADProcessDia;
    rdfs:label "Схема t_p1 процесса p1";
    vad:hasParentObj vad:p1.
```
Добавляется:
```
vad:p1_1_1 vad:isSubprocessTrig vad:t_p1;
    vad:hasExecutor vad:ExecutorGroup_p1_1_1;
```
и в конец:
```
vad:ExecutorGroup_p1_1_1 a vad:ExecutorGroup;
    dcterms:description "Группа исполнителей процесса p1_1_1"
```

#### requirements arc
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/requirements/business-requirements.md
- 1 Добавь кнопку New Concept в окно Smart Design.
  - https://github.com/bpmbpm/rdf-grapher/issues/205
  - https://github.com/bpmbpm/rdf-grapher/issues/207
- https://github.com/bpmbpm/rdf-grapher/issues/211 По аналогии с кнопкой "New Concept" создай кнопку "Del Concept\Individ" (delete), удаляющую существующий концепт или индивид.

### N2 New concept Executor 
аналогично
### N3 New process Dia
- создать можно при условии: есть концепт процесса и у него нет схемы, т.е. нет уже такой "одноименной" схемы, это гарантируется через справочник:    
В окне Создание нового TriG контейнера (VADProcessDia) в справочникt выбора Концепта процесса: должны выводиться объекты ptree, но без тех, у которых уже есть TriG типа VADProcessDia, т.е. у которых уже есть схема процесса.
Определяется через SPARQL на наличие, например: <> vad:hasTrig vad:t_p1 .

### New individ process
Сейчас при создании индивида процесса можно добавить предикат vad:hasNext с RDFobject, отсутствующем на схеме. Это назовем режим "vad:hasNext на любой". Второй режим "vad:hasNext на существующий" должен вместо справочника ptree (список всех концептов) справочник всех индивидов процесса в данной схеме (TriG). Таким образом, vad:hasNext будет ссылаться на уже существующий в схеме объект. Предусмотри оба режима в окне Создание нового индивида чек-боксом. По умолчанию - "vad:hasNext на существующий". Чек бокс - одного стиля, например, как в окне "ID нового концепта" (круглый).
https://github.com/bpmbpm/rdf-grapher/issues/313 
## Del
### D1 Del concept process
- Условия:
  - существует такой concept process
  - не имеет дочерних объектов, свой TriG, и индивидов в других схемах

### D2 Del concept Executor 
аналогично
### D3 Del process Dia
- Условия: наличие схемы процесса  
При удалении - удалятся все индивиды процесса (удалится TriG, где хранятся индивиды), поэтому ссылки на них из других TriG не сработают. 

### D4 Del individ process
Внимание: Функция не рекомендована, т.к. не удаляет объекты vad:ExecutorGroup_ и предикаты vad:hasNext других индивидов процесса.

Нужно **по каждому TriG**: 
- минимум:
  - удалить все объекты типа - это блок, включая исходящие связи:
```
 vad:p1.1.1 vad:isSubprocessTrig vad:t_p1.1 ;
        vad:hasExecutor vad:ExecutorGroup_p1.1.1 ;
        vad:hasNext vad:p1.1.2 .
```  
  - удалить сами vad:ExecutorGroup
```
   # Группы исполнителей (ID формируется как ExecutorGroup_ + ID процесса)
    vad:ExecutorGroup_p1.1.1 rdf:type vad:ExecutorGroup ;
        rdfs:label "Группа исполнителей процесса p1.1.1" ;
        vad:includes vad:Executor21 .    
```
- максимум: в этом же TriG удалить связи не с этого, а на этот объект, т.е. других индивидов (входящие связи)  
      vad:hasNext vad:p1.1.1 .
- не нужно учесть, что нет ссылок извне на индивид, т.к. [resume](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/analysis/new_individ_process.md#31-resume-bpmbpm) ссылки только на TriG (дочерний или внешний) через virtualRDFdata

``` 
vad:processSubtype
vad:DetailedExternal
```
#### D4 Del individ process / implementation
Реазизация см https://github.com/bpmbpm/rdf-grapher/pull/310  
Реализовать удаление всего subject без указания предикатов? Т.е. удаление в заданном TriG любого предиката и RDFobject по известному subject? Это важно для дальнейшего увеличения номенклатуры предикатов индивида без изменения кода.  
Код уже использовал обобщённый паттерн 
`DELETE WHERE { GRAPH <trig> { <subject> ?p ?o . } }`  
для этапов 1 и 2 удаления (см. `GENERATE_DELETE_PROCESS_INDIVID_QUERY` в sparql.js, строки 293-298 и 307-311).
- Удалить все исходящие тройки отдельных элементов ( vad:isSubprocessTrig, vad:hasExecutor, vad:hasNext)
- Удалить связанный ExecutorGroupобъект (со всеми его rdf:type, rdfs:label, vad:includes).



### D5 Del individ Executor 
Просто.  Удалить все   
      vad:includes vad:Executor21, vad:Executor22 .

## Also
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/doc/algorithm/io_concept_individ_v3.md
 
### Требования не сюда:
- Запись нового элемента TriG осуществляется в конец TriG. - это к реализации SPARQL - запроса, а не его созданию, т.е. требование к Result. Создание Концепта тут не при чем. 
