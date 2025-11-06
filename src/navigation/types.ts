// Navigation type definitions

import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { SelectedSkill } from '../types';

// Root Stack
export type RootStackParamList = {
  Main: undefined;
  Education: undefined;
  SelfManagement: undefined;
  VideoSequence: { screenTitle: string; steps: Array<{ title: string; videoUrl?: string | null }>; };
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
  Daily: { initialRange?: 'day' | 'week' | 'month' | 'all' } | undefined;
};

// Student Flow Stack
export type StudentFlowStackParamList = {
  Ready: undefined;
  Wait: { waitDuration: number };
  SkillPresentation: { 
    skills: SelectedSkill[];
    currentIndex: number;
  // schedule: array of events with scheduledTime (ms from session start)
  // Each event also includes intervalAfterPrevMs which is how long (ms)
  // after that skill the next skill should start.
  schedule?: Array<{ skillId: string; skillName: string; scheduledTime: number; intervalAfterPrevMs: number }>;
    // monotonic session start timestamp (Date.now() when session started)
    sessionStartTime?: number;
  };
  SessionComplete: { sessionStartTime?: number; sessionEndTime?: number } | undefined;
  // Screen that shows the earned reinforcer after confirmation
  EarnedReinforcer: { reinforcer: { name: string; imageUri?: string } } | undefined;
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
export type SessionCompleteScreenRouteProp = RouteProp<StudentFlowStackParamList, 'SessionComplete'>;
