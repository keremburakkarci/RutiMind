// Reinforcers Screen - Manage reinforcers (split view with slots and drag-drop)

import React, { useState, useEffect } from 'react';
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
  Modal,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import GlobalTopActions from '../../components/GlobalTopActions';
import HeaderTitle from '../../components/SharedHeader';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { reinforcerCategories, allReinforcers as defaultReinforcers } from '../../../data/reinforcersData';
import { getAllReinforcers, insertReinforcer, updateReinforcer, deleteReinforcer as deleteReinforcerFromDB } from '../../services/database';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Local types
type Reinforcer = {
  id: string;
  name: string;
  imageUri?: string;
  categoryId?: string;
  slot: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

const MAX_SLOTS = 10;

const reinforcerSchema = z.object({
  // Require a non-empty name, disallow names that are only whitespace,
  // and disallow any space characters in the token (project requirement).
  name: z.string()
    .min(1, 'Pekiştireç adı girmeyi unutmayın!')
    .refine(v => v.trim().length > 0, { message: 'Pekiştireç adı girmeyi unutmayın!' })
  .refine(v => v.trim().length > 0, { message: 'Düzgün bir pekiştireç adı giriniz!' }),
  imageUri: z.string().optional(),
});

type ReinforcerFormData = z.infer<typeof reinforcerSchema>;

const defaultReinforcerIds = new Set(defaultReinforcers.map(d => d.id));

const ReinforcersScreen: React.FC = () => {
  const { t } = useTranslation();

  // Helper: dedupe reinforcers by id (keep first occurrence)
  const dedupeReinforcers = (arr: Reinforcer[] | undefined) => {
    if (!arr || arr.length === 0) return [] as Reinforcer[];
    const map = new Map<string, Reinforcer>();
    for (const item of arr) {
      if (!item || !item.id) continue;
      if (!map.has(item.id)) map.set(item.id, item);
      else {
        console.warn('[ReinforcersScreen] Duplicate reinforcer id detected, ignoring later entry:', item.id);
      }
    }
    return Array.from(map.values());
  };

  // safe Haptics wrapper that guards against web and missing APIs
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
      console.debug('[ReinforcersScreen] Haptics error', e);
    }
  };

  // State
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<(Reinforcer | null)[]>(
    Array(MAX_SLOTS).fill(null)
  );
  // Removed category chip filtering; we'll show grouped, collapsible categories instead
  const [openCategories, setOpenCategories] = useState<string[]>(
    reinforcerCategories.map(c => c.id)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newReinforcerCategory, setNewReinforcerCategory] = useState<string | null>(reinforcerCategories?.[0]?.id || null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);

  // Filled slots (compact list for drag & reorder)
  const filledSlots = React.useMemo(() => (
    selectedSlots.filter(s => s !== null) as Reinforcer[]
  ), [selectedSlots]);

  // Form
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ReinforcerFormData>({
    resolver: zodResolver(reinforcerSchema),
    defaultValues: {
      name: '',
    }
  });

  // Load reinforcers from SQLite
  useEffect(() => {
    loadReinforcers();
  }, []);

  // Filter reinforcers by search only (we'll group by category separately)
  const filteredReinforcers = React.useMemo(() => {
    if (!searchQuery.trim()) return reinforcers;
    const query = searchQuery.toLowerCase();
    return reinforcers.filter(r => r.name.toLowerCase().includes(query));
  }, [reinforcers, searchQuery]);

  const loadReinforcers = async () => {
    try {
      // Check if we're on web platform - SQLite not available
      if (Platform.OS === 'web') {
        console.log('[ReinforcersScreen] Web platform detected, using mock data or localStorage');
        try {
          const saved = typeof globalThis !== 'undefined' && (globalThis as any).localStorage ? (globalThis as any).localStorage.getItem('reinforcers_web') : null;
          if (saved) {
            const parsed = JSON.parse(saved) as Reinforcer[];
            const unique = dedupeReinforcers(parsed);
            console.log('[ReinforcersScreen] loaded reinforcers from localStorage, count:', unique.length);
            setReinforcers(unique);

            // Populate slots from saved data
            const newSlots = Array(MAX_SLOTS).fill(null) as (Reinforcer | null)[];
            unique.forEach(r => {
              if (r.slot > 0 && r.slot <= MAX_SLOTS) {
                newSlots[r.slot - 1] = r;
              }
            });
            setSelectedSlots(newSlots);
            return;
          }

          // Use default reinforcers as fallback on web
          const mockData = defaultReinforcers.map(r => ({
            id: r.id,
            name: r.name,
            // Use the emoji/icon from data as a simple visual fallback on web
            imageUri: r.icon || '',
            slot: 0, // not assigned to slots yet
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            categoryId: (r as any).categoryId,
          }));
          setReinforcers(dedupeReinforcers(mockData as unknown as Reinforcer[]));
          console.log('[ReinforcersScreen] set mock reinforcers count:', (mockData || []).length, mockData.slice(0, 6));
          setSelectedSlots(Array(MAX_SLOTS).fill(null));
          return;
        } catch (e) {
          console.warn('[ReinforcersScreen] Error reading localStorage, falling back to defaults', e);
          const mockData = defaultReinforcers.map(r => ({
            id: r.id,
            name: r.name,
            imageUri: r.icon || '',
            slot: 0,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            categoryId: (r as any).categoryId,
          }));
          setReinforcers(dedupeReinforcers(mockData as unknown as Reinforcer[]));
          setSelectedSlots(Array(MAX_SLOTS).fill(null));
          return;
        }
      }

      const data = await getAllReinforcers();
      
      // If no reinforcers in database, seed with default ones
      if (data.length === 0) {
        console.log('[ReinforcersScreen] No reinforcers found, seeding defaults...');
        await seedDefaultReinforcers();
        // Reload after seeding
        const seededData = await getAllReinforcers();
        const reinforcersData: Reinforcer[] = seededData.map(r => ({
          id: r.id,
          name: r.name,
          imageUri: r.image_uri,
          slot: r.slot,
          order: r.order_index,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        }));
        setReinforcers(dedupeReinforcers(reinforcersData));
      } else {
        const reinforcersData: Reinforcer[] = data.map(r => ({
          id: r.id,
          name: r.name,
          imageUri: r.image_uri,
          slot: r.slot,
          order: r.order_index,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        }));
        setReinforcers(dedupeReinforcers(reinforcersData));
      }
      
      // Populate slots based on loaded data
      const reinforcersData = data.map(r => ({
        id: r.id,
        name: r.name,
        imageUri: r.image_uri,
        slot: r.slot,
        order: r.order_index,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));
      
      const newSlots = Array(MAX_SLOTS).fill(null);
      reinforcersData.forEach(r => {
        if (r.slot > 0 && r.slot <= MAX_SLOTS) {
          newSlots[r.slot - 1] = r;
        }
      });
      setSelectedSlots(newSlots);
    } catch (error) {
      console.error('[ReinforcersScreen] Error loading reinforcers:', error);
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  // Seed default reinforcers from data file
  const seedDefaultReinforcers = async () => {
    try {
      for (const item of defaultReinforcers) {
        await insertReinforcer({
          id: item.id,
          name: item.name,
          image_uri: item.icon || '', // Use emoji as placeholder image
          slot: 0, // Not assigned to any slot by default
          order_index: 0,
        });
      }
      console.log(`[ReinforcersScreen] Seeded ${defaultReinforcers.length} default reinforcers`);
    } catch (error) {
      console.error('[ReinforcersScreen] Error seeding reinforcers:', error);
    }
  };

  // image upload removed for Reinforcers modal (name-only add)

  // Add new reinforcer
  const onAddReinforcer = async (data: ReinforcerFormData) => {
    try {
      // Validate name presence (extra guard in addition to zod) — do not allow empty names
      if (!data.name || !data.name.trim()) {
        Alert.alert(t('errors.validation'), t('reinforcers.nameRequired') || 'Please enter a name');
        return;
      }

      // Disallow any space characters in the name (single token only)
        // Multi-word names are allowed; whitespace-only names are prevented by the zod schema.
      // Ensure a valid categoryId is set for new reinforcers (fallback to first category)
      const categoryIdToUse = newReinforcerCategory || reinforcerCategories?.[0]?.id || undefined;

      const newReinforcer: Reinforcer = {
        id: `reinforcer-${Date.now()}`,
        name: data.name,
        imageUri: '',
        categoryId: categoryIdToUse,
        slot: 0, // Not assigned to slot yet
        order: reinforcers.length + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      if (Platform.OS === 'web') {
        // On web, just update local state — dedupe to avoid duplicate keys
        const next = dedupeReinforcers([...(reinforcers || []), newReinforcer]);
        console.log('[ReinforcersScreen] Added (web) reinforcer:', newReinforcer, 'total now', next.length);
        setReinforcers(next);
        try {
          (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(next));
        } catch (e) {
          console.warn('[ReinforcersScreen] Failed to persist reinforcers to localStorage', e);
        }
        // Expand the category so the new item is visible immediately
        if (categoryIdToUse) {
          setOpenCategories(prev => prev.includes(categoryIdToUse as string) ? prev : [...prev, categoryIdToUse as string]);
        }
        // Reset search so the item isn't accidentally filtered out
        setSearchQuery('');
      } else {
        // Save to database on native
        await insertReinforcer({
          id: newReinforcer.id,
          name: newReinforcer.name,
          image_uri: newReinforcer.imageUri || '',
          slot: newReinforcer.slot,
          order_index: newReinforcer.order,
        });

        const next = [...reinforcers, newReinforcer];
        console.log('[ReinforcersScreen] Added reinforcer (native):', newReinforcer, 'total now', next.length);
        setReinforcers(next);
      }
  setModalVisible(false);
  reset();
  setNewReinforcerCategory(reinforcerCategories?.[0]?.id || null);
      safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[ReinforcersScreen] Error adding reinforcer:', error);
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  // Add reinforcer to slot
  const addToSlot = async (reinforcer: Reinforcer, slotIndex: number) => {
    try {
      const newSlot = slotIndex + 1; // Convert to 1-based
      console.log('[ReinforcersScreen] addToSlot called:', { reinforcerId: reinforcer.id, name: reinforcer.name, slotIndex, newSlot });
      
      // Prevent assigning the same reinforcer into multiple slots
      const newSlots = [...selectedSlots];
      for (let i = 0; i < newSlots.length; i++) {
        if (newSlots[i]?.id === reinforcer.id) {
          console.log('[ReinforcersScreen] Clearing existing slot at index:', i, 'for reinforcer:', reinforcer.id);
          newSlots[i] = null;
        }
      }
      // Create a new object with updated slot value for selectedSlots
      const reinforcerWithSlot = { ...reinforcer, slot: newSlot, updatedAt: new Date() };
      newSlots[slotIndex] = reinforcerWithSlot;
      console.log('[ReinforcersScreen] Setting slot at index:', slotIndex, 'to reinforcer with slot:', newSlot);
      setSelectedSlots(newSlots);

      // If running on web, SQLite isn't available — update only local state
      if (Platform.OS === 'web') {
        const next = (reinforcers || []).map(r => r.id === reinforcer.id ? { ...r, slot: newSlot, updatedAt: new Date() } : r);
        const uniqueNext = dedupeReinforcers(next);
        console.log('[ReinforcersScreen] Updated reinforcers array (web), set slot to:', newSlot, 'for id:', reinforcer.id);
        setReinforcers(uniqueNext);
        try {
          (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(uniqueNext));
        } catch (e) {
          console.warn('[ReinforcersScreen] Failed to persist slot update to localStorage', e);
        }
        safeHaptic('impact', Haptics.ImpactFeedbackStyle.Medium);
        return;
      }

      // Update in database for native platforms
      await updateReinforcer(reinforcer.id, {
        slot: newSlot,
        order_index: 0, // Single reinforcer per slot for now
      });

      // Update local state after successful DB update
      setReinforcers(
        reinforcers.map(r =>
          r.id === reinforcer.id
            ? { ...r, slot: newSlot, updatedAt: new Date() }
            : r
        )
      );

      safeHaptic('impact', Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('[ReinforcersScreen] Error adding to slot:', error);
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  // Remove from slot
  const removeFromSlot = async (slotIndex: number) => {
    try {
      console.log('[ReinforcersScreen] removeFromSlot called with slotIndex:', slotIndex);
      console.log('[ReinforcersScreen] selectedSlots before removal:', selectedSlots.map((s, i) => ({ index: i, id: s?.id, name: s?.name, slot: s?.slot })));
      
      const reinforcer = selectedSlots[slotIndex];
      if (!reinforcer) {
        console.warn('[ReinforcersScreen] No reinforcer at slotIndex', slotIndex, '- returning early');
        return;
      }

      console.log('[ReinforcersScreen] Removing reinforcer:', { id: reinforcer.id, name: reinforcer.name, slot: reinforcer.slot, fromIndex: slotIndex });

      const newSlots = [...selectedSlots];
      newSlots[slotIndex] = null;
      setSelectedSlots(newSlots);
      console.log('[ReinforcersScreen] selectedSlots updated, null at index:', slotIndex);

      // If web, skip DB updates and only update local state
      if (Platform.OS === 'web') {
        const beforeCount = (reinforcers || []).length;
        const next = (reinforcers || []).map(r => r.id === reinforcer.id ? { ...r, slot: 0, updatedAt: new Date() } : r);
        const uniqueNext = dedupeReinforcers(next);
        console.log('[ReinforcersScreen] reinforcers array updated (web):', { beforeCount, afterCount: uniqueNext.length, targetId: reinforcer.id });
        setReinforcers(uniqueNext);
        try {
          (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(uniqueNext));
          console.log('[ReinforcersScreen] persisted to localStorage');
        } catch (e) {
          console.warn('[ReinforcersScreen] Failed to persist slot removal to localStorage', e);
        }
        safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      // Update in database (set slot to 0 = unassigned)
      await updateReinforcer(reinforcer.id, {
        slot: 0,
        order_index: 0,
      });

      // Update local state
      setReinforcers(
        reinforcers.map(r =>
          r.id === reinforcer.id
            ? { ...r, slot: 0, updatedAt: new Date() }
            : r
        )
      );

      safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
      console.log('[ReinforcersScreen] removeFromSlot completed successfully');
    } catch (error) {
      console.error('[ReinforcersScreen] Error removing from slot:', error);
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  // Open delete confirmation modal (shows same-style modal as add)
  const confirmDeleteReinforcer = (id: string, name?: string) => {
    console.log('[ReinforcersScreen] confirmDeleteReinforcer for id:', id, name);
    if (defaultReinforcerIds.has(id)) {
      Alert.alert(t('errors.title'), t('reinforcers.cannotDeleteDefault') || 'Bu pekiştireç silinemez');
      return;
    }
    setDeleteTarget({ id, name });
    setDeleteModalVisible(true);
  };

  // Perform deletion (no confirmation here)
  const performDeleteReinforcer = async (id: string) => {
    try {
      // Native DB removal
      if (Platform.OS !== 'web') {
        await deleteReinforcerFromDB(id);
      }

      const beforeCount = (reinforcers || []).length;
      const next = dedupeReinforcers((reinforcers || []).filter(r => r.id !== id));
      console.log('[ReinforcersScreen] performDeleteReinforcer: before=', beforeCount, 'after=', next.length, 'removedId=', id);
      setReinforcers(next);
      setSelectedSlots(prev => prev.map(s => (s?.id === id ? null : s)));

      // Persist on web
      try {
        (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(next));
      } catch (e) {
        console.warn('[ReinforcersScreen] Failed to persist deletion to localStorage', e);
      }

      safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[ReinforcersScreen] Error deleting reinforcer:', error);
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  // Save slots configuration
  const handleSave = () => {
    const filledSlots = selectedSlots.filter(s => s !== null);
    if (filledSlots.length === 0) {
      Alert.alert(t('errors.validation'), t('reinforcers.noSlotsSelected'));
      return;
    }

    safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('success.title'), t('reinforcers.saved'));
    // TODO: Save to database
  };

  // Note: individual slot rendering for empty placeholders removed — we render only filled slots now

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Global top actions (title left, main menu center, user right) */}
  <GlobalTopActions title={t('reinforcers.title')} showBack />

        {/* Spacer to avoid overlapping with absolute top bar */}
        <View style={styles.headerSpacer} />

      {/* Split View */}
      <View style={styles.splitView}>
        {/* Left Panel - Reinforcers Library */}
        <View style={styles.leftPanel}>
          <View style={styles.leftPanelHeaderRow}>
              <HeaderTitle style={{ fontSize: 20 }}>{t('reinforcers.library')}</HeaderTitle>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  // Ensure the form is reset when opening the modal so previous errors/values don't persist
                  reset();
                  setNewReinforcerCategory(reinforcerCategories?.[0]?.id || null);
                  setModalVisible(true);
                }}
              >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pekiştireç ara..."
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

          {/* Category Groups (collapsible) */}
          <ScrollView style={styles.categoriesList}>
            {reinforcerCategories.map(category => {
              // Defensive: ensure filteredReinforcers contains objects (not raw strings)
              const items = (filteredReinforcers || []).filter(r => {
                if (!r || typeof r !== 'object') return false;
                const cat = (r as any).categoryId;
                if (cat) return cat === category.id;
                return (r as any).id?.startsWith(category.id) || (r as any).id?.startsWith((category.id || '').split('-')[0]);
              });

              // Sort items alphabetically by name for consistent display (Turkish locale)
              items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr', { sensitivity: 'base' }));

              const isOpen = openCategories.includes(category.id);

              return (
                <View key={category.id} style={styles.categorySection}>
                  <TouchableOpacity
                    style={[styles.categoryHeader, { backgroundColor: category.color + '20' }]}
                    onPress={() => {
                      setOpenCategories(prev => prev.includes(category.id) ? prev.filter(x => x !== category.id) : [...prev, category.id]);
                      safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.categoryIcon}>{(category as any).items?.[0]?.icon || '📁'}</Text>
                    <Text style={styles.categoryTitle}>
                      {category.name}{' '}<Text style={styles.categoryCount}>({items.length})</Text>
                    </Text>
                    <View style={styles.expandButton}>
                      <Text style={styles.expandButtonText}>{isOpen ? '−' : '+'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.skillsList}>
                      {items.length === 0 ? (
                        <View style={styles.emptyLibrary}>
                          <Text style={styles.emptyLibraryText}>{t('reinforcers.noReinforcersInCategory')}</Text>
                        </View>
                      ) : (
                        // Render only valid object reinforcers to avoid raw string children on web
                        items.map((reinforcer: any, idx) => {
                          if (!reinforcer || typeof reinforcer !== 'object') return null;
                          const rid = reinforcer.id || `reinforcer-unknown-${idx}`;
                          return (
                            // Use stable id key to avoid React re-use issues
                            <View key={rid} style={styles.reinforcerItem}>
                              <TouchableOpacity
                                style={styles.reinforcerItemClickable}
                                activeOpacity={0.7}
                                onPress={() => {
                                  const firstEmpty = selectedSlots.findIndex(s => s === null);
                                  if (firstEmpty === -1) {
                                    Alert.alert(t('errors.title'), t('reinforcers.noSlotsAvailable') || 'Tüm slotlar dolu');
                                    return;
                                  }
                                  addToSlot(reinforcer, firstEmpty);
                                }}
                              >
                                <Text style={styles.reinforcerName}>{String(reinforcer.name || '')}</Text>
                                <Text style={styles.addIcon}>+</Text>
                              </TouchableOpacity>

                              {!defaultReinforcerIds.has(reinforcer.id) && (
                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  activeOpacity={0.7}
                                  onPress={(e) => {
                                    console.log('[ReinforcersScreen] Delete button pressed for:', reinforcer.id, reinforcer.name);
                                    if (Platform.OS === 'web') {
                                      e?.stopPropagation?.();
                                    }
                                    confirmDeleteReinforcer(reinforcer.id, reinforcer.name);
                                  }}
                                  onPressIn={(e) => {
                                    // Extra handler for web reliability
                                    if (Platform.OS === 'web') {
                                      console.log('[ReinforcersScreen] Delete button onPressIn');
                                      e?.stopPropagation?.();
                                    }
                                  }}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                  accessibilityLabel={t('reinforcers.delete')}
                                >
                                  <Text style={styles.deleteButtonText}>🗑️</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })}
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

          <View style={styles.slotsList}>
            {filledSlots.length === 0 ? (
              <View style={styles.emptyLibrary}>
                <Text style={styles.emptyLibraryText}>{t('reinforcers.noSlotsSelected') || 'Henüz seçilmiş pekiştireç yok'}</Text>
              </View>
            ) : (
              <DraggableFlatList
                data={filledSlots}
                keyExtractor={(item) => `${item.id}`}
                onDragEnd={({ data }) => {
                  try {
                    const newSlots = Array(MAX_SLOTS).fill(null);
                    data.forEach((r, idx) => {
                      newSlots[idx] = { ...r, slot: idx + 1, updatedAt: new Date() } as Reinforcer;
                    });
                    setSelectedSlots(newSlots);

                    // Update reinforcers state slots and persist updated list (also persist on web)
                    const updated = (reinforcers || []).map(p => {
                      const idx = data.findIndex(d => d.id === p.id);
                      return idx !== -1 ? { ...p, slot: idx + 1 } : p;
                    });
                    const uniqueUpdated = dedupeReinforcers(updated);
                    setReinforcers(uniqueUpdated);

                    // Persist DB updates on native and persist to localStorage on web
                    if (Platform.OS !== 'web') {
                      data.forEach((r, idx) => {
                        updateReinforcer(r.id, { slot: idx + 1, order_index: 0 }).catch(e => console.error(e));
                      });
                    } else {
                      try {
                        (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(uniqueUpdated));
                      } catch (e) {
                        console.warn('[ReinforcersScreen] Failed to persist reordered slots to localStorage', e);
                      }
                    }

                    safeHaptic('impact', Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {
                    console.error('[ReinforcersScreen] Error reordering slots:', e);
                  }
                }}
                renderItem={(params) => {
                  const { item, drag, isActive, getIndex } = params as any;
                  const index = typeof getIndex === 'function' ? getIndex() : 0;
                  return (
                    <TouchableOpacity
                      style={[styles.slotItem, isActive && { backgroundColor: '#3D3D3D' }]}
                      onLongPress={drag}
                      delayLongPress={100}
                      activeOpacity={0.8}
                    >
                      <View style={styles.slotNumber}>
                        <Text style={styles.slotNumberText}>{index + 1}</Text>
                      </View>

                      {item.imageUri && (typeof item.imageUri === 'string') && (
                        (item.imageUri.startsWith('http') || item.imageUri.startsWith('file') || item.imageUri.startsWith('data:')) ? (
                          <Image source={{ uri: item.imageUri }} style={styles.slotImage} />
                        ) : (
                          <View style={[styles.slotImage, styles.emojiPlaceholder]}>
                            <Text style={styles.emojiText}>{item.imageUri}</Text>
                          </View>
                        )
                      )}

                      <View style={styles.slotInfo}>
                        <Text style={styles.slotName} numberOfLines={1}>{item.name}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.removeSlotButton}
                        onPress={() => {
                          // Debug: log the item and index details
                          console.log('[ReinforcersScreen] Remove button clicked for item:', { 
                            id: item.id, 
                            name: item.name, 
                            slot: item.slot, 
                            compactListIndex: index 
                          });
                          
                          // Use item.slot - 1 (0-indexed) to find the correct slot in selectedSlots array
                          const actualSlotIndex = item.slot > 0 ? item.slot - 1 : index;
                          console.log('[ReinforcersScreen] Calculated actualSlotIndex:', actualSlotIndex, 'from item.slot:', item.slot);
                          removeFromSlot(actualSlotIndex);
                        }}
                      >
                        <Text style={styles.removeSlotButtonText}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
                activationDistance={10}
                dragItemOverflow={true}
                contentContainerStyle={styles.draggableListContent}
              />
            )}
          </View>

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
              <TouchableOpacity onPress={() => { setModalVisible(false); reset(); setNewReinforcerCategory(reinforcerCategories?.[0]?.id || null); }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}

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

            {/* Category selection */}
            <ScrollView style={{ maxHeight: 180, marginVertical: 8 }}>
              {reinforcerCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.reinforcerItem, { marginVertical: 6, backgroundColor: newReinforcerCategory === cat.id ? '#333' : '#2D2D2D' }]}
                  onPress={() => setNewReinforcerCategory(cat.id)}
                >
                  <Text style={styles.reinforcerName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>{/* show count not necessary here */ ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
      {/* Delete Confirmation Modal (matches add modal style) */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setDeleteModalVisible(false); setDeleteTarget(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('reinforcers.deleteConfirm')}</Text>
              <TouchableOpacity onPress={() => { setDeleteModalVisible(false); setDeleteTarget(null); }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#ddd', marginBottom: 12 }}>{t('reinforcers.deleteMessage')}</Text>
            {deleteTarget?.name ? (
              <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 18 }}>{deleteTarget.name}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#3D3D3D', flex: 1, marginRight: 8 }]}
                onPress={() => { setDeleteModalVisible(false); setDeleteTarget(null); }}
              >
                <Text style={styles.submitButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 8 }]}
                onPress={async () => {
                  if (!deleteTarget) return;
                  const id = deleteTarget.id;
                  setDeleteModalVisible(false);
                  setDeleteTarget(null);
                  await performDeleteReinforcer(id);
                }}
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
  headerSpacer: {
    height: 96,
  },
  categoryFilter: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    position: 'relative',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2D2D2D',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  categoryChipActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
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
  skillsList: {
    paddingHorizontal: 16,
  },
  addIcon: {
    fontSize: 20,
    color: '#4285F4',
    fontWeight: 'bold',
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
  reinforcersList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reinforcerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 2,
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
    position: 'relative',
    paddingRight: 68, // leave room for absolute-positioned delete button
  },
  reinforcerItemClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  reinforcerImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 12,
  },
  reinforcerInfo: {
    flex: 1,
  },
  reinforcerName: {
    fontSize: 14,
    color: '#E5E5E5',
    flex: 1,
  },
  reinforcerSlotBadge: {
    fontSize: 11,
    color: '#4285F4',
    marginTop: 4,
    fontWeight: '500',
  },
  deleteButton: {
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
    marginTop: 8,
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
  emojiPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D2D2D',
  },
  emojiText: {
    fontSize: 16,
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
  draggableListContent: {
    paddingBottom: 8,
  },
});

export default ReinforcersScreen;
