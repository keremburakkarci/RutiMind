// Auth Navigator - Authentication flow (Google Sign-In → PIN Setup → PIN Entry)

import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AuthStackParamList } from './types';

// Import auth screens (will be created)
import GoogleSignInScreen from '../screens/auth/GoogleSignInScreen';
import PINSetupScreen from '../screens/auth/PINSetupScreen';
import PINEntryScreen from '../screens/auth/PINEntryScreen';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { hasPIN } from '../utils/pinAuth';
import { hasRemotePIN, loadPINFromFirestore } from '../utils/firestorePinService';
import { secureSetItem } from '../utils/pinAuth';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const navigation = useNavigation();
  const { user, isPINVerified, isLoading: authLoading } = useAuthStore();
  const [initialRoute, setInitialRoute] = useState<'checking' | 'GoogleSignIn' | 'PINEntry'>('checking');

  useEffect(() => {
    let mounted = true;

    async function decide() {
      console.debug('[AuthNavigator] decide() called, authLoading=', authLoading, 'user=', user ? user.uid : null, 'isPINVerified=', isPINVerified);
      
      // Wait until auth store finishes initial loading to avoid false negatives on reload
      if (authLoading) {
        console.debug('[AuthNavigator] Still loading auth state, waiting...');
        return;
      }

      // If there's no firebase user, start with Google sign-in
      if (!user) {
        console.debug('[AuthNavigator] No user found, showing GoogleSignIn');
        if (mounted) setInitialRoute('GoogleSignIn');
        return;
      }

      // If user exists, check whether a PIN is set (local first, then Firestore)
      try {
        console.debug('[AuthNavigator] User exists, checking if PIN is set...');
        
        // Check local PIN first
        let pinExists = await hasPIN();
        console.debug('[AuthNavigator] Local PIN exists:', pinExists);

        // If no local PIN, check Firestore with timeout and sync down
        if (!pinExists) {
          console.debug('[AuthNavigator] No local PIN, checking Firestore...');
          
          try {
            const timeoutPromise = new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            );
            const remotePinExists = await Promise.race([
              hasRemotePIN(user.uid),
              timeoutPromise
            ]);
            console.debug('[AuthNavigator] Remote PIN exists:', remotePinExists);
            
            if (remotePinExists) {
              // Sync PIN from Firestore to local with timeout
              console.debug('[AuthNavigator] Syncing PIN from Firestore to local...');
              const syncTimeoutPromise = new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              );
              const remotePinData = await Promise.race([
                loadPINFromFirestore(user.uid),
                syncTimeoutPromise
              ]);
              
              if (remotePinData) {
                await secureSetItem('user_pin_hashed', remotePinData.pinHash);
                await secureSetItem('user_pin_salt', remotePinData.pinSalt);
                console.debug('[AuthNavigator] PIN synced from Firestore to local');
                pinExists = true;
              }
            }
          } catch (firestoreError: any) {
            console.warn('[AuthNavigator] Firestore PIN check failed (timeout or offline):', firestoreError?.message);
            // Continue with local-only flow
          }
        }

        if (!pinExists) {
          // No PIN set anywhere -> start from GoogleSignIn so flow will send user to PINSetup
          console.debug('[AuthNavigator] No PIN found (local or remote), showing GoogleSignIn (will route to PINSetup after sign-in)');
          if (mounted) setInitialRoute('GoogleSignIn');
          return;
        }

        // PIN exists. If not verified this run, show PIN entry. If already verified, go to parent dashboard.
        if (!isPINVerified) {
          console.debug('[AuthNavigator] PIN exists but not verified, showing PINEntry');
          if (mounted) setInitialRoute('PINEntry');
        } else {
          // Already verified for this run; navigate out to ParentDashboard
          console.debug('[AuthNavigator] PIN already verified this session, navigating to ParentDashboard');
          // Use navigation.reset to replace Auth stack
          // @ts-ignore - navigation type comes from parent navigator
          navigation.reset({ index: 0, routes: [{ name: 'ParentDashboard' as never }] });
        }
      } catch (e) {
        console.error('[AuthNavigator] Error checking PIN, defaulting to GoogleSignIn:', e);
        // Fallback to Google sign in on any error
        if (mounted) setInitialRoute('GoogleSignIn');
      }
    }

    decide();

    return () => { mounted = false; };
  }, [user, isPINVerified, authLoading, navigation]);

  if (initialRoute === 'checking') {
    // Small loader while we determine where to start
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        // Use boxShadow on web to avoid react-native-web shadow* deprecation warnings
        cardStyle: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
      }}
    >
      <Stack.Screen name="GoogleSignIn" component={GoogleSignInScreen} />
      <Stack.Screen name="PINSetup" component={PINSetupScreen} />
      <Stack.Screen name="PINEntry" component={PINEntryScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
