### programming information
Это памятка к программированию по проекту rdf-grapher. Папка проекта: https://github.com/bpmbpm/rdf-grapher/tree/main/ver9b  
Можно изменять только эту и вложенные в нее папку.  
Комментарии в коде и файлы md создавай на русском языке.  

#### js
- браузерный js
#### programming concept
- Максимальное использование в коде SPARQL-запросов, см. [SPARQL-driven Programming Guide](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/requirements/sparql-driven-programming_min1.md)
- Формирование наборов SPARQL-запросов в отдельных файлах *sparql.js
  
### Ontology 
- [Basic VAD Ontology - Базовая онтология верхнеуровневых процессов](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/ontology/vad-basic-ontology.ttl)
- Технологическая часть онтологии [Tech Appendix - Технологические классы и объекты](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/ontology/vad-basic-ontology_tech_Appendix.ttl)
- [Терминологический словарь (Terminology Dictionary)](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/ontology/term.md), например,  ptree - это хранилище концептов процесса, а индивиды процесса хранятся в TriG типа VADProcessDia. 
 
### requirements
- triple (requirements for the implementation of triplets)
  - Должны поддерживаться оба формата записи триплета - в Simple Triple (простая, полная) и в Shorthand Triple форме (сокращенная, составная).


