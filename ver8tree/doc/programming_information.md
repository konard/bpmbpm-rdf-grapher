### programming information
памятка к программированию по проекту rdf-grapher 
папка проекта: https://github.com/bpmbpm/rdf-grapher/tree/main/ver8tree
#### programming concept
- Максимальное использование в коде SPARQL-запросов, см. [SPARQL-driven Programming Guide](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/doc/sparql-driven-programming.md)
- Формирование наборов SPARQL-запросов в файлах
  - [Модуль для создания новых Концептов (Concept) в системе RDF Grapher](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/create_new_concept.js)
  - [Модуль для удаления Концептов и Индивидов (процессов и исполнителей), а также удаления схем процессов в системе RDF Grapher](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/del_concept_individ.js)
  - [SPARQL_QUERIES - Коллекция SPARQL запросов для формирования справочников окна Smart Design](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/sparql-queries.js)
 
### Ontology 
- [Basic VAD Ontology - Базовая онтология верхнеуровневых процессов](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/vad-basic-ontology.ttl)
- Технологическая часть онтологии [Tech Appendix - Технологические классы и объекты](https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/vad-basic-ontology_tech_Appendix.ttl)
 
### requirements
- triple (requirements for the implementation of triplets)
  - Должны поддерживаться оба формата записи триплета - в Simple Triple (простая, полная) и в Shorthand Triple форме (сокращенная, составная).
