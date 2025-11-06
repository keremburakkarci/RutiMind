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
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GlobalTopActions from '../../components/GlobalTopActions';
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
import { useAuthStore } from '../../store/authStore';
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
  // Map of library-level images keyed by `${categoryId}||${skillName}`
  const [libraryImages, setLibraryImages] = useState<Record<string,string>>({});

  // Load saved categories from localStorage on web so newly added skills persist across reloads
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const raw = (globalThis as any)?.localStorage?.getItem('skills_web');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      // Normalize parsed structure: ensure each category has skills array
      // If the parsed category appears to be an unmodified copy of the default
      // library (same number of skills), replace its skill strings with the
      // current defaults from data/skillsData.js (which are now question-form).
      const defaultMap = new Map(skillCategories.map(dc => [dc.id, dc]));
      const normalized = parsed.map((c: any) => {
        const skillsArr = Array.isArray(c?.skills) ? c.skills.filter((s: any) => typeof s === 'string') : [];
        const def = defaultMap.get(c.id);
        // If lengths match the default library, assume this is an unmodified
        // stored copy and swap in the updated default (question-form) texts.
        if (def && Array.isArray(def.skills) && skillsArr.length === def.skills.length) {
          return { ...c, skills: [...def.skills] };
        }
        return { ...c, skills: skillsArr };
      });
      setCategories(normalized);
      console.log('[SkillsScreen] loaded categories from localStorage (merged with defaults), count:', normalized.length);
    } catch (e) {
      console.warn('[SkillsScreen] Failed to load categories from localStorage', e);
    }
  }, []);

  // Load persisted library images on web
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const raw = (globalThis as any)?.localStorage?.getItem('skills_images_web');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') setLibraryImages(parsed);
    } catch (e) {
      console.warn('[SkillsScreen] Failed to load library images from localStorage', e);
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

  // Persist library images to localStorage on web when libraryImages change
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('skills_images_web', JSON.stringify(libraryImages));
    } catch (e) {
      console.warn('[SkillsScreen] Failed to persist library images to localStorage', e);
    }
  }, [libraryImages]);

  // Sync library-level images into any already-selected skills. This handles
  // the case where a teacher adds/edits a library thumbnail after the skill
  // was already added to the selected list: we copy the library image into
  // the selected skill's imageUri so the thumbnail appears on the right panel.
  React.useEffect(() => {
    try {
      Object.keys(libraryImages).forEach(key => {
        const uri = libraryImages[key];
        const parts = key.split('||');
        if (parts.length !== 2) return;
        const [, skillName] = parts;
        const found = selectedSkills.find(s => s.skillName === skillName);
        if (found && found.imageUri !== uri) {
          updateSkill(found.skillId, { imageUri: uri });
        }
      });
    } catch (e) {
      console.warn('[SkillsScreen] Failed syncing library images to selected skills', e);
    }
  }, [libraryImages, selectedSkills, updateSkill]);

  // Local state
  const [openCategories, setOpenCategories] = useState<string[]>(
    skillCategories.map(c => c.id)
  );
  // Image preview/lightbox state
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingSkillId, setUploadingSkillId] = useState<string | null>(null);

  // Add modal state for creating a new skill
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<string | null>(skillCategories?.[0]?.id || null);
  const [newSkillError, setNewSkillError] = useState<string | null>(null);
  // New-skill modal image state
  const [newSkillImageUri, setNewSkillImageUri] = useState<string | null>(null);
  const [newSkillUploading, setNewSkillUploading] = useState(false);
  // Transient hint visibility for add-skill modal
  const [transientHintVisible, setTransientHintVisible] = useState(false);
  const transientHintTimerRef = React.useRef<any>(null);

  // Show transient hint when add modal opens or when user taps the hint area
  const showTransientHint = React.useCallback(() => {
    try {
      setTransientHintVisible(true);
      if (transientHintTimerRef.current) {
        clearTimeout(transientHintTimerRef.current);
      }
      transientHintTimerRef.current = setTimeout(() => {
        setTransientHintVisible(false);
        transientHintTimerRef.current = null;
      }, 3500);
    } catch (e) {
      console.warn('[SkillsScreen] showTransientHint error', e);
    }
  }, []);

  React.useEffect(() => {
    if (addModalVisible) {
      showTransientHint();
    } else {
      if (transientHintTimerRef.current) {
        clearTimeout(transientHintTimerRef.current);
        transientHintTimerRef.current = null;
      }
      setTransientHintVisible(false);
    }
    return () => {
      if (transientHintTimerRef.current) {
        clearTimeout(transientHintTimerRef.current);
        transientHintTimerRef.current = null;
      }
    };
  }, [addModalVisible, showTransientHint]);

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

  // NOTE: Selected-skill image uploads have been moved to the library; use
  // `pickLibraryImage(categoryId, skillName)` to assign thumbnails at the
  // library level. Selected skills only display thumbnails.

  // New: pick image for a library skill (category + skillName)
  const pickLibraryImage = async (categoryId: string, skillName: string) => {
    try {
      const key = `${categoryId}||${skillName}`;
      setUploadingSkillId(key);
      if (typeof (globalThis as any).document !== 'undefined') {
        const input = (globalThis as any).document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files && e.target.files[0];
          if (!file) { setUploadingSkillId(null); return; }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const dataUrl = reader.result as string;
              setLibraryImages(prev => ({ ...prev, [key]: dataUrl }));
            } catch (err) { console.warn('[SkillsScreen] web library image read error', err); }
            finally { setUploadingSkillId(null); }
          };
          reader.onerror = () => setUploadingSkillId(null);
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('errors.permission'), t('errors.cameraPermission'));
        setUploadingSkillId(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]) { setUploadingSkillId(null); return; }

      const asset = result.assets[0];
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setLibraryImages(prev => ({ ...prev, [key]: manip.uri }));
      setUploadingSkillId(null);
      await safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('[SkillsScreen] pickLibraryImage error', e);
      Alert.alert(t('errors.title'), t('errors.imagePicker'));
      setUploadingSkillId(null);
    }
  };

  // Pick image specifically for the Add-Skill modal (requires name to be set)
  const pickImageForNewSkill = async () => {
    try {
  const skillName = (newSkillName || '').trim();
      if (!skillName) {
        Alert.alert('Eksik bilgi', 'Lütfen önce beceri adını girin, sonra fotoğraf seçin.');
        return;
      }

      setNewSkillUploading(true);
      if (typeof (globalThis as any).document !== 'undefined') {
        const input = (globalThis as any).document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files && e.target.files[0];
          if (!file) { setNewSkillUploading(false); return; }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const dataUrl = reader.result as string;
              setNewSkillImageUri(dataUrl);
            } catch (err) { console.warn('[SkillsScreen] web new-skill image read error', err); }
            finally { setNewSkillUploading(false); }
          };
          reader.onerror = () => setNewSkillUploading(false);
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('errors.permission'), t('errors.cameraPermission'));
        setNewSkillUploading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]) { setNewSkillUploading(false); return; }

      const asset = result.assets[0];
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setNewSkillImageUri(manip.uri);
      setNewSkillUploading(false);
      await safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('[SkillsScreen] pickImageForNewSkill error', e);
      Alert.alert(t('errors.title'), t('errors.imagePicker'));
      setNewSkillUploading(false);
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
    const libKey = `${categoryId}||${skillName}`;
    const newSkill: SelectedSkill = {
      skillId,
      skillName,
      order: selectedSkills.length + 1,
      duration: 5, // Default 5 minutes
      imageUri: libraryImages[libKey] || '',
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

    // If user selected an image while creating the skill, persist it into libraryImages
    try {
      if (newSkillImageUri) {
        const key = `${newSkillCategory}||${normalized}`;
        setLibraryImages(prev => ({ ...prev, [key]: newSkillImageUri }));
      }
    } catch (e) {
      console.warn('[SkillsScreen] failed to attach newSkillImage to libraryImages', e);
    }

    // Ensure the category is open so user can see the newly added skill
    setOpenCategories(prev => prev.includes(newSkillCategory) ? prev : [...prev, newSkillCategory]);

    // Clear search so the added item is visible and reset modal state
    setSearchQuery('');
    setNewSkillName('');
    setNewSkillCategory(categoriesOrdered?.[0]?.id || skillCategories?.[0]?.id || null);
    setNewSkillError(null);
    setNewSkillImageUri(null);
    setAddModalVisible(false);
  };

  // Save validation - Skills are auto-saved via store subscription
  // This button validates and confirms to user that data is ready for student mode
  const onSave = async () => {
    console.log('[SkillsScreen] onSave called');
    console.log('[SkillsScreen] Selected skills count:', selectedSkills.length);
    
    if (selectedSkills.length === 0) {
      Alert.alert(
        t('errors.validation', { defaultValue: 'Uyarı' }),
        'Henüz beceri seçmediniz.'
      );
      return;
    }
    
    // Check all skills have images
    const skillsWithoutImage = selectedSkills.filter((s: SelectedSkill) => !s.imageUri);
    if (skillsWithoutImage.length > 0) {
      Alert.alert(
        t('errors.validation', { defaultValue: 'Eksik Bilgi' }), 
        t('skills.errors.missingImages', { defaultValue: 'Lütfen tüm becerilere resim ekleyin.' })
      );
      return;
    }

    // Check total duration
    const total = selectedSkills.reduce((sum: number, s: SelectedSkill) => sum + s.duration, 0);
    if (total > 120) {
      Alert.alert(
        t('errors.validation', { defaultValue: 'Uyarı' }), 
        t('skills.errors.totalDurationExceeded', { defaultValue: 'Toplam süre 120 dakikayı geçemez.' })
      );
      return;
    }

    const uid = useAuthStore.getState().user?.uid;
    if (!uid) {
      Alert.alert(
        t('errors.title', { defaultValue: 'Hata' }),
        'Lütfen önce giriş yapın.'
      );
      return;
    }

    // Data is already auto-saved via store subscription, just show confirmation
    safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t('success.title', { defaultValue: 'Hazır!' }), 
      `Seçimleriniz otomatik olarak hesabınıza kaydedildi.\n\n${selectedSkills.length} beceri seçili.\nToplam süre: ${total} dakika.\n\nBu beceriler öğrenci ekranında gösterilecektir.`
    );
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
          
          {/* Image thumbnail - show only (no upload) */}
          <View style={styles.skillImageContainer}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.skillImage} />
            ) : (
              <View style={styles.skillImagePlaceholder}>
                <Text style={styles.skillImagePlaceholderText}>+</Text>
              </View>
            )}
          </View>

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
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e']}
          style={styles.gradientBackground}
        >
          {/* Global top actions (main menu center, user right) */}
    <GlobalTopActions showBack />

          {/* Spacer to avoid overlapping with absolute top bar */}
          <View style={styles.headerSpacer} />

        {/* Split View */}
        <View style={styles.splitView}>
        {/* Left Panel - Skill Categories */}
        <View style={styles.leftPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderContent}>
              <View style={styles.panelIconWrapper}>
                <Text style={styles.panelIcon}>📚</Text>
              </View>
              <Text style={styles.panelHeaderTitle}>Beceri Listesi</Text>
            </View>
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
                        const libKeyLocal = `${category.id}||${skill}`;
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
                              {/* Left thumbnail (library-level) - tappable to preview if image exists */}
                              {libraryImages[libKeyLocal] ? (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    // Prevent parent add-skill on web when tapping the thumb
                                    e?.stopPropagation?.();
                                    setPreviewImageUri(libraryImages[libKeyLocal]);
                                    setPreviewVisible(true);
                                  }}
                                  activeOpacity={0.9}
                                >
                                  <Image source={{ uri: libraryImages[libKeyLocal] }} style={[styles.libraryThumb, { marginRight: 8 }]} />
                                </TouchableOpacity>
                              ) : (
                                <View style={[styles.libraryThumb, { marginRight: 8, backgroundColor: 'rgba(13,27,42,0.6)', alignItems: 'center', justifyContent: 'center' }]}>
                                  <Text>{category.icon}</Text>
                                </View>
                              )}

                              <Text style={styles.skillItemText}>{skill}</Text>
                              <Text style={styles.addIcon}>+</Text>
                            </TouchableOpacity>

                              {/* Library image upload / preview button */}
                              <TouchableOpacity
                                style={styles.uploadLibraryButton}
                                onPress={(e) => {
                                  if (Platform.OS === 'web') e?.stopPropagation?.();
                                  pickLibraryImage(category.id, skill);
                                }}
                                activeOpacity={0.8}
                              >
                                {uploadingSkillId === `${category.id}||${skill}` ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  // Always show camera emoji on the right upload button per UX request
                                  <Text style={styles.uploadButtonText}>📷</Text>
                                )}
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
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderContent}>
              <View style={styles.panelIconWrapper}>
                <Text style={styles.panelIcon}>✓</Text>
              </View>
              <Text style={styles.panelHeaderTitle}>{t('skills.selectedSkills')}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selectedSkills.length}/{MAX_SELECTED_SKILLS}
              </Text>
            </View>
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
            <Text style={styles.saveButtonText}>
              {t('skills.save', { defaultValue: 'Öğrenci İçin Hazır ✓' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Skill Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setAddModalVisible(false); setNewSkillName(''); setNewSkillCategory(categoriesOrdered?.[0]?.id || skillCategories?.[0]?.id || null); setNewSkillError(null); setNewSkillImageUri(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Beceri Ekle</Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setNewSkillName(''); setNewSkillCategory(categoriesOrdered?.[0]?.id || skillCategories?.[0]?.id || null); setNewSkillError(null); setNewSkillImageUri(null); }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Transient hint: appears briefly when modal opens, can be re-triggered by tapping */}
            {transientHintVisible ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => showTransientHint()}>
                <Text style={styles.addSkillHint}>
                  Becerilerinizi "yaptım" değil "yaptım mı?" şeklinde soru cümlesi şeklinde hazırlayın.
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Name Input */}
            <TextInput
              style={[styles.input, newSkillError && styles.inputError]}
              placeholder="Beceri adı girin..."
              placeholderTextColor="#666"
              value={newSkillName}
              onChangeText={(v) => { setNewSkillName(v); if (newSkillError) setNewSkillError(null); }}
              onFocus={() => showTransientHint()}
            />
            {newSkillError ? <Text style={styles.errorText}>{newSkillError}</Text> : null}

            {/* New-skill image picker / preview */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {newSkillImageUri ? (
                <Image source={{ uri: newSkillImageUri }} style={[styles.libraryThumb, { marginRight: 12 }]} />
              ) : (
                <View style={[styles.libraryThumb, { marginRight: 12, backgroundColor: 'rgba(13,27,42,0.6)', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff' }}>📷</Text>
                </View>
              )}

              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#3D3D3D', borderRadius: 8 }}
                onPress={() => pickImageForNewSkill()}
                activeOpacity={0.8}
              >
                {newSkillUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff' }}>{newSkillImageUri ? 'Değiştir' : 'Fotoğraf Ekle'}</Text>
                )}
              </TouchableOpacity>
            </View>

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

      {/* Image preview modal (lightbox) */}
      <Modal
        visible={previewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setPreviewVisible(false); setPreviewImageUri(null); }}
      >
        <View style={styles.previewModalOverlay}>
          <TouchableOpacity style={{ flex: 1, width: '100%' }} activeOpacity={1} onPress={() => { setPreviewVisible(false); setPreviewImageUri(null); }} />
          <View style={{ position: 'absolute', left: 24, right: 24, top: 80, bottom: 80, justifyContent: 'center', alignItems: 'center' }}>
            {previewImageUri ? (
              <Image source={{ uri: previewImageUri }} style={styles.previewImageLarge} resizeMode="contain" />
            ) : null}
            <TouchableOpacity style={{ marginTop: 12 }} onPress={() => { setPreviewVisible(false); setPreviewImageUri(null); }}>
              <Text style={{ color: '#fff' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </LinearGradient>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  headerSpacer: {
    height: 96,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(100, 126, 234, 0.3)',
    backgroundColor: 'rgba(13, 27, 42, 0.5)',
  },
  panelHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.3)',
  },
  panelIcon: {
    fontSize: 20,
  },
  panelHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(100, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.3)',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667eea',
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
    borderRightColor: 'rgba(100, 126, 234, 0.2)',
    backgroundColor: 'rgba(13, 27, 42, 0.4)',
  },
  searchInput: {
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    color: '#FFFFFF',
    fontSize: 14,
    padding: 12,
    paddingRight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.3)',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.2)',
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
    backgroundColor: 'rgba(100, 126, 234, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.4)',
  },
  expandButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(100, 126, 234, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
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
    backgroundColor: 'rgba(13, 27, 42, 0.5)',
    borderRadius: 8,
    position: 'relative',
    paddingRight: 68,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.2)',
  },
  uploadLibraryButton: {
    position: 'absolute',
    right: 40,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 9,
  },
  libraryThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  uploadButtonText: {
    fontSize: 18,
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
    color: '#667eea',
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
    backgroundColor: 'rgba(13, 27, 42, 0.4)',
  },
  rightPanelHeader: {
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 126, 234, 0.2)',
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
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(100, 126, 234, 0.4)',
  },
  selectedSkillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 70,
    backgroundColor: 'rgba(13, 27, 42, 0.5)',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.2)',
  },
  selectedSkillItemActive: {
    backgroundColor: 'rgba(100, 126, 234, 0.2)',
    borderColor: 'rgba(100, 126, 234, 0.4)',
  },
  skillOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 1)',
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
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.2)',
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
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  addSkillHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginHorizontal: 6,
    marginBottom: 8,
    lineHeight: 18,
    textAlign: 'left',
  },
});

export default SkillsScreen;
