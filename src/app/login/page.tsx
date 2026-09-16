"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Eye, EyeOff, Lock, Mail, ArrowRight, Building2, ShieldCheck,
  CheckCircle2, Star, Sparkles, ArrowLeft, Landmark, Wallet, Users
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoFill = (role: string, demoEmail: string, demoPass: string) => {
    setActiveDemoRole(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    toast.success(`Demo credentials loaded for ${role}`, { icon: "✨" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to AapkiSociety!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* ── LEFT PANEL: PREMIUM BRANDING & SOCIAL PROOF (DESKTOP) ────────── */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative p-12 lg:p-16 flex-col justify-between overflow-hidden border-r border-slate-800">
        
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-violet-600/20 blur-[130px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none opacity-60" />

        {/* Top Header: Back to Website & Live Status */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-all active:scale-95 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to AapkiSociety</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All Systems Normal</span>
          </div>
        </div>

        {/* Center: Brand Showcase */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          {/* Logo Badge */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-indigo-600/40 border border-white/20 bg-white shrink-0">
              <Image
                src="/aapp.jpeg"
                alt="AapkiSociety Logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white">Aapki<span className="text-indigo-400">Society</span></span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">v4.0</span>
              </div>
              <p className="text-xs text-indigo-200 font-medium">Platform-Driven Housing Society OS</p>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white mb-4">
            Manage your community with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              complete confidence.
            </span>
          </h2>

          <p className="text-sm text-slate-300 font-normal leading-relaxed mb-8">
            The all-in-one operating system trusted by 500+ managing committees across India for automated GST billing, gate visitor verification, and Tally Prime accounting.
          </p>

          {/* Key Feature Tiles */}
          <div className="space-y-3">
            {[
              {
                icon: Wallet,
                title: "Automated GST & Maintenance Billing",
                desc: "Instant UPI receipts & automated 1-click ledger reconciliation.",
              },
              {
                icon: Landmark,
                title: "1-Click Tally Prime XML Export",
                desc: "Zero double data entry for your society's Chartered Accountant.",
              },
              {
                icon: ShieldCheck,
                title: "Bank-Grade DPDP Act 2023 Security",
                desc: "Masked resident phone numbers and 256-bit AES encryption.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Social Proof Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2.5">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="text-white font-bold">4.9/5</span>
            <span className="text-slate-400">(10,000+ reviews)</span>
          </div>
          <span className="text-slate-500">ISO 27001 Certified • AWS Mumbai</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: LOGIN AUTHENTICATION FORM ─────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto relative">
        
        {/* Mobile Top Back Link */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">AapkiSociety</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Header Title */}
          <div className="mb-8">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Secure Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-3">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              Enter your credentials to manage your society dashboard
            </p>
          </div>

          {/* ── 1-CLICK QUICK DEMO CHIPS ─────────────────────────────────────── */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Try Instant Demo Login:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("Admin", "admin@demo.com", "password123")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDemoRole === "Admin"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>RWA Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill("Treasurer", "treasurer@demo.com", "password123")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDemoRole === "Treasurer"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Treasurer</span>
              </button>
            </div>
          </div>

          {/* ── MAIN LOGIN FORM ──────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                  placeholder="name@society.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast("Please contact your Society Admin to reset password.", { icon: "ℹ️" });
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span className="text-xs text-slate-600 font-semibold">Remember this device</span>
              </label>

              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SSL Secured
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Redirect Link */}
          <div className="mt-8 text-center pt-6 border-t border-slate-200/80">
            <p className="text-xs text-slate-600 font-medium">
              Want to onboard your residential complex?{" "}
              <Link
                href="/register"
                className="text-indigo-600 hover:text-indigo-700 font-extrabold transition-colors underline"
              >
                Register your society (30-day trial)
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Trust Stamp */}
        <div className="text-center text-[11px] text-slate-400 font-medium mt-6">
          <span>Protected by AapkiSociety Guard™ • Compliant with Indian DPDP Act 2023</span>
        </div>
      </div>
    </div>
  );
}
