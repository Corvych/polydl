import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from "../../context/AuthProvider";
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import colors from '../../constants/colors';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View>
        <Text>Loading</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const isManager = user.role === 'admin' || user.role === 'superadmin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8E8E93',

        tabBarStyle: {
          // backgroundColor: colors.surface,
          position: 'absolute',
          bottom: 20,
          height: 60,
          borderRadius: 30,
          overflow: 'hidden', // important for blur radius

          borderWidth: 1,
          borderTopWidth: 1,
          borderColor: colors.border,

          // iOS shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        },

        tabBarBackground: () => (
          <BlurView
            intensity={59}
            tint="dark"
            style={{ flex: 1 }}
          />
        ),

        tabBarLabelStyle: {
          fontSize: 12,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          )
        }}
      />

      {isManager && (
        <Tabs.Screen
          name="manage"
          options={{
            title: "Manage",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={24}
                color={color}
              />
            )
          }}
        />
      )}

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "slider" : "slider-outline"}
              size={24}
              color={color}
            />
          )
        }}
      />
    </Tabs>
  );
}