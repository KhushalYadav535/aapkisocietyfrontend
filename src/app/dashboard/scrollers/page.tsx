"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { scrollerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Globe, AlertTriangle, Info, Plus, Trash2, Edit2, X } from "lucide-react";

const URGENCY_COLORS: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  URGENT: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Urgent' },
  IMPORTANT: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Important' },
  NORMAL: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Normal' },
};

export default function ScrollersPage() {
  const { user } = useAuth();
  const [scrollers, setScrollers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ message: '', urgency_level: 'NORMAL', start_at: '', end_at: '', target_audience: 'ALL' });

  const role = String(user?.role || '').toUpperCase();
  const isPlatform = role === 'PLATFORM_ADMIN';
  const canManage = ['PLATFORM_ADMIN', 'ADMIN', 'TREASURER', 'COMMITTEE'].includes(role);

  const loadScrollers = async () => {
    try {
      const platform = String(user?.role || "").toUpperCase() === "PLATFORM_ADMIN";
      const res = await scrollerAPI.getActive(
        platform ? { include_all: "1" } : undefined
      );
      setScrollers(res.data.scrollers || []);
    } catch (error) {
      console.error("Failed to load scrollers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadScrollers();
  }, [user?.id, user?.role]);

  const toIsoOrEmpty = (localDatetime: string) => {
    if (!localDatetime?.trim()) return "";
    const d = new Date(localDatetime);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error("Message is required");
    const payload = {
      ...form,
      start_at: toIsoOrEmpty(form.start_at),
      end_at: toIsoOrEmpty(form.end_at),
    };
    try {
      if (isPlatform) {
        await scrollerAPI.createPlatform(payload);
      } else {
        await scrollerAPI.createSociety(payload);
      }
      toast.success("Scroller created!");
      setShowCreate(false);
      setForm({ message: '', urgency_level: 'NORMAL', start_at: '', end_at: '', target_audience: 'ALL' });
      loadScrollers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to create scroller");
    }
  };

  const handleDelete = async (level: string, id: string) => {
    if (!confirm("Delete this scroller?")) return;
    try {
      await scrollerAPI.remove(level.toLowerCase(), id);
      toast.success("Scroller deleted");
      loadScrollers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete");
    }
  };

  const handleToggleActive = async (level: string, id: string, is_active: number) => {
    try {
      await scrollerAPI.update(level.toLowerCase(), id, { is_active: is_active ? 0 : 1 });
      toast.success(is_active ? "Scroller paused" : "Scroller resumed");
      loadScrollers();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update");
    }
  };

  if (loading) return <div className="space-y-4"><div className="h-48 skeleton rounded-2xl" /></div>;

  const platformScrollers = scrollers.filter(s => s.level === 'PLATFORM');
  const societyScrollers = scrollers.filter(s => s.level === 'SOCIETY');

  const scheduleLabel = (s: any): "Live" | "Scheduled" | "Ended" | "Paused" => {
    if (Number(s.is_active) !== 1) return "Paused";
    const now = Date.now();
    if (s.start_at && new Date(s.start_at).getTime() > now) return "Scheduled";
    if (s.end_at && new Date(s.end_at).getTime() < now) return "Ended";
    return "Live";
  };

  const urgencyRank = (u: string) => (u === "URGENT" ? 0 : u === "IMPORTANT" ? 1 : 2);

  const liveForBanner = [...scrollers]
    .filter((s) => scheduleLabel(s) === "Live")
    .sort((a, b) => urgencyRank(a.urgency_level) - urgencyRank(b.urgency_level));

  const ScrollerCard = ({ s }: { s: any }) => {
    const colors = URGENCY_COLORS[s.urgency_level] || URGENCY_COLORS.NORMAL;
    const sched = scheduleLabel(s);
    const schedStyle =
      sched === "Live" ? "bg-emerald-100 text-emerald-800" :
      sched === "Scheduled" ? "bg-sky-100 text-sky-800" :
      sched === "Ended" ? "bg-gray-200 text-gray-600" :
      "bg-amber-100 text-amber-800";
    return (
      <div className={`${colors.bg} rounded-2xl p-4 border ${colors.border}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${colors.badge}`}>
                {s.urgency_level}
              </span>
              {isPlatform && s.level === "PLATFORM" && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${schedStyle}`}>{sched}</span>
              )}
              <span className="text-xs text-gray-400">{s.level} | {s.target_audience}</span>
            </div>
            <p className="text-sm text-gray-800 font-medium leading-relaxed">{s.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {s.start_at ? `From: ${new Date(s.start_at).toLocaleDateString()}` : 'No start date'}
              {s.end_at ? ` — Until: ${new Date(s.end_at).toLocaleDateString()}` : ''}
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => handleToggleActive(s.level.toLowerCase(), s.id, s.is_active)}
                className={`p-1.5 rounded-lg transition-colors ${s.is_active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                title={s.is_active ? 'Pause' : 'Resume'}>
                <Info className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(s.level.toLowerCase(), s.id)}
                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scroller Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isPlatform ? 'Manage platform-wide announcements' : 'Society-wide announcements'}
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25">
            <Plus className="w-4 h-4" />
            New Scroller
          </button>
        )}
      </div>

      {/* Live preview banner (only messages currently within start/end window) */}
      {liveForBanner.length > 0 && (
        <div className={`rounded-2xl px-6 py-3.5 border flex items-center gap-3 ${
          liveForBanner[0]?.urgency_level === 'URGENT'
            ? 'bg-red-50 border-red-200'
            : liveForBanner[0]?.urgency_level === 'IMPORTANT'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          {liveForBanner[0]?.urgency_level === 'URGENT' ? (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <Globe className={`w-4 h-4 shrink-0 ${
              liveForBanner[0]?.urgency_level === 'IMPORTANT' ? 'text-amber-500' : 'text-blue-500'
            }`} />
          )}
          <p className="text-sm font-medium text-gray-800 animate-marquee whitespace-nowrap overflow-hidden">
            {liveForBanner[0]?.message}
          </p>
        </div>
      )}
      {isPlatform && scrollers.length > 0 && liveForBanner.length === 0 && (
        <div className="rounded-2xl px-4 py-3 border border-sky-200 bg-sky-50 text-sm text-sky-900">
          No message is <strong>live</strong> right now (check start time / end time, or resume a paused scroller). Rows below may be <strong>Scheduled</strong> for later.
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">New {isPlatform ? 'Platform' : 'Society'} Scroller</h3>
            <button type="button" onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message (max 280 chars)</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={2} maxLength={280}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" required />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length}/280</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgency</label>
              <select value={form.urgency_level} onChange={e => setForm({ ...form, urgency_level: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
              <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="ALL">All Users</option>
                <option value="ADMIN">Admins Only</option>
                <option value="COMMITTEE">Committee</option>
                <option value="RESIDENT">Residents</option>
                <option value="GUARD">Guards</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start (optional)</label>
              <input type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
              <p className="text-[11px] text-gray-500 mt-1">Leave empty to show immediately. Times use your device timezone.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End (optional)</label>
              <input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Publish Scroller
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {scrollers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No scrollers yet</p>
          <p className="text-xs mt-1">Create a scroller to broadcast announcements</p>
        </div>
      ) : (
        <div className="space-y-6">
          {isPlatform && platformScrollers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Platform Scrollers
              </h3>
              <div className="grid gap-3">
                {platformScrollers.map(s => <ScrollerCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
          {societyScrollers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Society Scrollers</h3>
              <div className="grid gap-3">
                {societyScrollers.map(s => <ScrollerCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
