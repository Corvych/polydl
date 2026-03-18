import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { Users, AlertCircle, ArrowRight, Check } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import * as LucideIcons from 'lucide-react';

const JoinGroup = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Status states: 'checking', 'prompt', 'joining', 'success', 'error'
    const [status, setStatus] = useState(code ? 'checking' : 'error');
    const [message, setMessage] = useState(code ? '' : t('joinGroup.invalidLink'));
    const [groupInfo, setGroupInfo] = useState(null);
    const hasAttemptedJoin = useRef(false);

    // Fetch group info immediately
    useEffect(() => {
        if (!code) {
            return;
        }

        const fetchGroupInfo = async () => {
            try {
                const response = await api.get(`/groups/invite/${code}`);
                setGroupInfo(response.data);

                // If user is already loaded and logged in, we can proceed to logic
                // But we wait for 'loading' to be false in the other effect
            } catch (err) {
                console.error("Failed to fetch group info", err);
                // If we can't fetch info, code is likely invalid
                setStatus('error');
                setMessage(t('joinGroup.invalidLink'));
            }
        };

        fetchGroupInfo();
    }, [code, t]);

    // Handle Join Logic
    useEffect(() => {
        if (loading || !groupInfo || status === 'error' || status === 'success' || status === 'joining') return;

        if (hasAttemptedJoin.current) return;

        if (user) {
            // User is logged in, show join confirmation or auto-join?
            // Let's show a "Join [Group]" button for explicit action, it's better UX
            setStatus('confirm_join');
        } else {
            // User not logged in
            setStatus('prompt');
        }
    }, [user, loading, groupInfo, status]);

    const handleJoin = async () => {
        if (hasAttemptedJoin.current) return;
        hasAttemptedJoin.current = true;
        setStatus('joining');

        try {
            await api.post('/profile/join-group', { invite_code: code });
            setStatus('success');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            hasAttemptedJoin.current = false;
            setStatus('error');
            setMessage(err.response?.data?.error || t('joinGroup.failedToJoin'));
        }
    };

    const handleLogin = () => {
        navigate(`/login?code=${code}`);
    };

    const handleRegister = () => {
        navigate(`/register?code=${code}`);
    };

    if (!code) return <Navigate to="/" />;

    return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-white transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-jungle-400/20 dark:bg-jungle-900/20 rounded-full blur-[128px] opacity-40 animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-jungle-400/20 dark:bg-jungle-900/20 rounded-full blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Scrollable Content Container */}
            <div className="absolute inset-0 overflow-y-auto">
                <div className="min-h-full flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8 transition-all duration-500 ease-out transform hover:scale-[1.01]">
                            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                <span className="bg-gradient-to-r from-jungle-500 to-jungle-600 dark:from-jungle-400 dark:to-jungle-500 bg-clip-text text-transparent">PolyDL</span>
                            </h2>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                                {t('auth.subtitle')}
                            </p>
                        </div>

                        <Card className="shadow-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-0 overflow-hidden">

                            {/* Header / Group Info */}
                            <div className="p-8 text-center border-b border-gray-200 dark:border-gray-800/50 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/20 dark:to-transparent">
                                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-jungle-400 to-jungle-600 rounded-2xl flex items-center justify-center shadow-lg shadow-jungle-500/20 mb-6 transform transition-transform hover:scale-105">
                                    {(() => {
                                        if (groupInfo && groupInfo.icon && LucideIcons[groupInfo.icon]) {
                                            const Icon = LucideIcons[groupInfo.icon];
                                            return <Icon size={40} className="text-white" />;
                                        }
                                        return <Users size={40} className="text-white" />;
                                    })()}
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {groupInfo ? groupInfo.name : t('joinGroup.loading')}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('joinGroup.invitedToJoin')}</p>
                            </div>

                            <div className="p-8">
                                {status === 'checking' && (
                                    <div className="flex flex-col items-center py-4">
                                        <div className="w-8 h-8 border-2 border-jungle-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-gray-500 text-sm animate-pulse">{t('joinGroup.verifying')}</p>
                                    </div>
                                )}

                                {status === 'confirm_join' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-jungle-500/10 border border-jungle-500/20 rounded-xl p-4 text-center">
                                            <p className="text-jungle-700 dark:text-jungle-200 text-sm">
                                                {t('joinGroup.loggedInAs')} <span className="font-bold text-gray-900 dark:text-white">{user?.username}</span>
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleJoin}
                                            className="w-full py-4 text-lg font-bold shadow-lg shadow-jungle-500/20 hover:shadow-jungle-500/40 transition-all hover:-translate-y-0.5"
                                        >
                                            {t('joinGroup.continueAs', { name: user?.name })}
                                        </Button>
                                        <button
                                            onClick={() => navigate('/')}
                                            className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                )}

                                {status === 'joining' && (
                                    <div className="flex flex-col items-center py-8">
                                        <div className="w-10 h-10 border-3 border-jungle-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-gray-900 dark:text-white font-medium">{t('joinGroup.joining')}</p>
                                    </div>
                                )}

                                {status === 'success' && (
                                    <div className="text-center animate-in zoom-in duration-300">
                                        <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                                            <Check size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('joinGroup.success')}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('joinGroup.successMessage')}</p>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="text-center animate-in shake duration-300">
                                        <div className="mx-auto w-12 h-12 bg-red-500/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('joinGroup.oops')}</h3>
                                        <p className="text-red-500 dark:text-red-300 text-sm mb-6">{message}</p>
                                        <Button onClick={() => navigate('/')} variant="secondary" className="w-full">{t('joinGroup.goHome')}</Button>
                                    </div>
                                )}

                                {status === 'prompt' && (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                                            {t('joinGroup.loginToJoin')}
                                        </p>
                                        <Button onClick={handleRegister} className="w-full py-3 flex items-center justify-center gap-2 group">
                                            {t('joinGroup.createAccount')}
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                        <Button onClick={handleLogin} variant="secondary" className="w-full py-3">
                                            {t('joinGroup.login')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Footer branding or helpful links could go here */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-600 text-xs">Polydl &copy; {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinGroup;
