// Student Navigator - Student flow (Ready → Wait → Skill Presentation → Complete)

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { StudentFlowStackParamList } from './types';

// Import student screens (will be created)
import ReadyScreen from '../screens/student/ReadyScreen';
import WaitScreen from '../screens/student/WaitScreen';
import SkillPresentationScreen from '../screens/student/SkillPresentationScreen';
import SessionCompleteScreen from '../screens/student/SessionCompleteScreen';
import EarnedReinforcerScreen from '../screens/student/EarnedReinforcerScreen';

const Stack = createStackNavigator<StudentFlowStackParamList>();

const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Ready" component={ReadyScreen} />
      <Stack.Screen name="Wait" component={WaitScreen} />
      <Stack.Screen name="SkillPresentation" component={SkillPresentationScreen} />
  <Stack.Screen name="SessionComplete" component={SessionCompleteScreen} />
  <Stack.Screen name="EarnedReinforcer" component={EarnedReinforcerScreen} />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
