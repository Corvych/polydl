/* eslint-disable import/namespace */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import colors from '../constants/colors';
import { useTranslation } from '../context/LanguageProvider';
import BottomSheet from './BottomSheet';

// Curated list of popular academic, coding, and productivity icons
const POPULAR_ICONS = [
  'Calendar', 'BookOpen', 'Code', 'GraduationCap', 'FlaskConical', 'Calculator', 
  'Languages', 'Globe', 'History', 'Atom', 'Palette', 'Music', 
  'Dumbbell', 'Briefcase', 'FileText', 'MessageSquare', 'Layers', 'ListTodo', 
  'CheckSquare', 'Clock', 'Bell', 'AlertTriangle', 'Search', 'Settings',
  'PenTool', 'Compass', 'Users', 'Folder', 'ExternalLink', 'Clipboard',
  'Play', 'Video', 'Book', 'Award', 'Trophy', 'Heart'
];

const IconPicker = ({ label, value, onChange, placeholder }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Combine popular icons with any search matches from all Lucide keys (filtered)
  const allIconNames = Object.keys(LucideIcons).filter(
    name => name !== 'default' && typeof LucideIcons[name] === 'object' || typeof LucideIcons[name] === 'function'
  );

  const filteredIcons = searchQuery.trim() === '' 
    ? POPULAR_ICONS 
    : allIconNames
        .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 72); // Limit for performance

  const handleSelect = (name) => {
    onChange('icon', name);
    setIsOpen(false);
    setSearchQuery('');
  };

  const SelectedIcon = value && LucideIcons[value] ? LucideIcons[value] : null;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <TouchableOpacity
        style={[styles.triggerButton, isOpen && styles.triggerButtonActive]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          {SelectedIcon ? (
            <View style={styles.selectedIconWrapper}>
              <SelectedIcon size={18} color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyIconWrapper}>
              <LucideIcons.Image size={16} color="#64748b" />
            </View>
          )}
          <Text style={[styles.triggerText, !value && styles.placeholderText]} numberOfLines={1}>
            {value || placeholder || t('components.iconPicker.placeholder') || 'Select icon...'}
          </Text>
        </View>
        <LucideIcons.ChevronDown size={18} color="#64748b" />
      </TouchableOpacity>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setSearchQuery(''); }}
      >
        <View style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('components.iconPicker.title') || 'Select Icon'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => { setIsOpen(false); setSearchQuery(''); }}>
              <LucideIcons.X size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <LucideIcons.Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('components.iconPicker.search') || 'Search icons...'}
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <LucideIcons.X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Grid of Icons */}
          <FlatList
            data={filteredIcons}
            numColumns={4}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const IconComp = LucideIcons[item];
              if (!IconComp) return null;
              const isSelected = value === item;

              return (
                <TouchableOpacity
                  style={[styles.gridCell, isSelected && styles.gridCellSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.6}
                >
                  <IconComp size={24} color={isSelected ? colors.primary : '#cbd5e1'} />
                  <Text style={[styles.iconNameText, isSelected && styles.iconNameTextSelected]} numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <LucideIcons.Inbox size={48} color="#334155" />
                <Text style={styles.emptyText}>{t('components.iconPicker.noIcons') || 'No icons found'}</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginLeft: 2,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  triggerButtonActive: {
    borderColor: colors.primary,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIconWrapper: {
    marginRight: 10,
    backgroundColor: 'rgba(47, 214, 96, 0.1)',
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapper: {
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#64748b',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    height: '100%',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    margin: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridCellSelected: {
    backgroundColor: 'rgba(47, 214, 96, 0.05)',
    borderColor: colors.primary,
  },
  iconNameText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    maxWidth: 60,
    textAlign: 'center',
  },
  iconNameTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
  },
});

export default IconPicker;
