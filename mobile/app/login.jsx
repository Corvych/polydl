import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Lock, AlertCircle, ArrowRight } from 'lucide-react-native';
import AppInput from "../components/AppInput";
import colors from '../constants/colors';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from '../context/LanguageProvider';

const LoginScreen = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError(t('login.fillAllFields'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        router.replace('/(app)');
      } else {
        setError(result.error || t('login.failed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('login.somethingWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top + 30, 80) }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#2fd660', '#34d399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <User size={30} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        {/* Error */}
        {error !== '' && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color="#ef4444" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Username */}
        <AppInput
          label={t('login.username')}
          placeholder={t('login.usernamePlaceholder')}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          rightIcon={<User size={20} color={colors.textMuted} />}
        />

        {/* Password */}
        <AppInput
          label={t('login.password')}
          placeholder={t('login.passwordPlaceholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          rightIcon={<Lock size={20} color={colors.textMuted} />}
        />

        {/* Gradient Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.85}
          style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={['#2fd660', '#34d399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{t('login.signIn')}</Text>
                <ArrowRight size={18} color="#ffffff" style={styles.buttonIcon} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Register link */}
        <TouchableOpacity
          onPress={() => router.push("/register")}
          activeOpacity={0.7}
          style={styles.registerContainer}
        >
          <Text style={styles.registerText}>
            {t('login.noAccount')}{" "}
            <Text style={styles.registerLink}>{t('login.signUp')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2fd660',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#2fd660',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '600',
  }
});
