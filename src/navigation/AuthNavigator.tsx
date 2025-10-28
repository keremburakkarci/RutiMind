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

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const navigation = useNavigation();
  const { user, isPINVerified, isLoading: authLoading } = useAuthStore();
  const [initialRoute, setInitialRoute] = useState<'checking' | 'GoogleSignIn' | 'PINEntry'>('checking');

  useEffect(() => {
    let mounted = true;

    async function decide() {
      // Wait until auth store finishes initial loading to avoid false negatives on reload
  if (authLoading) return;
  console.debug('[AuthNavigator] deciding initial route, user=', user ? user.uid : null, 'isPINVerified=', isPINVerified);

      // If there's no firebase user, start with Google sign-in
      if (!user) {
        if (mounted) setInitialRoute('GoogleSignIn');
        return;
      }

      // If user exists, check whether a PIN is set
      try {
        const pinExists = await hasPIN();

        if (!pinExists) {
          // No PIN set yet -> start from GoogleSignIn so flow will send user to PINSetup
          if (mounted) setInitialRoute('GoogleSignIn');
          return;
        }

        // PIN exists. If not verified this run, show PIN entry. If already verified, go to parent dashboard.
        if (!isPINVerified) {
          if (mounted) setInitialRoute('PINEntry');
        } else {
          // Already verified for this run; navigate out to ParentDashboard
          // Use navigation.reset to replace Auth stack
          // @ts-ignore - navigation type comes from parent navigator
          console.debug('[AuthNavigator] already verified, resetting to ParentDashboard');
          navigation.reset({ index: 0, routes: [{ name: 'ParentDashboard' as never }] });
        }
      } catch (e) {
        // Fallback to Google sign in on any error
        if (mounted) setInitialRoute('GoogleSignIn');
      }
    }

    decide();

    return () => { mounted = false; };
  }, [user, isPINVerified, navigation]);

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
