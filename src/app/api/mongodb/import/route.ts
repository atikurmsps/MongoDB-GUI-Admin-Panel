import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { EJSON } from 'bson';
import { ObjectId } from 'mongodb';

// Robust check for any BSON-like type to avoid recursing into it
function isBsonType(val: any): boolean {
    if (!val || typeof val !== 'object') return false;
    return (
        val._bsontype === 'ObjectID' ||
        val._bsontype === 'ObjectId' ||
        val instanceof ObjectId ||
        val instanceof Date ||
        (val.id && val.toHexString) // Common for various BSON versions
    );
}

// Recursive helper to ensure data types are correct and avoid corrupting handled types
function processData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(item => processData(item));
    } else if (data !== null && typeof data === 'object') {
        // IMPORTANT: If it's already a specialized MongoDB type (parsed by EJSON), 
        // do NOT recurse into it, or it will be corrupted into a plain object.
        if (isBsonType(data)) {
            return data;
        }

        const processed: any = {};
        for (const key in data) {
            const value = data[key];

            // 1. If the value is a string that is a valid 24-char hex ObjectId, convert it.
            // This handles cases where the JSON has plain strings instead of {$oid: ...}.
            if (typeof value === 'string' && value.length === 24 && ObjectId.isValid(value)) {
                processed[key] = new ObjectId(value);
            }
            // 2. Otherwise recurse
            else {
                processed[key] = processData(value);
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
