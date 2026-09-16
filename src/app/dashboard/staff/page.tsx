"use client";

import { useState, useEffect } from "react";
import { staffAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { 
  HardHat, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  X, 
  LogIn, 
  LogOut, 
  Timer,
  Star,
  MessageSquare,
  ShieldCheck,
  Award,
  Sparkles
} from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 15;

const STAFF_TYPES = [
  "SECURITY_GUARD", 
  "HOUSEKEEPING", 
  "COOK_MAID",
  "GARDENER", 
  "ELECTRICIAN", 
  "PLUMBER", 
  "MAINTENANCE", 
  "MANAGER", 
  "ACCOUNTANT", 
  "OTHER"
];

const STATUS_COLORS: Record<string, string> = { 
  PRESENT: "bg-emerald-100 text-emerald-700", 
  ABSENT: "bg-red-100 text-red-700" 
};

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
  const isAdmin = ['ADMIN', 'COMMITTEE', 'PLATFORM_ADMIN', 'GUARD'].includes(String(user?.role).toUpperCase());
  
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "attendance" | "reviews">("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [reviewModalStaff, setReviewModalStaff] = useState<any | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", staff_type: "SECURITY_GUARD", address: "", salary: "" });
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r, rev] = await Promise.all([
        staffAPI.getStaff(), 
        staffAPI.getAll(),
        staffAPI.getReviews().catch(() => ({ data: { reviews: [] } }))
      ]);
      setStaff(s.data.staff || []);
      setRecords(r.data.records || []);
      setReviews(rev.data?.reviews || []);
    } catch { 
      toast.error("Failed to load staff data"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffAPI.create(form);
      toast.success("Staff added!");
      setShowAdd(false);
      setForm({ name: "", phone: "", staff_type: "SECURITY_GUARD", address: "", salary: "" });
      load();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Failed to add staff"); 
    }
  };

  const handleCheckIn = async (id: string) => {
    try { 
      await staffAPI.checkIn(id); 
      toast.success("Checked in!"); 
      load(); 
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Failed"); 
    }
  };

  const handleCheckOut = async (id: string) => {
    try { 
      await staffAPI.checkOut(id); 
      toast.success("Checked out!"); 
      load(); 
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Failed"); 
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalStaff) return;
    try {
      setSubmittingReview(true);
      await staffAPI.addReview({
        staff_id: reviewModalStaff.id,
        rating: reviewForm.rating,
        review_text: reviewForm.review_text
      });
      toast.success("Review submitted! Thank you for rating.");
      setReviewModalStaff(null);
      setReviewForm({ rating: 5, review_text: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = staff.filter(s => {
    const matchSearch = `${s.name} ${s.phone || ""} ${s.staff_type || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || s.staff_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStaff = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, typeFilter]);

  // Helpers to calculate ratings for each staff
  const getStaffRating = (staffId: string) => {
    const staffRevs = reviews.filter(r => r.staff_id === staffId);
    if (staffRevs.length === 0) return { avg: null, count: 0 };
    const avg = staffRevs.reduce((acc, r) => acc + (parseInt(r.rating) || 5), 0) / staffRevs.length;
    return { avg: Math.round(avg * 10) / 10, count: staffRevs.length };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
            Domestic Staff & Attendance
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Verified domestic helpers, attendance logs, and resident community ratings
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)} 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button 
          onClick={() => setActiveTab("list")} 
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "list" 
              ? "text-indigo-600 border-indigo-600" 
              : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          Staff Directory & Ratings
        </button>
        <button 
          onClick={() => setActiveTab("attendance")} 
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "attendance" 
              ? "text-indigo-600 border-indigo-600" 
              : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          Gate Attendance Logs
        </button>
        <button 
          onClick={() => setActiveTab("reviews")} 
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "reviews" 
              ? "text-indigo-600 border-indigo-600" 
              : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          Community Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                placeholder="Search staff by name, phone, category..." 
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["ALL", ...STAFF_TYPES.slice(0, 6)].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTypeFilter(t)} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    typeFilter === t 
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Staff Member</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase">Resident Rating</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-6 bg-slate-100 animate-pulse rounded-lg" /></td></tr>
                    ))
                  ) : paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <HardHat className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map(s => {
                      const { avg, count } = getStaffRating(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{s.name}</div>
                            {s.duty_timing && <span className="text-[11px] text-slate-400 font-medium">{s.duty_timing}</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold">
                              {s.staff_type?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {avg !== null ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  {avg}
                                </span>
                                <span className="text-[11px] text-slate-400">({count} reviews)</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No ratings yet</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 text-xs font-mono">{s.phone || "—"}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReviewModalStaff(s);
                                  setReviewForm({ rating: 5, review_text: "" });
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all"
                              >
                                <Star className="w-3 h-3 text-amber-600 fill-amber-600" /> Rate
                              </button>

                              {isAdmin && (
                                <>
                                  <button 
                                    onClick={() => handleCheckIn(s.id)} 
                                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all"
                                  >
                                    <Clock className="w-3 h-3" /> In
                                  </button>
                                  <button 
                                    onClick={() => handleCheckOut(s.id)} 
                                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Out
                                  </button>
                                </>
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
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {/* Tab 2: Gate Attendance Logs */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Present Today", count: records.filter(r => r.status === "PRESENT" && r.attendance_date?.startsWith(new Date().toISOString().split("T")[0])).length, color: "from-emerald-500 to-green-600" },
              { label: "Absent Today", count: records.filter(r => r.status === "ABSENT" && r.attendance_date?.startsWith(new Date().toISOString().split("T")[0])).length, color: "from-red-500 to-rose-600" },
              { label: "Total Staff", count: staff.filter(s => s.is_active).length, color: "from-indigo-500 to-blue-600" },
              { label: "Attendance Logs", count: records.length, color: "from-violet-500 to-purple-600" }
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-4 bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs opacity-90 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Staff</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">No attendance records logged</td></tr>
                  ) : (
                    records.slice(0, 50).map(r => {
                      const s = staff.find(st => st.id === r.staff_id);
                      const duration = calcHours(r.check_in, r.check_out);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{s?.name || r.staff_name || "Unknown"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{formatDay(r.attendance_date)}</td>
                          <td className="px-4 py-3 text-emerald-700 font-semibold text-xs">{formatTime(r.check_in)}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{formatTime(r.check_out)}</td>
                          <td className="px-4 py-3 text-xs text-indigo-700 font-semibold">{duration || "—"}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-700"}`}>{r.status}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Community Reviews */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
              <Star className="w-12 h-12 text-amber-400 fill-amber-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-900">No Reviews Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Be the first to rate your domestic maid, cook, driver, or maintenance staff!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => {
                const s = staff.find(st => st.id === r.staff_id);
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{s?.name || "Staff Member"}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {(s?.staff_type || "").replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-800 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {r.rating} / 5
                      </div>
                    </div>

                    {r.review_text && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        "{r.review_text}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Rated by: {r.resident_name} (Flat {r.wing ? r.wing + "-" : ""}{r.flat_number})</span>
                      <span>{formatDay(r.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rate Domestic Staff Modal */}
      {reviewModalStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Rate {reviewModalStaff.name}</h2>
                  <p className="text-[11px] text-slate-500">{(reviewModalStaff.staff_type || "").replace(/_/g, " ")}</p>
                </div>
              </div>
              <button onClick={() => setReviewModalStaff(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= reviewForm.rating 
                            ? "text-amber-500 fill-amber-500" 
                            : "text-slate-200"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-700 ml-2">{reviewForm.rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Feedback / Review (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewForm.review_text}
                  onChange={e => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                  placeholder="Share details about punctuality, cleanliness, trustworthiness for other residents..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setReviewModalStaff(null)} 
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingReview}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add New Staff Member</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type</label>
                <select value={form.staff_type} onChange={e => setForm({ ...form, staff_type: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white">
                  {STAFF_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Salary (₹)</label>
                <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}