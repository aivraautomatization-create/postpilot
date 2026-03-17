'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = getSupabase();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
        <p className="text-white/50 text-sm mb-6">
          We&apos;ve sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link 
          href="/auth/login" 
          className="inline-block bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-2">Reset password</h2>
      <p className="text-white/50 text-sm mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="name@company.com"
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
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
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
