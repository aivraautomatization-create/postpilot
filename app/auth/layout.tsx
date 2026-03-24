'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, Grid2x2PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasRevealEffect } from '@/components/ui/sign-in-flow-1';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 bg-black text-white">
      {/* Left Panel */}
      <div className="bg-[#050505] relative hidden h-full flex-col border-r border-white/10 p-10 lg:flex overflow-hidden">
        {/* Canvas reveal animation */}
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={3}
            colors={[[255, 255, 255]]}
            opacities={[0.02, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05, 0.05, 0.06, 0.08]}
            dotSize={2}
            showGradient={false}
            containerClassName="h-full w-full"
          />
          {/* Gradient overlay so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
        </div>

        {/* Logo */}
        <div className="z-10 flex items-center gap-2">
          <div className="bg-white text-black p-1.5 rounded-lg">
            <Grid2x2PlusIcon className="size-5" />
          </div>
          <p className="text-xl font-bold tracking-tight">Puls</p>
        </div>

        {/* Testimonial */}
        <div className="z-10 mt-auto">
          <blockquote className="space-y-3">
            <div className="flex gap-1 text-yellow-400 mb-2">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-lg font-medium leading-relaxed text-white">
              &ldquo;Puls completely automated our content pipeline. We save 12 hours every week and our engagement has tripled.&rdquo;
            </p>
            <footer className="text-sm text-white/40">
              Sarah Jenkins &mdash; Marketing Director
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Panel */}
      <div className="relative flex min-h-screen flex-col justify-center p-8 sm:p-12 overflow-y-auto">
        <Button variant="ghost" className="absolute top-7 left-5 text-white/60 hover:text-white" asChild>
          <Link href="/">
            <ChevronLeftIcon className='size-4 me-2' />
            Home
          </Link>
        </Button>
        <div className="mx-auto w-full max-w-[400px]">
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <div className="bg-white text-black p-1.5 rounded-lg">
              <Grid2x2PlusIcon className="size-5" />
            </div>
            <p className="text-xl font-bold tracking-tight">Puls</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
