import { useState, useEffect } from 'react';
import { User, Shield, Key, LogOut, Users, Copy, Check, Settings, Blocks, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ConfirmModal from '../components/ConfirmModal';

const Profile = () => {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('info');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Forms
    const [promoCode, setPromoCode] = useState('');
    const [editForm, setEditForm] = useState({ name: '', surname: '', username: '' });
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });

    // Modals
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
            setEditForm({
                name: res.data.name,
                surname: res.data.surname,
                username: res.data.username
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/profile/join-group', { invite_code: promoCode });
            setMessage({ type: 'success', text: t('profile.messages.joinSuccess') });
            fetchProfile();
            setPromoCode('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t('common.error') });
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm(t('profile.group.leaveConfirm'))) return;
        try {
            await api.post('/profile/leave-group');
            setMessage({ type: 'success', text: t('profile.messages.leaveSuccess') });
            fetchProfile();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t('common.error') });
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put('/profile', editForm);
            setMessage({ type: 'success', text: t('profile.messages.updateSuccess') });
            fetchProfile();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t('common.error') });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/profile/change-password', passwordForm);
            setMessage({ type: 'success', text: t('profile.messages.passwordSuccess') });
            setPasswordForm({ old_password: '', new_password: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t('common.error') });
        }
    };

    const handleConnectTelegram = async () => {
        try {
            const res = await api.post('/profile/telegram-link');
            const botUsername = import.meta.env.VITE_BOT_USERNAME || 'polydl_bot';
            window.open(`tg://resolve?domain=${botUsername}&start=auth_${res.data.token}`, '_blank');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t('common.error') });
        }
    };

    const handleUnlinkTelegram = async () => {
        try {
            await api.post('/profile/telegram-unlink');
            setMessage({ type: 'success', text: 'Telegram аккаунт успешно отвязан' });
            fetchProfile();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t('common.error') });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">{t('profile.loading')}</div>;

    return (
        <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
            <header>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{t('profile.title')}</h2>
                <p className="text-gray-500 dark:text-gray-400">{t('profile.subtitle')}</p>
            </header>

            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-jungle-500/10 border-jungle-500/20 text-jungle-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <Card className="lg:col-span-1 p-2 h-fit">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-1">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'info' ? 'bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <User size={18} className="shrink-0" /> <span className="truncate">{t('profile.tabs.info')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'edit' ? 'bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Shield size={18} className="shrink-0" /> <span className="truncate">{t('profile.tabs.edit')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Key size={18} className="shrink-0" /> <span className="truncate">{t('profile.tabs.security')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Settings size={18} className="shrink-0" /> <span className="truncate">{t('profile.tabs.settings')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('integrations')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'integrations' ? 'bg-jungle-500/10 text-jungle-600 dark:text-jungle-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Blocks size={18} className="shrink-0" /> <span className="truncate">Интеграции</span>
                        </button>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
                    <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} className="shrink-0" /> <span className="truncate">{t('common.signOut')}</span>
                    </button>
                </Card>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <Card className="p-6 md:p-8">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 shrink-0 aspect-square rounded-full bg-gradient-to-br from-jungle-500 to-jungle-700 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-jungle-500/20">
                                        {profile.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name} {profile.surname}</h3>
                                        <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
                                        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                            {profile.role}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-800 pt-6">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Users size={20} className="text-jungle-500 dark:text-jungle-400" /> {t('profile.group.title')}
                                    </h4>

                                    {profile.group_id ? (
                                        <div className="bg-jungle-500/10 border border-jungle-500/20 rounded-xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                            <div className="min-w-0">
                                                <p className="text-sm text-jungle-600 dark:text-jungle-300 font-medium mb-1">{t('profile.group.current')}</p>
                                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-all">
                                                    {profile.group_name}
                                                </h3>
                                            </div>
                                            <Button variant="danger" onClick={handleLeaveGroup} className="shrink-0 w-full xl:w-auto h-fit">
                                                {t('profile.group.leave')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('profile.group.noGroup')}</p>
                                            <form onSubmit={handleJoinGroup} className="flex gap-3">
                                                <Input
                                                    placeholder={t('profile.group.joinPlaceholder')}
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value)}
                                                    className="max-w-xs"
                                                    required
                                                />
                                                <Button type="submit">{t('profile.group.join')}</Button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'edit' && (
                        <Card className="p-6 md:p-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('profile.edit.title')}</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label={t('register.name')}
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                    <Input
                                        label={t('register.surname')}
                                        value={editForm.surname}
                                        onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                                    />
                                </div>
                                <Input
                                    label={t('register.username')}
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                />
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit">{t('profile.edit.save')}</Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="p-6 md:p-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('profile.security.title')}</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <Input
                                    label={t('profile.security.current')}
                                    type="password"
                                    value={passwordForm.old_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                                    required
                                />
                                <Input
                                    label={t('profile.security.new')}
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    required
                                />
                                <div className="pt-4">
                                    <Button type="submit" variant="secondary">{t('profile.security.update')}</Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'settings' && (
                        <Card className="p-6 md:p-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('profile.settings.title')}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-jungle-500/10 p-2 rounded-lg text-jungle-600 dark:text-jungle-400">
                                            <span className="text-lg">🌐</span>
                                        </div>
                                        <div>
                                            <h4 className="text-gray-900 dark:text-white font-medium">{t('profile.settings.language')}</h4>
                                        </div>
                                    </div>
                                    <LanguageSwitcher />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                                            <span className="text-lg">🌓</span>
                                        </div>
                                        <div>
                                            <h4 className="text-gray-900 dark:text-white font-medium">{t('profile.settings.theme')}</h4>
                                        </div>
                                    </div>
                                    <ThemeSwitcher />
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'integrations' && (
                        <Card className="p-6 md:p-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Интеграции</h3>
                            <div className="space-y-4">
                                {profile.telegram_linked ? (
                                    <div className="flex items-center justify-between p-4 bg-jungle-500/10 rounded-xl border border-jungle-500/20">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#0088cc]/10 p-2 rounded-lg text-[#0088cc]">
                                                <Send size={20} className="transform -translate-y-0.5 translate-x-0.5" />
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 dark:text-white font-medium">Telegram подключен</h4>
                                                <p className="text-sm text-jungle-600 dark:text-jungle-400">Уведомления активны</p>
                                            </div>
                                        </div>
                                        <Button variant="danger" onClick={() => setIsUnlinkModalOpen(true)}>
                                            Отвязать
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#0088cc]/10 p-2 rounded-lg text-[#0088cc]">
                                                <Send size={20} className="transform -translate-y-0.5 translate-x-0.5" />
                                            </div>
                                            <div>
                                                <h4 className="text-gray-900 dark:text-white font-medium">Telegram</h4>
                                                <p className="text-sm text-gray-500">Подключите бота для уведомлений</p>
                                            </div>
                                        </div>
                                        <Button variant="secondary" onClick={handleConnectTelegram}>
                                            Привязать Telegram
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isUnlinkModalOpen}
                onClose={() => setIsUnlinkModalOpen(false)}
                onConfirm={handleUnlinkTelegram}
                title="Отвязать Telegram?"
                message="Вы уверены, что хотите отвязать Telegram аккаунт? Уведомления больше не будут приходить."
                confirmText="Отвязать"
                cancelText="Отмена"
                isDangerous={true}
            />
        </div>
    );
};

export default Profile;
