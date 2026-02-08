## store
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/doc/quadstore_io.md
- [2. Сравнительная таблица библиотек  doc/LD2/Problem/](https://github.com/bpmbpm/doc/blob/main/LD2/Problem/problem1.md#2-%D1%81%D1%80%D0%B0%D0%B2%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F-%D1%82%D0%B0%D0%B1%D0%BB%D0%B8%D1%86%D0%B0-%D0%B1%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA)

### полный semantic Quadstore + reasoning 
https://github.com/bpmbpm/rdf-grapher/pull/323
- Реализован полный semantic reasoning для Virtual TriG
- Реализован 5-stage migration plan для унификации Quadstore

https://github.com/bpmbpm/rdf-grapher/pull/325
- Удалён currentQuadsглобальный массив — теперь все операции используют currentStore(N3.Store).
- Удалён virtualRDFdataглобального объекта — виртуальных данных, хранящихся в vad:Virtualграфах (vt_*).
- Переименованы метки пользовательского интерфейса с "virtualRDFdata" на "VirtualTriG" в панелях свойств.
- Переименован фильтр Quadstore с «Virtual» на «Virtual TriG (виртуальный TriG сохраняемых параметров)».
- Обновление документации: файл 10_virtualTriG.md с указанием проблемы ver9c_1rea1c  #324
- Создан файл quadstore_io_v3.md, документирующий завершенную миграцию на единый quadstore.
