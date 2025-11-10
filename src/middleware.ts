import { NextRequest, NextResponse } from 'next/server';

// Reserved dashboard/auth slugs (protected)
const RESERVED_SLUGS = new Set([
  'login',
  'register',
  'home',
  'home-view',
  'products',
  'create-products',
  'api',
  '_next'
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore assets explicitly (matcher already excludes some)
  if (pathname === '/' || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean); // remove empty
  const first = segments[0];

  // Dynamic public tenant: any first segment not reserved is treated as siteName and allowed publicly
  if (first && !RESERVED_SLUGS.has(first)) {
    return NextResponse.next();
  }

  // Existing auth-required dashboard routes
  const token = req.cookies.get('token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
