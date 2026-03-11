"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ExternalLink,
  Trash2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { getPlanName, getUsageLimit } from "@/lib/plan-limits";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const supabase = getSupabase();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isManagingSub, setIsManagingSub] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [niche, setNiche] = useState("");
  const [offerings, setOfferings] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!supabase || !user) return;

      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || user?.user_metadata?.full_name || "");
        setCompanyName(profileData.company_name || "");
        setNiche(profileData.niche || "");
        setOfferings(profileData.offerings || "");
        setTargetAudience(profileData.target_audience || "");
        setToneOfVoice(profileData.tone_of_voice || "");
      }

      // Fetch usage for current month (table may not exist yet)
      try {
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const { data: usageData } = await (supabase as any)
          .from("usage")
          .select("*")
          .eq("user_id", user.id)
          .eq("period", period)
          .single();
        setUsage(usageData);
      } catch {
        // usage table may not exist yet
      }
      setLoading(false);
    }

    fetchData();
  }, [supabase, user]);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    setSaved(false);

    await (supabase as any)
      .from("profiles")
      .update({
        company_name: companyName,
        niche,
        offerings,
        target_audience: targetAudience,
        tone_of_voice: toneOfVoice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Update display name in auth metadata
    await supabase.auth.updateUser({ data: { full_name: fullName } });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleManageSubscription = async () => {
    try {
      setIsManagingSub(true);
      const customerId = profile?.stripe_customer_id;
      if (!customerId) {
        window.location.href = "/#pricing";
        return;
      }

      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to open subscription portal.");
    } finally {
      setIsManagingSub(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (response.ok) {
        await signOut();
        router.push("/");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete account");
      }
    } catch {
      alert("An error occurred while deleting your account.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  const currentUsage = usage?.posts_count || 0;
  const limit = getUsageLimit(profile?.subscription_tier);
  const usagePercent = Math.min((currentUsage / limit) * 100, 100);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Profile Information */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-black/50 border border-white/5 rounded-xl py-2.5 px-4 text-white/40 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Industry / Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Offerings</label>
            <textarea
              value={offerings}
              onChange={(e) => setOfferings(e.target.value)}
              rows={2}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Target Audience</label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              rows={2}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Tone of Voice</label>
            <input
              type="text"
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-white text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Subscription & Plan */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Subscription & Plan</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{getPlanName(profile?.subscription_tier)} Plan</p>
              <p className="text-sm text-white/40 capitalize mt-1">
                Status: {profile?.plan_status || profile?.subscription_status || "trialing"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                (profile?.plan_status || profile?.subscription_status) === "active"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : (profile?.plan_status || profile?.subscription_status) === "trialing"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {(profile?.plan_status || profile?.subscription_status) === "active" ? "Active" : (profile?.plan_status || profile?.subscription_status) === "trialing" ? "Trial" : "Inactive"}
            </span>
          </div>

          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/60">Monthly Usage</p>
              <p className="text-sm text-white/60">
                {currentUsage} / {limit} posts
              </p>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleManageSubscription}
              disabled={isManagingSub}
              className="flex items-center gap-2 bg-white/10 text-white py-2.5 px-4 rounded-xl hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              {isManagingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Manage Subscription
            </button>
            <a
              href="/#pricing"
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 py-2.5 px-4 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium"
            >
              <Zap className="w-4 h-4" />
              Change Plan
            </a>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Connected Accounts</h2>
          <a
            href="/dashboard/accounts"
            className="flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors"
          >
            Manage
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="text-sm text-white/50">
          Manage your social media connections on the{" "}
          <a href="/dashboard/accounts" className="text-white hover:underline">
            Social Accounts
          </a>{" "}
          page.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#111] border border-red-500/20 rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-white/50 mb-6">
          Once you delete your account, there is no going back. All your data, posts, and connected accounts will be
          permanently removed.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-red-500/10 text-red-400 py-2.5 px-4 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">
                Type <span className="font-mono font-bold">DELETE</span> to confirm account deletion.
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-black border border-red-500/20 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex items-center gap-2 bg-red-500 text-white py-2.5 px-4 rounded-xl hover:bg-red-600 transition-all text-sm font-medium disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Permanently Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="text-sm text-white/40 hover:text-white transition-colors px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
