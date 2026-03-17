import { Bot, Zap, Share2 } from "lucide-react";

const steps = [
  {
    name: "1. AI Generation",
    description: "Our advanced AI models generate high-quality text, images, and videos tailored to your brand voice.",
    icon: Bot,
  },
  {
    name: "2. Smart Scheduling",
    description: "We analyze your audience to determine the best times to post for maximum engagement.",
    icon: Zap,
  },
  {
    name: "3. Auto-Publishing",
    description: "Your content is automatically published across all of your social media platforms. Connect your accounts and let the system maximize your reach.",
    icon: Share2,
  },
];

export default function HowItWorks() {
  return (
    <div id="features" className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-medium leading-7 text-white">Innovative & Excellent</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Everything you need for massive ROI
          </p>
          <p className="mt-6 text-lg leading-8 text-white/60">
            Stop wasting hours and burning budget on marketing agencies. Let our premium AI handle the heavy lifting, delivering excellent content while you focus on scaling your business.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.name} className="flex flex-col bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl p-8 rounded-3xl hover:border-white/30 transition-colors duration-500 transition-all duration-300 hover:shadow-glass-card group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-sky-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <dt className="flex items-center gap-x-3 text-lg font-medium leading-7 text-white relative z-10">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:bg-gradient-to-br group-hover:from-blue-50/20 group-hover:to-sky-300/20 transition-all duration-300">
                    <step.icon className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                  </div>
                  {step.name}
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-white/60 relative z-10">
                  <p className="flex-auto">{step.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
