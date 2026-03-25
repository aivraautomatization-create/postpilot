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
import { FileText, CheckCircle2, Target, Link as LinkIcon, Loader2, Clock, Zap, Brain, Sparkles } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { getUsageLimit, getPlanName } from "@/lib/plan-limits";
import Link from "next/link";
import GettingStartedChecklist from "@/components/dashboard/GettingStartedChecklist";
import TodaysPlan from "@/components/dashboard/TodaysPlan";
import QuickAILauncher from "@/components/dashboard/QuickAILauncher";
import StrategyScore from "@/components/dashboard/StrategyScore";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";

export default function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [brainData, setBrainData] = useState<any>(null);
  const supabase = getSupabase();

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }

      try {
        const [analyticsRes, brainRes] = await Promise.allSettled([
          fetch('/api/analytics'),
          fetch('/api/brain/recommend'),
        ]);
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
          setAnalytics(await analyticsRes.value.json());
        }
        if (brainRes.status === 'fulfilled' && brainRes.value.ok) {
          setBrainData(await brainRes.value.json());
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
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
  const limit = getUsageLimit(profile?.subscription_tier, profile?.bonus_posts || 0);
  const totalPublished = analytics?.stats?.totalPublished || 0;
  const activePlatforms = analytics?.stats?.activePlatforms || 0;
  const isNewUser = totalPublished === 0 || postsThisMonth === 0;

  const dailyData = analytics?.dailyData || [];
  const platformData = analytics?.platformData || [];

  // Calculate strategy score based on available data
  const strategyScore = Math.min(100, Math.round(
    (profile?.latest_strategy ? 25 : 0) +
    (activePlatforms > 0 ? 20 : 0) +
    (totalPublished > 0 ? 15 : 0) +
    (postsThisMonth >= 5 ? 15 : postsThisMonth * 3) +
    (profile?.company_name ? 10 : 0) +
    (brainData?.topPatterns?.length > 0 ? 15 : 0)
  ));

  const checklistSteps = [
    { label: "Complete your company profile", href: "/dashboard/settings", completed: !!profile?.company_name },
    { label: "Set up your AI Brain", href: "/dashboard/brain", completed: !!profile?.latest_strategy },
    { label: "Generate your first post", href: "/dashboard/create", completed: totalPublished > 0 },
    { label: "Connect a social account", href: "/dashboard/accounts", completed: activePlatforms > 0 },
    { label: "Create your viral strategy", href: "/dashboard/strategy", completed: !!profile?.latest_strategy },
  ];

  const stats = [
    { name: "Posts This Month", value: `${postsThisMonth}`, sub: `of ${limit}`, icon: FileText },
    { name: "Total Published", value: `${totalPublished}`, sub: "all time", icon: CheckCircle2 },
    { name: "Success Rate", value: `${analytics?.stats?.successRate || 0}%`, sub: "published", icon: Target },
    { name: "Platforms", value: `${activePlatforms}`, sub: "connected", icon: LinkIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {isTrialing && (
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-blue-50/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center border border-white/[0.08]">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">14-Day Free Trial Active</h3>
              <p className="text-white/50 text-sm">{daysLeft} days left. Upgrade to keep full access.</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="relative z-10 bg-white text-black font-semibold py-2 px-5 rounded-xl transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 text-sm"
          >
            <Zap className="w-4 h-4" />
            Upgrade
          </Link>
        </div>
      )}

      {!isLoading && isNewUser ? (
        <>
          <GettingStartedChecklist steps={checklistSteps} />
          <QuickAILauncher />
        </>
      ) : (
        <>
          {/* Top Row: Today's Plan + Strategy Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TodaysPlan />
            </div>
            <div>
              <StrategyScore score={strategyScore} />
            </div>
          </div>

          {/* Quick AI Launcher */}
          <QuickAILauncher />

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <stat.icon className="w-4 h-4 text-white/50" />
                  </div>
                  <p className="text-xs text-white/40">{stat.name}</p>
                </div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-light text-white">{stat.value}</span>
                    <span className="text-xs text-white/30">{stat.sub}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Usage Bar */}
          {!isLoading && (
            <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Monthly Usage</h3>
                <p className="text-sm text-white/40">{postsThisMonth} / {limit} posts</p>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden ring-1 ring-white/[0.05]">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    postsThisMonth / limit >= 0.9
                      ? "bg-gradient-to-r from-red-500 to-rose-500"
                      : postsThisMonth / limit >= 0.7
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-white"
                  }`}
                  style={{ width: `${Math.max(2, Math.min((postsThisMonth / limit) * 100, 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Middle Row: AI Insights + Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Insights Panel */}
            <div>
              <AIInsightsPanel insights={brainData?.topPatterns?.map((p: any) => p.content?.value || p.content).slice(0, 5)} />
            </div>

            {/* Posts This Week Chart */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6">
              <h3 className="text-sm font-medium text-white mb-4">Posts This Week</h3>
              <div className="h-56">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                  </div>
                ) : dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="posts" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a855f7' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                    No post data yet. Start publishing to see trends.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Platform breakdown */}
          <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6">
            <h3 className="text-sm font-medium text-white mb-4">Posts by Platform</h3>
            <div className="h-48">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                </div>
              ) : platformData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: 12 }}
                    />
                    <Bar dataKey="posts" fill="#a855f7" radius={[4, 4, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                  No platform data yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
