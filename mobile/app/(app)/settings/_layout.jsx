import { Stack } from 'expo-router';
import colors from '../../../constants/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings', headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="change-language" options={{ title: 'Language' }} />
      <Stack.Screen name="change-theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="manage-group" options={{ title: 'Manage Group' }} />
      <Stack.Screen name="manage-users" options={{ title: 'Manage Users' }} />
    </Stack>
  );
}