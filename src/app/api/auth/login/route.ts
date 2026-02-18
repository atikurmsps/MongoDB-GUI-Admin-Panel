import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        const isValid = await validateAdminCredentials(username, password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Determine role and allowed databases
        let userForSession: any = { username, role: 'admin', allowed_databases: '*' };
        const dbUser = await import('@/lib/sqlite').then(m => m.getUser(username));
        if (dbUser) {
            userForSession = {
                id: dbUser.id,
                username: dbUser.username,
                role: dbUser.role,
                allowed_databases: dbUser.allowed_databases || '*'
            };
        } else {
            // For env users, we need a dummy ID or handle them specially
            userForSession.id = 0;
        }

        await import('@/lib/auth').then(m => m.createAuthSession(userForSession));

        return NextResponse.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
