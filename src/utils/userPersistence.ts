import { Platform } from 'react-native';

// Small helper that uses AsyncStorage on native (if available) and localStorage on web.
// Keeps a tiny, well-documented API for saving/loading per-user blobs.

async function getStorage() {
  if (Platform.OS === 'web') {
    return {
      async getItem(key: string) {
        try {
          return (globalThis as any)?.localStorage?.getItem(key) ?? null;
        } catch (e) {
          console.warn('[userPersistence] localStorage.getItem failed', e);
          return null;
        }
      },
      async setItem(key: string, value: string) {
        try {
          (globalThis as any)?.localStorage?.setItem(key, value);
        } catch (e) {
          console.warn('[userPersistence] localStorage.setItem failed', e);
        }
      },
      async removeItem(key: string) {
        try {
          (globalThis as any)?.localStorage?.removeItem(key);
        } catch (e) {
          console.warn('[userPersistence] localStorage.removeItem failed', e);
        }
      }
    };
  }

  try {
    // Use dynamic require to avoid bundling issues on web
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return {
      async getItem(key: string) { return await AsyncStorage.getItem(key); },
      async setItem(key: string, value: string) { return await AsyncStorage.setItem(key, value); },
      async removeItem(key: string) { return await AsyncStorage.removeItem(key); },
    };
  } catch (e) {
    console.warn('[userPersistence] AsyncStorage not available, falling back to in-memory/localStorage where possible', e);
    return {
      async getItem(key: string) {
        try { return (globalThis as any)?.localStorage?.getItem(key) ?? null; } catch (e) { return null; }
      },
      async setItem(key: string, value: string) {
        try { (globalThis as any)?.localStorage?.setItem(key, value); } catch (e) { /* ignore */ }
      },
      async removeItem(key: string) {
        try { (globalThis as any)?.localStorage?.removeItem(key); } catch (e) { /* ignore */ }
      }
    };
  }
}

export async function saveSelectedSkillsForUser(userId: string, payload: any) {
  if (!userId) return;
  const storage = await getStorage();
  const key = `selectedSkills_${userId}`;
  try {
    await storage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn('[userPersistence] saveSelectedSkillsForUser failed', e);
  }
}

export async function loadSelectedSkillsForUser(userId: string) {
  if (!userId) return null;
  const storage = await getStorage();
  const key = `selectedSkills_${userId}`;
  try {
    const raw = await storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[userPersistence] loadSelectedSkillsForUser failed', e);
    return null;
  }
}

export async function saveSelectedReinforcersForUser(userId: string, payload: any) {
  if (!userId) {
    console.log('[userPersistence] saveSelectedReinforcersForUser: no userId');
    return;
  }
  const storage = await getStorage();
  const key = `selectedReinforcers_${userId}`;
  console.log('[userPersistence] Saving reinforcers for user', userId, 'key:', key);
  console.log('[userPersistence] Payload:', JSON.stringify(payload, null, 2));
  
  try {
    await storage.setItem(key, JSON.stringify(payload));
    console.log('[userPersistence] Save successful');
  } catch (e) {
    console.warn('[userPersistence] saveSelectedReinforcersForUser failed', e);
  }
}

export async function loadSelectedReinforcersForUser(userId: string) {
  if (!userId) {
    console.log('[userPersistence] loadSelectedReinforcersForUser: no userId');
    return null;
  }
  const storage = await getStorage();
  const key = `selectedReinforcers_${userId}`;
  console.log('[userPersistence] Loading reinforcers for user', userId, 'key:', key);
  
  try {
    const raw = await storage.getItem(key);
    console.log('[userPersistence] Raw data:', raw);
    const result = raw ? JSON.parse(raw) : null;
    console.log('[userPersistence] Parsed result:', result);
    return result;
  } catch (e) {
    console.warn('[userPersistence] loadSelectedReinforcersForUser failed', e);
    return null;
  }
}
