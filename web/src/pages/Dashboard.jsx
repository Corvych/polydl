import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, Plus, ExternalLink, Check, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import Button from '../components/Button';
import DeadlineModal from '../components/DeadlineModal';
import DeadlineInfoModal from '../components/DeadlineInfoModal';
import Drawer from '../components/Drawer';
import { useWebSocket } from '../context/WebSocketContext';

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
    const [selectedDeadline, setSelectedDeadline] = useState(null);

    const { lastMessage } = useWebSocket();

    const currentLocale = i18n.language === 'ru' ? ru : enUS;

    // Derived state
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update "now" every 10 seconds to keep expired list fresh
        const interval = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(interval);
    }, []);

    // Responsive check for animation
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const activeDeadlines = deadlines.filter(d => !d.is_completed && new Date(d.ts_due) >= now);
    const expiredDeadlines = deadlines.filter(d => !d.is_completed && new Date(d.ts_due) < now);
    const completedDeadlines = deadlines.filter(d => d.is_completed).sort((a, b) => new Date(b.ts_due) - new Date(a.ts_due)); // Sort completed by date descending

    useEffect(() => {
        fetchDeadlines(); // Initial fetch
    }, []);

    const fetchDeadlines = async () => {
        try {
            const res = await api.get('/deadlines');
            setDeadlines(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch deadlines", err);
            setError(t('dashboard.failedToLoad'));
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'REFRESH_DEADLINES') {
            fetchDeadlines();
        }
    }, [lastMessage]);

    const getStatusColor = (deadline) => {
        const due = new Date(deadline.ts_due);
        const now = new Date();
        const diff = (due - now) / (1000 * 60 * 60 * 24); // Days diff

        if (deadline.is_completed) return {
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-200 dark:border-emerald-500/20",
            glow: "group-hover:shadow-emerald-500/20",
            badge: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
            progressBg: "bg-emerald-500",
            gradientFrom: "from-emerald-500"
        };

        // Expired (Grayed out)
        if (due < now) return {
            bg: "bg-gray-100 dark:bg-gray-800/20",
            text: "text-gray-400 dark:text-gray-500",
            border: "border-gray-200 dark:border-gray-800",
            glow: "group-hover:shadow-gray-500/10",
            badge: "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600",
            progressBg: "bg-gray-400",
            gradientFrom: "from-gray-400",
            isExpired: true
        };

        if (diff < 3) return {
            bg: "bg-amber-50 dark:bg-amber-500/10",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-500/20",
            glow: "group-hover:shadow-amber-500/20",
            badge: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
            progressBg: "bg-amber-500",
            gradientFrom: "from-amber-500",
            pulse: true
        };
        return {
            bg: "bg-white dark:bg-gray-800/40",
            text: "text-gray-600 dark:text-gray-300",
            border: "border-gray-200 dark:border-gray-700/50",
            glow: "group-hover:shadow-jungle-500/20 dark:group-hover:shadow-jungle-500/10",
            badge: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
            progressBg: "bg-jungle-500",
            gradientFrom: "from-jungle-500"
        };
    };

    const handleViewDeadline = (deadline) => {
        setSelectedDeadline(deadline);
        setIsInfoModalOpen(true);
    };

    const handleEditFromInfo = () => {
        setIsInfoModalOpen(false);
        // Small timeout to allow transition if needed, but direct switch is usually fine
        setTimeout(() => setIsDeadlineModalOpen(true), 100);
    };

    const handleCreateDeadline = () => {
        setSelectedDeadline(null);
        setIsDeadlineModalOpen(true);
    };

    const handleComplete = async (e, deadline) => {
        e.stopPropagation();

        // Optimistic update
        const originalDeadlines = [...deadlines];
        const newIsCompleted = !deadline.is_completed;

        setDeadlines(prev => prev.map(d => d.id === deadline.id ? { ...d, is_completed: newIsCompleted } : d));

        try {
            await api.put(`/deadlines/${deadline.id}`, { is_completed: newIsCompleted });
        } catch (err) {
            console.error("Failed to toggle completion", err);
            // Revert on failure
            setDeadlines(originalDeadlines);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jungle-500"></div>
        </div>
    );

    if (error) return (
        <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-center space-x-2">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{t('dashboard.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsRoadmapOpen(true)}
                        variant="ghost"
                        className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white"
                    >
                        <History size={20} />
                        <span className="hidden md:inline">{t('dashboard.roadmap')}</span>
                    </Button>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-500 bg-white dark:bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
                        <span>{format(new Date(), 'EEEE, MMMM do, yyyy', { locale: currentLocale })}</span>
                    </div>
                </div>
            </header>

            {/* Upcoming Deadlines Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-jungle-400 to-jungle-600 bg-clip-text text-transparent inline-block">
                        {t('dashboard.upcoming')}
                    </h3>
                    <Button
                        onClick={() => setIsRoadmapOpen(true)}
                        variant="ghost"
                        className="md:hidden flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -mr-2"
                    >
                        <History size={20} />
                        <span>{t('dashboard.roadmap')}</span>
                    </Button>
                </div>

                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-6 relative"
                >
                    <AnimatePresence>
                        {activeDeadlines.map((dl) => (
                            <motion.div
                                key={dl.id}
                                layout={isDesktop}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={isDesktop
                                    ? { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
                                    : { x: window.innerWidth, opacity: 0, transition: { duration: 0.4 } }
                                }
                                transition={{ duration: 0.3 }}
                            >
                                <DeadlineCard
                                    dl={dl}
                                    onClick={() => handleViewDeadline(dl)}
                                    onComplete={(e) => handleComplete(e, dl)}
                                    styles={getStatusColor(dl)}
                                    currentLocale={currentLocale}
                                    t={t}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                    {activeDeadlines.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="text-center py-20 bg-white dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 backdrop-blur-sm"
                        >
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-600">
                                <Calendar size={32} />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.noDeadlines')}</p>
                            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">{t('dashboard.noDeadlinesSubtitle')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            {/* Expired Deadlines Section */}
            {
                expiredDeadlines.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800/50">
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">
                            {t('dashboard.expired')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75 hover:opacity-100 transition-opacity duration-300">
                            <AnimatePresence mode='popLayout'>
                                {expiredDeadlines.map((dl) => (
                                    <motion.div
                                        key={dl.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={isDesktop
                                            ? { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
                                            : { x: "110%", opacity: 0, transition: { duration: 0.4 } }
                                        }
                                        transition={{ duration: 0.3 }}
                                    >
                                        <DeadlineCard
                                            dl={dl}
                                            onClick={() => handleViewDeadline(dl)}
                                            onComplete={(e) => handleComplete(e, dl)}
                                            styles={getStatusColor(dl)}
                                            currentLocale={currentLocale}
                                            t={t}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )
            }

            <Drawer
                isOpen={isRoadmapOpen}
                onClose={() => setIsRoadmapOpen(false)}
                title={t('dashboard.completedDeadlines')}
            >
                {completedDeadlines.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>{t('dashboard.noCompletedDeadlines')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {completedDeadlines.map((dl) => {
                            // Calculate progress (same logic)
                            const start = new Date(dl.ts_from).getTime();
                            const end = new Date(dl.ts_due).getTime();
                            const now = new Date().getTime();
                            const total = end - start;
                            const elapsed = now - start;
                            const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);

                            // Gray/Slate theme for roadmap
                            const styles = {
                                bg: "bg-slate-800/40",
                                text: "text-slate-400",
                                border: "border-slate-700/50",
                                glow: "group-hover:shadow-slate-700/10",
                                badge: "bg-slate-800 text-slate-400",
                                progressBg: "bg-slate-600",
                                gradientFrom: "from-slate-700"
                            };

                            return (
                                <div
                                    key={dl.id}
                                    className={`
                                        relative overflow-hidden rounded-xl group border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/40
                                        transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/40
                                        hover:shadow-xl ${styles.glow}
                                    `}
                                >
                                    {/* Progress Bar Background */}
                                    <div
                                        className={`absolute inset-0 opacity-10 transition-all duration-500 ${styles.progressBg}`}
                                        style={{ width: `${progress}%` }}
                                    />

                                    {/* Bottom Glow Accent */}
                                    <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t ${styles.gradientFrom} to-transparent opacity-20`} />

                                    <div className="relative p-4 z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                                {dl.subject?.name || t('dashboard.personal')}
                                            </span>
                                            {/* Undone Action */}
                                            <button
                                                onClick={(e) => handleComplete(e, dl)}
                                                className="text-gray-500 hover:text-white transition-colors p-1"
                                                title={t('common.cancel')}
                                            >
                                                <History size={14} />
                                            </button>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-300 mb-2 line-through decoration-gray-400 dark:decoration-gray-600">
                                            {dl.name}
                                        </h3>

                                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                                            {(() => {
                                                const iconName = dl.icon || dl.subject?.icon;
                                                if (iconName && LucideIcons[iconName]) {
                                                    const Icon = LucideIcons[iconName];
                                                    return <Icon size={14} />;
                                                }
                                                return <Calendar size={14} />;
                                            })()}
                                            <span>
                                                {format(new Date(dl.ts_due), 'MMM d, HH:mm', { locale: currentLocale })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Drawer>

            <DeadlineInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                deadline={selectedDeadline}
                onEdit={handleEditFromInfo}
            />

            <DeadlineModal
                isOpen={isDeadlineModalOpen}
                onClose={() => setIsDeadlineModalOpen(false)}
                onSuccess={fetchDeadlines}
                deadline={selectedDeadline}
            />

            {/* Floating Action Button for Add Deadline */}
            <button
                onClick={handleCreateDeadline}
                className="fixed bottom-24 right-5 md:bottom-10 md:right-10 w-[60px] h-[60px] bg-jungle-500 hover:bg-jungle-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-jungle-500/40 transition-all hover:scale-105 active:scale-95 z-40"
            >
                <Plus size={28} />
            </button>
        </div >
    );
};

const DeadlineCard = ({ dl, onClick, onComplete, styles, currentLocale, t }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    // Calculate progress
    const start = new Date(dl.ts_from).getTime();
    const end = new Date(dl.ts_due).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);

    const handleCompleteClick = (e) => {
        e.stopPropagation();
        if (dl.is_completed) {
            // If already completed, just toggle back immediately without fancy animation
            onComplete(e);
            return;
        }
        setIsAnimating(true);
        // Wait for animation
        setTimeout(() => {
            onComplete(e);
            // We don't reset isAnimating because the card will likely disappear/move
        }, 1000);
    };

    // Override styles during animation
    const activeStyles = isAnimating ? {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-500/20",
        glow: "shadow-emerald-500/20",
        progressBg: "bg-emerald-500",
        gradientFrom: "from-emerald-500",
        isExpired: false
    } : styles;

    return (
        <div
            onClick={!isAnimating ? onClick : undefined}
            className={`
                relative overflow-hidden rounded-2xl group cursor-pointer border
                ${activeStyles.bg} ${activeStyles.border}
                ${(activeStyles.isExpired || isAnimating) ? '' : 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'}
                ${activeStyles.glow}
            `}
        >
            {/* Progress Bar Background */}
            <div
                className={`absolute inset-0 transition-all ease-out ${activeStyles.progressBg} opacity-10`}
                style={{
                    width: isAnimating ? '100%' : `${progress}%`,
                    transitionDuration: isAnimating ? '500ms' : '500ms'
                }}
            />

            {/* Bottom Glow Accent */}
            <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t ${activeStyles.gradientFrom} to-transparent opacity-30 ${activeStyles.pulse ? 'animate-soft-pulse' : ''}`} />

            {/* Content Container - Fades out on animation */}
            <div className={`relative p-5 z-10 flex flex-col h-full transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {/* Line 1: Subject / Personal */}
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${activeStyles.isExpired ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}>
                        {dl.subject?.name || t('dashboard.personal')}
                    </span>
                    {dl.is_completed && <Check size={16} className="text-emerald-500" />}
                </div>

                {/* Line 2: Deadline Name */}
                <h3 className={`text-xl font-bold mb-4 leading-tight ${dl.is_completed ? 'line-through text-gray-500' : activeStyles.isExpired ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {dl.name}
                </h3>

                {/* Line 3: Info & Action */}
                <div className="mt-auto flex items-end justify-between">
                    <div className="space-y-1">
                        <div className={`flex items-center gap-2 ${activeStyles.isExpired ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                            {(() => {
                                const iconName = dl.icon || dl.subject?.icon;
                                if (iconName && LucideIcons[iconName]) {
                                    const Icon = LucideIcons[iconName];
                                    return <Icon size={16} className={activeStyles.text} />;
                                }
                                return <Calendar size={16} className={activeStyles.text} />;
                            })()}
                            <span className={`text-sm font-medium ${activeStyles.text}`}>
                                {format(new Date(dl.ts_due), 'MMM d, HH:mm', { locale: currentLocale })}
                            </span>
                        </div>
                    </div>

                    {!activeStyles.isExpired && (
                        <button
                            onClick={handleCompleteClick}
                            disabled={isAnimating}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-bold transition-all
                                flex items-center gap-2
                                ${dl.is_completed
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}
                            `}
                        >
                            <Check size={16} />
                            {dl.is_completed ? t('dashboard.completed') : t('dashboard.done')}
                        </button>
                    )}
                </div>
            </div>

            {/* Success Tick Overlay */}
            {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 100 100" className="drop-shadow-lg shadow-emerald-700/50">
                        <motion.path
                            d="M25 55 L40 70 L75 35"
                            fill="transparent"
                            strokeWidth="8"
                            stroke="rgba(16, 185, 129, 0.5)" // emerald-500
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: "circOut" }}
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
