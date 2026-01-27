# Changelog (История изменений)

Все значимые изменения в онтологии VAD документируются в этом файле.

## [1.3.0] - 2026-01-27

### Удалено (Removed)

- **vad:hasParentTrig** - устаревший предикат удалён из онтологии
  - Был заменён на `vad:hasParentObj` в версии 1.2
  - Предикат `hasParentTrig` использовался для определения родительского TriG графа
  - Теперь иерархия всех объектов (включая TriG) строится через `vad:hasParentObj`
  - Для обратной совместимости код продолжает поддерживать `hasParentTrig` при парсинге, автоматически интерпретируя его как `hasParentObj`

### Изменения в файлах

- `vad-basic-ontology.ttl` - удалено определение `vad:hasParentTrig`
- `vad-basic-ontology_tech_Appendix.ttl` - удалены упоминания `hasParentTrig` в примерах и описаниях
- `comment8a.md` - обновлена документация с учётом удаления `hasParentTrig`
- `Trig_VADv5.ttl` - удалены комментарии с упоминанием `hasParentTrig`
- `index.html` - обновлены комментарии и удалены упоминания `hasParentTrig` в описаниях

### Миграция

При переходе на версию 1.3 необходимо:
1. Заменить все использования `vad:hasParentTrig` на `vad:hasParentObj`
2. Код автоматически обрабатывает старый предикат для обратной совместимости

---

## [1.2.0] - Ранее

### Добавлено

- **vad:hasParentObj** - новый универсальный предикат для построения иерархии объектов
  - Работает для всех типов объектов: TriG, TypeProcess, TypeExecutor
  - Заменяет `vad:hasParentTrig` и `vad:definesProcess`

### Устарело (Deprecated)

- **vad:hasParentTrig** - помечен как устаревший (owl:deprecated true)
  - Заменён на `vad:hasParentObj`
