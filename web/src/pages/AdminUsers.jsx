import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { User, Shield, Trash2, Edit2, Users, Plus } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const AdminUsers = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: currentUser } = useAuth();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        surname: '',
        username: '',
        password: '',
        role: 'user',
        group_id: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            // Fetch users and groups in parallel
            try {
                const [usersRes, groupsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/groups')
                ]);
                setUsers(usersRes.data);
                setGroups(groupsRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError(t('adminUsers.failedToLoad'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newUser,
                group_id: newUser.group_id ? parseInt(newUser.group_id) : null
            };
            const response = await api.post('/users', payload);
            setUsers([...users, response.data]);
            setIsCreateModalOpen(false);
            setNewUser({ name: '', surname: '', username: '', password: '', role: 'user', group_id: '' });
        } catch (err) {
            console.error("Failed to create user", err);
            alert(err.response?.data?.error || t('adminUsers.failedToCreate'));
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await api.put(`/users/${id}/role`, { role: newRole });
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Failed to update role", err);
            alert(t('adminUsers.failedToUpdateRole'));
        }
    };

    const handleGroupChange = async (id, groupId) => {
        try {
            // Convert to int or 0 (if "None" selected)
            const finalGroupId = groupId ? parseInt(groupId) : 0;

            await api.put(`/users/${id}`, { group_id: finalGroupId });
            // Optimistic update (we assume success)
            setUsers(users.map(u => u.id === id ? { ...u, group_id: finalGroupId === 0 ? null : finalGroupId } : u));
        } catch (err) {
            console.error("Failed to update group", err);
            alert(t('adminUsers.failedToUpdateGroup'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('adminUsers.deleteConfirm'))) return;

        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            console.error("Failed to delete user", err);
            alert(t('adminUsers.failedToDelete'));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">{t('adminUsers.loading')}</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{t('adminUsers.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('adminUsers.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm bg-jungle-500/10 text-jungle-400 px-3 py-1.5 rounded-lg border border-jungle-500/20">
                        {t('adminUsers.totalUsers')}: <span className="font-bold">{users.length}</span>
                    </div>
                    {currentUser.role === 'superadmin' && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                            <Plus size={18} />
                            <span>{t('adminUsers.addUser')}</span>
                        </Button>
                    )}
                </div>
            </header>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-sm shadow-xl">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 uppercase font-medium text-xs tracking-wider text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-4">{t('adminUsers.user')}</th>
                            <th className="px-6 py-4">{t('adminUsers.role')}</th>
                            <th className="px-6 py-4">{t('adminUsers.group')}</th>
                            <th className="px-6 py-4 text-right">{t('adminUsers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-gray-900 dark:text-white font-medium">{u.username}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{u.name} {u.surname}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Shield size={16} className={u.role === 'superadmin' ? 'text-amber-400' : u.role === 'admin' ? 'text-purple-400' : 'text-gray-500'} />
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className="bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer text-sm font-medium py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-white/5"
                                            disabled={u.id === currentUser.id}
                                        >
                                            <option value="user">{t('common.roleUser')}</option>
                                            <option value="admin">{t('common.roleAdmin')}</option>
                                            <option value="superadmin">{t('common.roleSuperAdmin')}</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className={u.group_id ? 'text-jungle-400' : 'text-gray-600'} />
                                        <select
                                            value={u.group_id || ''}
                                            onChange={(e) => handleGroupChange(u.id, e.target.value)}
                                            className="bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer text-sm font-medium py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-white/5 max-w-[150px] truncate"
                                        >
                                            <option value="">{t('adminUsers.none')}</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        disabled={u.id === currentUser.id || u.role === 'superadmin'}
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={t('adminUsers.deleteUser')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={t('adminUsers.createNewUser')}>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t('register.name')}
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                        />
                        <Input
                            label={t('register.surname')}
                            value={newUser.surname}
                            onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })}
                            required
                        />
                    </div>
                    <Input
                        label={t('register.username')}
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        required
                    />
                    <Input
                        label={t('register.password')}
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-1.5 ml-0.5">{t('adminUsers.role')}</label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-jungle-500/50 focus:border-jungle-500/50"
                        >
                            <option value="user">{t('common.roleUser')}</option>
                            <option value="admin">{t('common.roleAdmin')}</option>
                            <option value="superadmin">{t('common.roleSuperAdmin')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-1.5 ml-0.5">{t('adminUsers.group')}</label>
                        <select
                            value={newUser.group_id}
                            onChange={(e) => setNewUser({ ...newUser, group_id: e.target.value })}
                            className="w-full bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-jungle-500/50 focus:border-jungle-500/50"
                        >
                            <option value="">-- {t('adminUsers.noGroup')} --</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full">{t('adminUsers.addUser')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminUsers;
