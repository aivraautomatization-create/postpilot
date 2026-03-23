"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Send, Twitter } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="relative border-t border-white/10 bg-black text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter — reciprocity: give value first */}
          <div className="relative">
            <h2 className="mb-2 text-2xl font-bold tracking-tight">Stay ahead.</h2>
            <p className="mb-6 text-white/50 text-sm">
              Get weekly content strategy tips, PostPilot updates, and creator growth ideas — free.
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
              <Link href="/changelog" className="block text-white/60 transition-colors hover:text-white">
                Changelog
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Resources</h3>
            <nav className="space-y-3 text-sm">
              <Link href="/blog" className="block text-white/60 transition-colors hover:text-white">
                Blog
              </Link>
              <Link href="/docs" className="block text-white/60 transition-colors hover:text-white">
                Documentation
              </Link>
              <Link href="/api" className="block text-white/60 transition-colors hover:text-white">
                API
              </Link>
              <Link href="/affiliate" className="block text-white/60 transition-colors hover:text-white">
                Affiliate Program
              </Link>
              <Link href="/status" className="block text-white/60 transition-colors hover:text-white">
                System Status
              </Link>
            </nav>
          </div>

          {/* Social + company */}
          <div className="relative">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Connect</h3>
            <div className="mb-6 flex space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter / X</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Follow @PostPilotAI</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>@postpilot</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>PostPilot on LinkedIn</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <address className="not-italic text-sm space-y-1 text-white/40">
              <p>hello@postpilot.ai</p>
              <p>San Francisco, CA</p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center md:flex-row">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} PostPilot. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-white/30 transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/30 transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-white/30 transition-colors hover:text-white">
              Cookie Settings
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
