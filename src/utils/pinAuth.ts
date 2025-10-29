// PIN Authentication utilities using expo-secure-store and expo-crypto

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const PIN_KEY = 'user_pin_hashed';
const SALT_KEY = 'user_pin_salt';
const FAILED_ATTEMPTS_KEY = 'pin_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'pin_lockout_until';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// --- Compatibility wrappers (exported for Firestore sync) ---
// expo-secure-store provides getItemAsync/setItemAsync/deleteItemAsync on native.
// On web or in some mismatched versions these may be absent; fall back to localStorage.
export async function secureGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return Promise.resolve(localStorage.getItem(key));
  }
  try {
    // Support multiple expo-secure-store API names (different versions/platform builds)
    const ss: any = SecureStore || {};
    if (ss && ss.getItemAsync && typeof ss.getItemAsync === 'function') {
      try {
        return await ss.getItemAsync(key);
      } catch (e) {
        console.warn('SecureStore.getItemAsync failed', e);
      }
    }
    if (ss && ss.getValueWithKeyAsync && typeof ss.getValueWithKeyAsync === 'function') {
      try {
        return await ss.getValueWithKeyAsync(key);
      } catch (e) {
        console.warn('SecureStore.getValueWithKeyAsync failed', e);
      }
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return Promise.resolve((globalThis as any).localStorage.getItem(key));
    }
    return Promise.resolve(null);
  } catch (e) {
    console.warn('secureGetItem fallback hit for', key, e);
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return Promise.resolve((globalThis as any).localStorage.getItem(key));
    }
    return Promise.resolve(null);
  }
}


export async function secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  try {
    const ss: any = SecureStore || {};
    if (ss && ss.setItemAsync && typeof ss.setItemAsync === 'function') {
      try {
        return await ss.setItemAsync(key, value);
      } catch (e) {
        console.warn('SecureStore.setItemAsync failed', e);
      }
    }
    if (ss && ss.setValueWithKeyAsync && typeof ss.setValueWithKeyAsync === 'function') {
      try {
        return await ss.setValueWithKeyAsync(key, value);
      } catch (e) {
        console.warn('SecureStore.setValueWithKeyAsync failed', e);
      }
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return Promise.resolve();
  } catch (e) {
    console.warn('secureSetItem fallback hit for', key, e);
    // Try localStorage as last resort
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.setItem(key, value);
    }
  }
}

async function secureDeleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  try {
    const ss: any = SecureStore || {};
    if (ss && ss.deleteItemAsync && typeof ss.deleteItemAsync === 'function') {
      try {
        return await ss.deleteItemAsync(key);
      } catch (e) {
        console.warn('SecureStore.deleteItemAsync failed', e);
      }
    }
    if (ss && ss.deleteValueWithKeyAsync && typeof ss.deleteValueWithKeyAsync === 'function') {
      try {
        return await ss.deleteValueWithKeyAsync(key);
      } catch (e) {
        console.warn('SecureStore.deleteValueWithKeyAsync failed', e);
      }
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.removeItem(key);
      return Promise.resolve();
    }
    return Promise.resolve();
  } catch (e) {
    console.warn('secureDeleteItem fallback hit for', key, e);
    return Promise.resolve();
  }
}

/**
 * Generate a random salt for PIN hashing
 */
async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash PIN using PBKDF2
 */
async function hashPIN(pin: string, salt: string): Promise<string> {
  const iterations = 10000;
  
  // Combine PIN and salt
  const message = pin + salt;
  
  // Use PBKDF2-like approach with repeated SHA-256
  let hash = message;
  for (let i = 0; i < iterations; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hash
    );
  }
  
  return hash;
}

/**
 * Set up a new PIN for the user (MUST be 6 digits)
 * Returns hash and salt for Firestore sync
 */
export async function setupPIN(pin: string): Promise<{ hash: string; salt: string }> {
  try {
    // Validate PIN - MUST be exactly 6 digits
    if (pin.length !== 6) {
      throw new Error('PIN must be exactly 6 digits');
    }
    
    if (!/^\d+$/.test(pin)) {
      throw new Error('PIN must contain only digits');
    }
    
    // Generate salt
    const salt = await generateSalt();
    
    // Hash PIN
    const hashedPIN = await hashPIN(pin, salt);
    
    // Store hashed PIN and salt locally
  await secureSetItem(PIN_KEY, hashedPIN);
  await secureSetItem(SALT_KEY, salt);
    
    // Reset failed attempts
  await secureDeleteItem(FAILED_ATTEMPTS_KEY);
  await secureDeleteItem(LOCKOUT_UNTIL_KEY);
    
    console.log('[pinAuth] PIN setup successful (local storage)');
    
    // Return hash and salt so caller can sync to Firestore
    return { hash: hashedPIN, salt };
  } catch (error) {
    console.error('[pinAuth] Error setting up PIN:', error);
    throw error;
  }
}

/**
 * Verify if the entered PIN is correct
 */
export async function verifyPIN(pin: string): Promise<boolean> {
  try {
    // Check if account is locked out
    const isLockedOut = await checkLockout();
    if (isLockedOut) {
      throw new Error('Account is locked due to too many failed attempts');
    }
    
    // Get stored hash and salt
  const storedHash = await secureGetItem(PIN_KEY);
  const salt = await secureGetItem(SALT_KEY);
    
    if (!storedHash || !salt) {
      throw new Error('PIN not set up');
    }
    
    // Hash entered PIN
    const enteredHash = await hashPIN(pin, salt);
    
    // Compare hashes
    const isCorrect = enteredHash === storedHash;
    
    if (isCorrect) {
      // Reset failed attempts on success
  await secureDeleteItem(FAILED_ATTEMPTS_KEY);
  await secureDeleteItem(LOCKOUT_UNTIL_KEY);
      return true;
    } else {
      // Increment failed attempts
      await incrementFailedAttempts();
      return false;
    }
  } catch (error) {
    console.error('Error verifying PIN:', error);
    throw error;
  }
}

/**
 * Check if PIN exists
 */
export async function hasPIN(): Promise<boolean> {
  try {
    const storedHash = await secureGetItem(PIN_KEY);
    return storedHash !== null;
  } catch (error) {
    console.error('Error checking PIN existence:', error);
    return false;
  }
}

/**
 * Clear PIN (on sign out)
 */
export async function clearPIN(): Promise<void> {
  try {
    await secureDeleteItem(PIN_KEY);
    await secureDeleteItem(SALT_KEY);
    await secureDeleteItem(FAILED_ATTEMPTS_KEY);
    await secureDeleteItem(LOCKOUT_UNTIL_KEY);
    console.log('PIN cleared successfully');
  } catch (error) {
    console.error('Error clearing PIN:', error);
    throw error;
  }
}

/**
 * Increment failed PIN attempts
 */
async function incrementFailedAttempts(): Promise<void> {
  try {
    const attemptsStr = await secureGetItem(FAILED_ATTEMPTS_KEY);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    const newAttempts = attempts + 1;
    
  await secureSetItem(FAILED_ATTEMPTS_KEY, newAttempts.toString());
    
    // If max attempts reached, set lockout time
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  await secureSetItem(LOCKOUT_UNTIL_KEY, lockoutUntil.toString());
    }
  } catch (error) {
    console.error('Error incrementing failed attempts:', error);
  }
}

/**
 * Check if account is currently locked out
 */
export async function checkLockout(): Promise<boolean> {
  try {
  const lockoutUntilStr = await secureGetItem(LOCKOUT_UNTIL_KEY);
    
    if (!lockoutUntilStr) {
      return false;
    }
    
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const now = Date.now();
    
    if (now >= lockoutUntil) {
      // Lockout period has passed, clear it
      await secureDeleteItem(FAILED_ATTEMPTS_KEY);
      await secureDeleteItem(LOCKOUT_UNTIL_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking lockout:', error);
    return false;
  }
}

/**
 * Get remaining lockout time in minutes
 */
export async function getLockoutTimeRemaining(): Promise<number> {
  try {
    const lockoutUntilStr = await secureGetItem(LOCKOUT_UNTIL_KEY);
    
    if (!lockoutUntilStr) {
      return 0;
    }
    
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const now = Date.now();
    const remaining = lockoutUntil - now;
    
    if (remaining <= 0) {
      return 0;
    }
    
    return Math.ceil(remaining / 60000); // Convert to minutes
  } catch (error) {
    console.error('Error getting lockout time remaining:', error);
    return 0;
  }
}

/**
 * Get number of failed attempts
 */
export async function getFailedAttempts(): Promise<number> {
  try {
  const attemptsStr = await secureGetItem(FAILED_ATTEMPTS_KEY);
    return attemptsStr ? parseInt(attemptsStr, 10) : 0;
  } catch (error) {
    console.error('Error getting failed attempts:', error);
    return 0;
  }
}
