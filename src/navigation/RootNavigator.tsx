// Root Navigator - Main navigation structure

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

// Import screens (placeholder imports - will be created)
import MainScreen from '../screens/MainScreen';
import EducationScreen from '../screens/EducationScreen';
import SelfManagementScreen from '../screens/SelfManagementScreen';
import VideoSequenceScreen from '../screens/VideoSequenceScreen';
import AuthNavigator from './AuthNavigator';
import ParentStack from './ParentStack';
import StudentNavigator from './StudentNavigator';
import GlobalTopActions from '../components/GlobalTopActions';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
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
  <Stack.Screen name="Education" component={EducationScreen} />
    <Stack.Screen name="SelfManagement" component={SelfManagementScreen} />
    <Stack.Screen name="VideoSequence" component={VideoSequenceScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
  <Stack.Screen name="ParentDashboard" component={ParentStack} />
        <Stack.Screen name="StudentFlow" component={StudentNavigator} />
      </Stack.Navigator>
      {/* Global floating actions (appears on top-right across all screens) */}
      <GlobalTopActions />
    </NavigationContainer>
  );
};

export default RootNavigator;
