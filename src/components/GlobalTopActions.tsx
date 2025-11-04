import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useNavigation, useNavigationState, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import BackButton from './BackButton';

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
  // ParentHome and PIN/Auth screens should NOT show back button
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
        <TouchableOpacity
          accessibilityLabel="go-to-main"
          onPress={handleGoToMain}
          style={[
            styles.mainMenuButton,
            Platform.OS === 'web'
              ? { boxShadow: '0 4px 8px rgba(66,133,244,0.35)' }
              : { shadowColor: '#4285F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
          ]}
        >
          <Text style={styles.mainMenuText}>Ana Menü</Text>
        </TouchableOpacity>
      )}

      {/* User card - top right */}
      <View
        style={[
          styles.userCard,
          Platform.OS === 'web'
            ? { boxShadow: '0 4px 12px rgba(0,0,0,0.28)' }
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
        ]}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            <Text style={styles.welcomeText}>Merhaba </Text>
            <Text style={styles.emailText}>{user.email}</Text>
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="sign-out"
          onPress={confirmSignOut}
          style={[
            styles.signOutButton,
            Platform.OS === 'web'
              ? { boxShadow: '0 2px 6px rgba(255,77,79,0.36)' }
              : { shadowColor: '#FF4D4F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
          ]}
        >
          <Text style={styles.signOutIcon}>⎋</Text>
        </TouchableOpacity>
      </View>
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
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -60 }],
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
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.2)',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  emailText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF4D4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default GlobalTopActions;
