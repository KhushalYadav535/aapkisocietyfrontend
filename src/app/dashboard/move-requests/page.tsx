"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { moveRequestAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import {
  Truck, Plus, Search, CheckCircle2, Clock, XCircle,
  FileCheck, Shield, QrCode, Download, Printer, ArrowRight,
  X, Building2, Calendar, FileText, Check, AlertTriangle, Eye
} from "lucide-react";

interface MoveRequest {
  id: string;
  society_id: string;
  user_id?: string;
  request_type: "MOVE_IN" | "MOVE_OUT";
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string;
  flat_number: string;
  wing: string;
  move_date: string;
  time_slot: string;
  vehicle_number?: string;
  mover_agency?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  certificate_number?: string;
  verification_token?: string;
  documents?: any[];
  lift_charges_paid?: number;
  security_deposit?: number;
  notes?: string;
  created_at: string;
}

export default function MoveRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MoveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState<MoveRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState<MoveRequest | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    request_type: "MOVE_IN",
    applicant_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    applicant_phone: user?.phone || "",
    applicant_email: user?.email || "",
    flat_number: user?.flat_number || "",
    wing: user?.wing || "",
    move_date: "",
    time_slot: "10:00 AM - 02:00 PM",
    vehicle_number: "",
    mover_agency: "",
    notes: "",
    agreementAccepted: false
  });

  const isCommitteeOrAdmin = ["ADMIN", "COMMITTEE", "TREASURER"].includes(user?.role || "");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await moveRequestAPI.getAll();
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to load move requests", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flat_number || !formData.move_date) {
      return toast.error("Flat number and move date are required");
    }
    if (!formData.agreementAccepted) {
      return toast.error("Please agree to society moving regulations");
    }

    try {
      await moveRequestAPI.create(formData);
      toast.success("Move request submitted for committee review!");
      setShowCreateModal(false);
      loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit request");
    }
  };

  const handleUpdateStatus = async (status: "APPROVED" | "REJECTED" | "COMPLETED") => {
    if (!showActionModal) return;
    try {
      await moveRequestAPI.updateStatus(showActionModal.id, {
        status,
        rejection_reason: actionNotes
      });
      toast.success(`Request marked as ${status}!`);
      setShowActionModal(null);
      setActionNotes("");
      loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === "PENDING").length;
    const approved = requests.filter(r => r.status === "APPROVED").length;
    const completed = requests.filter(r => r.status === "COMPLETED").length;
    return { pending, approved, completed, total: requests.length };
  }, [requests]);

  // Filtered
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        r.applicant_name.toLowerCase().includes(q) ||
        r.flat_number.toLowerCase().includes(q) ||
        r.wing.toLowerCase().includes(q) ||
        (r.certificate_number && r.certificate_number.toLowerCase().includes(q)) ||
        (r.vehicle_number && r.vehicle_number.toLowerCase().includes(q));

      const matchTab = tabFilter === "ALL" || r.status === tabFilter;
      return matchSearch && matchTab;
    });
  }, [requests, searchTerm, tabFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Move-In / Move-Out &amp; Digital NOC</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50">
              Verifiable QR
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated tenant moving pipeline, service lift scheduling, dues check, and official digital NOC generation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Request Move NOC
        </button>
      </div>

      {/* Bento Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting committee signoff</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved Digital NOCs</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved}</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for gate truck entry</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Transitions</p>
            <p className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-1">{stats.completed}</p>
            <p className="text-[11px] text-slate-400 mt-1">Successful relocations</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Resident Name, Flat, NOC #, Vehicle #..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "APPROVED", "COMPLETED", "REJECTED"].map(st => (
            <button
              key={st}
              onClick={() => setTabFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tabFilter === st
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                {["Type", "Applicant", "Unit / Flat", "Move Date & Slot", "Vehicle / Agency", "Status", "Digital NOC & Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold">No move requests found</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        r.request_type === "MOVE_IN"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60"
                          : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200/60"
                      }`}>
                        {r.request_type === "MOVE_IN" ? "Move In" : "Move Out"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{r.applicant_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{r.applicant_phone}</p>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-xs text-slate-900 dark:text-white">
                      {r.wing ? `${r.wing} - ` : ""}{r.flat_number}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white">{formatDate(r.move_date)}</p>
                      <p className="text-[11px] text-slate-400">{r.time_slot}</p>
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      {r.vehicle_number ? (
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {r.vehicle_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No Vehicle Tag</span>
                      )}
                      {r.mover_agency && <p className="text-[10px] text-slate-400 mt-0.5">{r.mover_agency}</p>}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold ${
                        r.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50"
                          : r.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50"
                          : r.status === "COMPLETED"
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50"
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {r.status === "APPROVED" && (
                          <button
                            onClick={() => setShowCertificateModal(r)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-200/50 flex items-center gap-1.5"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> View Digital NOC
                          </button>
                        )}

                        {r.status === "PENDING" && isCommitteeOrAdmin && (
                          <button
                            onClick={() => { setShowActionModal(r); setActionNotes(""); }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200/50"
                          >
                            Review &amp; Approve
                          </button>
                        )}

                        {r.status === "COMPLETED" && (
                          <span className="text-[11px] text-slate-400">Moved In</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Move Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 sm:p-7 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Request Move-In / Move-Out NOC</h2>
                  <p className="text-xs text-slate-400">Society compliance &amp; service lift booking</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Movement Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, request_type: "MOVE_IN" })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      formData.request_type === "MOVE_IN"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Move-In (Incoming Resident)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, request_type: "MOVE_OUT" })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      formData.request_type === "MOVE_OUT"
                        ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Move-Out (Outgoing Resident)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Applicant Name *</label>
                  <input
                    type="text"
                    value={formData.applicant_name}
                    onChange={e => setFormData({ ...formData, applicant_name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.applicant_phone}
                    onChange={e => setFormData({ ...formData, applicant_phone: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Wing (e.g. A)</label>
                  <input
                    type="text"
                    value={formData.wing}
                    onChange={e => setFormData({ ...formData, wing: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Flat Number *</label>
                  <input
                    type="text"
                    value={formData.flat_number}
                    onChange={e => setFormData({ ...formData, flat_number: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Move Date *</label>
                  <input
                    type="date"
                    value={formData.move_date}
                    onChange={e => setFormData({ ...formData, move_date: e.target.value })}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Service Lift Slot</label>
                  <select
                    value={formData.time_slot}
                    onChange={e => setFormData({ ...formData, time_slot: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="09:00 AM - 01:00 PM">09:00 AM - 01:00 PM (Morning)</option>
                    <option value="01:00 PM - 05:00 PM">01:00 PM - 05:00 PM (Afternoon)</option>
                    <option value="05:00 PM - 09:00 PM">05:00 PM - 09:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Truck / Vehicle Plate</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={e => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. MH 12 AB 1234"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Movers &amp; Packers Agency</label>
                  <input
                    type="text"
                    value={formData.mover_agency}
                    onChange={e => setFormData({ ...formData, mover_agency: e.target.value })}
                    placeholder="e.g. Agarwal Packers"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={formData.agreementAccepted}
                  onChange={e => setFormData({ ...formData, agreementAccepted: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="agreement" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  I agree to society move-in guidelines, elevator weight limits, and damage indemnity.
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Digital NOC Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl w-full max-w-2xl p-7 sm:p-9 animate-scale-in max-h-[95vh] overflow-y-auto text-slate-900 relative">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Authenticated Digital Certificate
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button
                  onClick={() => setShowCertificateModal(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Sheet (Printable Area) */}
            <div ref={printRef} className="border-4 border-double border-slate-800 p-8 rounded-2xl bg-white relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-7xl font-black rotate-[-25deg]">
                APPROVED NOC
              </div>

              {/* Society Header */}
              <div className="text-center pb-6 border-b-2 border-slate-800">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">
                  AS
                </div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900">AAPKI SOCIETY MANAGEMENT</h2>
                <p className="text-xs text-slate-600 font-semibold tracking-wide">CO-OPERATIVE HOUSING SOCIETY LTD.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Registration No: BOM/HSG/2024 • Verified Resident Portal</p>
                <div className="inline-block mt-3 px-4 py-1 bg-slate-900 text-white text-xs font-black tracking-widest uppercase rounded-md">
                  DIGITAL NO OBJECTION CERTIFICATE (NOC)
                </div>
              </div>

              {/* Certificate Details */}
              <div className="py-6 space-y-4 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Certificate No:</span>
                    <p className="font-mono text-sm font-bold text-indigo-700">{showCertificateModal.certificate_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">Issue Date:</span>
                    <p className="font-semibold text-slate-800">{showCertificateModal.approved_at ? formatDate(showCertificateModal.approved_at) : formatDate(showCertificateModal.created_at)}</p>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed">
                  This is to certify that the Managing Committee of AapkiSociety has <strong>NO OBJECTION</strong> for the resident movement specified below, having verified society dues, security deposits, and building regulations:
                </p>

                <div className="grid grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Movement Type</span>
                    <p className="font-bold text-slate-900 text-sm">{showCertificateModal.request_type === "MOVE_IN" ? "MOVE-IN (New Resident)" : "MOVE-OUT (Relocation)"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Resident Name</span>
                    <p className="font-bold text-slate-900 text-sm">{showCertificateModal.applicant_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Unit / Flat</span>
                    <p className="font-bold text-slate-900 text-sm">{showCertificateModal.wing ? `${showCertificateModal.wing} - ` : ""}Flat {showCertificateModal.flat_number}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Scheduled Move Date</span>
                    <p className="font-bold text-slate-900 text-sm">{formatDate(showCertificateModal.move_date)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Service Lift Window</span>
                    <p className="font-semibold text-slate-800">{showCertificateModal.time_slot}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Authorized Vehicle</span>
                    <p className="font-mono font-bold text-slate-800">{showCertificateModal.vehicle_number || "Not Registered"}</p>
                  </div>
                </div>

                {/* Gate Verification QR */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-xl p-2 flex flex-col items-center justify-center shrink-0">
                      <QrCode className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Security Gate Verification</p>
                      <p className="text-[10px] text-slate-500">Scan at entrance for moving truck authorization.</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Token: {showCertificateModal.verification_token?.slice(0, 16) || "AUTHENTIC"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="w-24 h-8 border-b border-slate-400 mx-auto" />
                    <p className="font-bold text-[11px] text-slate-900 mt-1">Authorized Signatory</p>
                    <p className="text-[10px] text-slate-500">{showCertificateModal.approved_by || "Secretary / Committee"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Committee Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-7 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Review Move Request</h2>
              <button onClick={() => setShowActionModal(null)} className="p-1.5 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl mb-4 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">{showActionModal.applicant_name} ({showActionModal.request_type})</p>
              <p className="text-slate-500">Unit: {showActionModal.wing ? `${showActionModal.wing} - ` : ""}{showActionModal.flat_number}</p>
              <p className="text-slate-500">Date: {formatDate(showActionModal.move_date)} ({showActionModal.time_slot})</p>
              <p className="text-slate-500">Vehicle: {showActionModal.vehicle_number || "None"}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Committee Comments / Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="e.g. All pending dues cleared. Lift slot confirmed."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("REJECTED")}
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("APPROVED")}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Issue Digital NOC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
