import React from 'react';
import { format } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import { Calendar, Clock, ExternalLink, Edit2, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from './Button';
import useAuth from '../hooks/useAuth';

const DeadlineInfoModal = ({ isOpen, onClose, deadline, onEdit }) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    if (!deadline) return null;

    const currentLocale = i18n.language === 'ru' ? ru : enUS;

    // Helper to get status color (duplicated logic from Dashboard, ideally should be a utility)
    const getStatusColor = (dl) => {
        if (!dl) return {};
        const now = new Date();
        const due = new Date(dl.ts_due);
        const diff = (due - now) / (1000 * 60 * 60 * 24);

        if (diff < 0) return { bg: "bg-red-500/10", text: "text-red-500 dark:text-red-400", border: "border-red-500/20", badge: "bg-red-500/20 text-red-600 dark:text-red-300" };
        if (diff < 3) return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300" };
        return { bg: "bg-gray-100 dark:bg-jungle-500/5", text: "text-gray-500 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800", badge: "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300" };
    };

    const styles = getStatusColor(deadline);
    const iconName = deadline.icon || deadline.subject?.icon;
    const Icon = iconName && LucideIcons[iconName] ? LucideIcons[iconName] : Calendar;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('components.deadlineInfoModal.title')}>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${styles.bg} ${styles.text} border ${styles.border}`}>
                        <Icon size={32} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border border-opacity-20 ${styles.badge}`}>
                                {deadline.subject?.name || t('components.deadlineInfoModal.personal')}
                            </span>
                            {/* Status logic can be added here if needed */}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{deadline.name}</h2>
                    </div>
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                            <Calendar size={16} />
                            <span className="text-sm font-semibold">{t('components.deadlineInfoModal.dueDate')}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                            {format(new Date(deadline.ts_due), 'MMM d, yyyy', { locale: currentLocale })}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                            <Clock size={16} />
                            <span className="text-sm font-semibold">{t('components.deadlineInfoModal.dueTime')}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {format(new Date(deadline.ts_due), 'HH:mm')}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                    const start = new Date(deadline.ts_from).getTime();
                    const end = new Date(deadline.ts_due).getTime();
                    const now = new Date().getTime();
                    const total = end - start;
                    const elapsed = now - start;
                    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);

                    return (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                                <span>{t('components.deadlineInfoModal.progress')}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${styles.bg.replace('/5', '')} ${styles.text.replace('text-', 'bg-')}`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })()}

                {/* External Links Section */}
                <div className="flex flex-col gap-2">
                    {/* SDO Link */}
                    {deadline.sdo_link && (
                        <a
                            href={deadline.sdo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl bg-jungle-500/10 border border-jungle-500/20 text-jungle-400 hover:bg-jungle-500/20 transition-all group"
                        >
                            <span className="font-semibold">{t('components.deadlineInfoModal.openInSdo')}</span>
                            <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    )}

                    {/* PolyVSP Link */}
                    {deadline.subject?.pvsp_link && (
                        <a
                            href={deadline.subject.pvsp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all group"
                        >
                            <span className="font-semibold">{t('components.deadlineInfoModal.openInPolyVSP')}</span>
                            <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    )}

                    {/* PPhis Link */}
                    {deadline.subject?.pphis_link && (
                        <a
                            href={deadline.subject.pphis_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all group"
                        >
                            <span className="font-semibold">{t('components.deadlineInfoModal.openInPPhis')}</span>
                            <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/5">
                    {(user?.role !== 'user' || deadline.user_id) && (
                        <Button
                            onClick={onEdit}
                            variant="secondary"
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <Edit2 size={18} />
                            <span>{t('components.deadlineInfoModal.edit')}</span>
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="flex-1"
                    >
                        {t('components.deadlineInfoModal.close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeadlineInfoModal;
