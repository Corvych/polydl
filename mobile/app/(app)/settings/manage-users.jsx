import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Trash2 } from 'lucide-react-native';
import { useAuth } from "../../../context/AuthProvider";
import api from "../../../services/api";
import colors from '../../../constants/colors';
import AppButton from '../../../components/AppButton';

export default function ManageUsersScreen() {
  const { user, fetchUserProfile } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.group_id) {
      fetchGroupUsers();
    } else {
      setLoading(false);
    }
  }, [user?.group_id]);

  const fetchGroupUsers = async () => {
    try {
      const groupId = user.group_id;
      const res = await api.get(`/groups/${groupId}/members`);
      setUsers(res.data);
    } catch (err) {
      console.log(err);
      setMessage({ type: 'error', text: 'Failed to load group users.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userToRemove) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${userToRemove.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/groups/${user.group_id}/members/${userToRemove.id}`);
              setMessage({ type: 'success', text: 'User removed successfully.' });
              fetchGroupUsers();
              fetchUserProfile();
            } catch (err) {
              setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to remove user.' });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // If user is not in a group, show message
  if (!user?.group_id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.noGroupText}>You are not in a group.</Text>
          <Text style={styles.noGroupSubtext}>Join a group from your profile to access group user management.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Group Users</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Users ({users.length})</Text>
        {users.map((userItem) => (
          <View key={userItem.id} style={styles.userItem}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {userItem.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userItem.name} {userItem.surname}
              </Text>
              <Text style={styles.userUsername}>@{userItem.username}</Text>
              {userItem.role && (
                <Text style={styles.userRole}>{userItem.role}</Text>
              )}
            </View>
            {userItem.id !== user.id && (
              <Pressable
                onPress={() => handleRemoveUser(userItem)}
                style={styles.removeButton}
              >
                <Trash2 size={18} color="#ef4444" />
              </Pressable>
            )}
          </View>
        ))}
        {users.length === 0 && (
          <Text style={styles.emptyText}>No users found in this group.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },

  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontWeight: 'bold' },
  userUsername: { color: '#888', fontSize: 12 },
  userRole: { color: colors.primary, fontSize: 12, marginTop: 2 },
  removeButton: { padding: 8 },

  emptyText: { color: '#888', textAlign: 'center', padding: 20 },
});
