"use client";
import { useState, useEffect } from "react";
import { visitorAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate, getStatusColor } from "@/lib/utils";
import { UserCheck, Plus, Search, LogOut, X } from "lucide-react";
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
  created_at: string;
}

export default function VisitorsPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({ visitor_name: "", visitor_phone: "", purpose: "", vehicle_number: "" });

  const isAdmin = hasPermission('VISITOR_MANAGE');

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const r = await visitorAPI.getAll(); setVisitors(r.data.visitors); }
    catch { toast.error("Failed to load visitors"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await visitorAPI.create(form);
      toast.success("Visitor logged!");
      setShowAdd(false);
      setForm({ visitor_name: "", visitor_phone: "", purpose: "", vehicle_number: "" });
      load();
    } catch { toast.error("Failed"); }
  };

  const handleCheckout = async (id: string) => {
    try { await visitorAPI.checkout(id); toast.success("Checked out"); load(); }
    catch { toast.error("Failed"); }
  };

  const handleApprove = async (id: string) => {
    try { await visitorAPI.approve(id); toast.success("Approved"); load(); }
    catch { toast.error("Failed"); }
  };

  const statuses = ["ALL", "CHECKED_IN", "CHECKED_OUT"];
  const filtered = visitors.filter(v => {
    const ms = `${v.visitor_name} ${v.visitor_phone} ${v.purpose}`.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || v.status === statusFilter;
    return ms && mf;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedVisitors = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const checkedIn = visitors.filter(v => v.status === "CHECKED_IN").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("visitorsTitle")}</h1>
          <p className="text-gray-400 text-sm mt-1">{checkedIn} currently inside · {visitors.length} total today</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" /> {t("logVisitor")}
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {[
          { label: "Currently Inside", count: checkedIn, color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
          { label: "Checked Out", count: visitors.filter(v => v.status === "CHECKED_OUT").length, color: "bg-gray-50 border-gray-100", text: "text-gray-600" },
          { label: "Total Logged", count: visitors.length, color: "bg-indigo-50 border-indigo-100", text: "text-indigo-700" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${s.color} animate-slide-up`}>
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            <p className={`text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search visitors..."
          />
        </div>
        <div className="flex gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck className="w-14 h-14 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No visitors found</p>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Visitor", "Purpose", "Phone", "Vehicle", "Check In", "Check Out", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedVisitors.map(v => (
                    <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                            {v.visitor_name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{v.visitor_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{v.purpose || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{v.visitor_phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{v.vehicle_number || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(v.check_in)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {v.check_out ? formatDate(v.check_out) : <span className="text-emerald-500 font-medium">Inside</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${getStatusColor(v.status)}`}>
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && v.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckout(v.id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" /> Checkout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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

      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Visitor Entry</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Visitor Name *</label>
                <input
                  value={form.visitor_name}
                  onChange={e => setForm(p => ({ ...p, visitor_name: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                  <input
                    value={form.visitor_phone}
                    onChange={e => setForm(p => ({ ...p, visitor_phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vehicle No.</label>
                  <input
                    value={form.vehicle_number}
                    onChange={e => setForm(p => ({ ...p, vehicle_number: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="MH01AB1234"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Purpose of Visit</label>
                <input
                  value={form.purpose}
                  onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="Guest / Delivery / Service"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Log Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
