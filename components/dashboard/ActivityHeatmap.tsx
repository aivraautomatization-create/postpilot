"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface ActivityHeatmapProps {
  /** Map of date strings (YYYY-MM-DD) to post counts */
  postsByDate: Record<string, number>;
}

function getColor(count: number): string {
  if (count === 0) return "bg-white/[0.03]";
  if (count === 1) return "bg-emerald-500/20";
  if (count === 2) return "bg-emerald-500/40";
  if (count <= 4) return "bg-emerald-500/60";
  return "bg-emerald-500/80";
}

function getTooltip(date: string, count: number): string {
  const d = new Date(date + "T12:00:00");
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (count === 0) return `${formatted}: No posts`;
  return `${formatted}: ${count} post${count > 1 ? "s" : ""}`;
}

export default function ActivityHeatmap({ postsByDate }: ActivityHeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Go back 12 weeks (84 days)
    const start = new Date(today);
    start.setDate(start.getDate() - 83);
    // Align to start of week (Sunday)
    start.setDate(start.getDate() - start.getDay());

    let currentWeek: { date: string; count: number }[] = [];

    const cursor = new Date(start);
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split("T")[0];
      currentWeek.push({
        date: dateStr,
        count: postsByDate[dateStr] || 0,
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [postsByDate]);

  const totalPosts = Object.values(postsByDate).reduce((sum, c) => sum + c, 0);
  const activeDays = Object.values(postsByDate).filter((c) => c > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/70">Posting Activity</h3>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>{activeDays} active days</span>
          <span>&middot;</span>
          <span>{totalPosts} posts</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-[3px] ${getColor(day.count)} transition-colors duration-200 hover:ring-1 hover:ring-white/20`}
                title={getTooltip(day.date, day.count)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-white/20">Less</span>
        <div className="w-3 h-3 rounded-[3px] bg-white/[0.03]" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/20" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/40" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/60" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/80" />
        <span className="text-[10px] text-white/20">More</span>
      </div>
    </motion.div>
  );
}
