import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbName = searchParams.get('db');
    const colName = searchParams.get('col');

    if (!dbName) {
        return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
    }

    try {
        const db = await getDb(dbName);
        const dump: any = {};

        if (colName) {
            // Export single collection
            const data = await db.collection(colName).find({}).toArray();
            dump[colName] = data;
        } else {
            // Export entire database
            const collections = await db.listCollections().toArray();
            for (const col of collections) {
                const data = await db.collection(col.name).find({}).toArray();
                dump[col.name] = data;
            }
        }

        const filename = colName ? `${dbName}_${colName}_dump.json` : `${dbName}_dump.json`;

        return new NextResponse(JSON.stringify(dump, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
    }
}
