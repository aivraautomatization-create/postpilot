"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, TrendingUp, Clock, Target, Lightbulb, Video, CheckCircle2, FileText, Link as LinkIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getSupabase } from "@/lib/supabase";

export default function StrategyPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    generateStrategy();
    // Fetch analytics for real stats
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch {
        // Non-blocking
      }
    }
    fetchAnalytics();
  }, []);

  const generateStrategy = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch profile from Supabase (not localStorage)
      const supabase = getSupabase();
      let profile = null;
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profile = data;
        }
      }

      if (!profile || !profile.company_name) {
        setError("Please complete your company profile in settings to get personalized strategy insights.");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/generate/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate strategy.");
      }

      const strategyText = data.content || "Failed to generate insights.";
      setInsights(strategyText);

      // Save strategy to Supabase for use in content creation
      if (strategyText && strategyText !== "Failed to generate insights." && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any)
            .from('profiles')
            .update({ latest_strategy: strategyText })
            .eq('id', user.id);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating strategy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">Viral Strategy</h2>
          <p className="text-white/50">AI-powered insights tailored to your specific niche and audience.</p>
        </div>
        <button
          onClick={generateStrategy}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Refresh Insights
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Strategy saved — will be applied to content creation
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading && !insights ? (
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-white text-black backdrop-blur-md blur-xl opacity-50 mix-blend-screen" />
            <Loader2 className="w-10 h-10 text-white animate-spin relative z-10" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Analyzing Algorithm Trends...</h3>
          <p className="text-white/50 text-center max-w-md">
            Our AI is analyzing current social media algorithms to build a custom viral strategy for your specific niche.
          </p>
        </div>
      ) : insights ? (
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8">
          <div className="prose prose-invert max-w-none prose-headings:font-light prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-white/70 prose-li:text-white/70">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </div>
      ) : null}
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 hover:border-white/30 transition-colors duration-500 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-50/10 to-sky-300/10 border border-white/[0.06] rounded-xl text-white">
              <FileText className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="font-medium text-white">Posts This Month</h3>
          </div>
          <p className="text-2xl font-light text-white mb-1">{analytics?.stats?.postsThisMonth ?? '—'}</p>
          <p className="text-sm text-white/40">total published this month</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 hover:border-white/30 transition-colors duration-500 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 border border-white/[0.06] rounded-xl text-blue-300">
              <Target className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="font-medium text-white">Success Rate</h3>
          </div>
          <p className="text-2xl font-light text-white mb-1">{analytics?.stats?.successRate ?? '—'}%</p>
          <p className="text-sm text-white/40">publish success rate</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 hover:border-white/30 transition-colors duration-500 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-rose-400/20 to-purple-500/20 border border-white/[0.06] rounded-xl text-rose-300">
              <LinkIcon className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="font-medium text-white">Active Platforms</h3>
          </div>
          <p className="text-2xl font-light text-white mb-1">{analytics?.stats?.activePlatforms ?? '—'}</p>
          <p className="text-sm text-white/40">connected accounts</p>
        </div>
      </div>
    </div>
  );
}
