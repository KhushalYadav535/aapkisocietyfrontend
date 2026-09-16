"use client";

import { useState, useEffect } from "react";
import { violationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Camera,
  Car,
  Volume2,
  Trash,
  Dog,
  Hammer,
  ShieldCheck,
  CheckCircle2,
  X,
  IndianRupee,
  MessageCircle,
  Clock,
  ChevronRight,
  FileText
} from "lucide-react";

interface RuleViolation {
  id: string;
  society_id: string;
  reported_by_id: string;
  reported_by_name: string;
  reported_by_flat: string;
  reported_by_wing: string;
  violator_flat: string;
  violator_wing: string;
  violator_vehicle_number: string;
  violation_type: string;
  description: string;
  photo_url: string;
  fine_amount: number;
  status: "REPORTED" | "UNDER_REVIEW" | "WARNING_ISSUED" | "FINED" | "RESOLVED" | "DISMISSED";
  committee_notes: string;
  resolved_at: string;
  created_at: string;
}

const VIOLATION_TYPES = [
  { id: "UNAUTHORIZED_PARKING", label: "Wrong / Blocking Parking", icon: Car, color: "text-amber-600 bg-amber-50" },
  { id: "NOISE_DISTURBANCE", label: "Late Night Noise / Music", icon: Volume2, color: "text-purple-600 bg-purple-50" },
  { id: "LITTERING", label: "Trash / Garbage in Common Area", icon: Trash, color: "text-rose-600 bg-rose-50" },
  { id: "PET_POLICY", label: "Pet Policy / Uncleaned Waste", icon: Dog, color: "text-blue-600 bg-blue-50" },
  { id: "ILLEGAL_CONSTRUCTION", label: "Unauthorized Renovation / Drilling", icon: Hammer, color: "text-orange-600 bg-orange-50" },
  { id: "OTHER", label: "Other Society Bye-Law Breach", icon: AlertTriangle, color: "text-slate-600 bg-slate-50" }
];

export default function ViolationsPage() {
  const { user } = useAuth();
  const isAdminOrCommittee = ["ADMIN", "COMMITTEE", "GUARD", "PLATFORM_ADMIN"].includes(
    String(user?.role).toUpperCase()
  );

  const [violations, setViolations] = useState<RuleViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionModalViolation, setActionModalViolation] = useState<RuleViolation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Report Form
  const [form, setForm] = useState({
    violation_type: "UNAUTHORIZED_PARKING",
    violator_wing: "A",
    violator_flat: "",
    violator_vehicle_number: "",
    description: "",
    photo_url: ""
  });

  // Action Form (Committee)
  const [actionForm, setActionForm] = useState({
    status: "FINED",
    fine_amount: "500",
    committee_notes: ""
  });

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const res = await violationAPI.getAll();
      setViolations(res.data?.violations || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load violations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error("Please provide a description of the incident");
      return;
    }
    try {
      setSubmitting(true);
      await violationAPI.create(form);
      toast.success("Violation report submitted to Society Management");
      setShowReportModal(false);
      setForm({
        violation_type: "UNAUTHORIZED_PARKING",
        violator_wing: "A",
        violator_flat: "",
        violator_vehicle_number: "",
        description: "",
        photo_url: ""
      });
      fetchViolations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalViolation) return;
    try {
      setSubmitting(true);
      await violationAPI.updateAction(actionModalViolation.id, {
        status: actionForm.status,
        fine_amount: actionForm.status === "FINED" ? parseFloat(actionForm.fine_amount) : 0,
        committee_notes: actionForm.committee_notes
      });
      toast.success("Action recorded on violation ticket");
      setActionModalViolation(null);
      fetchViolations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update ticket");
    } finally {
      setSubmitting(false);
    }
  };

  // Image upload simulation (Base64 file reader)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredViolations = violations.filter((v) => {
    const matchesSearch =
      (v.violator_flat || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.violator_vehicle_number || "").toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      v.reported_by_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
    return true;
  });

  // Calculate Metrics
  const totalReported = violations.length;
  const pendingCount = violations.filter((v) => ["REPORTED", "UNDER_REVIEW"].includes(v.status)).length;
  const finedCount = violations.filter((v) => v.status === "FINED").length;
  const totalFinesLevied = violations.reduce((acc, v) => acc + (parseFloat(String(v.fine_amount)) || 0), 0);

  const getNoticeWhatsAppLink = (v: RuleViolation) => {
    const text = `🚨 *OFFICIAL SOCIETY NOTICE - RULE VIOLATION*\n\nDear Resident (${v.violator_wing ? v.violator_wing + "-" : ""}${v.violator_flat || "Flat"}),\n\nA violation of society bye-laws was recorded against your unit:\n• Violation: ${v.violation_type.replace(/_/g, " ")}\n• Details: ${v.description}\n${v.violator_vehicle_number ? `• Vehicle: ${v.violator_vehicle_number}\n` : ""}${v.fine_amount > 0 ? `• Fine Levied: ₹${v.fine_amount}\n` : ""}${v.committee_notes ? `• Committee Order: ${v.committee_notes}\n` : ""}\nPlease maintain community decorum and adhere to society regulations.\n\n- Managing Committee`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 backdrop-blur-md text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            Society Bye-Laws & Clean Living
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rule Violations & Parking Disputes</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Transparently report wrong parking, corridor clutter, pet waste, or noise disturbances with photo evidence.
            Committee enforces warnings and automated ledger fines.
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="relative z-10 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold transition-all shadow-md shrink-0"
        >
          <Plus className="w-5 h-5" />
          Report Violation
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Reported</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalReported}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Lifetime incident tickets</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">Pending Review</span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-700">{pendingCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting committee action</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block mb-1">Fines Levied</span>
          <div className="text-2xl sm:text-3xl font-bold text-rose-700">{finedCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Penalties confirmed</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Total Fines (₹)</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700">₹{totalFinesLevied.toLocaleString("en-IN")}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">To be credited to Society Fund</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search flat, vehicle, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "REPORTED", "FINED", "WARNING_ISSUED", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredViolations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No Active Violations</h3>
          <p className="text-sm text-slate-500 mb-4">
            The society premises are orderly and complaint-free!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredViolations.map((v) => {
            const vTypeInfo = VIOLATION_TYPES.find((t) => t.id === v.violation_type) || VIOLATION_TYPES[5];
            const Icon = vTypeInfo.icon;

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start justify-between"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-2xl shrink-0 ${vTypeInfo.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{vTypeInfo.label}</span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          v.status === "REPORTED"
                            ? "bg-amber-100 text-amber-800"
                            : v.status === "FINED"
                            ? "bg-rose-100 text-rose-800"
                            : v.status === "WARNING_ISSUED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {v.status.replace(/_/g, " ")}
                      </span>

                      {v.fine_amount > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          Fine: ₹{v.fine_amount}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-700">{v.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      {v.violator_flat && (
                        <div>
                          <span className="font-semibold text-slate-400">Violator Flat:</span>{" "}
                          <span className="font-bold text-slate-800">
                            {v.violator_wing ? `${v.violator_wing}-` : ""}
                            {v.violator_flat}
                          </span>
                        </div>
                      )}
                      {v.violator_vehicle_number && (
                        <div>
                          <span className="font-semibold text-slate-400">Vehicle No:</span>{" "}
                          <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                            {v.violator_vehicle_number}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-400">Reported By:</span>{" "}
                        <span>
                          {v.reported_by_name} ({v.reported_by_wing}-{v.reported_by_flat})
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">Date:</span>{" "}
                        <span>{new Date(v.created_at).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {v.committee_notes && (
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 mt-2">
                        <span className="font-bold text-slate-900 block mb-0.5">Managing Committee Order:</span>
                        {v.committee_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Evidence & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                  {v.photo_url && (
                    <a
                      href={v.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-slate-200 w-24 h-20 shrink-0 block"
                    >
                      <img
                        src={v.photo_url}
                        alt="Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                        View Photo
                      </div>
                    </a>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Share Notice via WhatsApp */}
                    <a
                      href={getNoticeWhatsAppLink(v)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-1.5 border border-emerald-200"
                      title="Send Official Society Notice via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Notify
                    </a>

                    {isAdminOrCommittee && (
                      <button
                        onClick={() => {
                          setActionModalViolation(v);
                          setActionForm({
                            status: v.status === "FINED" ? "FINED" : "WARNING_ISSUED",
                            fine_amount: v.fine_amount ? String(v.fine_amount) : "500",
                            committee_notes: v.committee_notes || ""
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
                      >
                        Action Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Violation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Report Society Violation</h2>
                <p className="text-xs text-slate-500">Provide photo proof and incident details</p>
              </div>
            </div>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Violation Category *
                </label>
                <select
                  value={form.violation_type}
                  onChange={(e) => setForm({ ...form, violation_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 bg-white"
                >
                  {VIOLATION_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Violator Wing
                  </label>
                  <input
                    type="text"
                    value={form.violator_wing}
                    onChange={(e) => setForm({ ...form, violator_wing: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Violator Flat (If known)
                  </label>
                  <input
                    type="text"
                    value={form.violator_flat}
                    onChange={(e) => setForm({ ...form, violator_flat: e.target.value })}
                    placeholder="e.g. 402"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Number (If parking issue)
                </label>
                <input
                  type="text"
                  value={form.violator_vehicle_number}
                  onChange={(e) => setForm({ ...form, violator_vehicle_number: e.target.value })}
                  placeholder="e.g. MH 02 CD 5678"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Incident Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe location, what happened, and impact on residents..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Photo Proof (Camera / File)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all">
                    <Camera className="w-4 h-4 text-slate-500" />
                    Select Photo
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {form.photo_url && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Committee Action Modal */}
      {actionModalViolation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setActionModalViolation(null)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Committee Decision</h2>
            <p className="text-xs text-slate-500 mb-4">
              Decide penalty, fine levy, or dismissal for ticket #{actionModalViolation.id.substring(0, 8)}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Action Decision *
                </label>
                <select
                  value={actionForm.status}
                  onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800 bg-white"
                >
                  <option value="FINED">Levy Penalty / Fine</option>
                  <option value="WARNING_ISSUED">Issue Formal Warning</option>
                  <option value="RESOLVED">Mark Resolved (Amicable Settlement)</option>
                  <option value="DISMISSED">Dismiss (False Alarm / Inadmissible)</option>
                </select>
              </div>

              {actionForm.status === "FINED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fine Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={actionForm.fine_amount}
                    onChange={(e) => setActionForm({ ...actionForm, fine_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Managing Committee Notes / Order
                </label>
                <textarea
                  rows={3}
                  value={actionForm.committee_notes}
                  onChange={(e) => setActionForm({ ...actionForm, committee_notes: e.target.value })}
                  placeholder="Reasoning, bye-law reference, or warning note..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionModalViolation(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
