import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
    try {
        const client = await clientPromise;
        const adminDb = client.db('admin');
        const dbList = await adminDb.admin().listDatabases();

        const userPromises = dbList.databases.map(async (dbInfo) => {
            try {
                const db = client.db(dbInfo.name);
                const result = await db.command({ usersInfo: 1 });
                return result.users || [];
            } catch (err) {
                // Silently skip databases where we don't have permission to list users
                return [];
            }
        });

        const results = await Promise.all(userPromises);
        const allUsers = results.flat();

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error('List all users error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to list all users', details: errorMessage }, { status: 500 });
    }
}
