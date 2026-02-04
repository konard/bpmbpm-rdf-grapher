### auto documentation requirements 
Алгоритм обновления документации в папке https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/doc/ (авто документирование проекта):
- до обновления делай zip-архив всей папки doc и размещай его в папке https://github.com/bpmbpm/rdf-grapher/tree/main/ver9b/doc/old
- обновляй файлы только в корне https://github.com/bpmbpm/rdf-grapher/blob/main/ver9b/doc/ включая 1_example_data.md, 2_triplestore.md и остальные файлы папки /doc. Например, обновление файлов вложенной папки [doc/algorithm](https://github.com/bpmbpm/rdf-grapher/tree/main/ver9b/doc/algorithm) требует отдельного (явного) указания
- при обновлении вначале каждого файла указывай Pull Request по которому происходило его обновление и дату обновления
- язык - русский, схемы в формате mermaid
### Требования к отдельным файлам 
- Folder_Structure.md При формировании doc/Folder_Structure.md При числе строк более 100 делай округление двух последних разрядов, 
например, вместо 1165 пиши 1200.
- important_functions.md Укажи 30 наболее важных функций (вкл.  funSPARQLask() для ASK-запросов и heckIdExistsAsk()) и Pull Request их создания. 
- quadstore_io.md сделай описание взаимодействия с quadstore (вкл. пояснения к именам currentQuads, currentStore.getQuads() и их использование), покажи потоки input & output с другими объектами (окнами, модулями). 
Сделай уточнение какие из них формируются на основе SPARQL-driven approach (SPARQL – запросами), а какие нет и почему.  
Построй подробную схему информационных потоков в mermaid.
- checklistTestButton.md Сводный перечень проверок quadstore, осуществляемых по кнопке Тест с подробным описанием проверки
