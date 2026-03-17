"use client";

import { useState, useEffect, useRef } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  const { user, loading: authLoading, profile, signOut } = useAuth();
  const [isManagingSub, setIsManagingSub] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const checkoutInitiatedRef = useRef(false);
  const supabase = getSupabase();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (profile) {
      // Handle initiate_checkout if present in URL (only once)
      const searchParams = new URLSearchParams(window.location.search);
      const tierToInitiate = searchParams.get('initiate_checkout');

      if (tierToInitiate && !checkoutInitiatedRef.current) {
        checkoutInitiatedRef.current = true;
        // Remove the param to prevent re-triggers
        const url = new URL(window.location.href);
        url.searchParams.delete('initiate_checkout');
        window.history.replaceState({}, '', url.toString());

        async function triggerCheckout() {
          try {
            const response = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tierId: tierToInitiate }),
            });
            const data = await response.json();
            if (data.url) {
              window.location.href = data.url;
            }
          } catch (err) {
            console.error('Failed to auto-initiate checkout:', err);
          }
        }
        triggerCheckout();
      }

      const onboardingDone = profile?.onboarding_completed;
      if (!onboardingDone && pathname !== '/dashboard/onboarding') {
        router.push('/dashboard/onboarding');
      } else {
        setIsCheckingProfile(false);
      }
    }
  }, [user, authLoading, profile, pathname, router]);

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
        <Loader2 className="w-8 h-8 text-white animate-spin" />
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <Command className="w-5 h-5 text-white" />
          <span className="text-lg font-medium tracking-tight">Postpilot</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-white/[0.08] text-white backdrop-blur-md border border-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-purple-400 via-pink-400 to-white rounded-r-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-white/50 group-hover:text-white/80 transition-colors")} />
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
    <div className="min-h-screen bg-[#030303] text-white flex overflow-hidden">
      {/* Dynamic Background subtle overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
      </div>

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop: always visible, mobile: slide-in */}
      <div
        className={clsx(
          "w-64 border-r border-white-[0.08] flex flex-col bg-white/[0.02] backdrop-blur-2xl z-50",
          "fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-4 md:px-8 bg-white/[0.02] backdrop-blur-xl sticky top-0 z-10">
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white via-sky-300 to-white p-[2px]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                {(profile?.full_name || user?.user_metadata?.full_name || user?.email)?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary>
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
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-2 bg-white hover:bg-white/80 text-black font-semibold py-3 px-6 rounded-xl transition-all"
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
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
