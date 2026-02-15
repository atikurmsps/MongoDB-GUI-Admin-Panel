import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbName = searchParams.get('db');
    const colName = searchParams.get('col');

    if (!dbName) {
        return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
    }

    try {
        const dump = await req.json();
        const db = await getDb(dbName);

        if (colName) {
            // Import into specific collection
            // Expected dump format for single col: either array of docs OR { colName: [docs] }
            let data = Array.isArray(dump) ? dump : dump[colName];
            if (!Array.isArray(data)) {
                // Try to get first key if it's an object with one key
                const keys = Object.keys(dump);
                if (keys.length === 1 && Array.isArray(dump[keys[0]])) {
                    data = dump[keys[0]];
                }
            }

            if (Array.isArray(data) && data.length > 0) {
                await db.collection(colName).insertMany(data);
            }
        } else {
            // Bulk import
            for (const collectionName in dump) {
                if (Array.isArray(dump[collectionName]) && dump[collectionName].length > 0) {
                    await db.collection(collectionName).insertMany(dump[collectionName]);
                }
            }
        }

        return NextResponse.json({ message: 'Import successful' });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to import' }, { status: 500 });
    }
}
