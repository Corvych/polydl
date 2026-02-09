import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AuthLayout = () => {
    const { t } = useTranslation();

    return (

        <div className="fixed inset-0 bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-jungle-500/10 dark:bg-jungle-900/20 rounded-full blur-[128px] opacity-40 animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-jungle-500/10 dark:bg-jungle-900/20 rounded-full blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Scrollable Content Container */}
            <div className="absolute inset-0 overflow-y-auto">
                <div className="min-h-full flex flex-col items-center justify-center p-4 py-12">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-10 transition-all duration-500 ease-out transform hover:scale-[1.01]">
                            <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tighter">
                                <span className="bg-gradient-to-r from-jungle-500 to-emerald-500 dark:from-jungle-400 dark:to-emerald-500 bg-clip-text text-transparent">PolyDL</span>
                            </h2>
                            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wide uppercase">
                                {t('auth.subtitle')}
                            </p>
                        </div>

                        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl p-0 overflow-hidden shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-800/50 shadow-gray-300 dark:shadow-black/50 transition-all duration-300">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
