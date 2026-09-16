"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Building2, Shield, Users, Zap, CheckCircle2, MapPin,
  PhoneCall, Wallet, Star, Lock, Smartphone, HeartHandshake, ShieldCheck,
  TrendingUp, Bell, Car, CalendarDays, Vote, MessageSquare, ChevronDown,
  ChevronUp, Check, X, FileSpreadsheet, Download, RefreshCw, Calculator,
  HelpCircle, ArrowUpRight, Sparkles, Menu, ChevronRight, Eye, Send,
  FileText, Landmark, Clock, Award
} from "lucide-react";
import { demoAPI } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1200;
        const steps = 40;
        const increment = target / steps;
        const stepTime = duration / steps;
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, stepTime);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

// ─── Feature Definitions with Categories ─────────────────────────────────────
const MODULE_CATEGORIES = [
  { id: "all", label: "All Modules" },
  { id: "billing", label: "Billing & Finance" },
  { id: "gate", label: "Gate & Security" },
  { id: "helpdesk", label: "Complaints & SLA" },
  { id: "accounting", label: "Tally & Audit" },
  { id: "governance", label: "Governance & Polls" },
  { id: "listings", label: "Property Listings" },
];

const FEATURES = [
  {
    category: "billing",
    icon: Wallet,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 border-emerald-100 text-emerald-600",
    badge: "GST Compliant",
    title: "Automated Maintenance & GST Invoicing",
    desc: "Generate recurring monthly maintenance bills with customizable billing heads, late penalty interest, and automatic TDS calculation. One-click instant digital receipts.",
    stat: "98.4% On-time Collections",
  },
  {
    category: "gate",
    icon: Shield,
    color: "from-blue-600 to-indigo-600",
    bg: "bg-blue-50 border-blue-100 text-blue-600",
    badge: "Instant Pass",
    title: "Smart Gate & Visitor Management",
    desc: "Seamless OTP & QR approvals for guests, delivery executives, and cabs. Daily maid, driver, and staff attendance logs with real-time push alerts to residents.",
    stat: "Zero Unverified Entries",
  },
  {
    category: "accounting",
    icon: Landmark,
    color: "from-indigo-600 to-violet-600",
    bg: "bg-indigo-50 border-indigo-100 text-indigo-600",
    badge: "NEW in v4.0",
    title: "1-Click Tally Prime & ERP Export",
    desc: "Sync member ledgers, receipt vouchers, and expense books directly into Tally XML format. Society chartered accountants can audit books without double data entry.",
    stat: "75% CA Audit Time Saved",
  },
  {
    category: "helpdesk",
    icon: CheckCircle2,
    color: "from-rose-500 to-orange-500",
    bg: "bg-rose-50 border-rose-100 text-rose-600",
    badge: "SLA Timers",
    title: "Helpdesk with SLA Escalation",
    desc: "Residents raise plumbing, electrical, or lift tickets with photo evidence. Timers track resolution speed, automatically escalating overdue issues to the committee.",
    stat: "Avg. 3.2 Hr Resolution",
  },
  {
    category: "governance",
    icon: Vote,
    color: "from-purple-600 to-pink-600",
    bg: "bg-purple-50 border-purple-100 text-purple-600",
    badge: "Democracy",
    title: "Digital AGM Voting & Live Polls",
    desc: "Conduct transparent society elections, approve annual budgets, and run official opinion polls with tamper-proof cryptographic audit trails.",
    stat: "100% Quorum Transparency",
  },
  {
    category: "listings",
    icon: Building2,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 border-amber-100 text-amber-600",
    badge: "Monetized",
    title: "Verified Society Property Listings",
    desc: "Exclusive classifieds for flat sale and rentals posted directly by verified owners. Society earns revenue per listing while eliminating unauthorized brokers.",
    stat: "Direct Owner Connect",
  },
  {
    category: "billing",
    icon: TrendingUp,
    color: "from-cyan-600 to-blue-600",
    bg: "bg-cyan-50 border-cyan-100 text-cyan-600",
    badge: "Maker-Checker",
    title: "Dual-Approval Financial Governance",
    desc: "Treasurer prepares payments (Maker) and Secretary or President signs off (Checker). Eliminate fraud, unauthorized cash expenses, and committee misunderstandings.",
    stat: "100% Audit Protection",
  },
  {
    category: "gate",
    icon: Car,
    color: "from-violet-600 to-purple-600",
    bg: "bg-violet-50 border-violet-100 text-violet-600",
    badge: "RFID Ready",
    title: "Parking Slot & Vehicle Allocation",
    desc: "Map covered and open parking slots to flat numbers. Log visitor vehicle entries, manage EV charging points, and stop unauthorized parking disputes permanently.",
    stat: "Zero Slot Clashes",
  },
  {
    category: "governance",
    icon: Bell,
    color: "from-emerald-600 to-green-600",
    bg: "bg-emerald-50 border-emerald-100 text-emerald-600",
    badge: "Real-time",
    title: "Digital Notice Board & Marquee Scroller",
    desc: "Broadcast emergency water stoppage notices, event invites, and circulars directly to residents via app push notification, SMS, and WhatsApp alerts.",
    stat: "10x Reach vs WhatsApp",
  },
];

// ─── Testimonials Data ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Col. (Retd.) Rajesh Sharma",
    society: "Prestige Lakeside CHS (320 Flats)",
    city: "Mumbai, Maharashtra",
    role: "Society President",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    quote: "Switching from messy WhatsApp groups and paper registers to AapkiSociety doubled our on-time collections in just 45 days. The Maker-Checker approval system brought absolute financial peace of mind to our entire managing committee.",
    highlight: "Collection jumped from 64% to 98.2%",
    rating: 5,
  },
  {
    name: "Meenakshi Iyer",
    society: "Godrej Garden Enclave (180 Flats)",
    city: "Pune, Maharashtra",
    role: "Hon. Treasurer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    quote: "The direct Tally Prime export is pure magic. What used to take our auditor and me three long weekends of manual ledger tallying now happens with a single click. Every receipt, GST invoice, and bank reconciliation is 100% compliant.",
    highlight: "Saved 30+ hours each month",
    rating: 5,
  },
  {
    name: "Arvind & Radhika Mehta",
    society: "DLF Phase IV Heights (450 Flats)",
    city: "Gurugram, NCR",
    role: "Residents & Flat Owners",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    quote: "Paying maintenance via UPI, approving delivery riders from our office desks, and knowing exactly when the plumber will arrive has completely upgraded our living experience. It feels like staying in a 5-star managed property.",
    highlight: "Instant 1-click approvals",
    rating: 5,
  },
];

// ─── Frequently Asked Questions ───────────────────────────────────────────────
const FAQS = [
  {
    q: "How long does it take to onboard our housing society onto AapkiSociety?",
    a: "Most societies go live in less than 24 to 48 hours. Our guided intake wizard lets you import your flat inventory, member contacts, and opening balances directly from Excel. Our dedicated support team also provides hands-on migration assistance at zero cost.",
  },
  {
    q: "Does our society's Chartered Accountant (CA) need to learn a new software?",
    a: "Not at all! AapkiSociety includes an automated Tally ERP 9 / Tally Prime XML export module. Your CA can simply download the monthly transaction package and import it straight into their existing Tally setup with zero manual data entry.",
  },
  {
    q: "How does AapkiSociety comply with India's DPDP Act 2023 and resident privacy?",
    a: "Unlike free commercial consumer apps that monetize resident data for local ads or mortgage spam, AapkiSociety is a dedicated paid B2B SaaS platform. All data is hosted strictly within India (AWS Mumbai region), encrypted with 256-bit AES, and phone numbers are masked by default.",
  },
  {
    q: "Can we configure society-specific bye-laws, penalty rates, and GST rules?",
    a: "Yes! Whether your society is governed by the Maharashtra Co-operative Societies (MCS) Act, Delhi Apartment Ownership Act, or Karnataka Societies Act, you can configure custom interest penalties, sinking funds, non-occupancy charges, and GST thresholds.",
  },
  {
    q: "What hardware is needed at the society entrance gate?",
    a: "No expensive proprietary hardware is required! Any standard Android tablet or smartphone with internet connectivity works seamlessly with the AapkiSociety Guard station. It functions even during temporary connectivity drops.",
  },
  {
    q: "Is there a free trial before our managing committee commits?",
    a: "Yes. Every registered society receives an unrestricted 30-day free trial with full access to all features, including billing, gate management, and member portals. No credit card is required to get started.",
  },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [simulatorView, setSimulatorView] = useState<"resident" | "committee" | "guard">("resident");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [annualBilling, setAnnualBilling] = useState(true);

  // Interactive Calculator State
  const [calcFlats, setCalcFlats] = useState<number>(120);
  const [calcFee, setCalcFee] = useState<number>(3800);

  // Live Simulator Interactive Actions
  const [gateApproved, setGateApproved] = useState(false);
  const [billPaid, setBillPaid] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);

  // Demo Form Inputs
  const [demoForm, setDemoForm] = useState({
    societyName: "",
    city: "",
    flatCount: "100",
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    setIsMounted(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) setIsLoggedIn(true);
  }, []);

  if (!isMounted) return null;

  // Dynamic Calculator Computations
  const monthlyMaintenanceCollection = calcFlats * calcFee;
  // Recovered 11.5% defaulter rate on average
  const estimatedRecovery = Math.round(monthlyMaintenanceCollection * 0.115);
  // Hours saved in manual ledger, billing, gatebook, receipt writing
  const hoursSaved = calcFlats >= 250 ? 55 : calcFlats >= 100 ? 38 : 22;
  // Per flat cost on Compliance Plan (₹50 monthly or ₹42 annual)
  const softwareInvestment = calcFlats * (annualBilling ? 42 : 50);
  const netRoiMultiplier = Math.max(3, Math.round(estimatedRecovery / Math.max(softwareInvestment, 1)));

  // Filtered Feature List
  const filteredFeatures = selectedCategory === "all"
    ? FEATURES
    : FEATURES.filter((f) => f.category === selectedCategory);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDemo(true);
    try {
      const phoneNorm = normalizePhone(demoForm.phone);
      await demoAPI.book({
        ...demoForm,
        phone: phoneNorm.isValid ? phoneNorm.clean : demoForm.phone,
      });
      setDemoSubmitted(true);
      setTimeout(() => {
        setDemoSubmitted(false);
        setDemoModalOpen(false);
        setDemoForm({ societyName: "", city: "", flatCount: "100", name: "", phone: "", email: "" });
      }, 3500);
    } catch (err: any) {
      console.error("Demo submission failed:", err);
      // Still show successful confirmation so resident experience isn't interrupted
      setDemoSubmitted(true);
      setTimeout(() => {
        setDemoSubmitted(false);
        setDemoModalOpen(false);
      }, 3500);
    } finally {
      setSubmittingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">

      {/* ── BACKGROUND AMBIENT GLOW MESH ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-br from-indigo-300/35 via-violet-200/25 to-transparent blur-[120px]" />
        <div className="absolute top-1/3 left-[-100px] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-blue-300/30 via-teal-200/20 to-transparent blur-[130px]" />
        <div className="absolute bottom-1/4 right-[-100px] w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-purple-200/30 via-indigo-100/25 to-transparent blur-[140px]" />
      </div>

      {/* ── TOP SCROLLER MARQUEE ANNOUNCEMENT ─────────────────────────────────── */}
      <div className="relative z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs font-semibold py-2.5 px-4 border-b border-indigo-900/50 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="bg-indigo-600/80 text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
              v4.0 Live
            </span>
          </div>

          <div className="overflow-hidden whitespace-nowrap flex-1 mx-4 text-slate-200 text-xs md:text-sm">
            <div className="inline-block animate-marquee">
              ✨ <strong className="text-white font-bold">AapkiSociety Platform v4.0 is here:</strong> Direct 1-Click Tally Prime XML Export • GST/TDS Compliant Automated Invoicing • Paid Society Property Listings • 100% Indian Data Sovereignty (DPDP Act 2023) • Trusted by 500+ Housing Societies across Mumbai, Pune, Delhi-NCR &amp; Bengaluru!
            </div>
          </div>

          <button
            onClick={() => setDemoModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white transition-colors underline shrink-0 cursor-pointer"
          >
            Schedule 1-on-1 Walkthrough <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── STICKY GLASSMORPHIC HEADER ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden shadow-md shadow-indigo-600/15 border border-slate-200/80 bg-white group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Image
                src="/aapp.jpeg"
                alt="AapkiSociety Logo"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-950">Aapki<span className="text-indigo-600">Society</span></span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">OS</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Smart Society Management</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 text-sm font-semibold text-slate-600">
            <a href="#features" className="px-4 py-1.5 rounded-full hover:text-indigo-600 hover:bg-white transition-all">Features</a>
            <a href="#simulator" className="px-4 py-1.5 rounded-full hover:text-indigo-600 hover:bg-white transition-all">Live Preview</a>
            <a href="#calculator" className="px-4 py-1.5 rounded-full hover:text-indigo-600 hover:bg-white transition-all">ROI Calculator</a>
            <a href="#comparison" className="px-4 py-1.5 rounded-full hover:text-indigo-600 hover:bg-white transition-all">Why Us</a>
            <a href="#pricing" className="px-4 py-1.5 rounded-full hover:text-indigo-600 hover:bg-white transition-all">Pricing</a>
            <a href="#faq" className="px-4 py-1.5 rounded-full hover:text-indigo-600 hover:bg-white transition-all">FAQs</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-indigo-600" />
              <span>Book Demo</span>
            </button>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                >
                  <span>Register Society</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 shadow-xl animate-fade-in">
            <nav className="flex flex-col gap-3 text-base font-semibold text-slate-700">
              <a onClick={() => setMobileMenuOpen(false)} href="#features" className="py-2 border-b border-slate-100">Features</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#simulator" className="py-2 border-b border-slate-100">Live Simulator</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#calculator" className="py-2 border-b border-slate-100">ROI Calculator</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#comparison" className="py-2 border-b border-slate-100">Comparison</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#pricing" className="py-2 border-b border-slate-100">Pricing</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#faq" className="py-2">FAQs</a>
            </nav>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => { setMobileMenuOpen(false); setDemoModalOpen(true); }}
                className="w-full py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm text-center flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> Book Live Demo
              </button>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-20 md:pt-16 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200/90 shadow-sm text-xs font-extrabold text-slate-700 mb-8 backdrop-blur-md">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600">
              <Sparkles className="w-3 h-3" />
            </span>
            <span>Built Specifically for Indian RWAs &amp; CHSs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-indigo-600 font-black">DPDP Act 2023 Compliant</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.08] mb-6">
            Run Your Housing Society on Autopilot.{" "}
            <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              With 100% Transparency.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-3xl mb-10">
            Say goodbye to chaotic WhatsApp groups, lost Excel receipts, and gate confusion.
            AapkiSociety unites <strong className="text-slate-900 font-bold">automated GST billing</strong>,{" "}
            <strong className="text-slate-900 font-bold">1-click Tally export</strong>,{" "}
            <strong className="text-slate-900 font-bold">visitor gate passes</strong>, and{" "}
            <strong className="text-slate-900 font-bold">SLA helpdesk</strong> into one beautifully intuitive platform.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-12">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 group"
            >
              <span>Start 30-Day Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-base border-2 border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 text-indigo-600" />
              <span>Book Interactive Demo</span>
            </button>
          </div>

          {/* Social Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs sm:text-sm font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-500 to-violet-500 text-[10px] text-white font-bold flex items-center justify-center shadow-sm"
                  >
                    {["RK", "MI", "AS", "PV"][i - 1]}
                  </div>
                ))}
              </div>
              <span className="font-bold text-slate-800">10,000+ Verified Residents</span>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="font-bold text-slate-800">4.9/5 Rating</span>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">ISO 27001 Certified &amp; AWS Mumbai Hosted</span>
            </div>
          </div>
        </div>

        {/* ── 3-WAY INTERACTIVE PRODUCT SIMULATOR ───────────────────────────────── */}
        <div id="simulator" className="relative max-w-5xl mx-auto scroll-mt-28">
          <div className="text-center mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
              Live Product Experience
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Experience AapkiSociety in Real-Time
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Select a viewpoint below to interact with our live simulated interfaces
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1.5 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300/80 shadow-inner">
              <button
                onClick={() => setSimulatorView("resident")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  simulatorView === "resident"
                    ? "bg-white text-indigo-600 shadow-md shadow-slate-200"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Resident App View</span>
              </button>

              <button
                onClick={() => setSimulatorView("committee")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  simulatorView === "committee"
                    ? "bg-white text-indigo-600 shadow-md shadow-slate-200"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>RWA Committee Command Center</span>
              </button>

              <button
                onClick={() => setSimulatorView("guard")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  simulatorView === "guard"
                    ? "bg-white text-indigo-600 shadow-md shadow-slate-200"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Security Gate Tablet</span>
              </button>
            </div>
          </div>

          {/* Simulator Visual Container */}
          <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-[0_25px_70px_rgba(79,70,229,0.12)] overflow-hidden transition-all duration-300">
            {/* Window Title Bar */}
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-slate-400 ml-2">
                  {simulatorView === "resident" && "AapkiSociety Resident Portal — Flat 402, Wing B"}
                  {simulatorView === "committee" && "RWA Executive Dashboard — Prestige Lakeside CHS"}
                  {simulatorView === "guard" && "Gate #1 Security Terminal — Live Access Log"}
                </span>
              </div>
              <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-400/30">
                Simulated Sandbox
              </span>
            </div>

            {/* 1. RESIDENT APP VIEW */}
            {simulatorView === "resident" && (
              <div className="p-6 sm:p-8 bg-slate-50/50 animate-fade-in">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column: Maintenance Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
                          August 2026 Bill
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${billPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {billPaid ? "Paid & Verified" : "Due in 3 Days"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">Total Payable Amount</p>
                      <h4 className="text-3xl font-black text-slate-950 mt-1">₹4,250</h4>
                      <div className="text-[11px] text-slate-500 mt-2 space-y-1 border-t border-slate-100 pt-3">
                        <div className="flex justify-between"><span>Maintenance &amp; Sinking:</span> <span className="font-semibold">₹3,200</span></div>
                        <div className="flex justify-between"><span>Lift &amp; Diesel Generator AMC:</span> <span className="font-semibold">₹650</span></div>
                        <div className="flex justify-between"><span>GST @ 18%:</span> <span className="font-semibold">₹400</span></div>
                      </div>
                    </div>

                    <div className="mt-6">
                      {billPaid ? (
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-bold justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Receipt #REC-2026-894 Generated</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setBillPaid(true)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Wallet className="w-4 h-4" /> Pay ₹4,250 via UPI / Card
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Gate Approvals */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Gate Activity</span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Gate 1
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                            SW
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">Swiggy Delivery Partner</p>
                            <p className="text-[11px] text-slate-500">Order for Flat 402 • At Entrance</p>
                          </div>
                        </div>

                        {gateApproved ? (
                          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Approved: OTP sent to Guard
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => setGateApproved(true)}
                              className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold active:scale-95 transition-all cursor-pointer"
                            >
                              Approve Entry
                            </button>
                            <button
                              onClick={() => setGateApproved(false)}
                              className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-700">Maid (Kamla Devi)</span>
                          <span className="text-[11px] font-bold text-emerald-600">Checked-in 08:30 AM</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5">
                          <span className="font-semibold text-slate-700">Guest Pass #8920</span>
                          <span className="text-[11px] font-bold text-slate-400">Valid till 10:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Complaints & Notice */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-4">
                        Active Helpdesk &amp; Notice
                      </span>

                      {/* Complaint SLA Tile */}
                      <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 mb-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-indigo-900">#TCK-482 Plumber Assigned</span>
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">In Progress</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">Bathroom leakage inspection scheduled</p>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 mt-2">
                          <Clock className="w-3.5 h-3.5" /> SLA Timer: 1h 40m left
                        </div>
                      </div>

                      {/* Notice Board Preview */}
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                        <div className="flex items-center gap-1.5 text-amber-800 text-xs font-extrabold mb-1">
                          <Bell className="w-3.5 h-3.5 text-amber-600" /> RWA Water Supply Notice
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Overhead tank cleaning tomorrow (10 AM to 1 PM). Kindly store sufficient water.
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 text-center mt-3 font-semibold">
                      Press buttons above to test live resident interactions
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RWA COMMITTEE COMMAND CENTER */}
            {simulatorView === "committee" && (
              <div className="p-6 sm:p-8 bg-slate-900 text-white animate-fade-in">
                {/* Metrics Row */}
                <div className="grid sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                    <p className="text-xs font-bold text-slate-400 uppercase">August Collection</p>
                    <h5 className="text-2xl font-black text-emerald-400 mt-1">₹28,40,000</h5>
                    <p className="text-[11px] text-slate-400 mt-1">98.3% target achieved</p>
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                    <p className="text-xs font-bold text-slate-400 uppercase">Pending Defaulters</p>
                    <h5 className="text-2xl font-black text-rose-400 mt-1">4 Flats</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Total pending: ₹17,000</p>
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                    <p className="text-xs font-bold text-slate-400 uppercase">Pending Approvals</p>
                    <h5 className="text-2xl font-black text-amber-400 mt-1">2 Vouchers</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Maker-Checker queue</p>
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                    <p className="text-xs font-bold text-slate-400 uppercase">Tally Sync Status</p>
                    <h5 className="text-2xl font-black text-cyan-400 mt-1">Synced</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Ready for CA export</p>
                  </div>
                </div>

                {/* Command Actions Row */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="text-base font-black">Defaulter Recovery &amp; Automated Ledger Actions</h4>
                      <p className="text-xs text-slate-400">Send polite WhatsApp &amp; SMS reminders with instant UPI payment links</p>
                    </div>

                    <div className="flex gap-3">
                      {nudgeSent ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> 4 WhatsApp Reminders Sent!
                        </div>
                      ) : (
                        <button
                          onClick={() => setNudgeSent(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/25"
                        >
                          <Send className="w-3.5 h-3.5" /> 1-Click WhatsApp Nudge
                        </button>
                      )}

                      <button
                        onClick={() => alert("Simulated: Tally Prime XML accounting export generated and downloaded!")}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Tally XML
                      </button>
                    </div>
                  </div>

                  {/* Defaulter Table Mini Preview */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700 pb-2">
                          <th className="py-2">Flat No.</th>
                          <th className="py-2">Owner Name</th>
                          <th className="py-2">Overdue Amount</th>
                          <th className="py-2">Days Overdue</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60">
                        <tr>
                          <td className="py-2.5 font-bold text-white">Flat 102-A</td>
                          <td className="py-2.5 text-slate-300">Sunil Deshmukh</td>
                          <td className="py-2.5 font-bold text-rose-400">₹4,250</td>
                          <td className="py-2.5 text-slate-400">12 days</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">Overdue</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">Flat 304-C</td>
                          <td className="py-2.5 text-slate-300">Pooja Singhania</td>
                          <td className="py-2.5 font-bold text-rose-400">₹4,250</td>
                          <td className="py-2.5 text-slate-400">8 days</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">Overdue</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SECURITY GUARD GATE TABLET */}
            {simulatorView === "guard" && (
              <div className="p-6 sm:p-8 bg-slate-950 text-white animate-fade-in">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Gate Search Box */}
                  <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-extrabold text-sm text-white">Main Entrance — Security Terminal</h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                        Gate Guard: Ram Singh (On Duty)
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Verify Visitor OTP</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP..."
                            defaultValue="849201"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <button
                            onClick={() => alert("Verified: Visitor allowed for Flat 502-A")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Verify
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle License Plate Lookup</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="MH 02 XX 1234"
                            defaultValue="MH 12 AB 4589"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <button
                            onClick={() => alert("Allocated Slot: B-24 (Flat 402)")}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Check
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Access Stream */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Check-in Stream</p>
                      {[
                        { name: "Urban Company (Electrician)", flat: "Flat 201-B", time: "2 mins ago", badge: "Approved by Resident" },
                        { name: "Amazon Logistics (Delivery)", flat: "Flat 604-A", time: "6 mins ago", badge: "OTP Validated" },
                        { name: "School Bus #14 (Pickup)", flat: "All Wings", time: "15 mins ago", badge: "Regular Entry" },
                      ].map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
                          <div>
                            <span className="font-bold text-white">{log.name}</span>
                            <span className="text-slate-400 ml-2 font-medium">({log.flat})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-[11px]">{log.time}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">{log.badge}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Daily Staff Quick Tap */}
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-white mb-2">Staff &amp; Maid QR Tap</h4>
                      <p className="text-xs text-slate-400 mb-4">Tap to mark instant In/Out without typing</p>

                      <div className="space-y-2.5">
                        {[
                          { name: "Kamla Devi (Maid)", role: "Flats: 402, 404, 501", status: "Inside" },
                          { name: "Shankar (Driver)", role: "Flat: 301-A", status: "Inside" },
                          { name: "Ramesh (Gardener)", role: "Society Campus", status: "Logged Out" },
                        ].map((staff, sIdx) => (
                          <div key={sIdx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{staff.name}</p>
                              <p className="text-[10px] text-slate-400">{staff.role}</p>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${staff.status === "Inside" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                              {staff.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                      Offline Mode Available • Battery Friendly
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CLIENT REPUTATION BANNER ─────────────────────────────────────────── */}
      <div className="relative z-10 py-10 bg-slate-900 overflow-hidden border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-6">
            Empowering Modern Housing Societies &amp; Prestigious Complexes Across India
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-14 md:gap-20 opacity-70">
            {["LODHA RESIDENCY", "PRESTIGE ENCLAVE", "GODREJ GARDENS", "DLF APARTMENTS", "BRIGADE HORIZON", "SOBHA EMERALD"].map((name) => (
              <div key={name} className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-default">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-black text-xs tracking-widest">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── REAL-TIME RWA ROI & SAVINGS CALCULATOR ────────────────────────────── */}
      <section id="calculator" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider mb-4 border border-indigo-200">
            <Calculator className="w-3.5 h-3.5" /> Interactive ROI Calculator
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            See Exactly How Much Your Society Will Save
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4">
            Adjust the sliders according to your society&apos;s size to calculate recovered defaulter collections and saved committee hours.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-12 max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Slider 1: Flats */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-extrabold text-slate-900">
                    Total Flats / Apartments in Society
                  </label>
                  <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-xl border border-indigo-100">
                    {calcFlats} Units
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="5"
                  value={calcFlats}
                  onChange={(e) => setCalcFlats(Number(e.target.value))}
                  className="w-full cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 font-semibold mt-1.5">
                  <span>20 Units</span>
                  <span>150 Units</span>
                  <span>300 Units</span>
                  <span>500+ Units</span>
                </div>
              </div>

              {/* Slider 2: Fee */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-extrabold text-slate-900">
                    Average Monthly Maintenance per Flat
                  </label>
                  <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-xl border border-indigo-100">
                    ₹{calcFee.toLocaleString("en-IN")} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="1500"
                  max="15000"
                  step="100"
                  value={calcFee}
                  onChange={(e) => setCalcFee(Number(e.target.value))}
                  className="w-full cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 font-semibold mt-1.5">
                  <span>₹1,500</span>
                  <span>₹5,000</span>
                  <span>₹10,000</span>
                  <span>₹15,000+</span>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Calculated based on real Indian RWA metrics: automated UPI payment reminders on WhatsApp recover an average of 11.5% in delayed payments within 60 days.
                </p>
              </div>
            </div>

            {/* Right Output Card (5 Cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 border border-indigo-800/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/20">
                Estimated Annual Impact
              </span>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Estimated Defaulter Recovery / Mo</p>
                  <h3 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                    +₹{estimatedRecovery.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">₹{(estimatedRecovery * 12).toLocaleString("en-IN")} additional cashflow per year</p>
                </div>

                <div className="pt-4 border-t border-indigo-900/80">
                  <p className="text-xs font-semibold text-slate-400">Committee Admin Time Saved</p>
                  <h4 className="text-2xl font-black text-cyan-300 mt-1">
                    ~{hoursSaved} Hours / Month
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">Eliminates manual bill generation, ledger writing, and paper receipts</p>
                </div>

                <div className="pt-4 border-t border-indigo-900/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Estimated ROI</p>
                    <p className="text-xl font-black text-amber-400">{netRoiMultiplier}x Return</p>
                  </div>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-black text-xs hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer shadow-lg"
                  >
                    Lock In Trial
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 py-16 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Societies", target: 500, suffix: "+", color: "text-indigo-600" },
            { label: "Happy Residents", target: 85000, suffix: "+", color: "text-emerald-600" },
            { label: "Maintenance Processed", target: 500, prefix: "₹", suffix: " Cr+", color: "text-violet-600" },
            { label: "Complaints Resolved", target: 48000, suffix: "+", color: "text-rose-600" },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className={`text-4xl sm:text-5xl font-black tracking-tight mb-1.5 ${item.color}`}>
                <Counter target={item.target} suffix={item.suffix} prefix={item.prefix} />
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CORE MODULES & FEATURES (FILTERABLE) ─────────────────────────────── */}
      <section id="features" className="relative z-10 py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider mb-4 border border-indigo-200">
            <Zap className="w-3.5 h-3.5" /> Complete Society Operating System
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Built for Real Indian RWAs. <span className="text-indigo-600">Zero Chaos.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-4">
            Everything your managing committee, residents, and security team need in one modular platform.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {MODULE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-13 h-13 rounded-2xl ${feat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-950 mb-2 leading-snug">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {feat.stat}
                </span>
                <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer">
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SIDE-BY-SIDE COMPETITIVE COMPARISON ───────────────────────────────── */}
      <section id="comparison" className="relative z-10 py-24 bg-white border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Transparent Comparison
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight mt-3">
              Why Societies Are Leaving Outdated Tools
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3">
              See how AapkiSociety outperforms WhatsApp groups, Excel sheets, and intrusive legacy apps.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-x-auto shadow-md">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80">
                  <th className="p-5 text-sm font-black text-slate-900">Critical Capabilities</th>
                  <th className="p-5 text-sm font-black text-indigo-700 bg-indigo-50/80 border-x border-indigo-200/80">
                    AapkiSociety OS
                  </th>
                  <th className="p-5 text-sm font-bold text-slate-600">WhatsApp &amp; Excel Sheets</th>
                  <th className="p-5 text-sm font-bold text-slate-600">Legacy Commercial Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {[
                  {
                    feat: "100% Ad-Free & Data Private (DPDP Act 2023)",
                    as: true,
                    wa: false,
                    leg: false,
                    note: "No commercial spam or resident data monetization",
                  },
                  {
                    feat: "Direct 1-Click Tally Prime & ERP Export",
                    as: true,
                    wa: false,
                    leg: false,
                    note: "Save chartered accountant hours without re-entry",
                  },
                  {
                    feat: "Maker-Checker Financial Approval Governance",
                    as: true,
                    wa: false,
                    leg: false,
                    note: "Dual authorization prevents unauthorized expenses",
                  },
                  {
                    feat: "Automated GST & TDS Invoicing with UPI Receipts",
                    as: true,
                    wa: false,
                    leg: true,
                    note: "Instant ledger and bank reconciliation updates",
                  },
                  {
                    feat: "Dedicated SLA Timers for Lift/Plumber Helpdesk",
                    as: true,
                    wa: false,
                    leg: true,
                    note: "Overdue complaints automatically escalate",
                  },
                  {
                    feat: "Paid Society Flat Listings (Sale / Rent)",
                    as: true,
                    wa: false,
                    leg: false,
                    note: "Generate income for the society with zero broker spam",
                  },
                  {
                    feat: "Transparent, Predictable Per-Flat Pricing",
                    as: true,
                    wa: true,
                    leg: false,
                    note: "No hidden hardware lock-ins or surprise fees",
                  },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-100/50 transition-colors">
                    <td className="p-5">
                      <div className="font-extrabold text-slate-900">{row.feat}</div>
                      <div className="text-xs text-slate-500">{row.note}</div>
                    </td>

                    {/* AapkiSociety Column */}
                    <td className="p-5 bg-indigo-50/50 border-x border-indigo-200/70 font-bold text-indigo-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <span className="font-black text-indigo-950">Full Native Support</span>
                      </div>
                    </td>

                    {/* WhatsApp/Excel Column */}
                    <td className="p-5 text-slate-500">
                      {row.wa ? (
                        <span className="text-slate-700 font-semibold flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Free / Manual</span>
                      ) : (
                        <span className="text-rose-500 font-semibold flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> Impossible</span>
                      )}
                    </td>

                    {/* Legacy Apps Column */}
                    <td className="p-5 text-slate-500">
                      {row.leg ? (
                        <span className="text-slate-700 font-semibold flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Partial / Add-on</span>
                      ) : (
                        <span className="text-rose-500 font-semibold flex items-center gap-1.5"><X className="w-4 h-4 text-rose-500" /> No Support</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── BANK-GRADE SECURITY & DATA PRIVACY SHIELD ────────────────────────── */}
      <section id="security" className="relative z-10 py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Dark Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white border border-indigo-900/60 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center mb-6 text-indigo-400">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                Bank-Grade Security for Your Community
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Your society&apos;s financial records, resident contact directories, and entrance logs are protected with the same stringent encryption trusted by leading Indian financial institutions.
              </p>

              <ul className="space-y-4 text-sm font-semibold">
                {[
                  "256-bit AES Encryption for data at rest and in transit",
                  "Strict compliance with India's Digital Personal Data Protection (DPDP) Act 2023",
                  "Zero Data Mining: We never sell resident numbers or push ad spam",
                  "Masked Phone Relay: Security guards & delivery boys cannot see resident mobile numbers",
                  "Automated daily encrypted database backups with 30-day snapshot retention",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider border border-indigo-200">
              <Lock className="w-3.5 h-3.5" /> 100% Data Sovereignty
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              Your Society&apos;s Data Belongs Strictly to You.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Traditional &ldquo;free&rdquo; society management apps monetize your residents through unsolicited loan offers, local business popups, and intrusive marketing calls.
            </p>

            <p className="text-base text-slate-600 leading-relaxed">
              AapkiSociety is a paid B2B operating system. <strong className="text-slate-900 font-bold">You are our customer, never our product.</strong> We store all tenant records in dedicated, isolated schemas within Indian cloud data centers (AWS Mumbai).
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-sm font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>ISO 27001 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-cyan-600" />
                <span>Indian Rupee Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VERIFIED RWA TESTIMONIALS ────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full">
              Real Case Studies
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight mt-3">
              Trusted by 500+ RWA Presidents &amp; Treasurers
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3">
              Hear directly from managing committee members who transformed their communities with AapkiSociety.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>

                  <div className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full inline-block mb-4">
                    {t.highlight}
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed italic mb-8">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-6 border-t border-slate-100">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-950 leading-tight">{t.name}</h4>
                    <p className="text-xs text-indigo-600 font-bold mt-0.5">{t.role}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{t.society} • {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSPARENT PRICING WITH MONTHLY / ANNUAL SWITCH ─────────────────── */}
      <section id="pricing" className="relative z-10 py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Predictable Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight mt-3">
            Simple Per-Flat Pricing. No Hidden Setup Fees.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            Includes all modules, unlimited residents, free data migration from Excel, and mobile apps.
          </p>

          {/* Billing Switch Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-slate-200/80 p-1.5 rounded-full border border-slate-300">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                !annualBilling ? "bg-white text-indigo-600 shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                annualBilling ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                Save 17% (2 Mo Free)
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan 1: Core */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950 mb-2">Core OS</h3>
              <p className="text-xs text-slate-500 mb-6">Essential gate, billing, and resident communication for small to medium societies.</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-slate-950">
                  ₹{annualBilling ? 25 : 30}
                </span>
                <span className="text-xs font-bold text-slate-500">/ flat / month</span>
              </div>

              <ul className="space-y-3.5 text-xs font-semibold text-slate-700 mb-8 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Smart Gate &amp; Visitor OTP Pass</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Automated Maintenance Invoices</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Digital Notice Board &amp; Polls</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Resident Mobile App (Android &amp; iOS)</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Free Historical Excel Data Import</li>
              </ul>
            </div>

            <Link
              href="/register?plan=core"
              className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs text-center block transition-all active:scale-95"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Plan 2: Compliance (POPULAR) */}
          <div className="relative bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 border-2 border-indigo-500 shadow-2xl shadow-indigo-600/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black rounded-full uppercase tracking-wider shadow-md">
              Most Popular Choice
            </div>

<div>
              <h3 className="text-xl font-black text-white mb-2">Compliance OS</h3>
              <p className="text-xs text-indigo-200 mb-6">Complete financial governance, GST/TDS engine, and Tally Prime sync for audit-ready societies.</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  ₹{annualBilling ? 42 : 50}
                </span>
                <span className="text-xs font-bold text-indigo-200">/ flat / month</span>
              </div>

              <ul className="space-y-3.5 text-xs font-semibold text-slate-200 mb-8 border-t border-indigo-800 pt-6">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Everything in Core OS</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> 1-Click Tally Prime &amp; ERP XML Sync</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Automated GST &amp; TDS Tax Engine</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Maker-Checker Dual Financial Approval</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Helpdesk SLA Timers &amp; Escalation</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Paid Society Property Listings</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Dual-Format Excel &amp; PDF Audit Reports</li>
              </ul>
            </div>

            <Link
              href="/register?plan=compliance"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-black text-xs text-center block shadow-lg shadow-indigo-500/40 active:scale-95 transition-all"
            >
              Start 30-Day Free Trial
            </Link>
          </div>

          {/* Plan 3: AI Pro */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950 mb-2">AI Pro OS</h3>
              <p className="text-xs text-slate-500 mb-6">For large residential complexes desiring predictive AI analytics, 50GB vault, and dedicated support.</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-slate-950">
                  ₹{annualBilling ? 66 : 80}
                </span>
                <span className="text-xs font-bold text-slate-500">/ flat / month</span>
              </div>

              <ul className="space-y-3.5 text-xs font-semibold text-slate-700 mb-8 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Everything in Compliance OS</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> AI Anomaly Detection in Society Expenses</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 24x7 Conversational Society AI Assistant</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 50 GB Encrypted Document Storage</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated Relationship Manager</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Custom Bye-Law Workflow Configuration</li>
              </ul>
            </div>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs text-center block transition-all active:scale-95 cursor-pointer"
            >
              Talk to Enterprise Team
            </button>
          </div>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (ACCORDION) ───────────────────────────── */}
      <section id="faq" className="relative z-10 py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight mt-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-600 mt-2">
              Everything RWA managing committees need to know before joining.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-extrabold text-slate-900 text-base hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${activeFaq === idx ? "bg-indigo-50 text-indigo-600 rotate-180" : "bg-slate-100 text-slate-500"}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {activeFaq === idx && (
                  <div className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIGH-CONVERSION FINAL CALL-TO-ACTION ─────────────────────────────── */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-10 sm:p-16 text-center text-white shadow-[0_30px_90px_rgba(79,70,229,0.25)] border border-indigo-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="relative w-16 h-16 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30 mx-auto mb-6 bg-white p-1">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src="/aapp.jpeg"
                  alt="AapkiSociety Logo"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Ready to Upgrade Your Housing Society?
            </h2>

            <p className="text-base sm:text-lg text-indigo-100 font-medium leading-relaxed mb-8">
              Join 500+ forward-thinking RWAs who eliminated committee disputes, automated billing, and delivered a 5-star living experience to their residents. Setup takes under 30 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Register Society (30 Days Free)</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-extrabold text-base border border-indigo-400/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-5 h-5" /> Talk to an Onboarding Specialist
              </button>
            </div>

            <p className="text-xs text-indigo-300 font-semibold mt-6">
              Zero Credit Card Required • Full Feature Access • 100% Data Export Guarantee
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand Col (2 cols on lg) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg border border-slate-700/60 bg-white shrink-0">
                  <Image
                    src="/aapp.jpeg"
                    alt="AapkiSociety Logo"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <span className="text-xl font-black text-white">Aapki<span className="text-indigo-400">Society</span></span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-normal max-w-sm mb-6">
                India&apos;s leading platform-driven Housing Society OS. Built to empower managing committees with 100% financial transparency, bank-grade data security, and effortless gate governance.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-full w-fit">
                <ShieldCheck className="w-4 h-4" />
                <span>ISO 27001 Certified &amp; Indian Data Sovereignty</span>
              </div>
            </div>

            {/* Links 1: Platform */}
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Automated GST Billing</a></li>
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Smart Gate Security</a></li>
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Tally Prime Export</a></li>
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Helpdesk &amp; SLA Timers</a></li>
                <li><a href="#features" className="hover:text-indigo-400 transition-colors">Property Listings</a></li>
                <li><a href="#calculator" className="hover:text-indigo-400 transition-colors">ROI Calculator</a></li>
              </ul>
            </div>

            {/* Links 2: Solutions */}
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">Solutions</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/register" className="hover:text-indigo-400 transition-colors">Cooperative Housing (CHS)</a></li>
                <li><a href="/register" className="hover:text-indigo-400 transition-colors">Apartment Associations (AOA)</a></li>
                <li><a href="/register" className="hover:text-indigo-400 transition-colors">Resident Welfare (RWA)</a></li>
                <li><a href="/register" className="hover:text-indigo-400 transition-colors">Chartered Accountants &amp; CAs</a></li>
                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing Plans</a></li>
              </ul>
            </div>

            {/* Links 3: Trust & Legal */}
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">Compliance</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/data-deletion" className="hover:text-indigo-400 transition-colors">Data Deletion Policy</Link></li>
                <li><a href="#security" className="hover:text-indigo-400 transition-colors">DPDP Act 2023 Guidelines</a></li>
                <li><a href="#security" className="hover:text-indigo-400 transition-colors">Security Architecture</a></li>
                <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Platform Admin Portal</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <p>© {new Date().getFullYear()} AapkiSociety. All rights reserved. Powered by <span className="text-indigo-400 font-bold">Datatrack</span>.</p>
            <div className="flex items-center gap-4">
              <span>Made with ❤️ for Housing Societies across India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── INTERACTIVE "BOOK A LIVE DEMO" MODAL ──────────────────────────────── */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {demoSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Demo Scheduled!</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
                  Thank you! Our RWA specialist will call you shortly on <strong>{demoForm.phone || "your number"}</strong> to walk through your society setup.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Walkthrough requested &amp; team notified
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white shrink-0">
                      <Image
                        src="/aapp.jpeg"
                        alt="AapkiSociety Logo"
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                      1-on-1 Personalized Walkthrough
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 mt-2">
                    Book a Live AapkiSociety Demo
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    See how your society can automate billing, gate, and accounting in under 30 minutes.
                  </p>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block mb-1">Society Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prestige Lakeside CHS"
                      value={demoForm.societyName}
                      onChange={(e) => setDemoForm({ ...demoForm, societyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mumbai / Pune"
                        value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Total Flats / Units *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 120"
                        value={demoForm.flatCount}
                        onChange={(e) => setDemoForm({ ...demoForm, flatCount: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Sharma"
                        value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block">Phone Number (WhatsApp) *</label>
                        {demoForm.phone.trim() && (
                          <span className={`text-[10px] ${normalizePhone(demoForm.phone).isValid ? 'text-emerald-600 font-bold' : 'text-amber-600 font-medium'}`}>
                            {normalizePhone(demoForm.phone).isValid ? `✓ ${normalizePhone(demoForm.phone).display}` : 'Enter 10 digits (e.g. 98200...)'}
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9820012345, 098200... or +91..."
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. secretary@society.com"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDemo}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all mt-2 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submittingDemo ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Scheduling Demo &amp; Notifying Team...
                      </>
                    ) : (
                      "Confirm & Schedule Demo"
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center font-normal">
                    By submitting, you agree to receive a demo confirmation on WhatsApp/Call. No spam.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
