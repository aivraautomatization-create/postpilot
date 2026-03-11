"use client";

import { useState, useEffect } from "react";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Loader2, Sparkles, TrendingUp, Clock, Target, Lightbulb, Video } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function StrategyPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateStrategy();
  }, []);

  const generateStrategy = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileStr = localStorage.getItem('companyProfile');
      const profile = profileStr ? JSON.parse(profileStr) : null;
      
      if (!profile) {
        setError("Please complete your company profile in settings to get personalized strategy insights.");
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const prompt = `Analyze the following company profile and generate a highly specific, actionable viral social media strategy.
      
      Company Name: ${profile.companyName}
      Niche/Industry: ${profile.niche}
      Offerings: ${profile.offerings}
      Target Audience: ${profile.targetAudience}
      Brand Voice: ${profile.toneOfVoice}
      
      Provide insights in the following format using markdown:
      
      ## 🎯 Top Performing Content Topics
      [List 3-4 highly specific content angles that are currently trending in this niche]
      
      ## ⏰ Optimal Posting Schedule
      [Provide specific days and times based on when this target audience is most active online]
      
      ## 🎬 Viral Video Techniques
      [List 3 specific editing styles, hooks, or formats (e.g., POV, educational, behind-the-scenes) that work best for this audience]
      
      ## 📈 Growth Hacks
      [Provide 2 unconventional or highly effective strategies to maximize reach and engagement for this specific business]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: "You are an elite social media strategist and algorithm expert. Provide highly actionable, data-driven, and specific advice tailored to the exact niche and audience provided. Do not give generic advice."
        }
      });
      
      setInsights(response.text || "Failed to generate insights.");
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
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading && !insights ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Analyzing Algorithm Trends...</h3>
          <p className="text-white/50 text-center max-w-md">
            Our AI is analyzing current social media algorithms to build a custom viral strategy for your specific niche.
          </p>
        </div>
      ) : insights ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
          <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-light prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-white/70 prose-li:text-white/70">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </div>
      ) : null}
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-400/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-medium text-white">Algorithm Status</h3>
          </div>
          <p className="text-sm text-white/60">Short-form video is currently prioritized across all major platforms. High retention rate is the #1 ranking factor.</p>
        </div>
        
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-400/10 rounded-lg">
              <Video className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-medium text-white">Content Format</h3>
          </div>
          <p className="text-sm text-white/60">9:16 vertical video under 60 seconds is outperforming static images by 300% in organic reach.</p>
        </div>
        
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-400/10 rounded-lg">
              <Lightbulb className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-medium text-white">Hook Strategy</h3>
          </div>
          <p className="text-sm text-white/60">The first 3 seconds determine 80% of your video&apos;s success. Use visual movement and text hooks immediately.</p>
        </div>
      </div>
    </div>
  );
}
