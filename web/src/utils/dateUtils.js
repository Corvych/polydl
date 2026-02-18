import { enUS, ru } from 'date-fns/locale';

/**
 * Returns the correct date-fns locale object based on i18next language code.
 * @param {string} language - The current language code (e.g. 'en', 'ru', 'ru-RU')
 * @returns {object} date-fns locale object
 */
export const getDateLocale = (language) => {
    if (!language) return enUS;
    if (language.startsWith('ru')) return ru;
    return enUS;
};
