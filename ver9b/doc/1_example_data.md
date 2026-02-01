<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->

# Модуль 1_example_data -- Загрузка примеров RDF данных

## Назначение

Модуль отвечает за загрузку предустановленных примеров RDF данных в приложение. Предоставляет пользователю кнопки для быстрой загрузки демонстрационных данных в формате TriG (VADv5 и VADv6). Реализует механизм fallback: при недоступности файлов (например, CORS-ограничения при локальном запуске) автоматически использует встроенные данные.

## Файлы модуля

| Файл | Назначение |
|---|---|
| `1_example_data_ui.js` | UI функции загрузки примеров: `loadExampleFromFile()`, `loadExampleTrigVADv5()`, `loadExampleTrigVADv6()`, `loadExample()` |
| `1_example_data_logic.js` | Объект `EXAMPLE_DATA` со встроенными RDF данными примеров (fallback при недоступности файлов) |

## Ключевые функции

### loadExampleFromFile(filename, exampleName, inputFormat, visualizationMode, fallbackDataKey)

Универсальная асинхронная функция загрузки примера. Пытается загрузить файл через `fetch()`. При ошибке CORS показывает информационное сообщение и использует встроенные данные из объекта `EXAMPLE_DATA`.

**Параметры:**
- `filename` -- имя файла для загрузки (например, `'Trig_VADv5.ttl'`)
- `exampleName` -- человекочитаемое имя примера
- `inputFormat` -- формат ввода (`'trig'`)
- `visualizationMode` -- режим визуализации (`'vad-trig'`)
- `fallbackDataKey` -- ключ в объекте `EXAMPLE_DATA`

### loadExampleTrigVADv5() / loadExampleTrigVADv6()

Функции-обертки для загрузки конкретных примеров.

### loadExample()

Функция обратной совместимости, вызывает `loadExampleTrigVADv5()`.

## Зависимости от других модулей

- **9_vadlib** -- глобальные переменные и утилиты
- **2_triplestore** -- DOM-элемент `rdf-input` для записи данных
- **Внешние файлы** -- `Trig_VADv5.ttl`, `Trig_VADv6.ttl` (корневая папка ver9b)

## Расширение модуля

Для добавления нового примера:

1. Добавьте файл с данными в корневую папку `ver9b/` (например, `Trig_NewExample.ttl`)
2. Добавьте встроенные данные в `EXAMPLE_DATA` в файле `1_example_data_logic.js`
3. Добавьте функцию-обертку в `1_example_data_ui.js`:
   ```javascript
   function loadExampleNewExample() {
       loadExampleFromFile('Trig_NewExample.ttl', 'NewExample', 'trig', 'vad-trig', 'new-example');
   }
   ```
4. Добавьте кнопку в `index.html`
