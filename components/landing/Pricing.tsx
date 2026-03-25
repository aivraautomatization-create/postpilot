"use client";

import { Check, Loader2, Crown, Zap, Building2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { scrollReveal } from "@/lib/motion";

type BillingCycle = "monthly" | "annual";

const tiers = [
  {
    name: "Starter",
    id: "tier-entry",
    priceMonthly: 19,
    priceAnnual: 15,
    dailyMonthly: "0.63",
    dailyAnnual: "0.50",
    coffeeLabel: "Less than your morning coffee",
    description: "Perfect if you\u2019re starting out and want to test AI-driven social without commitment.",
    badge: null,
    BadgeIcon: Zap,
    features: [
      "14-day free trial included",
      "1\u20132 social accounts",
      "15 AI posts/month",
      "AI image generation",
      "Basic AI-brain & templates",
      "Email support",
    ],
    hasTrial: true,
    mostPopular: false,
    cta: "Start 14-day free trial",
    gradient: false,
  },
  {
    name: "Creator",
    id: "tier-pro",
    priceMonthly: 49,
    priceAnnual: 39,
    dailyMonthly: "1.63",
    dailyAnnual: "1.28",
    coffeeLabel: "Cheaper than a latte",
    description: "Best for coaches, restaurants, tours, and small agencies who want AI-driven content at scale.",
    badge: "Most Popular \u00b7 73% choose this",
    BadgeIcon: Crown,
    features: [
      "14-day free trial included",
      "3\u20135 social accounts",
      "60 posts + 10 Reels/TikToks/month",
      "Full AI-brain + viral strategy engine",
      "Video-first workflows",
      "Niche templates & playbooks",
      "Priority support",
    ],
    hasTrial: true,
    mostPopular: true,
    cta: "Start 14-day free trial",
    gradient: true,
  },
  {
    name: "Pro",
    id: "tier-business",
    priceMonthly: 97,
    priceAnnual: 78,
    dailyMonthly: "3.23",
    dailyAnnual: "2.56",
    coffeeLabel: "One fancy coffee per day",
    description: "Built for hotels, real-estate, and growing SMEs that need multiple accounts and full automation.",
    badge: "Lock in founder pricing",
    BadgeIcon: Building2,
    features: [
      "14-day free trial included",
      "5\u201310 social accounts",
      "Unlimited posts + 50 Reels/TikToks/month",
      "Multi-brand support",
      "Bulk video repurposing",
      "Detailed analytics & reporting",
      "Dedicated success manager",
    ],
    hasTrial: true,
    mostPopular: false,
    cta: "Start 14-day free trial",
    gradient: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const { user } = useAuth();

  const handleCheckout = async (tierId: string) => {
    if (!user) {
      window.location.href = `/auth/signup?plan=${tierId}&billing=${billing}`;
      return;
    }
    try {
      setLoadingTier(tierId);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, billingCycle: billing }),
      });
      const data = await response.json();
      if (data.customerId) {
        localStorage.setItem("stripeCustomerId", data.customerId);
        localStorage.setItem("subscriptionTier", tierId);
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingTier(null);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const, delay: i * 0.12 },
    }),
  };

  return (
    <div id="pricing" className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* ROI anchor — loss aversion framing */}
        <motion.div {...scrollReveal} className="mx-auto max-w-3xl text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 mb-6 flex-wrap justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Most AI-social tools start at <span className="font-semibold text-white">~$99/mo</span>. Ours starts at <span className="font-semibold text-white">$19/mo</span> with AI-video, niche playbooks, and viral hooks included
          </div>

          <h2 className="text-4xl font-light tracking-tight text-white sm:text-5xl">
            Flexible plans for every niche,
            <br />
            <span className="text-white/50">starting at $19.</span>
          </h2>

          {/* The one-line loss aversion hook */}
          <p className="mt-5 text-base text-white/60 leading-relaxed max-w-xl mx-auto">
            Start your 14-day free trial — no credit card required. Connect your accounts, fill your brand info, and get your first 30-day AI-generated content calendar in minutes.
          </p>
        </motion.div>

        {/* Enterprise anchor — shown above tiers to make prices feel small */}
        <motion.div {...scrollReveal} className="mx-auto max-w-2xl mb-12">
          <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 backdrop-blur-sm">
            <div>
              <p className="text-sm font-medium text-white">Enterprise</p>
              <p className="text-xs text-white/40 mt-0.5">Full customization · SLA · Dedicated support · White label</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-light text-white">$500+<span className="text-white/40">/mo</span></span>
              <a href="mailto:hello@puls.work" className="text-xs text-white/60 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                Contact sales
              </a>
            </div>
          </div>
        </motion.div>

        {/* Billing toggle */}
        <motion.div {...scrollReveal} className="flex items-center justify-center gap-4 mb-12">
          <span className={classNames(billing === "monthly" ? "text-white" : "text-white/40", "text-sm font-medium transition-colors duration-200")}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
            className={classNames(
              "relative inline-flex h-7 w-14 items-center rounded-full border transition-all duration-300",
              billing === "annual" ? "bg-emerald-500/20 border-emerald-500/30" : "bg-white/[0.06] border-white/[0.1]"
            )}
            aria-label="Toggle billing cycle"
          >
            <span className={classNames(
              "inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-300",
              billing === "annual" ? "translate-x-8" : "translate-x-1"
            )} />
          </button>
          <span className={classNames(billing === "annual" ? "text-white" : "text-white/40", "text-sm font-medium transition-colors duration-200 flex items-center gap-2")}>
            Annual
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs text-emerald-400 font-semibold">
              Save 20%
            </span>
          </span>
        </motion.div>

        {/* Pricing cards */}
        <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-y-8 sm:mt-4 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-6 lg:gap-y-0 lg:items-center">
          {tiers.map((tier, i) => {
            const { BadgeIcon } = tier;
            const displayPrice = billing === "annual" ? tier.priceAnnual : tier.priceMonthly;
            const dailyCost = billing === "annual" ? tier.dailyAnnual : tier.dailyMonthly;

            return (
              <motion.div
                key={tier.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants}
                className={classNames(
                  tier.mostPopular
                    ? "-translate-y-3 bg-white/[0.06] border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.12),0_0_0_1px_rgba(168,85,247,0.08)]"
                    : "bg-white/[0.02] border-white/[0.08]",
                  "border rounded-3xl p-8 xl:p-10 relative backdrop-blur-xl transition-all duration-300 hover:border-white/25"
                )}
              >
                {tier.mostPopular && (
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/[0.08] via-transparent to-transparent pointer-events-none" />
                )}

                {/* Badge */}
                {tier.badge && (
                  <div className="absolute top-0 right-6 -translate-y-1/2">
                    <span className={classNames(
                      tier.mostPopular
                        ? "bg-white text-black"
                        : "bg-white/[0.08] text-white/70 border border-white/[0.12]",
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-lg"
                    )}>
                      <BadgeIcon className="w-3 h-3" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Name */}
                <h3 id={tier.id} className="text-xl font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="mt-1.5 text-sm text-white/50">{tier.description}</p>

                {/* Price */}
                <div className="mt-6">
                  <div className="flex items-baseline gap-x-1.5">
                    <span className="text-5xl font-light tracking-tight text-white">${displayPrice}</span>
                    <span className="text-sm font-medium text-white/50">/mo</span>
                  </div>

                  {/* Daily framing — mental accounting */}
                  <p className="mt-1.5 text-xs text-white/35">
                    ${dailyCost}/day · {tier.coffeeLabel}
                  </p>

                  {billing === "annual" ? (
                    <p className="mt-1 text-xs text-emerald-400 font-medium">
                      Saving 20% — billed annually
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-white/25">
                      ${tier.priceAnnual}/mo billed annually
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(tier.id)}
                  aria-describedby={tier.id}
                  disabled={loadingTier === tier.id}
                  className={classNames(
                    tier.mostPopular
                      ? "bg-white text-black hover:shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                      : "bg-white/[0.08] text-white hover:bg-white/[0.13] border border-white/[0.1]",
                    "mt-7 w-full flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 relative z-10"
                  )}
                >
                  {loadingTier === tier.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                  ) : (
                    tier.cta
                  )}
                </button>

                {/* Features */}
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-white/55">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check
                        className={classNames(
                          tier.mostPopular ? "text-emerald-400" : "text-white/40",
                          "h-5 w-5 flex-none mt-0.5"
                        )}
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade path hint */}
        <motion.div {...scrollReveal} className="mt-10 flex items-center justify-center gap-6 text-xs text-white/25">
          <span>Starter <ArrowRight className="inline w-3 h-3 mx-1" /> Creator</span>
          <span className="w-px h-4 bg-white/10" />
          <span>Creator <ArrowRight className="inline w-3 h-3 mx-1" /> Pro</span>
          <span className="w-px h-4 bg-white/10" />
          <span>Pro <ArrowRight className="inline w-3 h-3 mx-1" /> Enterprise</span>
        </motion.div>

        {/* Footer */}
        <motion.p {...scrollReveal} className="mt-6 text-center text-sm text-white/25">
          Cancel anytime · No setup fees · 30-day money-back guarantee
        </motion.p>
      </div>
    </div>
  );
}
