import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useNavigationState, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import BackButton from './BackButton';
import MainMenuButton from './MainMenuButton';

type Props = {
  title?: string;
  showBack?: boolean;
};

const GlobalTopActions: React.FC<Props> = ({ title, showBack }) => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const { user, setPINVerified } = useAuthStore();

  // Safely derive the active route name from navigation state (handles nested navigators)
  const getActiveRouteName = (state: any): string | undefined => {
    if (!state) return undefined;
    const route = state.routes?.[state.index ?? 0];
    if (!route) return undefined;
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  // Subscribe to navigation state so this component re-renders when the active route changes
  const currentRouteName = useNavigationState((state) => getActiveRouteName(state));
  const isMainScreen = currentRouteName === 'Main';

  // Show the "Ana Menü" button when NOT on Main screen (show on ParentHome, PIN screens, and all other screens)
  const showMainMenuButton = currentRouteName && !isMainScreen;

  const canGoBack = navigation.canGoBack();

  // Routes where we DO NOT want the global back button (these screens should show Ana Menü instead)
  const hideBackRoutes = new Set<string>([
    'Main',
    'ParentHome',
    'ParentDashboard',
    'PINSetup',
    'PINEntry',
    'GoogleSignIn',
    'Auth',
  ]);

  // Helper: recursively search a navigation state tree for a route name
  const stateContainsRoute = (state: any, name: string): boolean => {
    if (!state || !state.routes) return false;
    for (const r of state.routes) {
      if (r.name === name) return true;
      if (r.state && stateContainsRoute(r.state, name)) return true;
    }
    return false;
  };

  const handleGoBack = () => {
    console.log('🔴 [DEBUG] handleGoBack CALLED - START');
    console.log('🔴 [DEBUG] currentRouteName:', currentRouteName);
    
    try {
      // Robustly detect if we're inside the ParentTabs (Skills/Reinforcers/Progress)
      const navState = navigation.getState && navigation.getState();
      
      console.log('🔴 [DEBUG] Full navigation state:', JSON.stringify(navState, null, 2));
      
      const insideParentTabs = stateContainsRoute(navState, 'Reinforcers') || 
                               stateContainsRoute(navState, 'Skills') || 
                               stateContainsRoute(navState, 'Progress') ||
                               currentRouteName === 'ParentTabs'; // ALSO check if we're at the ParentTabs container level
      
      console.log('🔴 [DEBUG] insideParentTabs:', insideParentTabs);
      console.log('🔴 [DEBUG] canGoBack:', navigation.canGoBack());

      if (insideParentTabs) {
        console.log('🔴 [DEBUG] Inside ParentTabs - will reset to ParentHome');
        // Find the top-level navigation reference (root) and reset the ParentDashboard stack to show ParentHome
        let navRef: any = navigation;
        while (navRef.getParent()) {
          console.log('🔴 [DEBUG] Moving up to parent navigator');
          navRef = navRef.getParent();
        }

        console.log('🔴 [DEBUG] Dispatching reset to ParentDashboard > ParentHome');
        navRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'ParentDashboard',
                state: {
                  index: 0,
                  routes: [{ name: 'ParentHome' }],
                },
              },
            ],
          })
        );
        console.log('🔴 [DEBUG] Reset dispatched successfully');
        return;
      }

      // Default: just go back
      console.log('🔴 [DEBUG] Not in ParentTabs - calling navigation.goBack()');
      navigation.goBack();
    } catch (e) {
      console.error('🔴 [DEBUG] handleGoBack error:', e);
      try { navigation.goBack(); } catch (_) {}
    }
  };

  const handleGoToMain = () => {
    // Reset PIN verification when going back to main menu
    console.debug('[GlobalTopActions] Resetting PIN verification, navigating to Main');
    setPINVerified(false);
    navigation.navigate('Main' as never);
  };

  const confirmSignOut = async () => {
    // On web use the native confirm dialog because Alert.alert is not reliable there
    try {
      let shouldSignOut = false;
      if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function') {
        shouldSignOut = (globalThis as any).confirm('Oturumu kapatmak istediğinizden emin misiniz?');
      } else {
        // For native show Alert with buttons
        // Wrap in a Promise to await user's choice
        shouldSignOut = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Çıkış Yap',
            'Oturumu kapatmak istediğinizden emin misiniz?',
            [
              { text: 'İptal', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Çıkış Yap', style: 'destructive', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });
      }

      if (!shouldSignOut) return;

      await logout();
      // After logout, ensure we land on Main (logged-out entry)
      try {
        navigation.navigate('Main' as never);
      } catch (e) {
        // ignore navigation errors
      }
    } catch (e) {
      console.error('Sign-out flow failed', e);
    }
  };

  if (!user?.email) return null;

  return (
    // Use style.pointerEvents instead of prop to avoid react-native-web deprecation warnings
    <View style={[styles.topBar, { pointerEvents: 'box-none' }]}>
      {/* Left: optional back button + Screen title */}
      <View style={[styles.leftContainer, { pointerEvents: 'box-none' }]}>
        {((showBack || canGoBack) && !(currentRouteName && hideBackRoutes.has(currentRouteName))) && (
          <BackButton
            accessibilityLabel="go-back"
            onPress={() => {
              try { console.debug('[GlobalTopActions] backButton pressed (wrapper)'); } catch(_) {}
              handleGoBack();
            }}
          />
        )}

        {title && (
          <View style={[styles.leftTitleWrap, { pointerEvents: 'none' }]}>
            <Text style={styles.leftTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          </View>
        )}
      </View>

      {/* Ana Menü button - center top (only show when NOT on main screen and NOT on auth/PIN screens) */}
      {showMainMenuButton && (
        <MainMenuButton onPress={handleGoToMain} accessibilityLabel="go-to-main" />
      )}

      {/* User card - top right */}
      <View style={styles.userCard}>
        {user.photoURL ? (
          <PhotoWithFallback uri={user.photoURL} initial={(user.email?.charAt(0) || '👤').toUpperCase()} />
        ) : (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.email?.charAt(0).toUpperCase() || '👤'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.emailText} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="sign-out"
          onPress={confirmSignOut}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Small helper component that shows a remote image with a bundled fallback and a loading indicator.
const PhotoWithFallback: React.FC<{ uri: string; initial: string }> = ({ uri, initial }) => {
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cacheBuster, setCacheBuster] = useState<number | null>(null);
  // We prefer showing initials when remote image fails; no bundled fallback required here.

  // Note: We removed the HEAD preflight check to avoid 429 errors from Google's rate limiting.
  // The Image component will handle loading directly, and onError will catch any failures.

  // Build URI with optional cache-buster for retries
  const uriWithBuster = cacheBuster ? `${uri}${uri.includes('?') ? '&' : '?'}cb=${cacheBuster}` : uri;

  const handleImageError = () => {
    if (retryCount < 1) {
      console.debug('[PhotoWithFallback] image failed, scheduling retry with cache-buster');
      setRetryCount((c) => c + 1);
      setCacheBuster(Date.now());
      setLoading(true);
    } else {
      console.debug('[PhotoWithFallback] Image onError triggered. Falling back to bundled icon.');
      setErrored(true);
      setLoading(false);
    }
  };

  return (
    <View style={styles.photoWrapper}>
      {!errored ? (
        <Image
          source={{ uri: uriWithBuster }}
          style={styles.userPhoto}
          resizeMode="cover"
          accessibilityLabel="user-photo"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={handleImageError}
        />
      ) : (
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{initial}</Text>
        </View>
      )}
      {loading && (
        <View style={styles.photoLoadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}

      {/* DEV-only small status text so you can visually see state while debugging */}
      {__DEV__ && (
        <View style={styles.photoDebugWrap} pointerEvents="none">
          <Text style={styles.photoDebugText}>{errored ? 'failed' : loading ? 'loading' : 'ok'}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 16 : 12,
    paddingHorizontal: 16,
  },
  mainMenuButton: {
    // legacy positional style kept for fallback - prefer inner variant
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Full-width absolute wrapper that centers the main menu button
  mainMenuWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'web' ? 36 : 28,
    alignItems: 'center',
    zIndex: 10000,
    pointerEvents: 'box-none',
  },
  // Actual button style used inside centered wrapper
  mainMenuButtonInner: {
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainMenuText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  leftTitleWrap: {
    position: 'absolute',
    left: 16,
    // Move title below the back button so it appears under the back arrow instead of inline
    top: Platform.OS === 'web' ? 56 : 56,
  },
  leftTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
  },
  leftContainer: {
    position: 'absolute',
    left: 8,
    top: Platform.OS === 'web' ? 12 : 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  userCard: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  photoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  photoLoadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  photoDebugWrap: {
    position: 'absolute',
    bottom: -14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoDebugText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  userInfo: {
    maxWidth: 180,
  },
  emailText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  signOutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#ff3b30',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  signOutIcon: {
    fontSize: 16,
  },
});

export default GlobalTopActions;
