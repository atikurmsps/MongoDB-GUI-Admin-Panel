import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';

// Recursive helper to ensure data types are correct (ObjectId strings -> ObjectIds)
function processData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(item => processData(item));
    } else if (data !== null && typeof data === 'object') {
        const val = data as any;
        if (val._bsontype || val instanceof ObjectId || val instanceof Date) {
            return data;
        }

        const processed: any = {};
        for (const key in data) {
            const value = data[key];
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

    // Add original as first candidate
    filters.push({ _id: id });

    let target = id;

    // 1. Try EJSON/JSON parsing if input is a stringified object
    if (typeof id === 'string' && (id.trim().startsWith('{') || id.trim().startsWith('['))) {
        try {
            target = EJSON.parse(id);
            filters.push({ _id: target });
        } catch (e) {
            try {
                target = JSON.parse(id);
                filters.push({ _id: target });
            } catch (e2) { }
        }
    }

    try {
        // 2. String to ObjectId conversion
        if (typeof target === 'string' && target.length === 24 && ObjectId.isValid(target)) {
            filters.push({ _id: new ObjectId(target) });
        }
        // 3. Object-based ID variants
        else if (target && typeof target === 'object') {
            const t = target as any;
            // Handle EJSON {$oid: ...}
            if (t.$oid && ObjectId.isValid(t.$oid)) {
                const oid = new ObjectId(t.$oid);
                filters.push({ _id: oid });
                filters.push({ _id: t.$oid }); // Ensure plain string is also checked
            }
            // Handle corrupted "buffer" object
            if (t.buffer) {
                const bytes = Object.values(t.buffer).filter(v => typeof v === 'number');
                if (bytes.length === 12) {
                    const hex = Buffer.from(bytes as number[]).toString('hex');
                    filters.push({ _id: new ObjectId(hex) });
                    filters.push({ _id: hex });
                }
            }
        }
    } catch (e) { }

    // 4. Force check for 24-char hex strings if not already included
    if (typeof id === 'string' && id.length === 24 && ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }

    // 5. IMPORTANT: De-duplicate using EJSON.stringify to distinguish types!
    // JSON.stringify turns new ObjectId("hex") into just "hex", losing the type.
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
        return NextResponse.json({ error: 'Failed to insert document' }, { status: 500 });
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
        console.log(`[PATCH] Generated Query:`, JSON.stringify(query));

        const result = await db.collection(colName).updateOne(
            query,
            { $set: processData(updateData) }
        );

        if (result.matchedCount === 0) {
            console.warn(`[PATCH] No document matched this query!`);
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        console.log(`[PATCH] SUCCESS: Updated ${result.modifiedCount} document(s)`);
        return NextResponse.json({ message: 'Document updated successfully' });
    } catch (error) {
        console.error('Update data error:', error);
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
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
