"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { 
  Type, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Wand2,
  Loader2,
  Sparkles,
  Share2,
  CheckCircle2,
  Calendar,
  Lock,
  AlertCircle
} from "lucide-react";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getSupabase } from "@/lib/supabase";

const tabs = [
  { id: "text", name: "Text Content", icon: Type },
  { id: "image", name: "Generate Image", icon: ImageIcon },
  { id: "video", name: "Generate Video", icon: VideoIcon },
  { id: "animate", name: "Animate Image", icon: Wand2 },
];

export default function CreateContent() {
  const [activeTab, setActiveTab] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Image specific state
  const [imageSize, setImageSize] = useState("1K");
  
  // Video specific state
  const [aspectRatio, setAspectRatio] = useState("16:9");
  
  // Animate specific state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null);

  // Publishing specific state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [userTier, setUserTier] = useState<string | null>(null);

  useEffect(() => {
    setUserTier(localStorage.getItem('subscriptionTier') || 'tier-entry');
  }, []);

  const platforms = [
    { id: "instagram", name: "Instagram", comingSoon: false },
    { id: "facebook", name: "Facebook", comingSoon: false },
    { id: "linkedin", name: "LinkedIn", comingSoon: false },
    { id: "tiktok", name: "TikTok", comingSoon: false },
    { id: "snapchat", name: "Snapchat", comingSoon: true },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (!result || selectedPlatforms.length === 0) return;
    
    setIsPublishing(true);
    setPublishResults([]);
    
    try {
      const supabase = getSupabase();
      let userId = null;
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: activeTab === 'text' ? result : prompt,
          imageUrl: activeTab !== 'text' ? result : null,
          platforms: selectedPlatforms,
          scheduledDate: scheduledDate || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPublishResults(data.results);
      } else {
        setError(data.error || "Failed to publish content.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && activeTab !== "animate") return;
    if (activeTab === "animate" && !uploadedImage) return;
    
    setIsGenerating(true);
    setResult(null);
    setError(null);
    
    try {
      if (activeTab === "text") {
        // Fetch profile from Supabase
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

        // Fallback to localStorage if Supabase fails or isn't ready
        if (!profile) {
          const profileStr = localStorage.getItem('companyProfile');
          profile = profileStr ? JSON.parse(profileStr) : null;
        }

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: prompt,
            platform: selectedPlatforms.length > 0 ? selectedPlatforms[0] : 'General',
            profile: {
              company_name: profile?.company_name || profile?.companyName,
              niche: profile?.niche,
              offerings: profile?.offerings,
              target_audience: profile?.target_audience || profile?.targetAudience,
              tone_of_voice: profile?.tone_of_voice || profile?.toneOfVoice
            }
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          setResult(data.content);
        } else {
          setError(data.error || "Failed to generate text.");
        }
      } else if (activeTab === "image") {
        // We need to check if the user has selected an API key via window.aistudio.hasSelectedApiKey()
        // But since this is a preview environment, we'll assume it's handled or we prompt them.
        // For gemini-3-pro-image-preview, users MUST select their own API key.
        if (typeof window !== 'undefined' && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
          await window.aistudio.openSelectKey();
        }
        
        // Re-initialize to ensure we have the selected key
        const aiWithUserKey = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        
        const response = await aiWithUserKey.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: imageSize as "1K" | "2K" | "4K"
            }
          },
        });
        
        let imageUrl = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
        
        if (imageUrl) {
          setResult(imageUrl);
        } else {
          setError("Failed to generate image.");
        }
      } else if (activeTab === "video") {
        if (typeof window !== 'undefined' && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
          await window.aistudio.openSelectKey();
        }
        
        const aiWithUserKey = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        
        let operation = await aiWithUserKey.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: aspectRatio
          }
        });
        
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await aiWithUserKey.operations.getVideosOperation({operation: operation});
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          setResult(downloadLink);
        } else {
          setError("Failed to generate video.");
        }
      } else if (activeTab === "animate") {
        if (typeof window !== 'undefined' && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
          await window.aistudio.openSelectKey();
        }
        
        const aiWithUserKey = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        
        const base64Data = uploadedImage?.split(',')[1];
        
        let operation = await aiWithUserKey.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt || "Animate this image smoothly",
          image: {
            imageBytes: base64Data || "",
            mimeType: uploadedImageMimeType || 'image/png',
          },
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
          }
        });
        
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await aiWithUserKey.operations.getVideosOperation({operation: operation});
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          setResult(downloadLink);
        } else {
          setError("Failed to animate image.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImageMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Create Content</h2>
        <p className="text-white/50">Generate high-quality posts, images, and videos for your social media.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
              setError(null);
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white text-black"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {(activeTab === "video" || activeTab === "animate") && userTier !== "tier-business" ? (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Lock className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Business Plan Required</h3>
              <p className="text-white/60 mb-6">Upgrade to the Business plan to create stunning Reels and TikToks using Veo AI video generation.</p>
              <Link href="/#pricing" className="bg-emerald-400 text-black px-6 py-2 rounded-full font-medium hover:bg-emerald-300 transition-colors">
                Upgrade Plan
              </Link>
            </div>
          ) : (
            <>
              {activeTab === "animate" && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/80">Upload Image to Animate</label>
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {uploadedImage ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadedImage} alt="Uploaded" className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/50">
                        <ImageIcon className="w-8 h-8" />
                        <span>Click or drag to upload</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white/80">
                  {activeTab === "text" ? "What do you want to post about?" : 
                   activeTab === "animate" ? "Optional: Describe how to animate it" : 
                   "Describe what you want to generate"}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={activeTab === "animate" ? "A subtle zoom in..." : "A futuristic city with flying cars at sunset..."}
                  className="w-full h-40 bg-[#111] border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>

              {/* Settings based on active tab */}
              {activeTab === "image" && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/80">Image Size</label>
                  <div className="flex gap-2">
                    {["1K", "2K", "4K"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setImageSize(size)}
                        className={clsx(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                          imageSize === size
                            ? "bg-white/10 border-white/30 text-white"
                            : "border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === "video" || activeTab === "animate") && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/80">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {["16:9", "9:16"].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={clsx(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                          aspectRatio === ratio
                            ? "bg-white/10 border-white/30 text-white"
                            : "border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {ratio === "16:9" ? "Landscape (16:9)" : "Portrait (9:16)"}
                      </button>
                    ))}
                  </div>
                  
                  {/* Platform Optimization Suggestions */}
                  {aspectRatio === "9:16" && (
                    <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4 mt-2">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-emerald-400 mb-1">Optimized for Reels & TikTok</h4>
                          <div className="text-xs text-emerald-400/80 leading-relaxed">
                            Vertical video is perfect for short-form content. To get the best results:
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                              <li>Keep the main subject centered to avoid UI overlap.</li>
                              <li>Use dynamic, fast-paced descriptions in your prompt.</li>
                              <li>Focus on a single, clear subject.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {aspectRatio === "16:9" && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-2">
                      <div className="flex items-start gap-3">
                        <VideoIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-400 mb-1">Optimized for YouTube & Facebook</h4>
                          <p className="text-xs text-blue-400/80 leading-relaxed">
                            Landscape video is ideal for longer, cinematic content.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt && activeTab !== "animate") || (activeTab === "animate" && !uploadedImage)}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating... (This may take a few minutes for video)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate {tabs.find(t => t.id === activeTab)?.name.split(" ")[1] || "Content"}
                  </>
                )}
              </button>
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Output Section */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
          {result ? (
            <div className="w-full h-full flex flex-col">
              {activeTab === "text" && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
                  <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-white">Your Business</p>
                      <p className="text-xs text-white/50">@yourbusiness</p>
                    </div>
                  </div>
                  <div className="p-4 whitespace-pre-wrap text-white/90 text-sm leading-relaxed">
                    {result}
                  </div>
                </div>
              )}
              {activeTab === "image" && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
                  <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-white">Your Business</p>
                      <p className="text-xs text-white/50">@yourbusiness</p>
                    </div>
                  </div>
                  <div className="relative w-full aspect-square bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result} alt="Generated" className="object-cover w-full h-full" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-white/50">Generated image preview</p>
                  </div>
                </div>
              )}
              {(activeTab === "video" || activeTab === "animate") && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
                  <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-white">Your Business</p>
                      <p className="text-xs text-white/50">@yourbusiness</p>
                    </div>
                  </div>
                  <div className="relative w-full aspect-video bg-black">
                    <video src={result} controls autoPlay loop className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-white/50">Generated video preview</p>
                  </div>
                </div>
              )}
              
              {/* Publishing UI */}
              <div className="mt-auto pt-6 border-t border-white/10 w-full">
                <h3 className="text-sm font-medium text-white mb-3">Publish to Social Media</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {platforms.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => !platform.comingSoon && togglePlatform(platform.id)}
                      disabled={platform.comingSoon}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                        platform.comingSoon
                          ? "bg-white/5 border-white/5 text-white/25 cursor-not-allowed"
                          : selectedPlatforms.includes(platform.id)
                          ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {platform.name}
                      {platform.comingSoon && (
                        <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/30">Soon</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Post (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                  />
                </div>
                
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || selectedPlatforms.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-400 text-black py-3 rounded-xl font-medium hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {scheduledDate ? "Scheduling..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      {scheduledDate ? "Schedule" : "Publish"} to {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'Platform' : 'Platforms'}
                    </>
                  )}
                </button>
                
                {publishResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {publishResults.map((res, idx) => (
                      <div key={idx} className={clsx(
                        "flex items-start gap-2 text-sm p-3 rounded-lg border",
                        res.status === 'success' 
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
                          : "text-red-400 bg-red-400/10 border-red-400/20"
                      )}>
                        {res.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span className="leading-tight">{res.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/30 space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-white/50" />
                  <p>AI is working its magic...</p>
                </div>
              ) : (
                <>
                  <Wand2 className="w-12 h-12 mx-auto opacity-50" />
                  <p>Your generated content will appear here</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

