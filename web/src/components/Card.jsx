import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={twMerge("bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-md dark:shadow-sm transition-all duration-300", className)}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
