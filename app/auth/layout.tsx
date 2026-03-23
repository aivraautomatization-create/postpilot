'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, Grid2x2PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 bg-black text-white">
      {/* Left Panel - Hidden on mobile */}
      <div className="bg-[#050505] relative hidden h-full flex-col border-r border-white/10 p-10 lg:flex overflow-hidden">
        <div className="from-black absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
        <div className="z-10 flex items-center gap-2">
          <div className="bg-white text-black p-1.5 rounded-lg"><Grid2x2PlusIcon className="size-5" /></div>
          <p className="text-xl font-bold tracking-tight">Postpilot</p>
        </div>
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl font-medium leading-relaxed">
              &ldquo;This tool has completely automated our content pipeline. We save hours every single week and our engagement has skyrocketed.&rdquo;
            </p>
            <footer className="text-sm text-white/60">
              ~ Sarah Jenkins, Marketing Director
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="relative flex min-h-screen flex-col justify-center p-8 sm:p-12 overflow-y-auto">
        <Button variant="ghost" className="absolute top-7 left-5 text-white/60 hover:text-white" asChild>
          <Link href="/">
            <ChevronLeftIcon className='size-4 me-2' />
            Home
          </Link>
        </Button>
        <div className="mx-auto w-full max-w-[400px]">
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <div className="bg-white text-black p-1.5 rounded-lg"><Grid2x2PlusIcon className="size-5" /></div>
            <p className="text-xl font-bold tracking-tight">PostPilot</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(255,255,255,${0.03 + i * 0.01})`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 opacity-40">
      <svg className="h-full w-full text-white" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.03 + path.id * 0.01}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}
