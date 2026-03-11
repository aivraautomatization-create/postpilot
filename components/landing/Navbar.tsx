'use client';

import Link from "next/link";
import { Command, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
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
                <Link href="/dashboard" className="text-sm font-medium text-black bg-white px-4 py-2 rounded-full hover:bg-white/90 transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="text-white/50 hover:text-white transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/auth/signup" className="text-sm font-medium text-black bg-white px-4 py-2 rounded-full hover:bg-white/90 transition-colors">
                  Start Free Trial
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
