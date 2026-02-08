import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import IconPicker from '../components/IconPicker';
import { Plus, Edit2, Trash2, Users, Wand2 } from 'lucide-react';

const AdminGroups = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        invite_code: '',
        icon: 'Users'
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data);
        } catch (err) {
            console.error("Failed to fetch groups", err);
            setError(t('adminGroups.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    };

    const handleOpenModal = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                invite_code: group.invite_code,
                icon: group.icon || 'Users'
            });
        } else {
            setEditingGroup(null);
            setFormData({
                name: '',
                invite_code: generateRandomCode(),
                icon: 'Users'
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
            if (editingGroup) {
                await api.put(`/groups/${editingGroup.id}`, formData);
                setGroups(groups.map(g => g.id === editingGroup.id ? { ...g, ...formData } : g));
            } else {
                const response = await api.post('/groups', formData);
                setGroups([...groups, { ...formData, id: response.data.id }]);
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save group", err);
            alert(t('adminGroups.saveGroupError'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('adminGroups.deleteConfirm'))) return;
        try {
            await api.delete(`/groups/${id}`);
            setGroups(groups.filter(g => g.id !== id));
        } catch (err) {
            console.error("Failed to delete group", err);
            alert(t('adminGroups.deleteGroupError'));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">{t('adminGroups.loading')}</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{t('adminGroups.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('adminGroups.subtitle')}</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={18} />
                    <span>{t('adminGroups.addGroup')}</span>
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((g) => {
                    const GroupIcon = g.icon && LucideIcons[g.icon] ? LucideIcons[g.icon] : Users;
                    return (
                        <Card
                            key={g.id}
                            onClick={() => navigate(`/admin/groups/${g.id}`)}
                            className="group relative hover:shadow-lg hover:shadow-jungle-500/10 hover:border-jungle-500/20 cursor-pointer transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-jungle-600 dark:text-jungle-400">
                                    <GroupIcon size={20} />
                                </div>

                                {/* Desktop Hover Actions */}
                                <div className="hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => navigate(`/admin/groups/${g.id}`)}
                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                                        title={t('adminGroups.manageMembers')}
                                    >
                                        <Users size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(g)}
                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                                        title={t('adminGroups.editGroup')}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(g.id)}
                                        className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Mobile Options Menu */}
                                <div className="md:hidden relative" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === g.id ? null : g.id)}
                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg z-10 relative"
                                    >
                                        <LucideIcons.MoreVertical size={20} />
                                    </button>

                                    {activeMenuId === g.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-0"
                                                onClick={() => setActiveMenuId(null)}
                                            />
                                            <div className="absolute right-0 top-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-2 z-20 min-w-[160px] flex flex-col gap-1">
                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        navigate(`/admin/groups/${g.id}`);
                                                    }}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                                                >
                                                    <Users size={16} />
                                                    {t('adminGroups.manageMembers')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        handleOpenModal(g);
                                                    }}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                                                >
                                                    <Edit2 size={16} />
                                                    {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveMenuId(null);
                                                        handleDelete(g.id);
                                                    }}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{g.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">{t('adminGroups.code')}: <span className="text-jungle-600 dark:text-jungle-400">{g.invite_code}</span></p>
                        </Card>
                    );
                })}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingGroup ? t('adminGroups.editGroup') : t('adminGroups.newGroup')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label={t('manageGroup.edit.name')}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. KV-33"
                    />

                    <IconPicker
                        label={t('manageGroup.edit.icon')}
                        value={formData.icon}
                        onChange={(val) => setFormData(prev => ({ ...prev, icon: val }))}
                    />

                    <Input
                        label={t('manageGroup.edit.inviteCode')}
                        name="invite_code"
                        value={formData.invite_code}
                        onChange={handleChange}
                        required
                        placeholder="e.g. kv33-secret"
                        rightElement={
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, invite_code: generateRandomCode() });
                                }}
                                className="p-1 text-jungle-400 hover:text-jungle-300 transition-colors"
                                title={t('manageGroup.edit.generateCode')}
                            >
                                <Wand2 size={20} />
                            </button>
                        }
                    />

                    <div className="pt-4">
                        <Button type="submit" className="w-full">
                            {editingGroup ? t('common.save') : t('adminGroups.addGroup')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default AdminGroups;
