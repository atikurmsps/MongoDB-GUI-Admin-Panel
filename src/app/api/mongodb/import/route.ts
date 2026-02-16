import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { EJSON } from 'bson';
import { ObjectId } from 'mongodb';

// Recursive helper to convert string _ids to ObjectIds
function processData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(item => processData(item));
    } else if (data !== null && typeof data === 'object') {
        const processed: any = {};
        for (const key in data) {
            if (key === '_id' && typeof data[key] === 'string' && ObjectId.isValid(data[key])) {
                processed[key] = new ObjectId(data[key]);
            } else {
                processed[key] = processData(data[key]);
            }
        }
        return processed;
    }
    return data;
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbName = searchParams.get('db');
    const colName = searchParams.get('col');

    if (!dbName) {
        return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
    }

    try {
        const text = await req.text();
        const dump = EJSON.parse(text);
        const db = await getDb(dbName);

        if (colName) {
            let data = Array.isArray(dump) ? dump : dump[colName];
            if (!Array.isArray(data)) {
                const keys = Object.keys(dump);
                if (keys.length === 1 && Array.isArray(dump[keys[0]])) {
                    data = dump[keys[0]];
                }
            }

            if (Array.isArray(data) && data.length > 0) {
                const processed = processData(data);
                await db.collection(colName).insertMany(processed);
            }
        } else {
            for (const collectionName in dump) {
                if (Array.isArray(dump[collectionName]) && dump[collectionName].length > 0) {
                    const processed = processData(dump[collectionName]);
                    await db.collection(collectionName).insertMany(processed);
                }
            }
        }

        return NextResponse.json({ message: 'Import successful' });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to import' }, { status: 500 });
    }
}
