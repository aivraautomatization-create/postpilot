'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type PageState = 'loading' | 'success' | 'error' | 'redirecting';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = getSupabase();

  const [state, setState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    // Wait until auth is resolved
    if (authLoading) return;

    if (!token) {
      setErrorMessage('Invalid invite link. No token found.');
      setState('error');
      return;
    }

    // If not logged in, redirect to login and come back
    if (!user) {
      setState('redirecting');
      const redirect = encodeURIComponent(`/auth/accept-invite?token=${token}`);
      router.push(`/auth/login?redirect=${redirect}`);
      return;
    }

    // User is logged in — accept the invite
    acceptInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  const acceptInvite = async () => {
    if (!supabase || !user || !token) return;
    setState('loading');

    try {
      // Look up the invite by token
      const { data: invite, error: lookupError } = await supabase!
        .from('team_members')
        .select('id, invited_email, accepted_at, owner_id')
        .eq('invite_token', token)
        .single();

      if (lookupError || !invite) {
        setErrorMessage('This invite link is invalid or has expired.');
        setState('error');
        return;
      }

      if (invite.accepted_at) {
        // Already accepted — treat as success
        setState('success');
        return;
      }

      // Update the row: set member_id and accepted_at
      const { error: updateError } = await supabase!
        .from('team_members')
        .update({
          member_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Failed to accept invite:', updateError);
        setErrorMessage('Failed to accept the invitation. Please try again.');
        setState('error');
        return;
      }

      setState('success');
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setState('error');
    }
  };

  if (state === 'loading' || state === 'redirecting') {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">
          {state === 'redirecting' ? 'Redirecting to login…' : 'Verifying your invitation…'}
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Invitation Error</h2>
        <p className="text-white/50 text-sm mb-6">{errorMessage}</p>
        <a
          href="/dashboard"
          className="inline-block bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all text-sm"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  // success
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">You&apos;ve joined the workspace!</h2>
      <p className="text-white/50 text-sm mb-6">
        You now have access to the shared Puls workspace. Head to the dashboard to get started.
      </p>
      <a
        href="/dashboard"
        className="inline-block bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all text-sm"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading…</p>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
