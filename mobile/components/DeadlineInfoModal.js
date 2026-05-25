/* eslint-disable import/namespace */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LucideIcons from 'lucide-react-native';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import colors from '../constants/colors';
import { useTranslation } from '../context/LanguageProvider';
import { useAuth } from '../context/AuthProvider';
import BottomSheet from './BottomSheet';

const DeadlineInfoModal = ({ isOpen, onClose, deadline, onEdit }) => {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const dateLocale = locale === 'ru' ? ru : enUS;

  // Helper to get status color
  const getStatusColor = (dl) => {
    if (!dl) {
      return {
        bg: 'transparent',
        text: '#ffffff',
        border: 'transparent',
        badgeBg: 'transparent',
        badgeText: '#ffffff',
      };
    }
    const now = new Date();
    const due = new Date(dl.ts_due);
    const diff = (due - now) / (1000 * 60 * 60 * 24);

    if (diff < 0) {
      return {
        bg: 'rgba(239, 68, 68, 0.1)', // red
        text: '#f87171',
        border: 'rgba(239, 68, 68, 0.2)',
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        badgeText: '#f87171',
      };
    }
    if (diff < 3) {
      return {
        bg: 'rgba(245, 158, 11, 0.1)', // amber
        text: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.2)',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeText: '#fbbf24',
      };
    }
    return {
      bg: 'rgba(47, 214, 96, 0.05)', // jungle/normal
      text: '#2fd660',
      border: 'rgba(47, 214, 96, 0.15)',
      badgeBg: 'rgba(47, 214, 96, 0.1)',
      badgeText: '#2fd660',
    };
  };

  const statusStyles = getStatusColor(deadline);
  const iconName = deadline?.icon || deadline?.subject?.icon;
  const IconComponent = iconName && LucideIcons[iconName] ? LucideIcons[iconName] : LucideIcons.Calendar;

  // Calculate progress
  const start = deadline ? new Date(deadline.ts_from || new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)).getTime() : 0;
  const end = deadline ? new Date(deadline.ts_due).getTime() : 0;
  const now = new Date().getTime();
  const total = end - start;
  const elapsed = now - start;
  const progress = total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0;

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error("Failed to open URL", err));
    }
  };

  // Check if editable
  const isEditable = deadline && (user?.role !== 'user' || deadline.user_id);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {deadline ? (
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        {/* Header Title & Close Button */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('deadlineInfoModal.title')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <LucideIcons.X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.scrollContent}>
          {/* Profile/Subject Header Section */}
          <View style={styles.mainInfo}>
            <View style={[
              styles.iconWrapper, 
              { backgroundColor: statusStyles.bg, borderColor: statusStyles.border }
            ]}>
              <IconComponent size={28} color={statusStyles.text} />
            </View>
            <View style={styles.subjectAndName}>
              <View style={[styles.badge, { backgroundColor: statusStyles.badgeBg }]}>
                <Text style={[styles.badgeText, { color: statusStyles.badgeText }]}>
                  {deadline.subject?.name || t('deadlineInfoModal.personal')}
                </Text>
              </View>
              <Text style={styles.deadlineName}>{deadline.name}</Text>
            </View>
          </View>

          {/* Date & Time Grid */}
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.gridHeader}>
                <LucideIcons.Calendar size={14} color="#94a3b8" style={{ marginRight: 6 }} />
                <Text style={styles.gridLabel}>{t('deadlineInfoModal.dueDate')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {format(new Date(deadline.ts_due), 'MMM d, yyyy', { locale: dateLocale })}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.gridHeader}>
                <LucideIcons.Clock size={14} color="#94a3b8" style={{ marginRight: 6 }} />
                <Text style={styles.gridLabel}>{t('deadlineInfoModal.dueTime')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {format(new Date(deadline.ts_due), 'HH:mm')}
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>{t('deadlineInfoModal.progress')}</Text>
              <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor: statusStyles.text,
                }
              ]} />
            </View>
          </View>

          {/* Links Section */}
          <View style={styles.linksContainer}>
            {/* SDO Link */}
            {!!deadline.sdo_link && (
              <TouchableOpacity
                style={[styles.linkCard, styles.sdoLinkCard]}
                onPress={() => handleOpenLink(deadline.sdo_link)}
              >
                <Text style={styles.sdoLinkText}>{t('deadlineInfoModal.openInSdo')}</Text>
                <LucideIcons.ExternalLink size={18} color="#2fd660" />
              </TouchableOpacity>
            )}

            {/* PolyVSP Link */}
            {!!deadline.subject?.pvsp_link && (
              <TouchableOpacity
                style={[styles.linkCard, styles.vspLinkCard]}
                onPress={() => handleOpenLink(deadline.subject.pvsp_link)}
              >
                <Text style={styles.vspLinkText}>{t('deadlineInfoModal.openInPolyVSP')}</Text>
                <LucideIcons.ExternalLink size={18} color="#3b82f6" />
              </TouchableOpacity>
            )}

            {/* PPhis Link */}
            {!!deadline.subject?.pphis_link && (
              <TouchableOpacity
                style={[styles.linkCard, styles.phisLinkCard]}
                onPress={() => handleOpenLink(deadline.subject.pphis_link)}
              >
                <Text style={styles.phisLinkText}>{t('deadlineInfoModal.openInPPhis')}</Text>
                <LucideIcons.ExternalLink size={18} color="#a855f7" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Footer */}
        <View style={styles.footer}>
          {isEditable && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <LucideIcons.Edit2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.editButtonText}>{t('deadlineInfoModal.edit')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('deadlineInfoModal.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subjectAndName: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deadlineName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 26,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  linksContainer: {
    gap: 10,
    marginBottom: 16,
  },
  linkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sdoLinkCard: {
    backgroundColor: 'rgba(47, 214, 96, 0.03)',
    borderColor: 'rgba(47, 214, 96, 0.1)',
  },
  sdoLinkText: {
    color: '#2fd660',
    fontWeight: '700',
    fontSize: 14,
  },
  vspLinkCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  vspLinkText: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 14,
  },
  phisLinkCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.03)',
    borderColor: 'rgba(168, 85, 247, 0.1)',
  },
  phisLinkText: {
    color: '#c084fc',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  closeButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default DeadlineInfoModal;
