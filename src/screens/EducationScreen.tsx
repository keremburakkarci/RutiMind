import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import HeaderTitle from '../components/SharedHeader';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
// BackButton intentionally not used here; GlobalTopActions provides back navigation
// import BackButton from '../components/BackButton';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

const EducationScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <HeaderTitle style={{ marginBottom: 6 }}>Eğitim İçerikleri</HeaderTitle>
          <Text style={styles.subtitle}>Kendini yönetme stratejileri ve uygulamanın kullanımına yönelik eğitici videolar aşağıdadır</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SelfManagement' as any)}
        >
          <View style={styles.cardInner}>
            <View style={styles.smallIconContainer}>
              <Svg width={40} height={40} viewBox="0 0 84 64">
                {/* colorful rounded square background */}
                <Rect x="0" y="6" width="84" height="52" rx="12" fill="#2D6A96" />
                {/* accent circle */}
                <Circle cx="22" cy="30" r="10" fill="#FFD166" />
                {/* checklist lines */}
                <Path d="M36 22h30" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                <Path d="M36 32h22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                {/* check mark */}
                <Path d="M20 34l5 5 10-12" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Kendini Yönetme Stratejileri Eğitimleri</Text>
              <Text style={styles.cardLink}>Kendini yönetme stratejileri eğitim videolarına ulaşmak için tıklayın.</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('VideoSequence' as any, {
              screenTitle: 'Uygulama Eğitimi',
              steps: [
                { title: 'Uygulamaya giriş', videoUrl: null },
                { title: 'Veli Paneline Giriş', videoUrl: null },
                { title: 'Becerileri Belirleme', videoUrl: null },
                { title: 'Pekişireçleri Belirleme', videoUrl: null },
                { title: 'Gelişim Grafiğini Görüntüleme', videoUrl: null },
                { title: 'Öğrenci moduna giriş', videoUrl: null },
                { title: 'Örnek Video', videoUrl: null },
              ],
            })
          }
        >
          <View style={styles.cardInner}>
            <View style={styles.smallIconContainer}>
              <Svg width={40} height={40} viewBox="0 0 84 64">
                {/* colorful rounded square */}
                <Rect x="0" y="6" width="84" height="52" rx="12" fill="#8B5CF6" />
                {/* phone body */}
                <Rect x="28" y="12" width="28" height="40" rx="6" fill="#0F172A" />
                {/* screen */}
                <Rect x="34" y="18" width="16" height="26" rx="3" fill="#10B981" />
                {/* app dots */}
                <Circle cx="40" cy="24" r="2" fill="#FBBF24" />
                <Circle cx="48" cy="24" r="2" fill="#60A5FA" />
                <Circle cx="44" cy="34" r="2" fill="#F472B6" />
              </Svg>
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Uygulama Eğitimi</Text>
              <Text style={styles.cardLink}>Uygulama eğitimi videolarına ulaşmak için tıklayın.</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d2d', marginTop: 60 },
  back: { color: '#fff', marginRight: 12 },
  headerText: { flexDirection: 'column' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 0 },
  card: {
    borderRadius: 24,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#2c3e50',
    borderWidth: 1,
    borderColor: '#34495e',
  },
  smallIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#162B3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center' },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#bdc3c7' },
  cardLink: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
});

export default EducationScreen;
