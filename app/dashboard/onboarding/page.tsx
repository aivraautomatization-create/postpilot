"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Building2, Target, Briefcase, Zap } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = getSupabase();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    niche: "",
    offerings: "",
    targetAudience: "",
    toneOfVoice: "Professional yet approachable"
  });

  useEffect(() => {
    // If they already have a profile with onboarding completed, redirect to dashboard
    const checkOnboarding = async () => {
      const supabase = getSupabase();
      if (!supabase || !user) return;
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      if (profile?.onboarding_completed) {
        router.push('/dashboard');
      }
    };
    checkOnboarding();
  }, [router, user]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.companyName.trim().length > 0;
      case 2: return formData.niche.trim().length > 0;
      case 3: return formData.targetAudience.trim().length > 0;
      case 4: return true; // toneOfVoice has a default
      default: return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) {
      const fields: Record<number, string> = {
        1: "Company name is required",
        2: "Industry / niche is required",
        3: "Target audience is required",
      };
      setValidationError(fields[step] || null);
      return;
    }
    setValidationError(null);
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    if (!user || !supabase) return;
    setIsSaving(true);
    
    try {
      // Save to Supabase
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          company_name: formData.companyName,
          niche: formData.niche,
          offerings: formData.offerings,
          target_audience: formData.targetAudience,
          tone_of_voice: formData.toneOfVoice,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error saving profile:", error);
      }
    } catch (e) {
      console.error("Error saving profile:", e);
    }
    
    // Fallback/local cache for immediate UI updates
    localStorage.setItem('companyProfile', JSON.stringify(formData));
    setIsSaving(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-xl bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 relative z-10 shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 w-12 rounded-full transition-colors ${i <= step ? 'bg-white' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight mb-2">
            {step === 1 && "Let's set up your workspace"}
            {step === 2 && "What's your niche?"}
            {step === 3 && "Who is your audience?"}
            {step === 4 && "How should we sound?"}
          </h1>
          <p className="text-white/60">
            {step === 1 && "Tell us about your company so our AI can generate perfectly tailored content."}
            {step === 2 && "This helps the AI understand your industry context and competitors."}
            {step === 3 && "We'll optimize your content to resonate with these specific people."}
            {step === 4 && "Define your brand's personality for consistent messaging."}
          </p>
        </div>

        <div className="space-y-6 min-h-[200px]">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white" />
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-white" />
                  What do you offer? (Products/Services)
                </label>
                <textarea
                  value={formData.offerings}
                  onChange={(e) => setFormData({...formData, offerings: e.target.value})}
                  placeholder="e.g. B2B SaaS for HR management, payroll automation..."
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-white" />
                  Industry / Niche
                </label>
                <input
                  type="text"
                  value={formData.niche}
                  onChange={(e) => setFormData({...formData, niche: e.target.value})}
                  placeholder="e.g. B2B Software, Fitness Coaching, Real Estate..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-white" />
                  Target Audience
                </label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  placeholder="e.g. HR Managers at mid-sized tech companies who struggle with compliance..."
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  Tone of Voice
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Professional & Authoritative", "Casual & Friendly", "Humorous & Witty", "Inspirational & Bold"].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setFormData({...formData, toneOfVoice: tone})}
                      className={`p-4 rounded-xl border text-sm font-medium text-left transition-all ${
                        formData.toneOfVoice === tone 
                          ? 'bg-white/10 border-white text-white' 
                          : 'bg-black/50 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between pt-6 border-t border-white/10">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 text-sm font-medium text-white/60 hover:text-white disabled:opacity-0 transition-colors"
          >
            Back
          </button>
          
          {step < 4 ? (
            <div className="flex flex-col items-end gap-2">
              {validationError && (
                <p className="text-red-400 text-xs">{validationError}</p>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-white text-black backdrop-blur-md px-8 py-3 rounded-full text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-white text-black backdrop-blur-md px-8 py-3 rounded-full text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
