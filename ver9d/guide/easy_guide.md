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


UPDATE?
