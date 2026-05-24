import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle, Clock, ShieldAlert, PartyPopper } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import DeadlineModal from '../components/DeadlineModal';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const MiniApp = () => {
    const { t } = useTranslation();
    const { token, fetchUserProfile } = useContext(AuthContext);
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tgToken, setTgToken] = useState(null);
    
    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDeadline, setSelectedDeadline] = useState(null);

    useEffect(() => {
        // Initialize Telegram Web App
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand(); // Expand to full height
            tg.setHeaderColor('bg_color'); // Make header match background
            
            // Set up MainButton
            tg.MainButton.text = "Создать дедлайн";
            tg.MainButton.color = tg.themeParams.button_color || '#0088cc';
            tg.MainButton.textColor = tg.themeParams.button_text_color || '#ffffff';
            tg.MainButton.show();
            
            tg.onEvent('mainButtonClicked', () => {
                setSelectedDeadline(null);
                setIsCreateModalOpen(true);
            });

            // Authenticate with backend
            authenticate(tg.initData);
            
            return () => {
                tg.offEvent('mainButtonClicked', () => {});
                tg.MainButton.hide();
            };
        } else {
            setError("Пожалуйста, откройте это приложение внутри Telegram.");
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const authenticate = async (initData) => {
        try {
            const res = await api.post('/bot/webapp-auth', { initData });
            const newToken = res.data.token;
            setTgToken(newToken);
            localStorage.setItem('token', newToken);
            await fetchUserProfile(); // Update context
            fetchDeadlines(newToken);
        } catch (err) {
            console.error("Auth error:", err);
            setError("Ошибка авторизации. Попробуйте еще раз.");
            setLoading(false);
        }
    };

    const fetchDeadlines = async (authToken) => {
        try {
            // Override authorization header for this request
            const res = await api.get('/deadlines', {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            // Make sure res.data is an array
            if (Array.isArray(res.data)) {
                setDeadlines(res.data);
            } else {
                setDeadlines([]);
            }
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить дедлайны.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeadline = async () => {
        try {
            // Send payload formatted exactly like DeadlineModal expects
            // DeadlineModal already handles api.post internally
            // Oh wait! DeadlineModal does the submission inside it!
            // I should NOT manually call api.post here. I just need to refresh deadlines!
            setIsCreateModalOpen(false);
            setSelectedDeadline(null);
            fetchDeadlines(tgToken || token); // Refresh
            window.Telegram?.WebApp?.showAlert("Дедлайн успешно сохранен!");
        } catch (error) {
            window.Telegram?.WebApp?.showAlert(error.response?.data?.error || t('common.error'));
        }
    };

    const handleComplete = async (e, deadline) => {
        e.stopPropagation();
        
        // Optimistic update
        const originalDeadlines = [...deadlines];
        const newIsCompleted = !deadline.is_completed;

        setDeadlines(prev => prev.map(d => d.id === deadline.id ? { ...d, is_completed: newIsCompleted } : d));

        try {
            await api.put(`/deadlines/${deadline.id}`, { is_completed: newIsCompleted }, {
                headers: { Authorization: `Bearer ${tgToken || token}` }
            });
        } catch (err) {
            console.error("Failed to toggle completion", err);
            setDeadlines(originalDeadlines);
            window.Telegram?.WebApp?.showAlert("Не удалось обновить статус дедлайна.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-[var(--tg-theme-text-color)] bg-[var(--tg-theme-bg-color)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tg-theme-button-color)]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--tg-theme-bg-color,#0f172a)] text-[var(--tg-theme-text-color,#f8fafc)]">
                <div className="flex flex-col items-center justify-center p-8 w-full max-w-sm rounded-3xl bg-[var(--tg-theme-secondary-bg-color,#1e293b)] shadow-2xl border border-[var(--tg-theme-hint-color,#334155)] backdrop-blur-md transition-all duration-300">
                    <div className="bg-red-500/10 p-4 rounded-full mb-6">
                        <ShieldAlert size={48} className="text-red-500 drop-shadow-md" />
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-3">Ошибка доступа</h2>
                    <p className="text-center text-[var(--tg-theme-hint-color,#94a3b8)] leading-relaxed text-sm">
                        {error}
                    </p>
                    <button 
                        onClick={() => window.Telegram?.WebApp?.close()}
                        className="mt-8 w-full py-3 px-6 rounded-xl font-semibold bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        );
    }

    const now = new Date();
    
    // Filter deadlines
    const upcoming = [];
    const missed = [];

    deadlines.forEach(item => {
        if (item.is_completed) return; // Ignore completed
        
        const due = new Date(item.ts_due);
        if (due < now) {
            missed.push(item);
        } else {
            upcoming.push(item);
        }
    });

    const renderCard = (d) => {
        const due = new Date(d.ts_due);
        const isMissed = due < now;

        const start = new Date(d.ts_from).getTime();
        const end = due.getTime();
        const current = now.getTime();
        const total = end - start;
        const elapsed = current - start;
        const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);

        return (
            <div key={d.id} 
                className="relative overflow-hidden p-4 mb-3 rounded-xl shadow-sm border active:scale-[0.98] transition-transform cursor-pointer" 
                onClick={() => { setSelectedDeadline(d); setIsCreateModalOpen(true); }}
                style={{ 
                    backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)',
                    borderColor: 'var(--tg-theme-hint-color, #e5e7eb)',
                    color: 'var(--tg-theme-text-color, #000000)'
                }}>
                
                {/* Progress Bar Background */}
                <div
                    className="absolute inset-0 opacity-[0.08] transition-all"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: isMissed ? '#ef4444' : 'var(--tg-theme-button-color, #3b82f6)'
                    }}
                />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{d.name}</h3>
                        <span className="text-[var(--tg-theme-button-color,#3b82f6)]">
                            {(() => {
                                const iconName = d.icon || d.subject?.icon;
                                if (iconName && LucideIcons[iconName]) {
                                    const Icon = LucideIcons[iconName];
                                    return <Icon size={24} />;
                                }
                                return <Calendar size={24} />;
                            })()}
                        </span>
                    </div>
                    
                    {d.subject && (
                        <div className="text-sm opacity-80 mb-2 font-medium">
                            {d.subject.name}
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-sm" style={{ color: isMissed ? '#ef4444' : 'var(--tg-theme-hint-color, #6b7280)' }}>
                            <Clock size={14} />
                            <span>{due.toLocaleString('ru-RU', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                            })}</span>
                        </div>
                        
                        <button 
                            onClick={(e) => handleComplete(e, d)}
                            className="flex items-center justify-center p-2 rounded-lg transition-colors"
                            style={{ 
                                backgroundColor: 'var(--tg-theme-bg-color, #f3f4f6)',
                                color: 'var(--tg-theme-button-color, #3b82f6)'
                            }}
                        >
                            <CheckCircle size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: 'var(--tg-theme-bg-color, #f3f4f6)', color: 'var(--tg-theme-text-color, #000)' }}>
            
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" />
                    Предстоящие ({upcoming.length})
                </h2>
                {upcoming.length > 0 ? (
                    <div>{upcoming.map(renderCard)}</div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                        <PartyPopper size={32} className="mb-3 text-[var(--tg-theme-hint-color,#9ca3af)]" />
                        <span>Нет предстоящих дедлайнов</span>
                    </div>
                )}
            </div>

            {missed.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
                        <CheckCircle size={20} />
                        Пропущенные ({missed.length})
                    </h2>
                    <div>{missed.map(renderCard)}</div>
                </div>
            )}

            {/* Custom Modal for TG environment */}
            <DeadlineModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setSelectedDeadline(null); }}
                onSuccess={handleCreateDeadline}
                deadline={selectedDeadline}
            />


        </div>
    );
};

export default MiniApp;
