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

        // Fetch docs that are strings or objects (ObjectIds are excluded by type check)
        // Note: Using a broad find and checking types manually for maximum safety
        const allDocs = await col.find({}).toArray();

        let repairCount = 0;
        let failCount = 0;

        for (const doc of allDocs) {
            let targetId: any = null;
            const docId = doc._id as any;

            // 1. Skip if already an ObjectId
            if (docId instanceof ObjectId) {
                continue;
            }

            // 2. Handle String ID
            if (typeof docId === 'string' && ObjectId.isValid(docId) && docId.length === 24) {
                targetId = new ObjectId(docId);
            }
            // 3. Handle corrupted buffer object
            else if (docId && typeof docId === 'object' && docId.buffer) {
                try {
                    const bytes = Object.values(docId.buffer).filter(v => typeof v === 'number');
                    if (bytes.length === 12) {
                        const hex = Buffer.from(bytes as number[]).toString('hex');
                        targetId = new ObjectId(hex);
                    }
                } catch (e) { }
            }
            // 4. Handle EJSON format {$oid: ...}
            else if (docId && typeof docId === 'object' && docId.$oid) {
                targetId = new ObjectId(docId.$oid);
            }

            if (targetId) {
                try {
                    const { _id, ...data } = doc;
                    const delResult = await col.deleteOne({ _id: docId });
                    if (delResult.deletedCount === 1) {
                        await col.insertOne({ ...data, _id: targetId });
                        repairCount++;
                    } else {
                        failCount++;
                    }
                } catch (e) {
                    console.error(`[REPAIR] Failed to repair doc:`, e);
                    failCount++;
                }
            }
        }

        return NextResponse.json({
            message: 'Repair completed',
            repaired: repairCount,
            failed: failCount
        });
    } catch (error) {
        console.error('Repair utility error:', error);
        return NextResponse.json({ error: 'Repair process failed' }, { status: 500 });
    }
}
