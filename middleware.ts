import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseMiddleware } from '@/lib/supabase-middleware';

const protectedRoutes = ['/dashboard', '/api/checkout', '/api/generate', '/api/publish', '/api/portal', '/api/posts', '/api/video-proxy', '/api/analytics', '/api/account'];
const publicRoutes = ['/auth', '/api/webhooks', '/api/auth', '/api/inngest'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
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

    return response;
  } catch {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/checkout/:path*', '/api/generate/:path*', '/api/publish/:path*', '/api/portal/:path*', '/api/posts/:path*', '/api/video-proxy/:path*', '/api/analytics/:path*', '/api/account/:path*']
};
