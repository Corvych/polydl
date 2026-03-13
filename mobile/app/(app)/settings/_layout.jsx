import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      {/* The screens are defined by the files in this directory */}
      <Stack.Screen name="index" options={{ title: 'Settings', headerShown: false }} />
      {/* Other screens will be auto-added by expo-router based on file names */}
    </Stack>
  );
}