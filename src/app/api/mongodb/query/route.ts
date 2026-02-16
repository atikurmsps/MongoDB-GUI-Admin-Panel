import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { database, collection, query, options, action = 'find' } = await req.json();

        if (!database) {
            return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
        }

        const db = await getDb(database);

        let result;
        const queryObj = typeof query === 'string' ? JSON.parse(query) : query || {};
        const optionsObj = typeof options === 'string' ? JSON.parse(options) : options || {};

        switch (action) {
            case 'find':
                result = await db.collection(collection).find(queryObj, optionsObj).toArray();
                break;
            case 'aggregate':
                const pipeline = Array.isArray(queryObj) ? queryObj : [queryObj];
                result = await db.collection(collection).aggregate(pipeline, optionsObj).toArray();
                break;
            case 'count':
                result = await db.collection(collection).countDocuments(queryObj, optionsObj);
                break;
            case 'command':
                result = await db.command(queryObj);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Query error:', error);
        return NextResponse.json({ error: error.message || 'Failed to execute query' }, { status: 500 });
    }
}
