// Zustand store for authentication state

// Import the CommonJS entry explicitly to avoid Metro resolving the ESM
// entry (which contains `import.meta`) when bundling for web.
import { create } from 'zustand/index.js';
import type { User } from '../types';

interface AuthState {
  // State
  user: User | null;
  isPINVerified: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setPINVerified: (verified: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isPINVerified: false,
  isLoading: true,
  
  // Actions
  setUser: (user) => set({ user }),
  
  setPINVerified: (verified) => set({ isPINVerified: verified }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  signOut: () => set({ 
    user: null, 
    isPINVerified: false 
  }),
}));
