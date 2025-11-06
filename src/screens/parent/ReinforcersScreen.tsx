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
  Alert,
  Modal,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import GlobalTopActions from '../../components/GlobalTopActions';
import HeaderTitle from '../../components/SharedHeader';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { reinforcerCategories, allReinforcers as defaultReinforcers } from '../../../data/reinforcersData';
import { loadSelectedReinforcersForUser, saveSelectedReinforcersForUser } from '../../utils/userPersistence';
import { useAuthStore } from '../../store/authStore';
import { getAllReinforcers, insertReinforcer, updateReinforcer, deleteReinforcer as deleteReinforcerFromDB } from '../../services/database';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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

  // Helper to detect whether a string is a valid image URI (data URL, http(s), file path, or filename)
  const isLikelyImageUri = (uri?: string | null) => {
    if (!uri) return false;
    try {
      const s = String(uri);
      return s.startsWith('data:') || s.startsWith('http') || s.startsWith('file:') || s.startsWith('/') || /\.(png|jpe?g|gif|webp)$/i.test(s);
    } catch (e) { return false; }
  };

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
  const [isLoadingUserData, setIsLoadingUserData] = React.useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState(false);
  const [uploadingReinforcerId, setUploadingReinforcerId] = useState<string | null>(null);
  
  // CRITICAL FIX: Track loaded user ID to prevent auto-save during user switch
  const [loadedUserId, setLoadedUserId] = React.useState<string | null>(null);

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

  // Load selected slots when user changes (so selections are per-account)
  const authUser = useAuthStore(state => state.user);
  useEffect(() => {
    let mounted = true;
    const uid = authUser?.uid;
    
    console.log('[ReinforcersScreen] 🔄 Load effect triggered, user:', uid || 'NO USER');
    
    // CRITICAL: Check if user changed - if same user, don't reload!
    if (uid === loadedUserId) {
      console.log('[ReinforcersScreen] ⏭️ Same user, skipping reload');
      return;
    }
    
    setIsLoadingUserData(true);
    setHasLoadedInitialData(false); // Reset on user change
    console.log('[ReinforcersScreen] 🔒 Set isLoadingUserData=true, hasLoadedInitialData=false');
    
    const fn = async () => {
      try {
        console.log('[ReinforcersScreen] 📥 Starting load for user:', uid || 'NO USER');
        
        if (!uid) {
          // No user: clear per-user slots
          console.log('[ReinforcersScreen] ❌ No user, clearing slots');
          setSelectedSlots(Array(MAX_SLOTS).fill(null));
          if (mounted) {
            console.log('[ReinforcersScreen] 🔓 Unlocking after no-user clear');
            setLoadedUserId(null);
            setIsLoadingUserData(false);
            setHasLoadedInitialData(true);
          }
          return;
        }

        const saved = await loadSelectedReinforcersForUser(uid);
        console.log('[ReinforcersScreen] 📦 Loaded data for user', uid, ':', saved);
        
        if (mounted) {
          if (saved && Array.isArray(saved.selectedSlots)) {
            // Normalize length
            const arr = Array(MAX_SLOTS).fill(null);
            for (let i = 0; i < Math.min(saved.selectedSlots.length, MAX_SLOTS); i++) {
              const v = saved.selectedSlots[i];
              if (v && typeof v === 'object' && v.id) arr[i] = v;
            }
            const count = arr.filter(x => x !== null).length;
            console.log('[ReinforcersScreen] ✅ Setting', count, 'slots from saved data');
            setSelectedSlots(arr as (Reinforcer | null)[]);
          } else {
            // No per-user saved selection: clear slots so we don't leak global state
            console.log('[ReinforcersScreen] 🗑️ No saved data, clearing slots');
            setSelectedSlots(Array(MAX_SLOTS).fill(null));
          }
          console.log('[ReinforcersScreen] 🔓 Unlocking after successful load');
          setLoadedUserId(uid); // Mark this user as loaded
          setIsLoadingUserData(false);
          setHasLoadedInitialData(true);
        }
      } catch (e) {
        console.warn('[ReinforcersScreen] ⚠️ load per-user slots failed', e);
        if (mounted) {
          console.log('[ReinforcersScreen] 🔓 Unlocking after error');
          setLoadedUserId(uid || null);
          setIsLoadingUserData(false);
          setHasLoadedInitialData(true);
        }
      }
    };
    fn();
    return () => { 
      console.log('[ReinforcersScreen] 🧹 Cleanup: unmounting load effect');
      mounted = false; 
    };
  }, [authUser, loadedUserId]);

  // Debug: Log every selectedSlots change
  useEffect(() => {
    const count = selectedSlots.filter(s => s !== null).length;
    console.log('[ReinforcersScreen] 📊 selectedSlots changed:', count, 'filled slots');
  }, [selectedSlots]);

  // Auto-persist selected slots per-user whenever they change
  // This ensures selections are immediately saved as the user works
  useEffect(() => {
    console.log('[ReinforcersScreen] 💾 Auto-save effect triggered:', {
      isLoadingUserData,
      hasLoadedInitialData,
      authUser: authUser?.uid,
      loadedUserId,
      slotsCount: selectedSlots.filter(s => s !== null).length
    });
    
    // Don't save while we're loading user data (race condition prevention)
    if (isLoadingUserData) {
      console.log('[ReinforcersScreen] ❌ Skipping auto-save: still loading user data');
      return;
    }
    
    // Don't save until initial data load is complete
    if (!hasLoadedInitialData) {
      console.log('[ReinforcersScreen] ❌ Skipping auto-save: initial data not loaded yet');
      return;
    }
    
    // CRITICAL: Don't save if user changed but load hasn't completed yet!
    if (authUser?.uid !== loadedUserId) {
      console.log('[ReinforcersScreen] ❌ Skipping auto-save: user changed, waiting for load');
      return;
    }
    
    // CRITICAL FIX: Add debounce to prevent saving empty data during rapid load/unload cycles
    const saveTimer = setTimeout(() => {
      (async () => {
        try {
          const uid = authUser?.uid;
          if (!uid) {
            console.log('[ReinforcersScreen] ❌ Skipping auto-save: no user');
            return;
          }
          
          console.log('[ReinforcersScreen] ✅ Auto-saving slots for user:', uid);
          const toSave = { selectedSlots };
          await saveSelectedReinforcersForUser(uid, toSave);
          console.log('[ReinforcersScreen] ✅ Auto-save completed');
        } catch (e) {
          console.warn('[ReinforcersScreen] auto-persist per-user slots failed', e);
        }
      })();
    }, 150); // 150ms debounce to ensure load completes before save
    
    return () => clearTimeout(saveTimer);
  }, [selectedSlots, authUser, loadedUserId, isLoadingUserData, hasLoadedInitialData]);

  // Filter reinforcers by search only (we'll group by category separately)
  const filteredReinforcers = React.useMemo(() => {
    if (!searchQuery.trim()) return reinforcers;
    const query = searchQuery.toLowerCase();
    return reinforcers.filter(r => r.name.toLowerCase().includes(query));
  }, [reinforcers, searchQuery]);

  const loadReinforcers = async () => {
    try {
  // Check if we're on web platform by detecting the DOM (SQLite not available on web)
  if (typeof (globalThis as any).document !== 'undefined') {
        console.log('[ReinforcersScreen] Web platform detected, using mock data or localStorage');
        try {
          const saved = typeof globalThis !== 'undefined' && (globalThis as any).localStorage ? (globalThis as any).localStorage.getItem('reinforcers_web') : null;
          if (saved) {
            const parsed = JSON.parse(saved) as Reinforcer[];
            const unique = dedupeReinforcers(parsed);
            console.log('[ReinforcersScreen] 📚 Loaded reinforcers library from localStorage, count:', unique.length);
            setReinforcers(unique);

            // Do NOT populate slots here; slots are managed by per-user load effect
            return;
          }

          // Use default reinforcers as fallback on web
          const mockData = defaultReinforcers.map(r => ({
            id: r.id,
            name: r.name,
            // Do not store emoji into imageUri — keep emoji as `icon` for fallback rendering
            imageUri: '',
            icon: r.icon || '',
            slot: 0, // not assigned to slots yet
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            categoryId: (r as any).categoryId,
          }));
          setReinforcers(dedupeReinforcers(mockData as unknown as Reinforcer[]));
          console.log('[ReinforcersScreen] 📚 Set mock reinforcers count:', (mockData || []).length);
          // Do NOT populate slots here; slots are managed by per-user load effect
          return;
        } catch (e) {
          console.warn('[ReinforcersScreen] ⚠️ Error reading localStorage, falling back to defaults', e);
          const mockData = defaultReinforcers.map(r => ({
            id: r.id,
            name: r.name,
            // Keep emoji separate in `icon`, leave imageUri empty so we can enrich with Unsplash
            imageUri: '',
            icon: r.icon || '',
            slot: 0,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            categoryId: (r as any).categoryId,
          }));
          // Enrich mock data with a representative Unsplash image
          const enrichedMock = mockData.map(m => ({ ...m, imageUri: `https://source.unsplash.com/featured/?${encodeURIComponent(m.name.split(' ').slice(0,3).join(' '))}` }));
          setReinforcers(dedupeReinforcers(enrichedMock as unknown as Reinforcer[]));
          // Do NOT populate slots here; slots are managed by per-user load effect
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
        let reinforcersData: Reinforcer[] = seededData.map(r => ({
          id: r.id,
          name: r.name,
          // Keep actual image URI from DB only; fallback icon stored separately for emoji
          imageUri: r.image_uri || '',
          icon: defaultReinforcers.find(d => d.id === r.id)?.icon || '',
          slot: r.slot,
          order: r.order_index,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        }));
        // Enrich with Unsplash for those without images
        const enriched = reinforcersData.map(r => ({ ...r, imageUri: isLikelyImageUri(r.imageUri) ? r.imageUri : `https://source.unsplash.com/featured/?${encodeURIComponent(r.name.split(' ').slice(0,3).join(' '))}` }));
        setReinforcers(dedupeReinforcers(enriched));
        // NOTE: We intentionally do NOT persist these Unsplash-derived thumbnails.
        // They are for temporary display only and can be changed by the teacher.
      } else {
        let reinforcersData: Reinforcer[] = data.map(r => ({
          id: r.id,
          name: r.name,
          // If DB has no image, leave imageUri empty and expose icon separately
          imageUri: r.image_uri || '',
          icon: defaultReinforcers.find(d => d.id === r.id)?.icon || '',
          slot: r.slot,
          order: r.order_index,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        }));
        const enriched2 = reinforcersData.map(r => ({ ...r, imageUri: isLikelyImageUri(r.imageUri) ? r.imageUri : `https://source.unsplash.com/featured/?${encodeURIComponent(r.name.split(' ').slice(0,3).join(' '))}` }));
        setReinforcers(dedupeReinforcers(enriched2));
        // NOTE: We intentionally do NOT persist these Unsplash-derived thumbnails.
        // They are shown only in-memory so teachers can edit/change them later.
      }
      // Do NOT populate slots from the database-level slot field. Slot
      // assignments are user-specific and must be loaded via per-user
      // persistence (`selectedReinforcers_<uid>`). The per-user load effect
      // will handle loading slots when the user is authenticated.
    } catch (error) {
      console.error('[ReinforcersScreen] ⚠️ Error loading reinforcers:', error);
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

  // Image picker for reinforcers (library items)
  const pickReinforcerImage = async (reinforcerId: string) => {
    try {
      setUploadingReinforcerId(reinforcerId);
  if (typeof (globalThis as any).document !== 'undefined') {
    // Create a hidden file input and trigger it
    const input = (globalThis as any).document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files && e.target.files[0];
          if (!file) {
            setUploadingReinforcerId(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const dataUrl = reader.result as string;
              // Update in-memory state
              const next = (reinforcers || []).map(r => r.id === reinforcerId ? { ...r, imageUri: dataUrl } : r);
              setReinforcers(dedupeReinforcers(next));
                  // If this reinforcer is currently assigned to any slot, update selectedSlots so the slot shows the new image
                  setSelectedSlots(prev => prev.map(s => s && s.id === reinforcerId ? { ...s, imageUri: dataUrl } : s));
              // Persist library to localStorage (strip slots)
              try {
                const cleaned = next.map(n => ({ ...n, slot: 0 }));
                (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(cleaned));
              } catch (e) { console.warn('[ReinforcersScreen] Failed to persist reinforcers to localStorage', e); }
            } catch (err) {
              console.warn('[ReinforcersScreen] web image read error', err);
            } finally {
              setUploadingReinforcerId(null);
            }
          };
          reader.onerror = () => { setUploadingReinforcerId(null); };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Lütfen fotoğraf galerinize erişim izni verin.');
        setUploadingReinforcerId(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        setUploadingReinforcerId(null);
        return;
      }

      // Resize/crop to square thumbnail
      const asset = result.assets[0];
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Update DB and local state
      if (Platform.OS !== 'web') {
        try {
          await updateReinforcer(reinforcerId, { image_uri: manip.uri });
        } catch (e) {
          console.warn('[ReinforcersScreen] Failed to update reinforcer image in DB', e);
        }
      }

      const next = (reinforcers || []).map(r => r.id === reinforcerId ? { ...r, imageUri: manip.uri } : r);
      setReinforcers(dedupeReinforcers(next));
  // Update any selected slot that references this reinforcer so the slot shows the thumbnail
  setSelectedSlots(prev => prev.map(s => s && s.id === reinforcerId ? { ...s, imageUri: manip.uri } : s));
      setUploadingReinforcerId(null);
      await safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[ReinforcersScreen] pickReinforcerImage error', error);
      Alert.alert(t('errors.title'), t('errors.imagePicker'));
      setUploadingReinforcerId(null);
    }
  };

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
  if (typeof (globalThis as any).document !== 'undefined') {
        // On web, just update local state — dedupe to avoid duplicate keys
        const next = dedupeReinforcers([...(reinforcers || []), newReinforcer]);
        console.log('[ReinforcersScreen] Added (web) reinforcer:', newReinforcer, 'total now', next.length);
        setReinforcers(next);
        try {
          const cleaned = (next || []).map(n => ({ ...n, slot: 0 }));
          (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(cleaned));
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
      // IMPORTANT: do NOT persist slot assignments into the global `reinforcers_web`
      // key because slots must be per-user. Persist slot assignments per-user instead.
      if (Platform.OS === 'web') {
        // Update local reinforcers array WITHOUT writing slot into the stored library
        const next = (reinforcers || []).map(r => r.id === reinforcer.id ? { ...r, updatedAt: new Date() } : r);
        const uniqueNext = dedupeReinforcers(next);
        setReinforcers(uniqueNext);

        // Persist selected slots per-user (if signed in)
        try {
          const uid = useAuthStore.getState().user?.uid;
          if (uid) {
            await saveSelectedReinforcersForUser(uid, { selectedSlots: newSlots });
          } else {
            // No user: do not persist slot assignments into the global library storage.
            // Keep slots ephemeral in local state only.
          }
        } catch (e) {
          console.warn('[ReinforcersScreen] Failed to persist per-user slot update', e);
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
  // Keep removeFromSlot available for programmatic removals but avoid
  // eslint warning when its UI button is intentionally removed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const next = (reinforcers || []).map(r => r.id === reinforcer.id ? { ...r, updatedAt: new Date() } : r);
        const uniqueNext = dedupeReinforcers(next);
        setReinforcers(uniqueNext);

        // Persist selected slots per-user (if signed in)
        try {
          const uid = useAuthStore.getState().user?.uid;
          if (uid) {
            const newSlots = [...selectedSlots];
            newSlots[slotIndex] = null;
            await saveSelectedReinforcersForUser(uid, { selectedSlots: newSlots });
          } else {
            // No user: do not persist slot removals to the global library storage.
          }
        } catch (e) {
          console.warn('[ReinforcersScreen] Failed to persist per-user slot removal', e);
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

  // Reference the function to avoid unused-variable/compiler warnings
  // (UI remove button was intentionally removed but keep function for programmatic use)
  void removeFromSlot;

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
  if (typeof document === 'undefined') {
        await deleteReinforcerFromDB(id);
      }

      const beforeCount = (reinforcers || []).length;
      const next = dedupeReinforcers((reinforcers || []).filter(r => r.id !== id));
      console.log('[ReinforcersScreen] performDeleteReinforcer: before=', beforeCount, 'after=', next.length, 'removedId=', id);
      setReinforcers(next);
      setSelectedSlots(prev => prev.map(s => (s?.id === id ? null : s)));

      // Persist on web
      try {
        // Persist library only (strip slot assignments) so we don't store user-specific slots globally
        const cleaned = next.map(n => ({ ...n, slot: 0 }));
        (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(cleaned));
      } catch (e) {
        console.warn('[ReinforcersScreen] Failed to persist deletion to localStorage', e);
      }

      safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[ReinforcersScreen] Error deleting reinforcer:', error);
      Alert.alert(t('errors.title'), t('errors.generic'));
    }
  };

  // Save slots configuration - now this just confirms to the user that data is saved
  // The actual saving happens automatically in the useEffect above
  const handleSave = async () => {
    console.log('[ReinforcersScreen] handleSave called');
    const filledSlots = selectedSlots.filter(s => s !== null);
    console.log('[ReinforcersScreen] Filled slots count:', filledSlots.length);
    
    if (filledSlots.length === 0) {
      Alert.alert(
        t('errors.validation', { defaultValue: 'Uyarı' }), 
        t('reinforcers.noSlotsSelected', { defaultValue: 'Henüz pekiştireç seçmediniz.' })
      );
      return;
    }

    // Data is already saved automatically, just show confirmation
    const uid = authUser?.uid;
    if (!uid) {
      Alert.alert(
        t('errors.title', { defaultValue: 'Hata' }),
        'Lütfen önce giriş yapın.'
      );
      return;
    }

    safeHaptic('notification', Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t('success.title', { defaultValue: 'Bilgi' }), 
      `Seçimleriniz otomatik olarak hesabınıza kaydedildi.\n\n${filledSlots.length} pekiştireç seçili.\n\nBu pekiştireçler öğrenci ekranında gösterilecektir.`
    );
  };

  // Note: individual slot rendering for empty placeholders removed — we render only filled slots now

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
        {/* Left Panel - Reinforcers Library */}
        <View style={styles.leftPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderContent}>
              <View style={styles.panelIconWrapper}>
                <Text style={styles.panelIcon}>🎁</Text>
              </View>
              <Text style={styles.panelHeaderTitle}>{t('reinforcers.library')}</Text>
            </View>
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
                                  {/* Thumbnail or emoji placeholder */}
                                  {isLikelyImageUri(reinforcer.imageUri) ? (
                                    <Image source={{ uri: reinforcer.imageUri as string }} style={styles.reinforcerImage} />
                                  ) : (
                                    <View style={[styles.reinforcerImage, styles.emojiPlaceholder]}>
                                      <Text style={styles.emojiText}>{(reinforcer as any).icon || '🎁'}</Text>
                                    </View>
                                  )}

                                  <View style={styles.reinforcerInfo}>
                                    <Text style={styles.reinforcerName}>{String(reinforcer.name || '')}</Text>
                                    {/* optional small slot badge */}
                                    {reinforcer.slot ? <Text style={styles.reinforcerSlotBadge}>{`Slot ${reinforcer.slot}`}</Text> : null}
                                  </View>

                                  <Text style={styles.addIcon}>+</Text>
                                </TouchableOpacity>

                                {/* Upload button (library item only) */}
                                <TouchableOpacity
                                  style={styles.uploadButton}
                                  activeOpacity={0.8}
                                  onPress={(e) => {
                                    if (Platform.OS === 'web') e?.stopPropagation?.();
                                    pickReinforcerImage(reinforcer.id);
                                  }}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  accessibilityLabel={t('reinforcers.uploadImage')}
                                >
                                  {uploadingReinforcerId === reinforcer.id ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                  ) : (
                                    <Text style={styles.uploadButtonText}>📷</Text>
                                  )}
                                </TouchableOpacity>

                                {!defaultReinforcerIds.has(reinforcer.id) && (
                                  <TouchableOpacity
                                    style={styles.deleteButton}
                                    activeOpacity={0.7}
                                    onPress={(e) => {
                                      console.log('[ReinforcersScreen] Delete button pressed for:', reinforcer.id, reinforcer.name);
                                  if (typeof (globalThis as any).document !== 'undefined') {
                                        e?.stopPropagation?.();
                                      }
                                      confirmDeleteReinforcer(reinforcer.id, reinforcer.name);
                                    }}
                                    onPressIn={(e) => {
                                      // Extra handler for web reliability
                                  if (typeof (globalThis as any).document !== 'undefined') {
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
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderContent}>
              <View style={styles.panelIconWrapper}>
                <Text style={styles.panelIcon}>✓</Text>
              </View>
              <Text style={styles.panelHeaderTitle}>{t('reinforcers.slots')}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selectedSlots.filter(s => s !== null).length}/{MAX_SLOTS}
              </Text>
            </View>
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
                onDragEnd={async ({ data }) => {
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

                    // Persist DB updates on native. On web persist selected slots per-user
                if (typeof (globalThis as any).document === 'undefined') {
                      data.forEach((r, idx) => {
                        updateReinforcer(r.id, { slot: idx + 1, order_index: 0 }).catch(e => console.error(e));
                      });
                    } else {
                      try {
                        const uid = useAuthStore.getState().user?.uid;
                        if (uid) {
                          const slotsArr = Array(MAX_SLOTS).fill(null);
                          data.forEach((r, idx) => {
                            slotsArr[idx] = { ...r, slot: idx + 1, updatedAt: new Date() } as Reinforcer;
                          });
                          await saveSelectedReinforcersForUser(uid, { selectedSlots: slotsArr });
                        } else {
                          // Fallback: persist library only (strip slot assignments) into reinforcers_web
                          try {
                            const cleaned = uniqueUpdated.map(u => ({ ...u, slot: 0 }));
                            (globalThis as any).localStorage && (globalThis as any).localStorage.setItem('reinforcers_web', JSON.stringify(cleaned));
                          } catch (e) { /* ignore */ }
                        }
                      } catch (e) {
                        console.warn('[ReinforcersScreen] Failed to persist reordered slots per-user', e);
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
                        <Text style={styles.slotNumberText}>{(item as any).slot ? (item as any).slot : (index + 1)}</Text>
                      </View>

                      {/* Show image (or emoji placeholder) for the sloted reinforcer */}
                      {isLikelyImageUri((item as any).imageUri) ? (
                        <Image source={{ uri: (item as any).imageUri as string }} style={styles.slotImage} />
                      ) : (
                        <View style={[styles.slotImage, styles.emojiPlaceholder]}>
                          <Text style={styles.emojiText}>{(item as any).icon || '🎁'}</Text>
                        </View>
                      )}

                      <View style={styles.slotInfo}>
                        <Text style={styles.slotName} numberOfLines={1}>{item.name}</Text>
                      </View>

                      {/* Remove / clear this slot */}
                      <TouchableOpacity
                        style={styles.removeSlotButton}
                        activeOpacity={0.8}
                        onPress={() => removeFromSlot(((item as any).slot ? (item as any).slot - 1 : index))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={t('reinforcers.removeFromSlot')}
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
            <Text style={styles.saveButtonText}>
              {t('reinforcers.save', { defaultValue: 'Öğrenci İçin Hazır ✓' })}
            </Text>
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
    backgroundColor: 'rgba(13, 27, 42, 0.6)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.3)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(100, 126, 234, 0.4)',
    borderColor: 'rgba(100, 126, 234, 0.6)',
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
    backgroundColor: 'rgba(13, 27, 42, 0.5)',
    borderRadius: 8,
    position: 'relative',
    paddingRight: 68,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.2)',
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
    color: '#667eea',
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
  uploadButton: {
    position: 'absolute',
    right: 44,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  uploadButtonText: {
    fontSize: 16,
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
    backgroundColor: 'rgba(13, 27, 42, 0.4)',
  },
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 126, 234, 0.2)',
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
    backgroundColor: 'rgba(13, 27, 42, 0.5)',
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 70,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.2)',
  },
  slotNumber: {
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
