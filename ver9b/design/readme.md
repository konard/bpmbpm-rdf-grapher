## design
Проектные (практические \ рабочие) решения. Исследования см. папку analysis
### js-lib
#### quadstore (TriG) and SPARQL
- ver9b SimpleVsShorthandTriple.md [6. Альтернативные библиотеки](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/doc/SimpleVsShorthandTriple.md#6-%D0%B0%D0%BB%D1%8C%D1%82%D0%B5%D1%80%D0%BD%D0%B0%D1%82%D0%B8%D0%B2%D0%BD%D1%8B%D0%B5-%D0%B1%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA%D0%B8)
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/requirements/SPARQL.md
- quadstore (TriG) and SPARQL https://github.com/bpmbpm/doc/blob/main/LD2/Problem/problem1.md 

### old
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/doc/aris-alignment-proposals.md
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/doc/links1.md
- Appendix 1: Class Hierarchy https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/doc/appendix-to-ontology.md
 
### design solution
#### SPARQL
- https://github.com/bpmbpm/rdf-grapher/pull/255 ver9b/3_sd/3_sd_logic.js — заменена логика applyTripleToRdfInput() на Comunica-based, добавлена serializeStoreToTriG()
использование внешних библиотек (Comunica, N3.js) для выполнения SPARQL запросов является правильным подходом вместо написания собственного regex-парсера.
- ранее: https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/doc/SimpleVsShorthandTriple.md
