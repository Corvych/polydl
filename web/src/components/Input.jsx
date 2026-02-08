import { twMerge } from 'tailwind-merge';

const Input = ({ label, className, error, rightElement, ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={twMerge(
                        "w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3",
                        "focus:outline-none focus:ring-2 focus:ring-jungle-500/50 focus:border-jungle-500/50",
                        "placeholder-gray-500 dark:placeholder-gray-500 transition-all duration-200",
                        "hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-black/70",
                        error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500",
                        rightElement && "pr-10",
                        className
                    )}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-400 font-medium pl-0.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
