"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  PenTool,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";

// ─── Platform & Status config (mirrors history page) ─────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  linkedin: "bg-blue-500/10 text-blue-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  instagram: "bg-pink-500/10 text-pink-400",
  tiktok: "bg-purple-500/10 text-purple-400",
};

// Dot color for calendar cells (solid small circle)
const PLATFORM_DOT_COLORS: Record<string, string> = {
  twitter: "bg-sky-400",
  linkedin: "bg-blue-400",
  facebook: "bg-indigo-400",
  instagram: "bg-pink-400",
  tiktok: "bg-purple-400",
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  published: { icon: CheckCircle2, color: "text-emerald-400", label: "Published" },
  scheduled: { icon: Clock, color: "text-blue-400", label: "Scheduled" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
  draft: { icon: FileText, color: "text-white/40", label: "Draft" },
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Post = {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduled_for: string | null;
  created_at: string;
};

type ViewMode = "month" | "week";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getPostDateKey(post: Post): string | null {
  const raw = post.scheduled_for;
  if (!raw) return null;
  // Handles both "YYYY-MM-DD" and full ISO strings
  return raw.slice(0, 10);
}

/** Returns the Monday-starting week grid cells for a given month view.
 *  We use Sunday-starting (US convention) to match DAYS_OF_WEEK above. */
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells: Date[] = [];

  // Pad beginning
  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(new Date(year, month, 1 - (firstDay.getDay() - i)));
  }
  // Actual days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  // Pad end to fill last row
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push(new Date(year, month + 1, i));
    }
  }
  return cells;
}

/** Returns 7 Date objects for the week containing the given date (Sun–Sat). */
function getWeekDays(anchor: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

// ─── DrawerPostCard ───────────────────────────────────────────────────────────
function DrawerPostCard({ post }: { post: Post }) {
  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <StatusIcon className={clsx("w-4 h-4 shrink-0", statusConfig.color)} />
        <span className={clsx("text-xs font-medium", statusConfig.color)}>{statusConfig.label}</span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
        {post.content || "(No text content)"}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {(post.platforms || []).map((platform) => (
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = getSupabase();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Current anchor date (controls which month/week is shown)
  const today = new Date();
  const [anchor, setAnchor] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  // Drawer state
  const [drawerDate, setDrawerDate] = useState<string | null>(null);

  // ── Fetch posts ──────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const { data } = await supabase!
      .from("posts")
      .select("id, content, platforms, status, scheduled_for, created_at")
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true });
    setPosts((data as any) || []);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [fetchPosts]);

  // ── Build lookup: dateKey → Post[] ───────────────────────────────────────
  const postsByDate = posts.reduce<Record<string, Post[]>>((acc, post) => {
    const key = getPostDateKey(post);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  // ── Navigation helpers ───────────────────────────────────────────────────
  const navigate = (direction: -1 | 1) => {
    setAnchor((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(prev.getMonth() + direction);
      } else {
        next.setDate(prev.getDate() + direction * 7);
      }
      return next;
    });
  };

  const goToday = () => {
    setAnchor(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  // ── Period label ─────────────────────────────────────────────────────────
  const periodLabel = (() => {
    if (viewMode === "month") {
      return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
    }
    const week = getWeekDays(anchor);
    const start = week[0];
    const end = week[6];
    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  })();

  // ── Drawer posts ─────────────────────────────────────────────────────────
  const drawerPosts = drawerDate ? (postsByDate[drawerDate] || []) : [];

  // ── Platform dot set for a day cell ──────────────────────────────────────
  function getDayDots(dateKey: string): string[] {
    const dayPosts = postsByDate[dateKey] || [];
    const platforms = new Set<string>();
    dayPosts.forEach((p) => (p.platforms || []).forEach((pl) => platforms.add(pl)));
    return Array.from(platforms).slice(0, 4);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  const todayKey = toDateKey(today);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Content Calendar</h2>
          <p className="text-sm text-white/40 mt-0.5">Schedule and visualise your posts</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
            {(["month", "week"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                  viewMode === mode
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Today button */}
          <button
            onClick={goToday}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            Today
          </button>

          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              aria-label="Previous period"
              className="p-2 rounded-xl border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate(1)}
              aria-label="Next period"
              className="p-2 rounded-xl border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Period label */}
          <span className="text-sm font-medium text-white min-w-[180px] text-center hidden sm:block">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Mobile period label */}
      <p className="text-sm font-medium text-white text-center sm:hidden">{periodLabel}</p>

      {/* ── Calendar grid ── */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-medium text-white/30 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Month view ── */}
        {viewMode === "month" && (() => {
          const cells = getMonthGrid(anchor.getFullYear(), anchor.getMonth());
          const rows: Date[][] = [];
          for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

          return (
            <div>
              {rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 border-b border-white/[0.04] last:border-0">
                  {row.map((cell) => {
                    const key = toDateKey(cell);
                    const inMonth = cell.getMonth() === anchor.getMonth();
                    const isToday = key === todayKey;
                    const dayPosts = postsByDate[key] || [];
                    const dots = getDayDots(key);
                    const isSelected = drawerDate === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setDrawerDate(isSelected ? null : key)}
                        className={clsx(
                          "relative min-h-[80px] sm:min-h-[96px] p-2 text-left transition-all border-r border-white/[0.04] last:border-0 group",
                          inMonth ? "hover:bg-white/[0.03]" : "opacity-40",
                          isSelected && "bg-white/[0.05]"
                        )}
                      >
                        {/* Date number */}
                        <span
                          className={clsx(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium mb-1 transition-all",
                            isToday
                              ? "bg-white text-black font-bold"
                              : inMonth
                              ? "text-white/70 group-hover:text-white"
                              : "text-white/30"
                          )}
                        >
                          {cell.getDate()}
                        </span>

                        {/* Post count badge */}
                        {dayPosts.length > 0 && (
                          <span className="absolute top-2 right-2 text-[10px] font-medium text-white/40">
                            {dayPosts.length}
                          </span>
                        )}

                        {/* Platform dots */}
                        {dots.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dots.map((platform) => (
                              <span
                                key={platform}
                                className={clsx(
                                  "w-2 h-2 rounded-full",
                                  PLATFORM_DOT_COLORS[platform] || "bg-white/30"
                                )}
                              />
                            ))}
                          </div>
                        )}

                        {/* First post content preview (desktop) */}
                        {dayPosts.length > 0 && (
                          <p className="hidden lg:block text-[10px] text-white/30 mt-1 truncate leading-tight">
                            {dayPosts[0].content?.slice(0, 30) || ""}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Week view ── */}
        {viewMode === "week" && (() => {
          const weekDays = getWeekDays(anchor);

          return (
            <div className="grid grid-cols-7 divide-x divide-white/[0.04] min-h-[400px]">
              {weekDays.map((day) => {
                const key = toDateKey(day);
                const isToday = key === todayKey;
                const dayPosts = postsByDate[key] || [];
                const isSelected = drawerDate === key;

                return (
                  <div key={key} className={clsx("flex flex-col", isSelected && "bg-white/[0.03]")}>
                    {/* Day header */}
                    <div
                      className={clsx(
                        "py-3 text-center border-b border-white/[0.04]",
                        isToday && "bg-white/[0.04]"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                          isToday ? "bg-white text-black font-bold" : "text-white/60"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Posts for the day */}
                    <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[520px]">
                      {dayPosts.map((post) => {
                        const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                        const StatusIcon = statusConfig.icon;
                        const dots = Array.from(new Set(post.platforms || [])).slice(0, 2);

                        return (
                          <button
                            key={post.id}
                            onClick={() => setDrawerDate(isSelected && drawerPosts.some(p => p.id === post.id) ? null : key)}
                            className="w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg p-2 transition-all group"
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <StatusIcon className={clsx("w-3 h-3 shrink-0", statusConfig.color)} />
                              <div className="flex gap-0.5">
                                {dots.map((pl) => (
                                  <span
                                    key={pl}
                                    className={clsx("w-1.5 h-1.5 rounded-full", PLATFORM_DOT_COLORS[pl] || "bg-white/30")}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-[10px] text-white/50 truncate leading-snug">
                              {post.content?.slice(0, 40) || "(No content)"}
                            </p>
                          </button>
                        );
                      })}

                      {dayPosts.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── Slide-out Drawer ── */}
      {drawerDate && (
        <div className="fixed inset-y-0 right-0 z-50 flex">
          {/* Backdrop (mobile) */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerDate(null)}
          />

          <div className="relative ml-auto w-full max-w-sm bg-[#0d0d0d] border-l border-white/[0.08] flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {(() => {
                    const d = parseDateKey(drawerDate);
                    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                  })()}
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {drawerPosts.length === 0
                    ? "No posts scheduled"
                    : `${drawerPosts.length} post${drawerPosts.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => setDrawerDate(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Posts list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">Nothing scheduled for this day.</p>
                </div>
              ) : (
                drawerPosts.map((post) => <DrawerPostCard key={post.id} post={post} />)
              )}
            </div>

            {/* CTA */}
            <div className="p-4 border-t border-white/[0.08]">
              <Link
                href={`/dashboard/create?date=${drawerDate}`}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-white/90 text-black font-semibold py-2.5 px-4 rounded-xl transition-all text-sm"
              >
                <PenTool className="w-4 h-4" />
                Schedule a post
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
