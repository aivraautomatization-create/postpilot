"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { FileText, CheckCircle2, Target, Link as LinkIcon, Loader2, Clock, Zap } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { getUsageLimit } from "@/lib/plan-limits";
import Link from "next/link";

export default function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const supabase = getSupabase();

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }

      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }

      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  const getTrialDaysLeft = () => {
    if (!profile?.trial_ends_at) return 0;
    const end = new Date(profile.trial_ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getTrialDaysLeft();
  const status = profile?.plan_status || profile?.subscription_status;
  const isTrialing = status === 'trialing' || (!profile?.stripe_customer_id && daysLeft > 0);

  const postsThisMonth = analytics?.stats?.postsThisMonth || 0;
  const limit = getUsageLimit(profile?.subscription_tier);

  const stats = [
    {
      name: "Posts This Month",
      value: `${postsThisMonth}`,
      sub: `of ${limit} limit`,
      icon: FileText,
    },
    {
      name: "Total Published",
      value: `${analytics?.stats?.totalPublished || 0}`,
      sub: "all time",
      icon: CheckCircle2,
    },
    {
      name: "Success Rate",
      value: `${analytics?.stats?.successRate || 0}%`,
      sub: "publish success",
      icon: Target,
    },
    {
      name: "Active Platforms",
      value: `${analytics?.stats?.activePlatforms || 0}`,
      sub: "connected",
      icon: LinkIcon,
    },
  ];

  const dailyData = analytics?.dailyData || [];
  const platformData = analytics?.platformData || [];

  return (
    <div className="space-y-8">
      {/* Trial Banner */}
      {isTrialing && (
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-blue-50/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/[0.06] rounded-full flex items-center justify-center border border-white/[0.08]">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Free Trial Active</h3>
              <p className="text-white/50 text-sm">You have {daysLeft} days left in your trial. Upgrade now to keep your access.</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="relative z-10 bg-white text-black backdrop-blur-md font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 border-0"
          >
            <Zap className="w-4 h-4 fill-white flex-shrink-0" />
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.name} 
            className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group hover:border-white/30 transition-colors duration-500 transition-all duration-300 hover:shadow-glass-card hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/10 to-sky-300/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-blue-50/5 transition-all duration-300">
                <stat.icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-light tracking-tight text-white">{stat.value}</h3>
                  <p className="text-xs text-white/30">{stat.sub}</p>
                </div>
              )}
              <p className="text-sm text-white/50 pt-1">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Bar */}
      {!isLoading && (
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 group hover:border-white/[0.1] transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Monthly Usage</h3>
            <p className="text-sm text-white/40">{postsThisMonth} / {limit} posts</p>
          </div>
          <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden shadow-inner ring-1 ring-white/[0.05]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                postsThisMonth / limit >= 0.9 
                  ? "bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                  : postsThisMonth / limit >= 0.7 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                    : "bg-white text-black backdrop-blur-md animate-gradient-rotate bg-[length:200%_auto] shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              }`}
              style={{ width: `${Math.max(2, Math.min((postsThisMonth / limit) * 100, 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">Posts This Week</h3>
          <div className="h-72">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              </div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineColors" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(260,80%,65%)" />
                      <stop offset="50%" stopColor="hsl(340,75%,60%)" />
                      <stop offset="100%" stopColor="hsl(190,90%,55%)" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 500 }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="posts" 
                    stroke="url(#lineColors)" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6, fill: 'hsl(190,90%,55%)', stroke: '#000', strokeWidth: 2, className: "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" }} 
                    filter="url(#glow)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                No post data yet. Start publishing to see your weekly trends.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">Posts by Platform</h3>
          <div className="h-72">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              </div>
            ) : platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barColors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(260,80%,65%)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(190,90%,55%)" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 500 }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="posts" fill="url(#barColors)" radius={[6, 6, 0, 0]} activeBar={{ fill: 'url(#barColors)', stroke: 'hsl(190,90%,70%)', strokeWidth: 1 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                No platform data yet. Publish to different platforms to see the breakdown.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
