import OnboardingForm from "@/components/ui/multistep-form-demo";

export default function OnboardingPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 h-full min-h-[80vh] flex flex-col items-center justify-center p-8 bg-black/40 border border-white/10 rounded-3xl mt-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light tracking-tight text-white">Let's build your AI engine</h1>
        <p className="text-white/50 mt-2 text-lg">Help us understand your goals to personalize Postpilot</p>
      </div>
      <div className="w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
