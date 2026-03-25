import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseMiddleware } from '@/lib/supabase-middleware';

const protectedRoutes = ['/dashboard', '/api/checkout', '/api/generate', '/api/publish', '/api/portal', '/api/posts', '/api/video-proxy', '/api/analytics', '/api/account'];
const publicRoutes = ['/auth', '/api/webhooks', '/api/auth', '/api/inngest'];

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-DNS-Prefetch-Control': 'on',
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublic) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Check if this is a protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtected) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Validate session via Supabase
  try {
    const result = getSupabaseMiddleware(request);

    if (!result) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const { supabase, response } = result;

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return applySecurityHeaders(response);
  } catch {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
