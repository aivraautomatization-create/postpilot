import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const APP_URL = process.env.APP_URL || 'https://postpilot.ai';
const FROM_EMAIL = 'PostPilot <notifications@postpilot.ai>';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is required');
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    // Auth check
    const supabaseAuth = await getSupabaseServer();
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse + validate body
    const body = await req.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!role || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Role must be "admin" or "member".' }, { status: 400 });
    }

    const invitedEmail = email.trim().toLowerCase();

    // Prevent self-invite
    if (invitedEmail === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot invite yourself.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;
    if (!supabase) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    // Check for an existing pending invite for the same email in this workspace
    const { data: existingInvite } = await supabase
      .from('team_members')
      .select('id')
      .eq('owner_id', user.id)
      .eq('invited_email', invitedEmail)
      .is('accepted_at', null)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'A pending invite already exists for this email address.' },
        { status: 409 }
      );
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID();

    // Insert team member row
    const { error: insertError } = await supabase.from('team_members').insert({
      owner_id: user.id,
      invited_email: invitedEmail,
      role,
      invite_token: inviteToken,
    });

    if (insertError) {
      console.error('Failed to create team invite:', insertError);
      return NextResponse.json({ error: 'Failed to create invite. Please try again.' }, { status: 500 });
    }

    // Send invite email
    const inviteLink = `${APP_URL}/auth/accept-invite?token=${inviteToken}`;
    try {
      const resend = getResend();
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invitedEmail,
        subject: "You've been invited to join PostPilot",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
            <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">You've been invited to PostPilot</h1>
              <p style="color: #444; line-height: 1.6;">You've been invited to join a workspace on PostPilot as a <strong>${role === 'admin' ? 'Admin' : 'Member'}</strong>.</p>
              <p style="color: #444; line-height: 1.6;">PostPilot is an AI-powered social media management platform. Accept the invite to get started.</p>
              <div style="margin: 32px 0;">
                <a href="${inviteLink}" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Accept Invitation</a>
              </div>
              <p style="color: #888; font-size: 14px;">This invite link is unique to you. Do not share it with others.</p>
              <p style="color: #444; margin-top: 24px;">Best,<br/>The PostPilot Team</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Invite was created — don't fail the whole request because of email
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Team invite error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
