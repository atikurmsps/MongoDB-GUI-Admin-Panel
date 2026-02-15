import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: NextRequest) {
    try {
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
