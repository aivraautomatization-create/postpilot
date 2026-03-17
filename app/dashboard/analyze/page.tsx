"use client";

import { useState } from "react";
import { Video, Loader2, Sparkles, FileText } from "lucide-react";
import Markdown from "react-markdown";
import { validateFile, MAX_VIDEO_SIZE, ALLOWED_VIDEO_TYPES } from "@/lib/upload-validation";

export default function AnalyzeVideo() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Analyze this video and provide a summary of its key points, target audience, and suggestions for social media captions.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, { maxSize: MAX_VIDEO_SIZE, allowedTypes: ALLOWED_VIDEO_TYPES });
    if (!validation.valid) {
      setError(validation.error || "Invalid file.");
      return;
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("prompt", prompt);

      const response = await fetch('/api/generate/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze video.");
      }

      setResult(data.content || "Failed to analyze video.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
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
              className="w-full h-32 bg-white/[0.02] backdrop-blur-md border border-white/[0.08] hover:border-white/30 transition-colors duration-500 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 resize-none transition-all"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !videoFile}
            className="w-full flex items-center justify-center gap-2 bg-white text-black backdrop-blur-md shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] py-4 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-outfit"
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

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 flex flex-col min-h-[500px]">
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
