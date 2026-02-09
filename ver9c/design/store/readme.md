## store
- https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/doc/quadstore_io.md
- [2. Сравнительная таблица библиотек  doc/LD2/Problem/](https://github.com/bpmbpm/doc/blob/main/LD2/Problem/problem1.md#2-%D1%81%D1%80%D0%B0%D0%B2%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F-%D1%82%D0%B0%D0%B1%D0%BB%D0%B8%D1%86%D0%B0-%D0%B1%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA)

## 1 Полный semantic Quadstore + reasoning 
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

## 2 Пошел в отказ: https://github.com/bpmbpm/rdf-grapher/pull/327
## Summary

Fixes the "currentQuads is not defined" error that occurred when loading RDF files manually.

### Root Cause

PR #325 (issue #324) removed the global `currentQuads` array to migrate to using only `currentStore` (N3.Store). However, many files in the codebase still referenced `currentQuads`, causing JavaScript "undefined" errors when:
- Loading files manually via the file upload
- Using Smart Design features
- Using SPARQL queries

### Solution

This fix restores backward compatibility by: Это исправление восстанавливает обратную совместимость следующим образом:

1. **Restored `currentQuads` variable** in `vadlib.js` as a global array \ Восстановлена currentQuads​​переменная в vadlib.jsвиде глобального массива.
2. **Added helper functions:**
   - `getCurrentQuads()` - safely returns quads from currentStore or the array
   - `syncCurrentQuads()` - synchronizes the array with currentStore after updates
3. **Updated all affected files** to use `getCurrentQuads()` where appropriate
4. **Added `syncCurrentQuads()` calls** after store initialization/updates

### Files Changed

| File | Changes |
|------|---------|
| `ver9c/9_vadlib/vadlib.js` | Restored currentQuads, added getCurrentQuads() and syncCurrentQuads() |
| `ver9c/5_publisher/5_publisher_logic.js` | Added syncCurrentQuads() calls after store init |
| `ver9c/2_triplestore/2_triplestore_logic.js` | Added syncCurrentQuads() call |
| `ver9c/2_triplestore/2_triplestore_ui.js` | Use getCurrentQuads() as fallback |
| `ver9c/3_sd/3_sd_logic.js` | Use getCurrentQuads() and syncCurrentQuads() |
| `ver9c/3_sd/3_sd_ui.js` | Use getCurrentQuads() for quad iteration |
| `ver9c/3_sd/3_sd_create_new_concept/3_sd_create_new_concept_logic.js` | Use getCurrentQuads() |
| `ver9c/3_sd/3_sd_create_new_individ/3_sd_create_new_individ_logic.js` | Use getCurrentQuads() |
| `ver9c/3_sd/3_sd_create_new_trig/3_sd_create_new_trig_logic.js` | Use getCurrentQuads() |
| `ver9c/3_sd/3_sd_del_concept_individ/3_sd_del_concept_individ_logic.js` | Use getCurrentQuads() |
| `ver9c/8_infoSPARQL/8_infoSPARQL_ui.js` | Use getCurrentQuads() |

## Test Plan

- [ ] Load index.html from ver9c directory
- [ ] Select "Trig_VADv7.ttl" from the example dropdown
- [ ] Verify no "currentQuads is not defined" error appears in console
- [ ] Verify the diagram is displayed correctly
- [ ] Test Smart Design features (New Concept, New Individ, etc.)
- [ ] Test SPARQL query execution

## Issue Reference

Fixes bpmbpm/rdf-grapher#326

---
## 2.1 Проблемы
во время миграции с currentQuadsна currentStore(N3.Store) в задаче bpmbpm/rdf-grapher#326  
Поломался Virtual TriG,  
востанавливаем https://github.com/bpmbpm/rdf-grapher/pull/329  
вопросы по Virtual TriG https://github.com/bpmbpm/rdf-grapher/pull/331

## 3 Перевод вслед за и других массивов
- store_concept_v4.md - Документирует текущее состояние хранилища данных Quadstore: https://github.com/bpmbpm/rdf-grapher/pull/333
  - Подтверждает завершение миграции: currentQuads и virtualRDFdata удалено.
  - currentStore(N3.Store) является единственным источником истины.
  - см. store_concept_v4.md [Рекомендации по дальнейшей миграции](https://github.com/bpmbpm/rdf-grapher/blob/main/ver9c/design/store/store_concept_v4.md#%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D0%B8-%D0%BF%D0%BE-%D0%B4%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%B9%D1%88%D0%B5%D0%B9-%D0%BC%D0%B8%D0%B3%D1%80%D0%B0%D1%86%D0%B8%D0%B8)
Следующие массивы рекомендуется удалить в ближайшей итерации:
- nodeTypesCache, nodeSubtypesCache, 4. allTrigGraphs https://github.com/bpmbpm/rdf-grapher/pull/333
  
