import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from "../../context/AuthProvider";
import { useTranslation } from "../../context/LanguageProvider";
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Layout } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import colors from '../../constants/colors';

export default function AppLayout() {
  const { user, loading, theme } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = getStyles();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // Calculate dynamic heights based on notch safe area insets
  const bottomPadding = Math.max(insets.bottom, 12);
  const barHeight = 64 + bottomPadding;

  // Center the 32px icon container perfectly in the 64px active zone, leaving bottomPadding for the safe area below
  const itemPaddingTop = (64 - 32) / 2; // 16px
  const itemPaddingBottom = bottomPadding + itemPaddingTop; // bottomPadding + 16px

  return (
    <Tabs
      key={theme}
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false, // hide label to allow larger centered icons
        safeAreaInsets: { bottom: 0 },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: itemPaddingTop,
          paddingBottom: itemPaddingBottom,
          height: barHeight,
        },

        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: barHeight,
          borderTopWidth: 0,
          overflow: 'visible', // crucial to allow the center button to float up
          backgroundColor: 'transparent',

          // shadow matching header
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
          elevation: 10,
        },

        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]}>
            {/* Top accent line — mirrors header's bottom accent */}
            <LinearGradient
              colors={['transparent', 'rgba(47, 214, 96, 0.2)', 'transparent']}
              style={styles.navAccentLine}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Layout
                size={26}
                color={color}
                strokeWidth={focused ? 2.3 : 1.8}
              />
              {focused && <View style={styles.iconGlow} />}
            </View>
          )
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.createButtonContainer}>
              <LinearGradient
                colors={[colors.primary, '#10b981']}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <LucideIcons.Plus size={30} color="#ffffff" strokeWidth={2.5} />
              </LinearGradient>
            </View>
          )
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            DeviceEventEmitter.emit('open-create-deadline');
          }
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, focused }) => {
            const initial = user?.name?.charAt(0).toUpperCase() || 'U';
            return (
              <View style={styles.iconWrapper}>
                <View style={[
                  styles.avatarContainer,
                  focused ? styles.avatarContainerActive : styles.avatarContainerInactive
                ]}>
                  <Text style={[
                    styles.avatarText,
                    focused ? styles.avatarTextActive : styles.avatarTextInactive
                  ]}>
                    {initial}
                  </Text>
                </View>
              </View>
            );
          }
        }}
      />
    </Tabs>
  );
}

const getStyles = () => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  navAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 32,
    width: 32,
  },
  iconGlow: {
    position: 'absolute',
    bottom: -8,
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
    opacity: 0.6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonContainer: {
    position: 'absolute',
    top: -24, // floats above the tab bar line
    width: 58,
    height: 58,
    borderRadius: 29,
    // strong outer green shadow/glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  createButtonGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainerInactive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainerActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  avatarTextInactive: {
    color: colors.textSecondary,
  },
  avatarTextActive: {
    color: '#ffffff',
  },
});