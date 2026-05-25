import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Switch
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { useTranslation } from '../../../context/LanguageProvider';
import api from '../../../services/api';
import colors from '../../../constants/colors';
import AppButton from '../../../components/AppButton';

export default function ChangeThemeScreen() {
  const { user, fetchUserProfile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isDarkMode, setIsDarkMode] = useState(user?.theme === 'dark');

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/profile', { theme: isDarkMode ? 'dark' : 'light' });
      await fetchUserProfile();
      setMessage({
        type: 'success',
        text: isDarkMode ? t('changeTheme.successDark') : t('changeTheme.successLight')
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || t('changeTheme.error') });
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
        <Text style={styles.title}>{t('changeTheme.title')}</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <View style={styles.themeContainer}>
          <Text style={styles.themeLabel}>{t('changeTheme.darkMode')}</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>

        <AppButton title={t('changeTheme.saveChanges')} onPress={handleUpdate} loading={loading} />
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
  themeContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 18,
    color: colors.text,
  },
});