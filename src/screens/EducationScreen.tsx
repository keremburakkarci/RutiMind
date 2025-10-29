import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const EducationScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Eğitim İçerikleri</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Kendini Yönetme', 'Bu içeriğe yakında eklenecek eğitimler gösterilecek.')}
        >
          <Text style={styles.cardTitle}>Kendini Yönetme Stratejileri Eğitimleri</Text>
          <Text style={styles.cardDesc}>Kendini yönetme, kendi kendine yönergeler ve pekiştirme stratejileri hakkında rehberler.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Uygulama Eğitimi', 'Uygulama kullanımı ile ilgili rehberler yakında ekleniyor.')}
        >
          <Text style={styles.cardTitle}>Uygulama Eğitimi</Text>
          <Text style={styles.cardDesc}>RutiMind uygulamasını kullanma, beceri ekleme ve pekiştireçleri yönetme rehberi.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' },
  back: { color: '#fff' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#2d2d2d', padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#3d3d3d' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardDesc: { color: '#bdc3c7', fontSize: 14 },
});

export default EducationScreen;
