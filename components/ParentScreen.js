import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

export const ParentScreen = ({ setCurrentScreen, signInWithGoogle }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!signInWithGoogle) {
      Alert.alert('Hata', 'Google giriş fonksiyonu bulunamadı.');
      return;
    }

    try {
      setIsLoading(true);
      await signInWithGoogle();
      setCurrentScreen('parentDashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert(
        'Giriş Hatası',
        'Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam', style: 'cancel' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modernAuthHeader}>
        <TouchableOpacity 
          onPress={() => setCurrentScreen('main')} 
          style={styles.modernBackButtonContainer}
        >
          <View style={styles.backIconWrapper}>
            <Text style={styles.modernBackIcon}>←</Text>
          </View>
          <Text style={styles.modernBackText}>Ana Menü</Text>
        </TouchableOpacity>
        <Text style={styles.modernAuthHeaderTitle}>Veli Paneli</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.modernAuthScrollView}>
        <View style={styles.modernAuthContent}>
          <View style={styles.welcomeHeaderSection}>
            <View style={styles.modernWelcomeIcon}>
              <Text style={styles.welcomeIconText}>👨‍👩‍👧‍👦</Text>
            </View>
            <Text style={styles.modernWelcomeTitle}>Hoş Geldiniz!</Text>
            <Text style={styles.modernWelcomeSubtitle}>
              RutiMind veli paneline giriş yapın
            </Text>
          </View>

          <View style={styles.authButtonsContainer}>
            <TouchableOpacity 
              style={styles.modernGoogleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <View style={styles.googleButtonInner}>
                <View style={styles.modernGoogleIconContainer}>
                  <Text style={styles.googleLogoText}>G</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.modernGoogleButtonText}>Google ile Giriş Yap</Text>
                  <Text style={styles.modernButtonSubText}>Hesabınızla hemen bağlanın</Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator color="#fff" style={styles.buttonLoader} />
                ) : (
                  <View style={styles.arrowContainer}>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerBadge}>
                <Text style={styles.dividerBadgeText}>Güvenli Giriş</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.securityFeatures}>
              <View style={styles.securityFeatureItem}>
                <View style={styles.securityIconContainer}>
                  <Text style={styles.securityIcon}>🔒</Text>
                </View>
                <Text style={styles.securityFeatureText}>End-to-end şifreleme ile güvenli veri</Text>
              </View>

              <View style={styles.securityFeatureItem}>
                <View style={styles.securityIconContainer}>
                  <Text style={styles.securityIcon}>🛡️</Text>
                </View>
                <Text style={styles.securityFeatureText}>Google güvenlik standartları</Text>
              </View>

              <View style={styles.securityFeatureItem}>
                <View style={styles.securityIconContainer}>
                  <Text style={styles.securityIcon}>🔐</Text>
                </View>
                <Text style={styles.securityFeatureText}>İki faktörlü doğrulama desteği</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modernAuthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  modernBackButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#3d3d3d',
  },
  backIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4d4d4d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modernBackIcon: {
    fontSize: 20,
    color: '#fff',
  },
  modernBackText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  modernAuthHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  modernAuthScrollView: {
    flex: 1,
  },
  modernAuthContent: {
    padding: 24,
  },
  welcomeHeaderSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  modernWelcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeIconText: {
    fontSize: 40,
  },
  modernWelcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modernWelcomeSubtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    maxWidth: '80%',
  },
  authButtonsContainer: {
    gap: 24,
  },
  modernGoogleButton: {
    backgroundColor: '#4285f4',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#5c9cff',
  },
  googleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  modernGoogleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  googleLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  buttonTextContainer: {
    flex: 1,
  },
  modernGoogleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modernButtonSubText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArrow: {
    fontSize: 20,
    color: '#fff',
  },
  buttonLoader: {
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3d3d3d',
  },
  dividerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    marginHorizontal: 12,
  },
  dividerBadgeText: {
    color: '#bdc3c7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  securityFeatures: {
    gap: 16,
  },
  securityFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  securityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityFeatureText: {
    flex: 1,
    color: '#bdc3c7',
    fontSize: 14,
  },
});