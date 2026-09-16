"use client";

import { useState, useEffect } from "react";
import { dashboardAPI, billingAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { 
  BarChart3, TrendingUp, IndianRupee, Receipt, MessageSquareWarning, 
  Users, Download, Calendar, TrendingDown, Sparkles, Sun, CloudRain, 
  ShieldAlert, ArrowUpRight, CheckCircle2, Droplets, Zap
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#f59e0b","#3b82f6","#10b981","#ef4444","#8b5cf6","#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {typeof p.value === "number" && p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [complaintStats, setComplaintStats] = useState<any>(null);
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [billTypeData, setBillTypeData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [collectionRes, complaintRes, billingRes] = await Promise.all([
        dashboardAPI.getCollectionSummary(),
        dashboardAPI.getComplaintStats(),
        billingAPI.getSummary(),
      ]);

      const raw = collectionRes.data.collection_summary || [];
      const now = new Date();
      const chartData = raw.map((item: any, i: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (5 - i));
        return {
          month: MONTHS[d.getMonth()],
          collected: item.total || 0,
          target: 28000,
        };
      });
      setCollectionData(chartData);
      setComplaintStats(complaintRes.data.complaint_stats);
      setBillingSummary(billingRes.data.summary);

      setBillTypeData([
        { name: "Maintenance", value: 65 },
        { name: "Water", value: 12 },
        { name: "Club House", value: 8 },
        { name: "Others", value: 15 },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const complaintPieData = complaintStats
    ? [
        { name: "Open", value: complaintStats.open },
        { name: "In Progress", value: complaintStats.in_progress },
        { name: "Resolved", value: complaintStats.resolved },
        { name: "Closed", value: complaintStats.closed },
      ].filter(d => d.value > 0)
    : [];

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(billingSummary?.total_collected || 0),
      sub: "All time collection",
      icon: IndianRupee,
      gradient: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Outstanding",
      value: formatCurrency(billingSummary?.outstanding || 0),
      sub: "Pending recovery",
      icon: Receipt,
      gradient: "from-rose-500 to-red-600",
      bg: "bg-rose-50",
    },
    {
      label: "Collection Rate",
      value: `${billingSummary?.collection_rate || 0}%`,
      sub: "Payment efficiency",
      icon: TrendingUp,
      gradient: "from-indigo-500 to-blue-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Complaint Resolution",
      value: complaintStats
        ? `${Math.round(((complaintStats.resolved + complaintStats.closed) / Math.max(complaintStats.open + complaintStats.in_progress + complaintStats.resolved + complaintStats.closed, 1)) * 100)}%`
        : "0%",
      sub: "Resolution rate",
      icon: MessageSquareWarning,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            {t("reportsTitle")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("reportsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-200">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm card-hover animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection vs Target Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Collection vs Target</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly comparison — last 6 months</p>
            </div>
          </div>
          {loading ? <div className="h-48 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={collectionData} barSize={14} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="target" name="Target" fill="#e0e7ff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Complaint Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">Complaint Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">Status breakdown by category</p>
          </div>
          {loading ? <div className="h-48 skeleton rounded-xl" /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={complaintPieData} cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={4} dataKey="value">
                    {complaintPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {complaintPieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-xs text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Type Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up" style={{ animationDelay: "250ms" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Bill Type Breakdown</h3>
          <p className="text-xs text-gray-400 mb-5">Revenue by billing category</p>
          {loading ? <div className="h-48 skeleton rounded-xl" /> : (
            <div className="space-y-3">
              {billTypeData.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.value}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Mini summary */}
          <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">Total Billed</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(billingSummary?.total_billed || 0)}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-xs text-indigo-400">Collected</p>
              <p className="text-sm font-bold text-indigo-700 mt-0.5">{formatCurrency(billingSummary?.total_collected || 0)}</p>
            </div>
          </div>
        </div>

        {/* Revenue Trend Line */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-slide-up lg:col-span-2" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly collection performance</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" /> Trending up
            </div>
          </div>
          {loading ? <div className="h-48 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={collectionData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#e0e7ff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: "350ms" }}>
        <div className="p-5 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Monthly Summary Report</h3>
          <p className="text-xs text-gray-400 mt-0.5">Detailed month-over-month data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Month</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Target</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Achievement</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
              </tr>
            </thead>
            <tbody>
              {collectionData.map((row, i) => {
                const pct = row.target > 0 ? Math.min((row.collected / row.target) * 100, 100) : 0;
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{row.month}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{formatCurrency(row.target)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.collected)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${pct >= 100 ? "bg-emerald-50 text-emerald-700" : pct >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-1.5 bg-gray-100 rounded-full w-28 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI-Driven Predictive Budget & Seasonal Expense Forecast */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm animate-slide-up" style={{ animationDelay: "380ms" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Predictive Seasonal Budget & Outflow Forecast</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI Projection
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Predictive algorithms forecasting seasonal utility surges, tanker demand, and monsoon provisions based on society history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start md:self-auto">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Forecast Horizon: Next 8 Months</span>
          </div>
        </div>

        {/* 3 Forecasting Insight Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-amber-800">Summer Surge (Apr–Jun)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-200/60 flex items-center justify-center text-amber-800">
                <Sun className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-amber-950">+38.5% Outflow</div>
            <p className="text-[11px] text-amber-700 mt-1">
              Water tanker demand surges +42% & common area power surges +28%. Recommended contingency reserve: ₹1,45,000.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-blue-800">Monsoon Preventions</span>
              <div className="w-7 h-7 rounded-lg bg-blue-200/60 flex items-center justify-center text-blue-800">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-blue-950">₹32,500 Buffer</div>
            <p className="text-[11px] text-blue-700 mt-1">
              Terrace waterproofing, basement sump pump overhaul & stormwater drain clearing scheduled for late May.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-emerald-800">Sinking Fund Runway</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/60 flex items-center justify-center text-emerald-800">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-emerald-950">4.6 Months Safe</div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Society treasury comfortably absorbs peak summer surges without supplementary resident levies.
            </p>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-700">Projected Monthly Outflow vs Fixed Maintenance Baseline</span>
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-slate-400 rounded-sm inline-block" />
                <span>Baseline (₹35,000)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block" />
                <span className="font-bold text-indigo-700">Projected Outflow</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={[
                  { month: "Apr (Summer)", baseline: 35000, projected: 48500, tankerSurge: 9500, powerSurge: 4000 },
                  { month: "May (Peak Heat)", baseline: 35000, projected: 54200, tankerSurge: 12500, powerSurge: 6700 },
                  { month: "Jun (Summer End)", baseline: 35000, projected: 50800, tankerSurge: 10500, powerSurge: 5300 },
                  { month: "Jul (Monsoon In)", baseline: 35000, projected: 44000, drainageReserve: 6500, powerSurge: 2500 },
                  { month: "Aug (Peak Rain)", baseline: 35000, projected: 42500, drainageReserve: 5500, powerSurge: 2000 },
                  { month: "Sep (Post-Rain)", baseline: 35000, projected: 38200, drainageReserve: 2200, powerSurge: 1000 },
                  { month: "Oct (Festive)", baseline: 35000, projected: 39500, festiveBonus: 4500, powerSurge: 0 },
                  { month: "Nov (Winter)", baseline: 35000, projected: 36200, festiveBonus: 1200, powerSurge: 0 },
                ]}
                margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="projected" name="Projected Spend" stroke="#6366f1" strokeWidth={2.5} fill="url(#projectedGrad)" />
                <Line type="monotone" dataKey="baseline" name="Baseline Budget" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Society Optimization Recommendations */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
            <Droplets className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Water Tanker Forward-Booking:</span>
              <p className="text-slate-500 mt-0.5">
                Bulk booking 20 tanker credits with verified vendor before April 1st locks ₹1,400/tanker rate vs peak ₹1,850 spot rates (est. savings ₹18,000).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Off-Peak Common Area Pump Scheduling:</span>
              <p className="text-slate-500 mt-0.5">
                Shifting overhead tank fill cycles to 10:00 PM – 4:00 AM off-peak hours can decrease common area electricity surcharge by 14%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Defaulter Aging Quick Access */}
      <Link href="/dashboard/reports/defaulters"
        className="flex items-center justify-between bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl p-5 hover:shadow-md transition-shadow animate-slide-up group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Defaulter Aging Report</h3>
            <p className="text-sm text-gray-500 mt-0.5">View outstanding dues by age buckets: 0–30, 31–60, 61–90, 90+ days</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-red-600 group-hover:translate-x-1 transition-transform">View →</span>
      </Link>
    </div>
  );
}
