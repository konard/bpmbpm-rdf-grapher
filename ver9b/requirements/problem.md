## problem
- https://github.com/bpmbpm/rdf-grapher/tree/main/ver8tree/file Trig_VADv5min2tree2ldf.ttl для просомтра в on-line сервисе: 
https://www.ldf.fi/service/rdf-grapher отрабатывает только файл небольшого объема
## also
- https://github.com/bpmbpm/rdf-grapher/tree/main/ver8tree/doc

## Name
- Особенность: URI с точками в локальном имени (vad:ExecutorGroup_p1.1.1) могут некорректно сериализоваться как prefixed name, так как точка является специальным символом в Turtle.  
Решение: Это ограничение библиотеки N3.js. Для URI с точками в локальном имени N3.Writer предпочитает полный формат <...>.  
https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/design/store/n3js_serialization_format.md  
Какие другие нерекомендованные символя? .:;@

### virtualRDFdata 
- по кнопке virtualRDFdata открывается окно virtualRDFdata - Виртуальные вычисляемые данные, там ttl с коментариями в отличие от фильтра Virtual в окне quadstore
