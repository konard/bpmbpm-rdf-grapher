### tmp
Создай в файле architecture.md архитектуру rdf-grapher ver9d, включающую все основные архитектурные элементы, в том числе, все основные окна (девять модулей), quadstore c указанием типов TriG. Кроме текстового описания добавь схемы в mermaid c указанием основных связей и информационных потоков между элементами архитектуры.
Размести файл в папке https://github.com/bpmbpm/rdf-grapher/tree/main/ver9d/design/architecture  

funSPARQLvaluesComunicaUpdate https://github.com/bpmbpm/rdf-grapher/issues/293

Скриншоты https://github.com/bpmbpm/rdf-grapher/pull/304

## 2 Plan
- типы схем - структурные (см. analysys), комментариии (2 шт),
- Help в файле, но с привязкой к тематической папке  
- proj вкладка - раобраться
- В последствии мыши на объекте схемы или treeview. ? 
- Методы - по правой кнопке на объект схемы + разбор кода под нее.
- Задавать в RDF параметры Макс. длина имени: и Макс. длина VAD:. Размер VAD - как параметр к схеме, ко всем схемам? 
## OK
- добавить - объединить Deta \ notDeta см. [vad-basic-ontology_tech_Appendix_nav.](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9d/ontology/vad-basic-ontology_tech_Appendix_nav.md#4-%D1%81%D1%85%D0%B5%D0%BC%D0%B0-%D0%B2%D0%B7%D0%B0%D0%B8%D0%BC%D0%BE%D1%81%D0%B2%D1%8F%D0%B7%D0%B5%D0%B9-mermaid) - OK
- Реализацию reasoner в папке 11_reasoner.
## Далеко
- Режим без Virtual, только на Reasoner (Virtual - это лишь как кэш). сделать 

### SHACL
Верификация RDF - как внешний модуль и вообще отдельным проектом? Запрет разных комбинаций в RDF  
3 Проверка .ttl на допустимые объекты и предикаты
Нужно сделать проверку на дублирование вычисляемых значений в Virtual TriG и аналогичных триплетов (утверждений) файла .ttl  (не должно быть vad:DetailedExternal, или rdfs:label для объектов ExecutorGroup и т.п. в RDF-данных из файла .ttl).
В окне quadstore рядом с кнопкой «Тест» добавь кнопку «Valid.ttl».
В ней должно проверяться содержимое загруженного файла, например, Trig_VADv8.ttl. Правила задаются в файле https://github.com/bpmbpm/rdf-grapher/tree/main/ver9d/ontology/valid_SHACL.ttl SHACL правилами.
Правила должны включать отсутствие в загруженном .ttl vad:DetailedExternal, vad:notDetailedExternal и подобных, которые вычисляются автоматически в рамках Virtual TriG. 
Не должно быть в проверяемом файле также предиката rdfs:label для объектов ExecutorGroup (они тоже формируются в virtual TriG). 
Логику проверки сформируй в 2_triplestore_test_valid_logic.js и 2_triplestore_test_valid_sparql.js (или 2_triplestore_test_valid_shacl.js) в папке https://github.com/bpmbpm/rdf-grapher/tree/main/ver9d/2_triplestore/2_triplestore_test в соответствии с [4. Соглашения по именованию файлов]( https://github.com/bpmbpm/rdf-grapher/blob/main/ver9d/doc/Folder_Structure.md#4-%D1%81%D0%BE%D0%B3%D0%BB%D0%B0%D1%88%D0%B5%D0%BD%D0%B8%D1%8F-%D0%BF%D0%BE-%D0%B8%D0%BC%D0%B5%D0%BD%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%8E-%D1%84%D0%B0%D0%B9%D0%BB%D0%BE%D0%B2)

### 2
1 метод New Process Individ.
1.1 при подстановке "TriG (схема процесса):" это поле должно быть закрыто для редактирования.
1.2 Поле "Тип индивида: \ Индивид процесса" также должно быть закрыто для редактирования.

Действия
1 Загрузили шаблон Trig_VADempty_v1.ttl (из «Загрузить» пример или кнопка Загрузить)
2 Создаем концепты процессов, Окно SD, Кнопка New concept
p1 Процесс 1 «Изготовление скрепки» vad:hasParentObj ptree
p1_1 Процесс 1.1 «Отрезать проволоку» и p1_2 Процесс 2.1 «Согнуть проволоку»
3 Создаем концепты исполнителя Окно SD, Кнопка New concept
(Исполнитель 1 и Исполнитель 2) 
vad:Org-structure

4 Создаём схему процесса p1 Окно SD, Кнопка New TriG (VADProcessDia)
Остальные действия (методы) уже доступны контекстно как методы Диаграммы или Свойства объекта диаграммы
5 В дереве окна Дерево TriG (treeview) находим созданную схему (диаграмму). Можно воспользоваться поиском в Дерево TriG (treeview)  
5.1 Создаем New Process Individ
Выбираем  p1_1
Повторяем для p1_2
6 Далее создаем к ним исполнителей, Выделяем нужный Индивид процесса, например, p1_1 
В окне Свойства объекта диаграммы кнопка Метод и выбор New Executor Individ
Далее со вторым процессом (p1_1)
7 hasNext
(можно было обойтись без этого шага через один из вариантов:
- при создании индивида концепта процесса p1_1 выбрать опцию показывать все концепты и там выбрать p1_2
- вначале создать p1_2, а при создании p1_1 с опцией показать индивиды процесса, сделать соединение с p1_1, который уже есть на схеме.
Посмотреть как будут отображаться имена \ названия

