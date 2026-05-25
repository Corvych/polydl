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

const SubjectSelector = ({ subjects, value, onChange, label, placeholder }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSubject = subjects.find(s => s.id === parseInt(value));

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.shortname && s.shortname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (id) => {
    onChange('subject_id', id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getSubjectIcon = (iconName) => {
    const IconComponent = iconName && LucideIcons[iconName] ? LucideIcons[iconName] : LucideIcons.BookOpen;
    return IconComponent;
  };

  const SelectedIcon = selectedSubject ? getSubjectIcon(selectedSubject.icon) : LucideIcons.BookOpen;

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
          <SelectedIcon 
            size={18} 
            color={selectedSubject ? colors.primary : '#64748b'} 
            style={{ marginRight: 10 }} 
          />
          <Text style={[styles.triggerText, !selectedSubject && styles.placeholderText]} numberOfLines={1}>
            {selectedSubject ? selectedSubject.name : (placeholder || t('components.subjectSelector.placeholder'))}
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
            <Text style={styles.modalTitle}>{t('components.subjectSelector.placeholder')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => { setIsOpen(false); setSearchQuery(''); }}>
              <LucideIcons.X size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <LucideIcons.Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('components.subjectSelector.searchPlaceholder')}
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

          {/* List */}
          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={() => (
              <TouchableOpacity
                style={[styles.itemRow, !value && styles.itemRowSelected]}
                onPress={() => handleSelect('')}
                activeOpacity={0.6}
              >
                <View style={styles.itemLeft}>
                  <LucideIcons.BookOpen size={18} color={!value ? colors.primary : '#64748b'} style={{ marginRight: 12 }} />
                  <Text style={[styles.itemText, !value && styles.itemTextSelected]}>
                    {t('deadlineModal.noSubject')}
                  </Text>
                </View>
                {!value && <LucideIcons.Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            )}
            renderItem={({ item }) => {
              const ItemIcon = getSubjectIcon(item.icon);
              const isSelected = parseInt(value) === item.id;
              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.itemLeft}>
                    <ItemIcon size={18} color={isSelected ? colors.primary : '#64748b'} style={{ marginRight: 12 }} />
                    <View style={styles.subjectDetails}>
                      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.shortname && (
                        <Text style={styles.shortnameText}>{item.shortname}</Text>
                      )}
                    </View>
                  </View>
                  {isSelected && <LucideIcons.Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              searchQuery.length > 0 ? (
                <View style={styles.emptyContainer}>
                  <LucideIcons.Inbox size={48} color="#334155" />
                  <Text style={styles.emptyText}>{t('components.subjectSelector.noResults')}</Text>
                </View>
              ) : null
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
    borderColor: 'rgba(47, 214, 96, 0.3)',
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triggerText: {
    color: '#ffffff',
    fontSize: 15,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  itemRowSelected: {
    borderColor: 'rgba(47, 214, 96, 0.1)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  subjectDetails: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  itemTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  shortnameText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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

export default SubjectSelector;
