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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8E8E93',

        tabBarStyle: {
          backgroundColor: colors.surface,
          position: 'absolute',
          left: 16,
          right: 16,
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

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          )
        }}
      />
    </Tabs>
  );
}