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
import { useTranslation } from '../../../context/LanguageProvider';
import api from '../../../services/api';
import colors from '../../../constants/colors';
import AppInput from '../../../components/AppInput';
import AppButton from '../../../components/AppButton';

export default function EditProfileScreen() {
  const { user, fetchUserProfile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [firstName, setFirstName] = useState(user?.name ?? '');
  const [lastName, setLastName] = useState(user?.surname ?? '');
  const [username, setUsername] = useState(user?.username ?? '');

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/profile', { name: firstName, surname: lastName, username });
      await fetchUserProfile();
      setMessage({ type: 'success', text: t('editProfile.success') });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || t('editProfile.error') });
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
        <Text style={styles.title}>{t('editProfile.title')}</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <AppInput
          label={t('editProfile.firstName')}
          placeholder={t('editProfile.firstNamePlaceholder')}
          value={firstName}
          onChangeText={setFirstName}
          autoFocus
        />

        <AppInput
          label={t('editProfile.lastName')}
          placeholder={t('editProfile.lastNamePlaceholder')}
          value={lastName}
          onChangeText={setLastName}
        />

        <AppInput
          label={t('editProfile.username')}
          placeholder={t('editProfile.usernamePlaceholder')}
          value={username}
          onChangeText={setUsername}
        />

        <AppButton title={t('editProfile.saveChanges')} onPress={handleUpdate} loading={loading} />
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