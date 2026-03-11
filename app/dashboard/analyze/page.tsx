"use client";

import { useState } from "react";
import { Video, Loader2, Sparkles, FileText } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";

export default function AnalyzeVideo() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Analyze this video and provide a summary of its key points, target audience, and suggestions for social media captions.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      // Convert video to base64
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: videoFile.type,
                  }
                },
                { text: prompt }
              ]
            }
          });
          
          setResult(response.text || "Failed to analyze video.");
        } catch (err: any) {
          console.error(err);
          setError(err.message || "An error occurred during analysis.");
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Video Understanding</h2>
        <p className="text-white/50">Upload a video and let Gemini Pro analyze it for insights, captions, and more.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/80">Upload Video</label>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleVideoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {videoUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <video src={videoUrl} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <Video className="w-8 h-8" />
                  <span>Click or drag to upload a video</span>
                  <span className="text-xs">Max size: 50MB (for preview)</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/80">What do you want to know?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-[#111] border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !videoFile}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Video...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze Video
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col min-h-[500px]">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Analysis Results
          </h3>
          
          <div className="flex-1 overflow-y-auto">
            {result ? (
              <div className="prose prose-invert max-w-none">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-white/50" />
                    <p>Gemini is watching your video...</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 opacity-50" />
                    <p>Analysis results will appear here</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
