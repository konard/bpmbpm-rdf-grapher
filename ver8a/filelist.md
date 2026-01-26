# Список файлов RDF Grapher ver8a

## Описание
Данный файл содержит список всех файлов, используемых при запуске index.html.

## Основные файлы приложения

| Файл | Тип | Описание |
|------|-----|----------|
| `index.html` | HTML | Главный файл приложения, содержит основной JavaScript код |
| `styles.css` | CSS | Стили для интерфейса приложения |
| `sparql-queries-choice.js` | JavaScript | Коллекция SPARQL запросов для формирования справочников |
| `sparql-queries-code.js` | JavaScript | Коллекция SPARQL запросов, используемых в коде |
| `vad-validation-rules.js` | JavaScript | Правила валидации VAD схемы |

## Файлы онтологии

| Файл | Тип | Описание |
|------|-----|----------|
| `vad-basic-ontology.ttl` | Turtle | Базовая онтология VAD (Value Added Diagram) |
| `vad-basic-ontology_tech_Appendix.ttl` | Turtle | Технологические классы и объекты для Smart Design |

## Внешние библиотеки (подключаются по CDN)

| Библиотека | Версия | URL | Описание |
|------------|--------|-----|----------|
| N3.js | 1.17.2 | https://unpkg.com/n3@1.17.2/browser/n3.min.js | Парсинг RDF данных |
| Viz.js | 3.4.0 | https://unpkg.com/@viz-js/viz@3.4.0/lib/viz-standalone.js | Рендеринг графов (Graphviz) |
| Comunica | v4 | https://rdf.js.org/comunica-browser/versions/v4/engines/query-sparql-rdfjs/comunica-browser.js | SPARQL запросы |

## Примеры данных (встроены в index.html)

| Пример | Описание |
|--------|----------|
| Trig VADv2 | Пример VAD с иерархией TriG графов |
| Trig VADv2tree | Пример VAD с множественной иерархией TriG |

## Внешние примеры (папка ver8/)

| Файл | Описание |
|------|----------|
| `../ver8/Trig_VADv2.ttl` | Внешний пример TriG VADv2 |
| `../ver8/Trig_VADv2tree.ttl` | Внешний пример TriG VADv2tree |

## Структура зависимостей

```
index.html
├── styles.css (стили)
├── sparql-queries-choice.js (SPARQL для справочников)
├── sparql-queries-code.js (SPARQL для логики)
├── vad-validation-rules.js (правила валидации)
├── vad-basic-ontology.ttl (онтология)
├── vad-basic-ontology_tech_Appendix.ttl (технологическое приложение)
└── Внешние CDN библиотеки:
    ├── N3.js (парсинг RDF)
    ├── Viz.js (визуализация)
    └── Comunica (SPARQL)
```

## Генерируемые файлы (runtime)

| Тип | Описание |
|-----|----------|
| virtualRDFdata | Виртуальные RDF данные с вычисляемыми свойствами (хранятся в памяти) |
| DOT код | Генерируемый код Graphviz для визуализации |
| SVG/PNG | Экспортируемые изображения графов |

## Примечания

1. Все необходимые файлы должны размещаться в папке ver8a/
2. Файл vad-basic-ontology_tech_Appendix.ttl загружается при старте для формирования справочников
3. Примеры данных Trig VADv2 и Trig VADv2tree встроены в index.html для автономной работы

---
*Версия: 8a*
*Дата обновления: 2026-01-26*
