// SQLite Database service

import { Platform } from 'react-native';
// Import expo-sqlite only on native platforms — on web this native module
// is not available and causes `Cannot find native module 'ExpoSQLite'`.
let SQLite: any = null;
if (Platform.OS !== 'web') {
  // Use require to avoid bundling the native module for web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SQLite = require('expo-sqlite');
}
import type {
  DBSkill,
  DBReinforcer,
  DBSession,
  DBSkillResponse,
} from '../types';

const DB_NAME = 'rutimind.db';

// Use `any` for db to avoid TS errors when SQLite is not present on web
let db: any = null;

/**
 * Initialize database and create tables
 */
export async function initDatabase(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !SQLite) {
      // On web, expo-sqlite native module isn't available. Skip DB init and
      // provide a noop/stub so the app doesn't crash — database calls will
      // still throw if used. For a production web build you should replace
      // this with an IndexedDB/LocalForage implementation.
      console.warn('SQLite is not available on web — skipping DB initialization.');
      db = {
        execAsync: async () => {
          console.warn('execAsync called on web noop DB');
        },
        runAsync: async () => {
          throw new Error('Database is not available on web');
        },
        getAllAsync: async () => {
          throw new Error('Database is not available on web');
        },
        closeAsync: async () => {
          console.warn('closeAsync noop on web');
        },
      };
      return;
    }

    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create skills table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        image_uri TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Create reinforcers table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reinforcers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        slot INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Create sessions table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        wait_duration INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Create skill_responses table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS skill_responses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        response_time INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions (id),
        FOREIGN KEY (skill_id) REFERENCES skills (id)
      );
    `);
    
    // Create indexes for better query performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_skills_order ON skills(order_index);
      CREATE INDEX IF NOT EXISTS idx_reinforcers_slot ON reinforcers(slot);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_responses_session ON skill_responses(session_id);
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
function getDB(): any {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ===== SKILLS CRUD =====

export async function insertSkill(skill: Omit<DBSkill, 'created_at' | 'updated_at'>): Promise<void> {
  const database = getDB();
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO skills (id, name, category_id, order_index, duration, image_uri, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [skill.id, skill.name, skill.category_id, skill.order_index, skill.duration, skill.image_uri, now, now]
  );
}

export async function getAllSkills(): Promise<DBSkill[]> {
  const database = getDB();
  const result = await database.getAllAsync('SELECT * FROM skills ORDER BY order_index ASC');
  return result as DBSkill[];
}

export async function updateSkill(id: string, updates: Partial<DBSkill>): Promise<void> {
  const database = getDB();
  const now = new Date().toISOString();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  await database.runAsync(
    `UPDATE skills SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteSkill(id: string): Promise<void> {
  const database = getDB();
  await database.runAsync('DELETE FROM skills WHERE id = ?', [id]);
}

export async function clearAllSkills(): Promise<void> {
  const database = getDB();
  await database.runAsync('DELETE FROM skills');
}

// ===== REINFORCERS CRUD =====

export async function insertReinforcer(reinforcer: Omit<DBReinforcer, 'created_at' | 'updated_at'>): Promise<void> {
  const database = getDB();
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO reinforcers (id, name, image_uri, slot, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [reinforcer.id, reinforcer.name, reinforcer.image_uri, reinforcer.slot, reinforcer.order_index, now, now]
  );
}

export async function getAllReinforcers(): Promise<DBReinforcer[]> {
  const database = getDB();
  const result = await database.getAllAsync('SELECT * FROM reinforcers ORDER BY slot ASC, order_index ASC');
  return result as DBReinforcer[];
}

export async function updateReinforcer(id: string, updates: Partial<DBReinforcer>): Promise<void> {
  const database = getDB();
  const now = new Date().toISOString();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  await database.runAsync(
    `UPDATE reinforcers SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteReinforcer(id: string): Promise<void> {
  const database = getDB();
  await database.runAsync('DELETE FROM reinforcers WHERE id = ?', [id]);
}

// ===== SESSIONS CRUD =====

export async function insertSession(session: Omit<DBSession, 'created_at' | 'updated_at'>): Promise<void> {
  const database = getDB();
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO sessions (id, user_id, start_time, end_time, wait_duration, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [session.id, session.user_id, session.start_time, session.end_time, session.wait_duration, session.status, now, now]
  );
}

export async function getAllSessions(userId: string): Promise<DBSession[]> {
  const database = getDB();
  const result = await database.getAllAsync('SELECT * FROM sessions WHERE user_id = ? ORDER BY start_time DESC', [userId]);
  return result as DBSession[];
}

export async function getSessionsByDateRange(userId: string, startDate: string, endDate: string): Promise<DBSession[]> {
  const database = getDB();
  const result = await database.getAllAsync('SELECT * FROM sessions WHERE user_id = ? AND start_time >= ? AND start_time <= ? ORDER BY start_time DESC', [userId, startDate, endDate]);
  return result as DBSession[];
}

export async function updateSession(id: string, updates: Partial<DBSession>): Promise<void> {
  const database = getDB();
  const now = new Date().toISOString();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  await database.runAsync(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

// ===== SKILL RESPONSES CRUD =====

export async function insertSkillResponse(response: DBSkillResponse): Promise<void> {
  const database = getDB();
  
  await database.runAsync(
    `INSERT INTO skill_responses (id, session_id, skill_id, response, timestamp, response_time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [response.id, response.session_id, response.skill_id, response.response, response.timestamp, response.response_time]
  );
}

export async function getResponsesBySession(sessionId: string): Promise<DBSkillResponse[]> {
  const database = getDB();
  const result = await database.getAllAsync('SELECT * FROM skill_responses WHERE session_id = ? ORDER BY timestamp ASC', [sessionId]);
  return result as DBSkillResponse[];
}

export async function getResponsesByDateRange(userId: string, startDate: string, endDate: string): Promise<DBSkillResponse[]> {
  const database = getDB();
  const result = await database.getAllAsync(
    `SELECT sr.* FROM skill_responses sr
     JOIN sessions s ON sr.session_id = s.id
     WHERE s.user_id = ? AND sr.timestamp >= ? AND sr.timestamp <= ?
     ORDER BY sr.timestamp ASC`,
    [userId, startDate, endDate]
  );
  return result as DBSkillResponse[];
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('Database closed');
  }
}
