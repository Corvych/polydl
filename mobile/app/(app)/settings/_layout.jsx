import { Stack } from 'expo-router';
import colors from '../../../constants/colors';
import { useTranslation } from '../../../context/LanguageProvider';
import { useAuth } from '../../../context/AuthProvider';

export default function SettingsLayout() {
  const { t } = useTranslation();
  // eslint-disable-next-line no-unused-vars
  const { theme } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: t('settings.title'), headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ title: t('settings.editProfile') }} />
      <Stack.Screen name="change-password" options={{ title: t('settings.changePassword') }} />
      <Stack.Screen name="change-language" options={{ title: t('settings.changeLanguage') }} />
      <Stack.Screen name="change-theme" options={{ title: t('settings.changeTheme') }} />
      <Stack.Screen name="group" options={{ title: t('settings.group') }} />
      <Stack.Screen name="manage-users" options={{ title: t('settings.manageUsers') }} />
    </Stack>
  );
}