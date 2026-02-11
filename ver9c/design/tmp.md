### tmp
Создай в файле architecture.md архитектуру rdf-grapher ver9c, включающую все основные архитектурные элементы, в том числе, все основные окна (девять модулей), quadstore c указанием типов TriG. Кроме текстового описания добавь схемы в mermaid c указанием основных связей и информационных потоков между элементами архитектуры.
Размести файл в папке https://github.com/bpmbpm/rdf-grapher/tree/main/ver9c/design/architecture  

funSPARQLvaluesComunicaUpdate https://github.com/bpmbpm/rdf-grapher/issues/293

Скриншоты https://github.com/bpmbpm/rdf-grapher/pull/304

## 2 Plan
Реализацию reasoner в папке 11_reasoner  
типы схем - структурные (см. analys), комментариии (2 шт), Help в файле, но с привязкой к тематической папке  
proj вкладка - раобраться

В последствии сделать режим без Virtual, только на Reasoner (Virtual - это лишь как кэш)
Правая кнопка мыши на объекте схемы или treeview.  
Методы - по правой кнопке на объект схемы + разбор кода под нее.
Верификация RDF - как внешний модуль и вообще отдельным проектом? Запрет разных комбинаций в RDF

## 3
добавить - объединить Deta \ notDeta см. [vad-basic-ontology_tech_Appendix_nav.](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/ontology/vad-basic-ontology_tech_Appendix_nav.md#4-%D1%81%D1%85%D0%B5%D0%BC%D0%B0-%D0%B2%D0%B7%D0%B0%D0%B8%D0%BC%D0%BE%D1%81%D0%B2%D1%8F%D0%B7%D0%B5%D0%B9-mermaid)
