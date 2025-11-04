import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import BackButton from '../components/BackButton';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

const EducationScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} label="Geri" accessibilityLabel="go-back" />
        <Text style={styles.title}>Eğitim İçerikleri</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SelfManagement' as any)}
        >
          {/* Illustration - checklist/person to represent self-management */}
          <View style={styles.smallIconContainer}>
            <Svg width={44} height={44} viewBox="0 0 84 64">
              <Rect x="0" y="8" width="84" height="48" rx="8" fill="#283044" />
              <Circle cx="20" cy="28" r="8" fill="#64b5f6" />
              <Path d="M34 22h32v4H34zM34 30h32v4H34z" fill="#9CA3AF" />
              <Path d="M16 34l4 4 8-10" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.smallCardTitle}>Kendini Yönetme Stratejileri Eğitimleri</Text>
          <Text style={styles.smallCardDescription}>Kendini yönetme, kendi kendine yönergeler ve pekiştirme stratejileri hakkında rehberler.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card]}
          onPress={() => Alert.alert('Uygulama Eğitimi', 'Uygulama kullanımı ile ilgili rehberler yakında ekleniyor.')}
        >
          {/* Illustration - device/phone to represent app training */}
          <View style={styles.smallIconContainer}>
            <Svg width={44} height={44} viewBox="0 0 84 64">
              <Rect x="22" y="6" width="40" height="52" rx="6" fill="#1e293b" />
              <Rect x="30" y="14" width="24" height="28" rx="4" fill="#fff" />
              <Circle cx="42" cy="46" r="2.5" fill="#9CA3AF" />
              <Path d="M36 20h12M36 26h12M36 32h8" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.smallCardTitle}>Uygulama Eğitimi</Text>
          <Text style={styles.smallCardDescription}>RutiMind uygulamasını kullanma, beceri ekleme ve pekiştireçleri yönetme rehberi.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 24,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#2c3e50',
    borderWidth: 1,
    borderColor: '#34495e',
  },
  smallIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  smallCardDescription: { fontSize: 14, color: '#bdc3c7' },
});

export default EducationScreen;
