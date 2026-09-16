"use client";
import { useState, useEffect } from "react";
import { complaintAPI, memberAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate, getStatusColor } from "@/lib/utils";
import { 
  MessageSquareWarning, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  UserCheck2, 
  XCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  Wrench
} from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

interface Complaint { 
  id: string; 
  title: string; 
  description: string; 
  category: string; 
  priority: string; 
  status: string; 
  raised_by: string; 
  assigned_to: string; 
  resolution_notes: string; 
  created_at: string; 
}

const CATEGORIES = ["GENERAL","PLUMBING","ELECTRICAL","SECURITY","HOUSEKEEPING","LIFT","PARKING","OTHER"];
const PRIORITIES = ["LOW","MEDIUM","HIGH","URGENT"];

const PRIORITY_BADGES: Record<string, { bg: string; text: string; ring: string }> = { 
  LOW: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-500/20" }, 
  MEDIUM: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500/20" }, 
  HIGH: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-500/20" }, 
  URGENT: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-500/30" } 
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = { 
  OPEN: { icon: MessageSquareWarning, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/80 dark:bg-amber-950/30", border: "border-amber-200/60 dark:border-amber-900/40" }, 
  IN_PROGRESS: { icon: Clock, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50/80 dark:bg-sky-950/30", border: "border-sky-200/60 dark:border-sky-900/40" }, 
  RESOLVED: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/80 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-900/40" }, 
  CLOSED: { icon: XCircle, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100/80 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-800" } 
};

export default function ComplaintsPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "GENERAL", priority: "MEDIUM" });
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = hasPermission('COMPLAINT_ASSIGN');
  const canRaise = !hasPermission('COMPLAINT_ASSIGN');

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        complaintAPI.getAll(), 
        isAdmin ? memberAPI.getAll() : Promise.resolve({ data: { members: [] } })
      ]);
      setComplaints(c.data.complaints || []);
      setMembers(m.data.members || []);
    } catch { 
      toast.error("Failed to load complaints"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await complaintAPI.create(form); 
      toast.success("Complaint raised successfully!"); 
      setShowAdd(false); 
      setForm({ title: "", description: "", category: "GENERAL", priority: "MEDIUM" }); 
      load(); 
    } catch { 
      toast.error("Failed to raise complaint"); 
    }
  };

  const handleAssign = async () => {
    if (!selected || !assignTo) return;
    try { 
      await complaintAPI.assign(selected.id, { assigned_to: assignTo }); 
      toast.success("Assigned & moved to in-progress!"); 
      setSelected(null); 
      load(); 
    } catch { 
      toast.error("Failed to assign ticket"); 
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    try { 
      await complaintAPI.resolve(selected.id, { resolution_notes: resolveNotes }); 
      toast.success("Ticket resolved!"); 
      setSelected(null); 
      setResolveNotes(""); 
      load(); 
    } catch { 
      toast.error("Failed to resolve ticket"); 
    }
  };

  const handleClose = async (id: string) => {
    try { 
      await complaintAPI.close(id); 
      toast.success("Ticket closed"); 
      load(); 
    } catch { 
      toast.error("Failed to close ticket"); 
    }
  };

  const statuses = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const filtered = complaints.filter(c => {
    const ms = `${c.title} ${c.category} ${c.priority}`.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || c.status === statusFilter;
    return ms && mf;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedComplaints = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const openCount = complaints.filter(c => c.status === "OPEN").length;
  const inProgressCount = complaints.filter(c => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter(c => c.status === "RESOLVED").length;
  const closedCount = complaints.filter(c => c.status === "CLOSED").length;

  return (
    <div className="space-y-7 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t("complaintsTitle")}
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Track, dispatch and resolve resident grievances with live SLA metrics
              </p>
            </div>
          </div>
        </div>

        {canRaise && (
          <button 
            data-testid="raise-complaint" 
            onClick={() => setShowAdd(true)} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> {t("raiseComplaint")}
          </button>
        )}
      </div>

      {/* KPI Bento Status Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: "Open Tickets", count: openCount, statusKey: "OPEN", icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/70 dark:bg-amber-950/20", border: "border-amber-200/70 dark:border-amber-900/40", glow: "from-amber-500/10" },
          { label: "In Progress", count: inProgressCount, statusKey: "IN_PROGRESS", icon: Clock, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50/70 dark:bg-sky-950/20", border: "border-sky-200/70 dark:border-sky-900/40", glow: "from-sky-500/10" },
          { label: "Resolved", count: resolvedCount, statusKey: "RESOLVED", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/70 dark:bg-emerald-950/20", border: "border-emerald-200/70 dark:border-emerald-900/40", glow: "from-emerald-500/10" },
          { label: "Closed / Archived", count: closedCount, statusKey: "CLOSED", icon: XCircle, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50/80 dark:bg-slate-900/40", border: "border-slate-200/80 dark:border-slate-800", glow: "from-slate-500/10" },
        ].map((card, i) => {
          const isSelected = statusFilter === card.statusKey;
          const CardIcon = card.icon;
          return (
            <button
              key={i}
              onClick={() => setStatusFilter(isSelected ? "ALL" : card.statusKey)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
                isSelected 
                  ? "bg-white dark:bg-slate-900 ring-2 ring-indigo-500 shadow-md border-transparent" 
                  : "bg-white dark:bg-slate-900/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                  <CardIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {card.count}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  tickets
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <span>{isSelected ? "Active Filter" : "Click to view"}</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            placeholder="Search by title, category, priority..."
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 pl-1 pr-2 text-xs font-semibold text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          {statuses.map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {s === "ALL" ? "All Tickets" : s.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center mx-auto mb-3.5 text-slate-400">
            <MessageSquareWarning className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-base">No grievances found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL" 
              ? "No tickets match your search criteria. Try adjusting filters."
              : "All systems running smoothly! There are no open or pending grievances in this society."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {paginatedComplaints.map((c) => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN;
            const Icon = cfg.icon;
            const prio = PRIORITY_BADGES[c.priority] || PRIORITY_BADGES.MEDIUM;

            return (
              <div 
                key={c.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all p-5 relative overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Icon + Core info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider">
                          #TKT-{c.id.substring(0, 6).toUpperCase()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {formatDate(c.created_at)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {c.category}
                        </span>
                      </div>

                      <h3 
                        data-testid={`complaint-title-${c.id}`} 
                        className="font-bold text-slate-900 dark:text-white text-base tracking-tight"
                      >
                        {c.title}
                      </h3>

                      {c.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                          {c.description}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {c.assigned_to && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            <UserCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Assigned to: {c.assigned_to === "cleantech" ? "CleanTech Facility Services" : "Designated Staff"}</span>
                          </div>
                        )}

                        {c.status === "IN_PROGRESS" && (
                          <span 
                            data-testid={`complaint-eta-${c.id}`} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-900/40 text-xs font-semibold text-sky-700 dark:text-sky-300"
                          >
                            <Clock className="w-3 h-3 text-sky-500" />
                            ETA: Within 24h
                          </span>
                        )}
                      </div>

                      {/* Resolution note */}
                      {c.resolution_notes && (
                        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Resolution Note:</span> {c.resolution_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status badges + Action Buttons */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ring-1 ${prio.bg} ${prio.text} ${prio.ring}`}>
                        {c.priority}
                      </span>
                      <span 
                        data-testid={`complaint-status-${c.id}`} 
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${getStatusColor(c.status)}`}
                      >
                        {c.status === "IN_PROGRESS" ? "ASSIGNED" : c.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Admin Action Buttons */}
                    {isAdmin && !["RESOLVED", "CLOSED"].includes(c.status) && (
                      <div className="flex items-center gap-2 pt-1">
                        {c.status === "OPEN" && (
                          <button 
                            data-testid={`btn-assign-${c.id}`} 
                            onClick={() => setSelected(c)} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/60 transition-all shadow-sm"
                          >
                            <UserCheck2 className="w-3.5 h-3.5" /> Assign & Dispatch
                          </button>
                        )}
                        {c.status === "IN_PROGRESS" && (
                          <button 
                            data-testid={`btn-resolve-${c.id}`} 
                            onClick={() => { setSelected(c); setResolveNotes(""); }} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                          </button>
                        )}
                      </div>
                    )}

                    {/* Resident Close Action Button */}
                    {!isAdmin && c.status === "RESOLVED" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          data-testid={`btn-close-${c.id}`} 
                          onClick={() => handleClose(c.id)} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Confirm & Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Action / Resolution Drawer Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {selected.status === "OPEN" ? "Assign Ticket" : "Resolve Grievance"}
                </h2>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 my-4 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-400">
                <span>#TKT-{selected.id.substring(0, 6).toUpperCase()}</span>
                <span>•</span>
                <span>{selected.category}</span>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm mt-1">
                {selected.title}
              </p>
            </div>

            {selected.status === "OPEN" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assignee / Vendor Partner
                  </label>
                  <select 
                    data-testid="assign-dropdown" 
                    value={assignTo} 
                    onChange={(e) => setAssignTo(e.target.value)} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Select vendor or committee member...</option>
                    <option value="cleantech">CleanTech Facility Services (Vendor)</option>
                    {members
                      .filter((m) => ["ADMIN", "COMMITTEE"].includes(m.role))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => setSelected(null)} 
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    data-testid="assign-submit" 
                    onClick={handleAssign} 
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all"
                  >
                    Assign & Start
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Resolution Notes & Action Taken
                  </label>
                  <textarea 
                    data-testid="resolve-notes" 
                    value={resolveNotes} 
                    onChange={(e) => setResolveNotes(e.target.value)} 
                    placeholder="Describe how the issue was resolved for the resident..." 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 h-28 resize-none" 
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => setSelected(null)} 
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    data-testid="resolve-submit" 
                    onClick={handleResolve} 
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Grievance Modal */}
      {showAdd && canRaise && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Raise New Grievance
                </h2>
              </div>
              <button 
                onClick={() => setShowAdd(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject / Summary *
                </label>
                <input 
                  data-testid="complaint-title-input" 
                  value={form.title} 
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} 
                  required 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  placeholder="e.g. Water leakage in Master Bathroom" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detailed Description
                </label>
                <textarea 
                  data-testid="complaint-desc-input" 
                  value={form.description} 
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 h-24 resize-none" 
                  placeholder="Provide any relevant details, timing or specific location..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select 
                    data-testid="complaint-category-input" 
                    value={form.category} 
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select 
                    data-testid="complaint-priority-input" 
                    value={form.priority} 
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Attach Photo (Optional)
                </label>
                <input 
                  data-testid="complaint-photo-input" 
                  type="file" 
                  accept="image/*" 
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100" 
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  data-testid="complaint-submit" 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
