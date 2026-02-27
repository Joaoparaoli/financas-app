import path from 'path';
import fs from 'fs-extra';
import Database from 'better-sqlite3';
import { coreDbPath } from './paths';

let dbInstance;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  fs.ensureDirSync(path.dirname(coreDbPath));
  dbInstance = new Database(coreDbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance
    .prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        tenantDbPath TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)
    .run();

  return dbInstance;
}

export function createUser(user) {
  const db = getDb();
  const now = new Date().toISOString();
  const normalized = {
    ...user,
    email: user.email.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(
    `INSERT INTO users (id, name, email, passwordHash, tenantDbPath, createdAt, updatedAt)
     VALUES (@id, @name, @email, @passwordHash, @tenantDbPath, @createdAt, @updatedAt)`
  ).run(normalized);
  return normalized;
}

export function findUserByEmail(email) {
  if (!email) return null;
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  return row || null;
}

export function getUserById(id) {
  if (!id) return null;
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row || null;
}

export function updateUserTimestamp(id) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET updatedAt = ? WHERE id = ?').run(now, id);
}
