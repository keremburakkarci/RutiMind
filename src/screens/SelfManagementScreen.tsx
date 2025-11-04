import React from 'react';
import { useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import HeaderTitle from '../components/SharedHeader';
// This screen relies on GlobalTopActions for back navigation
// navigation types intentionally unused (GlobalTopActions handles back navigation)
import VideoEmbed from '../components/VideoEmbed';

const STEP_TITLES = [
  'Kendine Ön Uyaran Verme',
  'Kendine Yönerge Verme',
  'Kendini İzleme',
  'Kendini Değerlendirme',
  'Kendini Pekiştirme',
];

// Provided embed for step 1
const VIDEO_URLS: Array<string | null> = [
  'https://www.youtube.com/embed/BJ-W10EDyKw?si=ysyr3yb0V2HGOF3n',
  null,
  null,
  null,
  null,
];

const SelfManagementScreen: React.FC = () => {
  // navigation not needed here because GlobalTopActions provides back navigation

  // On web ensure the page is scrollable (some global styles may set overflow:hidden).
  useEffect(() => {
    if (Platform.OS === 'web' && (globalThis as any).document) {
      const doc: any = (globalThis as any).document;
      const prev = doc.body?.style?.overflow;
      const prevHtml = doc.documentElement?.style?.overflow;
      if (doc.body && doc.body.style) doc.body.style.overflow = 'auto';
      if (doc.documentElement && doc.documentElement.style) doc.documentElement.style.overflow = 'auto';
      return () => {
        if (doc.body && doc.body.style) doc.body.style.overflow = prev || '';
        if (doc.documentElement && doc.documentElement.style) doc.documentElement.style.overflow = prevHtml || '';
      };
    }
    return undefined;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <HeaderTitle>Kendini Yönetme Stratejileri</HeaderTitle>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {STEP_TITLES.map((title, idx) => (
          <View key={title} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{`${idx + 1}. ${title}`}</Text>
            <Text style={styles.stepDesc}>
              Bu adımda <Text style={styles.stepDescBold}>{title}</Text> sürecinin eğitim videosu yer almaktadır.
            </Text>
            {VIDEO_URLS[idx] ? (
              <VideoEmbed embedSrc={VIDEO_URLS[idx] as string} title={title} fullWidth={idx === 0} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>Video yakında eklenecek.</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d2d', marginTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', position: 'relative' },
  back: { color: '#fff', marginRight: 12 },
  headerText: { flexDirection: 'column' },
  headerTextCentered: { flex: 1, alignItems: 'flex-start', marginLeft: 0 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  content: { padding: 20 },
  stepCard: { marginBottom: 20, backgroundColor: '#0b1220', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#21303f' },
  stepTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  stepDesc: { color: '#9ca3af', marginTop: 8 },
  stepDescBold: { color: '#9ca3af', fontWeight: '700' },
  placeholderBox: { height: 200, borderRadius: 8, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  placeholderText: { color: '#9CA3AF' },
});

export default SelfManagementScreen;
