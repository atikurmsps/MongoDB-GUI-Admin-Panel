import { NextRequest, NextResponse } from 'next/server';
import { createToken, validateAdminCredentials } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        const isValid = await validateAdminCredentials(username, password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Determine role and allowed databases
        let role = 'admin'; // default for env users
        let allowed_databases = '*';
        const dbUser = await import('@/lib/sqlite').then(m => m.getUser(username));
        if (dbUser) {
            role = dbUser.role;
            allowed_databases = dbUser.allowed_databases || '*';
        }

        const token = await createToken({ username, role, allowed_databases });


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
