import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Lock, Key, AlertCircle, ArrowRight } from 'lucide-react-native';
import colors from "../constants/colors";
import AppInput from "../components/AppInput";
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from '../context/LanguageProvider';

const RegisterScreen = () => {
  const { register } = useAuth();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const inviteCodeFromUrl = params?.code || "";
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "",
    password: "",
    invite_code: inviteCodeFromUrl,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update invite code if it changes
  useEffect(() => {
    if (inviteCodeFromUrl) {
      setFormData((prev) => ({ ...prev, invite_code: inviteCodeFromUrl }));
    }
  }, [inviteCodeFromUrl]);

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        router.replace('/(app)');
      } else {
        setError(result.error || t("register.failed"));
      }
    } catch (err) {
      console.error(err);
      setError(t("register.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top + 20, 48) }
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
          <Text style={styles.title}>{t("register.title")}</Text>
          <Text style={styles.subtitle}>{t("register.subtitle")}</Text>
        </View>

        {/* Error */}
        {error !== "" && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color="#ef4444" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Name & Surname in a side-by-side row */}
        <View style={styles.nameRow}>
          <View style={styles.nameColLeft}>
            <AppInput
              label={t("register.firstName")}
              placeholder={t("register.firstNamePlaceholder")}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>
          <View style={styles.nameColRight}>
            <AppInput
              label={t("register.lastName")}
              placeholder={t("register.lastNamePlaceholder")}
              value={formData.surname}
              onChangeText={(text) => setFormData({ ...formData, surname: text })}
            />
          </View>
        </View>

        {/* Username */}
        <AppInput
          label={t("register.username")}
          placeholder={t("register.usernamePlaceholder")}
          autoCapitalize="none"
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
          rightIcon={<User size={20} color={colors.textMuted} />}
        />

        {/* Password */}
        <AppInput
          label={t("register.password")}
          placeholder={t("register.passwordPlaceholder")}
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          rightIcon={<Lock size={20} color={colors.textMuted} />}
        />

        {/* Invite Code */}
        <View style={styles.inviteContainer}>
          <AppInput
            label={t("register.inviteCode")}
            placeholder={t("register.inviteCodePlaceholder")}
            value={formData.invite_code}
            onChangeText={(text) =>
              !inviteCodeFromUrl && setFormData({ ...formData, invite_code: text })
            }
            editable={!inviteCodeFromUrl}
            rightIcon={<Key size={20} color={colors.textMuted} />}
          />
          <Text style={styles.hintText}>{t("register.inviteCodeHint")}</Text>
        </View>

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
                <Text style={styles.buttonText}>{t("register.signUp")}</Text>
                <ArrowRight size={18} color="#ffffff" style={styles.buttonIcon} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity
          onPress={() =>
            router.push(
              inviteCodeFromUrl
                ? `/login?code=${inviteCodeFromUrl}`
                : "/login"
            )
          }
          activeOpacity={0.7}
          style={styles.loginContainer}
        >
          <Text style={styles.loginText}>
            {t("register.hasAccount")}{" "}
            <Text style={styles.loginLink}>{t("register.signIn")}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

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
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  nameRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  nameColLeft: {
    flex: 1,
    marginRight: 8,
  },
  nameColRight: {
    flex: 1,
    marginLeft: 8,
  },
  inviteContainer: {
    width: '100%',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
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
  loginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  }
});
