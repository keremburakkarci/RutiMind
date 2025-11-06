// Response Recording Service - Save student responses to SQLite

import { Platform } from 'react-native';
// Do NOT statically import 'expo-sqlite' at module top-level — on web the
// native module is not available and Metro will attempt to require it,
// causing "Cannot find native module 'ExpoSQLite'". Use a guarded require
// so the native module is only required on native platforms.
let SQLite: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SQLite = require('expo-sqlite');
}
import type { SkillResponse } from './sessionManager';

// Response record stored in SQLite
export interface ResponseRecord {
  id?: number;
  userId: string;
  sessionDate: string; // ISO date string (YYYY-MM-DD)
  skillId: string;
  skillName: string;
  response: SkillResponse;
  timestamp: number; // Unix timestamp (ms)
}

// Use a loose `any` for the DB instance because on web SQLite will be null
// and we avoid importing types that reference the native module.
let db: any = null;

/**
 * Initialize the responses database (only on native).
 */
export async function initResponsesDB(): Promise<void> {
  if (Platform.OS === 'web' || !SQLite) {
    // On web we do not initialize a native SQLite DB. The app should use a
    // localStorage/IndexedDB-based fallback for web if persistence is required.
    console.warn('[ResponseService] SQLite not available on web, skipping DB init.');
    db = null;
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync('rutimind.db');

    // Create responses table if not exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        sessionDate TEXT NOT NULL,
        skillId TEXT NOT NULL,
        skillName TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_responses_user_date ON responses(userId, sessionDate);
      CREATE INDEX IF NOT EXISTS idx_responses_timestamp ON responses(timestamp);
    `);

    console.log('[ResponseService] Database initialized successfully.');
  } catch (error) {
    console.error('[ResponseService] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save a response to the database.
 */
export async function saveResponse(record: ResponseRecord): Promise<void> {
  if (Platform.OS === 'web') {
    console.warn('[ResponseService] SQLite not available on web, response not saved:', record);
    return;
  }

  if (!db) {
    console.error('[ResponseService] Database not initialized.');
    throw new Error('Database not initialized');
  }

  try {
    await db.runAsync(
      `INSERT INTO responses (userId, sessionDate, skillId, skillName, response, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.userId,
        record.sessionDate,
        record.skillId,
        record.skillName,
        record.response,
        record.timestamp,
      ]
    );
    console.log('[ResponseService] Response saved:', record.skillId, record.response);
  } catch (error) {
    console.error('[ResponseService] Failed to save response:', error);
    throw error;
  }
}

/**
 * Get all responses for a specific user and date.
 */
export async function getResponsesByDate(
  userId: string,
  sessionDate: string
): Promise<ResponseRecord[]> {
  if (Platform.OS === 'web') {
    console.warn('[ResponseService] SQLite not available on web, returning empty responses.');
    return [];
  }

  if (!db) {
    console.error('[ResponseService] Database not initialized.');
    return [];
  }

  try {
    const rows = await db.getAllAsync(
      `SELECT * FROM responses WHERE userId = ? AND sessionDate = ? ORDER BY timestamp ASC`,
      [userId, sessionDate]
    );
    return rows as ResponseRecord[];
  } catch (error) {
    console.error('[ResponseService] Failed to fetch responses:', error);
    return [];
  }
}

/**
 * Get aggregated daily stats for a user (for Progress chart).
 * Returns array of { date, totalResponses, yesCount, noCount, noResponseCount }.
 */
export async function getDailyStats(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<Array<{ date: string; totalResponses: number; yesCount: number; noCount: number; noResponseCount: number }>> {
  if (Platform.OS === 'web') {
    console.warn('[ResponseService] SQLite not available on web, returning empty stats.');
    return [];
  }

  if (!db) {
    console.error('[ResponseService] Database not initialized.');
    return [];
  }

  try {
    let query = `
      SELECT
        sessionDate as date,
        COUNT(*) as totalResponses,
        SUM(CASE WHEN response = 'yes' THEN 1 ELSE 0 END) as yesCount,
        SUM(CASE WHEN response = 'no' THEN 1 ELSE 0 END) as noCount,
        SUM(CASE WHEN response = 'no-response' THEN 1 ELSE 0 END) as noResponseCount
      FROM responses
      WHERE userId = ?
    `;
    const params: string[] = [userId];

    if (startDate && endDate) {
      query += ' AND sessionDate BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY sessionDate ORDER BY sessionDate DESC';

  const rows = await db.getAllAsync(query, params);
  return rows as Array<{ date: string; totalResponses: number; yesCount: number; noCount: number; noResponseCount: number }>;
  } catch (error) {
    console.error('[ResponseService] Failed to fetch daily stats:', error);
    return [];
  }
}

/**
 * Delete all responses for a user (for data export/delete feature).
 */
export async function deleteUserResponses(userId: string): Promise<void> {
  if (Platform.OS === 'web') {
    console.warn('[ResponseService] SQLite not available on web, nothing to delete.');
    return;
  }

  if (!db) {
    console.error('[ResponseService] Database not initialized.');
    throw new Error('Database not initialized');
  }

  try {
    await db.runAsync('DELETE FROM responses WHERE userId = ?', [userId]);
    console.log('[ResponseService] All responses deleted for user:', userId);
  } catch (error) {
    console.error('[ResponseService] Failed to delete responses:', error);
    throw error;
  }
}
