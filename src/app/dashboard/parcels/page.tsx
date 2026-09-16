"use client";

import { useState, useEffect, useMemo } from "react";
import { parcelAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import {
  Package, Plus, Search, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, ArrowRight, X, KeyRound, Truck, Filter,
  Building2, Hash, Sparkles, Check, Copy
} from "lucide-react";

interface Parcel {
  id: string;
  society_id: string;
  flat_number: string;
  wing: string;
  recipient_name: string;
  delivery_company: string;
  tracking_number?: string;
  parcel_count: number;
  pickup_pin: string;
  status: "AT_GATE" | "COLLECTED" | "RETURNED";
  photo_url?: string;
  notes?: string;
  received_by_guard_id?: string;
  collected_by_name?: string;
  collected_at?: string;
  returned_at?: string;
  created_at: string;
}

const COURIER_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Amazon:    { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/60" },
  Flipkart:  { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/60" },
  Swiggy:    { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200/60" },
  Zomato:    { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200/60" },
  BlueDart:  { color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/60" },
  DTDC:      { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/60" },
  IndiaPost: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200/60" },
  Other:     { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" },
};

export default function ParcelsPage() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [stats, setStats] = useState({ at_gate: 0, collected_today: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState<Parcel | null>(null);
  const [verifyPinInput, setVerifyPinInput] = useState("");
  const [collectedByName, setCollectedByName] = useState("");

  // Log Form
  const [formData, setFormData] = useState({
    flat_number: "",
    wing: "",
    recipient_name: "",
    delivery_company: "Amazon",
    tracking_number: "",
    parcel_count: 1,
    notes: ""
  });

  const isGuardOrAdmin = ["ADMIN", "GUARD", "COMMITTEE", "TREASURER"].includes(user?.role || "");

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        parcelAPI.getAll(),
        parcelAPI.getStats()
      ]);
      setParcels(pRes.data.parcels || []);
      setStats(sRes.data.stats || { at_gate: 0, collected_today: 0, overdue: 0 });
    } catch (err) {
      console.error("Failed to load parcels", err);
      toast.error("Failed to load parcel data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flat_number.trim()) return toast.error("Flat number is required");
    try {
      const res = await parcelAPI.create(formData);
      toast.success(res.data.message || "Parcel logged at gate!");
      setShowLogModal(false);
      setFormData({
        flat_number: "",
        wing: "",
        recipient_name: "",
        delivery_company: "Amazon",
        tracking_number: "",
        parcel_count: 1,
        notes: ""
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to log parcel");
    }
  };

  const handleVerifyHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVerifyModal) return;
    if (!verifyPinInput.trim()) return toast.error("Please enter 4-digit Pickup PIN");

    try {
      await parcelAPI.verifyAndCollect(showVerifyModal.id, verifyPinInput.trim(), collectedByName);
      toast.success("PIN Verified! Parcel handed over successfully.");
      setShowVerifyModal(null);
      setVerifyPinInput("");
      setCollectedByName("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid PIN. Verification failed.");
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm("Are you sure you want to mark this parcel as returned to courier?")) return;
    try {
      await parcelAPI.markReturned(id);
      toast.success("Parcel marked as returned to courier");
      loadData();
    } catch (err) {
      toast.error("Failed to return parcel");
    }
  };

  // Filtered parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        p.flat_number.toLowerCase().includes(q) ||
        p.wing.toLowerCase().includes(q) ||
        p.recipient_name.toLowerCase().includes(q) ||
        p.delivery_company.toLowerCase().includes(q) ||
        (p.tracking_number && p.tracking_number.toLowerCase().includes(q));

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchCompany = companyFilter === "ALL" || p.delivery_company === companyFilter;
      return matchSearch && matchStatus && matchCompany;
    });
  }, [parcels, searchTerm, statusFilter, companyFilter]);

  // Resident's incoming parcels at gate
  const residentActiveParcels = useMemo(() => {
    if (user?.role !== "RESIDENT" || !user?.flat_number) return [];
    return parcels.filter(p => p.flat_number === user.flat_number && p.status === "AT_GATE");
  }, [parcels, user]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gate Parcels & Delivery Log</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50">
              Live Station
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-hardware package tracking with automated 4-digit PIN verification & resident notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isGuardOrAdmin && (
            <button
              onClick={() => setShowLogModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Log Incoming Parcel
            </button>
          )}
        </div>
      </div>

      {/* Resident PIN Spotlight Banner (If resident has package waiting) */}
      {residentActiveParcels.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Ready for Collection</p>
              <h3 className="text-lg font-bold">
                You have {residentActiveParcels.length} parcel{residentActiveParcels.length > 1 ? "s" : ""} waiting at the Main Gate!
              </h3>
              <p className="text-xs text-indigo-100/90 mt-0.5">Show this 4-Digit PIN to security to release your packages.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl self-stretch md:self-auto justify-center">
            <KeyRound className="w-4 h-4 text-amber-300" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-100 font-medium">Pickup PIN:</span>
              <span className="font-mono text-xl font-black tracking-widest text-white">
                {residentActiveParcels[0]?.pickup_pin}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">At Security Gate</p>
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">{stats.at_gate}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting resident collection</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Handed Over Today</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{stats.collected_today}</p>
            <p className="text-[11px] text-slate-400 mt-1">Verified with 4-digit PIN</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue (&gt;48 Hrs)</p>
            <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1">{stats.overdue}</p>
            <p className="text-[11px] text-slate-400 mt-1">Automated reminders pending</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Flat, Recipient, Courier, Tracking #..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "AT_GATE", "COLLECTED", "RETURNED"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Parcels Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                {["Delivery Partner", "Unit / Flat", "Recipient", "Arrival Date", "Pickup PIN", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>
                ))
              ) : filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold">No parcels found</p>
                  </td>
                </tr>
              ) : (
                filteredParcels.map(p => {
                  const courier = COURIER_CONFIG[p.delivery_company] || COURIER_CONFIG.Other;
                  const canSeePin = isGuardOrAdmin || (user?.role === "RESIDENT" && user?.flat_number === p.flat_number);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${courier.bg} ${courier.color} ${courier.border}`}>
                            {p.delivery_company}
                          </span>
                          {p.parcel_count > 1 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              x{p.parcel_count}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {p.wing ? `${p.wing} - ` : ""}{p.flat_number}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.recipient_name || "Resident"}</p>
                        {p.tracking_number && (
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{p.tracking_number}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>

                      <td className="px-4 py-3.5">
                        {canSeePin && p.status === "AT_GATE" ? (
                          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 rounded-xl font-mono font-bold text-xs">
                            {p.pickup_pin}
                          </span>
                        ) : p.status === "COLLECTED" ? (
                          <span className="text-xs text-slate-400">Verified</span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">••••</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold ${
                          p.status === "AT_GATE"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50"
                            : p.status === "COLLECTED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}>
                          {p.status === "AT_GATE" ? "At Gate" : p.status === "COLLECTED" ? "Collected" : "Returned"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {p.status === "AT_GATE" && isGuardOrAdmin && (
                            <>
                              <button
                                onClick={() => { setShowVerifyModal(p); setVerifyPinInput(""); }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200/50 flex items-center gap-1"
                              >
                                <KeyRound className="w-3.5 h-3.5" /> Verify Handover
                              </button>
                              <button
                                onClick={() => handleReturn(p.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors"
                                title="Return to courier"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {p.status === "COLLECTED" && p.collected_at && (
                            <span className="text-[11px] text-slate-400">
                              Handed to {p.collected_by_name || "Resident"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Incoming Parcel Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-7 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Log Incoming Parcel</h2>
                  <p className="text-xs text-slate-400">Generate 4-Digit Pickup PIN for resident</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Delivery Partner selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Delivery Partner *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Amazon", "Flipkart", "Swiggy", "Zomato", "BlueDart", "Other"].map(comp => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_company: comp })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.delivery_company === comp
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border-indigo-500 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Wing (Optional)</label>
                  <input
                    type="text"
                    value={formData.wing}
                    onChange={e => setFormData({ ...formData, wing: e.target.value.toUpperCase() })}
                    placeholder="e.g. A"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Flat Number *</label>
                  <input
                    type="text"
                    value={formData.flat_number}
                    onChange={e => setFormData({ ...formData, flat_number: e.target.value })}
                    placeholder="e.g. 402"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Recipient Name</label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tracking / AWB #</label>
                  <input
                    type="text"
                    value={formData.tracking_number}
                    onChange={e => setFormData({ ...formData, tracking_number: e.target.value })}
                    placeholder="e.g. FMPC91823"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Parcel Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.parcel_count}
                    onChange={e => setFormData({ ...formData, parcel_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Security Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Left on Gate Shelf #2"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  Confirm &amp; Notify Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Handover Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-sm p-6 sm:p-7 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Verify Pickup PIN</h2>
                  <p className="text-xs text-slate-400">Handing over package</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 mb-4 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Unit {showVerifyModal.wing ? `${showVerifyModal.wing}-` : ""}{showVerifyModal.flat_number}
              </p>
              <p className="text-slate-500">Partner: {showVerifyModal.delivery_company} ({showVerifyModal.parcel_count} item{showVerifyModal.parcel_count > 1 ? "s" : ""})</p>
              <p className="text-slate-500">Addressed to: {showVerifyModal.recipient_name || "Resident"}</p>
            </div>

            <form onSubmit={handleVerifyHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter Resident&apos;s 4-Digit PIN *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={verifyPinInput}
                  onChange={e => setVerifyPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  autoFocus
                  className="w-full py-3 text-center text-2xl font-mono font-bold tracking-[0.5em] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Collecting Person Name (Optional)
                </label>
                <input
                  type="text"
                  value={collectedByName}
                  onChange={e => setCollectedByName(e.target.value)}
                  placeholder="e.g. Self / Maid / Family member"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Verify &amp; Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
