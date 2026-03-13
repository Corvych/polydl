import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import api from '../../../services/api';
import colors from '../../../constants/colors';
import AppInput from '../../../components/AppInput';
import AppButton from '../../../components/AppButton';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [firstName, setFirstName] = useState(user?.name ?? '');
  const [lastName, setLastName] = useState(user?.surname ?? '');
  const [username, setUsername] = useState(user?.username ?? '');

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/profile', { name: firstName, surname: lastName, username });
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Profile</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <AppInput
          label="First Name"
          placeholder="Enter your first name"
          value={firstName}
          onChangeText={setFirstName}
          autoFocus
        />

        <AppInput
          label="Last Name"
          placeholder="Enter your last name"
          value={lastName}
          onChangeText={setLastName}
        />

        <AppInput
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
        />

        <AppButton title="Save Changes" onPress={handleUpdate} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  message: { padding: 12, borderRadius: 8, marginBottom: 15 },
  success: { backgroundColor: '#14532d' },
  error: { backgroundColor: '#7f1d1d' },
  messageText: { color: colors.text },
});