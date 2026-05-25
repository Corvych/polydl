import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthProvider';
import colors from '../../../constants/colors';
import { router } from 'expo-router';
import { useTranslation } from '../../../context/LanguageProvider';

export default function SettingsHomeScreen() {
  const { user, logout, theme, changeTheme } = useAuth();
  const { t } = useTranslation();
  const styles = getStyles();

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? ''}</Text>
          </View>
          <Text style={styles.name}>
            {user?.name} {user?.surname}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>

        {/* Settings Options */}
        <View style={styles.optionsContainer}>
          {/* Group */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/group')}
          >
            <Text style={styles.optionText}>{t('settings.group')}</Text>
          </Pressable>

          {/* Edit Profile */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/edit-profile')}
          >
            <Text style={styles.optionText}>{t('settings.editProfile')}</Text>
          </Pressable>

          {/* Change Password */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/change-password')}
          >
            <Text style={styles.optionText}>{t('settings.changePassword')}</Text>
          </Pressable>

          {/* Change Language */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/change-language')}
          >
            <Text style={styles.optionText}>{t('settings.changeLanguage')}</Text>
          </Pressable>

          {/* Change Theme */}
          <View style={styles.themeRow}>
            <Text style={styles.optionText}>{t('settings.changeTheme')}</Text>
            <View style={styles.segmentContainer}>
              {['system', 'light', 'dark'].map((tKey) => {
                const isActive = theme === tKey;
                return (
                  <Pressable
                    key={tKey}
                    onPress={() => changeTheme(tKey)}
                    style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                  >
                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                      {tKey === 'system' ? t('settings.themeAuto') : tKey === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Manage Users (for superadmins only) */}
          {isSuperAdmin && (
            <Pressable
              style={styles.optionButton}
              onPress={() => router.push('/settings/manage-users')}
            >
              <Text style={styles.optionText}>{t('settings.manageUsers')}</Text>
            </Pressable>
          )}

          {/* Sign Out */}
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, color: '#fefefe', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  username: { color: colors.textMuted, textAlign: 'center', marginBottom: 15 },

  optionsContainer: { gap: 12 },
  optionButton: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  themeRow: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fefefe',
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 8,
  },
  signOutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});