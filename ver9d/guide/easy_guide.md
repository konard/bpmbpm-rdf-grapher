## easy_guide
Простое руководство

### 1 SPARQL 
Пример изменений в quadstore  
Например, есть задача:
На VAD-диаграмме нарисовать стрелку от процесса 1 к процессу 2  
Это означает Назначить процесса 1 значение пердиката hasNext (имеет следующего) равное процесс 2: `:Процесс1 :hasNext :Процесс1 .` 
Применительно к примеру Trig_VADv8.ttl

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

#### INSERT

UPDATE?
