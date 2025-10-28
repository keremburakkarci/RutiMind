// ParentStack - Landing screen + Tabs stack for Parent mode

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ParentNavigator from './ParentNavigator';
import ParentHome from '../screens/parent/ParentHome';

type ParentStackParamList = {
  ParentHome: undefined;
  ParentTabs: undefined;
};

const Stack = createStackNavigator<ParentStackParamList>();

const ParentStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ParentHome" component={ParentHome} />
      <Stack.Screen name="ParentTabs" component={ParentNavigator} />
    </Stack.Navigator>
  );
};

export default ParentStack;
