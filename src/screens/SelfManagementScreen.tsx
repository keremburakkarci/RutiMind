import React from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet } from 'react-native';
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
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kendini Yönetme Stratejileri</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {STEP_TITLES.map((title, idx) => (
          <View key={title} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{`${idx + 1}. ${title}`}</Text>
            {VIDEO_URLS[idx] ? (
              <VideoEmbed embedSrc={VIDEO_URLS[idx] as string} title={title} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>Video yakında eklenecek.</Text>
              </View>
            )}
            <Text style={styles.stepDesc}>Bu adımda uygulama içindeki yönergeler ve örnekler gösterilecektir.</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { padding: 20 },
  stepCard: { marginBottom: 20, backgroundColor: '#0b1220', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#21303f' },
  stepTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  stepDesc: { color: '#9ca3af', marginTop: 8 },
  placeholderBox: { height: 200, borderRadius: 8, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  placeholderText: { color: '#9CA3AF' },
});

export default SelfManagementScreen;
