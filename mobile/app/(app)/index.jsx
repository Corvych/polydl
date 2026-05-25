import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  DeviceEventEmitter,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LucideIcons from 'lucide-react-native';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import DeadlineCard from '../../components/DeadlineCard';
import DeadlineModal from '../../components/DeadlineModal';
import DeadlineInfoModal from '../../components/DeadlineInfoModal';
import colors from '../../constants/colors';
import api from '../../services/api';
import { useTranslation } from '../../context/LanguageProvider';
import { useAuth } from '../../context/AuthProvider';
import { useWebSocket } from '../../context/WebSocketContext';

const DashboardScreen = () => {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const insets = useSafeAreaInsets();
  const dateLocale = locale === 'ru' ? ruLocale : enUS;
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [expiredExpanded, setExpiredExpanded] = useState(true);

  // Header entrance animation
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerFadeAnim, headerSlideAnim]);

  // Update "now" every 10 seconds to keep expired list fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch deadlines on mount and when refreshing
  useEffect(() => {
    fetchDeadlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for create button tab press from layout navbar
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('open-create-deadline', () => {
      handleCreateDeadline();
    });
    return () => sub.remove();
  }, []);

  const fetchDeadlines = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/deadlines');
      setDeadlines(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch deadlines', err);
      setError(t('dashboard.failedLoad'));
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'REFRESH_DEADLINES') {
      fetchDeadlines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  const activeDeadlines = deadlines.filter(d => !d.is_completed && new Date(d.ts_due) >= now);
  const expiredDeadlines = deadlines.filter(d => !d.is_completed && new Date(d.ts_due) < now);
  const completedDeadlines = deadlines.filter(d => d.is_completed).sort((a, b) => new Date(b.ts_due) - new Date(a.ts_due));

  const handleComplete = async (deadline) => {
    const originalDeadlines = [...deadlines];
    try {
      const newIsCompleted = !deadline.is_completed;

      setDeadlines(prev => prev.map(d => d.id === deadline.id ? { ...d, is_completed: newIsCompleted } : d));

      await api.put(`/deadlines/${deadline.id}`, { is_completed: newIsCompleted });
    } catch (err) {
      console.error('Failed to toggle completion', err);
      // Revert on failure
      setDeadlines(originalDeadlines);
    }
  };

  const handleCreateDeadline = () => {
    setSelectedDeadline(null);
    setIsEditModalOpen(true);
  };

  const handleViewDeadline = (deadline) => {
    setSelectedDeadline(deadline);
    setIsInfoModalOpen(true);
  };

  const handleEditFromInfo = () => {
    setIsInfoModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchDeadlines();
    setIsEditModalOpen(false);
    setSelectedDeadline(null);
  };

  const getDeadlineUrgency = (deadline) => {
    if (deadline.is_completed) return 'completed';
    if (expiredDeadlines.some(d => d.id === deadline.id)) return 'expired';

    const due = new Date(deadline.ts_due);
    const diffHours = (due - now) / (1000 * 60 * 60); // Hours diff

    if (diffHours < 24) return 'critical'; // < 1 day
    if (diffHours < 168) return 'warning'; // < 1 week (7 days * 24 hours)
    return 'normal'; // > 1 week
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorBox}>
          <View style={styles.errorIconCircle}>
            <LucideIcons.WifiOff size={28} color="#f87171" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDeadlines} activeOpacity={0.8}>
            <LucideIcons.RefreshCw size={16} color="#ffffff" />
            <Text style={styles.retryButtonText}>{t('dashboard.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 12, opacity: headerFadeAnim, transform: [{ translateY: headerSlideAnim }] }
      ]}>
        {/* Gradient background glow */}
        <LinearGradient
          colors={['rgba(47, 214, 96, 0.08)', 'rgba(47, 214, 96, 0.03)', 'transparent']}
          style={styles.headerGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Top row: Greeting + Date */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            {/* Avatar circle */}
            <View style={styles.headerAvatar}>
              <LinearGradient
                colors={[colors.primary, '#22c55e']}
                style={styles.headerAvatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.headerAvatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.headerGreeting}>
              <Text style={styles.headerGreetingText}>
                {user?.name
                  ? t('dashboard.greeting', { name: user.name })
                  : t('dashboard.greetingFallback')}
              </Text>
              <Text style={styles.headerDateText}>
                {format(now, 'EEEE, d MMMM', { locale: dateLocale })}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.headerStatsRow}>
          {/* Active */}
          <View style={[styles.statChip, styles.statChipActive]}>
            <LucideIcons.Zap size={12} color={colors.primary} />
            <Text style={[styles.statChipNumber, { color: colors.primary }]}>
              {activeDeadlines.length}
            </Text>
            <Text style={styles.statChipLabel} numberOfLines={1}>{t('dashboard.active')}</Text>
          </View>

          {/* Overdue */}
          <View style={[styles.statChip, styles.statChipOverdue]}>
            <LucideIcons.AlertTriangle size={12} color="#f87171" />
            <Text style={[styles.statChipNumber, { color: '#f87171' }]}>
              {expiredDeadlines.length}
            </Text>
            <Text style={styles.statChipLabel} numberOfLines={1}>{t('dashboard.overdue')}</Text>
          </View>

          {/* Done */}
          <View style={[styles.statChip, styles.statChipDone]}>
            <LucideIcons.CheckCircle size={12} color="#60a5fa" />
            <Text style={[styles.statChipNumber, { color: '#60a5fa' }]}>
              {completedDeadlines.length}
            </Text>
            <Text style={styles.statChipLabel} numberOfLines={1}>{t('dashboard.done')}</Text>
          </View>
        </View>

        {/* Bottom accent line */}
        <LinearGradient
          colors={['transparent', 'rgba(47, 214, 96, 0.25)', 'transparent']}
          style={styles.headerAccentLine}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Refresh Control */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDeadlines}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Deadlines Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setUpcomingExpanded(prev => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconDot, styles.sectionIconDotActive]}>
                <LucideIcons.Zap size={14} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{t('dashboard.upcoming')}</Text>
              <View style={[styles.badge, styles.badgeActive]}>
                <Text style={styles.badgeText}>{activeDeadlines.length}</Text>
              </View>
            </View>
            <LucideIcons.ChevronDown
              size={18}
              color={colors.textSecondary}
              style={{ transform: [{ rotate: upcomingExpanded ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {upcomingExpanded && (
            <View style={styles.deadlinesGrid}>
              {activeDeadlines.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={['rgba(47, 214, 96, 0.06)', 'transparent']}
                    style={styles.emptyGlow}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  />
                  <View style={styles.emptyIconCircle}>
                    <LucideIcons.CalendarPlus size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyText}>{t('dashboard.noUpcoming')}</Text>
                  <Text style={styles.emptySubtext}>{t('dashboard.createFirst')}</Text>
                  <TouchableOpacity style={styles.emptyCreateBtn} onPress={handleCreateDeadline} activeOpacity={0.8}>
                    <LucideIcons.Plus size={16} color="#ffffff" />
                    <Text style={styles.emptyCreateBtnText}>{t('deadlineModal.createBtn')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activeDeadlines.map((deadline) => (
                  <DeadlineCard
                    key={`active_${deadline.id}`}
                    deadline={deadline}
                    onComplete={() => handleComplete(deadline)}
                    onPress={() => handleViewDeadline(deadline)}
                    expired={false}
                    urgency={getDeadlineUrgency(deadline)}
                  />
                ))
              )}
            </View>
          )}
        </View>

        {/* Expired Deadlines Section */}
        {expiredDeadlines.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpiredExpanded(prev => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIconDot, styles.sectionIconDotExpired]}>
                  <LucideIcons.AlertTriangle size={14} color="#f87171" />
                </View>
                <Text style={styles.sectionTitle}>{t('dashboard.expired')}</Text>
                <View style={[styles.badge, styles.badgeExpired]}>
                  <Text style={[styles.badgeText, { color: '#fca5a5' }]}>{expiredDeadlines.length}</Text>
                </View>
              </View>
              <LucideIcons.ChevronDown
                size={18}
                color={colors.textSecondary}
                style={{ transform: [{ rotate: expiredExpanded ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {expiredExpanded && (
              <View style={styles.deadlinesGrid}>
                {expiredDeadlines.map((deadline) => (
                  <DeadlineCard
                    key={`expired_${deadline.id}`}
                    deadline={deadline}
                    onComplete={() => handleComplete(deadline)}
                    onPress={() => handleViewDeadline(deadline)}
                    expired={true}
                    urgency="expired"
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Completed Deadlines Section (Collapsible) */}
        {completedDeadlines.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setCompletedExpanded(prev => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIconDot, styles.sectionIconDotDone]}>
                  <LucideIcons.CheckCircle size={14} color="#60a5fa" />
                </View>
                <Text style={styles.sectionTitle}>{t('dashboard.completed')}</Text>
                <View style={[styles.badge, styles.badgeDone]}>
                  <Text style={[styles.badgeText, { color: '#93c5fd' }]}>{completedDeadlines.length}</Text>
                </View>
              </View>
              <LucideIcons.ChevronDown
                size={18}
                color={colors.textSecondary}
                style={{ transform: [{ rotate: completedExpanded ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {completedExpanded && (
              <View style={styles.deadlinesGrid}>
                {completedDeadlines.map((deadline) => (
                  <DeadlineCard
                    key={`completed_${deadline.id}`}
                    deadline={deadline}
                    onComplete={() => handleComplete(deadline)}
                    onPress={() => handleViewDeadline(deadline)}
                    expired={false}
                    urgency="completed"
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Deadline Info Modal */}
      <DeadlineInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          if (!isEditModalOpen) {
            setSelectedDeadline(null);
          }
        }}
        deadline={selectedDeadline}
        onEdit={handleEditFromInfo}
      />

      {/* Deadline Edit/Create Modal */}
      <DeadlineModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDeadline(null);
        }}
        onSuccess={handleModalSuccess}
        deadline={selectedDeadline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  errorBox: {
    backgroundColor: colors.surfaceElevated,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.12)',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  headerGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 14,
    // Outer glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  headerAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerGreeting: {
    flex: 1,
  },
  headerGreetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerDateText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statChipActive: {
    backgroundColor: 'rgba(47, 214, 96, 0.06)',
    borderColor: 'rgba(47, 214, 96, 0.15)',
  },
  statChipOverdue: {
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
    borderColor: 'rgba(248, 113, 113, 0.15)',
  },
  statChipDone: {
    backgroundColor: 'rgba(96, 165, 250, 0.06)',
    borderColor: 'rgba(96, 165, 250, 0.15)',
  },
  statChipNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  headerAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconDot: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconDotActive: {
    backgroundColor: 'rgba(47, 214, 96, 0.12)',
  },
  sectionIconDotExpired: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  sectionIconDotDone: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 26,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(47, 214, 96, 0.12)',
  },
  badgeExpired: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  badgeDone: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  deadlinesGrid: {
    gap: 0,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
    position: 'relative',
  },
  emptyGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(47, 214, 96, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 96, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyCreateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DashboardScreen;