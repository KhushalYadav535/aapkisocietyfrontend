"use client";
import { useState, useEffect, useCallback } from "react";
import { sosAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { ShieldAlert, AlertTriangle, Flame, Zap, Siren, CheckCircle2, Clock, RefreshCw, X, Plus } from "lucide-react";

const ALERT_TYPES = [
  { value: "FIRE", label: "🔥 Fire", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "MEDICAL", label: "🚑 Medical", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { value: "INTRUSION", label: "🚨 Intrusion", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "LIFT_STUCK", label: "⬆️ Lift Stuck", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "GAS_LEAK", label: "💨 Gas Leak", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "GENERAL", label: "⚠️ General", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-red-100 text-red-700",
  RESPONDED: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

interface SOSAlert {
  id: string;
  raised_by: string;
  flat_number: string;
  wing: string;
  alert_type: string;
  description: string;
  status: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  responded_at: string;
  resolved_at: string;
}

export default function SOSPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRaise, setShowRaise] = useState(false);
  const [form, setForm] = useState({ alert_type: "GENERAL", description: "" });
  const [statusFilter, setStatusFilter] = useState("ALL");

  const isAdmin = ["ADMIN", "COMMITTEE", "GUARD", "PLATFORM_ADMIN"].includes(user?.role || "");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      const r = await sosAPI.getAll(params);
      setAlerts(r.data.alerts);
    } catch { toast.error("Failed to load alerts"); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sosAPI.raise(form);
      toast.success("🚨 SOS Alert raised! Security has been notified.", { duration: 5000 });
      setShowRaise(false);
      setForm({ alert_type: "GENERAL", description: "" });
      load();
    } catch { toast.error("Failed to raise SOS"); }
  };

  const handleRespond = async (id: string) => {
    try { await sosAPI.respond(id); toast.success("Acknowledged"); load(); }
    catch { toast.error("Failed"); }
  };

  const handleResolve = async (id: string) => {
    try { await sosAPI.resolve(id); toast.success("Alert resolved"); load(); }
    catch { toast.error("Failed"); }
  };

  const activeCount = alerts.filter(a => a.status === "ACTIVE").length;
  const filtered = statusFilter === "ALL" ? alerts : alerts.filter(a => a.status === statusFilter);
  const alertType = (type: string) => ALERT_TYPES.find(t => t.value === type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" /> SOS Emergency Alerts
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {activeCount > 0
              ? <span className="text-red-600 font-semibold">{activeCount} active emergency{activeCount > 1 ? "s" : ""} · immediate attention required</span>
              : "No active emergencies · All clear"}
          </p>
        </div>
        <button
          id="raise-sos-btn"
          onClick={() => setShowRaise(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-red-200 hover:-translate-y-0.5 transition-all animate-pulse"
        >
          <Siren className="w-4 h-4" /> Raise SOS
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active", count: alerts.filter(a => a.status === "ACTIVE").length, color: "bg-red-50 border-red-100", text: "text-red-600" },
          { label: "Responded", count: alerts.filter(a => a.status === "RESPONDED").length, color: "bg-yellow-50 border-yellow-100", text: "text-yellow-600" },
          { label: "Resolved", count: alerts.filter(a => a.status === "RESOLVED").length, color: "bg-emerald-50 border-emerald-100", text: "text-emerald-600" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${s.color} animate-slide-up`}>
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            <p className={`text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "ACTIVE", "RESPONDED", "RESOLVED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-red-300"}`}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-14 h-14 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <div key={alert.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${alert.status === "ACTIVE" ? "border-red-200 shadow-red-50" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${alertType(alert.alert_type)?.color || "bg-gray-100"}`}>
                    {alertType(alert.alert_type)?.label.split(" ")[0] || "⚠️"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{alertType(alert.alert_type)?.label.split(" ").slice(1).join(" ") || alert.alert_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[alert.status] || "bg-gray-100 text-gray-600"}`}>{alert.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {alert.first_name} {alert.last_name}
                      {alert.wing && alert.flat_number && ` · Wing ${alert.wing}, Flat ${alert.flat_number}`}
                      {alert.phone && ` · ${alert.phone}`}
                    </p>
                    {alert.description && <p className="text-sm text-gray-600 mt-1 italic">"{alert.description}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
                    {alert.status === "ACTIVE" && (
                      <button onClick={() => handleRespond(alert.id)}
                        className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Respond
                      </button>
                    )}
                    {["ACTIVE", "RESPONDED"].includes(alert.status) && (
                      <button onClick={() => handleResolve(alert.id)}
                        className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raise SOS Modal */}
      {showRaise && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in border-2 border-red-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" /> Raise Emergency Alert
              </h2>
              <button onClick={() => setShowRaise(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4 bg-red-50 border border-red-100 rounded-xl p-3">
              🚨 This will immediately notify security and building management. Use only for genuine emergencies.
            </p>
            <form onSubmit={handleRaise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Emergency Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TYPES.map(t => (
                    <button type="button" key={t.value}
                      onClick={() => setForm(p => ({ ...p, alert_type: t.value }))}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${form.alert_type === t.value ? `${t.color} border-2` : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional Details (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 resize-none"
                  placeholder="Describe the emergency..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRaise(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200">
                  🚨 Send Alert Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
