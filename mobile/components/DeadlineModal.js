import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LucideIcons from 'lucide-react-native';
import { format, parse } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../context/AuthProvider";
import { useTranslation } from "../context/LanguageProvider";
import AppInput from './AppInput';
import colors from '../constants/colors';
import api from '../services/api';
import SubjectSelector from './SubjectSelector';
import IconPicker from './IconPicker';
import BottomSheet from './BottomSheet';

const parseDateString = (str) => {
  if (!str) return new Date();
  if (typeof str === 'string' && /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/.test(str)) {
    try {
      return parse(str, 'dd.MM.yyyy HH:mm', new Date());
    } catch (_e) {
      // fallback
    }
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
};

const formatDateToString = (date) => {
  if (!date) return '';
  return format(date, 'dd.MM.yyyy HH:mm');
};

const DeadlineModal = ({ isOpen, onClose, onSuccess, deadline = null }) => {
  const { user } = useAuth(); 
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    ts_from: '',
    ts_due: '',
    subject_id: '',
    icon: '',
    sdo_link: '',
    is_personal: true
  });

  const [pickerConfig, setPickerConfig] = useState({
    show: false,
    mode: 'date',
    target: 'ts_from',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isEditMode = !!deadline;
  const dateLocale = locale === 'ru' ? ru : enUS;

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();

      if (deadline) {
        setFormData({
          name: deadline.name,
          ts_from: formatDateToString(parseDateString(deadline.ts_from)),
          ts_due: formatDateToString(parseDateString(deadline.ts_due)),
          subject_id: deadline.subject_id || '',
          icon: deadline.icon || '',
          sdo_link: deadline.sdo_link || '',
          is_personal: !deadline.group_id // If no group ID, it's personal
        });
      } else {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          name: '',
          ts_from: formatDateToString(now),
          ts_due: formatDateToString(tomorrow),
          subject_id: '',
          icon: '',
          sdo_link: '',
          is_personal: true
        });
      }
    }
  }, [isOpen, deadline]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/deadlines/${deadline.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to delete deadline", err);
      alert(t('deadlineModal.failedDelete'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert(t('errors.allFieldsRequired') || 'Deadline name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        subject_id: formData.subject_id ? parseInt(formData.subject_id) : 0,
        is_personal: isAdmin ? formData.is_personal : true
      };

      if (isEditMode) {
        await api.put(`/deadlines/${deadline.id}`, payload);
      } else {
        await api.post('/deadlines', payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save deadline", err);
      alert(t('deadlineModal.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  const showPicker = (target, mode) => {
    setPickerConfig({
      show: true,
      target,
      mode,
    });
  };

  const handlePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setPickerConfig(prev => ({ ...prev, show: false }));
      if (selectedDate) {
        handleChange(pickerConfig.target, formatDateToString(selectedDate));
      }
    } else {
      if (selectedDate) {
        handleChange(pickerConfig.target, formatDateToString(selectedDate));
      }
    }
  };


  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEditMode ? t('deadlineModal.edit') : t('deadlineModal.create')}
          </Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <LucideIcons.X size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Form Body inside ScrollView */}
        <ScrollView 
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={keyboardVisible}
        >
          {/* Admin controls for personal/group toggle */}
          {isAdmin && !isEditMode && (
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>{t('deadlineModal.type')}</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, formData.is_personal && styles.toggleBtnActive]}
                  onPress={() => handleChange('is_personal', true)}
                >
                  <Text style={[styles.toggleText, formData.is_personal && styles.toggleTextActive]}>
                    {t('deadlineModal.personal')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, !formData.is_personal && styles.toggleBtnActive]}
                  onPress={() => handleChange('is_personal', false)}
                >
                  <Text style={[styles.toggleText, !formData.is_personal && styles.toggleTextActive]}>
                    {t('deadlineModal.group')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Deadline Name */}
          <AppInput
            label={t('deadlineModal.name')}
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder={t('deadlineModal.namePlaceholder')}
          />

          {/* Start Date & Time Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('deadlineModal.start')}</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => showPicker('ts_from', 'date')}
                activeOpacity={0.7}
              >
                <LucideIcons.Calendar size={16} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={styles.pickerTriggerText}>
                  {format(parseDateString(formData.ts_from), 'MMM d, yyyy', { locale: dateLocale })}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => showPicker('ts_from', 'time')}
                activeOpacity={0.7}
              >
                <LucideIcons.Clock size={16} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={styles.pickerTriggerText}>
                  {format(parseDateString(formData.ts_from), 'HH:mm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Due Date & Time Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('deadlineModal.due')}</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => showPicker('ts_due', 'date')}
                activeOpacity={0.7}
              >
                <LucideIcons.Calendar size={16} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={styles.pickerTriggerText}>
                  {format(parseDateString(formData.ts_due), 'MMM d, yyyy', { locale: dateLocale })}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => showPicker('ts_due', 'time')}
                activeOpacity={0.7}
              >
                <LucideIcons.Clock size={16} color="#64748b" style={{ marginRight: 8 }} />
                <Text style={styles.pickerTriggerText}>
                  {format(parseDateString(formData.ts_due), 'HH:mm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Subject Selector */}
          <SubjectSelector
            subjects={subjects}
            value={formData.subject_id}
            onChange={handleChange}
            label={t('deadlineModal.subject') || t('adminSubjects.title')}
            placeholder={t('deadlineModal.noSubject')}
          />

          {/* Icon Selector & SDO Link */}
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <IconPicker
                label={t('deadlineModal.icon')}
                value={formData.icon}
                onChange={handleChange}
                placeholder={t('components.iconPicker.placeholder')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label={t('deadlineModal.link')}
                value={formData.sdo_link}
                onChangeText={(text) => handleChange('sdo_link', text)}
                placeholder={t('deadlineModal.linkPlaceholder')}
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons Row */}
        <View style={styles.buttonRow}>
          {isEditMode && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>{t('deadlineModal.delete')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.saveButton, isEditMode ? { flex: 1 } : { width: '100%' }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? t('deadlineModal.saveChanges') : t('deadlineModal.createBtn')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* iOS Datetime Picker Overlay */}
      {pickerConfig.show && Platform.OS === 'ios' && (
        <Modal 
          transparent={true} 
          animationType="fade" 
          visible={pickerConfig.show}
          onRequestClose={() => setPickerConfig(prev => ({ ...prev, show: false }))}
        >
          <TouchableOpacity 
            style={styles.pickerBackdrop} 
            activeOpacity={1} 
            onPress={() => setPickerConfig(prev => ({ ...prev, show: false }))}
          >
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setPickerConfig(prev => ({ ...prev, show: false }))}>
                  <Text style={styles.pickerDoneText}>{t('common.done') || 'Done'}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parseDateString(formData[pickerConfig.target])}
                mode={pickerConfig.mode}
                is24Hour={true}
                display="spinner"
                textColor="#ffffff"
                onChange={handlePickerChange}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Datetime Picker Trigger */}
      {pickerConfig.show && Platform.OS === 'android' && (
        <DateTimePicker
          value={parseDateString(formData[pickerConfig.target])}
          mode={pickerConfig.mode}
          is24Hour={true}
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <Modal transparent={true} visible={isDeleteConfirmOpen} animationType="fade">
          <View style={styles.confirmBackdrop}>
            <View style={styles.confirmContainer}>
              <View style={styles.confirmContent}>
                <View style={styles.confirmHeader}>
                  <Text style={styles.confirmTitle}>{t('deadlineModal.deleteConfirmTitle')}</Text>
                  <TouchableOpacity onPress={() => setIsDeleteConfirmOpen(false)}>
                    <LucideIcons.X size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.deleteMessage}>
                  {t('deadlineModal.deleteConfirmMessage', { name: formData.name })}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDeleteConfirmOpen(false)}>
                    <Text style={styles.cancelButtonText}>{t('deadlineModal.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
                    <Text style={styles.deleteConfirmButtonText}>{t('deadlineModal.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 4,
  },
  scrollBody: {
    gap: 14,
    paddingBottom: 16,
  },
  toggleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(47, 214, 96, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 96, 0.2)',
  },
  toggleText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginLeft: 2,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  pickerTriggerText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 15,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    width: '80%',
    maxWidth: 320,
  },
  confirmContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
  },
  confirmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  deleteMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 40,
    paddingTop: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerDoneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DeadlineModal;