import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthProvider';
import colors from '../../../constants/colors';
import { router } from 'expo-router';

export default function SettingsHomeScreen() {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  const isManager = user?.role === 'admin' || user?.role === 'superadmin';
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
          {/* Edit Profile */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/edit-profile')}
          >
            <Text style={styles.optionText}>Edit Profile</Text>
          </Pressable>

          {/* Change Password */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/change-password')}
          >
            <Text style={styles.optionText}>Change Password</Text>
          </Pressable>

          {/* Change Language */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/change-language')}
          >
            <Text style={styles.optionText}>Change Language</Text>
          </Pressable>

          {/* Change Theme */}
          <Pressable
            style={styles.optionButton}
            onPress={() => router.push('/settings/change-theme')}
          >
            <Text style={styles.optionText}>Change Theme</Text>
          </Pressable>

          {/* Manage Group (for admins and superadmins) */}
          {isManager && (
            <Pressable
              style={styles.optionButton}
              onPress={() => router.push('/settings/manage-group')}
            >
              <Text style={styles.optionText}>Manage Group</Text>
            </Pressable>
          )}

          {/* Manage Users (for superadmins only) */}
          {isSuperAdmin && (
            <Pressable
              style={styles.optionButton}
              onPress={() => router.push('/settings/manage-users')}
            >
              <Text style={styles.optionText}>Manage Users</Text>
            </Pressable>
          )}

          {/* Sign Out */}
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  avatarText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  username: { color: '#aaa', textAlign: 'center', marginBottom: 15 },

  optionsContainer: { gap: 12 },
  optionButton: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
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