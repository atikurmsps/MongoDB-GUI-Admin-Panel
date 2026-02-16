import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';

// Recursive helper to ensure data types are correct (ObjectId strings/EJSON -> BSON types)
function processData(data: any): any {
    if (data === null || data === undefined) return data;

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => processData(item));
    }

    // Handle Objects
    if (typeof data === 'object') {
        // 1. Check if it's already a BSON type (ObjectId, Date, etc)
        if (data._bsontype || data instanceof ObjectId || data instanceof Date) {
            return data;
        }

        // 2. Handle EJSON $oid: "..."
        if (data.$oid && typeof data.$oid === 'string' && ObjectId.isValid(data.$oid)) {
            return new ObjectId(data.$oid);
        }

        // 3. Handle EJSON $date: "..." or $date: { $numberLong: "..." }
        if (data.$date) {
            const dateVal = typeof data.$date === 'object' ? data.$date.$numberLong : data.$date;
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) return d;
        }

        // 4. Recurse into plain objects
        const processed: any = {};
        for (const key in data) {
            const value = data[key];

            // Auto-convert 24-char hex strings that look like ObjectIds
            if (typeof value === 'string' && value.length === 24 && ObjectId.isValid(value)) {
                processed[key] = new ObjectId(value);
            } else {
                processed[key] = processData(value);
            }
        }
        return processed;
    }

    return data;
}

// Helper to create a query that finds a document by ANY representation of its ID
function resolveIdQuery(id: any): any {
    const filters: any[] = [];
    let target = id;

    // 1. Try to "hydrate" the ID if it's currently EJSON or a JSON string
    if (typeof id === 'string') {
        const trimmed = id.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                target = EJSON.parse(trimmed);
            } catch (e) {
                try {
                    target = JSON.parse(trimmed);
                    // If target is { $oid: "..." }, convert it to real ObjectId
                    if (target && target.$oid) {
                        target = new ObjectId(target.$oid);
                    }
                } catch (e2) { }
            }
        }
    }

    // Now 'target' might be a string, an ObjectId, or a plain object ($oid)
    if (target && typeof target === 'object' && target.$oid) {
        target = new ObjectId(target.$oid);
    }

    // Add the hydrated target if it's safe (BSON type or String)
    if (target instanceof ObjectId || typeof target === 'string') {
        filters.push({ _id: target });
    }

    try {
        // 2. Generate variants
        if (target instanceof ObjectId) {
            filters.push({ _id: target.toString() });
        } else if (typeof target === 'string' && target.length === 24 && ObjectId.isValid(target)) {
            filters.push({ _id: new ObjectId(target) });
        } else if (target && typeof target === 'object' && target.buffer) {
            // Handle corrupted "buffer" object
            const bytes = Object.values(target.buffer).filter(v => typeof v === 'number');
            if (bytes.length === 12) {
                const hex = Buffer.from(bytes as number[]).toString('hex');
                filters.push({ _id: new ObjectId(hex) });
                filters.push({ _id: hex });
            }
        }
    } catch (e) { }

    // Always include the raw input if it's a simple string
    if (typeof id === 'string' && !filters.find(f => f._id === id)) {
        filters.push({ _id: id });
    }

    // 3. De-duplicate using EJSON.stringify to distinguish types
    const uniqueFilters = filters.reduce((acc: any[], curr) => {
        const str = EJSON.stringify(curr);
        if (!acc.find(f => EJSON.stringify(f) === str)) {
            acc.push(curr);
        }
        return acc;
    }, []);

    if (uniqueFilters.length === 0) return { _id: id };
    if (uniqueFilters.length === 1) return uniqueFilters[0];
    return { $or: uniqueFilters };
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbName = (searchParams.get('db') || '').trim();
    const colName = (searchParams.get('col') || '').trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 25;

    if (!dbName || !colName) {
        return NextResponse.json({ error: 'Database and collection names are required' }, { status: 400 });
    }

    try {
        const db = await getDb(dbName);
        const collection = db.collection(colName);

        const count = await collection.countDocuments();
        const data = await collection.find({})
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return new NextResponse(EJSON.stringify({
            data,
            total: count,
            page,
            limit
        }, { relaxed: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Fetch data error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { database, collection, data } = await req.json();
        const dbName = (database || '').trim();
        const colName = (collection || '').trim();

        if (!dbName || !colName || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(dbName);
        const processedData = processData(data);
        const result = await db.collection(colName).insertOne(processedData);

        return NextResponse.json({
            message: 'Document inserted successfully',
            insertedId: result.insertedId
        });
    } catch (error) {
        console.error('Insert data error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Failed to insert document' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { database, collection, id, data } = await req.json();
        const dbName = (database || '').trim();
        const colName = (collection || '').trim();

        console.log(`[PATCH] Target: ${dbName}.${colName}, ID Raw:`, id);

        if (!dbName || !colName || !id || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(dbName);
        const { _id, ...updateData } = data;
        const query = resolveIdQuery(id);
        const processedUpdate = processData(updateData);

        console.log(`[PATCH] Generated Query:`, JSON.stringify(query));
        console.log(`[PATCH] Update Data Keys:`, Object.keys(processedUpdate));

        const result = await db.collection(colName).updateOne(
            query,
            { $set: processedUpdate }
        );

        if (result.matchedCount === 0) {
            console.warn(`[PATCH] No document matched this query!`);
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        console.log(`[PATCH] SUCCESS: Updated ${result.modifiedCount} document(s)`);
        return NextResponse.json({ message: 'Document updated successfully' });
    } catch (error) {
        console.error('Update data error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Failed to update document' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dbName = (searchParams.get('db') || '').trim();
        const colName = (searchParams.get('col') || '').trim();
        const idMatch = searchParams.get('id');

        console.log(`[DELETE] Target: ${dbName}.${colName}, ID Raw:`, idMatch);

        if (!dbName || !colName || !idMatch) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(dbName);
        const query = resolveIdQuery(idMatch);
        console.log(`[DELETE] Generated Query:`, JSON.stringify(query));

        const result = await db.collection(colName).deleteOne(query);

        if (result.deletedCount === 0) {
            console.warn(`[DELETE] No document matched this query!`);
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        console.log(`[DELETE] SUCCESS: Deleted document`);
        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete data error:', error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
