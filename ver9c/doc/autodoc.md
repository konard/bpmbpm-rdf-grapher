## auto documentation requirements 
### general requirements
Алгоритм обновления документации в папке https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/doc/ (авто документирование проекта):
- до обновления делай zip-архив всей папки doc и размещай его в папке https://github.com/bpmbpm/rdf-grapher/tree/main/ver9c/doc/old
- обновляй файлы только в корне https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/doc/ включая 1_example_data.md, 2_triplestore.md и остальные файлы папки /doc. Например, обновление файлов вложенной папки [doc/algorithm](https://github.com/bpmbpm/rdf-grapher/tree/main/ver9c/doc/algorithm) требует отдельного (явного) указания
- при обновлении вначале каждого файла указывай Pull Request по которому происходило его обновление и дату обновления
- при описании функции - указывай модуль
- язык - русский, схемы в формате mermaid
### file requirements
- Folder_Structure.md При формировании doc/Folder_Structure.md При числе строк более 100 делай округление двух последних разрядов, 
например, вместо 1165 пиши 1200.

