## documentation
### list
- https://github.com/bpmbpm/rdf-grapher/pull/202
- Smart Design - Справка по работе https://github.com/bpmbpm/rdf-grapher/blob/main/ver7so/help.md
- old concept
- predicate.xlsx https://github.com/bpmbpm/rdf-grapher/blob/main/ver7so/predicate.xlsx
### history
- term.md прежний: https://github.com/bpmbpm/rdf-grapher/blob/main/ver7so/term.md ; исходный в Onto4 https://github.com/bpmbpm/rdf-grapher/issues/119

### also
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver7so/info.md
- **aris** и др. https://github.com/bpmbpm/rdf-grapher/tree/main/ver8/doc

## my
### ui-documentation.md
- https://github.com/bpmbpm/rdf-grapher/issues/201
  - Например, описание окна "SPARQL запрос:" должно включать (фрагмент):  
Окно "SPARQL запрос:" по умолчанию содержит запрос к Дереву концептов процессов (vad:ptree) потому, что в "Дерево TriG:" именно vad:ptree становится выделенным (selected) при старте отрисовки схемы (по кнопке Показать):
  - Далее в SPARQL запрос автоматически подставляется выделенный в "Дерево TriG:" TriG: или схема процесса (vad:VADProcessDia) или TriG типа vad:ObjectTree например:
  -  запрос применяется к конкретному TriG (с возможностью ручной корректировки запроса).
- для окна **Карточка объекта** добавить:
подсчет объектов:
  - rdfs:label "Схема t_p2 процесса p2"
  - vad:hasParentObj vad:p2
  - Процессы (vad:TypeProcess) 5 шт.
  - Триплеты 36 шт.
