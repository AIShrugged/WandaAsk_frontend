import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];
const AUTH_ROUTES = ['/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Redirect to dashboard if already authenticated
    if (token && pathname !== '/auth/organization') {
      return NextResponse.redirect(new URL('/auth/organization', request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect auth organization route (requires token but no org)
  if (pathname.startsWith('/auth/organization')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
