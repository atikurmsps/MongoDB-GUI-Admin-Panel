import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbName = searchParams.get('db');

    if (!dbName) {
        return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
    }

    try {
        const db = await getDb(dbName);
        const collections = await db.listCollections().toArray();

        const collectionsWithStats = await Promise.all(
            collections.map(async (col) => {
                try {
                    const stats = await db.command({ collStats: col.name });
                    return {
                        name: col.name,
                        count: stats.count,
                        size: stats.size,
                    };
                } catch (err) {
                    // If collStats fails (e.g. on views), return just the name
                    return { name: col.name, count: 0, size: 0 };
                }
            })
        );

        return NextResponse.json(collectionsWithStats);
    } catch (error) {
        console.error('List collections error:', error);
        return NextResponse.json({ error: 'Failed to list collections' }, { status: 500 });
    }
}
