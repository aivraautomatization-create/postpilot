"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
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

const PAGE_SIZE = 20;
const CONTENT_PREVIEW_LENGTH = 200;

function ExpandableContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = content.length > CONTENT_PREVIEW_LENGTH;

  return (
    <div>
      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
        {expanded || !needsTruncation ? content : `${content.slice(0, CONTENT_PREVIEW_LENGTH)}...`}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-white/40 hover:text-white/70 mt-1 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  linkedin: "bg-blue-500/10 text-blue-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  instagram: "bg-pink-500/10 text-pink-400",
  tiktok: "bg-purple-500/10 text-purple-400",
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  published: { icon: CheckCircle2, color: "text-white", label: "Published" },
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [counts, setCounts] = useState({ all: 0, published: 0, scheduled: 0, failed: 0 });

  const fetchPosts = useCallback(async (reset: boolean, currentPosts: any[] = []) => {
    if (!supabase || !user) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = reset ? 0 : currentPosts.length;
    const to = from + PAGE_SIZE - 1;

    let query = supabase!
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;

    if (reset) {
      setPosts(data || []);
    } else {
      setPosts(prev => [...prev, ...(data || [])]);
    }

    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);

    // Update counts on initial load
    if (reset) {
      const allQuery = await supabase!
        .from("posts")
        .select("status")
        .eq("user_id", user.id);

      const allPosts = allQuery.data || [];
      setCounts({
        all: allPosts.length,
        published: allPosts.filter((p: any) => p.status === "published").length,
        scheduled: allPosts.filter((p: any) => p.status === "scheduled").length,
        failed: allPosts.filter((p: any) => p.status === "failed").length,
      });
    }
  }, [supabase, user, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(true);
  }, [fetchPosts]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "published", label: "Published", count: counts.published },
    { key: "scheduled", label: "Scheduled", count: counts.scheduled },
    { key: "failed", label: "Failed", count: counts.failed },
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
      {posts.length === 0 ? (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-glass-card rounded-2xl p-12 text-center">
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
            className="inline-flex items-center gap-2 bg-white text-black backdrop-blur-md shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] font-semibold py-2.5 px-6 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-sm font-outfit"
          >
            <PenTool className="w-4 h-4" />
            Create Content
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;
            const hasImage = !!post.image_url;
            const hasVideo = !!post.video_url;

            return (
              <div
                key={post.id}
                className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] hover:border-white/30 transition-colors duration-500 shadow-glass-card rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {hasImage && <ImageIcon className="w-4 h-4 text-white/30 shrink-0" />}
                      {hasVideo && <Video className="w-4 h-4 text-white/30 shrink-0" />}
                      {!hasImage && !hasVideo && <FileText className="w-4 h-4 text-white/30 shrink-0" />}
                      <span className={clsx("flex items-center gap-1 text-xs font-medium", statusConfig.color)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <ExpandableContent content={post.content || "(No text content)"} />

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

                    {post.publish_results && Object.keys(post.publish_results).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {Object.entries(post.publish_results).map(([platform, result]: [string, any]) => (
                          <p
                            key={platform}
                            className={clsx(
                              "text-xs",
                              result.status === "success" ? "text-white/60" : "text-red-400/60"
                            )}
                          >
                            {platform}: {result.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {hasImage && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

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

          {/* Load More button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchPosts(false, posts)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 hover:text-white transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
