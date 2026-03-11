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
    <div id="features" className="py-24 sm:py-32 relative z-10 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-medium leading-7 text-emerald-400">Innovative & Excellent</h2>
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
              <div key={step.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-medium leading-7 text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-400/10">
                    <step.icon className="h-6 w-6 text-emerald-400" aria-hidden="true" />
                  </div>
                  {step.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/60">
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
