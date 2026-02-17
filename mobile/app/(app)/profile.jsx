import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  Key,
  LogOut,
  Users,
  Settings
} from 'lucide-react-native';
import { useAuth } from "../../context/AuthProvider"
import api from "../../services/api" 

const ProfileScreen = () => {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [promoCode, setPromoCode] = useState('');
  const [editForm, setEditForm] = useState({ name: '', surname: '', username: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
      setEditForm({
        name: res.data.name,
        surname: res.data.surname,
        username: res.data.username
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      await api.post('/profile/join-group', { invite_code: promoCode });
      setMessage({ type: 'success', text: 'Successfully joined group.' });
      setPromoCode('');
      fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/profile/leave-group');
              setMessage({ type: 'success', text: 'Successfully left group.' });
              fetchProfile();
            } catch (err) {
              setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put('/profile', editForm);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.post('/profile/change-password', passwordForm);
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ old_password: '', new_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton label="Info" active={activeTab === 'info'} onPress={() => setActiveTab('info')} Icon={User} />
          <TabButton label="Edit" active={activeTab === 'edit'} onPress={() => setActiveTab('edit')} Icon={Shield} />
          <TabButton label="Security" active={activeTab === 'security'} onPress={() => setActiveTab('security')} Icon={Key} />
          <TabButton label="Settings" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} Icon={Settings} />
        </View>

        {activeTab === 'info' && profile && (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name?.charAt(0)}</Text>
            </View>

            <Text style={styles.name}>
              {profile.name} {profile.surname}
            </Text>
            <Text style={styles.username}>@{profile.username}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group</Text>

              {profile.group_id ? (
                <>
                  <Text style={styles.groupName}>{profile.group_name}</Text>
                  <Button label="Leave Group" danger onPress={handleLeaveGroup} />
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter invite code"
                    value={promoCode}
                    onChangeText={setPromoCode}
                  />
                  <Button label="Join Group" onPress={handleJoinGroup} />
                </>
              )}
            </View>
          </View>
        )}

        {activeTab === 'edit' && (
          <View style={styles.card}>
            <Input
              placeholder="First Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            />
            <Input
              placeholder="Last Name"
              value={editForm.surname}
              onChangeText={(text) => setEditForm({ ...editForm, surname: text })}
            />
            <Input
              placeholder="Username"
              value={editForm.username}
              onChangeText={(text) => setEditForm({ ...editForm, username: text })}
            />
            <Button label="Save Changes" onPress={handleUpdateProfile} />
          </View>
        )}

        {activeTab === 'security' && (
          <View style={styles.card}>
            <Input
              placeholder="Current Password"
              secureTextEntry
              value={passwordForm.old_password}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, old_password: text })}
            />
            <Input
              placeholder="New Password"
              secureTextEntry
              value={passwordForm.new_password}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, new_password: text })}
            />
            <Button label="Update Password" onPress={handleChangePassword} />
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.card}>
            <Text style={{ color: '#fff' }}>Language</Text>
            <Text style={{ color: '#fff', marginTop: 10 }}>Theme</Text>
          </View>
        )}

        <Pressable onPress={logout} style={styles.logout}>
          <LogOut size={18} color="red" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const TabButton = ({ label, active, onPress, Icon }) => (
  <Pressable
    onPress={onPress}
    style={[styles.tabButton, active && styles.activeTab]}
  >
    <Icon size={16} color={active ? '#16a34a' : '#666'} />
    <Text style={[styles.tabText, active && styles.activeTabText]}>
      {label}
    </Text>
  </Pressable>
);

const Input = (props) => (
  <TextInput
    style={styles.input}
    placeholderTextColor="#888"
    {...props}
  />
);

const Button = ({ label, onPress, danger }) => (
  <Pressable
    onPress={onPress}
    style={[styles.button, danger && styles.dangerButton]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },

  message: { padding: 12, borderRadius: 8, marginBottom: 15 },
  success: { backgroundColor: '#14532d' },
  error: { backgroundColor: '#7f1d1d' },
  messageText: { color: '#fff' },

  tabContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  tabButton: { flexDirection: 'row', alignItems: 'center', padding: 8, marginRight: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#16a34a' },
  tabText: { marginLeft: 6, color: '#aaa' },
  activeTabText: { color: '#16a34a' },

  card: { backgroundColor: '#1f1f1f', padding: 16, borderRadius: 12, marginBottom: 20 },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10
  },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },

  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  username: { color: '#aaa', textAlign: 'center', marginBottom: 15 },

  section: { marginTop: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  groupName: { color: '#fff', marginBottom: 10 },

  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },

  button: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  dangerButton: { backgroundColor: '#dc2626' },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  logout: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  logoutText: { color: 'red', marginLeft: 6 }
});

export default ProfileScreen;
