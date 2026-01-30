### problem
-  Показать в окне ldf.fi требует VPN и показывает данные в RDF turtle
-  "Показать в окне ldf.fi (TriG)" и "Показать в окне ldf.fi" есть ограничение на длинну, см. ... и используй https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/file/Trig_VADv5min2tree2ldf.ttl
  
### PR
некоторые PR  
https://github.com/bpmbpm/rdf-grapher/pull/210

Исправление Clone1b: Добавлены примеры формата RDF и интеграция с внешним сервисом LDF  
4 : Добавлена ​​поддержка кириллических символов (\u0400-\u04FF) в шаблоны регулярных выражений для анализа триплетов SPARQL

ver8tree/doc/id-validation-rules.md(новый файл)
- Подробная документация по правилам проверки личности.
- Разрешенные/запрещенные символы
- Правила форматирования и требования к уникальности
- Правила автоматической генерации на основе меток
- Политика и рекомендации по использованию кириллицы

## 2
- нельзя создавать никакие объекты (даже разных типов) с одинаковым id
- концепты могут создавать без заполненного label - это допустимо?

### Интересно
- для p1 схема есть vad:t_p1, а индивидов - нет

### context
loss of context
https://github.com/bpmbpm/rdf-grapher/pull/229 в части "Задача 3: Выбор проверенной концепции в «Создание нового контейнера TriG»
потеряла исходные требования:". Где были требования к созданию TriG - не помню. Или не потеряла ... ?
- Описание функций удаления: https://github.com/bpmbpm/rdf-grapher/issues/211
- 1 Добавь кнопку New Concept в окно Smart Design. https://github.com/bpmbpm/rdf-grapher/issues/205

### 3
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver8tree/doc/sparql-driven-programming.md
- https://www.reddit.com/r/bioinformatics/comments/say1cc/very_confused_on_the_difference_between_database/
- https://github.com/dotnetrdf/docs/blob/main/src/2.7.x/user_guide/Working-With-Triple-Stores.md/

UI - стили, масштабирование, панели свойств, клики по узлам и т.п.

