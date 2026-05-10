"use client";
import { useState, useEffect } from "react";
import { patrolAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { QrCode, MapPin, Clock, Plus, Trash2, X, ScanLine, CheckCircle2, AlertCircle } from "lucide-react";

interface Checkpoint { id: string; location_name: string; qr_code: string; floor: string; area: string; }
interface PatrolLog { id: string; checkpoint_name: string; first_name: string; last_name: string; scanned_at: string; notes: string; }
interface Summary { location_name: string; area: string; scan_count: number; last_scanned: string; }

export default function PatrolPage() {
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [logs, setLogs] = useState<PatrolLog[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "checkpoints" | "logs" | "scan">("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ location_name: "", floor: "", area: "" });
  const [scanCode, setScanCode] = useState("");
  const [scanNotes, setScanNotes] = useState("");
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  const isAdmin = ["ADMIN", "COMMITTEE", "PLATFORM_ADMIN"].includes(user?.role || "");
  const isGuard = ["ADMIN", "COMMITTEE", "GUARD", "PLATFORM_ADMIN"].includes(user?.role || "");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cp, sm, lg] = await Promise.all([patrolAPI.getCheckpoints(), patrolAPI.getSummary(), patrolAPI.getLogs()]);
      setCheckpoints(cp.data.checkpoints);
      setSummary(sm.data.summary);
      setLogs(lg.data.logs);
    } catch { toast.error("Failed to load patrol data"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patrolAPI.createCheckpoint(form);
      toast.success("Checkpoint created!");
      setShowAdd(false);
      setForm({ location_name: "", floor: "", area: "" });
      loadAll();
    } catch { toast.error("Failed to create checkpoint"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this checkpoint?")) return;
    try { await patrolAPI.deleteCheckpoint(id); toast.success("Removed"); loadAll(); }
    catch { toast.error("Failed"); }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanResult(null);
    try {
      const r = await patrolAPI.scan({ qr_code: scanCode.trim(), notes: scanNotes });
      setScanResult({ success: true, message: `✅ ${r.data.checkpoint_name} — ${new Date(r.data.scanned_at).toLocaleTimeString()}` });
      setScanCode(""); setScanNotes("");
      loadAll();
    } catch (err: any) {
      setScanResult({ success: false, message: err.response?.data?.error || "Invalid QR code" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-7 h-7 text-indigo-500" /> Guard Patrolling
          </h1>
          <p className="text-gray-400 text-sm mt-1">{checkpoints.length} checkpoints · {logs.length} scans today</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Add Checkpoint
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["dashboard", ...(isGuard ? ["scan"] : []), "checkpoints", "logs"] as Array<"dashboard" | "scan" | "checkpoints" | "logs">).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : (
        <>
          {tab === "dashboard" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Checkpoints", count: checkpoints.length, color: "bg-indigo-50 border-indigo-100", text: "text-indigo-700" },
                  { label: "Scans Today", count: summary.reduce((s, x) => s + x.scan_count, 0), color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
                  { label: "Not Patrolled", count: summary.filter(x => x.scan_count === 0).length, color: "bg-red-50 border-red-100", text: "text-red-600" },
                ].map((s, i) => (
                  <div key={i} className={`rounded-2xl border p-4 ${s.color}`}>
                    <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Today's Patrol Status</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {summary.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">No checkpoints configured</div>
                  ) : summary.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${s.scan_count > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.location_name}</p>
                          {s.area && <p className="text-xs text-gray-400">{s.area}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">{s.scan_count} scans</p>
                        {s.last_scanned && <p className="text-xs text-gray-400">{new Date(s.last_scanned).toLocaleTimeString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "scan" && (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="text-center">
                  <ScanLine className="w-14 h-14 mx-auto text-indigo-400 mb-2" />
                  <h3 className="font-semibold text-gray-900">Scan Checkpoint QR</h3>
                  <p className="text-sm text-gray-400 mt-1">Enter the QR code displayed at the checkpoint</p>
                </div>
                <form onSubmit={handleScan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">QR Code *</label>
                    <input
                      value={scanCode}
                      onChange={e => setScanCode(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-mono"
                      placeholder="PATROL-..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                    <input
                      value={scanNotes}
                      onChange={e => setScanNotes(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      placeholder="All clear, Found issue..."
                    />
                  </div>
                  {scanResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${scanResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                      {scanResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {scanResult.message}
                    </div>
                  )}
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200">
                    Log Patrol Scan
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === "checkpoints" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {checkpoints.length === 0 ? (
                <div className="text-center py-16">
                  <MapPin className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No checkpoints yet. Add your first checkpoint.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {checkpoints.map(cp => (
                    <div key={cp.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{cp.location_name}</p>
                          <p className="text-xs text-gray-400">{[cp.floor, cp.area].filter(Boolean).join(" · ") || "No location details"}</p>
                          <p className="text-xs text-gray-300 font-mono mt-0.5">{cp.qr_code}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDelete(cp.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "logs" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {logs.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No patrol logs yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {logs.slice(0, 50).map(log => (
                    <div key={log.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.checkpoint_name}</p>
                          <p className="text-xs text-gray-400">by {log.first_name} {log.last_name}</p>
                          {log.notes && <p className="text-xs text-gray-500 italic">{log.notes}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(log.scanned_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Patrol Checkpoint</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location Name *</label>
                <input value={form.location_name} onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="Main Gate, Basement P1, Terrace..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Floor</label>
                  <input value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="G, 1, B1..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Area/Zone</label>
                  <input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="Wing A, Parking..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
