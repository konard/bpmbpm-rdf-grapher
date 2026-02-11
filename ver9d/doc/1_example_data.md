<!-- Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/232 -->
<!-- Обновлено: PR #273 по issue #272, дата 2026-02-04 -->

# Модуль 1_example_data -- Загрузка примеров RDF данных

## Назначение

Модуль отвечает за загрузку предустановленных примеров RDF данных в приложение. Предоставляет пользователю кнопки для быстрой загрузки демонстрационных данных в формате TriG (VADv5 и VADv6). При ошибке загрузки файла (например, CORS-ограничения при локальном запуске) показывает диалог с предложением выбрать файл вручную (issue #260).

## Файлы модуля

| Файл | Назначение |
|---|---|
| `1_example_data_ui.js` | UI функции загрузки примеров: `loadExampleFromFile()`, `loadExampleTrigVADv5()`, `loadExampleTrigVADv6()`, `loadExample()` |
| `1_example_data_logic.js` | Объект `EXAMPLE_DATA` со встроенными RDF данными примеров (историческое наследие, fallback-данные не используются с issue #260) |

## Расположение файлов примеров

**issue #272:** Файлы примеров перемещены в подпапку `dia/`:

```
ver9d/
├── dia/
│   ├── Trig_VADv5.ttl    - Пример данных VAD v5
│   └── Trig_VADv6.ttl    - Пример данных VAD v6
```

Загрузка выполняется по относительному пути: `dia/Trig_VADv5.ttl`

## Ключевые функции

### loadExampleFromFile(filename, exampleName, inputFormat, visualizationMode)

Универсальная асинхронная функция загрузки примера. Пытается загрузить файл через `fetch()`. При ошибке показывает диалог с предложением выбрать файл вручную.

**Параметры:**
- `filename` -- относительный путь к файлу (например, `'dia/Trig_VADv5.ttl'`)
- `exampleName` -- человекочитаемое имя примера
- `inputFormat` -- формат ввода (`'trig'`)
- `visualizationMode` -- режим визуализации (`'vad-trig'`)

### loadExampleTrigVADv5() / loadExampleTrigVADv6()

Функции-обертки для загрузки конкретных примеров:

```javascript
function loadExampleTrigVADv5() {
    // issue #272: Файлы примеров перемещены в подпапку dia/
    loadExampleFromFile('dia/Trig_VADv5.ttl', 'Trig_VADv5', 'trig', 'vad-trig');
}

function loadExampleTrigVADv6() {
    // issue #272: Файлы примеров перемещены в подпапку dia/
    loadExampleFromFile('dia/Trig_VADv6.ttl', 'Trig_VADv6', 'trig', 'vad-trig');
}
```

### loadExample()

Функция обратной совместимости, вызывает `loadExampleTrigVADv5()`.

## Зависимости от других модулей

- **9_vadlib** -- глобальные переменные и утилиты, функции `showFileNotFoundDialog()`, `showSuccessNotification()`, `showErrorNotification()`
- **2_triplestore** -- DOM-элемент `rdf-input` для записи данных
- **Внешние файлы** -- `dia/Trig_VADv5.ttl`, `dia/Trig_VADv6.ttl` (подпапка `dia/` в `ver9d/`)

## Расширение модуля

Для добавления нового примера:

1. Добавьте файл с данными в папку `ver9d/dia/` (например, `Trig_NewExample.ttl`)
2. Добавьте функцию-обертку в `1_example_data_ui.js`:
   ```javascript
   function loadExampleNewExample() {
       loadExampleFromFile('dia/Trig_NewExample.ttl', 'NewExample', 'trig', 'vad-trig');
   }
   ```
3. Добавьте кнопку в `index.html`:
   ```html
   <span class="example-link" onclick="loadExampleNewExample()">NewExample</span>
   ```

## Связанные документы

- [quadstore_io.md](quadstore_io.md) -- взаимодействие с quadstore
- [Folder_Structure.md](Folder_Structure.md) -- структура папок проекта
