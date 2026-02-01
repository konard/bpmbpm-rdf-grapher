// issue #232: Модуль удаления концептов и индивидов - обёртка
// Основная логика реализована в del_concept_individ.js (корневая папка ver9a)
// Данный файл содержит вспомогательные функции для интеграции с модулем 3_sd

/**
 * Вспомогательная функция для инициализации модуля удаления
 * из контекста Smart Design
 */
function initDelConceptFromSD() {
    // Проверяем доступность основного модуля
    if (typeof openDelConceptModal === 'function') {
        console.log('[3_sd_del_concept_individ] Модуль del_concept_individ.js загружен');
    } else {
        console.warn('[3_sd_del_concept_individ] Модуль del_concept_individ.js не найден');
    }
}
