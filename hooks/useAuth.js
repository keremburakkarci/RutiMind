import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { useAuthStore } from '../src/store/authStore';
import { useSkillsStore } from '../src/store/skillsStore';
import { loadSelectedReinforcersForUser } from '../src/utils/userPersistence';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    // Keep a reference to skills autosave unsubscribe so we can cleanup on sign-out
    let skillsUnsub = null;

    const initAuth = async () => {
      try {
        // Auth state'i dinle
  unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          // Daha detaylı log: tam user objesini görebilmek için JSON.stringify
          try {
            console.debug('[useAuth] onAuthStateChanged fired, user=', currentUser ? { uid: currentUser.uid, email: currentUser.email } : null);
          } catch (e) {
            console.debug('[useAuth] onAuthStateChanged fired (could not stringify user)');
          }

          setUser(currentUser);
          // Also update the auth store
          if (currentUser) {
            useAuthStore.getState().setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            });
            useAuthStore.getState().setLoading(false);
            // Load per-user selected skills (web/local fallback)
            try {
              useSkillsStore.getState().loadForUser?.(currentUser.uid);
            } catch (e) {
              console.warn('[useAuth] load user skills failed', e);
            }
            // Subscribe to skills changes and persist them for this user
            try {
              // Unsubscribe previous if any
              if (skillsUnsub) {
                try { skillsUnsub(); } catch (e) { /* ignore */ }
                skillsUnsub = null;
              }
              skillsUnsub = useSkillsStore.subscribe(
                (s) => ({ selectedSkills: s.selectedSkills, waitDuration: s.waitDuration }),
                async (next, prev) => {
                  try {
                    await useSkillsStore.getState().saveForUser?.(currentUser.uid);
                  } catch (e) {
                    console.warn('[useAuth] autosave skills failed', e);
                  }
                }
              );
            } catch (e) {
              console.warn('[useAuth] could not subscribe skills autosave', e);
            }
          } else {
            useAuthStore.getState().setUser(null);
            useAuthStore.getState().setLoading(false);
            // Clear skills on sign out
            try {
              // Ensure selected skills are cleared immediately when signing out so
              // the previous user's selection doesn't remain visible.
              // Call clearSkills() for immediate UI update, and also call loadForUser(null)
              // to keep the persistence helper consistent.
              try { useSkillsStore.getState().clearSkills?.(); } catch (e) { /* ignore */ }
              useSkillsStore.getState().loadForUser?.(null);
            } catch (e) {
              console.warn('[useAuth] clear user skills failed', e);
            }
            // Cleanup skills autosave subscription on sign-out
            try {
              if (skillsUnsub) {
                skillsUnsub();
                skillsUnsub = null;
              }
            } catch (e) { /* ignore */ }
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('[useAuth] Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign in successful:', result.user?.email);
      return result.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.debug('[useAuth] Starting logout...');
      
      await signOut(auth);
      console.debug('[useAuth] Firebase signOut successful');
      
      // Clear local auth store (user + PIN verification flag)
      try {
        useAuthStore.getState().signOut();
        console.debug('[useAuth] Auth store cleared (user + PIN verification reset)');
      } catch (e) {
        console.warn('[useAuth] Could not clear auth store:', e);
      }
    } catch (error) {
      console.error('[useAuth] Logout Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    logout
  };
};
