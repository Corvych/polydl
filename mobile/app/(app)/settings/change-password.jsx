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

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.post('/profile/change-password', {
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setMessage({ type: 'success', text: t('changePassword.success') });
      setForm({ old_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || t('changePassword.error') });
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
        <Text style={styles.title}>{t('changePassword.title')}</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <AppInput
          placeholder={t('changePassword.currentPassword')}
          secureTextEntry
          value={form.old_password}
          onChangeText={(text) => setForm({ ...form, old_password: text })}
        />

        <AppInput
          placeholder={t('changePassword.newPassword')}
          secureTextEntry
          value={form.new_password}
          onChangeText={(text) => setForm({ ...form, new_password: text })}
        />

        <AppInput
          placeholder={t('changePassword.confirmNewPassword')}
          secureTextEntry
          value={form.confirm_new_password}
          onChangeText={(text) => setForm({ ...form, confirm_new_password: text })}
        />

        <AppButton title={t('changePassword.updatePassword')} onPress={handleUpdate} loading={loading} />
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