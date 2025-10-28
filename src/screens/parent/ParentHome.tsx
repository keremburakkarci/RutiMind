import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

type ParentStackNavProp = any;

const ParentHome: React.FC = () => {
  const navigation = useNavigation<ParentStackNavProp>();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('parent.homeTitle', 'Veli Paneli')}</Text>
        <Text style={styles.subtitle}>{t('parent.homeSubtitle', 'Becerileri ve pekiştireçleri yönetin, gelişimi takip edin')}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ParentTabs' as never)}>
          <Text style={styles.cardTitle}>{t('skills.title', 'Beceri Listesi')}</Text>
          <Text style={styles.cardDesc}>{t('parent.goToSkills', 'Becerileri görüntüle ve düzenle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ParentTabs' as never)}>
          <Text style={styles.cardTitle}>{t('reinforcers.title', 'Pekiştireçler')}</Text>
          <Text style={styles.cardDesc}>{t('parent.goToReinforcers', 'Pekiştireçleri yönet')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ParentTabs' as never)}>
          <Text style={styles.cardTitle}>{t('progress.title', 'Gelişim Grafiği')}</Text>
          <Text style={styles.cardDesc}>{t('parent.goToProgress', 'Gelişimi görselleştir')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#3D3D3D' },
  title: { fontSize: 28, color: '#FFFFFF', fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#9CA3AF' },
  menu: { padding: 16, gap: 12 },
  card: { padding: 20, backgroundColor: '#2D2D2D', borderRadius: 12 },
  cardTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
});

export default ParentHome;
