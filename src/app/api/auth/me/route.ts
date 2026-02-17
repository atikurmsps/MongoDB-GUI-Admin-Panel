import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}
