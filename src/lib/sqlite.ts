import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_NAME = 'settings.db';
const DB_PATH = path.join(process.cwd(), DB_NAME);

// Ensure directory exists if needed, though usually CWD is fine.
// const dbDir = path.dirname(DB_PATH);
// if (!fs.existsSync(dbDir)) {
//     fs.mkdirSync(dbDir, { recursive: true });
// }

let db: Database.Database;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password_hash TEXT,
                role TEXT DEFAULT 'admin',
                allowed_databases TEXT DEFAULT '*',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration: Add allowed_databases if it doesn't exist
        try {
            db.exec('ALTER TABLE users ADD COLUMN allowed_databases TEXT DEFAULT "*"');
        } catch (e) {
            // Column already exists probably
        }
    }
    return db;
}


export interface UserRow {
    id: number;
    username: string;
    password_hash: string;
    role: string;
    allowed_databases: string;
    created_at: string;
}

export function getUser(username: string): UserRow | null {
    const stmt = getDb().prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as UserRow | undefined;
    return user || null;
}

export function getAllUsers(): UserRow[] {
    const stmt = getDb().prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as UserRow[];
}

export function addUser(username: string, passwordHash: string, role = 'admin', allowedDatabases = '*'): void {
    const stmt = getDb().prepare('INSERT INTO users (username, password_hash, role, allowed_databases) VALUES (?, ?, ?, ?)');
    stmt.run(username, passwordHash, role, allowedDatabases);
}

export function updateUser(id: number, data: { username?: string, password_hash?: string, role?: string, allowed_databases?: string }): void {
    const fields = [];
    const values = [];
    if (data.username) { fields.push('username = ?'); values.push(data.username); }
    if (data.password_hash) { fields.push('password_hash = ?'); values.push(data.password_hash); }
    if (data.role) { fields.push('role = ?'); values.push(data.role); }
    if (data.allowed_databases !== undefined) { fields.push('allowed_databases = ?'); values.push(data.allowed_databases); }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = getDb().prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
}

export function deleteUser(id: number): void {
    const stmt = getDb().prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
}

export function countUsers(): number {
    const stmt = getDb().prepare('SELECT COUNT(*) as count FROM users');
    const row = stmt.get() as { count: number };
    return row.count;
}



export function getSetting(key: string): string | null {
    const stmt = getDb().prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
    const stmt = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
}

export function deleteSetting(key: string): void {
    const stmt = getDb().prepare('DELETE FROM settings WHERE key = ?');
    stmt.run(key);
}

export function initSettings() {
    getDb(); // Ensures table exists
}
