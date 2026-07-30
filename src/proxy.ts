import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

// Always accessible, logged in or not (e.g. an admin re-installing the app on
// a new phone shouldn't get bounced away from the download page).
const PUBLIC_PATHS = ['/login', '/descargar'];
// Public paths that also redirect an already-authenticated visitor onward,
// since there's nothing for them to do there once logged in.
const REDIRECT_IF_AUTHENTICATED = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && REDIRECT_IF_AUTHENTICATED.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.png|apple-icon.png|icons/).*)',
  ],
};
