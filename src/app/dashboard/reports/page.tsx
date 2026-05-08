"use client";

import { useState, useEffect } from "react";
import { dashboardAPI, billingAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, TrendingUp, IndianRupee, Receipt, MessageSquareWarning, Users, Download, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
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
    </div>
  );
}
