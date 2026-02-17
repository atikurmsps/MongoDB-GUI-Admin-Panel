import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthSession, hasDatabaseAccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        if (!session || session.role === 'viewer') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { database, collection, action } = await req.json();

        if (!database || !collection || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!hasDatabaseAccess(session, database)) {
            return NextResponse.json({ error: 'Database access denied' }, { status: 403 });
        }

        const db = await getDb(database);


        if (action === 'drop') {
            await db.collection(collection).drop();
            return NextResponse.json({ message: `Collection ${collection} dropped successfully` });
        } else if (action === 'empty') {
            await db.collection(collection).deleteMany({});
            return NextResponse.json({ message: `Collection ${collection} emptied successfully` });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Collection action error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to perform action' }, { status: 500 });
    }
}

