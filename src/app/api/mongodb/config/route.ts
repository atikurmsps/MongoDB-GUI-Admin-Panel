import { NextResponse } from 'next/server';

export async function GET() {
    const fullUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

    try {
        const url = new URL(fullUri);
        const protocol = url.protocol.replace(':', '');
        const host = url.host;
        const options = url.search || '';

        return NextResponse.json({
            protocol,
            host,
            options
        });
    } catch (e) {
        // Fallback for simple strings or invalid URLs
        return NextResponse.json({
            protocol: 'mongodb',
            host: fullUri.split('@').pop()?.split('/')[0] || 'localhost:27017',
            options: ''
        });
    }
}
