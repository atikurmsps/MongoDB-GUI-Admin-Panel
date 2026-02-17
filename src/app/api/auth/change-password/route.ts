import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, hashPassword, comparePassword } from '@/lib/auth';
import { getUser, updateUser } from '@/lib/sqlite';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        if (!session || !session.username) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        // 1. Check if ENV user is being used
        if (session.username === process.env.ADMIN_USERNAME) {
            // If it's env user, we can't change it here easily (needs .env edit).
            // But we can allow it if matches. 
            // Actually, usually env user is static. 
            // Let's check if currentPassword matches env.
            if (currentPassword !== process.env.ADMIN_PASSWORD) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Cannot change password for environment-defined user here' }, { status: 403 });
        }

        // 2. Check SQLite user
        const user = getUser(session.username);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isCorrect = await comparePassword(currentPassword, user.password_hash);
        if (!isCorrect) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }

        const newHashed = await hashPassword(newPassword);
        updateUser(user.id, { password_hash: newHashed });

        return NextResponse.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
