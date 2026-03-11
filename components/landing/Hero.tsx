import Link from "next/link";
import { ArrowRight, Command } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-8">
          <Command className="w-4 h-4 text-white" />
          <span className="text-sm text-white font-medium tracking-wide">Postpilot AI 2.0 is here</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight mb-6 leading-[1.1]">
          Premium social media,<br />on autopilot.
        </h1>
        
        <p className="mt-4 max-w-2xl mx-auto text-xl text-white/70 mb-10 font-light">
          AI generates your entire week of excellent content in 3 minutes. Publish to all of your social media instantly. Save thousands on marketing agencies and paid ads while your audience grows with massive ROI.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-black bg-white rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            Start 7-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="#features" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-white/10 border border-white/20 rounded-full hover:bg-white/20 backdrop-blur-sm transition-all w-full sm:w-auto"
          >
            See How It Works
          </Link>
        </div>
      </div>
    </div>
  );
}
