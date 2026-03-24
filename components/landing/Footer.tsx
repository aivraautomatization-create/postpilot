import Link from "next/link";
import { Command } from "lucide-react";

const productLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Templates", href: "/dashboard/templates" },
  { name: "Dashboard", href: "/dashboard" },
];

const companyLinks = [
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
  { name: "Contact", href: "mailto:hello@puls.work" },
];

export default function Footer() {
  return (
    <footer className="bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.06] relative z-10">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Column 1: Logo + tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Command className="w-5 h-5 text-white" />
              <span className="text-lg font-medium text-white tracking-tight">Puls</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              AI-powered social media for local businesses and personal brands.
            </p>
            <p className="text-sm text-white/30">hello@puls.work</p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/[0.06] pt-8 flex items-center justify-center gap-2">
          <Command className="w-4 h-4 text-white/30" />
          <p className="text-center text-xs leading-5 text-white/40">
            &copy; {new Date().getFullYear()} Puls. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
