"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ArrowUpRight, ArrowUp, Building2, Shield, CheckCircle2,
  PhoneCall, Wallet, Star, Lock, Smartphone, ShieldCheck,
  TrendingUp, Bell, Car, Vote, ChevronDown, ChevronLeft,
  Check, X, Download, MessageCircle, Apple, Play, ChevronsLeftRight,
  HelpCircle, Sparkles, Menu, ChevronRight, Send,
  Landmark, Clock, BadgeCheck, QrCode, Fingerprint, IndianRupee,
} from "lucide-react";
import { demoAPI } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";

/* ═══════════════════════════════════════════════════════════════════
   AapkiSociety — "Alpine White & Royal Blue" landing system
   Light, premium, research-backed (SaaS Hero 2026 + Awwwards craft):
   sky-mesh hero · navy serif display · seamless marquee ·
   before/after narrative · bento grid · interactive demo ·
   comparison proof · scroll reveals · hairline details.
   ═══════════════════════════════════════════════════════════════════ */

const NAVY = "#0A1C3F";

// ─── Scroll Reveal ───────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ─── Cursor spotlight for cards ──────────────────────────────────────
function handleSpot(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
  el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
}

// ─── Animated Counter ────────────────────────────────────────────────
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1400;
        const steps = 48;
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
    <span ref={ref} className="tnum">
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

// ─── Eyebrow label (numbered, editorial) ─────────────────────────────
function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] ${
        dark ? "text-sky-300" : "text-blue-700"
      }`}
    >
      <span className={`h-px w-8 ${dark ? "bg-sky-300/60" : "bg-blue-700/40"}`} aria-hidden="true" />
      {children}
      <span className={`h-px w-8 ${dark ? "bg-sky-300/60" : "bg-blue-700/40"}`} aria-hidden="true" />
    </span>
  );
}

// ─── Feature data (bento) ────────────────────────────────────────────
const MODULE_CATEGORIES = [
  { id: "all", label: "All Modules" },
  { id: "billing", label: "Billing & Finance" },
  { id: "gate", label: "Gate & Security" },
  { id: "helpdesk", label: "Complaints & SLA" },
  { id: "accounting", label: "Tally & Audit" },
  { id: "governance", label: "Governance & Polls" },
  { id: "listings", label: "Property Listings" },
];

type VisualKind = "bars" | "otp" | "tally" | "sla" | "vote" | "listing" | "ledger" | "parking" | "notice";

const FEATURES: {
  category: string;
  icon: typeof Wallet;
  visual: VisualKind;
  badge: string;
  title: string;
  desc: string;
  stat: string;
  span: string;
}[] = [
  {
    category: "billing",
    icon: Wallet,
    visual: "bars",
    badge: "GST Compliant",
    title: "Automated Maintenance & GST Invoicing",
    desc: "Recurring monthly bills with custom heads, late-penalty interest and automatic TDS. One-click digital receipts residents actually pay on time.",
    stat: "98.4% on-time collections",
    span: "md:col-span-4",
  },
  {
    category: "gate",
    icon: Shield,
    visual: "otp",
    badge: "Instant Pass",
    title: "Smart Gate & Visitor Management",
    desc: "OTP & QR approvals for guests, deliveries and cabs. Maid, driver and staff attendance with real-time push alerts.",
    stat: "Zero unverified entries",
    span: "md:col-span-2",
  },
  {
    category: "accounting",
    icon: Landmark,
    visual: "tally",
    badge: "New in v4.0",
    title: "1-Click Tally Prime & ERP Export",
    desc: "Member ledgers, receipt vouchers and expense books synced straight into Tally XML. Your CA audits without double data entry.",
    stat: "75% CA audit time saved",
    span: "md:col-span-2",
  },
  {
    category: "helpdesk",
    icon: CheckCircle2,
    visual: "sla",
    badge: "SLA Timers",
    title: "Helpdesk with SLA Escalation",
    desc: "Plumbing, electrical and lift tickets with photo evidence. Overdue issues auto-escalate to the committee.",
    stat: "Avg. 3.2 hr resolution",
    span: "md:col-span-2",
  },
  {
    category: "governance",
    icon: Vote,
    visual: "vote",
    badge: "Democracy",
    title: "Digital AGM Voting & Live Polls",
    desc: "Elections, budget approvals and opinion polls with tamper-proof audit trails the whole society can trust.",
    stat: "100% quorum transparency",
    span: "md:col-span-2",
  },
  {
    category: "listings",
    icon: Building2,
    visual: "listing",
    badge: "Monetised",
    title: "Verified Society Property Listings",
    desc: "Sale and rental classifieds posted by verified owners. The society earns per listing — zero broker spam.",
    stat: "Direct owner connect",
    span: "md:col-span-2",
  },
  {
    category: "billing",
    icon: TrendingUp,
    visual: "ledger",
    badge: "Maker-Checker",
    title: "Dual-Approval Financial Governance",
    desc: "Treasurer prepares (Maker), Secretary or President approves (Checker). No fraud, no unauthorised cash expenses.",
    stat: "100% audit protection",
    span: "md:col-span-2",
  },
  {
    category: "gate",
    icon: Car,
    visual: "parking",
    badge: "RFID Ready",
    title: "Parking Slot & Vehicle Allocation",
    desc: "Covered and open slots mapped to flats. Visitor vehicles, EV points and an end to parking disputes.",
    stat: "Zero slot clashes",
    span: "md:col-span-2",
  },
  {
    category: "governance",
    icon: Bell,
    visual: "notice",
    badge: "Real-time",
    title: "Digital Notice Board & Scroller",
    desc: "Water-cutoff alerts, event invites and circulars over app push, SMS and WhatsApp — in one broadcast.",
    stat: "10x reach vs WhatsApp",
    span: "md:col-span-6",
  },
];

// ─── Mini bento visuals (pure CSS, no network) ───────────────────────
function BentoVisual({ kind }: { kind: VisualKind }) {
  if (kind === "bars")
    return (
      <div className="flex items-end gap-1.5 h-16 mt-6" aria-hidden="true">
        {[38, 62, 45, 78, 56, 92, 70, 100, 64, 84, 52, 74].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-t-md ${i === 7 ? "bg-gradient-to-t from-blue-700 to-sky-400" : "bg-[#0A1C3F]/10"}`}
          />
        ))}
      </div>
    );
  if (kind === "otp")
    return (
      <div className="flex gap-2 mt-6" aria-hidden="true">
        {["8", "4", "9", "2", "0", "1"].map((d, i) => (
          <div
            key={i}
            className={`w-9 h-11 rounded-xl border flex items-center justify-center text-sm font-bold tnum ${
              i < 4 ? "bg-[#0A1C3F] text-white border-[#0A1C3F] shadow-md shadow-blue-900/20" : "bg-white text-[#0A1C3F]/35 border-[#0A1C3F]/15"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    );
  if (kind === "tally")
    return (
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#0B2A6B] to-[#081738] text-white p-4 flex items-center justify-between shadow-lg shadow-blue-900/25" aria-hidden="true">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-sky-300 font-bold">Tally Prime XML</p>
          <p className="text-sm font-bold mt-0.5 tnum">248 vouchers · Ready</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-200 bg-emerald-400/15 border border-emerald-300/30 px-2.5 py-1 rounded-full">
          <Check className="w-3.5 h-3.5" /> Synced
        </span>
      </div>
    );
  if (kind === "sla")
    return (
      <div className="mt-6 flex items-center gap-4" aria-hidden="true">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-[6px] border-[#0A1C3F]/10" />
          <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-blue-600 border-r-sky-400 rotate-45" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black tnum text-[#0A1C3F]">1h</div>
        </div>
        <div className="text-xs font-semibold text-[#0A1C3F]/60">
          <p className="font-bold text-[#0A1C3F]">#TCK-482 · Plumber en route</p>
          <p className="mt-1">Auto-escalates if breached</p>
        </div>
      </div>
    );
  if (kind === "vote")
    return (
      <div className="mt-6 space-y-2.5" aria-hidden="true">
        {[
          { label: "Approve annual budget", pct: 82 },
          { label: "EV charging in B-block", pct: 64 },
        ].map((p, i) => (
          <div key={i}>
            <div className="flex justify-between text-[11px] font-bold text-[#0A1C3F]/70 mb-1">
              <span>{p.label}</span>
              <span className="tnum">{p.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#0A1C3F]/10 overflow-hidden">
              <div style={{ width: `${p.pct}%` }} className={`h-full rounded-full ${i === 0 ? "bg-gradient-to-r from-blue-700 to-sky-400" : "bg-[#0A1C3F]"}`} />
            </div>
          </div>
        ))}
      </div>
    );
  if (kind === "listing")
    return (
      <div className="mt-6 flex flex-wrap gap-2" aria-hidden="true">
        <span className="text-[11px] font-bold bg-[#0A1C3F] text-white px-3 py-1.5 rounded-full">3BHK · For Sale</span>
        <span className="text-[11px] font-bold bg-white border border-[#0A1C3F]/15 text-[#0A1C3F]/70 px-3 py-1.5 rounded-full">2BHK · Rent</span>
        <span className="text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full">Verified ✓</span>
      </div>
    );
  if (kind === "ledger")
    return (
      <div className="mt-6 rounded-2xl border border-[#0A1C3F]/12 overflow-hidden shadow-sm" aria-hidden="true">
        <div className="bg-[#0A1C3F] text-white text-[11px] font-bold px-4 py-2 flex justify-between">
          <span>Maker: Treasurer</span>
          <span className="text-sky-300">→ Checker: Secretary</span>
        </div>
        <div className="bg-white text-[11px] font-semibold text-[#0A1C3F]/70 px-4 py-2.5 flex justify-between">
          <span>Diesel refill · ₹18,400</span>
          <span className="text-emerald-700 font-bold">Approved</span>
        </div>
      </div>
    );
  if (kind === "parking")
    return (
      <div className="mt-6 grid grid-cols-6 gap-1.5" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`h-9 rounded-lg border text-[10px] font-black flex items-center justify-center tnum ${
              i === 3 ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30" : i % 4 === 0 ? "bg-[#0A1C3F] text-white border-[#0A1C3F]" : "bg-white border-[#0A1C3F]/15 text-[#0A1C3F]/45"
            }`}
          >
            B{i + 1}
          </div>
        ))}
      </div>
    );
  return (
    <div className="mt-6 rounded-2xl bg-blue-50/80 border border-blue-200/70 p-4 flex items-start gap-3" aria-hidden="true">
      <Bell className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
      <p className="text-xs font-semibold text-[#0A1C3F]/75 leading-relaxed">
        Overhead tank cleaning tomorrow, 10 AM – 1 PM. Pushed to <strong>1,240 residents</strong> via app + SMS + WhatsApp.
      </p>
    </div>
  );
}

// ─── Testimonials & FAQs ─────────────────────────────────────────────
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

const COMPARISON_ROWS = [
  {
    feat: "100% Ad-Free & Data Private (DPDP Act 2023)",
    as: true, wa: false, leg: false,
    note: "No commercial spam or resident data monetization",
  },
  {
    feat: "Direct 1-Click Tally Prime & ERP Export",
    as: true, wa: false, leg: false,
    note: "Save chartered accountant hours without re-entry",
  },
  {
    feat: "Maker-Checker Financial Approval Governance",
    as: true, wa: false, leg: false,
    note: "Dual authorization prevents unauthorized expenses",
  },
  {
    feat: "Automated GST & TDS Invoicing with UPI Receipts",
    as: true, wa: false, leg: true,
    note: "Instant ledger and bank reconciliation updates",
  },
  {
    feat: "Dedicated SLA Timers for Lift/Plumber Helpdesk",
    as: true, wa: false, leg: true,
    note: "Overdue complaints automatically escalate",
  },
  {
    feat: "Paid Society Flat Listings (Sale / Rent)",
    as: true, wa: false, leg: false,
    note: "Generate income for the society with zero broker spam",
  },
  {
    feat: "Transparent, Predictable Per-Flat Pricing",
    as: true, wa: true, leg: false,
    note: "No hidden hardware lock-ins or surprise fees",
  },
];

const SOCIETY_NAMES = ["LODHA RESIDENCY", "PRESTIGE ENCLAVE", "GODREJ GARDENS", "DLF APARTMENTS", "BRIGADE HORIZON", "SOBHA EMERALD"];

const BAND_ITEMS = ["Maintenance Billing", "Gate Security", "Tally Export", "SLA Helpdesk", "AGM Voting", "Property Listings"];

const HEADLINE_PHRASES = [
  { lead: "runs", accent: "itself." },
  { lead: "collects", accent: "on time." },
  { lead: "guards", accent: "every gate." },
  { lead: "balances", accent: "every rupee." },
];

const HEADLINE_PHRASES_HI = [
  { lead: "खुद", accent: "चलती है।" },
  { lead: "समय पर", accent: "वसूली।" },
  { lead: "हर गेट", accent: "सुरक्षित।" },
  { lead: "पाई-पाई का", accent: "हिसाब।" },
];

// ─── Landing Hindi/English dictionary ────────────────────────────────
type Lang = "en" | "hi";
const STR: Record<Lang, Record<string, string>> = {
  en: {
    signIn: "Sign In", startTrial: "Start Free Trial", trialShort: "Trial",
    trialHero: "Start 30-Day Free Trial", bookDemo: "Book Live Demo", dashboard: "Dashboard",
    navModules: "Modules", navDemo: "Live Demo", navRoi: "ROI", navApp: "App", navWhy: "Why Us", navPricing: "Pricing", navFaq: "FAQs",
    walkthrough: "Schedule walkthrough",
    heroEyebrowA: "Built for Indian RWAs & CHSs", heroEyebrowB: "DPDP Act 2023 Compliant",
    heroStatic: "The society that",
    heroSub: "Billing, gate, helpdesk and accounts — one calm operating system replacing WhatsApp chaos, lost receipts and Excel ledgers.",
    heroCta2: "Watch It Work Live",
    trust1: "10,000+ verified residents", trust3: "ISO 27001 · AWS Mumbai",
    e01: "01 · Why societies switch", chaosT1: "From 47 unread groups", chaosT2: "one calm dashboard.",
    chaosBefore: "Before · The chaos", chaosAfter: "After · AapkiSociety", dragHint: "Drag the handle to compare",
    featE: "02 · Complete operating system", featT1: "Every committee job,", featT2: "beautifully boxed.",
    featSub: "Nine modules, one login. Filter by your society's biggest headache — billing, gate, accounts or governance.",
    simE: "03 · Don't take our word for it", simT1: "Press the buttons.", simT2: "It actually responds.",
    simSub: "A live sandbox — pick a viewpoint and try the real interactions.",
    tabResident: "Resident App", tabCommittee: "Committee Command", tabGuard: "Gate Tablet",
    calcE: "04 · Interactive ROI calculator", calcT1: "What is chaos", calcT2: "costing you?",
    calcSub: "Slide to your society's size. Watch the recovered dues add up.",
    calcFlats: "Flats / apartments in your society", calcFee: "Avg. monthly maintenance per flat",
    calcNote: "Based on real RWA data: automated UPI reminders on WhatsApp recover ~11.5% of delayed payments within 60 days.",
    calcImpact: "Estimated annual impact", calcRec: "Recovered dues / month", calcYear: "extra cashflow / year",
    calcHours: "Committee hours saved", calcRoi: "Return multiple", calcLock: "Lock In Trial",
    stat1: "Active societies", stat2: "Happy residents", stat3: "Maintenance processed", stat4: "Complaints resolved",
    appE: "05 · Resident mobile app", appT1: "Your society,", appT2: "in every pocket.",
    appSub: "The same operating system residents already love — now as a native-style app with UPI AutoPay, instant gate approvals and SOS.",
    appB1t: "UPI payments & AutoPay", appB1s: "Maintenance, NACH mandates and instant digital receipts.",
    appB2t: "One-tap gate approvals", appB2s: "Guests, deliveries, maids and drivers — from anywhere.",
    appB3t: "Complaints with photos", appB3s: "Raise tickets with evidence and watch the live SLA timer.",
    appB4t: "SOS, notices & parcels", appB4s: "Emergencies, circulars and package pickups — instantly.",
    appCta: "Get App Download Link", appNote: "Free with every trial · Android & iOS", appScan: "Personal download link on WhatsApp after signup",
    compE: "06 · Transparent comparison", compT1: "Why societies leave", compT2: "the old tools behind.",
    secE: "07 · 100% data sovereignty", secT1: "Your society's data belongs to", secT2: "you. Only you.",
    secPara: "\u201CFree\u201D apps monetise residents with loan offers and business popups. AapkiSociety is paid B2B software — you are our customer, never our product. Records live in isolated schemas inside Indian data centres.",
    testiE: "08 · Real case studies", testiT1: "Loved by the people who", testiT2: "sign the cheques.",
    priceE: "09 · Predictable pricing", priceT1: "Per flat. Per month.", priceT2: "No surprises.",
    priceSub: "All modules, unlimited residents, free Excel migration, mobile apps included.",
    monthly: "Monthly", annual: "Annual", perFlat: "/ flat / mo",
    coreBtn: "Start Free Trial", compBtn: "Start 30-Day Free Trial", aiBtn: "Talk to Enterprise Team", popular: "Most popular",
    faqE: "10 · Got questions?", faqT1: "Asked by every committee,", faqT2: "answered honestly.",
    finT1: "Give your society", finT2: "the upgrade it deserves.",
    finSub: "Join 500+ RWAs running on autopilot. Live in 48 hours — Excel import, guard training and CA handover included.",
    finCta1: "Register Society — 30 Days Free", finCta2: "Talk to a Specialist",
    finNote: "No credit card · Full access · 100% data-export guarantee",
    stickyTrial: "Start Free Trial", stickyDemo: "Live Demo",
    waTooltip: "Questions? Chat with us",
    footTag: "India's society operating system — financial transparency, bank-grade security and effortless gate governance for modern communities.",
  },
  hi: {
    signIn: "साइन इन", startTrial: "फ्री ट्रायल शुरू करें", trialShort: "ट्रायल",
    trialHero: "30-दिन का फ्री ट्रायल शुरू करें", bookDemo: "लाइव डेमो बुक करें", dashboard: "डैशबोर्ड",
    navModules: "मॉड्यूल", navDemo: "लाइव डेमो", navRoi: "ROI", navApp: "ऐप", navWhy: "क्यों हम", navPricing: "प्राइसिंग", navFaq: "सवाल-जवाब",
    walkthrough: "वॉकथ्रू शेड्यूल करें",
    heroEyebrowA: "भारतीय RWA और CHS के लिए निर्मित", heroEyebrowB: "DPDP Act 2023 अनुरूप",
    heroStatic: "वह सोसाइटी जो",
    heroSub: "बिलिंग, गेट, हेल्पडेस्क और अकाउंट — एक शांत ऑपरेटिंग सिस्टम, जो WhatsApp की अव्यवस्था, खोई रसीदों और Excel खातों की जगह लेता है।",
    heroCta2: "इसे लाइव काम करते देखें",
    trust1: "10,000+ सत्यापित निवासी", trust3: "ISO 27001 · AWS मुंबई",
    e01: "01 · सोसाइटी क्यों बदल रही हैं", chaosT1: "बिना पढ़े 47 ग्रुपों से", chaosT2: "एक शांत डैशबोर्ड तक।",
    chaosBefore: "पहले · अव्यवस्था", chaosAfter: "बाद में · AapkiSociety", dragHint: "तुलना के लिए हैंडल खींचें",
    featE: "02 · संपूर्ण ऑपरेटिंग सिस्टम", featT1: "कमेटी का हर काम,", featT2: "अब एक ही जगह।",
    featSub: "नौ मॉड्यूल, एक लॉगिन। अपनी सबसे बड़ी परेशानी चुनें — बिलिंग, गेट, अकाउंट या गवर्नेंस।",
    simE: "03 · हमारी बात पर यकीन न करें", simT1: "बटन दबाकर देखें।", simT2: "यह सच में जवाब देता है।",
    simSub: "लाइव सैंडबॉक्स — नज़रिया चुनें और असली इंटरैक्शन आज़माएं।",
    tabResident: "निवासी ऐप", tabCommittee: "कमेटी कमांड", tabGuard: "गेट टैबलेट",
    calcE: "04 · इंटरैक्टिव ROI कैलकुलेटर", calcT1: "अव्यवस्था की कीमत", calcT2: "क्या है?",
    calcSub: "अपनी सोसाइटी के आकार तक स्लाइड करें। बढ़ती वसूली खुद देखें।",
    calcFlats: "आपकी सोसाइटी में फ्लैट / अपार्टमेंट", calcFee: "प्रति फ्लैट औसत मासिक मेंटेनेंस",
    calcNote: "असली RWA डेटा पर आधारित: WhatsApp पर ऑटोमेटेड UPI रिमाइंडर 60 दिनों में ~11.5% रुका भुगतान वसूल लेते हैं।",
    calcImpact: "अनुमानित वार्षिक प्रभाव", calcRec: "वसूल बकाया / माह", calcYear: "अतिरिक्त कैशफ्लो / वर्ष",
    calcHours: "कमेटी के घंटे बचे", calcRoi: "रिटर्न गुणक", calcLock: "ट्रायल पक्का करें",
    stat1: "सक्रिय सोसाइटी", stat2: "खुश निवासी", stat3: "प्रोसेस्ड मेंटेनेंस", stat4: "सुलझी शिकायतें",
    appE: "05 · निवासी मोबाइल ऐप", appT1: "आपकी सोसाइटी,", appT2: "अब हर जेब में।",
    appSub: "वही ऑपरेटिंग सिस्टम जिसे निवासी पहले से पसंद करते हैं — अब UPI ऑटोपे, तुरंत गेट अप्रूवल और SOS के साथ ऐप में।",
    appB1t: "UPI भुगतान व ऑटोपे", appB1s: "मेंटेनेंस, NACH मैंडेट और तुरंत डिजिटल रसीद।",
    appB2t: "एक टैप में गेट अप्रूवल", appB2s: "मेहमान, डिलीवरी, मेड और ड्राइवर — कहीं से भी।",
    appB3t: "फोटो वाली शिकायतें", appB3s: "सबूत के साथ टिकट उठाएं और लाइव SLA टाइमर देखें।",
    appB4t: "SOS, नोटिस व पार्सल", appB4s: "आपात स्थिति, सूचना और पैकेज — तुरंत।",
    appCta: "ऐप डाउनलोड लिंक पाएं", appNote: "हर ट्रायल के साथ मुफ़्त · Android व iOS", appScan: "साइनअप के बाद WhatsApp पर पर्सनल डाउनलोड लिंक",
    compE: "06 · पारदर्शी तुलना", compT1: "सोसाइटी पुराने औज़ार", compT2: "क्यों छोड़ रही हैं।",
    secE: "07 · 100% डेटा संप्रभुता", secT1: "आपकी सोसाइटी का डेटा", secT2: "सिर्फ़ आपका है।",
    secPara: "\u201Cमुफ़्त\u201D ऐप लोन ऑफर और व्यापारिक पॉपअप से निवासियों से कमाते हैं। AapkiSociety पेड B2B सॉफ्टवेयर है — आप हमारे ग्राहक हैं, प्रोडक्ट कभी नहीं। रिकॉर्ड भारतीय डेटा सेंटरों में अलग स्कीमा में रहते हैं।",
    testiE: "08 · असली केस स्टडी", testiT1: "उन लोगों के प्रिय जो", testiT2: "चेक पर दस्तख़त करते हैं।",
    priceE: "09 · अनुमानित प्राइसिंग", priceT1: "प्रति फ्लैट। प्रति माह।", priceT2: "कोई छिपा खर्च नहीं।",
    priceSub: "सभी मॉड्यूल, असीमित निवासी, मुफ़्त Excel माइग्रेशन, मोबाइल ऐप शामिल।",
    monthly: "मासिक", annual: "वार्षिक", perFlat: "/ फ्लैट / माह",
    coreBtn: "फ्री ट्रायल शुरू करें", compBtn: "30-दिन का फ्री ट्रायल", aiBtn: "एंटरप्राइज़ टीम से बात करें", popular: "सबसे लोकप्रिय",
    faqE: "10 · सवाल हैं?", faqT1: "हर कमेटी पूछती है,", faqT2: "ईमानदार जवाब पाएं।",
    finT1: "अपनी सोसाइटी को दें", finT2: "वह अपग्रेड जिसकी वह हकदार है।",
    finSub: "48 घंटों में लाइव — Excel इम्पोर्ट, गार्ड ट्रेनिंग और CA हैंडओवर सहित, 500+ RWA से जुड़ें जो ऑटोपायलट पर चल रहे हैं।",
    finCta1: "सोसाइटी रजिस्टर करें — 30 दिन मुफ़्त", finCta2: "विशेषज्ञ से बात करें",
    finNote: "कोई क्रेडिट कार्ड नहीं · पूर्ण एक्सेस · 100% डेटा-एक्सपोर्ट गारंटी",
    stickyTrial: "फ्री ट्रायल", stickyDemo: "लाइव डेमो",
    waTooltip: "सवाल हैं? हमसे बात करें",
    footTag: "भारत का सोसाइटी ऑपरेटिंग सिस्टम — आधुनिक समुदायों के लिए वित्तीय पारदर्शिता, बैंक-ग्रेड सुरक्षा और सहज गेट गवर्नेंस।",
  },
};

// ─── CTA analytics (GTM-ready dataLayer) ─────────────────────────────
function trackCTA(label: string) {
  try {
    const w = window as unknown as { dataLayer?: Record<string, string>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: "cta_click", label });
  } catch {
    /* analytics unavailable — never break UX */
  }
}

// ─── Brand preloader ─────────────────────────────────────────────────
function Preloader({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 550);
    return () => clearTimeout(id);
  }, [done]);
  if (gone) return null;
  return (
    <div
      className={`preloader-shell fixed inset-0 z-[100] bg-[#F7FAFF] flex flex-col items-center justify-center gap-5 ${done ? "preloader-hide" : ""}`}
      role="status"
      aria-label="Loading AapkiSociety"
    >
      <div className="loader-logo relative w-16 h-16 rounded-2xl overflow-hidden border border-blue-100 shadow-xl shadow-blue-900/10 bg-white">
        <Image src="/aapp.jpeg" alt="" fill sizes="64px" className="object-cover" priority />
      </div>
      <p className="font-display text-2xl" style={{ color: NAVY }}>
        Aapki<span className="text-blue-700">Society</span>
      </p>
      <div className="w-48 h-1.5 rounded-full bg-blue-100 overflow-hidden">
        <div className="loader-bar h-full rounded-full bg-gradient-to-r from-blue-800 via-blue-500 to-sky-400" />
      </div>
    </div>
  );
}

// ─── Live social-proof toasts ────────────────────────────────────────
const TOASTS = [
  { icon: Wallet, text: "Flat 402 · Prestige Lakeside just paid ₹4,250 via UPI", time: "just now" },
  { icon: Shield, text: "Gate 1 verified a guest OTP for Flat 502-A", time: "2m ago" },
  { icon: CheckCircle2, text: "Plumber complaint #TCK-482 resolved in 2.1 hrs", time: "9m ago" },
  { icon: Building2, text: "A 180-flat society in Pune went live today", time: "26m ago" },
  { icon: Landmark, text: "Treasurer approved ₹18,400 voucher · Tally synced", time: "41m ago" },
];

// ─── Chaos / Calm compare content ────────────────────────────────────
const CHAOS_ITEMS = [
  "\u201CMaintenance reminder\u201D buried under 300 Good-Mornings",
  "Receipt book lost — again. Treasurer vs Secretary fight.",
  "Guard calls at midnight: \u201CSahab, Swiggy wala aaya hai\u201D",
  "Plumber promised Tuesday. It is now\u2026 next month.",
  "CA returns the Excel: \u201Cyeh tally nahi hoga.\u201D",
];
const CALM_ITEMS = [
  "Auto-bills on the 1st. UPI reminders recover 11.5% dues.",
  "Every rupee Maker-Checker approved & Tally-synced.",
  "One-tap gate approvals — from office, cab or couch.",
  "SLA timers chase the plumber so you don't have to.",
  "CA gets a clean XML import. Zero re-entry.",
];

// ─── Scroll progress hairline ────────────────────────────────────────
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="scroll-progress fixed top-0 left-0 right-0 h-[3px] z-[60] bg-gradient-to-r from-blue-800 via-blue-500 to-sky-400"
    />
  );
}

// ─── Rotating hero headline (filmstrip) ──────────────────────────────
function RotatingHeadline({ phrases }: { phrases: { lead: string; accent: string }[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 2800);
    return () => clearInterval(id);
  }, [phrases.length]);
  return (
    <span className="filmstrip-viewport block h-[1.14em]" aria-live="polite">
      <span className="filmstrip-reel" style={{ transform: `translateY(-${index * 1.14}em)` }}>
        {phrases.map((p, i) => (
          <span key={p.lead} className="block h-[1.14em] leading-[1.14]" aria-hidden={i !== index}>
            {p.lead} <em className="blue-sheen font-semibold">{p.accent}</em>
          </span>
        ))}
      </span>
      <span className="sr-only">
        {phrases.map((p) => `${p.lead} ${p.accent}`).join(" ")}
      </span>
    </span>
  );
}

// ─── Magnetic hover wrapper ──────────────────────────────────────────
function Magnetic({ children, strength = 10 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${((x / r.width) * strength).toFixed(1)}px, ${((y / r.height) * strength).toFixed(1)}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0px, 0px)";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="inline-flex transition-transform duration-200 will-change-transform">
      {children}
    </div>
  );
}

// ─── Back to top ─────────────────────────────────────────────────────
function BackToTop({ visible }: { visible: boolean }) {
  return (
    <button
      onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-40 right-4 md:bottom-24 md:right-6 z-40 w-12 h-12 rounded-full bg-[#0A1C3F] text-white shadow-xl shadow-blue-900/30 items-center justify-center transition-all duration-300 hover:bg-blue-700 hover:-translate-y-1 cursor-pointer flex ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

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
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quotePaused, setQuotePaused] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [booted, setBooted] = useState(false);
  const [toastIndex, setToastIndex] = useState(0);
  const [comparePos, setComparePos] = useState(50);
  const compareRef = useRef<HTMLDivElement>(null);
  const compareDrag = useRef(false);
  const tiltRef = useRef<HTMLDivElement>(null);

  const L = (key: string) => STR[lang][key] ?? STR.en[key] ?? key;
  const phrases = lang === "hi" ? HEADLINE_PHRASES_HI : HEADLINE_PHRASES;

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
    // Defer mount state to a frame callback so hydration completes first
    // (avoids synchronous setState-in-effect cascading renders).
    const id = requestAnimationFrame(() => {
      setIsMounted(true);
      if (typeof window !== "undefined" && localStorage.getItem("token")) {
        setIsLoggedIn(true);
      }
      try {
        const saved = localStorage.getItem("as-lang");
        if (saved === "hi" || saved === "en") {
          setLang(saved);
          document.documentElement.setAttribute("lang", saved === "hi" ? "hi" : "en");
        }
      } catch {
        /* private mode — stay English */
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Brand preloader: dismiss on window load (with a hard fallback)
  useEffect(() => {
    const dismiss = () => {
      setTimeout(() => setBooted(true), 850);
    };
    if (typeof document !== "undefined" && document.readyState === "complete") {
      dismiss();
      return;
    }
    const fallback = setTimeout(() => setBooted(true), 2800);
    window.addEventListener("load", dismiss, { once: true });
    return () => {
      clearTimeout(fallback);
      window.removeEventListener("load", dismiss);
    };
  }, []);

  // Social-proof toast rotation
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = setTimeout(() => {
      const id = setInterval(() => setToastIndex((i) => (i + 1) % TOASTS.length), 5500);
      (window as unknown as { __toastTimer?: number }).__toastTimer = id as unknown as number;
    }, 4000);
    return () => {
      clearTimeout(start);
      const w = window as unknown as { __toastTimer?: number };
      if (w.__toastTimer) clearInterval(w.__toastTimer);
    };
  }, []);

  const switchLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem("as-lang", next);
      document.documentElement.setAttribute("lang", next === "hi" ? "hi" : "en");
    } catch {
      /* noop */
    }
    trackCTA(`lang_${next}`);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = demoModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [demoModalOpen]);

  // Header elevation + back-to-top visibility (state only flips on change)
  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 8;
      const t = window.scrollY > 900;
      setScrolled((prev) => (prev === s ? prev : s));
      setShowTop((prev) => (prev === t ? prev : t));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Testimonial autoplay (pauses on hover, respects reduced motion)
  useEffect(() => {
    if (quotePaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setQuoteIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, [quotePaused]);

  // 3D tilt for the hero console (direct DOM writes, no re-renders)
  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
  };
  const handleTiltLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  // Before/After drag-compare slider
  const moveCompare = (clientX: number) => {
    const el = compareRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setComparePos(Math.min(94, Math.max(6, ((clientX - r.left) / r.width) * 100)));
  };
  const endCompare = () => {
    compareDrag.current = false;
  };

  if (!isMounted) return null;

  // Dynamic Calculator Computations
  const monthlyMaintenanceCollection = calcFlats * calcFee;
  const estimatedRecovery = Math.round(monthlyMaintenanceCollection * 0.115);
  const hoursSaved = calcFlats >= 250 ? 55 : calcFlats >= 100 ? 38 : 22;
  const softwareInvestment = calcFlats * (annualBilling ? 42 : 50);
  const netRoiMultiplier = Math.max(3, Math.round(estimatedRecovery / Math.max(softwareInvestment, 1)));
  const flatsFill = `${Math.round(((calcFlats - 20) / (500 - 20)) * 100)}%`;
  const feeFill = `${Math.round(((calcFee - 1500) / (15000 - 1500)) * 100)}%`;

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
    } catch (err: unknown) {
      console.error("Demo submission failed:", err);
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
    <div className="landing-page light min-h-screen bg-[#F7FAFF] text-slate-900 font-sans selection:bg-blue-700 selection:text-white relative overflow-x-hidden" style={{ colorScheme: 'light' }}>
      <ScrollProgress />
      <Preloader done={booted} />

      {/* ── 01 · ANNOUNCEMENT HAIRLINE ─────────────────────────────────── */}
      <div className="relative z-50 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 text-[#0A1C3F] text-xs border-b border-blue-100">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-2.5">
          <span className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="ticker-dot absolute inline-flex h-full w-full rounded-full bg-blue-600" />
            </span>
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1 marquee-mask">
            <div className="marquee-track-fast text-[12px] font-medium text-[#0A1C3F]/60">
              {[0, 1].map((dup) => (
                <span key={dup} aria-hidden={dup === 1} className="flex shrink-0">
                  <span className="px-6">1-Click Tally Prime XML Export <span className="text-blue-500 px-4">✦</span> GST / TDS Compliant Invoicing <span className="text-blue-500 px-4">✦</span> Paid Society Property Listings <span className="text-blue-500 px-4">✦</span> 100% Indian Data Sovereignty — DPDP Act 2023 <span className="text-blue-500 px-4">✦</span> Trusted by 500+ societies <span className="text-blue-500 px-4">✦</span></span>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setDemoModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors underline underline-offset-4 shrink-0 cursor-pointer"
          >
            {L("walkthrough")} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── 02 · FLOATING PILL NAV ─────────────────────────────────────── */}
      <header className="sticky top-3 z-40 px-4 sm:px-6">
        <div className={`max-w-6xl mx-auto flex items-center justify-between gap-3 rounded-2xl border backdrop-blur-xl pl-3 pr-2 sm:pl-4 sm:pr-3 py-2 transition-all duration-300 ${
          scrolled
            ? "border-blue-200 bg-white/92 shadow-[0_18px_55px_rgba(11,42,107,0.18)]"
            : "border-blue-100/80 bg-white/85 shadow-[0_12px_40px_rgba(11,42,107,0.10)]"
        }`}>
          <Link href="/" className="flex items-center gap-3 group min-h-[44px]">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-blue-100 bg-white shrink-0 shadow-sm">
              <Image src="/aapp.jpeg" alt="AapkiSociety logo" fill sizes="40px" className="object-cover" priority />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-black tracking-tight" style={{ color: NAVY }}>Aapki<span className="text-blue-700">Society</span></span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">OS</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 tracking-[0.22em] uppercase mt-1">Society Operating System</p>
            </div>
          </Link>

          <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5 text-[13px] font-semibold text-slate-500">
            <a href="#features" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navModules")}</a>
            <a href="#simulator" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navDemo")}</a>
            <a href="#calculator" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navRoi")}</a>
            <a href="#app" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navApp")}</a>
            <a href="#comparison" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navWhy")}</a>
            <a href="#pricing" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navPricing")}</a>
            <a href="#faq" className="link-sweep px-3 py-2 hover:text-blue-700 transition-colors">{L("navFaq")}</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:flex items-center p-1 rounded-full bg-blue-50/70 border border-blue-100 text-[11px] font-black" role="group" aria-label="Language / भाषा">
              {(["en", "hi"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  aria-pressed={lang === l}
                  className={`px-2.5 py-1.5 rounded-full transition-all cursor-pointer min-h-[32px] ${lang === l ? "bg-[#0A1C3F] text-white shadow" : "text-slate-500 hover:text-blue-700"}`}
                >
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-[13px] hover:bg-blue-800 shadow-lg shadow-blue-700/25 active:scale-95 transition-all min-h-[44px]"
              >
                {L("dashboard")} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex px-3 py-2 text-[13px] font-bold text-slate-500 hover:text-blue-700 transition-colors min-h-[44px] items-center">
                  {L("signIn")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => trackCTA("nav_trial")}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-[13px] hover:bg-blue-800 shadow-lg shadow-blue-700/25 active:scale-95 transition-all min-h-[44px]"
                >
                  <span className="hidden sm:inline">{L("startTrial")}</span>
                  <span className="sm:hidden">{L("trialShort")}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-blue-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden max-w-6xl mx-auto mt-2 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-xl px-5 py-4 shadow-2xl shadow-blue-900/10 animate-fade-in">
            <nav aria-label="Mobile" className="flex flex-col text-[15px] font-semibold text-slate-600">
              {[["Modules", "#features", L("navModules")], ["Live Demo", "#simulator", L("navDemo")], ["ROI Calculator", "#calculator", L("navRoi")], ["Mobile App", "#app", L("navApp")], ["Why Us", "#comparison", L("navWhy")], ["Pricing", "#pricing", L("navPricing")], ["FAQs", "#faq", L("navFaq")]].map(([, href, text]) => (
                <a key={href} onClick={() => setMobileMenuOpen(false)} href={href} className="py-3 border-b border-slate-100 last:border-0 hover:text-blue-700">
                  {text}
                </a>
              ))}
            </nav>
            <div className="pt-2 flex flex-col gap-2.5">
              <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-blue-50/70 border border-blue-100 text-xs font-black" role="group" aria-label="Language / भाषा">
                {(["en", "hi"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    aria-pressed={lang === l}
                    className={`flex-1 py-2 rounded-full transition-all cursor-pointer min-h-[40px] ${lang === l ? "bg-[#0A1C3F] text-white shadow" : "text-slate-500"}`}
                  >
                    {l === "en" ? "English" : "हिंदी"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); trackCTA("mobile_demo"); setDemoModalOpen(true); }}
                className="w-full py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <PhoneCall className="w-4 h-4" /> {L("bookDemo")}
              </button>
              <Link
                href="/register"
                onClick={() => { setMobileMenuOpen(false); trackCTA("mobile_trial"); }}
                className="w-full py-3 rounded-xl bg-blue-700 text-white font-bold text-sm text-center flex items-center justify-center gap-2 min-h-[44px]"
              >
                {L("trialHero")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 03 · SKY-MESH HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden sky-canvas grain-light">
        <div className="blueprint-light absolute inset-0" aria-hidden="true" />
        <div className="aurora absolute -top-32 left-[8%] w-[480px] h-[480px] rounded-full bg-blue-400/25 blur-[130px]" aria-hidden="true" />
        <div className="aurora absolute top-10 right-[4%] w-[420px] h-[420px] rounded-full bg-sky-300/30 blur-[130px]" style={{ animationDelay: "-6s" }} aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-14 text-center">
          <Reveal>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-2 rounded-full bg-white/80 border border-blue-100 shadow-sm backdrop-blur-md text-[11px] font-bold text-slate-600 mb-8">
              <span className="flex items-center gap-1.5 text-blue-700">
                <Sparkles className="w-3.5 h-3.5" /> {L("heroEyebrowA")}
              </span>
              <span className="w-1 h-1 rounded-full bg-blue-200" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {L("heroEyebrowB")}
              </span>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="font-display font-medium tracking-[-0.02em] leading-[1.04] text-[clamp(2.75rem,7.5vw,6.25rem)] max-w-5xl mx-auto" style={{ color: NAVY }}>
              {L("heroStatic")}
              <RotatingHeadline phrases={phrases} />
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="text-slate-500 text-base sm:text-xl leading-relaxed max-w-2xl mx-auto mt-7 font-normal">
              {L("heroSub")}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-10">
              <Magnetic>
                <Link
                  href="/register"
                  onClick={() => trackCTA("hero_trial")}
                  className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-blue-700 text-white font-extrabold text-[15px] hover:bg-blue-800 shadow-[0_18px_45px_rgba(29,78,216,0.35)] hover:shadow-[0_22px_55px_rgba(29,78,216,0.45)] hover:-translate-y-0.5 active:scale-[0.98] transition-all min-h-[52px]"
                >
                  {L("trialHero")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>
              <button
                onClick={() => { trackCTA("hero_demo"); setDemoModalOpen(true); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-[#0A1C3F] font-bold text-[15px] border border-blue-200 shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 active:scale-[0.98] transition-all cursor-pointer min-h-[52px]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="ticker-dot absolute inline-flex h-full w-full rounded-full bg-blue-600" />
                </span>
                {L("heroCta2")}
              </button>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mt-10 text-[13px] font-semibold text-slate-500">
              <span className="flex items-center gap-2.5">
                <span className="flex -space-x-2" aria-hidden="true">
                  {["RK", "MI", "AS", "PV"].map((t) => (
                    <span key={t} className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-tr from-blue-700 to-sky-400 text-[9px] text-white font-black flex items-center justify-center shadow-sm">
                      {t}
                    </span>
                  ))}
                </span>
                <span className="font-bold text-slate-700">{L("trust1")}</span>
              </span>
              <span className="hidden sm:block h-4 w-px bg-blue-100" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span className="flex text-amber-400" aria-label="Rated 4.9 out of 5">
                  {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className="w-3.5 h-3.5 fill-current" />))}
                </span>
                <span className="font-bold text-slate-700">4.9/5</span>
              </span>
              <span className="hidden sm:block h-4 w-px bg-blue-100" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-700">{L("trust3")}</span>
              </span>
            </div>
          </Reveal>

          {/* ── Hero console : floating glass command-centre ── */}
          <Reveal delay={420} className="mt-14 tilt-stage">
            <div
              ref={tiltRef}
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
              className="tilt-inner relative max-w-5xl mx-auto"
            >
              <div className="absolute -inset-x-8 -top-8 bottom-0 bg-gradient-to-b from-blue-200/50 to-transparent blur-2xl" aria-hidden="true" />
              <div className="console-float relative rounded-3xl border border-blue-100 bg-white/85 backdrop-blur-2xl shadow-[0_40px_100px_rgba(11,42,107,0.16)] overflow-hidden text-left">
                <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-blue-50 bg-gradient-to-r from-blue-50/60 to-transparent">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex gap-1.5 shrink-0" aria-hidden="true">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 ml-1">Prestige Lakeside CHS — August Command Centre</span>
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shrink-0">
                    Live Sandbox
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-blue-50">
                  <div className="p-5 sm:p-7">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Collected · August</p>
                    <p className="font-display text-3xl sm:text-4xl mt-2 tnum" style={{ color: NAVY }}>₹28.4L</p>
                    <div className="flex items-end gap-1 h-14 mt-4" aria-hidden="true">
                      {[30, 45, 38, 60, 52, 74, 66, 88, 80, 96, 84, 100].map((h, i) => (
                        <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t ${i > 8 ? "bg-gradient-to-t from-blue-700 to-sky-400" : "bg-blue-100"}`} />
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-emerald-600 mt-3">▲ 98.3% of target</p>
                  </div>
                  <div className="p-5 sm:p-7">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Gate · Right Now</p>
                    <div className="mt-3 space-y-2.5">
                      {[
                        ["Swiggy partner · B-402", "Approved"],
                        ["Maid Kamla Devi", "Inside"],
                        ["Guest pass #8920", "Valid till 10 PM"],
                      ].map(([a, b], i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2.5">
                          <span className="font-semibold text-slate-700">{a}</span>
                          <span className="text-[10px] font-bold text-emerald-600">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 sm:p-7 bg-gradient-to-b from-blue-50/50 to-transparent">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Money Movement</p>
                    <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                      <p className="text-[11px] text-slate-500 font-semibold">Diesel refill · <span className="text-[#0A1C3F] font-bold tnum">₹18,400</span></p>
                      <div className="flex items-center gap-2 mt-2.5 text-[11px] font-bold">
                        <span className="text-slate-500">Treasurer ✓</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-blue-700">Secretary ✓</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">Maker-Checker · Tally synced</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating proof cards */}
              <div className="hidden md:flex absolute -left-10 top-16 -rotate-6 items-center gap-2.5 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-blue-900/10" aria-hidden="true">
                <span className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-[#0A1C3F]">Receipt #REC-894 sent</span>
                  <span className="block text-[10px] text-slate-400 font-semibold">UPI · Flat 402 · just now</span>
                </span>
              </div>
              <div className="hidden md:flex absolute -right-8 bottom-14 rotate-3 items-center gap-2.5 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-blue-900/10" aria-hidden="true">
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
                  <QrCode className="w-4 h-4 text-white" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-[#0A1C3F]">Guest OTP verified</span>
                  <span className="block text-[10px] text-slate-400 font-semibold">Gate 1 · Ram Singh on duty</span>
                </span>
              </div>
            </div>
          </Reveal>

          <p className="ghost-navy font-display font-semibold text-[clamp(3rem,10vw,8.5rem)] leading-none mt-12 tracking-tight" aria-hidden="true">
            SOCIETY&nbsp;OS
          </p>
        </div>
      </section>

      {/* ── 04 · SOCIETY MARQUEE ───────────────────────────────────────── */}
      <div className="relative bg-white border-y border-blue-100/80 py-5 overflow-hidden">
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track items-center">
            {[0, 1].map((dup) => (
              <div key={dup} aria-hidden={dup === 1} className="flex shrink-0 items-center">
                {SOCIETY_NAMES.map((name) => (
                  <span key={`${dup}-${name}`} className="flex items-center shrink-0">
                    <span className="font-display italic text-lg sm:text-xl text-[#0A1C3F]/40 px-8">{name}</span>
                    <Star className="w-3.5 h-3.5 text-blue-400 fill-current shrink-0" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 04b · GIANT TYPE BAND ──────────────────────────────────────── */}
      <section aria-hidden="true" className="relative bg-white border-b border-blue-100/80 pt-8 sm:pt-10 pb-2 overflow-hidden select-none">
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track items-center">
            {[0, 1].map((dup) => (
              <div key={dup} aria-hidden={dup === 1} className="flex shrink-0 items-center">
                {BAND_ITEMS.map((w) => (
                  <span key={`${dup}-${w}`} className="flex items-center shrink-0">
                    <span className="font-display font-medium text-[clamp(2.4rem,6vw,4.5rem)] leading-none px-6 tracking-tight" style={{ color: NAVY }}>{w}</span>
                    <span className="text-sky-400 text-2xl sm:text-3xl">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="marquee-mask overflow-hidden -mt-1 sm:-mt-2 opacity-90">
          <div className="marquee-reverse items-center">
            {[0, 1].map((dup) => (
              <div key={dup} aria-hidden={dup === 1} className="flex shrink-0 items-center">
                {[...BAND_ITEMS].reverse().map((w) => (
                  <span key={`${dup}-${w}`} className="flex items-center shrink-0">
                    <span className="font-display italic font-medium text-[clamp(2.4rem,6vw,4.5rem)] leading-none px-6 tracking-tight text-outline-navy">{w}</span>
                    <span className="text-blue-200 text-2xl sm:text-3xl">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 05 · CHAOS → CALM (before / after) ─────────────────────────── */}
      <section className="relative bg-white text-[#0A1C3F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L("e01")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("chaosT1")}
              <br /> <em className="blue-gradient-text">{L("chaosT2")}</em>
            </h2>
          </Reveal>

          <Reveal>
            <div className="mt-14 max-w-5xl mx-auto">
              <div
                ref={compareRef}
                role="slider"
                tabIndex={0}
                aria-label={L("dragHint")}
                aria-valuenow={Math.round(comparePos)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setComparePos((p) => Math.max(6, p - 5));
                  if (e.key === "ArrowRight") setComparePos((p) => Math.min(94, p + 5));
                  if (e.key === "Home") setComparePos(6);
                  if (e.key === "End") setComparePos(94);
                }}
                onPointerDown={(e) => {
                  compareDrag.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  moveCompare(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (compareDrag.current) moveCompare(e.clientX);
                }}
                onPointerUp={endCompare}
                onPointerCancel={endCompare}
                className="relative rounded-[2rem] overflow-hidden border border-blue-100 shadow-[0_30px_80px_rgba(11,42,107,0.16)] select-none cursor-ew-resize touch-pan-y"
              >
                {/* Base layer — BEFORE */}
                <div className="bg-slate-50 p-6 sm:p-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-600">{L("chaosBefore")}</p>
                  <div className="mt-5 space-y-2.5 text-[13px] font-medium">
                    {CHAOS_ITEMS.map((t, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-2xl bg-white border border-rose-100 px-4 py-3 text-slate-600 shadow-sm">
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> {t}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Overlay layer — AFTER, clipped by handle */}
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }} aria-hidden="true">
                  <div className="h-full bg-gradient-to-br from-[#0B2A6B] to-[#081738] text-white p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-sky-400/25 blur-[80px]" />
                    <div className="absolute inset-0 blueprint-grid opacity-60" />
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-300 relative">{L("chaosAfter")}</p>
                    <div className="mt-5 space-y-2.5 text-[13px] font-medium relative">
                      {CALM_ITEMS.map((t, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white/90 backdrop-blur-sm">
                          <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Drag handle */}
                <div className="absolute top-0 bottom-0 z-10" style={{ left: `${comparePos}%` }} aria-hidden="true">
                  <div className="absolute inset-y-0 -left-[1.5px] w-[3px] bg-white shadow-[0_0_24px_rgba(29,78,216,0.7)]" />
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white text-blue-700 flex items-center justify-center shadow-2xl border-2 border-blue-100">
                    <ChevronsLeftRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs font-bold text-slate-400 mt-4 flex items-center justify-center gap-2">
                <ChevronsLeftRight className="w-4 h-4 text-blue-500" /> {L("dragHint")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 06 · BENTO MODULES ─────────────────────────────────────────── */}
      <section id="features" className="relative mist-canvas text-[#0A1C3F] scroll-mt-24 border-y border-blue-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6 max-w-none">
            <span aria-hidden="true" className="ghost-numeral font-display font-semibold absolute -top-16 right-0 text-[6rem] sm:text-[8rem] hidden lg:block">02</span>
            <div className="max-w-xl">
              <Eyebrow>{L("featE")}</Eyebrow>
              <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
                {L("featT1")}
                <br /> <em className="blue-gradient-text">{L("featT2")}</em>
              </h2>
            </div>
            <p className="text-[15px] text-slate-500 leading-relaxed max-w-sm">
              {L("featSub")}
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex items-center gap-2 mt-8 overflow-x-auto no-scrollbar py-2 sm:flex-wrap" role="tablist" aria-label="Filter modules by category">
              {MODULE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] whitespace-nowrap shrink-0 sm:shrink ${
                    selectedCategory === cat.id
                      ? "bg-blue-700 text-white shadow-lg shadow-blue-700/30 scale-[1.03]"
                      : "bg-white text-slate-600 border border-blue-100/90 hover:border-blue-300 hover:text-blue-700 shadow-xs"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid md:grid-cols-6 gap-4 sm:gap-5 mt-8">
            {filteredFeatures.map((feat, idx) => (
              <Reveal key={`${selectedCategory}-${idx}`} delay={Math.min(idx * 60, 300)} className={feat.span}>
                <div
                  onMouseMove={handleSpot}
                  className="spot-card group h-full bg-white rounded-3xl p-6 sm:p-8 border border-blue-100/80 shadow-[0_2px_20px_rgba(11,42,107,0.06)] hover:shadow-[0_24px_60px_rgba(29,78,216,0.16)] hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-blue-700/25">
                        <feat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-[1.35rem] leading-snug tracking-tight" style={{ color: NAVY }}>{feat.title}</h3>
                    <p className="text-[13.5px] text-slate-600 leading-relaxed mt-2">{feat.desc}</p>
                    <BentoVisual kind={feat.visual} />
                  </div>
                  <div className="pt-5 mt-6 border-t border-blue-50 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {feat.stat}
                    </span>
                    <span className="font-bold text-slate-400 flex items-center gap-1 group-hover:text-blue-700 group-hover:translate-x-1 transition-all">
                      Explore <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 07 · LIVE SIMULATOR ────────────────────────────────────────── */}
      <section id="simulator" className="relative bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L("simE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("simT1")}
              <br /> <em className="blue-gradient-text">{L("simT2")}</em>
            </h2>
            <p className="text-slate-500 text-[15px] mt-4">{L("simSub")}</p>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex justify-center mt-10">
              <div className="inline-flex flex-wrap justify-center p-1.5 bg-blue-50/70 rounded-2xl border border-blue-100 gap-1" role="tablist" aria-label="Simulator viewpoint">
                {([
                  ["resident", Smartphone, L("tabResident")],
                  ["committee", Landmark, L("tabCommittee")],
                  ["guard", Shield, L("tabGuard")],
                ] as const).map(([id, Icon, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={simulatorView === id}
                    onClick={() => setSimulatorView(id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer min-h-[44px] ${
                      simulatorView === id
                        ? "bg-[#0A1C3F] text-white shadow-lg shadow-blue-900/25"
                        : "text-slate-500 hover:text-blue-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="relative mt-8 rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden shadow-[0_30px_80px_rgba(11,42,107,0.12)]">
              <div className="bg-[#0A1C3F] px-5 sm:px-7 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex gap-1.5 shrink-0" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-bold text-white/60 truncate">
                    {simulatorView === "resident" && "Resident Portal — Flat 402, Wing B"}
                    {simulatorView === "committee" && "RWA Executive Dashboard — Prestige Lakeside CHS"}
                    {simulatorView === "guard" && "Gate #1 Security Terminal — Live Access Log"}
                  </span>
                </div>
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.18em] text-sky-300 border border-white/20 bg-white/10 px-2.5 py-1 rounded-full shrink-0">
                  Sandbox
                </span>
              </div>

              {/* RESIDENT */}
              {simulatorView === "resident" && (
                <div className="p-5 sm:p-8 animate-fade-in">
                  <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
                    <div className="rounded-2xl p-6 border border-blue-100 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.16em] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">August 2026 Bill</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${billPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {billPaid ? "Paid ✓" : "Due in 3 days"}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400">Total payable</p>
                        <h4 className="font-display text-4xl mt-1 tnum" style={{ color: NAVY }}>₹4,250</h4>
                        <div className="text-[11px] text-slate-500 mt-3 space-y-1.5 border-t border-blue-50 pt-3">
                          <div className="flex justify-between"><span>Maintenance &amp; sinking</span><span className="font-bold text-slate-700 tnum">₹3,200</span></div>
                          <div className="flex justify-between"><span>Lift &amp; DG AMC</span><span className="font-bold text-slate-700 tnum">₹650</span></div>
                          <div className="flex justify-between"><span>GST @ 18%</span><span className="font-bold text-slate-700 tnum">₹400</span></div>
                        </div>
                      </div>
                      <div className="mt-6">
                        {billPaid ? (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-bold justify-center">
                            <CheckCircle2 className="w-4 h-4" /> Receipt #REC-2026-894 sent
                          </div>
                        ) : (
                          <button
                            onClick={() => setBillPaid(true)}
                            className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                          >
                            <Wallet className="w-4 h-4" /> Pay ₹4,250 via UPI
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl p-6 border border-blue-100 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em]">Gate activity</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="ticker-dot w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 mb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[11px] shadow-md shadow-blue-700/25">SW</div>
                            <div>
                              <p className="text-xs font-bold text-[#0A1C3F]">Swiggy Delivery Partner</p>
                              <p className="text-[11px] text-slate-400">Flat 402 · At entrance</p>
                            </div>
                          </div>
                          {gateApproved ? (
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                              <Check className="w-4 h-4" /> Approved — OTP sent to guard
                            </div>
                          ) : (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => setGateApproved(true)} className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold active:scale-95 transition-all cursor-pointer min-h-[40px]">Approve</button>
                              <button onClick={() => setGateApproved(false)} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer min-h-[40px]">Deny</button>
                            </div>
                          )}
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between py-1.5 border-b border-blue-50">
                            <span className="font-semibold text-slate-600">Maid (Kamla Devi)</span>
                            <span className="text-[11px] font-bold text-emerald-600">In · 08:30 AM</span>
                          </div>
                          <div className="flex items-center justify-between py-1.5">
                            <span className="font-semibold text-slate-600">Guest pass #8920</span>
                            <span className="text-[11px] font-bold text-slate-400">Valid till 10 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-6 border border-blue-100 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em] block mb-4">Helpdesk &amp; notice</span>
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 mb-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-[#0A1C3F]">#TCK-482 · Plumber assigned</span>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0">Active</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mt-2">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> SLA: 1h 40m left
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/70">
                          <div className="flex items-center gap-1.5 text-blue-800 text-xs font-extrabold mb-1">
                            <Bell className="w-3.5 h-3.5" /> Water supply notice
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">Tank cleaning tomorrow, 10 AM – 1 PM. Please store water.</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 text-center mt-4 font-semibold">↑ Press the buttons — this is live</p>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMITTEE */}
              {simulatorView === "committee" && (
                <div className="p-5 sm:p-8 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                    {[
                      ["August collection", "₹28,40,000", "98.3% of target", "text-emerald-600"],
                      ["Pending defaulters", "4 flats", "₹17,000 overdue", "text-rose-600"],
                      ["Pending approvals", "2 vouchers", "Maker-Checker queue", "text-amber-600"],
                      ["Tally sync", "Synced ✓", "Ready for CA export", "text-blue-700"],
                    ].map(([label, value, sub, color], i) => (
                      <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">{label}</p>
                        <h5 className={`font-display text-xl sm:text-2xl mt-1.5 tnum ${color}`}>{value}</h5>
                        <p className="text-[11px] text-slate-400 mt-1 font-semibold">{sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl p-5 sm:p-7 border border-blue-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div>
                        <h4 className="text-[15px] font-bold" style={{ color: NAVY }}>Defaulter recovery, in one click</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Polite WhatsApp + SMS reminders with UPI payment links</p>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {nudgeSent ? (
                          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 min-h-[44px]">
                            <Check className="w-4 h-4" /> 4 WhatsApp reminders sent
                          </div>
                        ) : (
                          <button onClick={() => setNudgeSent(true)} className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-700/25 min-h-[44px]">
                            <Send className="w-3.5 h-3.5" /> 1-Click WhatsApp Nudge
                          </button>
                        )}
                        <button onClick={() => alert("Simulated: Tally Prime XML export downloaded.")} className="px-4 py-2.5 rounded-xl bg-[#0A1C3F] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer min-h-[44px]">
                          <Download className="w-3.5 h-3.5 text-sky-300" /> Export Tally XML
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto -mx-1 px-1">
                      <table className="w-full text-left text-xs min-w-[520px]">
                        <thead>
                          <tr className="text-slate-400 border-b border-blue-50">
                            <th className="py-2 font-bold">Flat</th>
                            <th className="py-2 font-bold">Owner</th>
                            <th className="py-2 font-bold">Overdue</th>
                            <th className="py-2 font-bold">Days</th>
                            <th className="py-2 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                          {[
                            ["Flat 102-A", "Sunil Deshmukh", "₹4,250", "12 days"],
                            ["Flat 304-C", "Pooja Singhania", "₹4,250", "8 days"],
                          ].map((row, i) => (
                            <tr key={i}>
                              <td className="py-3 font-bold" style={{ color: NAVY }}>{row[0]}</td>
                              <td className="py-3 text-slate-500">{row[1]}</td>
                              <td className="py-3 font-bold text-rose-600 tnum">{row[2]}</td>
                              <td className="py-3 text-slate-400">{row[3]}</td>
                              <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold">Overdue</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* GUARD */}
              {simulatorView === "guard" && (
                <div className="p-5 sm:p-8 animate-fade-in">
                  <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
                    <div className="md:col-span-2 rounded-2xl p-5 sm:p-6 border border-blue-100 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-700" />
                          <h4 className="font-bold text-sm" style={{ color: NAVY }}>Main Entrance — Security Terminal</h4>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Guard: Ram Singh · On duty</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-5">
                        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                          <label htmlFor="gate-otp" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] block mb-2">Verify visitor OTP</label>
                          <div className="flex gap-2">
                            <input id="gate-otp" type="text" defaultValue="849201" inputMode="numeric" className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-[#0A1C3F] tnum focus:border-blue-600 focus:outline-none min-h-[44px]" />
                            <button onClick={() => alert("Verified: visitor allowed for Flat 502-A")} className="px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer min-h-[44px] min-w-[72px]">Verify</button>
                          </div>
                        </div>
                        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                          <label htmlFor="gate-plate" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] block mb-2">Vehicle plate lookup</label>
                          <div className="flex gap-2">
                            <input id="gate-plate" type="text" defaultValue="MH 12 AB 4589" className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-[#0A1C3F] focus:border-blue-600 focus:outline-none min-h-[44px]" />
                            <button onClick={() => alert("Allocated slot: B-24 (Flat 402)")} className="px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shrink-0 cursor-pointer min-h-[44px] min-w-[72px]">Check</button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.16em] mb-2.5">Live check-in stream</p>
                      <div className="space-y-2">
                        {[
                          ["Urban Company (Electrician)", "Flat 201-B", "2m ago", "Approved by resident"],
                          ["Amazon Logistics", "Flat 604-A", "6m ago", "OTP validated"],
                          ["School Bus #14", "All wings", "15m ago", "Regular entry"],
                        ].map((log, idx) => (
                          <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-blue-50 text-xs">
                            <div>
                              <span className="font-bold" style={{ color: NAVY }}>{log[0]}</span>
                              <span className="text-slate-400 ml-2 font-medium">({log[1]})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 text-[11px]">{log[2]}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">{log[3]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl p-5 sm:p-6 border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: NAVY }}>Staff &amp; maid QR tap</h4>
                        <p className="text-xs text-slate-400 mb-4">Instant In/Out — no typing</p>
                        <div className="space-y-2.5">
                          {[
                            ["Kamla Devi (Maid)", "Flats 402 · 404 · 501", "Inside"],
                            ["Shankar (Driver)", "Flat 301-A", "Inside"],
                            ["Ramesh (Gardener)", "Campus", "Logged out"],
                          ].map((staff, sIdx) => (
                            <div key={sIdx} className="p-3 rounded-xl bg-white border border-blue-100 shadow-sm flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold" style={{ color: NAVY }}>{staff[0]}</p>
                                <p className="text-[10px] text-slate-400">{staff[1]}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${staff[2] === "Inside" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>{staff[2]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="mt-4 pt-3 border-t border-blue-100 text-[11px] text-slate-400 text-center font-semibold">Offline mode · Battery friendly</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 08 · ROI CALCULATOR ────────────────────────────────────────── */}
      <section id="calculator" className="relative mist-canvas text-[#0A1C3F] scroll-mt-24 border-y border-blue-100/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <span aria-hidden="true" className="ghost-numeral font-display font-semibold absolute top-6 right-4 sm:right-8 text-[6rem] sm:text-[8rem] hidden lg:block">04</span>
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L("calcE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("calcT1")}
              <br /> <em className="blue-gradient-text">{L("calcT2")}</em>
            </h2>
            <p className="text-[15px] text-slate-500 mt-4">{L("calcSub")}</p>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-12 bg-white rounded-[2rem] border border-blue-100 shadow-[0_30px_80px_rgba(11,42,107,0.12)] p-6 sm:p-10 lg:p-12 max-w-5xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-9">
                <div>
                  <div className="flex justify-between items-center mb-4 gap-3">
                    <label htmlFor="calc-flats" className="text-sm font-bold" style={{ color: NAVY }}>{L("calcFlats")}</label>
                    <span className="font-display text-2xl tnum bg-[#0A1C3F] text-white px-4 py-1.5 rounded-xl shrink-0">{calcFlats}</span>
                  </div>
                  <input
                    id="calc-flats"
                    type="range" min={20} max={500} step={5} value={calcFlats}
                    onChange={(e) => setCalcFlats(Number(e.target.value))}
                    style={{ "--fill": flatsFill } as React.CSSProperties}
                    className="slider-blue w-full cursor-pointer"
                    aria-valuetext={`${calcFlats} flats`}
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2 tnum">
                    <span>20</span><span>150</span><span>300</span><span>500+</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4 gap-3">
                    <label htmlFor="calc-fee" className="text-sm font-bold" style={{ color: NAVY }}>{L("calcFee")}</label>
                    <span className="font-display text-2xl tnum bg-[#0A1C3F] text-white px-4 py-1.5 rounded-xl shrink-0">₹{calcFee.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    id="calc-fee"
                    type="range" min={1500} max={15000} step={100} value={calcFee}
                    onChange={(e) => setCalcFee(Number(e.target.value))}
                    style={{ "--fill": feeFill } as React.CSSProperties}
                    className="slider-blue w-full cursor-pointer"
                    aria-valuetext={`Rupees ${calcFee} per month`}
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2 tnum">
                    <span>₹1.5k</span><span>₹5k</span><span>₹10k</span><span>₹15k+</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-500 flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p>{L("calcNote")}</p>
                </div>
              </div>

              <div className="lg:col-span-5 relative rounded-[1.75rem] overflow-hidden bg-gradient-to-br from-[#0B2A6B] via-[#123a8f] to-[#0EA5E9] text-white p-8 sm:p-9 shadow-2xl shadow-blue-900/30">
                <div className="absolute inset-0 blueprint-grid opacity-50" aria-hidden="true" />
                <span className="relative text-[10px] font-black uppercase tracking-[0.22em] text-sky-200 border border-white/25 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {L("calcImpact")}
                </span>
                <div className="relative mt-7">
                  <p className="text-xs font-semibold text-sky-200">{L("calcRec")}</p>
                  <p className="font-display text-[2.6rem] leading-none mt-1.5 tnum">+₹{estimatedRecovery.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-sky-200/80 mt-1.5 tnum">₹{(estimatedRecovery * 12).toLocaleString("en-IN")} {L("calcYear")}</p>
                </div>
                <div className="relative pt-5 mt-5 border-t border-white/15">
                  <p className="text-xs font-semibold text-sky-200">{L("calcHours")}</p>
                  <p className="font-display text-3xl mt-1 tnum">~{hoursSaved} hrs<span className="text-base text-sky-200/70"> / mo</span></p>
                </div>
                <div className="relative pt-5 mt-5 border-t border-white/15 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-sky-200">{L("calcRoi")}</p>
                    <p className="font-display text-2xl text-emerald-300 tnum">{netRoiMultiplier}× ROI</p>
                  </div>
                  <button onClick={() => { trackCTA("calc_trial"); setDemoModalOpen(true); }} className="px-5 py-3 rounded-xl bg-white text-[#0A1C3F] font-extrabold text-xs hover:bg-blue-50 active:scale-95 transition-all cursor-pointer shadow-lg min-h-[44px]">
                    {L("calcLock")}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 09 · STATS BAND ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B2A6B] via-blue-700 to-sky-600">
        <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            ["stat1", 500, "+", ""],
            ["stat2", 85000, "+", ""],
            ["stat3", 500, " Cr+", "₹"],
            ["stat4", 48000, "+", ""],
          ].map(([label, target, suffix, prefix], idx) => (
            <Reveal key={idx} delay={idx * 80} className="text-center">
              <div className="font-display text-4xl sm:text-5xl text-white tracking-tight drop-shadow-sm">
                <Counter target={target as number} suffix={suffix as string} prefix={prefix as string} />
              </div>
              <div className="text-[11px] font-bold text-sky-100/80 uppercase tracking-[0.2em] mt-2">{L(label as string)}</div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── 09b · MOBILE APP ───────────────────────────────────────────── */}
      <section id="app" className="relative bg-white text-[#0A1C3F] scroll-mt-24 overflow-hidden">
        <div className="aurora absolute top-20 right-[6%] w-[420px] h-[420px] rounded-full bg-sky-200/50 blur-[130px]" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
          {/* Phone mockup */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto w-[270px] sm:w-[300px]">
              <div className="absolute -inset-8 bg-gradient-to-b from-blue-200/60 to-transparent blur-2xl rounded-full" aria-hidden="true" />
              <div className="console-float relative rounded-[3rem] border-[10px] border-[#0A1C3F] bg-[#F7FAFF] shadow-[0_40px_90px_rgba(11,42,107,0.28)] overflow-hidden">
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0A1C3F] rounded-full z-10" aria-hidden="true" />
                <div className="pt-12 px-4 pb-4">
                  <p className="text-[10px] font-bold text-slate-400">Namaste 🙏</p>
                  <p className="text-sm font-black" style={{ color: NAVY }}>Flat 402 · Wing B</p>
                  <div className="mt-3 rounded-2xl bg-[#0A1C3F] text-white p-3.5 shadow-lg">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-300">August bill</p>
                    <p className="font-display text-2xl tnum">₹4,250</p>
                    <div className="mt-2 py-2 rounded-lg bg-blue-600 text-center text-[11px] font-extrabold">Pay via UPI</div>
                  </div>
                  <div className="mt-2.5 rounded-2xl bg-white border border-blue-100 p-3 flex items-center gap-2.5 shadow-sm">
                    <span className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">SW</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: NAVY }}>Delivery at gate</p>
                      <p className="text-[9px] text-slate-400">Tap to approve</p>
                    </div>
                    <span className="text-[9px] font-black text-white bg-emerald-500 px-2 py-1 rounded-full shrink-0">✓</span>
                  </div>
                  <div className="mt-2.5 rounded-2xl bg-blue-50 border border-blue-100 p-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <p className="text-[10px] font-bold text-slate-600">#TCK-482 · Plumber arriving in 40m</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-blue-100 flex justify-around">
                    {[Smartphone, Wallet, Bell, ShieldCheck].map((Icon, i) => (
                      <span key={i} className={`p-1.5 rounded-lg ${i === 0 ? "text-blue-700 bg-blue-50" : "text-slate-300"}`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex absolute -left-24 top-20 -rotate-6 items-center gap-2 rounded-2xl border border-blue-100 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-blue-900/10" aria-hidden="true">
                <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span className="text-[11px] font-bold" style={{ color: NAVY }}>Receipt sent ✓</span>
              </div>
              <div className="hidden sm:flex absolute -right-20 bottom-24 rotate-3 items-center gap-2 rounded-2xl border border-blue-100 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-blue-900/10" aria-hidden="true">
                <span className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-red-500" />
                </span>
                <span className="text-[11px] font-bold" style={{ color: NAVY }}>SOS · Guard alerted</span>
              </div>
            </div>
          </Reveal>
          {/* Copy + bullets + badges */}
          <Reveal delay={120} className="order-1 lg:order-2">
            <Eyebrow>{L("appE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("appT1")}
              <br /> <em className="blue-gradient-text">{L("appT2")}</em>
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed mt-4 max-w-md">{L("appSub")}</p>
            <ul className="mt-8 space-y-4">
              {[
                ["appB1t", "appB1s", Wallet],
                ["appB2t", "appB2s", QrCode],
                ["appB3t", "appB3s", CheckCircle2],
                ["appB4t", "appB4s", Bell],
              ].map(([tk, sk, Icon]) => {
                const I = Icon as typeof Wallet;
                return (
                  <li key={tk as string} className="flex items-start gap-3.5">
                    <span className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <I className="w-[18px] h-[18px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold" style={{ color: NAVY }}>{L(tk as string)}</span>
                      <span className="block text-[13px] text-slate-500 mt-0.5">{L(sk as string)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => { trackCTA("app_ios"); setDemoModalOpen(true); }}
                className="flex items-center gap-3 bg-[#0A1C3F] text-white rounded-2xl pl-4 pr-6 py-3 hover:bg-blue-900 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-blue-900/25 min-h-[56px]"
              >
                <Apple className="w-7 h-7" />
                <span className="text-left">
                  <span className="block text-[10px] text-white/55 font-semibold">Download on the</span>
                  <span className="block font-bold leading-tight">App Store</span>
                </span>
              </button>
              <button
                onClick={() => { trackCTA("app_android"); setDemoModalOpen(true); }}
                className="flex items-center gap-3 bg-[#0A1C3F] text-white rounded-2xl pl-4 pr-6 py-3 hover:bg-blue-900 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-blue-900/25 min-h-[56px]"
              >
                <Play className="w-6 h-6 fill-current" />
                <span className="text-left">
                  <span className="block text-[10px] text-white/55 font-semibold">Get it on</span>
                  <span className="block font-bold leading-tight">Google Play</span>
                </span>
              </button>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-2 min-h-[56px]">
                <QrCode className="w-8 h-8 text-blue-700" />
                <span className="text-[11px] font-semibold text-slate-500 max-w-[150px] leading-snug">{L("appScan")}</span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-4">{L("appNote")}</p>
          </Reveal>
        </div>
      </section>

      {/* ── 10 · COMPARISON ────────────────────────────────────────────── */}
      <section id="comparison" className="relative bg-white text-[#0A1C3F] scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L("compE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("compT1")}
              <br /> <em className="blue-gradient-text">{L("compT2")}</em>
            </h2>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-12 rounded-[1.75rem] border border-blue-100 bg-white overflow-hidden shadow-[0_24px_60px_rgba(11,42,107,0.10)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th scope="col" className="p-5 sm:p-6 text-sm font-bold text-slate-400">Critical capability</th>
                      <th scope="col" className="p-5 sm:p-6 text-sm font-black text-white bg-gradient-to-b from-[#0B2A6B] to-[#081738]">
                        <span className="flex items-center gap-2">AapkiSociety OS <BadgeCheck className="w-4 h-4 text-sky-300" /></span>
                      </th>
                      <th scope="col" className="p-5 sm:p-6 text-sm font-bold text-slate-400">WhatsApp &amp; Excel</th>
                      <th scope="col" className="p-5 sm:p-6 text-sm font-bold text-slate-400">Legacy apps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 text-sm">
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5 sm:p-6">
                          <div className="font-bold" style={{ color: NAVY }}>{row.feat}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{row.note}</div>
                        </td>
                        <td className="p-5 sm:p-6 bg-blue-50/70 border-x border-blue-100">
                          <span className="inline-flex items-center gap-2 font-bold text-blue-800">
                            <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-700/25">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                            Native
                          </span>
                        </td>
                        <td className="p-5 sm:p-6 text-slate-500 font-semibold">
                          {row.wa
                            ? <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Free / manual</span>
                            : <span className="flex items-center gap-1.5 text-rose-500"><X className="w-4 h-4" /> Impossible</span>}
                        </td>
                        <td className="p-5 sm:p-6 text-slate-500 font-semibold">
                          {row.leg
                            ? <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Partial add-on</span>
                            : <span className="flex items-center gap-1.5 text-rose-500"><X className="w-4 h-4" /> No support</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 11 · SECURITY VAULT ────────────────────────────────────────── */}
      <section id="security" className="relative mist-canvas border-y border-blue-100/70 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative rounded-[2rem] p-8 sm:p-10 bg-gradient-to-br from-[#0B2A6B] to-[#081738] text-white overflow-hidden shadow-2xl shadow-blue-900/30">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-sky-400/25 blur-[80px]" aria-hidden="true" />
              <div className="absolute inset-0 blueprint-grid opacity-50" aria-hidden="true" />
              <div className="relative w-fit p-3 rounded-2xl bg-white/10 border border-white/20 text-sky-300 mb-6">
                <Fingerprint className="w-7 h-7" />
              </div>
              <h3 className="relative font-display text-2xl sm:text-3xl tracking-tight">Bank-grade security for your community</h3>
              <p className="relative text-sky-100/70 text-sm leading-relaxed mt-3">
                Financial records, contact directories and gate logs — protected with the encryption Indian financial institutions trust.
              </p>
              <ul className="relative mt-7 space-y-3.5 text-sm font-semibold text-white/90">
                {[
                  "256-bit AES encryption, in transit and at rest",
                  "Strict DPDP Act 2023 compliance, hosted in AWS Mumbai",
                  "Zero data mining — never sold, never spammed",
                  "Masked phone relay — guards never see resident numbers",
                  "Daily encrypted backups · 30-day snapshot retention",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <Eyebrow>{L("secE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.06] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("secT1")} <em className="blue-gradient-text">{L("secT2")}</em>
            </h2>
            <p className="text-slate-500 text-[15px] sm:text-base leading-relaxed mt-5">
              {L("secPara")}
            </p>
            <div className="pt-6 flex flex-wrap gap-3 text-[13px] font-bold">
              {[["ISO 27001 Certified", Shield], ["SOC 2 Compliant", CheckCircle2], ["₹ INR Invoicing", IndianRupee]].map(([label, Icon], i) => {
                const I = Icon as typeof Shield;
                return (
                  <span key={i} className="inline-flex items-center gap-2 text-[#0A1C3F] border border-blue-200 bg-white px-4 py-2.5 rounded-full shadow-sm">
                    <I className="w-4 h-4 text-blue-700" /> {label as string}
                  </span>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 12 · TESTIMONIALS ──────────────────────────────────────────── */}
      <section id="testimonials" className="relative bg-white text-[#0A1C3F] scroll-mt-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <span aria-hidden="true" className="ghost-numeral font-display font-semibold absolute top-6 right-4 sm:right-8 text-[6rem] sm:text-[8rem] hidden lg:block">08</span>
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L("testiE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("testiT1")} <em className="blue-gradient-text">{L("testiT2")}</em>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div
              className="mt-14 max-w-4xl mx-auto"
              onMouseEnter={() => setQuotePaused(true)}
              onMouseLeave={() => setQuotePaused(false)}
            >
              <div className="relative bg-gradient-to-b from-blue-50/80 to-white rounded-[2rem] border border-blue-100 shadow-[0_24px_70px_rgba(11,42,107,0.12)] p-8 sm:p-12 text-center overflow-hidden">
                <div className="aurora absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[240px] rounded-full bg-sky-200/50 blur-[90px]" aria-hidden="true" />
                <div className="relative">
                  <div className="flex justify-center gap-1 text-amber-400 mb-6" aria-label={`${TESTIMONIALS[quoteIndex].rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className="w-4 h-4 fill-current" />))}
                  </div>
                  <div key={quoteIndex} className="quote-enter">
                    <blockquote className="font-display text-xl sm:text-[1.7rem] leading-[1.4] tracking-tight min-h-[168px] sm:min-h-[132px]" style={{ color: NAVY }}>
                      “{TESTIMONIALS[quoteIndex].quote}”
                    </blockquote>
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full inline-block mt-6">
                      {TESTIMONIALS[quoteIndex].highlight}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3.5 mt-7">
                    <Image
                      src={TESTIMONIALS[quoteIndex].avatar}
                      alt={`Portrait of ${TESTIMONIALS[quoteIndex].name}`}
                      width={52}
                      height={52}
                      className="w-13 h-13 rounded-full object-cover border-[3px] border-white shadow-lg shadow-blue-900/15"
                    />
                    <div className="text-left">
                      <p className="font-extrabold text-sm leading-tight" style={{ color: NAVY }}>{TESTIMONIALS[quoteIndex].name}</p>
                      <p className="text-xs text-blue-700 font-bold mt-0.5">{TESTIMONIALS[quoteIndex].role}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{TESTIMONIALS[quoteIndex].society} · {TESTIMONIALS[quoteIndex].city}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setQuoteIndex((quoteIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                      aria-label="Previous testimonial"
                      className="w-11 h-11 rounded-full border border-blue-200 bg-white text-blue-700 flex items-center justify-center hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all cursor-pointer shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2" role="tablist" aria-label="Choose testimonial">
                      {TESTIMONIALS.map((_, i) => (
                        <button
                          key={i}
                          role="tab"
                          aria-selected={quoteIndex === i}
                          aria-label={`Show testimonial ${i + 1}`}
                          onClick={() => setQuoteIndex(i)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${quoteIndex === i ? "w-8 bg-blue-700" : "w-2 bg-blue-200 hover:bg-blue-300"}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setQuoteIndex((quoteIndex + 1) % TESTIMONIALS.length)}
                      aria-label="Next testimonial"
                      className="w-11 h-11 rounded-full border border-blue-200 bg-white text-blue-700 flex items-center justify-center hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all cursor-pointer shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 mt-4 tnum">
                    0{quoteIndex + 1} <span className="text-blue-300">/</span> 03
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-6">
                {TESTIMONIALS.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setQuoteIndex(i)}
                    aria-label={`Show ${t.name}'s testimonial`}
                    className={`rounded-full transition-all cursor-pointer ${quoteIndex === i ? "ring-[3px] ring-blue-600 ring-offset-2 ring-offset-white scale-110" : "opacity-50 hover:opacity-90 grayscale-[35%]"}`}
                  >
                    <Image src={t.avatar} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 13 · PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="relative mist-canvas text-[#0A1C3F] scroll-mt-24 border-t border-blue-100/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <span aria-hidden="true" className="ghost-numeral font-display font-semibold absolute top-6 right-4 sm:right-8 text-[6rem] sm:text-[8rem] hidden lg:block">09</span>
          <Reveal className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L("priceE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight mt-5" style={{ color: NAVY }}>
              {L("priceT1")}
              <br /> <em className="blue-gradient-text">{L("priceT2")}</em>
            </h2>
            <p className="text-[15px] text-slate-500 mt-4">{L("priceSub")}</p>
            <div className="mt-8 inline-flex items-center gap-1 bg-white p-1.5 rounded-full border border-blue-100 shadow-sm" role="group" aria-label="Billing period">
              <button
                onClick={() => setAnnualBilling(false)}
                aria-pressed={!annualBilling}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${!annualBilling ? "bg-[#0A1C3F] text-white shadow" : "text-slate-400 hover:text-[#0A1C3F]"}`}
              >
                {L("monthly")}
              </button>
              <button
                onClick={() => setAnnualBilling(true)}
                aria-pressed={annualBilling}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px] ${annualBilling ? "bg-blue-700 text-white shadow-lg shadow-blue-700/25" : "text-slate-400 hover:text-[#0A1C3F]"}`}
              >
                {L("annual")}
                <span className="px-2 py-0.5 rounded-full bg-sky-300 text-[#0A1C3F] text-[10px] font-black">−17%</span>
              </button>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto mt-12 items-stretch">
            <Reveal>
              <div className="h-full bg-white rounded-3xl p-8 border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all">
                <div>
                  <h3 className="font-display text-2xl" style={{ color: NAVY }}>Core OS</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Gate, billing and resident communication for small societies.</p>
                  <p className="mt-6"><span className="font-display text-5xl tnum" style={{ color: NAVY }}><span key={annualBilling ? "a-core" : "m-core"} className="price-pop">₹{annualBilling ? 25 : 30}</span></span> <span className="text-xs font-bold text-slate-400">{L("perFlat")}</span></p>
                  <ul className="space-y-3 text-[13px] font-semibold text-slate-600 mt-7 border-t border-blue-50 pt-6">
                    {["Smart gate & visitor OTP pass", "Automated maintenance invoices", "Digital notice board & polls", "Resident app (Android & iOS)", "Free Excel data import"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> {f}</li>
                    ))}
                  </ul>
                </div>
                <Link href="/register?plan=core" onClick={() => trackCTA("pricing_core")} className="mt-8 w-full py-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-sm text-center block transition-all active:scale-[0.98] min-h-[48px] flex items-center justify-center">
                  {L("coreBtn")}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={110}>
              <div className="relative h-full bg-gradient-to-b from-[#0B2A6B] via-[#0d3180] to-[#1D4ED8] text-white rounded-3xl p-8 border border-blue-400/30 shadow-[0_30px_80px_rgba(29,78,216,0.4)] flex flex-col justify-between overflow-hidden md:-my-3 md:py-11">
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 bg-sky-400/30 blur-[70px]" aria-hidden="true" />
                <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden="true" />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white text-blue-800 text-[10px] font-black rounded-full uppercase tracking-[0.16em] shadow-lg whitespace-nowrap">
                  {L("popular")}
                </div>
                <div className="relative">
                  <h3 className="font-display text-2xl mt-8">Compliance OS</h3>
                  <p className="text-xs text-sky-100/75 mt-1.5 leading-relaxed">GST/TDS engine, Tally sync and audit-ready governance.</p>
                  <p className="mt-6"><span className="font-display text-5xl tnum"><span key={annualBilling ? "a-comp" : "m-comp"} className="price-pop">₹{annualBilling ? 42 : 50}</span></span> <span className="text-xs font-bold text-sky-200/70">{L("perFlat")}</span></p>
                  <ul className="space-y-3 text-[13px] font-semibold text-white/85 mt-7 border-t border-white/15 pt-6">
                    {["Everything in Core OS", "1-click Tally Prime XML sync", "Automated GST & TDS engine", "Maker-Checker dual approval", "Helpdesk SLA timers", "Paid property listings", "Excel + PDF audit reports"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-sky-300 shrink-0" /> {f}</li>
                    ))}
                  </ul>
                </div>
                <Link href="/register?plan=compliance" onClick={() => trackCTA("pricing_compliance")} className="relative mt-8 w-full py-4 rounded-xl bg-white hover:bg-blue-50 text-[#0A1C3F] font-black text-sm text-center block shadow-lg active:scale-[0.98] transition-all min-h-[52px] flex items-center justify-center">
                  {L("compBtn")}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="h-full bg-white rounded-3xl p-8 border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all">
                <div>
                  <h3 className="font-display text-2xl" style={{ color: NAVY }}>AI Pro OS</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Predictive AI, 50 GB vault and a dedicated manager for large complexes.</p>
                  <p className="mt-6"><span className="font-display text-5xl tnum" style={{ color: NAVY }}><span key={annualBilling ? "a-ai" : "m-ai"} className="price-pop">₹{annualBilling ? 66 : 80}</span></span> <span className="text-xs font-bold text-slate-400">{L("perFlat")}</span></p>
                  <ul className="space-y-3 text-[13px] font-semibold text-slate-600 mt-7 border-t border-blue-50 pt-6">
                    {["Everything in Compliance OS", "AI anomaly detection in expenses", "24×7 society AI assistant", "50 GB encrypted document vault", "Dedicated relationship manager", "Custom bye-law workflows"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> {f}</li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => { trackCTA("pricing_enterprise"); setDemoModalOpen(true); }} className="mt-8 w-full py-3.5 rounded-xl bg-[#0A1C3F] hover:bg-blue-900 text-white font-extrabold text-sm transition-all active:scale-[0.98] cursor-pointer min-h-[48px]">
                  {L("aiBtn")}
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 14 · FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="relative bg-white text-[#0A1C3F] scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal className="text-center">
            <Eyebrow>{L("faqE")}</Eyebrow>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] tracking-tight mt-5" style={{ color: NAVY }}>{L("faqT1")} <em className="blue-gradient-text">{L("faqT2")}</em></h2>
          </Reveal>
          <div className="space-y-3.5 mt-12">
            {FAQS.map((faq, idx) => {
              const open = activeFaq === idx;
              return (
                <Reveal key={idx} delay={Math.min(idx * 50, 250)}>
                  <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${open ? "border-blue-300 shadow-[0_16px_40px_rgba(29,78,216,0.12)]" : "border-blue-100 shadow-sm"}`}>
                    <button
                      onClick={() => setActiveFaq(open ? null : idx)}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${idx}`}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-[15px] sm:text-base hover:text-blue-700 transition-colors cursor-pointer min-h-[56px]"
                      style={{ color: NAVY }}
                    >
                      <span>{faq.q}</span>
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${open ? "bg-blue-700 text-white rotate-180 shadow-md shadow-blue-700/30" : "bg-blue-50 text-blue-700"}`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {open && (
                      <div id={`faq-panel-${idx}`} className="px-5 sm:px-6 pb-6 pt-1 text-sm text-slate-500 leading-relaxed border-t border-blue-50 animate-fade-in">
                        <p className="pt-4">{faq.a}</p>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 15 · ROYAL FINALE ──────────────────────────────────────────── */}
      <section className="relative royal-canvas overflow-hidden">
        <div className="aurora absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] rounded-full bg-sky-400/25 blur-[140px]" aria-hidden="true" />
        <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <Reveal>
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 mx-auto mb-8 shadow-2xl">
              <Image src="/aapp.jpeg" alt="AapkiSociety logo" fill sizes="64px" className="object-cover" />
            </div>
            <h2 className="font-display text-white tracking-tight leading-[1.03] text-[clamp(2.5rem,6.5vw,5rem)]">
              {L("finT1")}
              <br /> <em className="text-sky-300">{L("finT2")}</em>
            </h2>
            <p className="text-sky-100/70 text-base sm:text-lg mt-6 max-w-2xl mx-auto">
              {L("finSub")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-10">
              <Magnetic strength={12}>
                <Link href="/register" onClick={() => trackCTA("finale_trial")} className="btn-shine w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-[#0A1C3F] hover:bg-blue-50 font-extrabold text-[15px] shadow-[0_18px_50px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[52px]">
                  {L("finCta1")} <ArrowRight className="w-5 h-5" />
                </Link>
              </Magnetic>
              <button onClick={() => { trackCTA("finale_specialist"); setDemoModalOpen(true); }} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-[15px] border border-white/25 hover:bg-white/20 hover:border-white/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm min-h-[52px]">
                <PhoneCall className="w-5 h-5 text-sky-300" /> {L("finCta2")}
              </button>
            </div>
            <p className="text-[11px] text-sky-200/50 font-bold tracking-wide mt-7 uppercase">
              {L("finNote")}
            </p>
          </Reveal>
        </div>
        <p className="ghost-word relative font-display font-semibold text-center text-[clamp(2.5rem,9vw,7rem)] leading-none pb-8 tracking-tight" aria-hidden="true">
          AAPKI&nbsp;SOCIETY
        </p>
      </section>

      {/* ── 16 · FOOTER ────────────────────────────────────────────────── */}
      <footer className="relative bg-[#081738] text-sky-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-white shrink-0">
                  <Image src="/aapp.jpeg" alt="AapkiSociety logo" fill sizes="40px" className="object-cover" />
                </div>
                <span className="text-xl font-black text-white">Aapki<span className="text-sky-300">Society</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                {L("footTag")}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-300/20 px-3 py-2 rounded-full w-fit mt-5">
                <ShieldCheck className="w-4 h-4" /> ISO 27001 · Indian Data Sovereignty
              </div>
            </div>
            <nav aria-label="Platform">
              <h4 className="text-white text-[11px] font-black uppercase tracking-[0.2em] mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                {[["GST Billing", "#features"], ["Gate Security", "#features"], ["Tally Export", "#features"], ["Helpdesk SLA", "#features"], ["Listings", "#features"], ["ROI Calculator", "#calculator"]].map(([l, h]) => (
                  <li key={l}><a href={h} className="hover:text-sky-300 transition-colors">{l}</a></li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Solutions">
              <h4 className="text-white text-[11px] font-black uppercase tracking-[0.2em] mb-4">Solutions</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                {[["Cooperative Housing (CHS)", "/register"], ["Apartments (AOA)", "/register"], ["Resident Welfare (RWA)", "/register"], ["CAs & Auditors", "/register"], ["Pricing", "#pricing"]].map(([l, h]) => (
                  <li key={l}><a href={h} className="hover:text-sky-300 transition-colors">{l}</a></li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Compliance">
              <h4 className="text-white text-[11px] font-black uppercase tracking-[0.2em] mb-4">Compliance</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link href="/privacy-policy" className="hover:text-sky-300 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/data-deletion" className="hover:text-sky-300 transition-colors">Data Deletion</Link></li>
                <li><a href="#security" className="hover:text-sky-300 transition-colors">DPDP Act 2023</a></li>
                <li><a href="#security" className="hover:text-sky-300 transition-colors">Security</a></li>
                <li><Link href="/login" className="hover:text-sky-300 transition-colors">Admin Portal</Link></li>
              </ul>
            </nav>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
            <p>© {new Date().getFullYear()} AapkiSociety · Powered by <span className="text-sky-300 font-bold">Datatrack</span></p>
            <p>Made with pride for housing societies across India</p>
          </div>
        </div>
      </footer>

      {/* ── FLOATING GROWTH WIDGETS ──────────────────────────────────── */}
      {/* Live social-proof toast */}
      {!demoModalOpen && (
        <div
          key={toastIndex}
          className="quote-enter fixed z-40 left-4 bottom-40 md:bottom-6 max-w-[calc(100vw-2rem)] sm:max-w-xs"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-xl pl-3 pr-2 py-2.5 shadow-[0_16px_45px_rgba(11,42,107,0.18)]">
            <span className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-700/30">
              {(() => {
                const Icon = TOASTS[toastIndex].icon;
                return <Icon className="w-4 h-4" />;
              })()}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold leading-snug" style={{ color: NAVY }}>{TOASTS[toastIndex].text}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mt-1">
                <span className="flex text-amber-400" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className="w-2.5 h-2.5 fill-current" />))}
                </span>
                Verified activity · {TOASTS[toastIndex].time}
              </span>
            </span>
            <button
              onClick={() => setToastIndex((toastIndex + 1) % TOASTS.length)}
              aria-label="Show next activity"
              className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp chat float */}
      {!demoModalOpen && (
        <button
          onClick={() => { trackCTA("whatsapp_float"); setDemoModalOpen(true); }}
          aria-label={L("waTooltip")}
          title={L("waTooltip")}
          className="group fixed z-40 right-4 bottom-24 md:right-6 md:bottom-6 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1eb856] text-white flex items-center justify-center shadow-[0_14px_35px_rgba(37,211,102,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <MessageCircle className="w-6 h-6 fill-current" />
          <span className="hidden md:block absolute right-full mr-3 whitespace-nowrap text-xs font-bold bg-[#0A1C3F] text-white px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {L("waTooltip")}
          </span>
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5" aria-hidden="true">
            <span className="ticker-dot absolute inline-flex h-full w-full rounded-full bg-red-500 border-2 border-white" />
          </span>
        </button>
      )}

      {/* Sticky mobile conversion bar */}
      {!demoModalOpen && (
        <div
          className={`md:hidden fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${showTop ? "translate-y-0" : "translate-y-full"}`}
          aria-hidden={!showTop}
        >
          <div className="bg-white/95 backdrop-blur-xl border-t border-blue-100 px-4 pt-3 flex gap-2.5 shadow-[0_-10px_35px_rgba(11,42,107,0.12)]" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <Link
              href="/register"
              onClick={() => trackCTA("sticky_trial")}
              tabIndex={showTop ? 0 : -1}
              className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-extrabold text-sm text-center flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              {L("stickyTrial")} <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { trackCTA("sticky_demo"); setDemoModalOpen(true); }}
              tabIndex={showTop ? 0 : -1}
              className="flex-1 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-extrabold text-sm flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              <PhoneCall className="w-4 h-4" /> {L("stickyDemo")}
            </button>
          </div>
        </div>
      )}

      {/* ── 17 · DEMO MODAL ────────────────────────────────────────────── */}
      <BackToTop visible={showTop} />
      {demoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C3F]/60 backdrop-blur-md animate-fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Book a live demo"
          onClick={() => !submittingDemo && setDemoModalOpen(false)}
        >
          <div
            className="relative bg-white text-[#0A1C3F] rounded-[1.75rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-blue-900/30 border border-blue-100 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full text-slate-400 hover:text-[#0A1C3F] hover:bg-blue-50 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close demo dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {demoSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-700/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display text-3xl" style={{ color: NAVY }}>Demo scheduled.</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                  Our RWA specialist will call <strong>{demoForm.phone || "you"}</strong> shortly for your walkthrough.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Request received · Team notified
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                    1-on-1 walkthrough
                  </span>
                  <h3 className="font-display text-3xl mt-3 tracking-tight" style={{ color: NAVY }}>Book your live demo</h3>
                  <p className="text-[13px] text-slate-400 mt-1.5">Billing, gate and accounts — explained for <em>your</em> society in 30 minutes.</p>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label htmlFor="demo-society" className="block mb-1.5">Society name *</label>
                    <input id="demo-society" type="text" required placeholder="e.g. Prestige Lakeside CHS" value={demoForm.societyName}
                      onChange={(e) => setDemoForm({ ...demoForm, societyName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/40 text-sm font-medium focus:border-blue-600 focus:outline-none focus:bg-white min-h-[48px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="demo-city" className="block mb-1.5">City *</label>
                      <input id="demo-city" type="text" required placeholder="Mumbai / Pune" value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/40 text-sm font-medium focus:border-blue-600 focus:outline-none focus:bg-white min-h-[48px]" />
                    </div>
                    <div>
                      <label htmlFor="demo-flats" className="block mb-1.5">Total flats *</label>
                      <input id="demo-flats" type="number" required min={1} placeholder="120" value={demoForm.flatCount}
                        onChange={(e) => setDemoForm({ ...demoForm, flatCount: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/40 text-sm font-medium focus:border-blue-600 focus:outline-none focus:bg-white min-h-[48px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="demo-name" className="block mb-1.5">Your name *</label>
                      <input id="demo-name" type="text" required placeholder="Rajesh Sharma" value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/40 text-sm font-medium focus:border-blue-600 focus:outline-none focus:bg-white min-h-[48px]" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <label htmlFor="demo-phone" className="block">WhatsApp number *</label>
                        {demoForm.phone.trim() && (
                          <span className={`text-[10px] ${normalizePhone(demoForm.phone).isValid ? "text-emerald-600 font-bold" : "text-amber-600 font-medium"}`}>
                            {normalizePhone(demoForm.phone).isValid ? `✓ ${normalizePhone(demoForm.phone).display}` : "10 digits"}
                          </span>
                        )}
                      </div>
                      <input id="demo-phone" type="tel" required placeholder="98200 12345" value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/40 text-sm font-medium focus:border-blue-600 focus:outline-none focus:bg-white min-h-[48px]" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="demo-email" className="block mb-1.5">Email <span className="font-medium text-slate-400">(optional)</span></label>
                    <input id="demo-email" type="email" placeholder="secretary@society.com" value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/40 text-sm font-medium focus:border-blue-600 focus:outline-none focus:bg-white min-h-[48px]" />
                  </div>
                  <button type="submit" disabled={submittingDemo}
                    className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-extrabold text-sm shadow-xl shadow-blue-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[52px]">
                    {submittingDemo ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scheduling…</>
                    ) : "Confirm & Schedule Demo"}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-medium">Confirmation on WhatsApp / call. No spam, ever.</p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
