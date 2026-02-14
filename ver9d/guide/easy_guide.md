## easy_guide
Простое руководство

## SPARQL 
### 1 SELECT
Пример изменений в quadstore  
Например, есть задача:
На VAD-диаграмме нарисовать стрелку от процесса 1 к процессу 2.  
Это означает Назначить "Процесс 1" значение пердиката hasNext (имеет следующего) равное "Процесс 2":  
`:Процесс1 :hasNext :Процесс1 .`  
Ниже применительно к примеру Trig_VADv8.ttl

#### 1.1 select semantechs.co.uk
https://www.semantechs.co.uk/turtle-editor-viewer/  
Рассмотрим пример. Введем TriG (схему):
```
@prefix vad: <http://example.org/vad#> .
vad:t_p1 {
vad:p1_1 vad:hasNext vad:p1_2 .
}
```
Смотрим граф. Хотим вывести все элементы графа.    
SPARQL `select * {?s ?p ?o}` выдаст пустой ответ, т.к. у нас TriG.  
Поэтому (+ кнопка SPARQL query):
```
PREFIX vad: <http://example.org/vad#>
SELECT ?s ?p ?o
WHERE {
    GRAPH vad:t_p1 {
        ?s ?p ?o .
    }
}
```
#### 1.2 select rdf-grapher/ver3/
Можем повторить на https://github.com/bpmbpm/rdf-grapher/tree/main/ver3 = https://bpmbpm.github.io/rdf-grapher/ver3/   
У нас (rdf-grapher/ver3) же граф \ RDF **передаются параметром**, поэтому [пример](https://bpmbpm.github.io/rdf-grapher/ver3/?rdf=%40prefix+vad%3A+%3Chttp%3A%2F%2Fexample.org%2Fvad%23%3E+.%0Avad%3At_p1+%7B%0Avad%3Ap1_1+%0Avad%3AhasNext+vad%3Ap1_2+.%0A%7D&from=trig&to=svg)

#### 1.3 SPARQL-Playground
Аналогично на  
https://atomgraph.github.io/SPARQL-Playground/

#### 2 UPDATE
info: https://github.com/bpmbpm/doc/blob/main/LD2/sparql2.md#5-insert-data-vs-insert   
на примере Пример Trig_VADv8.ttl 
#### 2.1 INSERT DATA
Делаем связь типа hasNext с Процесс 2 на Процесс 1:    
`:Процесс2 :hasNext :Процесс1 .`  
```
PREFIX vad: <http://example.org/vad#>
INSERT DATA {
    GRAPH vad:t_p1 {
        vad:p1_2 vad:hasNext vad:p1_1 .
    }
}
```
#### 2.2 DELETE DATA
Удаляем следанную в 2.1 связь
```
PREFIX vad: <http://example.org/vad#>
DELETE DATA {
    GRAPH vad:t_p1 {
        vad:p1_2 vad:hasNext vad:p1_1 .
    }
}
```
Примеры 2.1 и 2.2 демонстрируют INSERT и DELETE, например, в методах Add hasNext Dia (окно Свойства объекта схемы) и часть операции при создании нового индивида процесса (окно создание нового индивида процесса по кнопке New Individ в блоке SD).  
Список допустимых target, добавляемых в список выпадающего справочника зависит от опции, например, "vad:hasNext на существующий (индивиды в TriG)".

#### 2.3 DELETE 
Более сложный пример.    
Задача: Удалить индивид процесса p1_1 в схеме t_p1 (в схеме только индивиды процесса).   
Напомню, что есть условие: не более одного индивида одноименного индивида в схеме, см. [software_limitations.md](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9d/requirements/software_limitations.md).
```
# issue #309: Удаление всех исходящих триплетов индивида процесса
DELETE WHERE {
    GRAPH vad:t_p1 {
        vad:p1_1 ?p ?o .
    }
}
```
Однако МетаМодель ver9d пердполагает взаимосвязи, которые также при удалении индивида процесса нужно удалить.  
Первая - это привязанная к индивиду (и единственная) группа исполнителей процесса (индивида процесса): 
```
# issue #309: Удаление объекта ExecutorGroup
DELETE WHERE {
    GRAPH vad:t_p1 {
        vad:ExecutorGroup_p1_1 ?p ?o .
    }
}
```
Вторая - входящих vad:hasNext (при наличии) в удаляемый индивид процесса.  
```
# issue #309: Удаление входящей связи vad:hasNext от vad:p2_1
DELETE DATA {
    GRAPH vad:t_p2 {
        vad:p2_1 vad:hasNext vad:p1_1 .
    }
}
```
Данный SPARQL можно сделать более универсальным, например, удалять не конкретную связь, а все связи vad:hasNext на vad:p1_1.  


