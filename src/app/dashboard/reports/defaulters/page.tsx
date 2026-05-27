"use client";
import { useState, useEffect } from "react";
import { extendedReportsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { TrendingDown, IndianRupee, Phone, Mail, AlertCircle, Download } from "lucide-react";

interface Defaulter {
  member_id: string; first_name: string; last_name: string;
  flat_number: string; wing: string; phone: string; email: string;
  total_bills: number; outstanding: number; oldest_due_date: string;
  bucket_0_30: number; bucket_31_60: number; bucket_61_90: number; bucket_90_plus: number;
}
interface Totals { total_outstanding: number; bucket_0_30: number; bucket_31_60: number; bucket_61_90: number; bucket_90_plus: number; }

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

export default function DefaulterAgingPage() {
  const { user, hasPermission } = useAuth();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await extendedReportsAPI.getDefaulterAging();
      setDefaulters(r.data.defaulters);
      setTotals(r.data.totals);
    } catch { toast.error("Failed to load defaulter report"); }
    finally { setLoading(false); }
  };

  const filtered = defaulters.filter(d =>
    `${d.first_name} ${d.last_name} ${d.flat_number} ${d.wing} ${d.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [
      ["Name", "Flat", "Wing", "Phone", "Total Due", "0-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Oldest Due"],
      ...filtered.map(d => [
        `${d.first_name} ${d.last_name}`, d.flat_number, d.wing, d.phone,
        d.outstanding, d.bucket_0_30, d.bucket_31_60, d.bucket_61_90, d.bucket_90_plus,
        d.oldest_due_date ? new Date(d.oldest_due_date).toLocaleDateString("en-IN") : ""
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `defaulter_aging_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-7 h-7 text-red-500" /> Defaulter Aging Report
          </h1>
          <p className="text-gray-400 text-sm mt-1">{defaulters.length} defaulters · Outstanding dues by age buckets</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:-translate-y-0.5 transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Aging Buckets Summary */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Outstanding", value: fmt(totals.total_outstanding), color: "bg-red-50 border-red-100", text: "text-red-700" },
            { label: "0–30 Days", value: fmt(totals.bucket_0_30), color: "bg-yellow-50 border-yellow-100", text: "text-yellow-700" },
            { label: "31–60 Days", value: fmt(totals.bucket_31_60), color: "bg-orange-50 border-orange-100", text: "text-orange-700" },
            { label: "61–90 Days", value: fmt(totals.bucket_61_90), color: "bg-red-50 border-red-100", text: "text-red-700" },
            { label: "90+ Days", value: fmt(totals.bucket_90_plus), color: "bg-rose-50 border-rose-100", text: "text-rose-700 font-bold" },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${s.color}`}>
              <p className={`text-base font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Search by name, flat, phone..." />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <TrendingDown className="w-14 h-14 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-semibold">🎉 No defaulters! All dues are cleared.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Resident", "Flat", "Contact", "Total Due", "0–30 Days", "31–60 Days", "61–90 Days", "90+ Days", "Oldest Due"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.member_id} className={`border-t border-gray-50 hover:bg-gray-50/60 transition-colors ${d.bucket_90_plus > 0 ? "bg-rose-50/20" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                          {(d.first_name || "?").charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{d.first_name} {d.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.wing && `${d.wing}-`}{d.flat_number || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {d.phone && <a href={`tel:${d.phone}`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs"><Phone className="w-3 h-3" /> {d.phone}</a>}
                        {d.email && <p className="flex items-center gap-1 text-gray-400 text-xs"><Mail className="w-3 h-3" /> {d.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">{fmt(d.outstanding)}</span>
                      <p className="text-xs text-gray-400">{d.total_bills} bill{d.total_bills > 1 ? "s" : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-yellow-600 font-medium">{d.bucket_0_30 > 0 ? fmt(d.bucket_0_30) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-orange-600 font-medium">{d.bucket_31_60 > 0 ? fmt(d.bucket_31_60) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{d.bucket_61_90 > 0 ? fmt(d.bucket_61_90) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {d.bucket_90_plus > 0
                        ? <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">{fmt(d.bucket_90_plus)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {d.oldest_due_date ? new Date(d.oldest_due_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
