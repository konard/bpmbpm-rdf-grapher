// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/425
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/427
// vadlib_sparql_v2.js — модуль с функциями, добавляемыми по прямому указанию.
//
// Зависимости:
//   - N3.js (window.N3) для парсинга TriG
//   - Comunica (window.Comunica) для выполнения SPARQL-запросов
//   - funSPARQLvaluesComunica() из vadlib_sparql.js (используется как основной движок)
//
// Экспортируемые функции:
//   - funConceptList_v2(quadstore1, trig1, type1)

// ==============================================================================
// funConceptList_v2 — список доступных концептов в указанном TriG
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/425
// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/427
// ==============================================================================

/**
 * Возвращает список концептов из указанного TriG-графа в заданном quadstore.
 *
 * Функция выполняет SPARQL SELECT-запрос через Comunica и возвращает массив
 * пар {id, label}. Если rdfs:label у концепта отсутствует — label равен пустой строке.
 *
 * @param {Object} quadstore1  — N3.Store (квадстор) с загруженными данными.
 *                               Передаётся явно, чтобы поддерживать несколько квадсторов
 *                               в будущем.
 * @param {string} trig1       — URI TriG-графа в любом формате:
 *                               - Полный URI: 'http://example.org/vad#ptree'
 *                               - Полный URI в угловых скобках: '<http://example.org/vad#ptree>'
 *                               - Короткое curie: 'vad:ptree'
 *                               - Короткое имя (устаревший формат): 'ptree' — будет дополнено vad:
 *                               issue #427: Теперь принимает полные URI для универсальности.
 * @param {string} type1       — URI типа концепта в любом формате:
 *                               - Полный URI: 'http://example.org/vad#TypeProcess'
 *                               - Полный URI в угловых скобках: '<http://example.org/vad#TypeProcess>'
 *                               - Curie: 'vad:TypeProcess'
 *                               Для ptree: 'http://example.org/vad#TypeProcess'
 *                               Для rtree: 'http://example.org/vad#TypeExecutor'
 *
 * @returns {Promise<Array<{id: string, label: string}>>}
 *   Массив объектов {id, label}, где:
 *   - id    — полный URI концепта
 *   - label — значение rdfs:label, или пустая строка если label отсутствует
 *
 * @example
 *   // Получить список концептов процессов из ptree (полный URI — рекомендуемый способ)
 *   var items = await funConceptList_v2(currentStore, 'http://example.org/vad#ptree', 'http://example.org/vad#TypeProcess');
 *   // Результат: [{id: 'http://example.org/vad#p1', label: 'Процесс 1'}, ...]
 *
 * @example
 *   // Получить список концептов исполнителей из rtree (полный URI — рекомендуемый способ)
 *   var items = await funConceptList_v2(currentStore, 'http://example.org/vad#rtree', 'http://example.org/vad#TypeExecutor');
 */
async function funConceptList_v2(quadstore1, trig1, type1) {

    // Список результатов: массив {id, label}
    var results = [];

    // Проверяем, что квадстор передан
    if (!quadstore1) {
        console.log('funConceptList_v2: quadstore1 не задан');
        return results;
    }

    // Проверяем, что TriG задан
    if (!trig1) {
        console.log('funConceptList_v2: trig1 не задан');
        return results;
    }

    // Проверяем, что тип задан
    if (!type1) {
        console.log('funConceptList_v2: type1 не задан');
        return results;
    }

    // Инициализируем Comunica engine
    // Comunica загружается как глобальная переменная из CDN в index.html
    var engine = null;
    if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
        engine = new Comunica.QueryEngine();
    } else {
        console.error('funConceptList_v2: Comunica не загружена');
        return results;
    }

    // issue #427: Нормализуем URI графа для подстановки в SPARQL.
    // Поддерживаются форматы:
    //   - Полный URI без скобок: 'http://example.org/vad#ptree' → '<http://example.org/vad#ptree>'
    //   - Полный URI в угловых скобках: '<http://example.org/vad#ptree>' → оставляем как есть
    //   - Curie: 'vad:ptree' → оставляем как есть (префикс определён в запросе)
    //   - Короткое имя (устаревший формат): 'ptree' → 'vad:ptree' (добавляем префикс vad:)
    var graphUri;
    if (trig1.startsWith('<') && trig1.endsWith('>')) {
        // Уже в угловых скобках
        graphUri = trig1;
    } else if (trig1.startsWith('http://') || trig1.startsWith('https://')) {
        // Полный URI без скобок — оборачиваем
        graphUri = '<' + trig1 + '>';
    } else if (trig1.indexOf(':') !== -1) {
        // Curie вида 'vad:ptree' — оставляем как есть
        graphUri = trig1;
    } else {
        // Короткое имя без двоеточия (устаревший формат 'ptree') — добавляем префикс vad:
        graphUri = 'vad:' + trig1;
    }

    // issue #427: Нормализуем URI типа концепта для подстановки в SPARQL.
    // Поддерживаются форматы:
    //   - Полный URI без скобок: 'http://example.org/vad#TypeProcess' → '<http://example.org/vad#TypeProcess>'
    //   - Полный URI в угловых скобках: '<http://example.org/vad#TypeProcess>' → оставляем как есть
    //   - Curie: 'vad:TypeProcess' → оставляем как есть (префикс определён в запросе)
    var typeUri;
    if (type1.startsWith('<') && type1.endsWith('>')) {
        // Уже в угловых скобках
        typeUri = type1;
    } else if (type1.startsWith('http://') || type1.startsWith('https://')) {
        // Полный URI без скобок — оборачиваем
        typeUri = '<' + type1 + '>';
    } else {
        // Curie вида 'vad:TypeProcess' — оставляем как есть
        typeUri = type1;
    }

    // Формируем SPARQL-запрос.
    // graphUri и typeUri подставляются напрямую в текст запроса.
    // OPTIONAL позволяет вернуть концепт даже если rdfs:label отсутствует.
    var sparqlQuery = 'prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
        'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
        'prefix vad: <http://example.org/vad#>\n' +
        'SELECT ?id_concept ?label_concept WHERE {\n' +
        '    GRAPH ' + graphUri + ' {\n' +
        '        ?id_concept rdf:type ' + typeUri + ' .\n' +
        '        OPTIONAL { ?id_concept rdfs:label ?label_concept . }\n' +
        '    }\n' +
        '}';

    console.log('funConceptList_v2: выполняем запрос для trig1=' + trig1 + ', type1=' + type1);
    console.log('funConceptList_v2: sparqlQuery=\n' + sparqlQuery);

    try {
        // Выполняем SPARQL SELECT через Comunica
        // Источник данных — переданный квадстор (quadstore1)
        var bindingsStream = await engine.queryBindings(sparqlQuery, {
            sources: [quadstore1]
        });

        // Получаем все результаты как массив
        var bindings = await bindingsStream.toArray();

        // Преобразуем каждый binding в объект {id, label}
        var i;
        for (i = 0; i < bindings.length; i++) {
            var binding = bindings[i];

            // Извлекаем URI концепта (?id_concept)
            var idTerm = binding.get('id_concept');
            if (!idTerm) {
                // Пропускаем строки без id
                continue;
            }
            var id = idTerm.value;

            // Извлекаем label (?label_concept), если он есть
            var labelTerm = binding.get('label_concept');
            var label = '';
            if (labelTerm) {
                label = labelTerm.value;
            }

            results.push({ id: id, label: label });
        }

        console.log('funConceptList_v2: найдено ' + results.length + ' концептов');

    } catch (error) {
        console.error('funConceptList_v2: ошибка при выполнении запроса:', error);
    }

    return results;
}
