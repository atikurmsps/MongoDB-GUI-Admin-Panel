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

        // Use a simple ping command which requires minimal permissions
        const adminDb = client.db().admin();
        await adminDb.command({ ping: 1 });

        let version = 'Unknown';
        let uptime = 'Unknown';
        let isAdmin = false;

        try {
            // Attempt to get extra info if permissions allow
            const buildInfo = await adminDb.buildInfo();
            version = buildInfo.version;

            const status = await adminDb.serverStatus();
            uptime = status.uptime;
            isAdmin = true;
        } catch (e) {
            // Silently fail if unauthorized for admin commands
            console.log('Optional admin info gathering failed (unauthorized)');
        }

        return NextResponse.json({
            success: true,
            version,
            uptime,
            isAdmin,
            message: isAdmin
                ? 'Successfully connected to MongoDB server with administrative access.'
                : 'Successfully connected to MongoDB server (Limited permissions).',
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
