// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Firebase config - RutiMind projesi
const firebaseConfig = {
  apiKey: "AIzaSyDsgCHHOx6iE9xPBOL14fb3areGTNDcMm4",
  authDomain: "rutimind-f9b19.firebaseapp.com",
  projectId: "rutimind-f9b19",
  storageBucket: "rutimind-f9b19.firebasestorage.app",
  messagingSenderId: "675395240473",
  appId: "1:675395240473:web:f8086c67d9815f8eb66088",
  // NOTE: persistence is configured below on the auth instance
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Tarayıcı dilini kullan

// Ensure persistent auth on web platforms. This must be set before sign-in flows
// to avoid losing auth state on reloads (important for PIN flow decisions).
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.debug('[firebaseConfig] Auth persistence set to browserLocalPersistence'))
    .catch((e) => console.warn('[firebaseConfig] Could not set auth persistence:', e));
}

// Initialize Firestore with web-friendly long-polling settings
// This fixes 400 (Bad Request) errors from webchannel stream failures
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Use long-polling instead of WebChannel streaming
  useFetchStreams: false, // Disable fetch-based streams (can cause issues on some browsers/networks)
});

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Her zaman hesap seçme ekranını göster
});
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;
