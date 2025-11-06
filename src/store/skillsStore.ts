// Zustand store for skills management

// Import the CommonJS entry explicitly to avoid Metro resolving the ESM
// entry (which contains `import.meta`) when bundling for web.
import { create } from 'zustand/index.js';
import { useAuthStore } from './authStore';
import { saveSelectedSkillsForUser } from '../utils/userPersistence';
import type { SelectedSkill } from '../types';

interface SkillsState {
  // State
  selectedSkills: SelectedSkill[];
  waitDuration: number; // in minutes
  
  // Actions
  addSkill: (skill: SelectedSkill) => void;
  removeSkill: (skillId: string) => void;
  reorderSkills: (fromIndex: number, toIndex: number) => void;
  updateSkill: (skillId: string, updates: Partial<SelectedSkill>) => void;
  setWaitDuration: (duration: number) => void;
  clearSkills: () => void;
  loadSkills: (skills: SelectedSkill[], waitDuration: number) => void;
  // Persistence helpers
  saveForUser: (userId?: string) => Promise<void>;
  loadForUser: (userId?: string) => Promise<void>;
}

export const useSkillsStore = create<SkillsState>((set) => ({
  // Initial state
  selectedSkills: [],
  waitDuration: 5, // Default 5 minutes
  
  // Actions
  addSkill: (skill) => set((state) => ({
    selectedSkills: [...state.selectedSkills, skill]
  })),
  
  removeSkill: (skillId) => set((state) => ({
    selectedSkills: state.selectedSkills.filter(s => s.skillId !== skillId)
  })),
  
  reorderSkills: (fromIndex, toIndex) => set((state) => {
    const newSkills = [...state.selectedSkills];
    const [movedSkill] = newSkills.splice(fromIndex, 1);
    newSkills.splice(toIndex, 0, movedSkill);
    
    // Update order property
    return {
      selectedSkills: newSkills.map((skill, index) => ({
        ...skill,
        order: index + 1
      }))
    };
  }),
  
  updateSkill: (skillId, updates) => set((state) => ({
    selectedSkills: state.selectedSkills.map(skill =>
      skill.skillId === skillId ? { ...skill, ...updates } : skill
    )
  })),
  
  setWaitDuration: (duration) => set({ waitDuration: duration }),
  
  clearSkills: () => set({ 
    selectedSkills: [],
    waitDuration: 5
  }),
  
  loadSkills: (skills, waitDuration) => set({ 
    selectedSkills: skills,
    waitDuration
  }),
  // Persist/load helpers for per-user storage (web/local native fallback)
  saveForUser: async (userId?: string) => {
    try {
      if (!userId) {
        console.log('[skillsStore] saveForUser: no userId provided');
        return;
      }
      const toSave = { 
        selectedSkills: (useSkillsStore.getState().selectedSkills || []), 
        waitDuration: useSkillsStore.getState().waitDuration 
      };
      console.log('[skillsStore] saveForUser for user', userId, ':', toSave);
      
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        (globalThis as any).localStorage.setItem(`selectedSkills_${userId}`, JSON.stringify(toSave));
        console.log('[skillsStore] Saved to localStorage key:', `selectedSkills_${userId}`);
      }
    } catch (e) {
      console.warn('[skillsStore] saveForUser failed', e);
    }
  },
  loadForUser: async (userId?: string) => {
    try {
      if (!userId) {
        // Clear to defaults when no user
        console.log('[skillsStore] loadForUser: no userId, clearing skills');
        set({ selectedSkills: [], waitDuration: 5 });
        return;
      }
      console.log('[skillsStore] loadForUser for user:', userId);
      
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        const raw = (globalThis as any).localStorage.getItem(`selectedSkills_${userId}`);
        console.log('[skillsStore] Raw data from localStorage:', raw);
        
        if (!raw) {
          console.log('[skillsStore] No saved data found');
          return;
        }
        
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.selectedSkills)) {
          console.log('[skillsStore] Loading', parsed.selectedSkills.length, 'skills');
          set({ selectedSkills: parsed.selectedSkills, waitDuration: parsed.waitDuration ?? 5 });
        }
      }
    } catch (e) {
      console.warn('[skillsStore] loadForUser failed', e);
    }
  }
}));

// Autosave subscription: whenever selectedSkills or waitDuration changes,
// persist for the currently signed-in user (if any). This ensures that
// a page refresh will load the latest per-user selection even if the
// sign-in/onAuthStateChanged timing is delayed.
try {
  useSkillsStore.subscribe(async (state) => {
    try {
      const uid = useAuthStore.getState().user?.uid;
      if (!uid) return;
      await saveSelectedSkillsForUser(uid, { selectedSkills: state.selectedSkills, waitDuration: state.waitDuration });
    } catch (e) {
      console.warn('[skillsStore] autosave subscription failed', e);
    }
  });
} catch (e) {
  // Subscriptions may fail in some test environments; log but don't crash
  console.warn('[skillsStore] could not setup autosave subscription', e);
}

// Initial load: if a user is already signed in when the store is created,
// load their per-user selections immediately. This handles page refresh scenarios.
try {
  const currentUser = useAuthStore.getState().user;
  if (currentUser?.uid) {
    useSkillsStore.getState().loadForUser(currentUser.uid);
  }
} catch (e) {
  console.warn('[skillsStore] initial load failed', e);
}
