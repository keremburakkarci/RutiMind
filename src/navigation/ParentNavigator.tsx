// Parent Navigator - Parent dashboard tabs (Skills / Reinforcers / Progress)

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ParentTabsParamList } from './types';
import { useTranslation } from 'react-i18next';

// Import parent screens (will be created)
import SkillsScreen from '../screens/parent/SkillsScreen';
import ReinforcersScreen from '../screens/parent/ReinforcersScreen';
import ProgressScreen from '../screens/parent/ProgressScreen';

const Tab = createBottomTabNavigator<ParentTabsParamList>();

const ParentNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2D2D2D',
          borderTopColor: '#3D3D3D',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#4285F4',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Skills" 
        component={SkillsScreen}
        options={{
          tabBarLabel: t('skills.title'),
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Reinforcers" 
        component={ReinforcersScreen}
        options={{
          tabBarLabel: t('reinforcers.title'),
          tabBarIcon: ({ color }) => <TabIcon icon="⭐" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: t('progress.title'),
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon component
const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

export default ParentNavigator;
