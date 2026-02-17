## drop-down_list
Выбор из выпадающего списка, list / drop down menu. Формировнаие справочника / списка через SPARQL

Задача:  
Заполнение справочника (выбор из выпадающего списка, list, переключатель, switcher) через SPARQL-запрос. На примере `rdf-data_clip.ttl`.  
Допустим нужно создать новый концепт процесса. Кнопка `New Concept`, выбор `Новый концепт процесса`.  
Необходимо заполнить справочник `vad:hasParentObj:` (Родительский элемент в иерархии).  
В нем должны отображаться все элементы дерева ptree. Причем в формате: id и в скобках label.  

1 Для формирования справочника используем функцию funSPARQLvalues.  
Описание функции funSPARQLvalues приведено в https://github.com/bpmbpm/rdf-grapher/blob/main/ver9d/doc/common/important_functions.md возвращаемые параметры:

#### Параметры

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `sparqlQuery` | `string` | -- | SPARQL SELECT запрос |
| `variableName` | `string` | `'value'` | Имя переменной для извлечения значений из результатов |

#### Возвращаемое значение

`Array<{uri: string, label: string}>` — массив объектов с URI и меткой каждого результата. При отсутствии данных или ошибке возвращает пустой массив.

#### Пример использования

```javascript
// Получить все концепты процессов из дерева процессов
const processes = funSPARQLvalues(`
    SELECT ?process ?label WHERE {
        GRAPH vad:ptree {
            ?process rdf:type vad:TypeProcess .
            ?process rdfs:label ?label .
        }
    }
`, 'process');

// Результат: [{uri: "http://example.org/vad#pGA", label: "Процесс ГА"}, ...]
```

Array<{uri: string, label: string}> — массив объектов с URI и меткой каждого результата.
