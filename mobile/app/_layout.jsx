import { Stack } from "expo-router";
import React from "react";
import { AuthProvider } from "../context/AuthProvider"

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="(app)"
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
            animation: "none"
          }}
        />
      </Stack>
    </AuthProvider>
  );
}