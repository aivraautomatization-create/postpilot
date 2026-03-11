"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PenTool,
  Video,
  MessageSquare,
  Settings,
  Command,
  CreditCard,
  Loader2,
  TrendingUp,
  Link as LinkIcon,
  LogOut,
  Clock,
  Menu,
  X,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { isSubscriptionActive, getUsageLimit, getPlanName } from "@/lib/plan-limits";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create Content", href: "/dashboard/create", icon: PenTool },
  { name: "Viral Strategy", href: "/dashboard/strategy", icon: TrendingUp },
  { name: "Analyze Video", href: "/dashboard/analyze", icon: Video },
  { name: "AI Assistant", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Post History", href: "/dashboard/history", icon: Clock },
  { name: "Social Accounts", href: "/dashboard/accounts", icon: LinkIcon },
];

// Pages that remain accessible even after trial expires
const UNRESTRICTED_PAGES = ["/dashboard", "/dashboard/accounts", "/dashboard/settings", "/dashboard/history"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isManagingSub, setIsManagingSub] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function fetchProfile() {
      if (!supabase) return;
      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      setProfile(data);

      const onboardingDone = data?.onboarding_completed;
      if (!onboardingDone && pathname !== '/dashboard/onboarding') {
        router.push('/dashboard/onboarding');
      } else {
        setIsCheckingProfile(false);
      }
    }

    fetchProfile();
  }, [user, authLoading, pathname, router, supabase]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleManageSubscription = async () => {
    try {
      setIsManagingSub(true);
      const customerId = profile?.stripe_customer_id;

      if (!customerId) {
        alert("No active subscription found. Please select a plan from the pricing page first.");
        window.location.href = "/#pricing";
        return;
      }

      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to open subscription portal. Please check your Stripe configuration.");
      }
    } catch {
      alert("An error occurred while opening the subscription portal.");
    } finally {
      setIsManagingSub(false);
    }
  };

  if (authLoading || isCheckingProfile) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (pathname === '/dashboard/onboarding') {
    return <>{children}</>;
  }

  const subscriptionActive = isSubscriptionActive(profile);
  const isRestrictedPage = !UNRESTRICTED_PAGES.includes(pathname);
  const showExpiredOverlay = !subscriptionActive && isRestrictedPage;

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Command className="w-5 h-5 text-white" />
          <span className="text-lg font-medium tracking-tight">Postpilot</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          onClick={handleManageSubscription}
          disabled={isManagingSub}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {isManagingSub ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          Manage Subscription
        </button>
        <Link
          href="/dashboard/settings"
          className={clsx(
            "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium transition-colors",
            pathname === '/dashboard/settings'
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-in */}
      <div
        className={clsx(
          "w-64 border-r border-white/10 flex flex-col bg-[#050505] z-50",
          "fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 text-white/60 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-medium">
              {navigation.find(n => n.href === pathname)?.name || (pathname === '/dashboard/settings' ? 'Settings' : 'Dashboard')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{profile?.full_name || user?.user_metadata?.full_name || user?.email}</p>
              <p className="text-xs text-white/40 capitalize">
                {(profile?.plan_status || profile?.subscription_status) === 'active' ? getPlanName(profile?.subscription_tier) : (profile?.plan_status || profile?.subscription_status || 'Trial')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold">
              {(profile?.full_name || user?.user_metadata?.full_name || user?.email)?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {showExpiredOverlay ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Trial Expired</h2>
                  <p className="text-white/60 text-sm mb-6">
                    Your free trial has ended. Upgrade to a paid plan to continue creating and publishing content.
                  </p>
                  <Link
                    href="/#pricing"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Upgrade Now
                  </Link>
                  <p className="text-white/30 text-xs mt-4">
                    You can still view your post history, settings, and connected accounts.
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
