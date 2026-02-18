import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getSetting, getUser, getSession, createSession, updateSessionExpiry, deleteSession, cleanupExpiredSessions } from './sqlite';
import { v4 as uuidv4 } from 'uuid';

export const SESSION_DURATION = 60 * 60; // 1 hour in seconds

export async function createAuthSession(user: any) {
    const sessionId = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

    createSession(sessionId, user.id, expiresAt, JSON.stringify({
        username: user.username,
        role: user.role,
        allowed_databases: user.allowed_databases
    }));

    const cookieStore = await cookies();
    cookieStore.set('auth_token', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });

    return sessionId;
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function getAuthSession() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_token')?.value;
    if (!sessionId) return null;

    const session = getSession(sessionId);
    if (!session) return null;

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at < now) {
        deleteSession(sessionId);
        return null;
    }

    // Rolling expiration: update expiry time on activity
    const newExpiresAt = now + SESSION_DURATION;
    updateSessionExpiry(sessionId, newExpiresAt);

    // Update cookie too
    cookieStore.set('auth_token', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });

    try {
        return JSON.parse(session.data || '{}');
    } catch (e) {
        return null;
    }
}

export async function clearAuthSession() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_token')?.value;
    if (sessionId) {
        deleteSession(sessionId);
    }
    cookieStore.delete('auth_token');
    cleanupExpiredSessions();
}

export async function validateAdminCredentials(username: string, pass: string) {
    // Check env vars first (as a override/fail-safe)
    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    if (envUser && envPass) {
        if (username === envUser && pass === envPass) return true;
    }

    // Check SQLite Users Table
    try {
        const user = getUser(username);
        if (user && await comparePassword(pass, user.password_hash)) {
            return true;
        }
    } catch (e) {
        console.error("SQLite auth check failed", e);
    }

    return false;
}

export function hasDatabaseAccess(session: any, dbName: string) {
    if (!session) return false;
    if (session.role === 'admin') return true;
    if (session.allowed_databases === '*') return true;

    const allowed = (session.allowed_databases || '').split(',').map((d: string) => d.trim().toLowerCase());
    return allowed.includes(dbName.toLowerCase());
}

