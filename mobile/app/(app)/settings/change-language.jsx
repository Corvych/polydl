import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

export default function ChangeLanguageScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [language, setLanguage] = useState(user?.language ?? 'en');

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/profile', { language });
      setMessage({ type: 'success', text: 'Language updated successfully.' });
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
        <Text style={styles.title}>Change Language</Text>

        {message.text !== '' && (
          <View style={[
            styles.message,
            message.type === 'success' ? styles.success : styles.error
          ]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Language options */}
        <View style={styles.optionsContainer}>
          <Pressable
            style={[styles.optionButton, language === 'en' && styles.selectedOption]}
            onPress={() => setLanguage('en')}
          >
            <Text style={styles.optionText}>English</Text>
          </Pressable>

          <Pressable
            style={[styles.optionButton, language === 'ru' && styles.selectedOption]}
            onPress={() => setLanguage('ru')}
          >
            <Text style={styles.optionText}>Russian</Text>
          </Pressable>
        </View>

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
  optionsContainer: { marginTop: 20 },
  optionButton: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
  },
});