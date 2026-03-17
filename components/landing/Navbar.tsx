'use client';

import Link from "next/link";
import { Command, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import PremiumMenu from "./PremiumMenu";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Command className="w-6 h-6 text-white" />
            <span className="text-xl font-medium text-white tracking-tight">Postpilot</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Pricing</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="hidden sm:block text-sm font-semibold bg-white text-black backdrop-blur-md px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95">
                  Dashboard
                </Link>
                <PremiumMenu />
                <button 
                  onClick={() => signOut()}
                  className="hidden sm:block text-white/50 hover:text-white transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/auth/signup" className="hidden sm:block text-sm font-semibold bg-white text-black backdrop-blur-md px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95">
                  Start Free Trial
                </Link>
                <PremiumMenu />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
