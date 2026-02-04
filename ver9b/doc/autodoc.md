### auto documentation requirements 
Алгоритм обновления документации в папке https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/doc/ (авто документирование):
- делай архив zip до обновления и размещай его в папке https://github.com/bpmbpm/rdf-grapher/tree/main/ver9b/doc/old
- обновляй файлы только в корне https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/doc/
- при обновлении указывай Pull Request по которому происходило обновление и дату

### Требования к отдельным файлам 
- Folder_Structure.md При формировании doc/Folder_Structure.md При числе строк более 100 делай округление двух последних разрядов, 
например, вместо 1165 пиши 1200.
- important_functions.md Укажи 30 наболее важных функций (вкл.  funSPARQLask() для ASK-запросов и heckIdExistsAsk()) и Pull Request их создания. 
