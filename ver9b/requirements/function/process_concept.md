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

#### requirements arc
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/requirements/business-requirements.md
- 1 Добавь кнопку New Concept в окно Smart Design.
  - https://github.com/bpmbpm/rdf-grapher/issues/205
  - https://github.com/bpmbpm/rdf-grapher/issues/207
- https://github.com/bpmbpm/rdf-grapher/issues/211 По аналогии с кнопкой "New Concept" создай кнопку "Del Concept\Individ" (delete), удаляющую существующий концепт или индивид.

### N2 New Executor 
аналогично
### N3 New process Dia
- создать можно при условии: есть концепт процесса и у него нет схемы, т.е. нет уже такой "одноименной" схемы, это гарантируется через справочник:    
В окне Создание нового TriG контейнера (VADProcessDia) в справочникt выбора Концепта процесса: должны выводиться объекты ptree, но без тех, у которых уже есть TriG типа VADProcessDia, т.е. у которых уже есть схема процесса.
Определяется через SPARQL на наличие, например: <> vad:hasTrig vad:t_p1 .

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

### D5 Del individ Executor 
Просто.  Удалить все   
      vad:includes vad:Executor21, vad:Executor22 .
 
### Требования не сюда:
- Запись нового элемента TriG осуществляется в конец TriG. - это к реализации SPARQL - запроса, а не его созданию, т.е. требование к Result. Создание Концепта тут не при чем. 
