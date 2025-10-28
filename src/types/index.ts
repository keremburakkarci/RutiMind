// Core type definitions for RutiMind

// User Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Skill Category Types
export interface SkillCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  skills: string[];
}

// Skill Types
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  order: number;
  duration: number; // in minutes
  imageUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SelectedSkill {
  skillId: string;
  order: number;
  duration: number; // in minutes
  imageUri: string;
}

// Reinforcer Types
export interface Reinforcer {
  id: string;
  name: string;
  imageUri: string;
  slot: number; // 1-10
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Session Types
export enum ResponseType {
  YES = 'YES',
  NO = 'NO',
  NO_RESPONSE = 'NO_RESPONSE',
}

export interface SkillResponse {
  id: string;
  sessionId: string;
  skillId: string;
  response: ResponseType;
  timestamp: Date;
  responseTime: number; // in milliseconds
}

export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  waitDuration: number; // in minutes
  skills: SelectedSkill[];
  responses: SkillResponse[];
  status: 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Progress Types
export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  totalSkills: number;
  completedSkills: number;
  yesResponses: number;
  noResponses: number;
  noResponseCount: number;
  successRate: number; // percentage
  sessions: Session[];
}

// PIN Types
export interface PINConfig {
  hashedPIN: string;
  salt: string;
  createdAt: Date;
  updatedAt: Date;
  failedAttempts: number;
  lockoutUntil?: Date;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  PINSetup: undefined;
  PINEntry: undefined;
  ParentTabs: undefined;
  StudentFlow: undefined;
};

export type AuthStackParamList = {
  GoogleSignIn: undefined;
  PINSetup: undefined;
};

export type ParentTabsParamList = {
  Skills: undefined;
  Reinforcers: undefined;
  Progress: undefined;
};

export type StudentFlowStackParamList = {
  Ready: undefined;
  Wait: { waitDuration: number };
  SkillPresentation: { 
    skills: SelectedSkill[];
    currentIndex: number;
  };
  SessionComplete: undefined;
};

// Form Types
export interface SkillFormData {
  name: string;
  categoryId: string;
  duration: number;
  imageUri: string;
}

export interface ReinforcerFormData {
  name: string;
  imageUri: string;
  slot: number;
}

export interface SessionConfig {
  waitDuration: number;
  skills: SelectedSkill[];
  totalDuration: number;
}

// Database Schema Types
export interface DBSkill {
  id: string;
  name: string;
  category_id: string;
  order_index: number;
  duration: number;
  image_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBReinforcer {
  id: string;
  name: string;
  image_uri: string;
  slot: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DBSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  wait_duration: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DBSkillResponse {
  id: string;
  session_id: string;
  skill_id: string;
  response: string;
  timestamp: string;
  response_time: number;
}
