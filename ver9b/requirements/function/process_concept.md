## process \ Executor concept + Dia (New + Del)
Создание и удаление концепта процесса. 
### 1 New concept process
Функциональные требования к Созданию концепта процесса. При создании Концепта процесса.  
Ввести 
- обязательно: id, label, Parent (из справочника ptree) 
- не обязательно: decription  
Аналогично и для концепта Исполнителя

Не забыть проверки: 
- отсутствие одноименного в ptree (имеющегося c таким же именем), допустимость id (укажи ограничения quadstore на формат id для subject) + рекомендации по id (не точки).
- 

#### requirements arc
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/requirements/business-requirements.md
- 1 Добавь кнопку New Concept в окно Smart Design.
  - https://github.com/bpmbpm/rdf-grapher/issues/205
  - https://github.com/bpmbpm/rdf-grapher/issues/207
- https://github.com/bpmbpm/rdf-grapher/issues/211 По аналогии с кнопкой "New Concept" создай кнопку "Del Concept\Individ" (delete), удаляющую существующий концепт или индивид.

### 2 New process Dia
- создать можно при условии: есть концепт процесса и у него нет схемы, т.е.: 
  - справочник:  
В окне Создание нового TriG контейнера (VADProcessDia) в справочникt выбора Концепта процесса: должны выводиться объекты ptree, но без тех, у которых уже есть TriG типа VADProcessDia, т.е. у которых уже есть схема процесса.
Определяется через SPARQL на наличие, например: <> vad:hasTrig vad:t_p1 .

### 3 Del concept process
- Условия:
  - существует такой concept process
  - не имеет дочерних объектов, свой TriG, и индивидов в других схемах
 
### 4 Del cprocess Dia
- Условия: наличие схемы

### Требования не сюда:
- Запись нового элемента TriG осуществляется в конец TriG. - это к реализации SPARQL - запроса, а не его созданию, т.е. требование к Result. Создание Концепта тут не при чем. 
