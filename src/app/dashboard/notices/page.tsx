"use client";

import { useState, useEffect } from "react";
import { noticeAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  Megaphone, Plus, Search, X, Calendar, Send, Trash2,
  AlertTriangle, Info, Zap, Leaf, DollarSign
} from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 12;

interface Notice {
  id: string; title: string; content: string; category: string;
  priority: string; is_published: number; publish_date: string;
  expiry_date: string; created_at: string;
}

const noticeCategories = ["GENERAL","MAINTENANCE","EVENT","RULES","AGM","EMERGENCY","FINANCIAL"];

const CATEGORY_CONFIG: Record<string, { bg: string; text: string; icon: any }> = {
  GENERAL:     { bg: "bg-blue-50 border-blue-100",    text: "text-blue-700",   icon: Info },
  MAINTENANCE: { bg: "bg-amber-50 border-amber-100",  text: "text-amber-700",  icon: Zap },
  EVENT:       { bg: "bg-purple-50 border-purple-100", text: "text-purple-700", icon: Megaphone },
  RULES:       { bg: "bg-slate-50 border-slate-100",  text: "text-slate-700",  icon: Info },
  AGM:         { bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-700", icon: Megaphone },
  EMERGENCY:   { bg: "bg-red-50 border-red-100",      text: "text-red-700",    icon: AlertTriangle },
  FINANCIAL:   { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", icon: DollarSign },
};
const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH:   "bg-orange-100 text-orange-700",
  NORMAL: "bg-blue-100 text-blue-700",
  LOW:    "bg-gray-100 text-gray-600",
};

export default function NoticesPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: "", content: "", category: "GENERAL", priority: "NORMAL", expiry_date: ""
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadNotices(); }, []);

  const loadNotices = async () => {
    try {
      const res = await noticeAPI.getAll();
      setNotices(res.data.notices);
    } catch { toast.error("Failed to load notices"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await noticeAPI.create(formData);
      toast.success("Notice created!");
      setShowAddModal(false);
      setFormData({ title: "", content: "", category: "GENERAL", priority: "NORMAL", expiry_date: "" });
      loadNotices();
    } catch { toast.error("Failed to create notice"); }
  };

  const handlePublish = async (id: string) => {
    try { await noticeAPI.publish(id); toast.success("Notice published!"); loadNotices(); }
    catch { toast.error("Failed to publish"); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    try { await noticeAPI.remove(id); toast.success("Deleted"); loadNotices(); }
    catch { toast.error("Failed to delete"); }
  };

  const cats = ["ALL", ...Array.from(new Set(notices.map(n => n.category)))];
  const filtered = notices.filter(n => {
    const matchSearch = `${n.title} ${n.content} ${n.category}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = catFilter === "ALL" || n.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedNotices = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, catFilter]);

  const isAdmin = hasPermission('NOTICE_CREATE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("noticesTitle")}</h1>
          <p className="text-gray-400 text-sm mt-1">{t("noticesSubtitle")}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> {t("newNotice")}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 flex-wrap animate-slide-up" style={{ animationDelay: "60ms" }}>
        <div className="flex-1 min-w-56 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search notices..." />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {cats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                catFilter === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}>
              {cat === "ALL" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <Megaphone className="w-14 h-14 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No notices found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {paginatedNotices.map((notice, i) => {
            const cfg = CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG.GENERAL;
            const Icon = cfg.icon;
            return (
              <div key={notice.id}
                className={`rounded-2xl border p-5 ${cfg.bg} card-hover animate-slide-up cursor-pointer`}
                onClick={() => setSelectedNotice(notice)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.text} bg-white/60`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/70 ${cfg.text}`}>{notice.category}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${PRIORITY_COLORS[notice.priority] || "bg-gray-100 text-gray-600"}`}>{notice.priority}</span>
                        {!notice.is_published && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-yellow-100 text-yellow-700">Draft</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{notice.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notice.content}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" /> {formatDate(notice.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {isAdmin && !notice.is_published && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/50" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handlePublish(notice.id)}
                      className="flex items-center gap-1 text-xs bg-white/70 hover:bg-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-indigo-700">
                      <Send className="w-3 h-3" /> Publish
                    </button>
                    <button onClick={() => handleDelete(notice.id)}
                      className="flex items-center gap-1 text-xs bg-white/70 hover:bg-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-red-600">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={() => setSelectedNotice(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${PRIORITY_COLORS[selectedNotice.priority] || "bg-gray-100 text-gray-600"}`}>{selectedNotice.priority}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">{selectedNotice.category}</span>
                {selectedNotice.is_published ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700">Published</span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-700">Draft</span>
                )}
              </div>
              <button onClick={() => setSelectedNotice(null)} className="p-2 hover:bg-gray-100 rounded-xl flex-shrink-0">
                <X className="w-4.5 h-4.5 text-gray-500" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{selectedNotice.title}</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">{selectedNotice.content}</p>
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              Published: {formatDate(selectedNotice.publish_date || selectedNotice.created_at)}
            </div>
          </div>
        </div>
      )}

      {/* Create Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create Notice</h2>
                <p className="text-xs text-gray-400 mt-0.5">Publish to all residents</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content *</label>
                <textarea value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-28 resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                  <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    {noticeCategories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
