/* eslint-disable import/namespace */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import * as LucideIcons from "lucide-react-native";
import { useTranslation } from "../context/LanguageProvider";

export default function DeadlineCard({
  deadline,
  onComplete,
  onPress,
  expired = false,
  urgency = 'normal',
}) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === 'ru' ? ru : enUS;

  // Calculate progress (same as web)
  const start = new Date(deadline.ts_from || new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)).getTime();
  const end = new Date(deadline.ts_due).getTime();
  const now = new Date().getTime();
  const total = end - start;
  const elapsed = now - start;
  const progress = total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0;

  const isAnimatingRef = useRef(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Animation values
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(progress)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Pulse animation for warning/critical cards (matches web's soft-pulse)
  const shouldPulse = (urgency === 'critical' || urgency === 'warning') && !deadline.is_completed;
  const isCritical = urgency === 'critical';
  const pulseAnim = useRef(new Animated.Value(isCritical ? 0.4 : 0.3)).current;

  useEffect(() => {
    if (!isAnimatingRef.current) {
      progressAnim.setValue(progress);
    }
  }, [progress, progressAnim]);

  useEffect(() => {
    if (shouldPulse) {
      const lo = isCritical ? 0.4 : 0.3;
      const hi = isCritical ? 0.9 : 0.7;
      const speed = isCritical ? 800 : 1000;
      pulseAnim.setValue(lo);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: hi,
            duration: speed,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: lo,
            duration: speed,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [shouldPulse, isCritical, pulseAnim]);

  const handleCompleteClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (deadline.is_completed) {
      onComplete();
      return;
    }

    setIsAnimating(true);
    isAnimatingRef.current = true;

    // Reset animation components
    contentOpacity.setValue(1);
    if (e) {
      translateX.setValue(0);
    }
    progressAnim.setValue(progress);
    successScale.setValue(0);
    successOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 450,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(50),
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            tension: 60,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      onComplete();
      
      // Delay reset just slightly to match item transitions
      setTimeout(() => {
        setIsAnimating(false);
        isAnimatingRef.current = false;
        contentOpacity.setValue(1);
        translateX.setValue(0);
        progressAnim.setValue(progress);
        successScale.setValue(0);
        successOpacity.setValue(0);
      }, 150);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (deadline.is_completed || isAnimating) return false;
        // Claim touch if dragging horizontally to the right
        return (
          Math.abs(gestureState.dx) > 10 &&
          gestureState.dx > 0 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          handleCompleteClick(null);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 5,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const getCardStyles = () => {
    if (isAnimating) {
      return {
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.25)',
        progressBg: 'rgba(16, 185, 129, 0.15)',
        glowColor: 'rgba(16, 185, 129, 0.35)',
        textColor: '#34d399',
        isExpired: false,
      };
    }

    if (expired) {
      return {
        bg: 'rgba(31, 41, 55, 0.1)', // bg-gray-800/20 or surface
        border: 'rgba(75, 85, 99, 0.3)', // border-gray-800
        progressBg: 'rgba(156, 163, 175, 0.1)', // bg-gray-400
        glowColor: 'rgba(156, 163, 175, 0.15)', // from-gray-400
        textColor: '#9ca3af', // text-gray-400
        isExpired: true,
      };
    }

    if (deadline.is_completed) {
      return {
        bg: 'rgba(75, 85, 99, 0.1)',
        border: 'rgba(75, 85, 99, 0.2)',
        progressBg: 'rgba(107, 114, 128, 0.15)',
        glowColor: 'rgba(107, 114, 128, 0.1)',
        textColor: '#9ca3af',
        isExpired: true,
      };
    }

    // Critical (< 1 day) — Red, intense pulse
    if (urgency === 'critical') {
      return {
        bg: 'rgba(239, 68, 68, 0.06)',
        border: 'rgba(239, 68, 68, 0.2)',
        progressBg: 'rgba(239, 68, 68, 0.12)',
        glowColor: 'rgba(239, 68, 68, 0.35)',
        textColor: '#f87171',
        isExpired: false,
      };
    }

    // Warning (< 1 week) — Amber pulse
    if (urgency === 'warning') {
      return {
        bg: 'rgba(245, 158, 11, 0.05)',
        border: 'rgba(245, 158, 11, 0.15)',
        progressBg: 'rgba(245, 158, 11, 0.1)',
        glowColor: 'rgba(245, 158, 11, 0.25)',
        textColor: '#fbbf24',
        isExpired: false,
      };
    }

    // Normal (default)
    return {
      bg: 'rgba(31, 41, 55, 0.15)', // bg-gray-800/40
      border: 'rgba(75, 85, 99, 0.2)', // border-gray-700/50
      progressBg: 'rgba(47, 214, 96, 0.08)', // bg-jungle-500
      glowColor: 'rgba(47, 214, 96, 0.15)', // from-jungle-500
      textColor: '#cbd5e1', // text-gray-300
      isExpired: false,
    };
  };

  const cardStyles = getCardStyles();

  // Get dynamic icon or Calendar icon fallback
  const renderIcon = () => {
    const iconName = deadline.icon || deadline.subject?.icon;
    if (iconName && LucideIcons[iconName]) {
      const IconComponent = LucideIcons[iconName];
      return <IconComponent size={15} color={cardStyles.textColor} style={{ marginRight: 6 }} />;
    }
    return <LucideIcons.Calendar size={15} color={cardStyles.textColor} style={{ marginRight: 6 }} />;
  };

  const getNameStyle = () => {
    if (deadline.is_completed) {
      return {
        textDecorationLine: 'line-through',
        color: '#6b7280',
      };
    }
    if (expired) {
      return {
        color: '#6b7280',
      };
    }
    return {
      color: '#ffffff',
    };
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Swipe Background (revealed when dragging right) */}
      {!deadline.is_completed && (
        <Animated.View
          style={[
            styles.swipeBackground,
            {
              opacity: translateX.interpolate({
                inputRange: [0, 60],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            }
          ]}
        >
          <View style={styles.swipeIconWrapper}>
            <LucideIcons.Check size={24} color="#ffffff" />
          </View>
        </Animated.View>
      )}

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: cardStyles.bg, borderColor: cardStyles.border }]}
          onPress={!isAnimating ? onPress : undefined}
          disabled={isAnimating}
          activeOpacity={0.8}
        >
          {/* Progress Bar Background */}
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: cardStyles.progressBg,
              }
            ]}
          />

          {/* Bottom Glow Accent (pulses on warning/critical) */}
          {!cardStyles.isExpired && (
            <Animated.View style={[styles.glow, { opacity: pulseAnim }]}>
              <LinearGradient
                colors={[cardStyles.glowColor, 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {/* Success Tick Overlay */}
          {isAnimating && (
            <Animated.View
              style={[
                styles.successOverlay,
                {
                  opacity: successOpacity,
                  transform: [{ scale: successScale }],
                }
              ]}
            >
              <View style={styles.successCircle}>
                <LucideIcons.Check size={36} color="#10b981" />
              </View>
            </Animated.View>
          )}

          {/* Content Container */}
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            {/* Line 1: Subject / Personal */}
            <View style={styles.header}>
              <Text style={[styles.subject, { color: cardStyles.isExpired ? '#4b5563' : '#94a3b8' }]}>
                {deadline.subject?.name || t("deadlineCard.personal")}
              </Text>
              {deadline.is_completed && (
                <LucideIcons.Check size={16} color="#10b981" />
              )}
            </View>

            {/* Line 2: Name */}
            <Text
              style={[
                styles.name,
                getNameStyle(),
              ]}
              numberOfLines={2}
            >
              {deadline.name}
            </Text>

            {/* Line 3: Date & Action */}
            <View style={styles.footer}>
              <View style={styles.dateContainer}>
                {renderIcon()}
                <Text style={[styles.dateText, { color: cardStyles.textColor }]}>
                  {format(new Date(deadline.ts_due), "MMM d, HH:mm", { locale: dateLocale })}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  deadline.is_completed ? styles.completedButton : styles.todoButton
                ]}
                onPress={handleCompleteClick}
                disabled={isAnimating}
                activeOpacity={0.7}
              >
                {deadline.is_completed ? (
                  <LucideIcons.History
                    size={14}
                    color="#9ca3af"
                    style={{ marginRight: 5 }}
                  />
                ) : (
                  <LucideIcons.Check
                    size={14}
                    color="#cbd5e1"
                    style={{ marginRight: 5 }}
                  />
                )}
                <Text
                  style={[
                    styles.buttonText,
                    deadline.is_completed ? styles.completedButtonText : styles.todoButtonText
                  ]}
                >
                  {deadline.is_completed ? t("deadlineCard.undo") : t("deadlineCard.done")}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    borderRadius: 16,
    justifyContent: 'center',
    paddingLeft: 24,
    zIndex: 0,
  },
  swipeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  glow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
  },
  content: {
    padding: 20,
    zIndex: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subject: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 26,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 'auto',
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0,
  },
  todoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  completedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  todoButtonText: {
    color: '#cbd5e1',
  },
  completedButtonText: {
    color: '#9ca3af',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
