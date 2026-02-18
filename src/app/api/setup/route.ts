import { NextRequest, NextResponse } from 'next/server';
import { setSetting, getSetting, countUsers, addUser } from '@/lib/sqlite';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { username, password, jwtSecret, mongodbUri } = await req.json();

        // Save settings first
        if (jwtSecret) setSetting('jwt_secret', jwtSecret);
        if (mongodbUri) setSetting('mongodb_uri', mongodbUri);

        // Add user if provided and not already existing? 
        // Usually setup adds the FIRST admin.
        if (username && password) {
            const hashedPassword = await hashPassword(password);
            try {
                addUser(username, hashedPassword, 'admin');
            } catch (e: any) {
                // If user already exists, it might throw due to UNIQUE. 
                // That's fine if they are just updating settings.
            }
        }

        return NextResponse.json({ message: 'Setup updated' });

    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const userCount = countUsers();
        const envUser = process.env.ADMIN_USERNAME;
        const envPass = process.env.ADMIN_PASSWORD;

        const mongoUri = getSetting('mongodb_uri') || process.env.MONGODB_URI;
        const jwtSecret = getSetting('jwt_secret') || process.env.JWT_SECRET;
        const isSetup = (!!(envUser && envPass) || userCount > 0) && !!mongoUri && !!jwtSecret;

        // Return existing data to help UI disable fields
        return NextResponse.json({
            isSetup,
            hasUsers: userCount > 0,
            config: {
                jwtSecret: (getSetting('jwt_secret') || process.env.JWT_SECRET) ? '••••••••' : '',
                mongodbUri: (getSetting('mongodb_uri') || process.env.MONGODB_URI) ? '••••••••' : '',
                hasEnvMongo: !!process.env.MONGODB_URI,
                hasEnvJwt: !!process.env.JWT_SECRET
            }

        });
    } catch (error) {
        const isSetup = !!(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
        return NextResponse.json({ isSetup, hasUsers: false, config: {} });
    }
}
