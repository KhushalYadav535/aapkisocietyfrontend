"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { dashboardAPI, billingAPI, platformAPI } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import {
  Users, Receipt, MessageSquareWarning, UserCheck, IndianRupee,
  TrendingUp, Megaphone, ArrowUpRight, Clock, CheckCircle2, XCircle,
  Building2, Zap, AlertTriangle, Activity, QrCode, ShieldAlert
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface Stats {
  total_members: number; total_flats: number; pending_complaints: number;
  pending_bills: number; today_visitors: number; total_collection: number;
  monthly_collection: number; active_notices: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({ label, value, icon: Icon, gradient, delay = 0 }: any) {
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-gray-100 card-hover animate-slide-up shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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

  const role = String(user?.role || "").toUpperCase();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, activitiesRes, complaintRes, collectionRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getComplaintStats(),
        dashboardAPI.getCollectionSummary(),
      ]);
      setStats(statsRes.data.stats);
      setActivities(activitiesRes.data.activities);
      setComplaintStats(complaintRes.data.complaint_stats);

      // Transform collection data for chart
      const raw = collectionRes.data.collection_summary || [];
      const now = new Date();
      const chartData = raw.map((item: any, i: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (5 - i));
        return { month: MONTHS[d.getMonth()], amount: item.total || 0 };
      });
      setCollectionData(chartData);

      try {
        const billingRes = await billingAPI.getSummary();
        setBillingSummary(billingRes.data.summary);
      } catch {}

      // Load renewal stats for admin/treasurer
      if (['ADMIN', 'TREASURER', 'PLATFORM_ADMIN'].includes(role)) {
        try {
          const renewalRes = await platformAPI.getRenewals({ days: 30 });
          if (renewalRes.data?.renewals) {
            setRenewalStats({
              due_in_days: 30,
              total_amount: renewalRes.data.renewals.reduce((s: number, r: any) => s + (r.amount_due || 0), 0),
              renewals_due: renewalRes.data.renewals.length,
            });
          }
        } catch {}
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-36 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 skeleton rounded-2xl lg:col-span-2" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const isResident = role === "RESIDENT";
  const isGuard = role === "GUARD";
  const isMakerChecker = ["MAKER", "CHECKER"].includes(role);
  const isAdminOrTreasurer = ["ADMIN", "TREASURER", "PLATFORM_ADMIN"].includes(role);

  const statCards = [
    // Guard-specific: focus on visitors and safety
    ...(isGuard ? [
      { label: "Today's Visitors", value: stats?.today_visitors || 0, icon: UserCheck, gradient: "from-violet-500 to-purple-600" },
      { label: "Active Notices", value: stats?.active_notices || 0, icon: Megaphone, gradient: "from-indigo-500 to-indigo-600" },
    ] : []),
    // Maker/Checker: accounting focus
    ...(isMakerChecker ? [
      { label: "Pending Bills", value: stats?.pending_bills || 0, icon: Receipt, gradient: "from-orange-500 to-amber-500" },
      { label: "Active Notices", value: stats?.active_notices || 0, icon: Megaphone, gradient: "from-indigo-500 to-indigo-600" },
    ] : []),
    // Standard roles
    ...(!isGuard && !isMakerChecker ? [
      ...(!isResident ? [{ label: t("totalMembers"), value: stats?.total_members || 0, icon: Users, gradient: "from-blue-500 to-blue-600" }] : []),
      { label: t("monthlyCollection"), value: formatCurrency(stats?.monthly_collection || 0), icon: IndianRupee, gradient: "from-emerald-500 to-green-600" },
      { label: t("pendingBills"), value: stats?.pending_bills || 0, icon: Receipt, gradient: "from-orange-500 to-amber-500" },
      { label: t("openComplaints"), value: stats?.pending_complaints || 0, icon: MessageSquareWarning, gradient: "from-rose-500 to-red-600" },
      ...(!isResident ? [{ label: t("todayVisitors"), value: stats?.today_visitors || 0, icon: UserCheck, gradient: "from-violet-500 to-purple-600" }] : []),
      { label: t("activeNotices"), value: stats?.active_notices || 0, icon: Megaphone, gradient: "from-indigo-500 to-indigo-600" },
    ] : []),
  ];


  const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#6b7280"];
  const pieData = complaintStats
    ? [
        { name: "Open", value: complaintStats.open },
        { name: "In Progress", value: complaintStats.in_progress },
        { name: "Resolved", value: complaintStats.resolved },
        { name: "Closed", value: complaintStats.closed },
      ].filter(d => d.value > 0)
    : [];

  const totalComplaints = complaintStats
    ? complaintStats.open + complaintStats.in_progress + complaintStats.resolved + complaintStats.closed
    : 0;

  return (
    <div className="space-y-6">
      {/* Renewal Alert Banner */}
      {isAdminOrTreasurer && renewalStats && renewalStats.renewals_due > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Renewal Alert</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {renewalStats.renewals_due} societies due for renewal in {renewalStats.due_in_days} days —
              total outstanding: {formatCurrency(renewalStats.total_amount)}
            </p>
          </div>
          <button onClick={() => window.location.href = '/dashboard/platform-admin'}
            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
            Review Renewals
          </button>
        </div>
      )}

      {/* Grace Window Alert */}
      {isAdminOrTreasurer && billingSummary && billingSummary.overdue_bills > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Dunning Alert</p>
            <p className="text-xs text-red-600 mt-0.5">
              {billingSummary.overdue_bills} overdue bills —
              total outstanding: {formatCurrency(billingSummary.outstanding)}
            </p>
          </div>
          <button onClick={() => window.location.href = '/dashboard/billing'}
            className="text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
            View Defaulters
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white overflow-hidden animate-slide-up shadow-xl shadow-indigo-500/20">
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute right-24 bottom-0 w-48 h-48 bg-purple-500/20 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="absolute left-1/2 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-medium text-indigo-200">AI Pro Active</span>
            </div>
            <h1 className="text-2xl font-bold">
              Namaste, {user?.first_name}! 🙏
            </h1>
            <p className="text-indigo-200 mt-1 text-sm">
              {t("dashboardWelcome")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-sm">
              <Building2 className="w-4 h-4 text-indigo-200" />
              <span>{user?.role?.replace(/_/g, " ")}</span>
            </div>
            {user?.flat_number && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-sm">
                <span>Flat {user.wing}-{user.flat_number}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {(isGuard ? [
            { label: "Today's Visitors", value: stats?.today_visitors || 0 },
            { label: "Active Notices", value: stats?.active_notices || 0 },
            { label: "Active Notices", value: stats?.active_notices || 0 },
            { label: "Bills Pending", value: "-" },
          ] : isMakerChecker ? [
            { label: "Pending Bills", value: stats?.pending_bills || 0 },
            { label: "Active Notices", value: stats?.active_notices || 0 },
            { label: "Total Collection", value: formatCurrency(stats?.total_collection || 0) },
            { label: "Open Complaints", value: stats?.pending_complaints || 0 },
          ] : [
            ...(!isResident ? [{ label: "Total Flats", value: stats?.total_flats || 0 }] : []),
            { label: isResident ? "My Collection" : "Total Collection", value: formatCurrency(stats?.total_collection || 0) },
            ...(!isResident ? [{ label: "Active Members", value: stats?.total_members || 0 }] : [{ label: "Active Notices", value: stats?.active_notices || 0 }]),
            { label: "Bills Pending", value: stats?.pending_bills || 0 },
          ]).slice(0, 4).map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5">
              <p className="text-xs text-indigo-200">{item.label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} delay={i * 60} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Area Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover lg:col-span-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Collection Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months payment history</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Monthly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={collectionData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" name="Collected" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorAmount)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint Pie */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up" style={{ animationDelay: "260ms" }}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Complaints</h3>
            <p className="text-xs text-gray-400 mt-0.5">{totalComplaints} total requests</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex items-center justify-center text-gray-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Open", count: complaintStats?.open || 0, color: "bg-amber-400" },
              { label: "In Progress", count: complaintStats?.in_progress || 0, color: "bg-blue-500" },
              { label: "Resolved", count: complaintStats?.resolved || 0, color: "bg-emerald-500" },
              { label: "Closed", count: complaintStats?.closed || 0, color: "bg-gray-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Overview */}
        {billingSummary && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Billing Overview</h3>
            <div className="space-y-3">
              {[
                { label: "Total Billed", value: formatCurrency(billingSummary.total_billed), color: "text-gray-900" },
                { label: "Collected", value: formatCurrency(billingSummary.total_collected), color: "text-emerald-600" },
                { label: "Outstanding", value: formatCurrency(billingSummary.outstanding), color: "text-rose-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className={`font-semibold text-sm ${item.color}`}>{item.value}</span>
                </div>
              ))}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Collection Rate</span>
                  <span className="text-sm font-bold text-indigo-600">{billingSummary.collection_rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(billingSummary.collection_rate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up ${billingSummary ? "lg:col-span-2" : "lg:col-span-3"}`} style={{ animationDelay: "360ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Activity className="w-3.5 h-3.5" /> Live feed
            </span>
          </div>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
            ) : (
              activities.slice(0, 7).map((activity, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.type === "complaint" ? "bg-orange-50" :
                    activity.type === "payment" ? "bg-emerald-50" : "bg-indigo-50"
                  }`}>
                    {activity.type === "complaint" ? (
                      <MessageSquareWarning className="w-4 h-4 text-orange-500" />
                    ) : activity.type === "payment" ? (
                      <IndianRupee className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Megaphone className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {activity.title || `Payment of ${formatCurrency(activity.amount || 0)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.created_at)}</p>
                  </div>
                  {activity.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0 ${getStatusColor(activity.status)}`}>
                      {activity.status.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Guard Quick Actions */}
      {isGuard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
          <Link href="/dashboard/visitors" className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Log Visitor</p>
              <p className="text-xs text-gray-500 mt-0.5">Record new entry</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-indigo-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard/patrol" className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Patrol Scan</p>
              <p className="text-xs text-gray-500 mt-0.5">Scan QR checkpoint</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard/sos" className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">SOS Alerts</p>
              <p className="text-xs text-gray-500 mt-0.5">View active alerts</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-rose-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
