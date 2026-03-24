'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();
  const supabase = getSupabase();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    const searchParams = new URLSearchParams(window.location.search);
    const plan = searchParams.get('plan');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: fullName }),
      }).catch(() => {});

      if (data.session) {
        const redirectPath = plan ? `/dashboard?initiate_checkout=${plan}` : '/dashboard';
        router.push(redirectPath);
      } else if (data.user) {
        setError(null);
        setShowConfirmation(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Check your email</h1>
        <p className="text-white/60">
          We sent a confirmation link to <strong className="text-white font-medium">{email}</strong>. Click the link to activate your account.
        </p>
        <div className="pt-4">
          <Link href="/auth/login" className="text-white hover:underline transition-colors mt-8">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-white/60">Join to automate your content pipeline.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-white/70">Full Name</label>
          <div className="relative">
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="peer ps-10 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 rounded-xl h-11"
              type="text"
            />
            <div className="text-white/30 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <UserIcon className="size-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-white/70">Email Address</label>
          <div className="relative">
            <Input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="peer ps-10 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 rounded-xl h-11"
              type="email"
            />
            <div className="text-white/30 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <Mail className="size-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-white/70">Password</label>
          <div className="relative">
            <Input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="peer ps-10 bg-[#111] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 rounded-xl h-11"
              type="password"
            />
            <div className="text-white/30 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <Lock className="size-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 text-base font-semibold mt-4">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start 14-Day Free Trial'}
        </Button>
      </form>

      <div className="mt-8 text-center pt-4">
        <p className="text-white/50 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-white hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
