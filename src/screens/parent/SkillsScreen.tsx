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
  Modal,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GlobalTopActions from '../../components/GlobalTopActions';
import HeaderTitle from '../../components/SharedHeader';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { skillCategories, MAX_SELECTED_SKILLS } from '../../../data/skillsData.js';
import { useSkillsStore } from '../../store/skillsStore';
import type { SelectedSkill } from '../../types';

const SkillsScreen: React.FC = () => {
  const { t } = useTranslation();
  // Safe Haptics wrapper to guard web platform
  const safeHaptic = async (type: 'impact' | 'notification' = 'impact', style?: any) => {
    try {
      if (Platform.OS === 'web') return;
      if (type === 'impact' && (Haptics as any)?.impactAsync) {
        await (Haptics as any).impactAsync(style || Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (type === 'notification' && (Haptics as any)?.notificationAsync) {
        await (Haptics as any).notificationAsync(style);
        return;
      }
    } catch (e) {
      console.debug('[SkillsScreen] Haptics error', e);
    }
  };
  
  // Zustand store
  const { 
    selectedSkills, 
    addSkill, 
    removeSkill,
    reorderSkills,
    updateSkill,
  } = useSkillsStore();

  // Local mutable copy of categories so we can add new skills into the library
  const [categories, setCategories] = useState(() =>
    skillCategories.map(cat => ({ ...cat, skills: Array.isArray(cat.skills) ? [...cat.skills] : [] }))
  );

  // Load saved categories from localStorage on web so newly added skills persist across reloads
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const raw = (globalThis as any)?.localStorage?.getItem('skills_web');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      // Normalize parsed structure: ensure each category has skills array
      const normalized = parsed.map((c: any) => ({
        ...c,
        skills: Array.isArray(c?.skills) ? c.skills.filter((s: any) => typeof s === 'string') : [],
      }));
      setCategories(normalized);
      console.log('[SkillsScreen] loaded categories from localStorage, count:', normalized.length);
    } catch (e) {
      console.warn('[SkillsScreen] Failed to load categories from localStorage', e);
    }
  }, []);

  // Persist categories to localStorage on web when categories change
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const toSave = categories.map(c => ({ id: c.id, title: c.title, icon: c.icon, color: c.color, skills: c.skills }));
      (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('skills_web', JSON.stringify(toSave));
    } catch (e) {
      console.warn('[SkillsScreen] Failed to persist categories to localStorage', e);
    }
  }, [categories]);

  // Local state
  const [openCategories, setOpenCategories] = useState<string[]>(
    skillCategories.map(c => c.id)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingSkillId, setUploadingSkillId] = useState<string | null>(null);

  // Add modal state for creating a new skill
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<string | null>(skillCategories?.[0]?.id || null);
  const [newSkillError, setNewSkillError] = useState<string | null>(null);

  // Duplicate-add confirmation modal (when same skill is already selected)
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<{ categoryId: string; skillName: string } | null>(null);

  // Delete confirmation modal state (only for library items, not selected skills)
  const [deleteLibraryModalVisible, setDeleteLibraryModalVisible] = useState(false);
  const [deleteLibraryTarget, setDeleteLibraryTarget] = useState<{ categoryId: string; skillName: string } | null>(null);

  // Filter skills by search only
  const filteredCategories = useMemo(() => {
    // Sort categories alphabetically, then filter & sort their skills
    return [...categories]
      .sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' }))
      .map(category => ({
        ...category,
        skills: (category.skills || [])
          .filter(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' })),
      }));
  }, [searchQuery, categories]);

  // Categories ordered for display (used in modal and elsewhere)
  const categoriesOrdered = useMemo(() => {
    return [...categories].sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' }));
  }, [categories]);

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
  await safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
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

    // If this skill name is already selected, ask for confirmation before adding
    const alreadySelected = selectedSkills.some(s => s.skillName === skillName);
    if (alreadySelected) {
      console.debug('[SkillsScreen] Duplicate add detected for skill:', skillName);
      setDuplicateTarget({ categoryId, skillName });
      setDuplicateModalVisible(true);
      return;
    }

    const skillId = `${categoryId}-${skillName}-${Date.now()}`;
    const newSkill: SelectedSkill = {
      skillId,
      skillName,
      order: selectedSkills.length + 1,
      duration: 5, // Default 5 minutes
      imageUri: '',
    };

    addSkill(newSkill);
    safeHaptic('impact', Haptics.ImpactFeedbackStyle.Medium);
  };

  // Confirm adding a duplicate (user chose to proceed)
  const confirmDuplicateAdd = () => {
    if (!duplicateTarget) return;
    if (selectedSkills.length >= MAX_SELECTED_SKILLS) {
      Alert.alert(t('errors.title'), t('skills.maxSkillsReached'));
      setDuplicateModalVisible(false);
      setDuplicateTarget(null);
      return;
    }

    const { categoryId, skillName } = duplicateTarget;
    const skillId = `${categoryId}-${skillName}-${Date.now()}`;
    const newSkill: SelectedSkill = {
      skillId,
      skillName,
      order: selectedSkills.length + 1,
      duration: 5,
      imageUri: '',
    };

    console.debug('[SkillsScreen] User confirmed duplicate add for skill:', skillName);
    addSkill(newSkill);
    safeHaptic('impact', Haptics.ImpactFeedbackStyle.Medium);
    setDuplicateModalVisible(false);
    setDuplicateTarget(null);
  };

  // Remove skill from selected (right panel) - direct removal, no modal
  const handleRemoveSkill = (skillId: string) => {
    removeSkill(skillId);
    safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
  };

  // Confirm delete from library (left panel) - open modal
  const confirmDeleteFromLibrary = (categoryId: string, skillName: string) => {
    setDeleteLibraryTarget({ categoryId, skillName });
    setDeleteLibraryModalVisible(true);
  };

  // Perform library skill deletion
  const performDeleteFromLibrary = () => {
    if (!deleteLibraryTarget) return;
    const { categoryId, skillName } = deleteLibraryTarget;
    
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, skills: cat.skills.filter(s => s !== skillName) };
      }
      return cat;
    }));

    setDeleteLibraryModalVisible(false);
    setDeleteLibraryTarget(null);
    safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
  };

  // Handle add from modal
  const handleAddFromModal = () => {
    // Distinguish between completely empty and whitespace-only input so we can
    // show a clearer inline message for the latter (e.g. user typed only spaces).
    if (!newSkillName || newSkillName.length === 0) {
      // If the translation key is missing, use the Turkish fallback via defaultValue
      setNewSkillError(t('skills.nameRequired', { defaultValue: 'Beceri adı girmeyi unutmayın!' }));
      return;
    }

    // If the user entered only spaces (one or more), show the requested message
    // exactly as asked by the user.
    if (newSkillName.trim().length === 0) {
      setNewSkillError('Düzgün bir beceri adı giriniz!');
      return;
    }

    if (!newSkillCategory) {
      setNewSkillError(t('skills.categoryRequired', { defaultValue: 'Kategori seçin' }));
      return;
    }

    // Normalize input once
    const normalized = (newSkillName || '').trim();

    // Allow multi-word skill names; whitespace-only names are rejected above via trim check.

    // Add the new skill into the library (categories state) — do NOT add to selectedSkills
    setCategories(prev => {
      let added = false;
      const next = prev.map(cat => {
        if (cat.id === newSkillCategory) {
          // Avoid duplicates
          if (!cat.skills.includes(normalized)) {
            added = true;
            return { ...cat, skills: [...cat.skills, normalized] };
          }
        }
        return cat;
      });

      // If the category id wasn't found for some reason, fallback to first category
      if (!added && next.length > 0) {
        next[0] = { ...next[0], skills: [...(next[0].skills || []), normalized] };
      }

      return next;
    });

    // Ensure the category is open so user can see the newly added skill
    setOpenCategories(prev => prev.includes(newSkillCategory) ? prev : [...prev, newSkillCategory]);

    // Clear search so the added item is visible and reset modal state
    setSearchQuery('');
    setNewSkillName('');
    setNewSkillCategory(categoriesOrdered?.[0]?.id || skillCategories?.[0]?.id || null);
    setNewSkillError(null);
    setAddModalVisible(false);
  };

  // Save validation
  const onSave = () => {
    // Check all skills have images
    const skillsWithoutImage = selectedSkills.filter((s: SelectedSkill) => !s.imageUri);
    if (skillsWithoutImage.length > 0) {
      Alert.alert(t('errors.validation'), t('skills.errors.missingImages'));
      return;
    }

    // Check total duration
    const total = selectedSkills.reduce((sum: number, s: SelectedSkill) => sum + s.duration, 0);
    if (total > 120) {
      Alert.alert(t('errors.validation'), t('skills.errors.totalDurationExceeded'));
      return;
    }

  safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
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
      </View>
      <View style={styles.totalDurationContainer}>
        <Text style={styles.totalDurationLabel}>Toplam:</Text>
        <Text style={styles.totalDurationValue}>{totalDuration}</Text>
        <Text style={styles.durationUnit}>{t('skills.minutes')}</Text>
      </View>
    </View>
  );

  // Render draggable skill item
  const renderSkillItem = ({ item, drag, isActive, getIndex }: RenderItemParams<SelectedSkill>) => {
    const index = getIndex();
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={100}
          activeOpacity={0.8}
          style={[
            styles.selectedSkillItem,
            isActive && styles.selectedSkillItemActive,
          ]}
        >
          {/* Order Badge */}
          <View style={styles.skillOrderBadge}>
            <Text style={styles.skillOrderText}>{typeof index === 'number' ? index + 1 : item.order}</Text>
          </View>
          
          {/* Image thumbnail */}
          <TouchableOpacity 
            style={styles.skillImageContainer}
            onPress={() => pickImage(item.skillId)}
            activeOpacity={0.7}
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
              {item.skillName || `Skill ${item.order}`}
            </Text>
          </View>

          {/* Duration input */}
          <View style={styles.durationInputContainer}>
            <TextInput
              style={[styles.durationInput, !item.imageUri && styles.inputError]}
              value={String(item.duration)}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                updateSkill(item.skillId, { duration: num });
              }}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor="#666"
            />
            <Text style={styles.durationUnit}>{t('skills.minutes')}</Text>
          </View>

          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveSkill(item.skillId)}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Global top actions (title left, main menu center, user right) */}
  <GlobalTopActions title={t('skills.title')} showBack />

        {/* Spacer to avoid overlapping with absolute top bar */}
        <View style={styles.headerSpacer} />

      {/* Split View */}
      <View style={styles.splitView}>
        {/* Left Panel - Skill Categories */}
        <View style={styles.leftPanel}>
          <View style={styles.leftPanelHeaderRow}>
            <HeaderTitle style={{ fontSize: 20 }}>Beceri Listesi</HeaderTitle>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                // Reset modal fields and error when opening so previous values/errors don't persist
                setNewSkillName('');
                setNewSkillCategory(categoriesOrdered?.[0]?.id || newSkillCategory);
                setNewSkillError(null);
                setAddModalVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('skills.search')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.searchClearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.categoriesList}>
            {filteredCategories.map(category => {
              const isOpen = openCategories.includes(category.id);
              
              return (
                <View key={category.id} style={styles.categorySection}>
                  <TouchableOpacity
                    style={[
                      styles.categoryHeader,
                      { backgroundColor: category.color + '20' }
                    ]}
                    onPress={() => {
                      setOpenCategories(prev => 
                        prev.includes(category.id) 
                          ? prev.filter(x => x !== category.id) 
                          : [...prev, category.id]
                      );
                      safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryTitle}>{category.title} <Text style={styles.categoryCount}>({category.skills.length})</Text></Text>
                    <View style={styles.expandButton}>
                      <Text style={styles.expandButtonText}>{isOpen ? '−' : '+'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.skillsList}>
                      {category.skills.map((skill, index) => {
                        // Determine if this skill is part of the original default list for this category
                        const originalCategory = skillCategories.find((c) => c.id === category.id);
                        const isDefaultSkill = !!originalCategory && Array.isArray(originalCategory.skills) && originalCategory.skills.includes(skill);

                        return (
                          <View key={`${category.id}-${index}`} style={styles.skillItem}>
                            <TouchableOpacity
                              style={styles.skillItemClickable}
                              onPress={() => handleAddSkill(category.id, skill)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.skillItemText}>{skill}</Text>
                              <Text style={styles.addIcon}>+</Text>
                            </TouchableOpacity>

                            {/* Show delete button only for user-added (non-default) skills */}
                            {!isDefaultSkill && (
                              <TouchableOpacity
                                style={styles.deleteLibraryButton}
                                onPress={(e) => {
                                  if (Platform.OS === 'web') {
                                    e?.stopPropagation?.();
                                  }
                                  confirmDeleteFromLibrary(category.id, skill);
                                }}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Text style={styles.deleteButtonText}>🗑️</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Panel - Selected Skills */}
        <View style={styles.rightPanel}>
          <View style={styles.rightPanelHeader}>
            <Text style={styles.rightPanelTitle}>{t('skills.selectedSkills')}</Text>
            <Text style={styles.rightPanelSubtitle}>
              {selectedSkills.length}/{MAX_SELECTED_SKILLS}
            </Text>
          </View>

          <View style={styles.selectedSkillsList}>
            {/* Wait Time Row (fixed) */}
            {renderWaitTimeRow()}

            {/* Draggable Skills */}
            {selectedSkills.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {t('skills.noSkillsSelected')}
                </Text>
              </View>
            ) : (
              <DraggableFlatList
                data={selectedSkills}
                onDragEnd={({ from, to }) => {
                  reorderSkills(from, to);
                  safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
                }}
                keyExtractor={(item) => item.skillId}
                renderItem={renderSkillItem}
                contentContainerStyle={styles.draggableListContent}
                activationDistance={10}
                dragItemOverflow={true}
              />
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              selectedSkills.length === 0 && styles.saveButtonDisabled
            ]}
            onPress={onSave}
            disabled={selectedSkills.length === 0}
          >
            <Text style={styles.saveButtonText}>{t('skills.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Skill Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setAddModalVisible(false); setNewSkillName(''); setNewSkillCategory(categoriesOrdered?.[0]?.id || skillCategories?.[0]?.id || null); setNewSkillError(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Beceri Ekle</Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setNewSkillName(''); setNewSkillCategory(categoriesOrdered?.[0]?.id || skillCategories?.[0]?.id || null); setNewSkillError(null); }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <TextInput
              style={[styles.input, newSkillError && styles.inputError]}
              placeholder="Beceri adı girin..."
              placeholderTextColor="#666"
              value={newSkillName}
              onChangeText={(v) => { setNewSkillName(v); if (newSkillError) setNewSkillError(null); }}
            />
            {newSkillError ? <Text style={styles.errorText}>{newSkillError}</Text> : null}

            {/* Category selection */}
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>Kategori seçin:</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 12 }}>
              {categoriesOrdered.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.skillItem,
                    { marginVertical: 4, backgroundColor: newSkillCategory === cat.id ? '#333' : '#2D2D2D' }
                  ]}
                  onPress={() => setNewSkillCategory(cat.id)}
                >
                  <Text style={styles.skillItemText}>{cat.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddFromModal}
            >
              <Text style={styles.submitButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Duplicate-add Confirmation Modal (when a selected skill is added again) */}
      <Modal
        visible={duplicateModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setDuplicateModalVisible(false); setDuplicateTarget(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 420 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Beceri Zaten Seçili</Text>
              <TouchableOpacity onPress={() => { setDuplicateModalVisible(false); setDuplicateTarget(null); }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#ddd', marginBottom: 12 }}>Bu beceri zaten seçili. Yine de eklemek istiyor musunuz?</Text>
            {duplicateTarget?.skillName ? (
              <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 18 }}>{duplicateTarget.skillName}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#3D3D3D', flex: 1, marginRight: 8 }]}
                onPress={() => { setDuplicateModalVisible(false); setDuplicateTarget(null); }}
              >
                <Text style={styles.submitButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#4285F4', flex: 1, marginLeft: 8 }]}
                onPress={confirmDuplicateAdd}
              >
                <Text style={styles.submitButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal (for library items only) */}
      <Modal
        visible={deleteLibraryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setDeleteLibraryModalVisible(false); setDeleteLibraryTarget(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Beceri Sil</Text>
              <TouchableOpacity onPress={() => { setDeleteLibraryModalVisible(false); setDeleteLibraryTarget(null); }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#ddd', marginBottom: 12 }}>Bu beceriyi listeden silmek istediğinizden emin misiniz?</Text>
            {deleteLibraryTarget?.skillName ? (
              <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 18 }}>{deleteLibraryTarget.skillName}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#3D3D3D', flex: 1, marginRight: 8 }]}
                onPress={() => { setDeleteLibraryModalVisible(false); setDeleteLibraryTarget(null); }}
              >
                <Text style={styles.submitButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 8 }]}
                onPress={performDeleteFromLibrary}
              >
                <Text style={styles.submitButtonText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </GestureHandlerRootView>
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
  headerSpacer: {
    height: 96,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  leftPanelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    position: 'relative',
  },
  searchClearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3D3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#2D2D2D',
    color: '#FFFFFF',
    fontSize: 14,
    padding: 12,
    paddingRight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
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
    marginHorizontal: 16,
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
  categoryCount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3D3D3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  expandButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  skillsList: {
    paddingHorizontal: 16,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 2,
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
    position: 'relative',
    paddingRight: 68, // leave room for delete button
  },
  skillItemClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
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
  deleteLibraryButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  rightPanelHeader: {
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 12,
    minHeight: 70,
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
  totalDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  totalDurationLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  totalDurationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 4,
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
  draggableListContent: {
    paddingBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#9CA3AF',
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
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 8,
  },
  submitButton: {
    width: '100%',
    padding: 12,
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

export default SkillsScreen;
