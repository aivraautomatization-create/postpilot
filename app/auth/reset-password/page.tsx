'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = getSupabase();

  useEffect(() => {
    // Supabase client automatically picks up the recovery token
    // from the URL hash when the user arrives from the reset email.
    // We just need to verify there's an active session.
    const verifySession = async () => {
      if (!supabase) {
        setError('Authentication service is not available.');
        setChecking(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Wait a moment for Supabase to process hash params
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase!.auth.getSession();
          if (!retrySession) {
            setError('Invalid or expired reset link. Please request a new one.');
          }
          setChecking(false);
        }, 2000);
      } else {
        setChecking(false);
      }
    };

    verifySession();
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Verifying your reset link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Password Updated</h2>
        <p className="text-white/50 text-sm mb-6">
          Your password has been successfully reset. Redirecting to login...
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (error && checking === false && !password) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Invalid Reset Link</h2>
        <p className="text-white/50 text-sm mb-6">{error}</p>
        <Link
          href="/auth/forgot-password"
          className="inline-block bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-2">Set New Password</h2>
      <p className="text-white/50 text-sm mb-6">
        Enter and confirm your new password below.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-white/50 text-sm">
          Remember your password?{' '}
          <Link href="/auth/login" className="text-white hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
