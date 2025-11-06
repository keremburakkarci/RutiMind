// Session Complete Screen - Congratulations screen

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { saveSelectedReinforcersForUser } from '../../utils/userPersistence';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions, useRoute } from '@react-navigation/native';
import MainMenuButton from '../../components/MainMenuButton';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { getResponsesByDate, ResponseRecord } from '../../services/responseService';
import { loadSelectedReinforcersForUser } from '../../utils/userPersistence';
import type { SessionCompleteScreenRouteProp } from '../../navigation/types';

const SessionCompleteScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Top main menu button handles its own overlay/confirmation; no separate bottom main menu here.

  // Fetch responses for today's session and show summary
  const authUser = useAuthStore(state => state.user);
  const route = useRoute<SessionCompleteScreenRouteProp>();
  const { sessionStartTime, sessionEndTime } = route.params || {};
  const [responses, setResponses] = useState<ResponseRecord[] | null>(null);
  const [loadingResponses, setLoadingResponses] = useState<boolean>(true);
  const [selectedReinforcers, setSelectedReinforcers] = useState<any[] | null>(null);
  const [loadingReinforcers, setLoadingReinforcers] = useState<boolean>(false);
  const [showReinforcerModal, setShowReinforcerModal] = useState<boolean>(false);

  // Handle selecting a reinforcer from the modal: confirm then navigate
  const handleReinforcerSelect = (slot: any) => {
    if (!slot) return;
    const msg = `${slot.name} seçtiğine emin misin?`;
    try {
      if (Platform.OS === 'web' && typeof (globalThis as any).confirm === 'function') {
        const ok = (globalThis as any).confirm(msg);
        setShowReinforcerModal(false);
        if (ok) {
          (navigation as any).navigate('EarnedReinforcer', { reinforcer: slot });
        } else {
          // Open parent Reinforcers tab so teacher can edit selections
          (navigation as any).navigate('ParentTabs', { screen: 'Reinforcers' });
        }
        return;
      }

      Alert.alert(
        'Onay',
        msg,
        [
          { text: 'Hayır', style: 'cancel', onPress: () => {
            setShowReinforcerModal(false);
            try { (navigation as any).navigate('ParentTabs', { screen: 'Reinforcers' }); } catch (e) { /* ignore */ }
          } },
          { text: 'Evet', onPress: () => {
            setShowReinforcerModal(false);
            try { (navigation as any).navigate('EarnedReinforcer', { reinforcer: slot }); } catch (e) { /* ignore */ }
          } }
        ],
        { cancelable: false }
      );
    } catch (e) {
      console.warn('[SessionComplete] reinforcer select failed', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const uid = authUser?.uid || 'guest';
        const sessionDate = new Date().toISOString().split('T')[0];
        let rows = await getResponsesByDate(uid, sessionDate);
        // If the caller passed explicit session start/end timestamps, narrow
        // the results to responses recorded during that interval. This
        // prevents unrelated responses from other sessions on the same day
        // from showing up in the summary.
        if (rows && sessionStartTime && sessionEndTime) {
          rows = rows.filter(r => (r.timestamp || 0) >= sessionStartTime && (r.timestamp || 0) <= sessionEndTime);
        }
        if (!mounted) return;
        setResponses(rows || []);
      } catch (e) {
        console.warn('[SessionComplete] Failed to load responses', e);
        if (mounted) setResponses([]);
      } finally {
        if (mounted) setLoadingResponses(false);
      }
    })();

    return () => { mounted = false; };
  }, [authUser]);

  // Load teacher-selected reinforcers when the reinforcers modal is shown
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!showReinforcerModal) return;
      setLoadingReinforcers(true);
      try {
        const uid = authUser?.uid || 'guest';
        const data = await loadSelectedReinforcersForUser(uid);
        if (!mounted) return;
        // data may be an array or an object { selectedSlots: [...] } depending on where it was saved.
        // Normalize to an array of slots so the UI can render thumbnails and names.
        let normalized: any[] = [];
        if (Array.isArray(data)) normalized = data;
        else if (data && Array.isArray((data as any).selectedSlots)) normalized = (data as any).selectedSlots;
        else if (data && (typeof data === 'object')) {
          // Sometimes payload may be an object mapping indices to slot objects
          // try to coerce into an array by extracting numeric keys in order
          const keys = Object.keys(data).filter(k => !isNaN(Number(k))).sort((a, b) => Number(a) - Number(b));
          if (keys.length > 0) normalized = keys.map(k => (data as any)[k]);
        }
        setSelectedReinforcers(normalized);
      } catch (e) {
        console.warn('[SessionComplete] Failed to load selected reinforcers', e);
        if (mounted) setSelectedReinforcers([]);
      } finally {
        if (mounted) setLoadingReinforcers(false);
      }
    })();

    return () => { mounted = false; };
  }, [showReinforcerModal, authUser]);

  // Allow editing a selected slot's image from the modal (web/native)
  const pickImageForSlot = async (slotObj: any, index: number) => {
    if (!slotObj) return;
    try {
      const uid = authUser?.uid || 'guest';
      if (typeof (globalThis as any).document !== 'undefined') {
        const input = (globalThis as any).document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const next = (selectedReinforcers || []).slice();
            next[index] = { ...next[index], imageUri: dataUrl };
            setSelectedReinforcers(next);
            try { await saveSelectedReinforcersForUser(uid, { selectedSlots: next }); } catch (e) { console.warn(e); }
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Lütfen fotoğraf galerinize erişim izni verin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      const asset = result.assets[0];
      const manip = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 300, height: 300 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
      const next = (selectedReinforcers || []).slice();
      next[index] = { ...next[index], imageUri: manip.uri };
      setSelectedReinforcers(next);
      try { await saveSelectedReinforcersForUser(uid, { selectedSlots: next }); } catch (e) { console.warn(e); }
    } catch (e) {
      console.warn('[SessionComplete] pickImageForSlot failed', e);
    }
  };

  const summarized = useMemo(() => {
    if (!responses) return [] as ResponseRecord[];
    const map = new Map<string, ResponseRecord>();
    // Keep the latest response per skill (rows are ordered by timestamp asc)
    for (const r of responses) map.set(r.skillId, r);
    return Array.from(map.values());
  }, [responses]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        <MainMenuButton onPress={() => {
          try {
            if (Platform.OS === 'web' && typeof (globalThis as any).confirm === 'function') {
              const ok1 = (globalThis as any).confirm('Ana menüye dönmek istediğinize emin misiniz?');
              if (!ok1) return;
              const ok2 = (globalThis as any).confirm('Gerçekten çıkmak istediğinize emin misiniz? Bu işlemi onaylamak için tekrar "Evet"e basın.');
              if (!ok2) return;
              const top = (navigation.getParent() as any) || (navigation as any);
              top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
              return;
            }
            Alert.alert(
              'Emin misiniz?',
              'Ana menüye dönmek istediğinize emin misiniz?',
              [
                { text: 'Hayır', style: 'cancel' },
                { text: 'Evet', onPress: () => { const top = (navigation.getParent() as any) || (navigation as any); top.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })); } }
              ],
              { cancelable: false }
            );
          } catch (e) {
            console.error('[SessionComplete] main menu handler error', e);
          }
        }} />
        <View style={styles.content}>
          <LinearGradient
            colors={['#F39C12', '#E67E22']}
            style={styles.emojiGradient}
          >
            <Text style={styles.emoji}>🎉</Text>
          </LinearGradient>
          
          <Text style={styles.title}>{t('student.sessionComplete')}</Text>
          <Text style={styles.subtitle}>{t('student.sessionCompleteMessage')}</Text>

          {/* Session responses summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t('progress.sessionDetails') || 'Oturum Detayları'}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>{'Başlangıç:'}</Text>
              <Text style={styles.timeValue}>{sessionStartTime ? new Date(sessionStartTime).toLocaleString('tr-TR') : 'Bilinmiyor'}</Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>{'Bitiş:'}</Text>
              <Text style={styles.timeValue}>{sessionEndTime ? new Date(sessionEndTime).toLocaleString('tr-TR') : 'Bilinmiyor'}</Text>
            </View>
            {loadingResponses ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginTop: 12 }} />
            ) : (summarized.length === 0 ? (
              <Text style={styles.noResponsesText}>{t('progress.noDataAvailable') || 'Bu oturuma ait cevap bulunamadı.'}</Text>
            ) : (
              <View style={styles.table}>
                {summarized.map((r, idx) => (
                  <View key={r.skillId} style={styles.tableRow}>
                    <View style={styles.numberBox}>
                      <Text style={styles.numberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.tableSkill}>{r.skillName}</Text>
                    <View style={[styles.badge, r.response === 'yes' ? styles.badgeYes : r.response === 'no' ? styles.badgeNo : styles.badgeNeutral]}>
                      <Text style={styles.badgeText}>{r.response === 'yes' ? 'Evet' : r.response === 'no' ? 'Hayır' : 'Yanıt yok'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* (Removed debug label and top tabs — only bottom Pekiştireçler button remains) */}

          {/* Bottom-centered Reinforcers button (replaces previous bottom main menu button) */}
          <View style={styles.reinforcerFabWrapper}>
            <TouchableOpacity
              style={styles.reinforcerFab}
              onPress={() => setShowReinforcerModal(true)}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.reinforcerFabInner}>
                <Text style={styles.reinforcerFabText}>Pekiştireçler</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Reinforcers modal overlay */}
          <Modal
            visible={showReinforcerModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowReinforcerModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalHeader}>
                  <Text style={styles.summaryTitle}>{'Pekiştireçler'}</Text>
                </LinearGradient>
                <View style={styles.modalContent}>
                  {loadingReinforcers ? (
                    <ActivityIndicator color="#fff" />
                  ) : (!selectedReinforcers || selectedReinforcers.length === 0) ? (
                    <Text style={styles.noResponsesText}>{'Öğretmen tarafından seçilmiş pekiştireç bulunamadı.'}</Text>
                  ) : (
                    <View>
                      {/* Two rows: first 5 slots on top, next 5 on bottom. Only render filled slots. */}
                      <View style={styles.gridRow}>
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const slot = selectedReinforcers?.[idx];
                          if (!slot) return <View key={`empty-top-${idx}`} style={styles.gridEmpty} />;
                          return (
                            <TouchableOpacity key={`top-${idx}`} style={styles.slotBox} onPress={() => handleReinforcerSelect(slot)}>
                              <View style={styles.slotNumberBadge}><Text style={styles.slotNumberText}>{idx + 1}</Text></View>
                              <View>
                                {slot.imageUri ? (
                                  <Image source={{ uri: slot.imageUri }} style={styles.slotImage} />
                                ) : (
                                  <View style={styles.slotThumb}><Text style={styles.slotPlaceholderText}>+</Text></View>
                                )}
                                <TouchableOpacity style={styles.editIcon} onPress={() => pickImageForSlot(slot, idx)}>
                                  <Text style={styles.editIconText}>📷</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.slotLabel} numberOfLines={1}>{slot.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={[styles.gridRow, { marginTop: 12 }]}>
                        {Array.from({ length: 5 }).map((_, j) => {
                          const idx = 5 + j;
                          const slot = selectedReinforcers?.[idx];
                          if (!slot) return <View key={`empty-bot-${j}`} style={styles.gridEmpty} />;
                          return (
                            <TouchableOpacity key={`bot-${idx}`} style={styles.slotBox} onPress={() => handleReinforcerSelect(slot)}>
                              <View style={styles.slotNumberBadge}><Text style={styles.slotNumberText}>{idx + 1}</Text></View>
                              <View>
                                {slot.imageUri ? (
                                  <Image source={{ uri: slot.imageUri }} style={styles.slotImage} />
                                ) : (
                                  <View style={styles.slotThumb}><Text style={styles.slotPlaceholderText}>+</Text></View>
                                )}
                                <TouchableOpacity style={styles.editIcon} onPress={() => pickImageForSlot(slot, idx)}>
                                  <Text style={styles.editIconText}>📷</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.slotLabel} numberOfLines={1}>{slot.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => setShowReinforcerModal(false)} style={{ marginTop: 12, alignSelf: 'center' }}>
                    <LinearGradient colors={['#667eea', '#764ba2']} style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>{'Kapat'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </LinearGradient>
    </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emojiGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#F39C12',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'stretch',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  noResponsesText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  table: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)'
  },
  tableSkill: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  badgeYes: {
    backgroundColor: 'rgba(46,204,113,0.15)'
  },
  badgeNo: {
    backgroundColor: 'rgba(231,76,60,0.15)'
  },
  badgeNeutral: {
    backgroundColor: 'rgba(156,163,175,0.08)'
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  debugButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rawBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 6,
  },
  timeLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    width: 90,
    fontWeight: '600',
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  numberBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginHorizontal: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  tabButtonText: {
    color: '#C7C7D9',
    fontWeight: '700'
  },
  tabButtonTextActive: {
    color: '#FFFFFF'
  },
  reinforcersList: {
    width: '100%',
    marginTop: 12,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
  },
  slotThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  slotPlaceholderText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  slotName: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  /* Bottom Reinforcers modal trigger button styles */
  reinforcerFabWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  reinforcerFab: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 }
    })
  },
  reinforcerFabInner: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  reinforcerFabText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },

  /* Modal overlay for reinforcers (matches MainMenuButton gradient header) */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#0b0b12',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 14,
  },
  modalContent: {
    padding: 12,
  },
  reinforcersListInline: {
    width: '100%',
    marginTop: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridEmpty: {
    width: 72,
    height: 92,
  },
  slotBox: {
    width: 72,
    alignItems: 'center',
  },
  slotNumberBadge: {
    position: 'absolute',
    top: -8,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 2,
  },
  slotNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  slotImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginBottom: 6,
  },
  slotLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  editIcon: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
    zIndex: 3,
  },
  editIconText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default SessionCompleteScreen;
