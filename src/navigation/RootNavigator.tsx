// Root Navigator - Main navigation structure

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import type { RootStackParamList } from './types';

// Import screens (placeholder imports - will be created)
import MainScreen from '../screens/MainScreen';
import AuthNavigator from './AuthNavigator';
import ParentStack from './ParentStack';
import StudentNavigator from './StudentNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.debug('[RootNavigator] onAuthStateChanged fired, user=', currentUser ? currentUser.uid : null);
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          // Provide boxShadow for web to reduce react-native-web shadow* warnings
          cardStyle: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
  <Stack.Screen name="ParentDashboard" component={ParentStack} />
        <Stack.Screen name="StudentFlow" component={StudentNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
