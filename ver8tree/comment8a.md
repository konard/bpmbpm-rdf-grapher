# Comment 8a: Концепция vad:hasParentObj

## 1. Концепция vad:hasParentObj

### 1.1 Основные принципы

Предикат `vad:hasParentObj` (hasParentObject) обеспечивает:

1. **Единую иерархию для всех объектов**: TriG, TypeProcess, TypeExecutor
2. **Упрощение связей**: Не требуется `vad:definesProcess` - достаточно `vad:hasParentObj`
3. **Полное дерево объектов**: Все объекты с `hasParentObj` отображаются в "Дерево TriG"

### 2.2 Типы объектов и их родители

| Тип объекта | Возможные родители | Пример |
|-------------|-------------------|--------|
| vad:TechTree | - (нет родителя) | vad:root |
| vad:ObjectTree | vad:root | vad:ptree, vad:rtree |
| vad:VADProcessDia | vad:TypeProcess | vad:t_p1 hasParentObj vad:p1 |
| vad:TypeProcess | vad:ptree, другой TypeProcess | vad:p1.1 hasParentObj vad:p1 |
| vad:TypeExecutor | vad:rtree, другой TypeExecutor | vad:exec1.1 hasParentObj vad:exec1 |

### 2.3 Пример иерархии

```turtle
# Корень (не имеет hasParentObj)
vad:root rdf:type vad:TechTree .

# Деревья объектов
vad:ptree rdf:type vad:ObjectTree ;
    vad:hasParentObj vad:root .

vad:rtree rdf:type vad:ObjectTree ;
    vad:hasParentObj vad:root .

# Концепт процесса верхнего уровня
vad:p1 rdf:type vad:TypeProcess ;
    rdfs:label "Процесс 1" ;
    vad:hasParentObj vad:ptree ;
    vad:hasTrig vad:t_p1 .

# Концепт подпроцесса
vad:p1.1 rdf:type vad:TypeProcess ;
    rdfs:label "Процесс 1.1" ;
    vad:hasParentObj vad:p1 ;
    vad:hasTrig vad:t_p1.1 .

# Схема процесса (VADProcessDia)
vad:t_p1 rdf:type vad:VADProcessDia ;
    rdfs:label "Схема t_p1" ;
    vad:hasParentObj vad:p1 .

# Исполнитель
vad:exec1 rdf:type vad:TypeExecutor ;
    rdfs:label "Исполнитель 1" ;
    vad:hasParentObj vad:rtree .
```

## 3. Отображение в "Дерево TriG"

### 3.1 Визуальное выделение

- **Жирный текст**: Объекты типа TriG (VADProcessDia, ObjectTree)
- **Обычный текст**: Объекты типа TypeProcess, TypeExecutor
- **Иконки**: Различные иконки для разных типов объектов

### 3.2 Структура дерева

```
├── Дерево Процессов (ptree) [жирный, TriG]
│   ├── p1 Процесс 1 [процесс]
│   │   ├── t_p1 Схема t_p1 [жирный, TriG]
│   │   │   └── Состав объектов (3)
│   │   │       ├── p1.1 Процесс 1.1
│   │   │       ├── p1.2 Процесс 1.2
│   │   │       └── p1.3 Процесс 1.3
│   │   ├── p1.1 Процесс 1.1 [подпроцесс]
│   │   │   └── t_p1.1 Схема t_p1.1 [жирный, TriG]
│   │   └── p1.2 Процесс 1.2 [подпроцесс]
│   └── p2 Процесс 2 [процесс]
├── Дерево Исполнителей (rtree) [жирный, TriG]
│   ├── exec1 Исполнитель 1
│   │   └── exec1.1 Подисполнитель 1.1
│   └── exec2 Исполнитель 2
```

## 4. Изменения в валидации

### 4.1 Новые правила

1. **vadProcessDiaHasParentObj**: VADProcessDia должен иметь vad:hasParentObj
2. **objectTreeHasParentObj**: ObjectTree должен иметь vad:hasParentObj = vad:root
3. **processConceptsHaveParentObj**: Концепты процессов должны иметь vad:hasParentObj
4. **executorConceptsHaveParentObj**: Концепты исполнителей должны иметь vad:hasParentObj

### 4.2 Обновлённые правила

1. **processMetadataInPtree**: Добавлен vad:hasParentObj в список PTREE_PREDICATES
2. **executorMetadataInRtree**: Добавлен vad:hasParentObj в список RTREE_PREDICATES

## 5. Удалённые элементы (см. CHANGELOG.md)

### 5.1 Удалённые предикаты

- `vad:hasParentTrig` - удалён из онтологии, заменён на `vad:hasParentObj`
- `vad:definesProcess` → больше не используется (достаточно hasParentObj)

### 5.2 Устаревшие классы

- `vad:ProcessTree` → заменён на `vad:ObjectTree` (сохранён для совместимости)
- `vad:ExecutorTree` → заменён на `vad:ObjectTree` (сохранён для совместимости)

## 6. Навигация по кликабельным элементам

### 6.1 Клик на процесс с hasTrig

При клике на детализированный процесс (processSubtype = Detailed/DetailedChild/DetailedExternal):
1. Ищем `vad:hasTrig` для данного процесса в ptree
2. Если найден TriG, переключаемся на него в treeview
3. Отображаем схему этого TriG

### 6.2 Определение типа детализации

- **DetailedChild**: `vad:hasParentObj` схемы указывает на процесс, который является дочерним текущего
- **DetailedExternal**: `vad:hasParentObj` схемы указывает на процесс из другой ветви иерархии

## 7. Совместимость

### 7.1 Обратная совместимость

Для поддержки старых данных:
- При парсинге код продолжает поддерживать `vad:hasParentTrig`, автоматически интерпретируя его как `vad:hasParentObj`
- Классы ProcessTree и ExecutorTree сохранены как подклассы ObjectTree

### 7.2 Миграция данных

При загрузке данных в старом формате:
- `vad:hasParentTrig` автоматически интерпретируется как `vad:hasParentObj`
- Рекомендуется обновить данные до нового формата
- См. CHANGELOG.md для полной истории изменений

---

Дата: 2026-01-27
Версия: 8e
