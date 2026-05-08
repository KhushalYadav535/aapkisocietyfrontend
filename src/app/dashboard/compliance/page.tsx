"use client";

import { useEffect, useState } from "react";
import { complianceAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";

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
    try {
      await complianceAPI.addEvent(form);
      setForm({ type: "GST", title: "", due_date: "" });
      toast.success(t("complianceEventAdded"));
      load();
    } catch {
      toast.error(t("failedToCreateEvent"));
    }
  };

  const updateStatus = async (id: string, status: "PENDING" | "COMPLETED" | "OVERDUE") => {
    try {
      await complianceAPI.updateEvent(id, status);
      load();
    } catch {
      toast.error(t("failedToUpdateStatus"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("complianceTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("complianceSubtitle")}</p>
      </div>

      <form onSubmit={createEvent} className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
          <option value="GST">GST</option>
          <option value="TDS">TDS</option>
          <option value="ITR">ITR</option>
          <option value="AGM">AGM</option>
        </select>
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
        <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Add Event</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
              <tr key={ev.id} className="border-t border-gray-50">
                <td className="px-4 py-3">{ev.type}</td>
                <td className="px-4 py-3">{ev.title}</td>
                <td className="px-4 py-3">{ev.due_date}</td>
                <td className="px-4 py-3">{ev.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(ev.id, "PENDING")} className="px-2 py-1 text-xs rounded-lg border border-gray-200">Pending</button>
                    <button onClick={() => updateStatus(ev.id, "COMPLETED")} className="px-2 py-1 text-xs rounded-lg border border-gray-200">Done</button>
                    <button onClick={() => updateStatus(ev.id, "OVERDUE")} className="px-2 py-1 text-xs rounded-lg border border-gray-200">Overdue</button>
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
