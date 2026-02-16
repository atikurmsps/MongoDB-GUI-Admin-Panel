import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    try {
        const { database, collection } = await req.json();

        if (!database || !collection) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);
        const col = db.collection(collection);

        // Find documents where _id is a string but is a valid ObjectId format
        const docs = await col.find({ _id: { $type: "string" } }).toArray();
        let repairCount = 0;
        let skipCount = 0;

        for (const doc of docs) {
            if (ObjectId.isValid(doc._id)) {
                try {
                    const newId = new ObjectId(doc._id);
                    const { _id, ...data } = doc;

                    // Delete old doc with string _id
                    await col.deleteOne({ _id: doc._id });

                    // Insert new doc with ObjectId _id
                    // We use insertOne to ensure we don't accidentally update if something else changed
                    await col.insertOne({ ...data, _id: newId });

                    repairCount++;
                } catch (e) {
                    skipCount++;
                }
            } else {
                skipCount++;
            }
        }

        return NextResponse.json({
            message: 'Repair completed',
            repaired: repairCount,
            skipped: skipCount
        });
    } catch (error) {
        console.error('Repair utility error:', error);
        return NextResponse.json({ error: 'Repair process failed' }, { status: 500 });
    }
}
