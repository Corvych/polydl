import { twMerge } from 'tailwind-merge';

const Button = ({ children, className, variant = 'primary', ...props }) => {
    const baseStyles = "font-bold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide";

    const variants = {
        primary: "bg-gradient-to-r from-jungle-500 to-jungle-600 dark:from-jungle-600 dark:to-jungle-500 hover:from-jungle-400 hover:to-jungle-500 dark:hover:from-jungle-500 dark:hover:to-jungle-400 text-white shadow-lg shadow-jungle-500/25 hover:shadow-jungle-500/40 border border-transparent",
        secondary: "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        danger: "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 hover:from-red-400 hover:to-red-500 dark:hover:from-red-500 dark:hover:to-red-600 text-white shadow-lg shadow-red-500/20",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
        outline: "bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], className)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
