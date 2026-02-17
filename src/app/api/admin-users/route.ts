import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, addUser, deleteUser, updateUser } from '@/lib/sqlite';
import { hashPassword, getAuthSession } from '@/lib/auth';

export async function GET() {
    try {
        const users = getAllUsers();
        // Don't send password hashes
        const safeUsers = users.map(({ password_hash, ...u }) => u);
        return NextResponse.json(safeUsers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        // Only ADMIN can create users
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { username, password, role, allowed_databases } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        addUser(username, hashedPassword, role || 'admin', allowed_databases || '*');
        return NextResponse.json({ message: 'User created' });
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        // Only ADMIN can edit users
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { id, username, password, role, allowed_databases } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const targetUsers = getAllUsers();
        const target = targetUsers.find(u => u.id === id);

        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (session.username === target.username) return NextResponse.json({ error: 'Cannot edit self here' }, { status: 403 });

        const updateData: any = {};
        if (username) updateData.username = username;
        if (password) updateData.password_hash = await hashPassword(password);
        if (role) updateData.role = role;
        if (allowed_databases !== undefined) updateData.allowed_databases = allowed_databases;

        updateUser(id, updateData);
        return NextResponse.json({ message: 'User updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session: any = await getAuthSession();
        // Only ADMIN can delete users
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const targetUsers = getAllUsers();
        const target = targetUsers.find(u => u.id === Number(id));

        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (session.username === target.username) return NextResponse.json({ error: 'Cannot delete self' }, { status: 403 });

        deleteUser(Number(id));
        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
