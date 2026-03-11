import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect both dashboard and sensitive API routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/checkout');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Skip auth enforcement if Supabase is not configured (local dev without Supabase)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next();
  }

  // Onboarding is publicly accessible (user needs to complete it first)
  if (pathname === '/dashboard/onboarding') {
    return NextResponse.next();
  }

  // Check for a Supabase session cookie. Full token validation happens
  // inside each API route via getSupabaseServer() — middleware just gates pages.
  const cookieHeader = request.headers.get('cookie') || '';
  const hasSession = /sb-[a-z0-9]+-auth-token=/.test(cookieHeader);

  if (!hasSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/checkout/:path*'],
};
