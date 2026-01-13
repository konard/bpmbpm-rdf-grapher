# rdf-grapher
RDF grapher is a web service for parsing RDF data and visualizing it as a graph

Ранее использовал финский on-line сервис: https://www.ldf.fi/service/rdf-grapher    
В него «кидаем» URL-параметром RDF-данные и смотрим сгенерированную по этим данным схему (RDF Viewer).  
ver1 - ver2 - ver3 - это замена ldf.fi  

### ver1 basic functions 
https://github.com/bpmbpm/rdf-grapher/tree/main/ver1 run: https://bpmbpm.github.io/rdf-grapher/ver1

### ver2 SPARQL + Filter 
https://github.com/bpmbpm/rdf-grapher/tree/main/ver2 run: https://bpmbpm.github.io/rdf-grapher/ver2

### ver3 literals aggregation
https://github.com/bpmbpm/rdf-grapher/tree/main/ver3 run: https://bpmbpm.github.io/rdf-grapher/ver3

### ver 4p, p = Process (VAD)   
https://github.com/bpmbpm/rdf-grapher/tree/main/ver4p run: https://bpmbpm.github.io/rdf-grapher/ver4p   
ранее (более подробный):   
https://bpmbpm.github.io/rdf-grapher/ver4p/old/index4fin1.html

### ver 5t, t = TriG (VAD)
TriG данные с именованным графом. Добавлены два окна: treeview и свойства TriG  
Выбираем пример **Trig VADv2**

https://bpmbpm.github.io/rdf-grapher/ver5t/

### ver6d d = Detailed (VAD)
https://bpmbpm.github.io/rdf-grapher/ver6d/
Выбираем пример **Trig VADv2**
---
## doc
- [НеОсознанный вайб-кодинг (с примером RDF Grapher)](https://habr.com/ru/articles/982634/)
## info
- Робот- программист: https://github.com/link-assistant/hive-mind

Используемые технологии:
- N3.js — JavaScript библиотека для парсинга RDF — GitHub
- Viz.js — WebAssembly версия Graphviz для браузера — GitHub  
Этот сервис работает полностью на стороне клиента (в браузере) и не требует серверной части, что позволяет размещать его на GitHub Pages.

## notation
Продолжение ver1-ver2-ver3 это представление бизнес-процессов в формате RDF - данных в их визуализация через графические нотации BPM: 
- https://fox-manager.com/notacii-dlja-modelirovanija-biznes-processov/
