## recommendations

### Linked Data
- Используй всегда полную форму rdf:type, а не qname a

### Interface
-  в окне Дерево TriG должны отражаться все TriG, кроме ptree и rtree, а также узла root, т.е. "<> rdf:type vad:VADProcessDia" с учетом иерархии, заданной vad:hasParentTrig.

###
Ключевые правила (запиши их в состав онтологии):  
1. Добавлять триплеты мы можем только в какой-либо TriG, поэтому в окне Smart Design в поле TriG: нужно выбрать конкретный TriG. Кнопка «New TriG (VADProcessDia)» позволяет добавлять только TriG типа VADProcessDia. Другие типы TriG (новые TriG) не добавляются.
