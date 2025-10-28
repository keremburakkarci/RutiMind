// Zustand store for skills management

// Import the CommonJS entry explicitly to avoid Metro resolving the ESM
// entry (which contains `import.meta`) when bundling for web.
import { create } from 'zustand/index.js';
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
}));
