"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Users, UserPlus, ArrowRight, Loader2 } from "lucide-react";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  bonusPosts: number;
  stats: {
    totalReferrals: number;
    signedUp: number;
    converted: number;
  };
  referrals: Array<{
    id: string;
    status: string;
    referred_email: string | null;
    created_at: string;
  }>;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-white/50 py-20">
        Failed to load referral data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-light text-white mb-1">Refer a Friend</h2>
        <p className="text-white/50 text-sm">
          Give a friend 14 days of Pro free. Get 10 extra posts when they sign up.
        </p>
      </motion.div>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Your referral link</h3>
            <p className="text-xs text-white/40">Share this with friends and colleagues</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 truncate font-mono">
            {data.referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Friends invited", value: data.stats.totalReferrals, icon: Users },
          { label: "Signed up", value: data.stats.signedUp, icon: UserPlus },
          { label: "Bonus posts earned", value: data.bonusPosts, icon: Gift },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50 font-medium">{stat.label}</span>
            </div>
            <p className="text-3xl font-light text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
      >
        <h3 className="text-sm font-medium text-white mb-4">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Share your link", desc: "Send your unique referral link to friends and colleagues" },
            { step: "2", title: "They sign up", desc: "Your friend gets 14 days of Pro free — no credit card needed" },
            { step: "3", title: "You get rewarded", desc: "Earn 10 extra posts added to your monthly limit" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-white">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent referrals */}
      {data.referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <h3 className="text-sm font-medium text-white mb-4">Recent referrals</h3>
          <div className="space-y-3">
            {data.referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                <span className="text-sm text-white/70">{ref.referred_email || "Pending"}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  ref.status === "converted" ? "bg-green-500/10 text-green-400" :
                  ref.status === "signed_up" ? "bg-blue-500/10 text-blue-400" :
                  "bg-white/[0.05] text-white/40"
                }`}>
                  {ref.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
