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
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Free Trial Active</h3>
              <p className="text-white/50 text-sm">You have {daysLeft} days left in your trial. Upgrade now to keep your access.</p>
            </div>
          </div>
          <Link
            href="/#pricing"
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-5 h-5 text-white/50" />
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-light tracking-tight text-white">{stat.value}</h3>
                  <p className="text-xs text-white/30">{stat.sub}</p>
                </>
              )}
              <p className="text-sm text-white/50">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Bar */}
      {!isLoading && (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Monthly Usage</h3>
            <p className="text-sm text-white/40">{postsThisMonth} / {limit} posts</p>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                postsThisMonth / limit >= 0.9 ? "bg-red-500" : postsThisMonth / limit >= 0.7 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min((postsThisMonth / limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">Posts This Week</h3>
          <div className="h-72">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              </div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="posts" stroke="#fff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                No post data yet. Start publishing to see your weekly trends.
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">Posts by Platform</h3>
          <div className="h-72">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              </div>
            ) : platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="posts" fill="#4a4a4a" radius={[4, 4, 0, 0]} />
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
