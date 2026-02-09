import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, ArrowRight, Github, AlertCircle, Loader, Mail, Key } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Input from '../components/Input';

const Register = () => {
    const { t } = useTranslation();
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        username: '',
        password: '',
        invite_code: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await register(formData);
            if (result.success) {
                navigate('/login', { state: { message: t('register.successMessage') } });
            } else {
                // Check if the error is a simplified key like "errors.usernameTaken"
                // If not, it might be a raw message, but we prefer keys.
                // Assuming backend now returns keys like "errors.usernameTaken"
                setError(t(result.error) || t('errors.registerFailed'));
            }
        } catch (err) {
            setError(t('errors.registerFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full px-6 py-8">
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-jungle-500 to-emerald-400 mb-4 shadow-lg shadow-jungle-500/30">
                    <User className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('register.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{t('register.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-5">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="text"
                        label={t('register.name')}
                        placeholder={t('register.firstNamePlaceholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        type="text"
                        label={t('register.surname')}
                        placeholder={t('register.lastNamePlaceholder')}
                        value={formData.surname}
                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                        required
                    />
                </div>

                <Input
                    type="text"
                    label={t('register.username')}
                    placeholder={t('register.usernamePlaceholder')}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    rightElement={<User className="w-5 h-5 text-gray-500" />}
                />

                <Input
                    type="password"
                    label={t('register.password')}
                    placeholder={t('register.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    rightElement={<Lock className="w-5 h-5 text-gray-500" />}
                />

                <div className="pt-2 border-t border-white/5">
                    <Input
                        type="text"
                        label={t('register.inviteCode')}
                        placeholder={t('register.inviteCodePlaceholder')}
                        value={formData.invite_code}
                        onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                        rightElement={<Key className="w-5 h-5 text-gray-500" />}
                    />
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                        {t('register.inviteCodeHint')}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-jungle-500 to-emerald-500 hover:from-jungle-400 hover:to-emerald-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-jungle-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {isLoading ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>{t('register.creatingAccount')}</span>
                        </>
                    ) : (
                        <>
                            <span>{t('register.signUp')}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="text-center pt-2">
                    <p className="text-gray-400 text-sm">
                        {t('register.hasAccount')}{' '}
                        <Link to="/login" className="text-jungle-400 hover:text-jungle-300 font-semibold transition-colors hover:underline decoration-2 underline-offset-4">
                            {t('register.signIn')}
                        </Link>
                    </p>
                </div>
            </form>

            <div className="mt-8 flex items-center gap-6 text-gray-400 dark:text-gray-500">
                <LanguageSwitcher />
                <a
                    href="https://github.com/Corvych/polydl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-jungle-500 dark:hover:text-jungle-400 transition-colors"
                >
                    <Github size={20} />
                </a>
            </div>
        </div>
    );
};

export default Register;
