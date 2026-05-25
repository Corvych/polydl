import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthProvider";
import { LanguageProvider } from "../context/LanguageProvider";
import { WebSocketProvider } from "../context/WebSocketContext";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

function RootLayoutContent() {
  const { theme } = useAuth();
  const systemScheme = useColorScheme();

  const activeTheme = theme === "system" || !theme ? systemScheme : theme;
  const isDark = activeTheme === "dark";

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#000000",
      card: "#0a0e18",
      text: "#ffffff",
      border: "#1a2233",
    },
  };

  const customDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#f8fafc",
      card: "#ffffff",
      text: "#0f172a",
      border: "#cbd5e1",
    },
  };

  return (
    <ThemeProvider value={isDark ? customDarkTheme : customDefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
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
            animation: "none",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <LanguageProvider>
          <RootLayoutContent />
        </LanguageProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}