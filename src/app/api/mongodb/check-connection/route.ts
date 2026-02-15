import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(req: NextRequest) {
    let client: MongoClient | null = null;
    try {
        const { uri } = await req.json();

        if (!uri) {
            return NextResponse.json({ error: 'Connection URI is required' }, { status: 400 });
        }

        // Attempt to connect with a short timeout
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        await client.connect();
        const adminDb = client.db().admin();
        const info = await adminDb.serverStatus();
        const buildInfo = await adminDb.buildInfo();

        return NextResponse.json({
            success: true,
            version: buildInfo.version,
            uptime: info.uptime,
            message: 'Successfully connected to MongoDB server.',
        });

    } catch (error) {
        console.error('Connection test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to MongoDB',
        }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}
