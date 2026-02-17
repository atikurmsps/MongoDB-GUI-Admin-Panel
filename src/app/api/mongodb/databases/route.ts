import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAdminDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
    try {
        const session: any = await getAuthSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminDb = await getAdminDb();
        const result = await adminDb.listDatabases();

        let databases = result.databases;

        // Filter based on allowed_databases for non-admins
        if (session.role !== 'admin' && session.allowed_databases !== '*') {
            const allowed = (session.allowed_databases || '').split(',').map((d: string) => d.trim().toLowerCase());
            databases = databases.filter((db: any) => allowed.includes(db.name.toLowerCase()));
        }

        return NextResponse.json(databases);
    } catch (error) {
        console.error('List databases error:', error);
        return NextResponse.json({ error: 'Failed to list databases' }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }


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

