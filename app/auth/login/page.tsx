'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-white/60">Enter your details to log in to your account.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">Password</label>
            <Link href="/auth/forgot-password" title="Forgot password?" className="text-xs text-white/40 hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
        </Button>
      </form>

      <div className="mt-8 text-center pt-4">
        <p className="text-white/50 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-white hover:underline font-medium">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
