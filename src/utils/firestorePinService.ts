// Firestore PIN Service - Store and retrieve user PIN data from Firestore

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export interface UserPINData {
  email: string;
  pinHash: string;
  pinSalt: string;
  pinCreatedAt?: any;
  pinUpdatedAt?: any;
}

/**
 * Check if user has a PIN stored in Firestore
 */
export async function hasRemotePIN(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const data = userDoc.data();
    return !!(data?.pinHash && data?.pinSalt);
  } catch (error) {
    console.error('[FirestorePinService] Error checking remote PIN:', error);
    return false;
  }
}

/**
 * Get user PIN data from Firestore
 */
export async function getRemotePINData(userId: string): Promise<UserPINData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    
    if (!data?.pinHash || !data?.pinSalt) {
      return null;
    }
    
    return {
      email: data.email || '',
      pinHash: data.pinHash,
      pinSalt: data.pinSalt,
      pinCreatedAt: data.pinCreatedAt,
      pinUpdatedAt: data.pinUpdatedAt,
    };
  } catch (error) {
    console.error('[FirestorePinService] Error getting remote PIN data:', error);
    return null;
  }
}

/**
 * Save user PIN to Firestore (create or update)
 */
export async function saveRemotePIN(
  userId: string,
  email: string,
  pinHash: string,
  pinSalt: string
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    const pinData = {
      email,
      pinHash,
      pinSalt,
      pinUpdatedAt: serverTimestamp(),
    };
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userDocRef, pinData);
      console.log('[FirestorePinService] PIN updated in Firestore for user:', email);
    } else {
      // Create new document
      await setDoc(userDocRef, {
        ...pinData,
        pinCreatedAt: serverTimestamp(),
      });
      console.log('[FirestorePinService] PIN created in Firestore for user:', email);
    }
  } catch (error) {
    console.error('[FirestorePinService] Error saving remote PIN:', error);
    throw error;
  }
}

/**
 * Delete user PIN from Firestore
 */
export async function deleteRemotePIN(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        pinHash: null,
        pinSalt: null,
        pinUpdatedAt: serverTimestamp(),
      });
      console.log('[FirestorePinService] PIN deleted from Firestore');
    }
  } catch (error) {
    console.error('[FirestorePinService] Error deleting remote PIN:', error);
    throw error;
  }
}

/**
 * Sync local PIN to Firestore (call after setupPIN)
 */
export async function syncPINToFirestore(
  userId: string,
  email: string,
  pinHash: string,
  pinSalt: string
): Promise<void> {
  try {
    await saveRemotePIN(userId, email, pinHash, pinSalt);
    console.log('[FirestorePinService] PIN synced to Firestore successfully');
  } catch (error) {
    console.error('[FirestorePinService] Error syncing PIN to Firestore:', error);
    // Don't throw - allow local PIN to still work even if Firestore sync fails
    // (e.g., offline scenario)
  }
}

/**
 * Load PIN from Firestore to local storage (call on sign-in if local PIN missing)
 */
export async function loadPINFromFirestore(
  userId: string
): Promise<{ pinHash: string; pinSalt: string } | null> {
  try {
    const pinData = await getRemotePINData(userId);
    
    if (!pinData) {
      return null;
    }
    
    return {
      pinHash: pinData.pinHash,
      pinSalt: pinData.pinSalt,
    };
  } catch (error) {
    console.error('[FirestorePinService] Error loading PIN from Firestore:', error);
    return null;
  }
}
