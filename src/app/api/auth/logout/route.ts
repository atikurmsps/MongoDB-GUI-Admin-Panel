import { NextRequest, NextResponse } from 'next/server';
import { clearAuthSession } from '@/lib/auth';

export async function POST() {
    await clearAuthSession();
    return NextResponse.json({ message: 'Logged out successfully' });
}
