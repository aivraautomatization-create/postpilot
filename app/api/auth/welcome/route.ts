import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/emails';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Rate limit by IP to prevent email spam
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const { allowed, retryAfter } = checkRateLimit(`welcome:${ip}`, 3, 300000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: 'RATE_LIMITED'
      }, { status: 429 });
    }

    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await sendWelcomeEmail(email, name);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
