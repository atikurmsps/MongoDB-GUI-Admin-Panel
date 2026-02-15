import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-don-t-use-this';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register');
    const isApiAuthPage = request.nextUrl.pathname.startsWith('/api/auth');

    if (isAuthPage || isApiAuthPage) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await jwtVerify(token, key);
        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/mongodb/:path*'],
};
