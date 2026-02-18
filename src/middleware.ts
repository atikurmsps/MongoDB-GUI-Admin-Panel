import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-don-t-use-this';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // Allow access to setup page
    if (pathname.startsWith('/setup') || pathname.startsWith('/api/setup')) {
        return NextResponse.next();
    }

    const isAuthPage = pathname.startsWith('/login');
    const isApiAuthPage = pathname.startsWith('/api/auth');

    // If user is on login page and has a token, redirect to dashboard
    // Note: We can't easily verify the session in the DB from middleware 
    // without potentially hitting environment issues, so we'll do a basic check here.
    // The actual verification happens in the pages/APIs.
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If it's an auth page or API, let it through
    if (isAuthPage || isApiAuthPage) {
        return NextResponse.next();
    }

    // Protect all other routes
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/mongodb/:path*', '/login'],
};
