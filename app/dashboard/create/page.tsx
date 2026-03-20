"use client";

import { useState, useEffect, Suspense } from "react";
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
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { validateFile, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/upload-validation";
import { contentTemplates } from "@/lib/content-templates";
import ContentScorePanel from "@/components/dashboard/ContentScorePanel";

const tabs = [
  { id: "text", name: "Text Content", icon: Type },
  { id: "image", name: "Generate Image", icon: ImageIcon },
  { id: "video", name: "Generate Video", icon: VideoIcon },
  { id: "animate", name: "Animate Image", icon: Wand2 },
];

function CreateContentInner() {
  const { profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);

  // Enhanced AI pipeline state
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [engagementScore, setEngagementScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendData, setTrendData] = useState<string | null>(null);
  const [showEnhanced, setShowEnhanced] = useState(false);

  // Image specific state
  const [imageSize, setImageSize] = useState("1K");

  // Video & Platform specific state
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [selectedPlatform, setSelectedPlatform] = useState("tiktok");

  // Animate specific state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null);

  // Video error state
  const [videoError, setVideoError] = useState(false);

  // Publishing specific state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>("");

  // Strategy state
  const [strategy, setStrategy] = useState<string | null>(null);
  const [strategyEnabled, setStrategyEnabled] = useState(true);

  // Reset tab-specific state when switching tabs
  useEffect(() => {
    setResult(null);
    setError(null);
    setUploadedImage(null);
    setUploadedImageMimeType(null);
    setVideoError(false);
    setEnhancedResult(null);
    setEngagementScore(null);
    setSuggestions([]);
    setShowEnhanced(false);
    setPublishResults([]);
  }, [activeTab]);

  const contentIdeas = [
    {
      id: "workflow",
      label: "Workflow Tear-Down",
      prompt: "The 'Unsolicited Workflow Tear-Down' (Case Study Reverse-Engineering) Don't just talk about AI; show the exact financial bleed of manual work. Take a recognizable business process (e.g., 'How a 50-person logistics firm handles invoicing') and visually map out the manual steps vs. the AIVIRA automated workflow."
    },
    {
      id: "mistakes",
      label: "Mistakes Series",
      prompt: "The '$100k Mistakes Series' - Reveal 3 common industry traps that drain revenue without owners knowing. Each mistake should have a quick visual proof and a 'Viral Fix' that leverages our offerings."
    },
    {
      id: "bts",
      label: "Chaos to Clarity",
      prompt: "Behind the Scenes: Chaos to Clarity. Start with a messy, high-stress visual of a busy office. Transition into a calm, high-tech interface where AI handles the load. Focus on the emotional relief of the business owner."
    }
  ];

  useEffect(() => {
    if (profile?.latest_strategy) {
      setStrategy(profile.latest_strategy);
    }
  }, [profile]);

  // Template pre-fill from search params
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = contentTemplates.find(t => t.id === templateId);
      if (template) {
        setPrompt(template.content);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedPlatform === "tiktok" || selectedPlatform === "reel") {
      setAspectRatio("9:16");
    } else if (selectedPlatform === "youtube") {
      setAspectRatio("16:9");
    } else if (selectedPlatform === "facebook") {
      setAspectRatio("1:1");
    }
  }, [selectedPlatform]);

  const userTier = profile?.subscription_tier || 'tier-entry';
  const isCheckingTier = authLoading;

  const hasVideoAccess = userTier === 'tier-pro' || userTier === 'tier-business';
  const showVideoLock = (activeTab === "video" || activeTab === "animate") && !hasVideoAccess;

  const platforms = [
    { id: "twitter", name: "X (Twitter)", comingSoon: false },
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

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: text || "Server error" }; }
  };

  const handlePublish = async () => {
    if (!result || selectedPlatforms.length === 0) return;

    setIsPublishing(true);
    setPublishResults([]);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: activeTab === 'text' ? (showEnhanced && enhancedResult ? enhancedResult : result) : prompt,
          imageUrl: activeTab === 'image' ? result : null,
          videoUrl: (activeTab === 'video' || activeTab === 'animate') ? result : null,
          platforms: selectedPlatforms,
          scheduledDate: scheduledDate || null
        })
      });

      const data = await safeJson(response);

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
    setEnhancedResult(null);
    setEngagementScore(null);
    setSuggestions([]);
    setTrendData(null);
    setShowEnhanced(false);
    setError(null);
    setVideoError(false);

    try {
      if (activeTab === "text") {
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
            },
            strategy: strategyEnabled && strategy ? strategy : null
          })
        });

        const data = await safeJson(response);

        if (response.ok) {
          setResult(data.content);
          // Enhanced pipeline results
          if (data.enhanced) setEnhancedResult(data.enhanced);
          if (data.engagementScore) setEngagementScore(data.engagementScore);
          if (data.suggestions) setSuggestions(data.suggestions);
          if (data.trends) setTrendData(data.trends);
        } else {
          setError(data.error || "Failed to generate text.");
        }
      } else if (activeTab === "image") {
        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            imageSize,
            niche: profile?.niche,
            platform: selectedPlatforms?.[0] || 'instagram'
          })
        });

        const data = await safeJson(response);

        if (response.ok) {
          setResult(data.imageUrl);
        } else {
          if (data.code === 'QUOTA_EXHAUSTED') {
            setError(
              <div className="flex flex-col gap-2">
                <p>You&apos;ve reached the Generation Quota for this API key.</p>
                <a
                  href="https://aistudio.google.com/app/plan_and_billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-white/80"
                >
                  Check your Google AI Studio plan & billing
                </a>
              </div>
            );
          } else {
            setError(data.error || "Failed to generate image.");
          }
        }
      } else if (activeTab === "video") {
        const response = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            aspectRatio,
            strategy: strategyEnabled && strategy ? strategy : null,
            niche: profile?.niche,
            platform: selectedPlatform || 'tiktok'
          })
        });

        const data = await safeJson(response);

        if (response.ok) {
          setResult(data.videoUrl);
        } else {
          if (data.code === 'QUOTA_EXHAUSTED') {
            setError(
              <div className="flex flex-col gap-2">
                <p>You&apos;ve reached the Generation Quota for this API key.</p>
                <a
                  href="https://aistudio.google.com/app/plan_and_billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-white/80"
                >
                  Check your Google AI Studio plan & billing
                </a>
              </div>
            );
          } else {
            setError(data.error || "Failed to generate video.");
          }
        }
      } else if (activeTab === "animate") {
        const base64Data = uploadedImage?.split(',')[1];

        const response = await fetch('/api/generate/animate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64Data,
            imageMimeType: uploadedImageMimeType,
            prompt: prompt || undefined,
            aspectRatio
          })
        });

        const data = await safeJson(response);

        if (response.ok) {
          setResult(data.videoUrl);
        } else {
          if (data.code === 'QUOTA_EXHAUSTED') {
            setError(
              <div className="flex flex-col gap-2">
                <p>You&apos;ve reached the Generation Quota for this API key.</p>
                <a
                  href="https://aistudio.google.com/app/plan_and_billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-white/80"
                >
                  Check your Google AI Studio plan & billing
                </a>
              </div>
            );
          } else {
            setError(data.error || "Failed to animate image.");
          }
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
    if (!file) return;

    const validation = validateFile(file, { maxSize: MAX_IMAGE_SIZE, allowedTypes: ALLOWED_IMAGE_TYPES });
    if (!validation.valid) {
      setError(validation.error || "Invalid file.");
      return;
    }

    setError(null);
    setUploadedImageMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Create Content</h2>
        <p className="text-white/50">Generate high-quality posts, images, and videos for your social media.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-white/10 pb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResult(null);
                setEnhancedResult(null);
                setEngagementScore(null);
                setSuggestions([]);
                setTrendData(null);
                setShowEnhanced(false);
                setError(null);
                setVideoError(false);
              }}
              className={clsx(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                activeTab === tab.id
                  ? "bg-white/[0.08] text-white border-white/[0.12] shadow-glass-card"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04] border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Indicator */}
      {strategy && (
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/70">
              {strategyEnabled ? "Viral strategy applied to generation" : "Viral strategy paused"}
            </span>
          </div>
          <button
            onClick={() => setStrategyEnabled(!strategyEnabled)}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              strategyEnabled ? "bg-white/30" : "bg-white/10"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                strategyEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {isCheckingTier ? (
            <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
              <p className="text-white/50">Verifying your plan access...</p>
            </div>
          ) : showVideoLock ? (
            <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Lock className="w-12 h-12 text-white mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Pro or Business Plan Required</h3>
              <p className="text-white/60 mb-6">Upgrade to the Pro or Business plan to create stunning Reels and TikToks using Veo AI video generation.</p>
              <Link href="/#pricing" className="bg-white text-black backdrop-blur-md px-6 py-2.5 rounded-full font-medium hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all">
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
                        <span className="text-xs text-white/30">PNG, JPG, WebP, GIF — Max 10MB</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inspiration Section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white/80">Viral Inspiration</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {contentIdeas.map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => setPrompt(idea.prompt)}
                      className="px-3 py-2 text-left text-xs bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all text-white/70 hover:text-white"
                    >
                      <Sparkles className="w-3 h-3 mb-1 text-white/50" />
                      <div className="font-medium text-white">{idea.label}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                  className="w-full h-40 bg-white/[0.02] backdrop-blur-md border border-white/[0.08] hover:border-white/30 transition-colors duration-500 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-none"
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
                            ? "bg-white/[0.08] border-white/[0.2] text-white"
                            : "border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.04]"
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
                  <label className="block text-sm font-medium text-white/80">Platform Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "tiktok", name: "TikTok / Reel", ratio: "9:16", icon: "📱" },
                      { id: "youtube", name: "YouTube", ratio: "16:9", icon: "📺" },
                      { id: "facebook", name: "FB / IG Feed", ratio: "1:1", icon: "👥" }
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={clsx(
                          "px-4 py-3 rounded-xl text-xs font-medium border transition-all flex flex-col items-center gap-1",
                          selectedPlatform === platform.id
                            ? "bg-white/10 border-white/30 text-white shadow-lg"
                            : "border-white/10 text-white/40 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span className="text-lg">{platform.icon}</span>
                        {platform.name}
                        <span className="opacity-50 text-[10px]">{platform.ratio}</span>
                      </button>
                    ))}
                  </div>

                  {selectedPlatform === "tiktok" && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-white/70 mt-1" />
                        <div>
                          <p className="text-xs font-medium text-white">Optimal for Retention</p>
                          <p className="text-[10px] text-white/50 leading-relaxed">Vertical layout captures 100% screen real estate. Hook within 0.8s will be applied.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt && activeTab !== "animate") || (activeTab === "animate" && !uploadedImage)}
                className="w-full flex items-center justify-center gap-2 bg-white text-black backdrop-blur-md shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] py-4 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-outfit"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
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
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
          {result ? (
            <div className="w-full h-full flex flex-col">
              {activeTab === "text" && (
                <>
                  {/* Enhanced toggle */}
                  {enhancedResult && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                        <button
                          onClick={() => setShowEnhanced(false)}
                          className={clsx(
                            "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                            !showEnhanced ? "bg-white/10 text-white" : "text-white/50"
                          )}
                        >
                          Original
                        </button>
                        <button
                          onClick={() => setShowEnhanced(true)}
                          className={clsx(
                            "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                            showEnhanced ? "bg-white/10 text-white" : "text-white/50"
                          )}
                        >
                          Enhanced
                        </button>
                      </div>
                      {engagementScore && (
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          engagementScore >= 80 ? "bg-green-500/20 text-green-400" :
                          engagementScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          Score: {engagementScore}/100
                        </span>
                      )}
                    </div>
                  )}

                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4">
                    <div className="p-4 flex items-center gap-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white/80 to-white/60" />
                      <div>
                        <p className="text-sm font-medium text-white">Your Business</p>
                        <p className="text-xs text-white/50">@yourbusiness</p>
                      </div>
                    </div>
                    <div className="p-4 whitespace-pre-wrap text-white/90 text-sm leading-relaxed">
                      {showEnhanced && enhancedResult ? enhancedResult : result}
                    </div>
                  </div>

                  {/* Suggestions panel */}
                  {suggestions.length > 0 && (
                    <details className="mb-4">
                      <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 transition-colors">
                        AI Suggestions ({suggestions.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {suggestions.map((s, i) => (
                          <li key={i} className="text-xs text-white/60 pl-3 border-l border-white/10">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Trends disclosure */}
                  {trendData && (
                    <details className="mb-4">
                      <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 transition-colors">
                        Trends Used
                      </summary>
                      <p className="mt-2 text-xs text-white/50 bg-white/5 rounded-lg p-3">
                        {trendData}
                      </p>
                    </details>
                  )}

                  {/* Content Score Panel */}
                  {engagementScore !== null && (
                    <ContentScorePanel score={engagementScore} suggestions={suggestions} />
                  )}
                </>
              )}
              {activeTab === "image" && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
                  <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white/80 to-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">Your Business</p>
                      <p className="text-xs text-white/50">@yourbusiness</p>
                    </div>
                  </div>
                  <div className="relative w-full aspect-square bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result}
                      alt="Generated"
                      className="object-cover w-full h-full"
                      onError={() => setError("Failed to load generated image. Please try again.")}
                    />
                  </div>
                </div>
              )}
              {(activeTab === "video" || activeTab === "animate") && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
                  <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white/80 to-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">Your Business</p>
                      <p className="text-xs text-white/50">@yourbusiness</p>
                    </div>
                  </div>
                  <div className={clsx(
                    "relative w-full bg-black flex items-center justify-center transition-all duration-500 overflow-hidden",
                    aspectRatio === "9:16" ? "aspect-[9/16] max-h-[500px]" :
                    aspectRatio === "16:9" ? "aspect-video" :
                    "aspect-square"
                  )}>
                    {videoError ? (
                      <div className="flex flex-col items-center gap-3 text-white/50 p-6 text-center">
                        <AlertCircle className="w-10 h-10 text-red-400/60" />
                        <p className="text-sm">Video unavailable or expired.</p>
                        <button
                          onClick={() => {
                            setVideoError(false);
                            handleGenerate();
                          }}
                          className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regenerate
                        </button>
                      </div>
                    ) : (
                      <video
                        key={result}
                        src={result}
                        controls
                        autoPlay
                        loop
                        playsInline
                        muted
                        preload="auto"
                        className="w-full h-full object-contain"
                        onError={() => setVideoError(true)}
                      />
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-white/10">
                    <p className="text-xs text-white/50">Preview ({aspectRatio})</p>
                    <div className="flex items-center gap-4">
                      <a
                        href={result}
                        download="postpilot-video.mp4"
                        className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        Download Video
                      </a>
                    </div>
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
                      onClick={() => togglePlatform(platform.id)}
                      disabled={platform.comingSoon}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                        platform.comingSoon
                          ? "bg-white/5 border-white/5 text-white/25 cursor-not-allowed"
                          : selectedPlatforms.includes(platform.id)
                          ? "bg-white/15 border-white/50 text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>

                {/* Publish Results */}
                {publishResults.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {publishResults.map((r: any, i: number) => (
                      <div
                        key={i}
                        className={clsx(
                          "flex items-center gap-2 text-xs p-2 rounded-lg",
                          r.status === "success"
                            ? "bg-green-500/10 text-green-400"
                            : r.status === "scheduled"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-red-500/10 text-red-400"
                        )}
                      >
                        {r.status === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{r.platform}</span>: {r.message}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Post
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  />
                </div>

                <button
                  onClick={handlePublish}
                  disabled={isPublishing || selectedPlatforms.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium"
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  {isPublishing ? "Processing..." : "Publish Content"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/30 space-y-4">
              <Wand2 className="w-12 h-12 mx-auto opacity-50" />
              <p>Your generated content will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateContent() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}>
      <CreateContentInner />
    </Suspense>
  );
}
