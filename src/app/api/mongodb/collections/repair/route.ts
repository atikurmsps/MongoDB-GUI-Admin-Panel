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

        // 1. Find documents where _id is a string but is a valid ObjectId format
        const stringDocs = await col.find({ _id: { $type: "string" } }).toArray();

        // 2. Find documents where _id is an object (could be the corrupted buffer or a nested object)
        const objectDocs = await col.find({ _id: { $type: "object" } }).toArray();

        let repairCount = 0;
        let skipCount = 0;

        const allDocs = [...stringDocs, ...objectDocs];

        for (const doc of allDocs) {
            let potentialId: string | null = null;

            // Handle string ID
            if (typeof doc._id === 'string' && ObjectId.isValid(doc._id)) {
                potentialId = doc._id;
            }
            // Handle the corrupted "buffer object" pattern
            else if (doc._id && typeof doc._id === 'object' && (doc._id as any).buffer) {
                try {
                    // Try to extract the hex string if possible, or convert the buffer
                    const buf = Buffer.from(Object.values((doc._id as any).buffer) as number[]);
                    if (buf.length === 12) {
                        potentialId = buf.toString('hex');
                    }
                } catch (e) { }
            }

            if (potentialId && ObjectId.isValid(potentialId)) {
                try {
                    const newId = new ObjectId(potentialId);
                    const { _id, ...data } = doc;

                    // Delete the old corrupted/string version
                    await col.deleteOne({ _id: doc._id });

                    // Re-insert with proper ObjectId
                    await col.insertOne({ ...data, _id: newId });

                    repairCount++;
                } catch (e) {
                    skipCount++;
                }
            } else {
                // If it's already a proper ObjectId, it won't be in the find results anyway
                // but we skip other weird object structures
                if (!(doc._id instanceof ObjectId)) {
                    skipCount++;
                }
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
