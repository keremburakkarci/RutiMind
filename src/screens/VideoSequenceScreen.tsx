import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { RootStackParamList, RootStackNavigationProp } from '../navigation/types';
import VideoEmbed from '../components/VideoEmbed';

type VideoSequenceRouteProp = RouteProp<RootStackParamList, 'VideoSequence'>;

const VideoSequenceScreen: React.FC = () => {
  const route = useRoute<VideoSequenceRouteProp>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { screenTitle, steps } = route.params;

  // Ensure page is scrollable on web (some global styles may set overflow: hidden)
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
        <TouchableOpacity onPress={() => navigation.navigate('Education' as never)}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{screenTitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {steps.map((s, idx) => (
          <View key={`${s.title}-${idx}`} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{`${idx + 1}. ${s.title}`}</Text>
            <Text style={styles.stepDesc}>{`Bu adımda ${s.title} sürecinin eğitim videosu yer almaktadır.`}</Text>
            {s.videoUrl ? (
              <VideoEmbed embedSrc={s.videoUrl} title={s.title} />
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
  headerText: { flexDirection: 'column' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  back: { color: '#fff', marginRight: 12 },
  content: { padding: 20 },
  stepCard: { marginBottom: 20, backgroundColor: '#0b1220', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#21303f' },
  stepTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  stepDesc: { color: '#9ca3af', marginTop: 8 },
  placeholderBox: { height: 200, borderRadius: 8, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  placeholderText: { color: '#9CA3AF' },
});

export default VideoSequenceScreen;
