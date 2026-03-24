"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { Command } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="relative border-t border-white/10 bg-black text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter */}
          <div className="relative">
            <h2 className="mb-2 text-2xl font-bold tracking-tight">Stay ahead.</h2>
            <p className="mb-6 text-white/50 text-sm">
              Get weekly content strategy tips and Puls updates — free.
            </p>
            <form className="relative">
              <Input
                type="email"
                placeholder="your@email.com"
                className="pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-white text-black hover:bg-white/90 transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
          </div>

          {/* Product links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Product</h3>
            <nav className="space-y-3 text-sm">
              <Link href="/dashboard" className="block text-white/60 transition-colors hover:text-white">
                Dashboard
              </Link>
              <Link href="/dashboard/strategy" className="block text-white/60 transition-colors hover:text-white">
                AI Strategy
              </Link>
              <Link href="/dashboard/templates" className="block text-white/60 transition-colors hover:text-white">
                Templates
              </Link>
              <Link href="#pricing" className="block text-white/60 transition-colors hover:text-white">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Company</h3>
            <nav className="space-y-3 text-sm">
              <Link href="/privacy" className="block text-white/60 transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-white/60 transition-colors hover:text-white">
                Terms of Service
              </Link>
              <Link href="mailto:hello@puls.work" className="block text-white/60 transition-colors hover:text-white">
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="relative">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Contact</h3>
            <address className="not-italic text-sm space-y-2 text-white/40">
              <p>
                <a href="mailto:hello@puls.work" className="hover:text-white transition-colors">
                  hello@puls.work
                </a>
              </p>
            </address>
            <div className="mt-6 flex items-center gap-2">
              <Command className="w-4 h-4 text-white/30" />
              <span className="text-sm font-medium text-white/30">Puls</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center md:flex-row">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} Puls. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-white/30 transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-white/30 transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="mailto:hello@puls.work" className="text-white/30 transition-colors hover:text-white">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
