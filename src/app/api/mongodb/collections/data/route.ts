import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';

// Recursive helper to ensure data types are correct (ObjectId strings -> ObjectIds)
function processData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(item => processData(item));
    } else if (data !== null && typeof data === 'object') {
        // If it's already a specialized BSON type, don't recurse
        if (data._bsontype === 'ObjectID' || data instanceof ObjectId || data instanceof Date) {
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

        let queryId: any = id;
        try {
            if (typeof id === 'string' && ObjectId.isValid(id)) {
                queryId = new ObjectId(id);
            } else if (id && id.$oid) {
                queryId = new ObjectId(id.$oid);
            }
        } catch (e) { }

        const result = await db.collection(collection).updateOne(
            { $or: [{ _id: queryId }, { _id: id }] },
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
        const id = searchParams.get('id');

        if (!database || !collection || !id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);

        let queryId: any = id;
        try {
            if (typeof id === 'string' && ObjectId.isValid(id)) {
                queryId = new ObjectId(id);
            } else if (id && (id as any).$oid) {
                queryId = new ObjectId((id as any).$oid);
            }
        } catch (e) { }

        const result = await db.collection(collection).deleteOne({
            $or: [{ _id: queryId }, { _id: id }]
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete data error:', error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
