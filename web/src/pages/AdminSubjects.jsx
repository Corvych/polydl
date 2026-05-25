import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import IconPicker from '../components/IconPicker';
import * as LucideIcons from 'lucide-react';
import { Plus, Edit2, Trash2, ExternalLink, Book } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const AdminSubjects = () => {
    const { t } = useTranslation();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        shortname: '',
        icon: 'Book',
        pvsp_link: '',
        pphis_link: ''
    });

    // Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    // Notification State
    const [notification, setNotification] = useState({ type: '', message: '' });

    const fetchSubjects = useCallback(async () => {
        try {
            const response = await api.get('/subjects');
            setSubjects(response.data);
        } catch (err) {
            console.error("Failed to fetch subjects", err);
            setError(t('adminSubjects.failedToLoad'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 3000);
    };

    const handleOpenModal = (subject = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                shortname: subject.shortname,
                icon: subject.icon || 'Book',
                pvsp_link: subject.pvsp_link || '',
                pphis_link: subject.pphis_link || ''
            });
        } else {
            setEditingSubject(null);
            setFormData({
                name: '',
                shortname: '',
                icon: 'Book',
                pvsp_link: '',
                pphis_link: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                await api.put(`/subjects/${editingSubject.id}`, formData);
                setSubjects(subjects.map(s => s.id === editingSubject.id ? { ...s, ...formData } : s));
                showNotification('success', t('adminSubjects.updateSuccess'));
            } else {
                const response = await api.post('/subjects', formData);
                setSubjects([...subjects, { ...formData, id: response.data.id }]);
                showNotification('success', t('adminSubjects.createSuccess'));
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save subject", err);
            showNotification('error', t('adminSubjects.saveError'));
        }
    };

    const confirmDelete = async () => {
        if (!subjectToDelete) return;
        try {
            await api.delete(`/subjects/${subjectToDelete.id}`);
            setSubjects(subjects.filter(s => s.id !== subjectToDelete.id));
            showNotification('success', t('adminSubjects.deleteSuccess'));
            setIsDeleteModalOpen(false);
        } catch (err) {
            console.error("Failed to delete subject", err);
            showNotification('error', t('adminSubjects.deleteError'));
        }
    };

    const handleDeleteClick = (subject) => {
        setSubjectToDelete(subject);
        setIsDeleteModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-400">{t('adminSubjects.loading')}</div>;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{t('adminSubjects.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('adminSubjects.subtitle')}</p>
                </div>
            </header>

            {/* Notifications */}
            {notification.message && (
                <div className={`p-4 rounded-xl border ${notification.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-jungle-500/10 border-jungle-500/20 text-jungle-400'
                    }`}>
                    {notification.message}
                </div>
            )}

            {/* Blocking Error (for load failures) */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {subjects.map((s) => (
                    <Card
                        key={s.id}
                        onClick={() => handleOpenModal(s)}
                        className="group relative hover:shadow-lg hover:shadow-jungle-500/10 cursor-pointer transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-jungle-600 dark:text-jungle-400">
                                {(() => {
                                    const IconComponent = LucideIcons[s.icon] || Book;
                                    return <IconComponent size={20} />;
                                })()}
                            </div>

                            {/* Desktop Hover Actions */}
                            <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => handleOpenModal(s)}
                                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                                >
                                    <Edit2 size={16} />
                                </button>

                                <button
                                    onClick={() => handleDeleteClick(s)}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Mobile Options Menu */}
                            <div className="md:hidden relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg z-10 relative"
                                >
                                    <LucideIcons.MoreVertical size={20} />
                                </button>

                                {activeMenuId === s.id && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-0"
                                            onClick={() => setActiveMenuId(null)}
                                        />
                                        <div className="absolute right-0 top-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-2 z-20 min-w-[160px] flex flex-col gap-1">
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    handleOpenModal(s);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                                            >
                                                <Edit2 size={16} />
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    handleDeleteClick(s);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{s.name}</h3>
                        <p className="text-sm text-gray-500 font-mono mb-4">{s.shortname}</p>

                        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                            {s.pvsp_link && (
                                <a href={s.pvsp_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-jungle-600 dark:hover:text-jungle-400 transition-colors">
                                    <ExternalLink size={12} /> {t('adminSubjects.pvspLink')}
                                </a>
                            )}
                            {s.pphis_link && (
                                <a href={s.pphis_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-jungle-600 dark:hover:text-jungle-400 transition-colors">
                                    <ExternalLink size={12} /> {t('adminSubjects.pphisLink')}
                                </a>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSubject ? t('adminSubjects.editSubject') : t('adminSubjects.newSubject')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label={t('adminSubjects.name')}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Computer Science"
                    />
                    <div className="space-y-4">
                        <Input
                            label={t('adminSubjects.shortname')}
                            name="shortname"
                            value={formData.shortname}
                            onChange={handleChange}
                            required
                            placeholder="e.g. CS"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">{t('manageGroup.edit.icon')}</label>
                        <IconPicker
                            value={formData.icon}
                            onChange={(iconName) => setFormData({ ...formData, icon: iconName })}
                        />
                    </div>
                    <Input
                        label={`${t('adminSubjects.pvspLink')} ${t('adminSubjects.optional')}`}
                        name="pvsp_link"
                        value={formData.pvsp_link}
                        onChange={handleChange}
                        placeholder="https://..."
                    />
                    <Input
                        label={`${t('adminSubjects.pphisLink')} ${t('adminSubjects.optional')}`}
                        name="pphis_link"
                        value={formData.pphis_link}
                        onChange={handleChange}
                        placeholder="https://..."
                    />

                    <div className="pt-4">
                        <Button type="submit" className="w-full">
                            {editingSubject ? t('common.save') : t('adminSubjects.addSubject')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('adminSubjects.deleteConfirmTitle')}
                message={t('adminSubjects.deleteConfirmMessage', { name: subjectToDelete?.name })}
                confirmText={t('common.delete')}
                isDangerous={true}
            />

            {/* Floating Action Button for Add Subject */}
            <button
                onClick={() => handleOpenModal()}
                className="fixed bottom-24 right-5 md:bottom-10 md:right-10 w-[60px] h-[60px] bg-jungle-500 hover:bg-jungle-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-jungle-500/40 transition-all hover:scale-105 active:scale-95 z-40"
            >
                <Plus size={28} />
            </button>
        </div >
    );
};

export default AdminSubjects;
