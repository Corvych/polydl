import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Users, Settings, UserMinus, Copy, Shield, ShieldCheck, Check, Wand2, ArrowLeft } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import IconPicker from '../components/IconPicker';

const ManageGroup = ({ adminView = false }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [groupIcon, setGroupIcon] = useState('Users');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);

    // Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCode, setEditCode] = useState('');
    const [editIcon, setEditIcon] = useState('Users');

    // Confirm Modal
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState(null);

    useEffect(() => {
        fetchGroupData();
    }, [id, adminView]);

    const fetchGroupData = async () => {
        try {
            let name, code, icon, membersData;

            if (adminView && id) {
                const groupRes = await api.get(`/groups/${id}`);
                name = groupRes.data.name;
                code = groupRes.data.invite_code;
                icon = groupRes.data.icon;

                const membersRes = await api.get(`/groups/${id}/members`);
                membersData = membersRes.data;
            } else {
                const profileRes = await api.get('/profile');
                name = profileRes.data.group_name;
                code = profileRes.data.group_code;
                icon = profileRes.data.group_icon;

                const membersRes = await api.get('/group/members');
                membersData = membersRes.data;
            }

            setGroupName(name);
            setInviteCode(code);
            setGroupIcon(icon || 'Users');
            setEditName(name);
            setEditCode(code);
            setEditIcon(icon || 'Users');
            setMembers(membersData);

        } catch (err) {
            console.error(err);
            setError(t('manageGroup.messages.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        try {
            const payload = { name: editName, invite_code: editCode, icon: editIcon };

            if (adminView && id) {
                await api.put(`/groups/${id}`, payload);
            } else {
                await api.put('/group', payload);
            }

            setGroupName(editName);
            setInviteCode(editCode);
            setGroupIcon(editIcon);
            setSuccess(t('manageGroup.messages.updateSuccess'));
            setIsEditModalOpen(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || t('common.error'));
        }
    };

    const handleKickMember = async () => {
        if (!memberToKick) return;
        const memberId = memberToKick.id;

        try {
            if (adminView && id) {
                await api.delete(`/groups/${id}/members/${memberId}`);
            } else {
                await api.delete(`/groups/my/members/${memberId}`);
            }

            setMembers(members.filter(m => m.id !== memberId));
            setSuccess(t('manageGroup.messages.removeSuccess'));
            setTimeout(() => setSuccess(''), 3000);
            setIsKickModalOpen(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || t('common.error'));
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>;

    const GroupIconComponent = groupIcon && LucideIcons[groupIcon] ? LucideIcons[groupIcon] : Users;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {adminView && (
                        <button
                            onClick={() => navigate('/admin/groups')}
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft size={16} /> {t('manageGroup.backToGroups')}
                        </button>
                    )}
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
                        <GroupIconComponent className="text-jungle-600 dark:text-jungle-400" /> {groupName}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {adminView ? t('manageGroup.adminSubtitle') : t('manageGroup.memberSubtitle')}
                    </p>
                </div>
            </header>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 rounded-xl bg-jungle-500/10 border border-jungle-500/20 text-jungle-400">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invite Code Card */}
                <Card className="md:col-span-1 h-fit p-6 space-y-4 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('manageGroup.invite.title')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('manageGroup.invite.subtitle')}</p>

                    <div className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
                        <code className="text-xl font-mono text-jungle-600 dark:text-jungle-400 font-bold tracking-wider">
                            {inviteCode}
                        </code>
                        <button
                            onClick={handleCopyCode}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            title={t('manageGroup.invite.copyCode')}
                        >
                            {copied ? <Check size={20} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={20} />}
                        </button>
                    </div>

                    <div className="pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-bold">{t('manageGroup.invite.orShareLink')}</p>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={`${window.location.origin}/join?code=${inviteCode}`}
                                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400 w-full font-mono truncate"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/join?code=${inviteCode}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                                title={t('manageGroup.invite.copyLink')}
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Members List */}
                <Card className="md:col-span-2 p-0 overflow-hidden bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {t('manageGroup.members.title')} <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">{members.length}</span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50">
                                    <th className="p-4 font-medium">{t('manageGroup.members.name')}</th>
                                    <th className="p-4 font-medium">{t('manageGroup.members.username')}</th>
                                    <th className="p-4 font-medium">{t('manageGroup.members.role')}</th>
                                    <th className="p-4 font-medium text-right">{t('manageGroup.members.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <span className="text-gray-900 dark:text-white font-medium">{member.name} {member.surname}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">@{member.username}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.role === 'superadmin' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                                                member.role === 'admin' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' :
                                                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}>
                                                {member.role === 'superadmin' && <ShieldCheck size={10} className="mr-1" />}
                                                {member.role === 'admin' && <Shield size={10} className="mr-1" />}
                                                {member.role === 'superadmin' ? t('common.roleSuperAdmin') : member.role === 'admin' ? t('common.roleAdmin') : t('common.roleUser')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {member.id !== user.id && (
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setMemberToKick(member);
                                                            setIsKickModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title={t('manageGroup.members.remove')}
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {members.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            {t('manageGroup.members.noMembers')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Edit Group Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={t('manageGroup.edit.title')}
            >
                <form onSubmit={handleUpdateGroup} className="space-y-4">
                    <Input
                        label={t('manageGroup.edit.name')}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                    />

                    <IconPicker
                        label={t('manageGroup.edit.icon')}
                        value={editIcon}
                        onChange={setEditIcon}
                    />

                    <Input
                        label={t('manageGroup.edit.inviteCode')}
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        required
                        rightElement={
                            <button
                                type="button"
                                onClick={() => {
                                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                    let result = '';
                                    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
                                    setEditCode(result);
                                }}
                                className="p-1 text-jungle-400 hover:text-jungle-300 transition-colors"
                                title={t('manageGroup.edit.generateCode')}
                            >
                                <Wand2 size={20} />
                            </button>
                        }
                    />

                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                            {t('common.save')}
                        </Button>
                    </div>
                </form>

            </Modal>

            <ConfirmModal
                isOpen={isKickModalOpen}
                onClose={() => setIsKickModalOpen(false)}
                onConfirm={handleKickMember}
                title={t('manageGroup.members.removeConfirmTitle')}
                message={t('manageGroup.members.removeConfirmMessage', { name: memberToKick?.name })}
                confirmText={t('manageGroup.members.removeConfirmAction')}
                isDangerous={true}
            />

            {/* Floating Action Button for Group Settings */}
            <button
                onClick={() => setIsEditModalOpen(true)}
                className="fixed bottom-24 right-4 md:bottom-10 md:right-10 w-14 h-14 bg-jungle-500 hover:bg-jungle-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-jungle-500/40 transition-all hover:scale-105 active:scale-95 z-40"
            >
                <Settings size={28} />
            </button>
        </div >
    );
};

export default ManageGroup;
