"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  Search,
  ArrowRight,
  Sparkles,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Music2,
} from "lucide-react";
import {
  contentTemplates,
  NICHES,
  PLATFORMS,
  CONTENT_TYPES,
  type ContentTemplate,
} from "@/lib/content-templates";

const platformIcons: Record<string, any> = {
  Twitter,
  LinkedIn: Linkedin,
  Instagram,
  TikTok: Music2,
  Facebook,
  YouTube: Youtube,
};

const platformColors: Record<string, string> = {
  Twitter: "text-sky-400",
  LinkedIn: "text-blue-400",
  Instagram: "text-pink-400",
  TikTok: "text-rose-400",
  Facebook: "text-blue-500",
  YouTube: "text-red-400",
};

const contentTypeColors: Record<string, string> = {
  Hook: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Story: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CTA: "bg-green-500/10 text-green-400 border-green-500/20",
  Thread: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Carousel: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Tip: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Controversy: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function TemplatesPage() {
  const [selectedNiche, setSelectedNiche] = useState<string>("All");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    return contentTemplates.filter((t) => {
      if (selectedNiche !== "All" && t.niche !== selectedNiche) return false;
      if (selectedPlatform !== "All" && t.platform !== selectedPlatform) return false;
      if (selectedType !== "All" && t.contentType !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedNiche, selectedPlatform, selectedType, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.08]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-light tracking-tight text-white">
              Content Templates
            </h2>
            <p className="text-sm text-white/40">
              {contentTemplates.length} proven templates. Pick one, make it yours, publish everywhere.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Search + Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Filter Rows */}
        <div className="space-y-3">
          {/* Niche */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/30 uppercase tracking-wider w-16 shrink-0">Niche</span>
            {NICHES.map((niche) => (
              <button
                key={niche}
                onClick={() => setSelectedNiche(niche)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedNiche === niche
                    ? "bg-white/[0.1] text-white border border-white/20"
                    : "text-white/40 hover:text-white/60 border border-transparent hover:border-white/[0.08]"
                }`}
              >
                {niche}
              </button>
            ))}
          </div>

          {/* Platform */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/30 uppercase tracking-wider w-16 shrink-0">Platform</span>
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  selectedPlatform === platform
                    ? "bg-white/[0.1] text-white border border-white/20"
                    : "text-white/40 hover:text-white/60 border border-transparent hover:border-white/[0.08]"
                }`}
              >
                {platform !== "All" && platformIcons[platform] && (
                  (() => {
                    const Icon = platformIcons[platform];
                    return <Icon className="w-3 h-3" />;
                  })()
                )}
                {platform}
              </button>
            ))}
          </div>

          {/* Content Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/30 uppercase tracking-wider w-16 shrink-0">Type</span>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedType === type
                    ? "bg-white/[0.1] text-white border border-white/20"
                    : "text-white/40 hover:text-white/60 border border-transparent hover:border-white/[0.08]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-white/30">
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
      </div>

      {/* Template Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No templates match your filters.</p>
          <button
            onClick={() => {
              setSelectedNiche("All");
              setSelectedPlatform("All");
              setSelectedType("All");
              setSearchQuery("");
            }}
            className="mt-3 text-sm text-white/50 hover:text-white underline transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: ContentTemplate }) {
  const PlatformIcon = platformIcons[template.platform];
  const platformColor = platformColors[template.platform] || "text-white/50";
  const typeColor = contentTypeColors[template.contentType] || "bg-white/5 text-white/50 border-white/10";

  return (
    <motion.div
      variants={fadeInUp}
      className="group bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 hover:border-white/20 transition-all duration-500 flex flex-col relative overflow-hidden"
    >
      {/* Hover glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Top row: platform + type */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          {PlatformIcon && <PlatformIcon className={`w-4 h-4 ${platformColor}`} />}
          <span className="text-xs text-white/40">{template.platform}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${typeColor}`}>
          {template.contentType}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white mb-2 relative z-10">{template.title}</h3>

      {/* Preview */}
      <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-4 flex-1 relative z-10 whitespace-pre-line">
        {template.content.slice(0, 160)}...
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
        <span className="text-[10px] text-white/25 px-2 py-0.5 rounded-full border border-white/[0.06]">
          {template.niche}
        </span>
        {template.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[10px] text-white/25 px-2 py-0.5 rounded-full border border-white/[0.06]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/dashboard/create?template=${template.id}`}
        className="relative z-10 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs font-medium hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all duration-300 group-hover:bg-white/[0.06]"
      >
        Use this template
        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300" />
      </Link>
    </motion.div>
  );
}
