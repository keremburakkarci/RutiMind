import React, { useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';

type Props = {
  embedSrc: string; // full embed src e.g. https://www.youtube.com/embed/ID?params
  title?: string;
  fullWidth?: boolean; // when true render at 100% width instead of 50%
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

const VideoEmbed: React.FC<Props> = ({ embedSrc, title = 'Video', fullWidth = false }) => {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      // Use a fixed 640x360 iframe to match requested size (centered)
      const width = 640;
      const height = 360;
      // Left-aligned fixed-size iframe (no centering wrapper)
      // Left-aligned fixed-size iframe (no centering wrapper)
      // By default the iframe has pointer-events disabled so wheel/scroll over it will scroll the parent page.
      // An overlay play button enables interaction (pointer events) when the user intentionally clicks the video.
      const html = `
        <div style="width:100%;display:flex;justify-content:flex-start;">
          <div style=\"width:${width}px;height:${height}px;position:relative;overflow:hidden;\">
            <iframe id=\"rm-video-iframe\" src=\"${embedSrc}\" title=\"${title}\" width=\"${width}\" height=\"${height}\" style=\"border:0;width:100%;height:100%;display:block;pointer-events:none;\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe>
            <div id=\"rm-video-overlay\" style=\"position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:transparent;\" onclick=\"(function(ev){var f=document.getElementById('rm-video-iframe'); if(f){f.style.pointerEvents='auto';} var o=document.getElementById('rm-video-overlay'); if(o && o.parentNode){o.parentNode.removeChild(o);} ev && ev.stopPropagation();})()\">
              <div style=\"width:64px;height:64px;border-radius:32px;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;\">►</div>
            </div>
          </div>
        </div>`;
      // set innerHTML
      containerRef.current.innerHTML = html;
    }
  }, [embedSrc, title, fullWidth]);

  if (Platform.OS === 'web') {
    return <View style={styles.webWrapper as any} ref={containerRef} />;
  }

  // Native fallback: show a link that opens the video in the external browser
  const watchUrl = toWatchUrl(embedSrc);

  return (
    <View style={[styles.nativeWrapper, fullWidth ? styles.nativeFull : null]}>
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
    height: 360,
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nativeWrapper: {
    width: 640,
    height: 360,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nativeFull: {
    width: '100%',
    height: 360,
    alignSelf: 'stretch',
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
