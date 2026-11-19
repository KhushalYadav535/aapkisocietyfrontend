"use client";

import { useEffect, useState } from "react";
import { complianceAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { Trash2, Loader2, Calendar } from "lucide-react";

interface ComplianceEvent {
  id: string;
  type: string;
  title: string;
  due_date: string;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
}

export default function CompliancePage() {
  const { t } = useLocale();
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "GST", title: "", due_date: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await complianceAPI.getCalendar();
      setEvents(res.data.events || []);
    } catch {
      toast.error(t("failedToLoadComplianceEvents"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await complianceAPI.addEvent(form);
      setForm({ type: "GST", title: "", due_date: "" });
      toast.success(t("complianceEventAdded") || "Compliance event added");
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("failedToCreateEvent") || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: "PENDING" | "COMPLETED" | "OVERDUE") => {
    try {
      await complianceAPI.updateEvent(id, status);
      toast.success("Status updated");
      load();
    } catch {
      toast.error(t("failedToUpdateStatus"));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await complianceAPI.deleteEvent(id);
      toast.success("Compliance event removed");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove event");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-500" />
          {t("complianceTitle") || "Statutory & Tax Compliance"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t("complianceSubtitle") || "Track filing dates, statutory deadlines, and society compliances"}</p>
      </div>

      <form onSubmit={createEvent} className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50">
          <option value="GST">GST</option>
          <option value="TDS">TDS</option>
          <option value="ITR">ITR</option>
          <option value="AGM">AGM</option>
          <option value="FIRE_SAFETY">Fire Safety Audit</option>
          <option value="LIFT_INSPECTION">Lift Inspection</option>
        </select>
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
        <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Add Event
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Type", "Title", "Due Date", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-gray-400">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-gray-400">No compliance events found</td></tr>
            ) : events.map((ev) => (
              <tr key={ev.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{ev.type}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                <td className="px-4 py-3 text-gray-600">{String(ev.due_date).split("T")[0]}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    ev.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                    ev.status === "OVERDUE" ? "bg-rose-50 text-rose-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {ev.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateStatus(ev.id, "PENDING")} className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-100">Pending</button>
                    <button onClick={() => updateStatus(ev.id, "COMPLETED")} className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-100">Done</button>
                    <button onClick={() => updateStatus(ev.id, "OVERDUE")} className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-100">Overdue</button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
