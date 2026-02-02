// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/252
// vadlib_sparql.js - SPARQL query engine functions for RDF Grapher

        function funSPARQLvalues(sparqlQuery, variableName = 'value') {
            const results = [];

            // Если нет текущего store, возвращаем пустой массив
            if (!currentStore || currentQuads.length === 0) {
                console.log('funSPARQLvalues: No data in store');
                return results;
            }

            try {
                // Простая реализация через анализ текущих квадов
                // Для сложных SPARQL запросов нужно использовать Comunica
                // Но для базовых SELECT запросов можно обойтись анализом квадов

                // Парсим тип запроса
                const selectMatch = sparqlQuery.match(/SELECT\s+(\?[\w]+(?:\s+\?[\w]+)*)/i);
                if (!selectMatch) {
                    console.log('funSPARQLvalues: Not a SELECT query');
                    return results;
                }

                const variables = selectMatch[1].split(/\s+/).map(v => v.substring(1));

                // Парсим WHERE условие с поддержкой вложенных скобок
                const whereStartIndex = sparqlQuery.search(/WHERE\s*\{/i);
                if (whereStartIndex === -1) {
                    console.log('funSPARQLvalues: No WHERE clause found');
                    return results;
                }

                // Находим открывающую скобку WHERE
                const openBraceIndex = sparqlQuery.indexOf('{', whereStartIndex);
                let braceCount = 1;
                let closeIndex = openBraceIndex + 1;

                // Ищем соответствующую закрывающую скобку с учетом вложенности
                while (braceCount > 0 && closeIndex < sparqlQuery.length) {
                    if (sparqlQuery[closeIndex] === '{') braceCount++;
                    else if (sparqlQuery[closeIndex] === '}') braceCount--;
                    closeIndex++;
                }

                const whereClause = sparqlQuery.substring(openBraceIndex + 1, closeIndex - 1).trim();

                // Парсим triple patterns (упрощенно)
                const triplePatterns = parseTriplePatterns(whereClause);

                // Выполняем запрос через сопоставление паттернов
                const bindings = executeSimpleSelect(triplePatterns, variables);

                // Формируем результаты
                const seen = new Set();
                bindings.forEach(binding => {
                    const valueVar = variableName in binding ? variableName : variables[0];
                    const value = binding[valueVar];
                    if (value && !seen.has(value)) {
                        seen.add(value);
                        const label = binding['label'] || getPrefixedName(value, currentPrefixes);
                        results.push({
                            uri: value,
                            label: label
                        });
                    }
                });

            } catch (error) {
                console.error('funSPARQLvalues error:', error);
            }

            return results;
        }

        /**
         * Разбивает строку SPARQL triple patterns по символу '.' (конец триплета),
         * игнорируя точки внутри URI в угловых скобках (<...>) и строковых литералов ("...").
         * @param {string} content - Строка с triple patterns
         * @returns {Array<string>} - Массив строк-триплетов
         */
        function splitSparqlStatements(content) {
            const statements = [];
            let current = '';
            let inAngleBrackets = 0;
            let inDoubleQuotes = false;
            let inSingleQuotes = false;

            for (let i = 0; i < content.length; i++) {
                const ch = content[i];

                if (ch === '"' && !inSingleQuotes && inAngleBrackets === 0) {
                    inDoubleQuotes = !inDoubleQuotes;
                    current += ch;
                } else if (ch === "'" && !inDoubleQuotes && inAngleBrackets === 0) {
                    inSingleQuotes = !inSingleQuotes;
                    current += ch;
                } else if (ch === '<' && !inDoubleQuotes && !inSingleQuotes) {
                    inAngleBrackets++;
                    current += ch;
                } else if (ch === '>' && !inDoubleQuotes && !inSingleQuotes && inAngleBrackets > 0) {
                    inAngleBrackets--;
                    current += ch;
                } else if (ch === '.' && inAngleBrackets === 0 && !inDoubleQuotes && !inSingleQuotes) {
                    // Это разделитель триплета
                    const trimmed = current.trim();
                    if (trimmed) {
                        statements.push(trimmed);
                    }
                    current = '';
                } else {
                    current += ch;
                }
            }

            // Добавляем последний фрагмент (без завершающей точки)
            const trimmed = current.trim();
            if (trimmed) {
                statements.push(trimmed);
            }

            return statements;
        }

        /**
         * Парсит простые triple patterns из WHERE клаузы
         * @param {string} whereClause - Строка с triple patterns
         * @returns {Array} - Массив паттернов {subject, predicate, object, graph}
         */
        function parseTriplePatterns(whereClause) {
            const patterns = [];

            // Ищем GRAPH блоки с поддержкой вложенных скобок
            const graphRegex = /GRAPH\s+(\S+)\s*\{/gi;
            let graphMatch;
            let processedRanges = [];

            while ((graphMatch = graphRegex.exec(whereClause)) !== null) {
                const graphUri = resolveValue(graphMatch[1]);
                const openBraceIndex = graphMatch.index + graphMatch[0].length - 1;

                // Находим закрывающую скобку с учетом вложенности
                let braceCount = 1;
                let closeIndex = openBraceIndex + 1;
                while (braceCount > 0 && closeIndex < whereClause.length) {
                    if (whereClause[closeIndex] === '{') braceCount++;
                    else if (whereClause[closeIndex] === '}') braceCount--;
                    closeIndex++;
                }

                const graphContent = whereClause.substring(openBraceIndex + 1, closeIndex - 1);
                processedRanges.push({ start: graphMatch.index, end: closeIndex });

                // Удаляем OPTIONAL блоки из содержимого графа (они пока не поддерживаются)
                const cleanedContent = graphContent.replace(/OPTIONAL\s*\{[^}]*\}/gi, '');

                // Парсим триплеты внутри графа (splitSparqlStatements учитывает точки внутри URI)
                const innerStatements = splitSparqlStatements(cleanedContent);
                innerStatements.forEach(inner => {
                    // Пропускаем пустые строки и комментарии
                    const trimmed = inner.trim();
                    if (!trimmed || trimmed.startsWith('#')) return;

                    const parts = trimmed.split(/\s+/);
                    if (parts.length >= 3) {
                        patterns.push({
                            subject: resolveValue(parts[0]),
                            predicate: resolveValue(parts[1]),
                            object: resolveValue(parts.slice(2).join(' ')),
                            graph: graphUri
                        });
                    }
                });
            }

            // Обрабатываем триплеты вне GRAPH блоков
            let remainingClause = whereClause;
            // Удаляем обработанные GRAPH блоки (в обратном порядке чтобы индексы не сбились)
            processedRanges.sort((a, b) => b.start - a.start).forEach(range => {
                remainingClause = remainingClause.substring(0, range.start) + remainingClause.substring(range.end);
            });

            // Удаляем OPTIONAL блоки
            remainingClause = remainingClause.replace(/OPTIONAL\s*\{[^}]*\}/gi, '');

            const statements = splitSparqlStatements(remainingClause);
            statements.forEach(statement => {
                const trimmed = statement.trim();
                if (!trimmed || trimmed.startsWith('#')) return;

                const parts = trimmed.split(/\s+/);
                if (parts.length >= 3) {
                    patterns.push({
                        subject: resolveValue(parts[0]),
                        predicate: resolveValue(parts[1]),
                        object: resolveValue(parts.slice(2).join(' ')),
                        graph: null
                    });
                }
            });

            return patterns;
        }

        /**
         * Разрешает значение (prefix:local -> полный URI, или оставляет переменную)
         */
        function resolveValue(value) {
            if (!value) return null;
            value = value.trim();

            // Если переменная
            if (value.startsWith('?')) {
                return { type: 'variable', name: value.substring(1) };
            }

            // Если полный URI в угловых скобках
            if (value.startsWith('<') && value.endsWith('>')) {
                return { type: 'uri', value: value.slice(1, -1) };
            }

            // Если prefixed name
            const colonIndex = value.indexOf(':');
            if (colonIndex > 0) {
                const prefix = value.substring(0, colonIndex);
                const local = value.substring(colonIndex + 1);
                const namespace = currentPrefixes[prefix];
                if (namespace) {
                    return { type: 'uri', value: namespace + local };
                }
            }

            // Если литерал в кавычках
            if (value.startsWith('"') || value.startsWith("'")) {
                return { type: 'literal', value: value.replace(/^["']|["']$/g, '') };
            }

            // Иначе считаем что это prefixed name без разрешения
            return { type: 'uri', value: value };
        }

        /**
         * Выполняет простой SELECT запрос через сопоставление паттернов с квадами
         */
        function executeSimpleSelect(patterns, variables) {
            const bindings = [{}];

            patterns.forEach(pattern => {
                const newBindings = [];

                bindings.forEach(binding => {
                    // Фильтруем квады по паттерну
                    currentQuads.forEach(quad => {
                        const match = matchQuadToPattern(quad, pattern, binding);
                        if (match) {
                            newBindings.push({...binding, ...match});
                        }
                    });
                });

                // Заменяем bindings новыми
                bindings.length = 0;
                bindings.push(...newBindings);
            });

            return bindings;
        }

        /**
         * Сопоставляет квад с паттерном
         */
        // ==============================================================================
        // funSPARQLvaluesComunica — полная поддержка SPARQL через Comunica
        // Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/250
        // ==============================================================================

        /**
         * Выполняет SPARQL SELECT запрос с полной поддержкой SPARQL через Comunica.
         * Поддерживает UNION, OPTIONAL, FILTER, BIND и другие конструкции SPARQL,
         * которые не поддерживаются в funSPARQLvalues.
         *
         * @param {string} sparqlQuery - SPARQL SELECT запрос
         * @param {string} variableName - Имя переменной для извлечения (без '?')
         * @returns {Promise<Array<{uri: string, label: string}>>} Массив результатов
         */
        async function funSPARQLvaluesComunica(sparqlQuery, variableName = 'value') {
            const results = [];

            // Если нет текущего store, возвращаем пустой массив
            if (!currentStore || currentQuads.length === 0) {
                console.log('funSPARQLvaluesComunica: No data in store');
                return results;
            }

            try {
                // Инициализируем Comunica engine если нужно
                if (!comunicaEngine) {
                    if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                        comunicaEngine = new Comunica.QueryEngine();
                    } else {
                        console.error('funSPARQLvaluesComunica: Comunica не загружена, fallback на funSPARQLvalues');
                        return funSPARQLvalues(sparqlQuery, variableName);
                    }
                }

                // Инициализируем store если нужно
                if (!currentStore) {
                    currentStore = new N3.Store();
                    currentQuads.forEach(quad => currentStore.addQuad(quad));
                }

                // Выполняем запрос через Comunica
                const bindingsStream = await comunicaEngine.queryBindings(sparqlQuery, {
                    sources: [currentStore]
                });

                const bindings = await bindingsStream.toArray();

                const seen = new Set();
                bindings.forEach(binding => {
                    // Получаем значение основной переменной
                    const mainTerm = binding.get(variableName);
                    if (!mainTerm) return;

                    const value = mainTerm.value;
                    if (seen.has(value)) return;
                    seen.add(value);

                    // Получаем label если есть
                    const labelTerm = binding.get('label');
                    const label = labelTerm
                        ? labelTerm.value
                        : getPrefixedName(value, currentPrefixes);

                    results.push({ uri: value, label: label });
                });

            } catch (error) {
                console.error('funSPARQLvaluesComunica error:', error);
                // Fallback на простую реализацию при ошибке Comunica
                console.log('funSPARQLvaluesComunica: Fallback на funSPARQLvalues');
                return funSPARQLvalues(sparqlQuery, variableName);
            }

            return results;
        }

        /**
         * Выполняет SPARQL UPDATE запрос (INSERT/DELETE) через Comunica.
         * Предназначена для будущего использования при автоматическом выполнении
         * UPDATE-запросов (в текущей архитектуре запросы генерируются, но не выполняются).
         *
         * @param {string} sparqlUpdateQuery - SPARQL UPDATE запрос (INSERT DATA / DELETE WHERE и т.д.)
         * @returns {Promise<boolean>} true если запрос выполнен успешно
         */
        async function funSPARQLvaluesComunicaUpdate(sparqlUpdateQuery) {
            if (!currentStore || currentQuads.length === 0) {
                console.log('funSPARQLvaluesComunicaUpdate: No data in store');
                return false;
            }

            try {
                // Инициализируем Comunica engine если нужно
                if (!comunicaEngine) {
                    if (typeof Comunica !== 'undefined' && Comunica.QueryEngine) {
                        comunicaEngine = new Comunica.QueryEngine();
                    } else {
                        console.error('funSPARQLvaluesComunicaUpdate: Comunica не загружена');
                        return false;
                    }
                }

                // Инициализируем store если нужно
                if (!currentStore) {
                    currentStore = new N3.Store();
                    currentQuads.forEach(quad => currentStore.addQuad(quad));
                }

                // Выполняем UPDATE запрос через Comunica
                await comunicaEngine.queryVoid(sparqlUpdateQuery, {
                    sources: [currentStore]
                });

                // Обновляем currentQuads после изменения store
                currentQuads = currentStore.getQuads(null, null, null, null);

                return true;
            } catch (error) {
                console.error('funSPARQLvaluesComunicaUpdate error:', error);
                return false;
            }
        }

        function matchQuadToPattern(quad, pattern, currentBinding) {
            const newBinding = {};

            // Проверяем граф
            if (pattern.graph) {
                if (pattern.graph.type === 'variable') {
                    const boundValue = currentBinding[pattern.graph.name];
                    if (boundValue && boundValue !== quad.graph.value) return null;
                    newBinding[pattern.graph.name] = quad.graph.value;
                } else if (pattern.graph.type === 'uri') {
                    if (quad.graph.value !== pattern.graph.value) return null;
                }
            }

            // Проверяем субъект
            if (pattern.subject) {
                if (pattern.subject.type === 'variable') {
                    const boundValue = currentBinding[pattern.subject.name];
                    if (boundValue && boundValue !== quad.subject.value) return null;
                    newBinding[pattern.subject.name] = quad.subject.value;
                } else if (pattern.subject.type === 'uri') {
                    if (quad.subject.value !== pattern.subject.value) return null;
                }
            }

            // Проверяем предикат
            if (pattern.predicate) {
                if (pattern.predicate.type === 'variable') {
                    const boundValue = currentBinding[pattern.predicate.name];
                    if (boundValue && boundValue !== quad.predicate.value) return null;
                    newBinding[pattern.predicate.name] = quad.predicate.value;
                } else if (pattern.predicate.type === 'uri') {
                    if (quad.predicate.value !== pattern.predicate.value) return null;
                }
            }

            // Проверяем объект
            if (pattern.object) {
                if (pattern.object.type === 'variable') {
                    const boundValue = currentBinding[pattern.object.name];
                    const quadObjectValue = quad.object.value;
                    if (boundValue && boundValue !== quadObjectValue) return null;
                    newBinding[pattern.object.name] = quadObjectValue;
                } else if (pattern.object.type === 'uri') {
                    if (quad.object.value !== pattern.object.value) return null;
                } else if (pattern.object.type === 'literal') {
                    if (quad.object.value !== pattern.object.value) return null;
                }
            }

            return newBinding;
        }
