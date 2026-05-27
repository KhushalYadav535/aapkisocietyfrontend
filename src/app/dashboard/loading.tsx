"use client";

import { Logo } from "@/components/Logo";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center relative overflow-hidden rounded-3xl">
      {/* Subtle Glow Backgrounds inside the dashboard area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 blur-[80px] rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-purple-500/10 blur-[60px] rounded-full animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
        {/* Animated Rings & Logo */}
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-100 border-t-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)] animate-[spin_2s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-100 border-b-purple-500 shadow-[0_0_8px_rgba(147,51,234,0.2)] animate-[spin_1.5s_linear_infinite_reverse]" />
          
          <div className="animate-pulse bg-white p-2.5 rounded-full shadow-md">
            <Logo size="sm" showText={false} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* Shimmering Text */}
          <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_2s_linear_infinite]">
            Loading Module...
          </h2>
          
          {/* Bouncing Dots */}
          <div className="flex gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
