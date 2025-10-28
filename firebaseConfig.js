// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase config - RutiMind projesi
const firebaseConfig = {
  apiKey: "AIzaSyDsgCHHOx6iE9xPBOL14fb3areGTNDcMm4",
  authDomain: "rutimind-f9b19.firebaseapp.com",
  projectId: "rutimind-f9b19",
  storageBucket: "rutimind-f9b19.firebasestorage.app",
  messagingSenderId: "675395240473",
  appId: "1:675395240473:web:f8086c67d9815f8eb66088",
  // Persistence için önemli
  persistence: true
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Tarayıcı dilini kullan

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Her zaman hesap seçme ekranını göster
});
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;
