import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        const envUsername = process.env.ADMIN_USERNAME;
        const envPassword = process.env.ADMIN_PASSWORD;

        if (!envUsername || !envPassword) {
            return NextResponse.json({ error: 'Server authentication not configured' }, { status: 500 });
        }

        if (username !== envUsername || password !== envPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await createToken({ username: envUsername });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/',
        });

        return NextResponse.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
