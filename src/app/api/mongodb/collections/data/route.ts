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
        // If it's already a specialized BSON type, don't recurse
        if (val._bsontype || val instanceof ObjectId || val instanceof Date) {
            return data;
        }

        const processed: any = {};
        for (const key in data) {
            const value = data[key];
            // Convert 24-char hex strings to ObjectIds
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
    const filters: any[] = [{ _id: id }];

    // 1. Try to add direct string/ObjectId versions
    try {
        if (typeof id === 'string' && ObjectId.isValid(id)) {
            filters.push({ _id: new ObjectId(id) });
        } else if (id && id.$oid) {
            const oid = new ObjectId(id.$oid);
            filters.push({ _id: oid });
            filters.push({ _id: oid.toString() });
        }
    } catch (e) { }

    // 2. If it's the corrupted buffer object, try to extract hex and add variants
    if (id && typeof id === 'object' && (id as any).buffer) {
        try {
            const bytes = Object.values((id as any).buffer).filter(v => typeof v === 'number');
            if (bytes.length === 12) {
                const hex = Buffer.from(bytes as number[]).toString('hex');
                filters.push({ _id: hex });
                filters.push({ _id: new ObjectId(hex) });
            }
        } catch (e) { }
    }

    return filters.length > 1 ? { $or: filters } : { _id: id };
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbName = searchParams.get('db');
    const colName = searchParams.get('col');
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

        // Use relaxed EJSON for standard JSON compatibility in frontend
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

        if (!database || !collection || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);

        // Process data to ensure ObjectIds are preserved/converted
        const processedData = processData(data);

        const result = await db.collection(collection).insertOne(processedData);

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

        if (!database || !collection || !id || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);

        // Remove _id from data to avoid update error
        const { _id, ...updateData } = data;
        const processedUpdateData = processData(updateData);

        const result = await db.collection(collection).updateOne(
            resolveIdQuery(id),
            { $set: processedUpdateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Document updated successfully' });
    } catch (error) {
        console.error('Update data error:', error);
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const database = searchParams.get('db');
        const collection = searchParams.get('col');
        const idMatch = searchParams.get('id');

        if (!database || !collection || !idMatch) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);

        const result = await db.collection(collection).deleteOne(resolveIdQuery(idMatch));

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete data error:', error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
