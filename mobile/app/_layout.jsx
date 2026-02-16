import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Screens outside tabs */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="main/*" />
    </Stack>
  );
}
