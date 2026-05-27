"use client";

import { Logo } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-mesh overflow-hidden relative">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/20 blur-[80px] rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo with Dual Rotating Rings */}
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] animate-[spin_3s_linear_infinite]" />
          {/* Inner Ring */}
          <div className="absolute inset-3 rounded-full border-4 border-purple-100 border-b-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)] animate-[spin_2s_linear_infinite_reverse]" />
          
          {/* Central Pulsing Logo */}
          <div className="animate-pulse bg-white p-3 rounded-full shadow-xl">
            <Logo size="md" showText={false} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* Shimmering Brand Name */}
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_2.5s_linear_infinite]">
            AapkiSociety
          </h2>
          
          {/* Loading Message with Bouncing Dots */}
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-sm">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm font-semibold text-slate-600 tracking-wide">
              Preparing your experience...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
