import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const nextLng = i18n.language === 'en' ? 'ru' : 'en';
        i18n.changeLanguage(nextLng);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 group"
            title={i18n.language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
        >
            <Globe size={18} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-sm font-medium">{i18n.language === 'en' ? '🇬🇧' : '🇷🇺'}</span>
        </button>
    );
};

export default LanguageSwitcher;
