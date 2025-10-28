// Skills Screen - Manage and configure skills (split view with drag-drop)

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
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
import { skillCategories, MAX_SELECTED_SKILLS } from '../../../data/skillsData.js';
import { useSkillsStore } from '../../store/skillsStore';
import type { SelectedSkill } from '../../types';

// Validation schema
const skillValidationSchema = z.object({
  waitDuration: z.number().min(1).max(60),
  skills: z.array(z.object({
    skillId: z.string(),
    order: z.number(),
    duration: z.number().min(1).max(120),
    imageUri: z.string().min(1),
  })).max(MAX_SELECTED_SKILLS),
});

type SkillFormData = z.infer<typeof skillValidationSchema>;

const SkillsScreen: React.FC = () => {
  const { t } = useTranslation();
  
  // Zustand store
  const { 
    selectedSkills, 
    waitDuration,
    addSkill, 
    removeSkill, 
    reorderSkills,
    updateSkill,
    setWaitDuration 
  } = useSkillsStore();

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingSkillId, setUploadingSkillId] = useState<string | null>(null);

  // Form validation
  const { control, handleSubmit, formState: { errors } } = useForm<SkillFormData>({
    resolver: zodResolver(skillValidationSchema),
    values: {
      waitDuration,
      skills: selectedSkills,
    }
  });

  // Filter skills by category and search
  const filteredCategories = useMemo(() => {
    return skillCategories.map(category => ({
      ...category,
      skills: category.skills.filter(skill =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(category => 
      !selectedCategory || category.id === selectedCategory
    );
  }, [searchQuery, selectedCategory]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return selectedSkills.reduce((sum, skill) => sum + skill.duration, 0);
  }, [selectedSkills]);

  // Image picker with square crop
  const pickImage = async (skillId: string) => {
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
        setUploadingSkillId(skillId);
        
        // Square crop with ImageManipulator
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        updateSkill(skillId, { imageUri: manipResult.uri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUploadingSkillId(null);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('errors.title'), t('errors.imagePicker'));
      setUploadingSkillId(null);
    }
  };

  // Add skill to selection
  const handleAddSkill = (categoryId: string, skillName: string) => {
    if (selectedSkills.length >= MAX_SELECTED_SKILLS) {
      Alert.alert(t('errors.title'), t('skills.maxSkillsReached'));
      return;
    }

    const skillId = `${categoryId}-${Date.now()}`;
    const newSkill: SelectedSkill = {
      skillId,
      order: selectedSkills.length + 1,
      duration: 5, // Default 5 minutes
      imageUri: '',
    };

    addSkill(newSkill);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Remove skill
  const handleRemoveSkill = (skillId: string) => {
    removeSkill(skillId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Save validation
  const onSave = (data: SkillFormData) => {
    // Check all skills have images
    const skillsWithoutImage = data.skills.filter(s => !s.imageUri);
    if (skillsWithoutImage.length > 0) {
      Alert.alert(t('errors.validation'), t('skills.errors.missingImages'));
      return;
    }

    // Check total duration
    const total = data.skills.reduce((sum, s) => sum + s.duration, 0);
    if (total > 120) {
      Alert.alert(t('errors.validation'), t('skills.errors.totalDurationExceeded'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('success.title'), t('skills.saved'));
  };

  // Render Wait Time row (fixed, not draggable)
  const renderWaitTimeRow = () => (
    <View style={styles.waitTimeContainer}>
      <View style={styles.skillOrderBadge}>
        <Text style={styles.skillOrderText}>⏱️</Text>
      </View>
      <View style={styles.skillInfo}>
        <Text style={styles.skillName}>{t('skills.waitTime')}</Text>
        <Text style={styles.skillCategory}>{t('skills.fixedRow')}</Text>
      </View>
      <View style={styles.durationInputContainer}>
        <Controller
          control={control}
          name="waitDuration"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.durationInput, errors.waitDuration && styles.inputError]}
              value={String(value)}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onChange(num);
                setWaitDuration(num);
              }}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor="#666"
            />
          )}
        />
        <Text style={styles.durationUnit}>{t('skills.minutes')}</Text>
      </View>
    </View>
  );

  // Render draggable skill item
  const renderSkillItem = ({ item, drag, isActive }: RenderItemParams<SelectedSkill>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.selectedSkillItem,
            isActive && styles.selectedSkillItemActive,
          ]}
        >
          <View style={styles.skillOrderBadge}>
            <Text style={styles.skillOrderText}>{item.order}</Text>
          </View>
          
          {/* Image thumbnail */}
          <TouchableOpacity 
            style={styles.skillImageContainer}
            onPress={() => pickImage(item.skillId)}
          >
            {uploadingSkillId === item.skillId ? (
              <ActivityIndicator color="#4285F4" />
            ) : item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.skillImage} />
            ) : (
              <View style={styles.skillImagePlaceholder}>
                <Text style={styles.skillImagePlaceholderText}>+</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.skillInfo}>
            <Text style={styles.skillName} numberOfLines={2}>
              Skill {item.order}
            </Text>
          </View>

          {/* Duration input */}
          <View style={styles.durationInputContainer}>
            <Controller
              control={control}
              name={`skills.${item.order - 1}.duration` as any}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.durationInput, !item.imageUri && styles.inputError]}
                  value={String(value)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    onChange(num);
                    updateSkill(item.skillId, { duration: num });
                  }}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor="#666"
                />
              )}
            />
            <Text style={styles.durationUnit}>{t('skills.minutes')}</Text>
          </View>

          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveSkill(item.skillId)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('skills.title')}</Text>
        <Text style={styles.subtitle}>
          {selectedSkills.length}/{MAX_SELECTED_SKILLS} {t('skills.selected')} • {totalDuration} {t('skills.minutes')}
        </Text>
      </View>

      {/* Split View */}
      <View style={styles.splitView}>
        {/* Left Panel - Skill Categories */}
        <View style={styles.leftPanel}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('skills.search')}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView style={styles.categoriesList}>
            {filteredCategories.map(category => (
              <View key={category.id} style={styles.categorySection}>
                <TouchableOpacity
                  style={[
                    styles.categoryHeader,
                    { backgroundColor: category.color + '20' }
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </TouchableOpacity>

                {(!selectedCategory || selectedCategory === category.id) && (
                  <View style={styles.skillsList}>
                    {category.skills.map((skill, index) => (
                      <TouchableOpacity
                        key={`${category.id}-${index}`}
                        style={styles.skillItem}
                        onPress={() => handleAddSkill(category.id, skill)}
                      >
                        <Text style={styles.skillItemText}>{skill}</Text>
                        <Text style={styles.addIcon}>+</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Right Panel - Selected Skills */}
        <View style={styles.rightPanel}>
          <View style={styles.rightPanelHeader}>
            <Text style={styles.rightPanelTitle}>{t('skills.selectedSkills')}</Text>
          </View>

          <View style={styles.selectedSkillsList}>
            {/* Wait Time Row (fixed) */}
            {renderWaitTimeRow()}

            {/* Draggable Skills */}
            <DraggableFlatList
              data={selectedSkills}
              onDragEnd={({ from, to }) => {
                reorderSkills(from, to);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              keyExtractor={(item) => item.skillId}
              renderItem={renderSkillItem}
              containerStyle={styles.draggableList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {t('skills.noSkillsSelected')}
                  </Text>
                </View>
              }
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              selectedSkills.length === 0 && styles.saveButtonDisabled
            ]}
            onPress={handleSubmit(onSave)}
            disabled={selectedSkills.length === 0}
          >
            <Text style={styles.saveButtonText}>{t('skills.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
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
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  categoriesList: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  skillsList: {
    paddingHorizontal: 12,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 2,
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
  },
  skillItemText: {
    fontSize: 14,
    color: '#E5E5E5',
    flex: 1,
  },
  addIcon: {
    fontSize: 20,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  rightPanelHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  rightPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedSkillsList: {
    flex: 1,
  },
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D2D2D',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  selectedSkillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D2D2D',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  selectedSkillItemActive: {
    backgroundColor: '#3D3D3D',
  },
  skillOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  skillOrderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skillImageContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  skillImage: {
    width: '100%',
    height: '100%',
  },
  skillImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3D3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillImagePlaceholderText: {
    fontSize: 24,
    color: '#666',
  },
  skillInfo: {
    flex: 1,
    marginRight: 12,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  skillCategory: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  durationInput: {
    width: 50,
    padding: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  durationUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  draggableList: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
});

export default SkillsScreen;
