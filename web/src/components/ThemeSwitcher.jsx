import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ThemeSwitcher = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200 group"
            title={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
        >
            {theme === 'dark' ? (
                <Sun size={20} className="group-hover:rotate-45 transition-transform duration-300" />
            ) : (
                <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-300" />
            )}
        </button>
    );
};

export default ThemeSwitcher;
