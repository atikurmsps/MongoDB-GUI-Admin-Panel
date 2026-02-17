import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }


        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
        }

        const db = await getDb(name);
        await db.dropDatabase();

        return NextResponse.json({ message: `Database ${name} dropped successfully` });
    } catch (error) {
        console.error('Drop database error:', error);
        return NextResponse.json({ error: 'Failed to drop database' }, { status: 500 });
    }
}

