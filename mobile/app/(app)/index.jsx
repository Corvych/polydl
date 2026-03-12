import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { format } from 'date-fns';
import { AntDesign } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import DeadlineCard from '../../components/DeadlineCard';
import FloatingButton from '../../components/FloatingButton';
import colors from '../../constants/colors';
import api from '../../services/api';

const DashboardScreen = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update "now" every 10 seconds to keep expired list fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch deadlines on mount and when refreshing
  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/deadlines');
      setDeadlines(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch deadlines', err);
      setError('Failed to load deadlines');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const activeDeadlines = deadlines.filter(d => !d.is_completed && new Date(d.ts_due) >= now);
  const expiredDeadlines = deadlines.filter(d => !d.is_completed && new Date(d.ts_due) < now);
  const completedDeadlines = deadlines.filter(d => d.is_completed).sort((a, b) => new Date(b.ts_due) - new Date(a.ts_due));

  const handleComplete = async (deadline) => {
    try {
      const originalDeadlines = [...deadlines];
      const newIsCompleted = !deadline.is_completed;

      setDeadlines(prev => prev.map(d => d.id === deadline.id ? { ...d, is_completed: newIsCompleted } : d));

      await api.put(`/deadlines/${deadline.id}`, { is_completed: newIsCompleted });
    } catch (err) {
      console.error('Failed to toggle completion', err);
      // Revert on failure
      setDeadlines(originalDeadlines);
    }
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
          <Text style={styles.errorText}>{error}</Text>
          <AppButton
            title="Retry"
            onPress={fetchDeadlines}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Your deadlines and tasks</Text>
      </View>

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
      >
        {/* Upcoming Deadlines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeDeadlines.length}</Text>
            </View>
          </View>

          <View style={styles.deadlinesGrid}>
            {activeDeadlines.length === 0 ? (
              <View style={styles.emptyState}>
                <AntDesign name="calendar" size={40} color={colors.gray} />
                <Text style={styles.emptyText}>No upcoming deadlines</Text>
                <Text style={styles.emptySubtext}>Create your first deadline to get started</Text>
              </View>
            ) : (
              activeDeadlines.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  deadline={deadline}
                  onComplete={() => handleComplete(deadline)}
                  expired={false}
                  urgency={getDeadlineUrgency(deadline)}
                />
              ))
            )}
          </View>
        </View>

        {/* Expired Deadlines Section */}
        {expiredDeadlines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expired Deadlines</Text>
              <View style={[styles.badge, styles.expiredBadge]}>
                <Text style={styles.badgeText}>{expiredDeadlines.length}</Text>
              </View>
            </View>

            <View style={styles.deadlinesGrid}>
              {expiredDeadlines.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  deadline={deadline}
                  onComplete={() => handleComplete(deadline)}
                  expired={true}
                  urgency="expired"
                />
              ))}
            </View>
          </View>
        )}

        {/* Completed Deadlines Section */}
        {completedDeadlines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed ({completedDeadlines.length})</Text>
            </View>

            <View style={styles.deadlinesGrid}>
              {completedDeadlines.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  deadline={deadline}
                  onComplete={() => handleComplete(deadline)}
                  expired={false}
                  urgency="completed"
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingButton onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    width: 120,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredBadge: {
    backgroundColor: colors.gray,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deadlinesGrid: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default DashboardScreen;