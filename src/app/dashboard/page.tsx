"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { dashboardAPI, billingAPI, platformAPI } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users, Receipt, MessageSquareWarning, UserCheck, IndianRupee,
  TrendingUp, Megaphone, ArrowUpRight, Clock, CheckCircle2,
  Building2, Zap, AlertTriangle, Activity, QrCode, ShieldAlert,
  ChevronRight, Sparkles, ShieldCheck,
  Calendar, X, Wallet, ArrowDownRight
} from "lucide-react";

// Lazy-load recharts
const {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} = {
  AreaChart: dynamic(() => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false }),
  Area: dynamic(() => import('recharts').then(m => ({ default: m.Area })), { ssr: false }),
  XAxis: dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false }),
  YAxis: dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false }),
  CartesianGrid: dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false }),
  Tooltip: dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false }),
  ResponsiveContainer: dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false }),
  PieChart: dynamic(() => import('recharts').then(m => ({ default: m.PieChart })), { ssr: false }),
  Pie: dynamic(() => import('recharts').then(m => ({ default: m.Pie })), { ssr: false }),
  Cell: dynamic(() => import('recharts').then(m => ({ default: m.Cell })), { ssr: false }),
};

interface Stats {
  total_members: number;
  total_flats: number;
  pending_complaints: number;
  pending_bills: number;
  today_visitors: number;
  total_collection: number;
  monthly_collection: number;
  active_notices: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#64748b"];

// Premium Executive Stat Card (Crisp White in Light Mode, Rich Slate in Dark Mode)
const ExecutiveStatCard = memo(function ExecutiveStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  gradient,
  shadowColor,
  trend,
  trendType = "neutral",
  href,
  delay = 0
}: any) {
  const content = (
    <div
      className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top subtle ambient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{label}</p>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md ${shadowColor} group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${
            trendType === "positive" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" :
            trendType === "negative" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" :
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {trendType === "positive" && <TrendingUp className="w-3 h-3" />}
            {trendType === "negative" && <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
          {href && (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              View <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
});

// Sleek Tooltip for Charts
const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl shadow-xl border border-slate-200 dark:border-white/10 p-3 text-xs">
        <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
            <span className="text-slate-600 dark:text-slate-300">{p.name}:</span>
            <span className="text-slate-900 dark:text-white">{typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
});

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [complaintStats, setComplaintStats] = useState<any>(null);
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [renewalStats, setRenewalStats] = useState<{ due_in_days: number; total_amount: number; renewals_due: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "payment" | "complaint">("all");

  const role = String(user?.role || "").toUpperCase();
  const isAdminOrTreasurer = ["ADMIN", "TREASURER", "PLATFORM_ADMIN"].includes(role);

  const loadData = useCallback(async () => {
    try {
      const [overviewResult, billingResult, renewalResult] = await Promise.allSettled([
        dashboardAPI.getOverview(),
        billingAPI.getSummary(),
        isAdminOrTreasurer ? platformAPI.getRenewals({ days: 30 }) : Promise.resolve(null),
      ]);

      if (overviewResult.status === 'fulfilled') {
        const data = overviewResult.value.data;
        setStats(data.stats);
        setActivities(data.activities || []);
        setComplaintStats(data.complaint_stats);

        const raw = data.collection_summary || [];
        const now = new Date();
        const chartData = raw.map((item: any, i: number) => {
          const d = new Date(now);
          d.setMonth(d.getMonth() - (5 - i));
          return { month: MONTHS[d.getMonth()], amount: item.total || 0 };
        });
        setCollectionData(chartData);
      }

      if (billingResult.status === 'fulfilled' && billingResult.value?.data?.summary) {
        setBillingSummary(billingResult.value.data.summary);
      }

      if (renewalResult.status === 'fulfilled' && renewalResult.value?.data?.renewals) {
        const renewals = renewalResult.value.data.renewals;
        setRenewalStats({
          due_in_days: 30,
          total_amount: renewals.reduce((s: number, r: any) => s + (r.amount_due || 0), 0),
          renewals_due: renewals.length,
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdminOrTreasurer]);

  useEffect(() => { loadData(); }, [loadData]);

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Su-prabhat";
    if (hours < 17) return "Namaste";
    return "Shubh Sandhya";
  }, []);

  const isResident = role === "RESIDENT";
  const isGuard = role === "GUARD";
  const isMakerChecker = ["MAKER", "CHECKER"].includes(role);

  const filteredActivities = useMemo(() => {
    if (activityFilter === "all") return activities;
    return activities.filter(a => a.type === activityFilter);
  }, [activities, activityFilter]);

  const pieData = useMemo(() => complaintStats
    ? [
      { name: "Open", value: complaintStats.open },
      { name: "In Progress", value: complaintStats.in_progress },
      { name: "Resolved", value: complaintStats.resolved },
      { name: "Closed", value: complaintStats.closed },
    ].filter(d => d.value > 0)
    : [],
    [complaintStats]
  );

  const totalComplaints = useMemo(() => complaintStats
    ? complaintStats.open + complaintStats.in_progress + complaintStats.resolved + complaintStats.closed
    : 0,
    [complaintStats]
  );

  const hasAlerts = isAdminOrTreasurer && (
    (renewalStats && renewalStats.renewals_due > 0) ||
    (billingSummary && billingSummary.overdue_bills > 0)
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-56 skeleton rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 skeleton rounded-3xl lg:col-span-2" />
          <div className="h-80 skeleton rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── 1. SMART ACTION & ALERT CENTER (CLEAN CRISP WHITE IN LIGHT THEME) ── */}
      {hasAlerts && !alertsDismissed && (
        <div className="relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 shadow-xs transition-all duration-300 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {renewalStats && renewalStats.renewals_due > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <strong className="text-amber-700 dark:text-amber-300">{renewalStats.renewals_due} Societies</strong> due for renewal ({formatCurrency(renewalStats.total_amount)})
                  </span>
                )}
                {renewalStats && billingSummary && billingSummary.overdue_bills > 0 && (
                  <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                )}
                {billingSummary && billingSummary.overdue_bills > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <strong className="text-rose-700 dark:text-rose-300">{billingSummary.overdue_bills} Overdue Invoices</strong> ({formatCurrency(billingSummary.outstanding)})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {renewalStats && renewalStats.renewals_due > 0 && (
                <Link
                  href="/dashboard/platform-admin"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-colors shadow-xs"
                >
                  Renewals →
                </Link>
              )}
              {billingSummary && billingSummary.overdue_bills > 0 && (
                <Link
                  href="/dashboard/billing"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-900 dark:text-rose-200 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 transition-colors shadow-xs"
                >
                  Defaulters →
                </Link>
              )}
              <button
                onClick={() => setAlertsDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Dismiss alerts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. EXECUTIVE HERO COMMAND BANNER (BRIGHT & CRISP WHITE IN LIGHT THEME) ── */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Luminous soft ambient gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/50 dark:bg-indigo-500/15 blur-3xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-100/40 dark:bg-purple-500/10 blur-2xl rounded-full pointer-events-none translate-y-1/3" />
        <div className="absolute top-1/2 left-0 w-48 h-48 bg-blue-100/40 dark:bg-blue-500/10 blur-2xl rounded-full pointer-events-none -translate-x-1/3" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                AI Smart Society Engine Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Gateway
              </span>
            </div>
            
            <h1 suppressHydrationWarning className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {greeting}, <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">{user?.first_name || "Admin"}</span>! 🙏
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs sm:text-sm font-medium max-w-xl">
              Here is your society&apos;s real-time executive cockpit. All gates, accounting vouchers, and member services are synchronized.
            </p>
          </div>

          {/* Quick Info Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>{user?.role ? user.role.replace(/_/g, " ") : "Administrator"}</span>
            </div>
            {user?.flat_number && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <span>Unit {user.wing ? `${user.wing}-` : ""}{user.flat_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span suppressHydrationWarning>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Executive Action Shortcuts Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Actions</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all active:scale-95 shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Raise Invoice</span>
            </Link>
            <Link
              href="/dashboard/notices"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all active:scale-95 shadow-xs"
            >
              <Megaphone className="w-3.5 h-3.5 text-cyan-500" />
              <span>+ Post Notice</span>
            </Link>
            <Link
              href="/dashboard/members"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all active:scale-95 shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>+ Add Resident</span>
            </Link>
            <Link
              href="/dashboard/visitors"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all active:scale-95 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-violet-500" />
              <span>Visitor Gate Log</span>
            </Link>
          </div>
        </div>

        {/* Embedded Glass Stat Pillars */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Flats</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.total_flats || 0}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Configured
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Inflow</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats?.total_collection || 0)}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Cumulative Inflow
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Community</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.total_members || 0}</p>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Profiles
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Dues</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.pending_bills || 0}</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Action Required
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. EXECUTIVE KPI BENTO GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {!isGuard && !isMakerChecker && !isResident && (
          <ExecutiveStatCard
            label={t("totalMembers")}
            value={stats?.total_members || 0}
            subtitle="Registered residents & owners"
            icon={Users}
            gradient="from-blue-500 to-indigo-600"
            shadowColor="shadow-blue-500/20"
            trend="100% Onboarded"
            trendType="positive"
            href="/dashboard/members"
            delay={50}
          />
        )}

        <ExecutiveStatCard
          label={t("monthlyCollection")}
          value={formatCurrency(stats?.monthly_collection || 0)}
          subtitle="Collected this current cycle"
          icon={IndianRupee}
          gradient="from-emerald-500 to-teal-600"
          shadowColor="shadow-emerald-500/20"
          trend="Collection velocity active"
          trendType="positive"
          href="/dashboard/billing"
          delay={100}
        />

        <ExecutiveStatCard
          label={t("pendingBills")}
          value={stats?.pending_bills || 0}
          subtitle="Invoices awaiting settlement"
          icon={Receipt}
          gradient="from-amber-500 to-orange-600"
          shadowColor="shadow-amber-500/20"
          trend={billingSummary?.overdue_bills ? `${billingSummary.overdue_bills} Overdue` : "Tracking active"}
          trendType={billingSummary?.overdue_bills ? "negative" : "neutral"}
          href="/dashboard/billing"
          delay={150}
        />

        <ExecutiveStatCard
          label={t("openComplaints")}
          value={stats?.pending_complaints || 0}
          subtitle="Grievances awaiting committee action"
          icon={MessageSquareWarning}
          gradient="from-rose-500 to-red-600"
          shadowColor="shadow-rose-500/20"
          trend={stats?.pending_complaints ? `${stats.pending_complaints} in queue` : "All resolved"}
          trendType={stats?.pending_complaints ? "negative" : "positive"}
          href="/dashboard/complaints"
          delay={200}
        />

        {!isResident && (
          <ExecutiveStatCard
            label={t("todayVisitors")}
            value={stats?.today_visitors || 0}
            subtitle="Gate entries logged today"
            icon={UserCheck}
            gradient="from-violet-500 to-purple-600"
            shadowColor="shadow-violet-500/20"
            trend="Security Gate Active"
            trendType="positive"
            href="/dashboard/visitors"
            delay={250}
          />
        )}

        <ExecutiveStatCard
          label={t("activeNotices")}
          value={stats?.active_notices || 0}
          subtitle="Announcements in circulation"
          icon={Megaphone}
          gradient="from-cyan-500 to-blue-600"
          shadowColor="shadow-cyan-500/20"
          trend="Broadcasts active"
          trendType="neutral"
          href="/dashboard/notices"
          delay={300}
        />
      </div>

      {/* ── 4. ANALYTICS & INSIGHTS BENTO ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Area Chart (2 Columns) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Collection & Cashflow Velocity</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  Last 6 Months
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time monthly maintenance revenue & settlement stream
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                Avg: {formatCurrency(Math.round((stats?.total_collection || 0) / 6))} / mo
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={1} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Collected"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#collectionGradient)"
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint & Grievance Breakdown (1 Column) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Grievance Health</h3>
              <span className="text-xs font-semibold text-slate-500">{totalComplaints} Total</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Status distribution of member tickets
            </p>
          </div>

          <div className="relative flex items-center justify-center my-2">
            {pieData.length > 0 ? (
              <div className="w-full h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalComplaints}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tickets</span>
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Zero Grievances</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All tickets resolved smoothly</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { label: "Open", count: complaintStats?.open || 0, color: "bg-amber-400" },
              { label: "In Progress", count: complaintStats?.in_progress || 0, color: "bg-blue-500" },
              { label: "Resolved", count: complaintStats?.resolved || 0, color: "bg-emerald-500" },
              { label: "Closed", count: complaintStats?.closed || 0, color: "bg-slate-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. FINANCIAL HEALTH & LIVE ACTIVITY BENTO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Health Matrix */}
        {billingSummary && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Society Financials</h3>
                  <p className="text-xs text-slate-400">Maker-Checker Dual Control</p>
                </div>
              </div>
              <Link href="/dashboard/billing" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Ledger →
              </Link>
            </div>

            <div className="space-y-4">
              {/* Collection Rate Meter */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall Recovery Rate</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{billingSummary.collection_rate}%</span>
                </div>
                <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.min(billingSummary.collection_rate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Financial KPIs List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Billed</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(billingSummary.total_billed)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/20">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Total Recovered</span>
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(billingSummary.total_collected)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/20">
                  <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Outstanding Dues</span>
                  <span className="text-xs font-black text-rose-800 dark:text-rose-300">{formatCurrency(billingSummary.outstanding)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Dual-Approval Enforced
                </span>
                <span>GST Compliant</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Operations Activity Feed */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow ${billingSummary ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Operations Feed</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Audit log of recent payments, tickets, and notices</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setActivityFilter("all")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activityFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActivityFilter("payment")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activityFilter === "payment" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActivityFilter("complaint")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activityFilter === "complaint" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Grievances
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-sm font-semibold">No recent activity logged</p>
                <p className="text-xs text-slate-400 mt-0.5">New payments and tickets will stream here live.</p>
              </div>
            ) : (
              filteredActivities.slice(0, 6).map((activity, i) => (
                <div key={i} className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    activity.type === "complaint" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
                    activity.type === "payment" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                    "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                  }`}>
                    {activity.type === "complaint" ? (
                      <MessageSquareWarning className="w-4 h-4" />
                    ) : activity.type === "payment" ? (
                      <IndianRupee className="w-4 h-4" />
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-semibold truncate">
                      {activity.title || `Payment of ${formatCurrency(activity.amount || 0)}`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(activity.created_at)}</p>
                  </div>
                  {activity.status && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${getStatusColor(activity.status)}`}>
                      {activity.status.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── 6. GUARD QUICK ACTIONS (FOR SECURITY GUARDS) ── */}
      {isGuard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <Link href="/dashboard/visitors" className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Log Visitor</p>
              <p className="text-xs text-slate-500 mt-0.5">Record new entry pass</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-indigo-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard/patrol" className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Patrol Scan</p>
              <p className="text-xs text-slate-500 mt-0.5">Scan QR checkpoint</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard/sos" className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">SOS Alerts</p>
              <p className="text-xs text-slate-500 mt-0.5">Active emergency beacon</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-rose-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
