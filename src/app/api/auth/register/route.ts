import { NextResponse } from 'next/server';

export async function POST() {
    // Registration is disabled since we use ENV variables
    return NextResponse.json({ error: 'Registration is disabled. Use environment variables.' }, { status: 403 });
}

export async function GET() {
    try {
        const envUsername = process.env.ADMIN_USERNAME;
        const envPassword = process.env.ADMIN_PASSWORD;

        // "exists" in this context means "is configured in env"
        return NextResponse.json({ exists: !!(envUsername && envPassword) });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
