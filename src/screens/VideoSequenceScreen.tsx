import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import GlobalTopActions from '../components/GlobalTopActions';
import VideoEmbed from '../components/VideoEmbed';

type VideoSequenceRouteProp = RouteProp<RootStackParamList, 'VideoSequence'>;

const VideoSequenceScreen: React.FC = () => {
  const route = useRoute<VideoSequenceRouteProp>();
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
    <View style={styles.container}>
      {/* Global top actions with back button */}
      <GlobalTopActions title={screenTitle} showBack />
      
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.gradientBackground}
      >
        {/* Spacer to avoid overlapping with absolute top bar */}
        <View style={styles.headerSpacer} />

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
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  gradientBackground: {
    flex: 1,
  },
  headerSpacer: { 
    height: 96 
  },
  content: { 
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  stepCard: { 
    marginBottom: 20, 
    backgroundColor: 'rgba(13, 27, 42, 0.8)',
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(100, 126, 234, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stepTitle: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  stepDesc: { 
    color: '#b8c1d9',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  placeholderBox: { 
    height: 200, 
    borderRadius: 12, 
    backgroundColor: 'rgba(17, 24, 39, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 126, 234, 0.15)',
  },
  placeholderText: { 
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default VideoSequenceScreen;
