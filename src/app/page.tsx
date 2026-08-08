"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, Building2, Shield, Users, Zap, CheckCircle2, MapPin,
  PhoneCall, Wallet, Star, Lock, Smartphone, HeartHandshake, ShieldCheck,
  TrendingUp, Bell, Car, CalendarDays, Vote, MessageSquare, ChevronDown
} from "lucide-react";

// ─── Simple animated counter ────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString("en-IN")}{suffix}</span>;
}

// ─── Feature card ────────────────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50 border-blue-100",
    title: "Smart Gate Management",
    desc: "QR & OTP-based digital approvals for guests, cabs, and deliveries. Every entry logged instantly.",
    stat: "Zero unauthorized entry",
  },
  {
    icon: Wallet,
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
    title: "Automated Billing & Collections",
    desc: "GST-compliant invoices auto-generated every month. Online payment with instant receipts and ledger updates.",
    stat: "98% collection rate average",
  },
  {
    icon: CalendarDays,
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50 border-violet-100",
    title: "Amenity Bookings",
    desc: "Clubhouse, swimming pool, tennis court — residents book slots from the app with zero phone calls.",
    stat: "Conflict-free scheduling",
  },
  {
    icon: CheckCircle2,
    color: "from-rose-500 to-rose-600",
    bg: "bg-rose-50 border-rose-100",
    title: "Helpdesk & Complaint Tracking",
    desc: "Raise lift, plumbing, or electrical issues from anywhere. SLA timers ensure accountability.",
    stat: "Avg. 4hr resolution time",
  },
  {
    icon: Bell,
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50 border-amber-100",
    title: "Digital Notice Board & Polls",
    desc: "Broadcast RWA announcements, conduct transparent elections, and gather resident feedback instantly.",
    stat: "10x better reach vs WhatsApp",
  },
  {
    icon: Car,
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50 border-indigo-100",
    title: "Parking & Vehicle Management",
    desc: "Allocate slots, track daily visitors' vehicles, and eliminate unauthorized parking disputes.",
    stat: "Zero parking conflicts",
  },
  {
    icon: MessageSquare,
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50 border-teal-100",
    title: "Resident Communication Hub",
    desc: "Group chat, individual messages, and official broadcasts — all in one secure, moderated space.",
    stat: "No more 200-person WhatsApp groups",
  },
  {
    icon: TrendingUp,
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50 border-orange-100",
    title: "Financial Transparency Dashboard",
    desc: "Every rupee tracked. Expenses, income, and balances visible to the RWA committee in real-time.",
    stat: "100% audit-ready accounts",
  },
  {
    icon: Vote,
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50 border-pink-100",
    title: "Resident Directory & Profiles",
    desc: "Verified directory of owners, tenants, and family members with privacy controls built in.",
    stat: "GDPR-compliant data handling",
  },
];

const testimonials = [
  {
    name: "Col. (Retd.) Rajesh Sharma",
    role: "RWA President • Prestige Lakeside",
    img: "https://i.pravatar.cc/100?img=52",
    quote: "We tried three platforms before AapkiSociety. Nothing came close. Maintenance collection jumped from 65% to 97% in 60 days. The transparency has completely eliminated committee disputes.",
    rating: 5,
  },
  {
    name: "Meenakshi Iyer",
    role: "Treasurer • Godrej Garden City",
    img: "https://i.pravatar.cc/100?img=47",
    quote: "The GST-compliant invoicing and auto-reminders save me 25 hours of manual work every month. The audit trail is impeccable. Our chartered accountant is also very impressed.",
    rating: 5,
  },
  {
    name: "Arvind & Pooja Mehta",
    role: "Residents • DLF The Magnolias",
    img: "https://i.pravatar.cc/100?img=33",
    quote: "Approving our maid's entry, checking who rang the gate bell, and paying maintenance — all on one beautiful app. We feel genuinely safer and more connected to our community.",
    rating: 5,
  },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* ══ AMBIENT BACKGROUND ══════════════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-indigo-100/60 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-100/40 to-transparent blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-violet-50/30 via-transparent to-indigo-50/30 blur-3xl"></div>
      </div>

      {/* ══ NAVIGATION ══════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-slate-200/60 shadow-[0_1px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="w-5 h-5 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">Aapki<span className="text-indigo-600">Society</span></span>
              <div className="text-[10px] font-bold text-slate-400 leading-none tracking-wide uppercase">By India&apos;s RWAs, For India&apos;s RWAs</div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Security</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Stories</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/25">
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline px-4 py-2 font-semibold text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20">
                  Register RWA <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 pt-8">

          {/* Left text column */}
          <div className="flex-1 text-center lg:text-left stagger max-w-2xl mx-auto lg:mx-0">

            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/80 text-sm font-bold text-slate-700 mb-8 shadow-sm animate-fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ISO 27001 Certified</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>SOC 2 Compliant</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>GDPR Ready</span>
            </div>

            <h1 className="text-[3.2rem] md:text-[4.5rem] lg:text-[5rem] font-black tracking-tighter leading-[1.05] mb-6 animate-slide-up">
              India&apos;s Most <br />
              Trusted Society<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600">
                Management OS.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium animate-slide-up" style={{ animationDelay: "0.1s" }}>
              From gate entry to GST billing, from complaint tickets to community polls — AapkiSociety replaces 12 disconnected tools with one beautiful, secure platform built specifically for Indian RWAs.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link href={isLoggedIn ? "/dashboard" : "/register"} className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-2xl shadow-indigo-600/30 w-full sm:w-auto justify-center overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative">Start Free — No Credit Card</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#demo" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 font-bold text-base hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-95 w-full sm:w-auto justify-center shadow-sm">
                <PhoneCall className="w-5 h-5 text-indigo-600" /> Book a Live Demo
              </a>
            </div>

            {/* Social proof row */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-slate-600 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2.5">
                  {[22, 32, 42, 52].map((n) => (
                    <img key={n} src={`https://i.pravatar.cc/100?img=${n}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" alt="resident" />
                  ))}
                </div>
                <span className="text-slate-700">10,000+ happy residents</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <span>4.9 on Play Store</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>500+ active societies</span>
              </div>
            </div>
          </div>

          {/* Right visual column — dashboard preview */}
          <div className="flex-1 w-full max-w-xl mx-auto relative animate-scale-in" style={{ animationDelay: "0.25s" }}>
            {/* Glow orb behind card */}
            <div className="absolute -inset-6 bg-gradient-to-br from-indigo-200/50 via-violet-200/30 to-transparent rounded-[3rem] blur-3xl"></div>

            {/* Main card */}
            <div className="relative bg-white rounded-[2.5rem] shadow-[0_32px_80px_rgba(99,102,241,0.18)] border border-slate-200/80 overflow-hidden">
              {/* App top bar */}
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-5 text-white">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-0.5">Good Morning</div>
                    <div className="text-lg font-extrabold">Rajesh Kumar, 402-A</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* Balance card */}
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20">
                  <div className="text-xs font-semibold text-indigo-200 mb-1">Maintenance Due — August 2026</div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black">₹4,500</span>
                    <button className="text-xs font-bold bg-white text-indigo-700 px-4 py-1.5 rounded-full hover:bg-indigo-50 transition-colors">Pay Now</button>
                  </div>
                </div>
              </div>

              {/* Quick action tiles */}
              <div className="grid grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
                {[
                  { icon: Shield, label: "Gate", color: "text-blue-600" },
                  { icon: Wallet, label: "Pay", color: "text-emerald-600" },
                  { icon: CheckCircle2, label: "Issues", color: "text-rose-600" },
                  { icon: CalendarDays, label: "Book", color: "text-violet-600" },
                ].map((q, i) => (
                  <div key={i} className="bg-white flex flex-col items-center py-4 gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center ${q.color}`}>
                      <q.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{q.label}</span>
                  </div>
                ))}
              </div>

              {/* Feed */}
              <div className="divide-y divide-slate-100">
                {[
                  { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600", title: "Gate Entry Approved", sub: "Zomato delivery • Flat 402-A", time: "2m ago" },
                  { icon: Bell, color: "bg-amber-100 text-amber-600", title: "RWA Notice", sub: "Water supply off 9–11 AM tomorrow", time: "1h ago" },
                  { icon: Wallet, color: "bg-indigo-100 text-indigo-600", title: "Receipt Generated", sub: "July maintenance • ₹4,500", time: "Yesterday" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-2xl ${item.color} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{item.sub}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge: Live Visitor */}
            <div className="absolute -left-6 top-10 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3.5 flex items-center gap-3 animate-float max-w-[200px]">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Visitor OTP Sent</p>
                <p className="text-[10px] text-slate-500 font-semibold">Flat 504-B • Now</p>
              </div>
            </div>

            {/* Floating badge: Collections */}
            <div className="absolute -right-6 bottom-16 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3.5 flex items-center gap-3 animate-float max-w-[210px]" style={{ animationDelay: "1.2s" }}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">98% Collection Rate</p>
                <p className="text-[10px] text-slate-500 font-semibold">This month • ₹24.8L</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF BANNER ══════════════════════════════════════════ */}
      <div className="relative z-10 py-12 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,white,transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Powering India&apos;s Most Prestigious Residential Complexes</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20">
            {[
              { name: "LODHA", shape: "w-3 h-3 bg-white rounded-sm" },
              { name: "GODREJ", shape: "w-3 h-3 rounded-full border-2 border-white" },
              { name: "PRESTIGE", shape: "w-3 h-3 bg-white rotate-45" },
              { name: "DLF", shape: "w-3 h-3 border-t-2 border-l-2 border-white" },
              { name: "BRIGADE", shape: "w-3 h-3 bg-white rounded-full" },
            ].map((b) => (
              <div key={b.name} className="flex items-center gap-2.5 opacity-40 hover:opacity-80 transition-opacity cursor-default">
                <div className={b.shape}></div>
                <span className="text-white font-black text-sm tracking-widest">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ STATS ROW ════════════════════════════════════════════════════ */}
      <div className="relative z-10 py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Societies", target: 500, suffix: "+", color: "text-indigo-600" },
            { label: "Happy Residents", target: 85000, suffix: "+", color: "text-emerald-600" },
            { label: "Payments Processed", target: 500, suffix: "Cr+", color: "text-violet-600", prefix: "₹" },
            { label: "Issues Resolved", target: 48000, suffix: "+", color: "text-rose-600" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-4xl md:text-5xl font-black mb-2 ${s.color}`}>
                {s.prefix || ""}<Counter target={s.target} suffix={s.suffix} />
              </div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-28 bg-[#F8F9FF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-5">
              <Zap className="w-3.5 h-3.5" /> Everything Your RWA Needs
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-5">
              One platform. <span className="text-indigo-600">Zero chaos.</span>
            </h2>
            <p className="text-xl text-slate-600 font-medium max-w-3xl mx-auto">
              Replace 12 different WhatsApp groups, Excel sheets, and paper registers with one seamless, auditable platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/60 hover:-translate-y-2 transition-all duration-400 cursor-default"
                onMouseEnter={() => setActiveFeature(i)}
              >
                <div className={`w-14 h-14 rounded-2xl ${f.bg} border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-sm`}>
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-3 leading-snug">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-5">{f.desc}</p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {f.stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECURITY ════════════════════════════════════════════════════ */}
      <section id="security" className="relative z-10 py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">

          {/* Left — dark security card */}
          <div className="flex-1 w-full relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-indigo-200/50 to-violet-200/30 rounded-[3rem] blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-slate-950 to-indigo-950 p-10 md:p-14 rounded-[3rem] text-white overflow-hidden shadow-2xl border border-indigo-900/40">
              <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500 rounded-full mix-blend-multiply blur-3xl opacity-25"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-600 rounded-full mix-blend-multiply blur-3xl opacity-20"></div>

              <ShieldCheck className="w-14 h-14 text-indigo-400 mb-6 relative z-10" />
              <h3 className="text-3xl font-extrabold mb-4 relative z-10">Bank-Grade Security</h3>
              <p className="text-slate-300 font-medium mb-8 relative z-10 leading-relaxed">
                Your community data, financial records, and residents' personal information are protected at the highest industry standard — the same level as India's top banks.
              </p>
              <ul className="space-y-4 relative z-10">
                {[
                  "256-bit AES Encryption, data at rest & in transit",
                  "ISO 27001 Certified Infrastructure on AWS India",
                  "Strict Role-Based Access Control (RBAC)",
                  "Automated daily backups with 30-day retention",
                  "Zero Data Sharing with third-party advertisers",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — privacy trust section */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-5">
              <Lock className="w-3.5 h-3.5" /> Your Data Is Yours
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
              We respect your community&apos;s<span className="text-indigo-600"> privacy</span>.
            </h2>
            <p className="text-lg text-slate-600 font-medium mb-8 leading-relaxed">
              Unlike many free society apps, we do not mine resident data, show advertisements, or sell your information. AapkiSociety is a paid B2B SaaS — you are our customer, not our product.
            </p>

            <div className="space-y-4">
              {[
                { icon: Lock, title: "Masked Phone Numbers", desc: "Resident contact details are never exposed without consent. All calls go through our masked relay system." },
                { icon: HeartHandshake, title: "Completely Ad-Free", desc: "No banner ads, no sponsored listings, no local business spam. Ever." },
                { icon: Smartphone, title: "DPDP Act 2023 Compliant", desc: "We are fully compliant with India's Digital Personal Data Protection Act and GDPR frameworks." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative z-10 py-28 bg-[#F8F9FF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-widest mb-5">
              <Star className="w-3.5 h-3.5 fill-current" /> Real Stories From Real Committees
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Trusted by 500+ RWA Presidents &amp; Treasurers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed mb-8 italic flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                  <img src={t.img} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow" alt={t.name} />
                  <div>
                    <h4 className="font-extrabold text-slate-900 leading-tight">{t.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING HINT ════════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600 font-medium">Per flat, per month. No hidden charges.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { plan: "Starter", price: "₹30", per: "/flat/mo", features: ["Up to 100 flats", "Gate Management", "Notice Board", "Maintenance Billing", "Mobile App"], popular: false },
              { plan: "Growth", price: "₹50", per: "/flat/mo", features: ["Up to 500 flats", "Everything in Starter", "Amenity Bookings", "Helpdesk & SLA Tracking", "Accounting Reports", "Priority Support"], popular: true },
              { plan: "Enterprise", price: "Custom", per: "", features: ["Unlimited flats", "Everything in Growth", "Custom integrations", "Dedicated CSM", "SLA guarantee", "On-premise option"], popular: false },
            ].map((p, i) => (
              <div key={i} className={`relative rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 ${p.popular ? "bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/30 text-white" : "bg-white border-slate-200 shadow-sm hover:shadow-xl"}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-black rounded-full uppercase tracking-wider">Most Popular</div>}
                <h3 className={`text-xl font-extrabold mb-3 ${p.popular ? "text-white" : "text-slate-900"}`}>{p.plan}</h3>
                <div className="flex items-end gap-1 mb-8">
                  <span className={`text-5xl font-black ${p.popular ? "text-white" : "text-slate-900"}`}>{p.price}</span>
                  <span className={`text-sm font-semibold mb-1.5 ${p.popular ? "text-indigo-200" : "text-slate-500"}`}>{p.per}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.popular ? "text-indigo-200" : "text-emerald-500"}`} />
                      <span className={`text-sm font-semibold ${p.popular ? "text-indigo-100" : "text-slate-700"}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${p.popular ? "bg-white text-indigo-700 hover:bg-indigo-50" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 py-12 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 p-12 md:p-20 text-center shadow-[0_40px_120px_rgba(99,102,241,0.35)]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                Is your society ready<br />for the upgrade?
              </h2>
              <p className="text-indigo-200 text-xl font-medium mb-10 max-w-2xl mx-auto">
                Join 500+ RWAs who have transformed their community. Setup takes under 30 minutes. No IT expertise needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="px-10 py-4 rounded-2xl bg-white text-indigo-800 font-black text-lg hover:bg-indigo-50 transition-all active:scale-95 shadow-xl w-full sm:w-auto flex items-center justify-center gap-2">
                  Register Your Society — Free <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#demo" className="px-8 py-4 rounded-2xl bg-indigo-600 border-2 border-indigo-400 text-white font-bold text-base hover:bg-indigo-500 transition-all active:scale-95 w-full sm:w-auto text-center flex items-center justify-center gap-2">
                  <PhoneCall className="w-5 h-5" /> Talk to an Expert
                </a>
              </div>
              <p className="text-indigo-300 text-sm font-semibold mt-8">Free 30-day trial • No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">Aapki<span className="text-indigo-400">Society</span></span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-500">India&apos;s most trusted society management platform. Built by RWA members, for RWA members.</p>
            </div>
            {/* Links */}
            {[
              { title: "Platform", links: ["Features", "Security", "Pricing", "Roadmap"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Press Kit"] },
              { title: "Support", links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white font-extrabold text-sm mb-4 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-400 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-600">© {new Date().getFullYear()} AapkiSociety Technologies Pvt. Ltd. — CIN: U72900MH2024PTC000000</p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-500">ISO 27001 Certified Infrastructure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
