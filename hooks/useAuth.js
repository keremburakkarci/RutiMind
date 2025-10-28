import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  setPersistence, 
  browserLocalPersistence,
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
        // Önce persistence'ı ayarla
        await setPersistence(auth, browserLocalPersistence);
        
        // Sonra auth state'i dinle
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          console.log('Auth state changed:', currentUser?.email);
          setUser(currentUser);
          setLoading(false);
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
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
      await signOut(auth);
      console.log('Logout successful');
      // Also clear local auth store
      try {
        useAuthStore.getState().signOut();
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Logout Error:', error);
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
