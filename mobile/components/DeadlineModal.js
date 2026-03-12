import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from "../context/AuthProvider"
import AppInput from './AppInput';
import AppButton from './AppButton';
import colors from '../constants/colors';
import api from '../services/api';

const DeadlineModal = ({ isOpen, onClose, onSuccess, deadline = null }) => {
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ts_from: '',
    ts_due: '',
    subject_id: '',
    icon: '',
    sdo_link: '',
    is_personal: true
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isEditMode = !!deadline;

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();

      if (deadline) {
        // For editing, we keep the values as they come from the backend
        // The backend already provides them in DD.MM.YYYY HH:mm format based on web implementation
        setFormData({
          name: deadline.name,
          ts_from: deadline.ts_from,
          ts_due: deadline.ts_due,
          subject_id: deadline.subject_id || '',
          icon: deadline.icon || '',
          sdo_link: deadline.sdo_link || '',
          is_personal: !deadline.group_id // If no group ID, it's personal
        });
      } else {
        // Reset form for create
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          name: '',
          ts_from: format(now, 'dd.MM.yyyy HH:mm'),
          ts_due: format(tomorrow, 'dd.MM.yyyy HH:mm'),
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
      alert('Failed to delete deadline');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Convert from DD.MM.YYYY HH:mm to ISO string for backend?
      // But note: the web version sends DD.MM.YYYY HH:mm directly to the backend.
      // We'll assume the backend expects the same format.
      const payload = {
        ...formData,
        subject_id: formData.subject_id ? parseInt(formData.subject_id) : 0,
        // If user is not admin, force personal
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
      alert('Failed to save deadline');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
    >
      <View style={[styles.backdrop, {backgroundColor: 'rgba(0,0,0,0.5)'}]} >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Deadline' : 'Create Deadline'}
              </Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                <AntDesign name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Admin controls for personal/group toggle */}
              {isAdmin && !isEditMode && (
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Type:</Text>
                  <View style={styles.toggleRow}>
                    <Text style={formData.is_personal ? styles.toggleActive : styles.toggleInactive} onPress={() => handleChange('is_personal', true)}>
                      Personal
                    </Text>
                    <Text style={!formData.is_personal ? styles.toggleActive : styles.toggleInactive} onPress={() => handleChange('is_personal', false)}>
                      Group
                    </Text>
                  </View>
                </View>
              )}

              <AppInput
                label="Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Enter deadline name"
              />

              {/* Date and Time Inputs */}
              <AppInput
                label="Start"
                value={formData.ts_from}
                onChangeText={(text) => handleChange('ts_from', text)}
                placeholder="dd.mm.yyyy HH:MM"
              />
              <AppInput
                label="Due"
                value={formData.ts_due}
                onChangeText={(text) => handleChange('ts_due', text)}
                placeholder="dd.mm.yyyy HH:MM"
              />

              <AppInput
                label="Subject ID"
                value={formData.subject_id}
                onChangeText={(text) => handleChange('subject_id', text)}
                placeholder="Enter subject ID"
              />

              {/* <AppInput
                label="Icon"
                value={formData.icon}
                onChangeText={(text) => handleChange('icon', text)}
                placeholder="Enter icon name (e.g., calendar)"
              />

              <AppInput
                label="Link"
                value={formData.sdo_link}
                onChangeText={(text) => handleChange('sdo_link', text)}
                placeholder="Enter link"
              /> */}

              {/* Buttons */}
              <View style={styles.buttonRow}>
                {isEditMode && (
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <Modal transparent={true} visible={isDeleteConfirmOpen} animationType="fade">
          <View style={[styles.backdrop, {backgroundColor: 'rgba(0,0,0,0.5)'}]} >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Delete</Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsDeleteConfirmOpen(false)}>
                    <AntDesign name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.deleteMessage}>
                    Are you sure you want to delete "{formData.name}"?
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDeleteConfirmOpen(false)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
                      <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    gap: 16,
  },
  toggleContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleActive: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    marginRight: 8,
  },
  toggleInactive: {
    fontSize: 16,
    color: colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default DeadlineModal;