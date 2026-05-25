import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Settings, Copy, Trash2, Shield } from 'lucide-react-native';
import { useAuth } from "../../../context/AuthProvider";
import { useTranslation } from "../../../context/LanguageProvider";
import api from "../../../services/api";
import colors from '../../../constants/colors';
import AppInput from '../../../components/AppInput';
import AppButton from '../../../components/AppButton';

export default function ManageGroupScreen() {
  const { user, fetchUserProfile } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('info');
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [promoCode, setPromoCode] = useState('');
  const [editForm, setEditForm] = useState({ name: '' });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (user?.group_id && isAdmin) {
      fetchGroupData();
    } else {
      setLoading(false);
    }
  }, [user?.group_id]);

  const fetchGroupData = async () => {
    try {
      const groupId = user.group_id;
      const [groupRes, membersRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/members`),
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data);
      setEditForm({ name: groupRes.data.name });
    } catch (err) {
      console.log(err);
      setMessage({ type: 'error', text: t('manageGroup.failedLoad') });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      await api.post('/profile/join-group', { invite_code: promoCode });
      setMessage({ type: 'success', text: t('manageGroup.successJoin') });
      setPromoCode('');
      fetchUserProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || t('changeLanguage.error') });
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      t('manageGroup.leaveTitle'),
      t('manageGroup.leaveConfirm'),
      [
        { text: t('manageGroup.cancel'), style: 'cancel' },
        {
          text: t('manageGroup.leaveAction'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/profile/leave-group');
              setMessage({ type: 'success', text: t('manageGroup.successLeave') });
              fetchUserProfile();
            } catch (err) {
              setMessage({ type: 'error', text: err.response?.data?.error || t('changeLanguage.error') });
            }
          }
        }
      ]
    );
  };

  const handleUpdateGroup = async () => {
    setLoading(true);
    try {
      await api.put(`/groups/${user.group_id}`, { name: editForm.name });
      setMessage({ type: 'success', text: t('manageGroup.successUpdate') });
      fetchGroupData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || t('manageGroup.failedUpdate') });
    } finally {
      setLoading(false);
    }
  };

  const handleKickUser = (member) => {
    Alert.alert(
      t('manageGroup.removeMemberTitle'),
      t('manageGroup.removeMemberConfirm', { name: member.name }),
      [
        { text: t('manageGroup.cancel'), style: 'cancel' },
        {
          text: t('manageGroup.removeAction'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/groups/${user.group_id}/members/${member.id}`);
              setMessage({ type: 'success', text: t('manageGroup.successKick') });
              fetchGroupData();
              fetchUserProfile();
            } catch (err) {
              setMessage({ type: 'error', text: err.response?.data?.error || t('manageGroup.failedKick') });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyInviteCode = async () => {
    if (group?.invite_code) {
      try {
        await Share.share({
          message: t('manageGroup.inviteMsg', { code: group.invite_code }),
        });
      } catch (err) {
        setMessage({ type: 'error', text: t('manageGroup.failedShare') });
      }
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // If user is not in a group, show join form
  if (!user?.group_id) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('manageGroup.title')}</Text>

          {message.text !== '' && (
            <View style={[
              styles.message,
              message.type === 'success' ? styles.success : styles.error
            ]}>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('manageGroup.joinGroup')}</Text>
            <Text style={styles.helperText}>
              {t('manageGroup.joinGroupDesc')}
            </Text>
            <View style={{ marginTop: 12 }}>
              <AppInput
                placeholder={t('manageGroup.inviteCodePlaceholder')}
                value={promoCode}
                onChangeText={setPromoCode}
              />
              <AppButton title={t('manageGroup.joinBtn')} onPress={handleJoinGroup} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('manageGroup.title')}</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Tabs - admins get Info + Members, regular users get Info only */}
        <View style={styles.tabContainer}>
          <TabButton
            label={t('manageGroup.infoTab')}
            active={activeTab === 'info'}
            onPress={() => setActiveTab('info')}
            Icon={Settings}
          />
          {isAdmin && (
            <TabButton
              label={t('manageGroup.membersTab')}
              active={activeTab === 'members'}
              onPress={() => setActiveTab('members')}
              Icon={Users}
            />
          )}
        </View>

        {activeTab === 'info' && (
          <View style={styles.card}>
            {isAdmin && group ? (
              <>
                <Text style={styles.sectionTitle}>{t('manageGroup.groupName')}</Text>
                <AppInput
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                />
                <AppButton title={t('manageGroup.saveChanges')} onPress={handleUpdateGroup} loading={loading} />

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>{t('manageGroup.inviteCode')}</Text>
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCode}>{group.invite_code}</Text>
                  <View style={styles.inviteActions}>
                    <Pressable onPress={handleCopyInviteCode} style={styles.iconButton}>
                      <Copy size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  {t('manageGroup.inviteCodeDesc')}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{t('manageGroup.groupName')}</Text>
                <Text style={styles.groupName}>{user?.group_name}</Text>
              </>
            )}

            <View style={styles.divider} />

            <AppButton
              title={t('manageGroup.leaveBtn')}
              onPress={handleLeaveGroup}
              variant="danger"
            />
          </View>
        )}

        {activeTab === 'members' && isAdmin && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t('manageGroup.membersCount', { count: members.length })}
            </Text>
            {members.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.name} {member.surname}
                  </Text>
                  <Text style={styles.memberUsername}>@{member.username}</Text>
                  {member.role && (
                    <Text style={styles.memberRole}>{member.role}</Text>
                  )}
                </View>
                {member.id !== user.id && (
                  <Pressable
                    onPress={() => handleKickUser(member)}
                    style={styles.kickButton}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                )}
              </View>
            ))}
            {members.length === 0 && (
              <Text style={styles.emptyText}>{t('manageGroup.noMembers')}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const TabButton = ({ label, active, onPress, Icon }) => (
  <Pressable
    onPress={onPress}
    style={[styles.tabButton, active && styles.activeTab]}
  >
    <Icon size={16} color={active ? colors.primary : '#666'} />
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noGroupText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  noGroupSubtext: { color: '#888', textAlign: 'center' },

  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 },

  message: { padding: 12, borderRadius: 8, marginBottom: 15 },
  success: { backgroundColor: '#14532d' },
  error: { backgroundColor: '#7f1d1d' },
  messageText: { color: colors.text },

  tabContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  tabButton: { flexDirection: 'row', alignItems: 'center', padding: 8, marginRight: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.border },
  tabText: { marginLeft: 6, color: '#aaa' },
  activeTabText: { color: colors.primary },

  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 20 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  groupName: { color: '#fff', marginBottom: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },

  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  inviteCode: { flex: 1, fontSize: 18, color: colors.primary, fontWeight: 'bold', letterSpacing: 2 },
  inviteActions: { flexDirection: 'row' },
  iconButton: { padding: 8, marginLeft: 8 },
  helperText: { color: '#888', fontSize: 12 },

  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  memberInfo: { flex: 1 },
  memberName: { color: '#fff', fontWeight: 'bold' },
  memberUsername: { color: '#888', fontSize: 12 },
  memberRole: { color: colors.primary, fontSize: 12, marginTop: 2 },
  kickButton: { padding: 8 },

  emptyText: { color: '#888', textAlign: 'center', padding: 20 },
});
