import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-don-t-use-this';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;

    // Allow access to setup page
    if (request.nextUrl.pathname.startsWith('/setup') || request.nextUrl.pathname.startsWith('/api/setup')) {
        return NextResponse.next();
    }

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register');
    const isApiAuthPage = request.nextUrl.pathname.startsWith('/api/auth');

    if (isAuthPage || isApiAuthPage) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // verification happens in server components/pages
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/mongodb/:path*'],
};
