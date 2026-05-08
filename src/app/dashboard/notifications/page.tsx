"use client";

import { useEffect, useState } from "react";
import { notificationAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";

interface NotificationItem {
  id: string;
  channel: "SMS" | "EMAIL";
  subject?: string;
  body: string;
  status: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ channel: "EMAIL", recipients: "", subject: "", body: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.list();
      setItems(res.data.notifications || []);
    } catch {
      toast.error(t("failedToLoadNotifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notificationAPI.send({
        channel: form.channel,
        recipients: form.recipients.split(",").map((x) => x.trim()).filter(Boolean),
        subject: form.subject || null,
        body: form.body
      });
      toast.success(t("notificationSent"));
      setForm({ channel: "EMAIL", recipients: "", subject: "", body: "" });
      load();
    } catch {
      toast.error(t("failedToSendNotification"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("notificationsTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("notificationsSubtitle")}</p>
      </div>

      <form onSubmit={send} className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
        </select>
        <input value={form.recipients} onChange={(e) => setForm((p) => ({ ...p, recipients: e.target.value }))} placeholder="Recipients (comma separated)" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
        <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Subject (for email)" className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Send</button>
        <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="Message body" className="md:col-span-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-24" required />
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Channel", "Message", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-gray-400">No notifications sent yet</td></tr>
            ) : items.map((n) => (
              <tr key={n.id} className="border-t border-gray-50">
                <td className="px-4 py-3">{new Date(n.created_at).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{n.channel}</td>
                <td className="px-4 py-3">{n.subject ? `${n.subject} - ` : ""}{n.body}</td>
                <td className="px-4 py-3">{n.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
