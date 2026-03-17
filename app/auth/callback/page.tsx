'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      router.push('/auth/login');
      return;
    }

    // Supabase client automatically picks up the hash fragment tokens
    // from the email confirmation redirect URL and establishes the session.
    // We just wait for the session to be established, then redirect.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        // Wait a moment for Supabase to process the hash params
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            router.push('/dashboard');
          } else {
            router.push('/auth/login');
          }
        }, 2000);
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Confirming your email...</p>
      </div>
    </div>
  );
}
