// Reinforcers Screen - Manage reinforcers (split view with slots and drag-drop)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Reinforcer } from '../../types';

// Validation schema for add reinforcer form
const reinforcerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  imageUri: z.string().min(1, 'Image is required'),
});

type ReinforcerFormData = z.infer<typeof reinforcerSchema>;

// Maximum slots
const MAX_SLOTS = 10;

const ReinforcersScreen: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<(Reinforcer | null)[]>(
    Array(MAX_SLOTS).fill(null)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUri, setImageUri] = useState('');

  // Form
  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm<ReinforcerFormData>({
    resolver: zodResolver(reinforcerSchema),
    defaultValues: {
      name: '',
      imageUri: '',
    }
  });

  // Load reinforcers from SQLite (mock for now)
  useEffect(() => {
    // TODO: Load from database
    setReinforcers([]);
  }, []);

  // Image picker with square crop
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('errors.permission'), t('errors.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        
        // Square crop with ImageManipulator
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        setImageUri(manipResult.uri);
        setValue('imageUri', manipResult.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('errors.title'), t('errors.imagePicker'));
      setUploadingImage(false);
    }
  };

  // Add new reinforcer
  const onAddReinforcer = (data: ReinforcerFormData) => {
    const newReinforcer: Reinforcer = {
      id: `reinforcer-${Date.now()}`,
      name: data.name,
      imageUri: data.imageUri,
      slot: 0, // Not assigned to slot yet
      order: reinforcers.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setReinforcers([...reinforcers, newReinforcer]);
    setModalVisible(false);
    reset();
    setImageUri('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // TODO: Save to database
  };

  // Add reinforcer to slot
  const addToSlot = (reinforcer: Reinforcer, slotIndex: number) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = reinforcer;
    setSelectedSlots(newSlots);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Remove from slot
  const removeFromSlot = (slotIndex: number) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = null;
    setSelectedSlots(newSlots);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Delete reinforcer from library
  const deleteReinforcer = (id: string) => {
    Alert.alert(
      t('reinforcers.deleteConfirm'),
      t('reinforcers.deleteMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            setReinforcers(reinforcers.filter(r => r.id !== id));
            // Remove from slots if present
            setSelectedSlots(selectedSlots.map(s => s?.id === id ? null : s));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // TODO: Delete from database
          }
        }
      ]
    );
  };

  // Save slots configuration
  const handleSave = () => {
    const filledSlots = selectedSlots.filter(s => s !== null);
    if (filledSlots.length === 0) {
      Alert.alert(t('errors.validation'), t('reinforcers.noSlotsSelected'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('success.title'), t('reinforcers.saved'));
    // TODO: Save to database
  };

  // Render slot item
  const renderSlot = (slotIndex: number) => {
    const reinforcer = selectedSlots[slotIndex];

    return (
      <View key={slotIndex} style={styles.slotItem}>
        <View style={styles.slotNumber}>
          <Text style={styles.slotNumberText}>{slotIndex + 1}</Text>
        </View>

        {reinforcer ? (
          <>
            <Image source={{ uri: reinforcer.imageUri }} style={styles.slotImage} />
            <View style={styles.slotInfo}>
              <Text style={styles.slotName} numberOfLines={1}>
                {reinforcer.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeSlotButton}
              onPress={() => removeFromSlot(slotIndex)}
            >
              <Text style={styles.removeSlotButtonText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.emptySlotText}>{t('reinforcers.emptySlot')}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('reinforcers.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ {t('reinforcers.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Split View */}
      <View style={styles.splitView}>
        {/* Left Panel - Reinforcers Library */}
        <View style={styles.leftPanel}>
          <Text style={styles.panelTitle}>{t('reinforcers.library')}</Text>

          <ScrollView style={styles.reinforcersList}>
            {reinforcers.length === 0 ? (
              <View style={styles.emptyLibrary}>
                <Text style={styles.emptyLibraryText}>
                  {t('reinforcers.noReinforcers')}
                </Text>
              </View>
            ) : (
              reinforcers.map((reinforcer) => (
                <View key={reinforcer.id} style={styles.reinforcerItem}>
                  <Image
                    source={{ uri: reinforcer.imageUri }}
                    style={styles.reinforcerImage}
                  />
                  <View style={styles.reinforcerInfo}>
                    <Text style={styles.reinforcerName} numberOfLines={2}>
                      {reinforcer.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteReinforcer(reinforcer.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Right Panel - Slots */}
        <View style={styles.rightPanel}>
          <View style={styles.rightPanelHeader}>
            <Text style={styles.rightPanelTitle}>{t('reinforcers.slots')}</Text>
            <Text style={styles.rightPanelSubtitle}>
              {selectedSlots.filter(s => s !== null).length}/{MAX_SLOTS}
            </Text>
          </View>

          <ScrollView style={styles.slotsList}>
            {Array.from({ length: MAX_SLOTS }).map((_, index) => renderSlot(index))}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              selectedSlots.every(s => s === null) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={selectedSlots.every(s => s === null)}
          >
            <Text style={styles.saveButtonText}>{t('reinforcers.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Reinforcer Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('reinforcers.addNew')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Image Upload */}
            <TouchableOpacity
              style={styles.imageUploadContainer}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="large" color="#4285F4" />
              ) : imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.imageUploadPlaceholder}>
                  <Text style={styles.imageUploadIcon}>📷</Text>
                  <Text style={styles.imageUploadText}>{t('reinforcers.uploadImage')}</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.imageUri && (
              <Text style={styles.errorText}>{errors.imageUri.message}</Text>
            )}

            {/* Name Input */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder={t('reinforcers.namePlaceholder')}
                  placeholderTextColor="#666"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onAddReinforcer)}
            >
              <Text style={styles.submitButtonText}>{t('reinforcers.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#3D3D3D',
    backgroundColor: '#1E1E1E',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  reinforcersList: {
    flex: 1,
    padding: 12,
  },
  reinforcerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    marginBottom: 8,
  },
  reinforcerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  reinforcerInfo: {
    flex: 1,
  },
  reinforcerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  emptyLibrary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyLibraryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  rightPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rightPanelSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  slotsList: {
    flex: 1,
    padding: 12,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 70,
  },
  slotNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slotNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  slotImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  slotInfo: {
    flex: 1,
  },
  slotName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeSlotButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSlotButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emptySlotText: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#3D3D3D',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
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
    color: '#FFFFFF',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imageUploadText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  input: {
    width: '100%',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 8,
  },
  submitButton: {
    width: '100%',
    padding: 16,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ReinforcersScreen;
