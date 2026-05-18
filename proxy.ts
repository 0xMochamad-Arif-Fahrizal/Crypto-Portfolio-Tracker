import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routing intent:
// "/"           → public landing page; if logged in, the page component itself
//                 redirects client-side to /dashboard (Firebase Auth is client-side only).
// "/dashboard"  → requires auth; the page component redirects to /login when no user.
//
// Server-side session cookies are not used, so no auth check is done here.
// This file remains a transparent passthrough.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
