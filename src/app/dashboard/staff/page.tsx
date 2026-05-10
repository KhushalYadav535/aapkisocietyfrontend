"use client";

import { useState, useEffect } from "react";
import { staffAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { HardHat, Plus, Search, Clock, CheckCircle, XCircle, X, IndianRupee, LogIn, LogOut, Timer } from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 15;

const STAFF_TYPES = ["SECURITY_GUARD", "HOUSEKEEPING", "GARDENER", "ELECTRICIAN", "PLUMBER", "MAINTENANCE", "MANAGER", "ACCOUNTANT", "OTHER"];
const STATUS_COLORS: Record<string, string> = { PRESENT: "bg-emerald-100 text-emerald-700", ABSENT: "bg-red-100 text-red-700" };

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatDay = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const calcHours = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return null;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export default function StaffPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "attendance">("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", staff_type: "SECURITY_GUARD", address: "", salary: "" });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([staffAPI.getStaff(), staffAPI.getAll()]);
      setStaff(s.data.staff || []);
      setRecords(r.data.records || []);
    } catch { toast.error("Failed to load staff"); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffAPI.create(form);
      toast.success("Staff added!");
      setShowAdd(false);
      setForm({ name: "", phone: "", staff_type: "SECURITY_GUARD", address: "", salary: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to add staff"); }
  };

  const handleCheckIn = async (id: string) => {
    try { await staffAPI.checkIn(id); toast.success("Checked in!"); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleCheckOut = async (id: string) => {
    try { await staffAPI.checkOut(id); toast.success("Checked out!"); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const filtered = staff.filter(s => {
    const matchSearch = `${s.name} ${s.phone} ${s.staff_type}`.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || s.staff_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStaff = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-indigo-500" /> Staff Attendance
          </h1>
          <p className="text-gray-400 text-sm mt-1">{staff.filter(s => s.is_active).length} active staff members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab("list")} className={`pb-3 px-4 text-sm font-medium ${activeTab === "list" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Staff Directory</button>
        <button onClick={() => setActiveTab("attendance")} className={`pb-3 px-4 text-sm font-medium ${activeTab === "attendance" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Attendance Records</button>
      </div>

      {activeTab === "list" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search staff..." /></div>
            <div className="flex gap-2">{["ALL", ...STAFF_TYPES].map(t => <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${typeFilter === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{t.replace(/_/g, " ")}</button>)}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">{["Name", "Phone", "Type", "Salary", "Status", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td></tr>) : paginatedStaff.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><HardHat className="w-10 h-10 mx-auto mb-2 opacity-30" />No staff found</td></tr> : paginatedStaff.map(s => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium">{s.staff_type?.replace(/_/g, " ")}</span></td>
                      <td className="px-4 py-3 text-gray-700">{s.salary ? `₹${parseFloat(s.salary).toLocaleString("en-IN")}` : "—"}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{s.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleCheckIn(s.id)} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> In</button>
                          <button onClick={() => handleCheckOut(s.id)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Out</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </div>
        </>
      )}

      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[{ label: "Present Today", count: records.filter(r => r.status === "PRESENT" && r.attendance_date?.startsWith(new Date().toISOString().split("T")[0])).length, color: "from-emerald-500 to-green-600" }, { label: "Absent Today", count: records.filter(r => r.status === "ABSENT" && r.attendance_date?.startsWith(new Date().toISOString().split("T")[0])).length, color: "from-red-500 to-rose-600" }, { label: "Total Staff", count: staff.filter(s => s.is_active).length, color: "from-indigo-500 to-blue-600" }, { label: "Records", count: records.length, color: "from-violet-500 to-purple-600" }].map((stat, i) => (
              <div key={i} className={`rounded-2xl border p-4 bg-gradient-to-br ${stat.color} text-white`}><p className="text-2xl font-bold">{stat.count}</p><p className="text-xs opacity-80 mt-1">{stat.label}</p></div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                </tr></thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No attendance records</td></tr>
                  ) : records.slice(0, 50).map(r => {
                    const s = staff.find(st => st.id === r.staff_id);
                    const duration = calcHours(r.check_in, r.check_out);
                    return (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s?.name || r.staff_name || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{(s?.staff_type || "").replace(/_/g, " ")}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDay(r.attendance_date)}</td>
                        <td className="px-4 py-3">
                          {r.check_in ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <LogIn className="w-3 h-3 text-emerald-600" />
                              </span>
                              <span className="text-sm font-semibold text-emerald-700">{formatTime(r.check_in)}</span>
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.check_out ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <LogOut className="w-3 h-3 text-red-500" />
                              </span>
                              <span className="text-sm font-semibold text-red-600">{formatTime(r.check_out)}</span>
                            </div>
                          ) : <span className="text-gray-300 text-xs">Not out</span>}
                        </td>
                        <td className="px-4 py-3">
                          {duration ? (
                            <div className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                              <Timer className="w-3 h-3" />{duration}
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Add New Staff</h2><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label><select value={form.staff_type} onChange={e => setForm({ ...form, staff_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{STAFF_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Monthly Salary (₹)</label><input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Add Staff</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}