import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from "../../context/AuthProvider"
import { View, Text } from 'react-native';

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
    return <Redirect href="/login"/>;
  }

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'home', headerShown: false}} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false}} />
    </Tabs>
  );
}
