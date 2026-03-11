"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  PenTool,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Video,
  FileText,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  linkedin: "bg-blue-500/10 text-blue-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  instagram: "bg-pink-500/10 text-pink-400",
  tiktok: "bg-purple-500/10 text-purple-400",
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  published: { icon: CheckCircle2, color: "text-emerald-400", label: "Published" },
  scheduled: { icon: Clock, color: "text-blue-400", label: "Scheduled" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
  draft: { icon: FileText, color: "text-white/40", label: "Draft" },
};

type FilterTab = "all" | "published" | "scheduled" | "failed";

export default function HistoryPage() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    async function fetchPosts() {
      if (!supabase || !user) return;
      const { data } = await (supabase as any)
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts(data || []);
      setLoading(false);
    }

    fetchPosts();
  }, [supabase, user]);

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: posts.length },
    { key: "published", label: "Published", count: posts.filter((p) => p.status === "published").length },
    { key: "scheduled", label: "Scheduled", count: posts.filter((p) => p.status === "scheduled").length },
    { key: "failed", label: "Failed", count: posts.filter((p) => p.status === "failed").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              filter === tab.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <PenTool className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {filter === "all" ? "No posts yet" : `No ${filter} posts`}
          </h3>
          <p className="text-white/50 text-sm mb-6">
            {filter === "all"
              ? "Start creating content to see your post history here."
              : `You don't have any ${filter} posts yet.`}
          </p>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all text-sm"
          >
            <PenTool className="w-4 h-4" />
            Create Content
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;
            const hasImage = !!post.image_url;
            const hasVideo = !!post.video_url;

            return (
              <div
                key={post.id}
                className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Content preview */}
                    <div className="flex items-center gap-2 mb-2">
                      {hasImage && <ImageIcon className="w-4 h-4 text-white/30 shrink-0" />}
                      {hasVideo && <Video className="w-4 h-4 text-white/30 shrink-0" />}
                      {!hasImage && !hasVideo && <FileText className="w-4 h-4 text-white/30 shrink-0" />}
                      <span className={clsx("flex items-center gap-1 text-xs font-medium", statusConfig.color)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <p className="text-white/80 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {post.content || "(No text content)"}
                    </p>

                    {/* Platform badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(post.platforms || []).map((platform: string) => (
                        <span
                          key={platform}
                          className={clsx(
                            "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                            PLATFORM_COLORS[platform] || "bg-white/5 text-white/40"
                          )}
                        >
                          {platform === "twitter" ? "X" : platform}
                        </span>
                      ))}
                    </div>

                    {/* Per-platform results */}
                    {post.publish_results && Object.keys(post.publish_results).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {Object.entries(post.publish_results).map(([platform, result]: [string, any]) => (
                          <p
                            key={platform}
                            className={clsx(
                              "text-xs",
                              result.status === "success" ? "text-emerald-400/60" : "text-red-400/60"
                            )}
                          >
                            {platform}: {result.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image preview */}
                  {hasImage && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <p className="text-xs text-white/30">
                    {post.published_at
                      ? `Published ${new Date(post.published_at).toLocaleString()}`
                      : post.scheduled_for
                      ? `Scheduled for ${new Date(post.scheduled_for).toLocaleString()}`
                      : `Created ${new Date(post.created_at).toLocaleString()}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
