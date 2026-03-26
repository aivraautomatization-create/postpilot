'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export interface Profile {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  industry?: string | null;
  niche?: string | null;
  target_audience?: string | null;
  offerings?: string | null;
  tone_of_voice?: string | null;
  goals?: string[] | null;
  onboarding_completed?: boolean | null;
  subscription_status?: string | null;
  subscription_tier?: string | null;
  plan_status?: string | null;
  trial_ends_at?: string | null;
  trial_starts_at?: string | null;
  trial_claimed?: boolean;
  stripe_customer_id?: string | null;
  latest_strategy?: Record<string, unknown> | null;
  content_pillars?: Record<string, unknown> | null;
  referral_code?: string | null;
  referred_by?: string | null;
  bonus_posts?: number | null;
  created_at?: string;
  updated_at?: string;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data as unknown as Profile);
        // Persist tier for quick access in non-hydrated states
        localStorage.setItem('subscriptionTier', data.subscription_tier || 'tier-entry');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    if (!supabase) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setProfile(null);
      localStorage.removeItem('subscriptionTier');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
