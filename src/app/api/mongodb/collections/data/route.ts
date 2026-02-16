import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';

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

        return NextResponse.json({
            data: EJSON.serialize(data),
            total: count,
            page,
            limit
        });
    } catch (error) {
        console.error('Fetch data error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
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

        let queryId: any = id;
        try {
            if (typeof id === 'string' && ObjectId.isValid(id)) {
                queryId = new ObjectId(id);
            }
        } catch (e) { }

        const result = await db.collection(collection).updateOne(
            { $or: [{ _id: queryId }, { _id: id }] },
            { $set: updateData }
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
