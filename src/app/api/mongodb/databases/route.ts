import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAdminDb } from '@/lib/db';

export async function GET() {
    try {
        const adminDb = await getAdminDb();
        const result = await adminDb.listDatabases();
        return NextResponse.json(result.databases);
    } catch (error) {
        console.error('List databases error:', error);
        return NextResponse.json({ error: 'Failed to list databases' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
        }

        const db = await getDb(name);
        await db.collection('_admin_metadata').insertOne({ created_at: new Date() });

        return NextResponse.json({ message: `Database ${name} created successfully` }, { status: 201 });
    } catch (error) {
        console.error('Create database error:', error);
        return NextResponse.json({ error: 'Failed to create database' }, { status: 500 });
    }
}
