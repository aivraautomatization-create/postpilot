import { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Command, Zap, Globe, Heart, Clock } from "lucide-react";

type Props = {
  params: Promise<{ userId: string; month: string }>;
};

async function getWrapData(userId: string, month: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const [year, mo] = month.split("-").map(Number);
  if (!year || !mo || mo < 1 || mo > 12) return null;

  const startDate = new Date(year, mo - 1, 1).toISOString();
  const endDate = new Date(year, mo, 1).toISOString();

  const { data: profile } = await admin!
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const { data: posts } = await admin!
    .from("posts")
    .select("id, platforms")
    .eq("user_id", userId)
    .eq("status", "published")
    .gte("published_at", startDate)
    .lt("published_at", endDate);

  const publishedPosts = posts || [];
  const postIds = publishedPosts.map((p) => p.id);

  const platformSet = new Set<string>();
  for (const post of publishedPosts) {
    for (const p of post.platforms || []) {
      platformSet.add(p);
    }
  }

  let totalEngagement = 0;
  if (postIds.length > 0) {
    const { data: metrics } = await admin!
      .from("post_metrics")
      .select("likes, shares")
      .in("post_id", postIds);
    totalEngagement = (metrics || []).reduce(
      (sum, m) => sum + (m.likes || 0) + (m.shares || 0),
      0
    );
  }

  const timeSavedMinutes = publishedPosts.length * 15;
  const timeSaved =
    timeSavedMinutes >= 60
      ? `${Math.floor(timeSavedMinutes / 60)}h ${timeSavedMinutes % 60}m`
      : `${timeSavedMinutes}m`;

  return {
    name: profile.full_name || profile.company_name || "A Puls User",
    totalPosts: publishedPosts.length,
    totalPlatforms: platformSet.size,
    platforms: Array.from(platformSet),
    totalEngagement,
    timeSaved,
  };
}

function formatMonthLabel(month: string): string {
  const [year, mo] = month.split("-").map(Number);
  const date = new Date(year, mo - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId, month } = await params;
  const data = await getWrapData(userId, month);
  const title = data
    ? `${data.name}'s ${formatMonthLabel(month)} Content Wrap`
    : "Content Wrap - Puls";
  const description = data
    ? `${data.totalPosts} posts published across ${data.totalPlatforms} platforms with ${data.totalEngagement.toLocaleString()} total engagement. See the full wrap.`
    : "See this creator's monthly content wrap on Puls.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Puls",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicWrapPage({ params }: Props) {
  const { userId, month } = await params;
  const data = await getWrapData(userId, month);

  if (!data || data.totalPosts === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-12 text-center max-w-md">
          <h1 className="text-xl font-medium text-white mb-2">Wrap not available</h1>
          <p className="text-white/40 text-sm mb-6">
            This content wrap doesn&apos;t exist or has no published posts for the selected month.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            <Zap className="w-4 h-4" />
            Create Your Own Wrap
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Zap, label: "Posts Published", value: data.totalPosts.toString(), color: "text-amber-400" },
    { icon: Globe, label: "Platforms Reached", value: data.totalPlatforms.toString(), color: "text-sky-400" },
    { icon: Heart, label: "Total Engagement", value: data.totalEngagement.toLocaleString(), color: "text-pink-400" },
    { icon: Clock, label: "Time Saved", value: data.timeSaved, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.05] via-transparent to-pink-500/[0.05] pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-8">
              <Command className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white tracking-tight">Puls</span>
            </div>

            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
              {formatMonthLabel(month)} Recap
            </p>
            <h1 className="text-2xl font-light text-white mb-8">
              {data.name}&apos;s Content Wrap
            </h1>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-white/40">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-light text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {data.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {data.platforms.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-lg text-xs font-medium capitalize bg-white/[0.04] text-white/60 border border-white/[0.06]"
                  >
                    {p === "twitter" ? "X" : p}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs mb-4">
                Create your own content wrap
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
              >
                <Zap className="w-4 h-4" />
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
