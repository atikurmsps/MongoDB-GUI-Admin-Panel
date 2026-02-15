import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { database, username, password, roles } = await req.json();

        if (!database || !username || !password || !roles) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const db = await getDb(database);

        await db.command({
            createUser: username,
            pwd: password,
            roles: roles.map((role: string) => ({ role, db: database })),
        });

        return NextResponse.json({ message: `User ${username} created in ${database} successfully` }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { database, username, roles, password } = await req.json();

        if (!database || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);
        const updateCommand: any = {
            updateUser: username,
        };

        if (roles) {
            updateCommand.roles = roles.map((role: string) => ({ role, db: database }));
        }

        if (password) {
            updateCommand.pwd = password;
        }

        await db.command(updateCommand);

        return NextResponse.json({ message: `User ${username} updated successfully` });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const database = searchParams.get('db');
        const username = searchParams.get('username');

        if (!database || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb(database);

        await db.command({ dropUser: username });

        return NextResponse.json({ message: `User ${username} removed successfully` });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete user' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const database = searchParams.get('db');

    if (!database) {
        return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
    }

    try {
        const db = await getDb(database);
        const result = await db.command({ usersInfo: 1 });

        return NextResponse.json(result.users);
    } catch (error) {
        console.error('List users error:', error);
        return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }
}
