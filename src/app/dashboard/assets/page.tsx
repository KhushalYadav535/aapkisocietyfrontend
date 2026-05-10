"use client";
import { useState, useEffect } from "react";
import { assetAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { Package, QrCode, Plus, Wrench, AlertTriangle, X, Search, ChevronRight, Clock, CalendarX } from "lucide-react";

const CATEGORIES = ["Generator", "CCTV", "Pump", "Lift", "Fire Equipment", "Electrical", "Plumbing", "Intercom", "Other"];
const STATUSES = ["ACTIVE", "UNDER_MAINTENANCE", "DECOMMISSIONED"];

interface Asset {
  id: string; asset_name: string; asset_code: string; category: string; location: string;
  make_model: string; serial_number: string; purchase_date: string; amc_vendor: string;
  amc_expiry: string; amc_amount: number; last_serviced: string; next_service_due: string;
  status: string; qr_code: string; warranty_expiry: string; amc_status?: string;
}

const EMPTY_FORM = { asset_name: "", category: "Generator", location: "", make_model: "", serial_number: "", purchase_date: "", purchase_amount: "", warranty_expiry: "", amc_vendor: "", amc_expiry: "", amc_amount: "", next_service_due: "", status: "ACTIVE", notes: "" };

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [amcAlerts, setAmcAlerts] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "amc-alerts" | "qr-scan">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [qrInput, setQrInput] = useState("");
  const [qrResult, setQrResult] = useState<any>(null);

  const isAdmin = ["ADMIN", "COMMITTEE", "PLATFORM_ADMIN"].includes(user?.role || "");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [assetsRes, alertsRes] = await Promise.all([assetAPI.getAll(), assetAPI.getAmcAlerts()]);
      setAssets(assetsRes.data.assets);
      setAmcAlerts(alertsRes.data.alerts);
    } catch { toast.error("Failed to load assets"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assetAPI.create(form);
      toast.success("Asset registered with QR code!");
      setShowAdd(false);
      setForm(EMPTY_FORM);
      loadAll();
    } catch { toast.error("Failed to create asset"); }
  };

  const handleQrScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await assetAPI.getByQr(qrInput.trim());
      setQrResult(r.data);
    } catch { toast.error("Asset not found for this QR code"); setQrResult(null); }
  };

  const filtered = assets.filter(a => {
    const ms = `${a.asset_name} ${a.location} ${a.make_model} ${a.asset_code}`.toLowerCase().includes(search.toLowerCase());
    const mf = catFilter === "ALL" || a.category === catFilter;
    return ms && mf;
  });

  const getStatusColor = (s: string) => ({ ACTIVE: "bg-emerald-100 text-emerald-700", UNDER_MAINTENANCE: "bg-yellow-100 text-yellow-700", DECOMMISSIONED: "bg-gray-100 text-gray-500" })[s] || "bg-gray-100 text-gray-500";
  const getAmcStatusColor = (s?: string) => ({ EXPIRED: "bg-red-100 text-red-700", CRITICAL: "bg-orange-100 text-orange-700", WARNING: "bg-yellow-100 text-yellow-700", OK: "bg-emerald-100 text-emerald-700" })[s || "OK"] || "bg-gray-100";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-500" /> Asset Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">{assets.length} assets · {amcAlerts.length} AMC alerts</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Register Asset
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["all", "amc-alerts", "qr-scan"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all relative ${tab === t ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "amc-alerts" ? "AMC Alerts" : t === "qr-scan" ? "QR Scan" : "All Assets"}
            {t === "amc-alerts" && amcAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{amcAlerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : (
        <>
          {tab === "all" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search assets..." />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400">No assets registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Asset", "Category", "Location", "AMC Expiry", "Next Service", "Status", "QR Code"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(a => (
                          <tr key={a.id} onClick={() => setSelected(a)} className="border-t border-gray-50 hover:bg-indigo-50/30 cursor-pointer transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{a.asset_name}</p>
                              <p className="text-xs text-gray-400">{a.asset_code}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{a.category || "—"}</td>
                            <td className="px-4 py-3 text-gray-500">{a.location || "—"}</td>
                            <td className="px-4 py-3">
                              {a.amc_expiry ? <span className="text-xs">{new Date(a.amc_expiry).toLocaleDateString("en-IN")}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {a.next_service_due ? <span className="text-xs">{new Date(a.next_service_due).toLocaleDateString("en-IN")}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${getStatusColor(a.status)}`}>{a.status.replace("_", " ")}</span>
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{a.qr_code?.split("-").slice(-1)[0]}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "amc-alerts" && (
            <div className="space-y-3">
              {amcAlerts.length === 0 ? (
                <div className="text-center py-16">
                  <AlertTriangle className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No AMC expiring in next 60 days</p>
                </div>
              ) : amcAlerts.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAmcStatusColor(a.amc_status)}`}>
                        <CalendarX className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{a.asset_name}</p>
                        <p className="text-xs text-gray-400">{a.location || a.category} · AMC: {a.amc_vendor || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-xl font-bold ${getAmcStatusColor(a.amc_status)}`}>{a.amc_status}</span>
                      <p className="text-xs text-gray-400 mt-1">Expires: {a.amc_expiry ? new Date(a.amc_expiry).toLocaleDateString("en-IN") : "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "qr-scan" && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="text-center mb-5">
                  <QrCode className="w-14 h-14 mx-auto text-indigo-400 mb-2" />
                  <h3 className="font-semibold text-gray-900">Scan Asset QR Code</h3>
                  <p className="text-sm text-gray-400 mt-1">Enter the QR code to view asset details</p>
                </div>
                <form onSubmit={handleQrScan} className="space-y-3">
                  <input value={qrInput} onChange={e => setQrInput(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-mono"
                    placeholder="ASSET-..." />
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Look Up Asset</button>
                </form>
              </div>
              {qrResult && (
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 text-lg">{qrResult.asset.asset_name}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Code", qrResult.asset.asset_code], ["Category", qrResult.asset.category],
                      ["Location", qrResult.asset.location], ["Status", qrResult.asset.status],
                      ["AMC Expiry", qrResult.asset.amc_expiry ? new Date(qrResult.asset.amc_expiry).toLocaleDateString("en-IN") : "—"],
                      ["Next Service", qrResult.asset.next_service_due ? new Date(qrResult.asset.next_service_due).toLocaleDateString("en-IN") : "—"],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-medium text-gray-800">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                  {qrResult.service_logs?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">RECENT SERVICE HISTORY</p>
                      <div className="space-y-2">
                        {qrResult.service_logs.slice(0, 3).map((log: any) => (
                          <div key={log.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700">{log.service_type} · {log.vendor_name}</span>
                            <span className="text-gray-400">{log.service_date ? new Date(log.service_date).toLocaleDateString("en-IN") : "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Asset Modal */}
      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Register New Asset</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Asset Name *</label>
                  <input value={form.asset_name} onChange={e => setForm(p => ({ ...p, asset_name: e.target.value }))} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="DG Set 200KVA, CCTV Camera Lobby..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="Basement / Terrace..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Make / Model</label>
                  <input value={form.make_model} onChange={e => setForm(p => ({ ...p, make_model: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="Cummins C200D5..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Serial No.</label>
                  <input value={form.serial_number} onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="SN-XXXX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AMC Vendor</label>
                  <input value={form.amc_vendor} onChange={e => setForm(p => ({ ...p, amc_vendor: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="XYZ Services Pvt Ltd" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AMC Expiry Date</label>
                  <input type="date" value={form.amc_expiry} onChange={e => setForm(p => ({ ...p, amc_expiry: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Service Due</label>
                  <input type="date" value={form.next_service_due} onChange={e => setForm(p => ({ ...p, next_service_due: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Warranty Expiry</label>
                  <input type="date" value={form.warranty_expiry} onChange={e => setForm(p => ({ ...p, warranty_expiry: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
              </div>
              <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl p-3">✅ A unique QR code will be auto-generated for this asset on save.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
