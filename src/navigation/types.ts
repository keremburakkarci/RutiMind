// Navigation type definitions

import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { SelectedSkill } from '../types';

// Root Stack
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ParentDashboard: undefined;
  StudentFlow: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  GoogleSignIn: undefined;
  PINSetup: undefined;
  PINEntry: undefined;
};

// Parent Tabs
export type ParentTabsParamList = {
  Skills: undefined;
  Reinforcers: undefined;
  Progress: undefined;
};

// Student Flow Stack
export type StudentFlowStackParamList = {
  Ready: undefined;
  Wait: { waitDuration: number };
  SkillPresentation: { 
    skills: SelectedSkill[];
    currentIndex: number;
  };
  SessionComplete: undefined;
};

// Navigation Props
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;
export type ParentTabsNavigationProp = BottomTabNavigationProp<ParentTabsParamList>;
export type StudentFlowStackNavigationProp = StackNavigationProp<StudentFlowStackParamList>;

// Screen Props
export type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;
export type AuthScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'GoogleSignIn'>,
  RootStackNavigationProp
>;
export type PINSetupScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'PINSetup'>,
  RootStackNavigationProp
>;
export type PINEntryScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'PINEntry'>,
  RootStackNavigationProp
>;

export type SkillsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ParentTabsParamList, 'Skills'>,
  RootStackNavigationProp
>;
export type ReinforcersScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ParentTabsParamList, 'Reinforcers'>,
  RootStackNavigationProp
>;
export type ProgressScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ParentTabsParamList, 'Progress'>,
  RootStackNavigationProp
>;

export type ReadyScreenNavigationProp = StackNavigationProp<StudentFlowStackParamList, 'Ready'>;
export type WaitScreenNavigationProp = StackNavigationProp<StudentFlowStackParamList, 'Wait'>;
export type WaitScreenRouteProp = RouteProp<StudentFlowStackParamList, 'Wait'>;
export type SkillPresentationScreenNavigationProp = StackNavigationProp<StudentFlowStackParamList, 'SkillPresentation'>;
export type SkillPresentationScreenRouteProp = RouteProp<StudentFlowStackParamList, 'SkillPresentation'>;
export type SessionCompleteScreenNavigationProp = StackNavigationProp<StudentFlowStackParamList, 'SessionComplete'>;
