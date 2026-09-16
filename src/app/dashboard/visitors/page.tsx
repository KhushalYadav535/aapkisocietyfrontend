"use client";

import { useState, useEffect } from "react";
import { visitorAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { getWhatsAppUrl } from "@/lib/phone";
import { 
  UserCheck, 
  Plus, 
  Search, 
  LogOut, 
  X, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Car, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  KeyRound,
  Share2,
  Copy,
  MessageCircle,
  Zap,
  Utensils,
  PackageCheck,
  Wrench
} from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 15;

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  vehicle_number: string;
  check_in: string;
  check_out: string;
  status: string;
  passcode?: string;
  passcode_type?: string;
  valid_until?: string;
  created_at: string;
  flat_id?: string;
}

interface OverstayVisitor extends Visitor {
  hours_inside: number;
}

export default function VisitorsPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [overstaying, setOverstaying] = useState<OverstayVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<Visitor | null>(null);

  // Forms
  const [form, setForm] = useState({ visitor_name: "", visitor_phone: "", purpose: "", vehicle_number: "" });
  const [passForm, setPassForm] = useState({ visitor_name: "", visitor_phone: "", purpose: "Guest Visit", valid_hours: 24 });
  const [verifyForm, setVerifyForm] = useState({ passcode: "", flat_number: "" });

  const isAdmin = hasPermission('VISITOR_MANAGE') || ['ADMIN', 'GUARD', 'COMMITTEE'].includes(String(user?.role).toUpperCase());

  const load = async () => {
    setLoading(true);
    try { 
      const [r, ov] = await Promise.all([
        visitorAPI.getAll(),
        visitorAPI.getOverstaying(3).catch(() => ({ data: { overstaying: [] } }))
      ]);
      setVisitors(r.data.visitors || []); 
      setOverstaying(ov.data?.overstaying || []);
    } catch { 
      toast.error("Failed to load visitors"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await visitorAPI.create(form);
      toast.success("Visitor logged successfully!");
      setShowAdd(false);
      setForm({ visitor_name: "", visitor_phone: "", purpose: "", vehicle_number: "" });
      load();
    } catch { 
      toast.error("Failed to log visitor"); 
    }
  };

  const handleGeneratePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await visitorAPI.generatePasscode({
        ...passForm,
        flat_id: user?.flat_number || "N/A"
      });
      setGeneratedPass(res.data.visitor);
      toast.success("Guest passcode generated!");
      load();
    } catch {
      toast.error("Failed to generate guest pass");
    }
  };

  const handleQuickPreset = async (name: string, purpose: string, validHours: number, label: string) => {
    try {
      const res = await visitorAPI.generatePasscode({
        visitor_name: name,
        visitor_phone: "",
        purpose,
        valid_hours: validHours,
        flat_id: user?.flat_number || "Resident Flat"
      });
      setPassForm({
        visitor_name: name,
        visitor_phone: "",
        purpose,
        valid_hours: validHours
      });
      setGeneratedPass(res.data.visitor);
      setShowPassModal(true);
      toast.success(`Generated 1-tap pass for ${label}!`);
      load();
    } catch {
      toast.error("Failed to generate quick pass");
    }
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await visitorAPI.verifyPasscode(verifyForm);
      toast.success(res.data?.message || "Passcode verified! Guest checked in.");
      setShowVerifyModal(false);
      setVerifyForm({ passcode: "", flat_number: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid or expired passcode");
    }
  };

  const handleCheckout = async (id: string) => {
    try { 
      await visitorAPI.checkout(id); 
      toast.success("Visitor checked out successfully"); 
      load(); 
    } catch { 
      toast.error("Failed to checkout visitor"); 
    }
  };

  const statuses = ["ALL", "CHECKED_IN", "PRE_APPROVED", "CHECKED_OUT"];
  const filtered = visitors.filter(v => {
    const ms = `${v.visitor_name} ${v.visitor_phone || ""} ${v.purpose || ""} ${v.vehicle_number || ""} ${v.passcode || ""}`.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || v.status === statusFilter;
    return ms && mf;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedVisitors = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const checkedInCount = visitors.filter(v => v.status === "CHECKED_IN").length;
  const checkedOutCount = visitors.filter(v => v.status === "CHECKED_OUT").length;

  const getWhatsAppPasscodeLink = (pass: Visitor) => {
    const text = `🎉 *SOCIETY GUEST ENTRY PASS*\n\nHello ${pass.visitor_name}!\nYou have been invited to *AapkiSociety* (Flat ${pass.flat_id || "Resident"}).\n\n🔑 *Gate 4-Digit Passcode:* ${pass.passcode}\n⏰ *Purpose:* ${pass.purpose || "Guest Visit"}\n\nPlease show this passcode to the security guard at the gate for instant entry.\n\nWelcome!`;
    return getWhatsAppUrl(pass.visitor_phone, text);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("visitorsTitle")}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Zero-Hardware Digital Gate Passes, Passcode Check-In & Overstay Monitoring
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pre-Approve Pass button (Residents & Admins) */}
          <button
            onClick={() => {
              setGeneratedPass(null);
              setShowPassModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all shadow-sm"
          >
            <KeyRound className="w-4 h-4 text-emerald-600" />
            Generate Guest Pass
          </button>

          {/* Guard Verify Passcode */}
          {isAdmin && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              Verify Passcode
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Log Walk-In
            </button>
          )}
        </div>
      </div>

      {/* Overstay Warning Banner (If any visitor is inside > 3 hours) */}
      {overstaying.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Overstay Alert: {overstaying.length} visitor(s) inside society &gt; 3 hours</span>
          </div>
          <p className="text-xs text-rose-600 mb-3">
            Please check with residents or security guards to confirm if these visitors have departed or require checkout.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overstaying.map((v) => (
              <div key={v.id} className="bg-white rounded-xl p-3 border border-rose-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800">{v.visitor_name}</div>
                  <div className="text-[11px] text-slate-500">
                    Visiting: Flat {v.flat_id || "N/A"} • <span className="font-semibold text-rose-600">{v.hours_inside || 3}+ hrs inside</span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleCheckout(v.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-all"
                  >
                    Check Out
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Bento Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          { 
            label: "Currently Inside Society", 
            count: checkedInCount, 
            statusKey: "CHECKED_IN",
            icon: UserCheck, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50", 
            border: "border-emerald-200",
            pulse: true
          },
          { 
            label: "Completed Visits (Checked Out)", 
            count: checkedOutCount, 
            statusKey: "CHECKED_OUT",
            icon: LogOut, 
            color: "text-slate-600", 
            bg: "bg-slate-50", 
            border: "border-slate-200",
            pulse: false
          },
          { 
            label: "Total Registered Footfall", 
            count: visitors.length, 
            statusKey: "ALL",
            icon: ShieldCheck, 
            color: "text-indigo-600", 
            bg: "bg-indigo-50", 
            border: "border-indigo-200",
            pulse: false
          },
        ].map((s, i) => {
          const isSelected = statusFilter === s.statusKey;
          const CardIcon = s.icon;
          return (
            <button
              key={i}
              onClick={() => setStatusFilter(s.statusKey)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 group ${
                isSelected 
                  ? "bg-white ring-2 ring-indigo-500 shadow-md border-transparent" 
                  : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {s.label}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                  <CardIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {s.count}
                </span>
                {s.pulse && checkedInCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 1-Tap Instant Cab & Delivery Passes */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 p-[1px] rounded-3xl shadow-sm">
        <div className="bg-white rounded-[23px] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1-Tap Instant Gate Passes (Delivery & Cabs)</h3>
                <p className="text-[11px] text-slate-500">Auto-generate instant 4-digit passcodes for quick resident services</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Flat {user?.flat_number || "Resident"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: "food",
                name: "Zomato / Swiggy Partner",
                purpose: "Food Delivery",
                duration: 0.5,
                durationText: "30 Mins",
                label: "Swiggy / Zomato",
                desc: "Food Delivery",
                icon: Utensils,
                accent: "from-orange-500/10 to-amber-500/10 border-orange-200 hover:border-orange-400 text-orange-700",
                badgeBg: "bg-orange-100 text-orange-800"
              },
              {
                id: "courier",
                name: "Amazon / Blinkit / Flipkart",
                purpose: "E-Commerce Delivery",
                duration: 2,
                durationText: "2 Hours",
                label: "Amazon / Blinkit",
                desc: "Parcels & Grocery",
                icon: PackageCheck,
                accent: "from-blue-500/10 to-cyan-500/10 border-blue-200 hover:border-blue-400 text-blue-700",
                badgeBg: "bg-blue-100 text-blue-800"
              },
              {
                id: "cab",
                name: "Uber / Ola Driver",
                purpose: "Cab Pickup / Drop",
                duration: 0.25,
                durationText: "15 Mins",
                label: "Uber / Ola Cab",
                desc: "Pickup / Dropoff",
                icon: Car,
                accent: "from-emerald-500/10 to-teal-500/10 border-emerald-200 hover:border-emerald-400 text-emerald-700",
                badgeBg: "bg-emerald-100 text-emerald-800"
              },
              {
                id: "service",
                name: "Urban Company / Tech",
                purpose: "Home Maintenance & Repair",
                duration: 4,
                durationText: "4 Hours",
                label: "Urban Company",
                desc: "Service & Repairs",
                icon: Wrench,
                accent: "from-purple-500/10 to-indigo-500/10 border-purple-200 hover:border-purple-400 text-purple-700",
                badgeBg: "bg-purple-100 text-purple-800"
              }
            ].map((preset) => {
              const PresetIcon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleQuickPreset(preset.name, preset.purpose, preset.duration, preset.label)}
                  className={`flex flex-col text-left p-3 rounded-2xl border bg-gradient-to-br transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group ${preset.accent}`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <PresetIcon className="w-4 h-4 shrink-0" />
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${preset.badgeBg}`}>
                      {preset.durationText}
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-slate-900 line-clamp-1">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
            placeholder="Search by visitor name, passcode, phone, purpose or vehicle..."
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div className="flex items-center gap-1 pl-1 pr-2 text-xs font-semibold text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          {statuses.map(s => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s === "ALL" ? "All Visitors" : s.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visitors Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3.5 text-slate-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">No visitors logged</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
            Security gate records are empty. Pre-approve a guest pass or log visitor entries at the checkpoint.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Visitor</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Passcode</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purpose</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedVisitors.map(v => {
                    const isInside = v.status === "CHECKED_IN";
                    const isPreApproved = v.status === "PRE_APPROVED";

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-500/20 shrink-0">
                              {v.visitor_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{v.visitor_name}</span>
                              {v.flat_id && (
                                <span className="text-[10px] text-slate-400 font-medium">Flat {v.flat_id}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {v.passcode ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
                              <KeyRound className="w-3 h-3 text-emerald-600" />
                              {v.passcode}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Standard</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                            {v.purpose || "Guest Visit"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {v.visitor_phone ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{v.visitor_phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {v.check_in ? formatDate(v.check_in) : (
                            <span className="text-slate-400 italic">Pending Arrival</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {isInside ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              Checked In
                            </span>
                          ) : isPreApproved ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              Pre-Approved Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-100 text-slate-600">
                              Checked Out
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPreApproved && (
                              <a
                                href={getWhatsAppPasscodeLink(v)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-all"
                                title="Share Pass on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4 text-emerald-600" />
                              </a>
                            )}

                            {isAdmin && isInside && (
                              <button
                                onClick={() => handleCheckout(v.id)}
                                className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all border border-slate-200"
                              >
                                <LogOut className="w-3.5 h-3.5" /> Checkout
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Pre-Approve Guest Pass Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pre-Approved Guest Pass</h2>
                  <p className="text-[11px] text-slate-500">Instant gate passcode for guests</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPassModal(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generatedPass ? (
              <div className="mt-5 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Guest Pass Created!</h3>
                  <p className="text-xs text-slate-500 mt-1">Share this 4-digit code with your guest</p>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 my-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                    Entry Passcode
                  </span>
                  <div className="text-4xl font-extrabold tracking-widest font-mono text-emerald-700">
                    {generatedPass.passcode}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-2 block">
                    Valid for {passForm.valid_hours < 1 ? `${Math.round(passForm.valid_hours * 60)} mins` : `${passForm.valid_hours} hours`} • Flat {generatedPass.flat_id || user?.flat_number}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={getWhatsAppPasscodeLink(generatedPass)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-200" />
                    Share Pass on WhatsApp
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPass.passcode || "");
                      toast.success("Passcode copied to clipboard!");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Passcode
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGeneratePasscode} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Guest Full Name *
                  </label>
                  <input
                    value={passForm.visitor_name}
                    onChange={e => setPassForm(p => ({ ...p, visitor_name: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    placeholder="e.g. Priyanshu Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Guest Phone Number
                  </label>
                  <input
                    value={passForm.visitor_phone}
                    onChange={e => setPassForm(p => ({ ...p, visitor_phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pass Validity Duration
                  </label>
                  <select
                    value={passForm.valid_hours}
                    onChange={e => setPassForm(p => ({ ...p, valid_hours: parseInt(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value={4}>4 Hours (Short Visit / Delivery)</option>
                    <option value={12}>12 Hours (Half Day)</option>
                    <option value={24}>24 Hours (Full Day / Overnight)</option>
                    <option value={72}>3 Days (Weekend Stay)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowPassModal(false)} 
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
                  >
                    Generate Pass
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Guard Verify Passcode Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Verify Gate Passcode</h2>
                  <p className="text-[11px] text-slate-500">Fast Guard Check-In</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVerifyModal(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPasscode} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter 4-Digit Passcode *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={verifyForm.passcode}
                  onChange={e => setVerifyForm({ ...verifyForm, passcode: e.target.value })}
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  placeholder="----"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Flat Number (Optional)
                </label>
                <input
                  type="text"
                  value={verifyForm.flat_number}
                  onChange={e => setVerifyForm({ ...verifyForm, flat_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  placeholder="e.g. 402"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowVerifyModal(false)} 
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
                >
                  Check In Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Walk-In Visitor Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Log Walk-In Entry</h2>
                  <p className="text-[11px] text-slate-400">Security checkpoint check-in</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdd(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Visitor Full Name *
                </label>
                <input
                  value={form.visitor_name}
                  onChange={e => setForm(p => ({ ...p, visitor_name: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    value={form.visitor_phone}
                    onChange={e => setForm(p => ({ ...p, visitor_phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Number
                  </label>
                  <input
                    value={form.vehicle_number}
                    onChange={e => setForm(p => ({ ...p, vehicle_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 uppercase"
                    placeholder="MH 02 CZ 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Purpose of Visit
                </label>
                <input
                  value={form.purpose}
                  onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                  placeholder="e.g. Guest / Food Delivery / UrbanCompany"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)} 
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Log Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
