import React, { useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';

type Props = {
  embedSrc: string; // full embed src e.g. https://www.youtube.com/embed/ID?params
  title?: string;
};

function toWatchUrl(embedSrc: string) {
  try {
    // Try to extract video id from common embed patterns
    const m = embedSrc.match(/embed\/([A-Za-z0-9_-]+)/);
    if (m && m[1]) return `https://www.youtube.com/watch?v=${m[1]}`;
    // fallback: return the original
    return embedSrc;
  } catch (e) {
    return embedSrc;
  }
}

const VideoEmbed: React.FC<Props> = ({ embedSrc, title = 'Video' }) => {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      // inject centered iframe HTML and scale to 50% width while keeping 16:9 aspect ratio
      const html = `
        <div style="width:100%;display:flex;justify-content:center;">
          <div style=\"width:50%;position:relative;padding-bottom:56.25%;height:0;overflow:hidden;\">
            <iframe src=\"${embedSrc}\" title=\"${title}\" style=\"position:absolute;top:0;left:0;width:100%;height:100%;border:0;\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe>
          </div>
        </div>`;
      // set innerHTML
      containerRef.current.innerHTML = html;
    }
  }, [embedSrc, title]);

  if (Platform.OS === 'web') {
    return <View style={styles.webWrapper as any} ref={containerRef} />;
  }

  // Native fallback: show a link that opens the video in the external browser
  const watchUrl = toWatchUrl(embedSrc);

  return (
    <View style={styles.nativeWrapper}>
      <TouchableOpacity onPress={() => Linking.openURL(watchUrl)} style={styles.openButton}>
        <Text style={styles.openText}>Videoyu aç</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Video mobilde dış tarayıcıda açılır.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  webWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  nativeWrapper: {
    width: '50%',
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  openButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  openText: { color: '#fff', fontWeight: '600' },
  note: { marginTop: 8, color: '#9CA3AF', fontSize: 12 },
});

export default VideoEmbed;
