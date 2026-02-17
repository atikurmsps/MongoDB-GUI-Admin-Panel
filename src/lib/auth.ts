import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

import { getSetting, getUser } from './sqlite';

function getSecretKey() {
    // 1. Prioritize Environment Variable
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }

    try {
        // 2. Fallback to SQLite Setting
        const dbSecret = getSetting('jwt_secret');
        if (dbSecret) return dbSecret;
    } catch (error) {
        // Silent catch for build-time or edge cases where SQLite might not be ready
    }

    // 3. Final Fallback (Security Warning: This should be configured in production)
    return 'fallback-secret-key-don-t-use-this';
}


const getEncodedKey = () => new TextEncoder().encode(getSecretKey());


export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function createToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(getEncodedKey());
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getEncodedKey(), {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getAuthSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return await verifyToken(token);
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

