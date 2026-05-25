import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import Input from './Input';
import Button from './Button';
import DateTimePicker from './DateTimePicker';
import IconPicker from './IconPicker';
import SubjectSelector from './SubjectSelector';
import api from '../services/api';


const DeadlineModal = ({ isOpen, onClose, onSuccess, deadline = null, submitRef, isMiniApp = false }) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ts_from: '',
        ts_due: '',
        subject_id: '',
        icon: '',
        sdo_link: '',
        is_personal: true
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isEditMode = !!deadline;

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();

            if (deadline) {
                setFormData({
                    name: deadline.name,
                    ts_from: deadline.ts_from,
                    ts_due: deadline.ts_due,
                    subject_id: deadline.subject_id || '',
                    icon: deadline.icon || '',
                    sdo_link: deadline.sdo_link || '',
                    is_personal: !deadline.group_id // If no group ID, it's personal
                });
            } else {
                // Reset form for create
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);

                setFormData({
                    name: '',
                    ts_from: now.toISOString(),
                    ts_due: tomorrow.toISOString(),
                    subject_id: '',
                    icon: '',
                    sdo_link: '',
                    is_personal: true
                });
            }
        }
    }, [isOpen, deadline]);

    useEffect(() => {
        if (isMiniApp && window.Telegram?.WebApp) {
            if (loading) {
                window.Telegram.WebApp.MainButton.showProgress(false);
            } else {
                window.Telegram.WebApp.MainButton.hideProgress();
            }
        }
    }, [loading, isMiniApp]);

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/subjects');
            setSubjects(response.data);
        } catch (err) {
            console.error("Failed to fetch subjects", err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDelete = () => {
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            await api.delete(`/deadlines/${deadline.id}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to delete deadline", err);
            alert(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Format dates to DD.MM.YYYY HH:mm for backend
            const formatDate = (isoString) => {
                if (!isoString) return "";
                // Treat ISO string as "value", not "point in time", to avoid timezone shifts
                // Expected format: YYYY-MM-DDTHH:mm:ss.sssZ
                const [datePart, timePart] = isoString.split('T');
                const [year, month, day] = datePart.split('-');
                const [hour, minute] = timePart.split(':');

                return `${day}.${month}.${year} ${hour}:${minute}`;
            };

            const payload = {
                ...formData,
                subject_id: formData.subject_id ? parseInt(formData.subject_id) : 0,
                ts_from: formatDate(formData.ts_from),
                ts_due: formatDate(formData.ts_due),
                // If user is not admin, force personal
                is_personal: isAdmin ? formData.is_personal : true
            };

            if (isEditMode) {
                await api.put(`/deadlines/${deadline.id}`, payload);
            } else {
                await api.post('/deadlines', payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save deadline", err);
            alert(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? t('components.deadlineModal.editTitle') : t('components.deadlineModal.createTitle')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Admin controls hidden for editing existing deadlines to simplify logic for now, or keep them if changing ownership is needed (usually not) */}
                {isAdmin && !isEditMode && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex items-center justify-between border border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('components.deadlineModal.type')}</span>
                        <div className="flex items-center space-x-2">
                            <span className={`text-sm ${formData.is_personal ? 'text-jungle-600 dark:text-jungle-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>{t('components.deadlineModal.personal')}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_personal"
                                    checked={!formData.is_personal}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_personal: !e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-jungle-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jungle-500 dark:peer-checked:bg-jungle-600"></div>
                            </label>
                            <span className={`text-sm ${!formData.is_personal ? 'text-jungle-600 dark:text-jungle-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>{t('components.deadlineModal.group')}</span>
                        </div>
                    </div>
                )}

                <Input
                    label={t('components.deadlineModal.name')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t('components.deadlineModal.namePlaceholder')}
                />

                <div className="grid grid-cols-2 gap-4">
                    <DateTimePicker
                        label={t('components.deadlineModal.from')}
                        value={formData.ts_from}
                        onChange={(val) => setFormData(prev => ({ ...prev, ts_from: val }))}
                    />
                    <DateTimePicker
                        label={t('components.deadlineModal.due')}
                        value={formData.ts_due}
                        onChange={(val) => setFormData(prev => ({ ...prev, ts_due: val }))}
                    />
                </div>

                <SubjectSelector
                    label={t('components.deadlineModal.subject')}
                    subjects={subjects}
                    value={formData.subject_id}
                    onChange={handleChange}
                    placeholder={t('components.deadlineModal.noSubject')}
                />

                <div className="grid grid-cols-2 gap-4">
                    <IconPicker
                        label={t('components.deadlineModal.icon')}
                        value={formData.icon}
                        onChange={(val) => setFormData(prev => ({ ...prev, icon: val }))}
                    />
                    <Input
                        label={t('components.deadlineModal.link')}
                        name="sdo_link"
                        value={formData.sdo_link}
                        onChange={handleChange}
                        placeholder={t('components.deadlineModal.linkPlaceholder')}
                    />
                </div>

                <div className="pt-4 flex gap-3">
                    {isEditMode && (
                        <Button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className={`bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 ${isMiniApp ? 'w-full' : 'w-1/3'}`}
                        >
                            {t('components.deadlineModal.delete')}
                        </Button>
                    )}
                    
                    {!isMiniApp && (
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? t('components.deadlineModal.saving') : (isEditMode ? t('components.deadlineModal.saveChanges') : t('components.deadlineModal.createTitle'))}
                        </Button>
                    )}
                    
                    {isMiniApp && (
                        <button type="submit" ref={submitRef} className="hidden" />
                    )}
                </div>
            </form>

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title={t('components.deadlineModal.deleteTitle')}
                message={t('components.deadlineModal.deleteConfirm', { name: formData.name })}
                confirmText={t('components.deadlineModal.delete')}
                isDangerous={true}
            />
        </Modal>
    );
};

export default DeadlineModal;
