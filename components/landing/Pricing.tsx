"use client";

import { Check, Command, Loader2 } from "lucide-react";
import { useState } from "react";

const tiers = [
  {
    name: "Entry",
    id: "tier-entry",
    priceMonthly: "$69",
    description: "Automate your weekly presence and save hours of manual work.",
    features: [
      "7-day free trial",
      "28 posts per month (7/week)",
      "Auto-post to Instagram, Facebook, LinkedIn, TikTok",
      "AI text & image generation",
      "Basic analytics",
      "Additional credits: $2.50/post"
    ],
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    priceMonthly: "$99",
    description: "Scale your growth with deeper insights and video content.",
    features: [
      "7-day free trial",
      "50 posts per month",
      "Auto-post to all platforms",
      "AI video generation",
      "Advanced AI Analyst features",
      "Additional credits: $2.00/post"
    ],
    mostPopular: true,
  },
  {
    name: "Business",
    id: "tier-business",
    priceMonthly: "$199",
    description: "Dominate your market with maximum volume and priority AI.",
    features: [
      "7-day free trial",
      "100 posts & videos per month",
      "Auto-post to all platforms",
      "Best quality priority generation",
      "Early access to new features",
      "Additional credits: $1.80/post"
    ],
    mostPopular: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (tierId: string) => {
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
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Checkout error:', error);
      window.location.href = '/auth/login';
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div id="pricing" className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-medium leading-7 text-emerald-400">Pricing</h2>
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
                tier.mostPopular ? "bg-white/5 ring-2 ring-emerald-400" : "ring-1 ring-white/10",
                "rounded-3xl p-8 xl:p-10 relative backdrop-blur-sm"
              )}
            >
              {tier.mostPopular && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-sm font-medium leading-5 text-black">
                    <Command className="w-4 h-4" />
                    Most popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={classNames(
                    tier.mostPopular ? "text-emerald-400" : "text-white",
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
                    ? "bg-emerald-400 text-black hover:bg-emerald-300"
                    : "bg-white/10 text-white hover:bg-white/20",
                  "mt-6 w-full flex items-center justify-center gap-2 rounded-md py-2 px-3 text-center text-sm font-medium leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loadingTier === tier.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Start 7-day free trial"
                )}
              </button>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-white/60">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-emerald-400" aria-hidden="true" />
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
