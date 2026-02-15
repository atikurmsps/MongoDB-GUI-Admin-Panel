import { NextResponse } from 'next/server';

export async function GET() {
    const fullUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

    try {
        const url = new URL(fullUri);
        // Remove auth if present for the template
        url.username = '';
        url.password = '';

        return NextResponse.json({
            baseUri: url.toString().replace(/\/$/, '') // Remove trailing slash
        });
    } catch (e) {
        // If URL parsing fails (e.g. simple string), just return it
        return NextResponse.json({
            baseUri: fullUri.split('@').pop() || fullUri
        });
    }
}
