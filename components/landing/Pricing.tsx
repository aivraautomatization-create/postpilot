"use client";

import { Check, Command, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const tiers = [
  {
    name: "Entry",
    id: "tier-entry",
    priceMonthly: "$69",
    description: "Automate your weekly presence and save hours of manual work.",
    features: [
      "28 posts per month (7/week)",
      "Auto-post to Instagram, Facebook, LinkedIn, TikTok",
      "AI text & image generation",
      "Basic analytics",
      "Additional credits: $2.50/post"
    ],
    hasTrial: false,
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    priceMonthly: "$99",
    description: "Scale your growth with deeper insights and video content.",
    features: [
      "7-day free trial included",
      "50 posts per month",
      "5 Reels/TikToks per month",
      "Unlimited AI video refreshes",
      "Auto-post to all platforms",
      "Advanced AI Analyst features",
      "Additional credits: $2.00/post"
    ],
    hasTrial: true,
    mostPopular: true,
  },
  {
    name: "Business",
    id: "tier-business",
    priceMonthly: "$199",
    description: "Dominate your market with maximum volume and priority AI.",
    features: [
      "100 posts & 50 Reels/TikToks per month",
      "Priority AI video generation",
      "Auto-post to all platforms",
      "Best quality priority generation",
      "Early access to new features",
      "Additional credits: $1.80/post"
    ],
    hasTrial: false,
    mostPopular: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user } = useAuth();

  const handleCheckout = async (tierId: string) => {
    if (!user) {
      // Redirect to signup with plan info if not logged in
      window.location.href = `/auth/signup?plan=${tierId}`;
      return;
    }

    try {
      setLoadingTier(tierId);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await response.json();

      if (data.customerId) {
        // Save the customer ID to local storage so we can use it for the billing portal
        localStorage.setItem('stripeCustomerId', data.customerId);
        localStorage.setItem('subscriptionTier', tierId);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div id="pricing" className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-medium leading-7 text-white">Pricing</h2>
          <p className="mt-2 text-4xl font-light tracking-tight text-white sm:text-5xl">
            Choose your autopilot plan
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-white/60">
          You can always buy more credits if you reach your monthly limit. Never stop growing and innovating with premium content.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
          {tiers.map((tier) => (
              <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? "bg-white/[0.04] border-white/[0.2] shadow-glass-card shadow-purple-500/10" : "bg-white/[0.02] border-white/[0.08]",
                "border rounded-3xl p-8 xl:p-10 relative backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/50 transition-colors duration-500"
              )}
            >
              {tier.mostPopular && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50/10 via-transparent to-white/5 pointer-events-none" />
              )}
              {tier.mostPopular && (
                <div className="absolute top-0 right-6 -translate-y-1/2 shadow-[0_0_20px_rgba(255,255,255,0.15)] rounded-full">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white text-black backdrop-blur-md px-3 py-1 text-sm font-semibold leading-5  shadow-lg">
                    <Command className="w-4 h-4 text-white" />
                    Most popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={classNames(
                    tier.mostPopular ? "text-white" : "text-white",
                    "text-lg font-medium leading-8"
                  )}
                >
                  {tier.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/60">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-light tracking-tight text-white">{tier.priceMonthly}</span>
                <span className="text-sm font-medium leading-6 text-white/60">/month</span>
              </p>
              <button
                onClick={() => handleCheckout(tier.id)}
                aria-describedby={tier.id}
                disabled={loadingTier === tier.id}
                className={classNames(
                  tier.mostPopular
                    ? "bg-white text-black backdrop-blur-md hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] border-none"
                    : "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.1]",
                  "mt-6 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 z-10 relative"
                )}
              >
                {loadingTier === tier.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  tier.hasTrial ? "Start 7-day free trial" : "Get started"
                )}
              </button>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-white/60">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-white" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
