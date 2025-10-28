import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { useAuthStore } from '../src/store/authStore';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

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
          } else {
            useAuthStore.getState().setUser(null);
            useAuthStore.getState().setLoading(false);
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
