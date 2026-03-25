import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { checkRateLimitAsync } from "@/lib/rate-limit-store";

const ALLOWED_DOMAINS = [
  'generativelanguage.googleapis.com',
  'storage.googleapis.com',
  '.supabase.co',
  '.supabase.in',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain =>
      domain.startsWith('.') ? parsed.hostname.endsWith(domain) : parsed.hostname === domain
    );
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  // Authenticate user
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Rate limit: 20 per minute per user
  const { allowed, retryAfter } = await checkRateLimitAsync(`video-proxy:${user.id}`, 20, 60000);
  if (!allowed) {
    return NextResponse.json({
      error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      code: 'RATE_LIMITED'
    }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
  }

  // Domain whitelist to prevent SSRF
  if (!isAllowedUrl(videoUrl)) {
    return NextResponse.json({ error: 'URL domain not allowed' }, { status: 403 });
  }

  try {
    const range = req.headers.get('range');

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    if (range) {
      fetchHeaders['Range'] = range;
    }

    const response = await fetch(videoUrl, {
      headers: fetchHeaders,
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 206) {
      const retryResponse = await fetch(videoUrl);
      if (!retryResponse.ok) {
        throw new Error(`Failed to fetch video: ${retryResponse.statusText}`);
      }
      return new Response(retryResponse.body, {
        headers: {
          'Content-Type': retryResponse.headers.get('content-type') || 'video/mp4',
          'Content-Length': retryResponse.headers.get('content-length') || '',
          'Cache-Control': 'no-cache',
        }
      });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
    };

    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error('Video proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy video. Source may have expired.' }, { status: 500 });
  }
}
