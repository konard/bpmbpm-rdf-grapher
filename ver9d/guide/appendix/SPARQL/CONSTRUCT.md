## CONSTRUCT
Пояснение к CONSTRUCT из примера https://github.com/bpmbpm/rdf-grapher/blob/main/introduction/introduction.md#6-semantic-reasoning
```
PREFIX vad: <http://example.org/vad#>

# CONSTRUCT для вывода транзитивных связей
CONSTRUCT {
?ancestor vad:hasDescendant ?descendant .
}
WHERE {
?ancestor vad:hasParentObj+ ?descendant .
}
```
Разбор данного SPARQL‑запроса

---

### 1. PREFIX
```sparql
PREFIX vad: <http://example.org/vad#>
```
- **Что это**: объявление префикса для сокращения длинных URI.
- **Зачем**: вместо того, чтобы каждый раз писать полный URI `http://example.org/vad#hasDescendant`, можно использовать короткое `vad:hasDescendant`.
- **Как работает**: префикс `vad:` теперь «замещает» начало URI. Все имена после `vad:` будут автоматически расширены до полного URI.

---

### 2. CONSTRUCT‑блок
```sparql
CONSTRUCT {
    ?ancestor vad:hasDescendant ?descendant .
}
```
- **Что это**: директива SPARQL для **генерации новых RDF‑троек** на основе результатов запроса.
- **Цель**: создать новые утверждения вида *«?ancestor имеет потомка ?descendant»*.
- **Синтаксис**:
  - `?ancestor` и `?descendant` — переменные (будут подставлены значения из `WHERE`).
  - `vad:hasDescendant` — предикат (отношение) из нашего словаря.
  - Точка `.` в конце — обязательный разделитель троек в RDF.

**Результат CONSTRUCT**:  
Если в `WHERE` найдётся связь между `?ancestor` и `?descendant`, будет создана тройка:  
```rdf
<ancestor-URI> <http://example.org/vad#hasDescendant> <descendant-URI> .
```

---

### 3. WHERE‑блок
```sparql
WHERE {
    ?ancestor vad:hasParentObj+ ?descendant .
}
```
- **Что это**: шаблон, описывающий, **какие данные искать** в RDF‑хранилище.
- **Ключевой элемент**: `vad:hasParentObj+` — **транзитивное замыкание** (обозначается `+`).

#### Разбор шаблона:
- `?ancestor` — переменная для «предка» (будет связана с субъектом тройки).
- `vad:hasParentObj+` — свойство с **оператором `+`** (регулярное выражение для свойств в SPARQL).
  - `+` означает: *«одно или более вхождений свойства `vad:hasParentObj`»* (т. е. цепочка связей).
- `?descendant` — переменная для «потомка» (будет связана с объектом тройки).

#### Как работает транзитивность:
Запрос находит **все пары `(?ancestor, ?descendant)`**, где:
- `?ancestor` связан с `?descendant` через **цепочку из 1+ переходов** по свойству `vad:hasParentObj`.

**Примеры цепочек** (если в данных есть):
1. `A → B` (прямая связь):  
   `A vad:hasParentObj B` → `A vad:hasDescendant B`.
2. `A → B → C` (два перехода):  
   `A vad:hasParentObj B`, `B vad:hasParentObj C` → `A vad:hasDescendant C`.
3. `A → B → C → D` (три перехода):  
   `A vad:hasDescendant D`.

---

### Итоговый смысл запроса

Запрос **автоматически выводит все транзитивные отношения «предок‑потомок»** на основе прямых связей «родитель‑объект» (`vad:hasParentObj`).

**Что он делает**:
1. Находит все цепочки вида:  
   `?ancestor →[vad:hasParentObj]+→ ?descendant`.
2. Для каждой такой цепочки создаёт новую тройку:  
   `?ancestor vad:hasDescendant ?descendant`.

**Пример результата** (если в данных):
- Исходные данные:  
  ```rdf
  :Alice vad:hasParentObj :Bob .
  :Bob vad:hasParentObj :Charlie .
  ```
- Результат `CONSTRUCT`:  
  ```rdf
  :Alice vad:hasDescendant :Bob .      # прямая связь
  :Alice vad:hasDescendant :Charlie . # транзитивная связь (Alice → Bob → Charlie)
  ```

---

### Важные нюансы

1. **Оператор `+`**  
   - В SPARQL 1.1 поддерживается в `WHERE` для свойств (но не все движки его реализуют).
   - Альтернатива: рекурсивные запросы через `UNION` или `PROPERTY PATH`.

2. **Производительность**  
   - Транзитивные запросы могут быть медленными на больших графах.
   - Некоторые системы ограничивают глубину поиска.

3. **Семантика**  
   - `vad:hasDescendant` — новое отношение, созданное запросом. Оно **не существует** в исходных данных до выполнения `CONSTRUCT`.

4. **Область применения**  
   - Полезно для: генеалогий, иерархий (например, оргструктур), классификаций.

---

**Вывод**:  
Запрос решает задачу вывода транзитивных связей, превращая цепочку «родитель‑потомок» в прямое отношение «предок‑потомок».
