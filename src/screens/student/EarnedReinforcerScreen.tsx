import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StudentFlowStackParamList } from '../../navigation/types';

type EarnedRouteProp = RouteProp<StudentFlowStackParamList, 'EarnedReinforcer'>;

const EarnedReinforcerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EarnedRouteProp>();
  const reinforcer = route.params?.reinforcer;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <Text style={styles.headerText}>{'Tebrikler!'}</Text>
      </LinearGradient>
      <View style={styles.content}>
        {reinforcer?.imageUri ? (
          <Image source={{ uri: reinforcer.imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}><Text style={styles.placeholderText}>+</Text></View>
        )}
        <Text style={styles.name}>{reinforcer?.name ?? 'Pekiştireç'}</Text>

        <TouchableOpacity style={styles.button} onPress={() => {
          // After viewing, go back to main student flow
          try {
            const top = (navigation as any).getParent ? (navigation as any).getParent() : navigation;
            top?.dispatch?.({ type: 'RESET', index: 0, routes: [{ name: 'StudentFlow' }] });
          } catch (e) {
            navigation.navigate('Ready' as never);
          }
        }}>
          <LinearGradient colors={["#F39C12", "#E67E22"]} style={styles.buttonInner}>
            <Text style={styles.buttonText}>{'Ana Ekrana Dön'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 18, alignItems: 'center' },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  image: { width: 200, height: 200, borderRadius: 12, marginBottom: 20 },
  placeholder: { width: 200, height: 200, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  placeholderText: { color: '#fff', fontSize: 48, fontWeight: '700' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 28, textAlign: 'center' },
  button: { borderRadius: 14, overflow: 'hidden' },
  buttonInner: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default EarnedReinforcerScreen;
