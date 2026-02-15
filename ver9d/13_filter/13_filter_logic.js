// Ссылка на issue: https://github.com/bpmbpm/rdf-grapher/issues/406
// 13_filter_logic.js - Логика модуля Фильтр диаграммы
// Обработка кнопки "Фильтр" в заголовке диаграммы

        // ==============================================================================
        // issue #406: Глобальная переменная для хранения текущего фильтра
        // ==============================================================================

        /**
         * Текущее состояние фильтра диаграммы
         * Возможные значения:
         * - 'all' - показать все объекты (по умолчанию)
         * - 'hideExecutors' - скрыть исполнителей
         */
        let currentDiagramFilter = 'all';

        // ==============================================================================
        // issue #406: Функции для кнопки Фильтр и выпадающего списка фильтров
        // ==============================================================================

        /**
         * Показывает/скрывает выпадающий список фильтров диаграммы
         * @param {Event} event - Событие клика
         */
        async function toggleDiagramFilterDropdown(event) {
            event.stopPropagation();

            // Закрываем существующий dropdown если есть
            const existingDropdown = document.querySelector('.diagram-filter-dropdown.visible');
            if (existingDropdown) {
                existingDropdown.remove();
                return;
            }

            const button = event.target;
            const buttonRect = button.getBoundingClientRect();

            // Создаём dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'diagram-filter-dropdown visible';
            dropdown.style.position = 'fixed';
            dropdown.style.left = buttonRect.left + 'px';
            dropdown.style.top = (buttonRect.bottom + 2) + 'px';

            // Получаем список фильтров
            const filters = getDiagramFilters();

            filters.forEach(filter => {
                const item = document.createElement('div');
                item.className = 'diagram-filter-dropdown-item';

                // Добавляем класс selected если это текущий фильтр
                if (filter.value === currentDiagramFilter) {
                    item.classList.add('selected');
                }

                item.textContent = filter.label;
                item.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.remove();
                    applyDiagramFilter(filter.value);
                };
                dropdown.appendChild(item);
            });

            document.body.appendChild(dropdown);

            // Закрываем dropdown при клике вне его
            const closeDropdown = (e) => {
                if (!dropdown.contains(e.target) && e.target !== button) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            };
            setTimeout(() => document.addEventListener('click', closeDropdown), 0);
        }

        /**
         * issue #406: Получает список доступных фильтров диаграммы
         * @returns {Array<{label: string, value: string}>}
         */
        function getDiagramFilters() {
            return [
                { label: 'Все объекты', value: 'all' },
                { label: 'Скрыть исполнителей', value: 'hideExecutors' }
            ];
        }

        /**
         * issue #406: Применяет выбранный фильтр к диаграмме
         * @param {string} filterValue - Значение фильтра ('all' или 'hideExecutors')
         */
        async function applyDiagramFilter(filterValue) {
            // Обновляем текущий фильтр
            currentDiagramFilter = filterValue;

            // Перерисовываем диаграмму с учетом фильтра
            await refreshVisualization();
        }

        /**
         * issue #406: Получает текущее состояние фильтра
         * @returns {string} Текущее значение фильтра
         */
        function getCurrentDiagramFilter() {
            return currentDiagramFilter;
        }

        // ==============================================================================
        // ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА
        // ==============================================================================

        // issue #406: Экспортируем функции фильтра в глобальную область видимости
        window.toggleDiagramFilterDropdown = toggleDiagramFilterDropdown;
        window.applyDiagramFilter = applyDiagramFilter;
        window.getCurrentDiagramFilter = getCurrentDiagramFilter;
