import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];

/**
 *
 * @param request
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('token')?.value;

  // Allow public routes
  if (
    PUBLIC_ROUTES.some((route) => {
      return pathname.startsWith(route);
    })
  ) {
    // Redirect to dashboard if already authenticated
    if (token && pathname !== '/auth/organization') {
      return NextResponse.redirect(new URL('/auth/organization', request.url));
    }

    return NextResponse.next();
  }

  // Protect dashboard and auth/organization routes
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (pathname.startsWith('/auth/organization') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
