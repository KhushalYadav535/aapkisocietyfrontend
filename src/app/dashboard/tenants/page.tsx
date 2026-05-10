"use client";

import { useState, useEffect } from "react";
import { tenantAPI, societyAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { Home, Plus, Search, X, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";

export default function TenantsPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [wings, setWings] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ flat_id: "", tenant_name: "", tenant_email: "", tenant_phone: "", lease_start: "", lease_end: "", rent_amount: "" });
  const isAdmin = ["ADMIN", "COMMITTEE", "PLATFORM_ADMIN"].includes(user?.role || "");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [t, w, f] = await Promise.all([
        isAdmin ? tenantAPI.getAll() : tenantAPI.getMine(),
        user?.society_id ? societyAPI.getWings(user.society_id) : Promise.resolve({ data: { wings: [] } }),
        user?.society_id ? societyAPI.getFlats(user.society_id) : Promise.resolve({ data: { flats: [] } }),
      ]);
      setTenants(t.data.tenants || []);
      setWings(w.data.wings || []);
      setFlats(f.data.flats || []);
    } catch { toast.error("Failed to load tenants"); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await tenantAPI.create(form);
      toast.success(res.data.tempPassword ? `Tenant created! Temp password: ${res.data.tempPassword}` : "Tenant created!");
      setShowAdd(false);
      setForm({ flat_id: "", tenant_name: "", tenant_email: "", tenant_phone: "", lease_start: "", lease_end: "", rent_amount: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleApprove = async (id: string) => {
    try { await tenantAPI.approve(id); toast.success("Tenant approved!"); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason === null) return;
    try { await tenantAPI.reject(id, reason); toast.success("Tenant rejected"); load(); }
    catch { toast.error("Failed"); }
  };

  const filtered = tenants.filter(t => {
    const matchSearch = `${t.tenant_name} ${t.tenant_email} ${t.tenant_phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const STATUS_COLORS: Record<string, string> = { PENDING: "bg-amber-100 text-amber-700", APPROVED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-700", EXPIRED: "bg-gray-100 text-gray-700" };
  const STATUS_ICONS: Record<string, any> = { PENDING: Clock, APPROVED: CheckCircle, REJECTED: XCircle };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Home className="w-6 h-6 text-indigo-500" /> Tenant Management</h1>
          <p className="text-gray-400 text-sm mt-1">{tenants.length} tenants ({tenants.filter(t => t.status === "PENDING").length} pending)</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200"><Plus className="w-4 h-4" /> Add Tenant</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search tenants..." /></div>
        <div className="flex gap-2">{["ALL", "PENDING", "APPROVED", "REJECTED", "EXPIRED"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{s}</button>)}</div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div> : filtered.length === 0 ? (
        <div className="text-center py-16"><Home className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No tenants found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const StatusIcon = STATUS_ICONS[t.status] || CheckCircle;
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-lg">{t.tenant_name?.charAt(0)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{t.tenant_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{t.tenant_email || "No email"}</span>
                        <span>{t.tenant_phone || "No phone"}</span>
                        {t.wing && <span>Wing {t.wing} - {t.flat_number}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>Lease: {t.lease_start ? formatDate(t.lease_start) : "—"} to {t.lease_end ? formatDate(t.lease_end) : "—"}</span>
                        {t.rent_amount && <span>• ₹{parseFloat(t.rent_amount).toLocaleString("en-IN")}/mo</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-700"}`}><StatusIcon className="w-3 h-3 inline mr-1" />{t.status}</span>
                    {isAdmin && t.status === "PENDING" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove(t.id)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleReject(t.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"><XCircle className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Add New Tenant</h2><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Flat *</label><select value={form.flat_id} onChange={e => setForm({ ...form, flat_id: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"><option value="">Select flat</option>{flats.map(f => <option key={f.id} value={f.id}>{f.wing ? `Wing ${f.wing} - ` : ""}{f.flat_number}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Tenant Name *</label><input value={form.tenant_name} onChange={e => setForm({ ...form, tenant_name: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label><input type="email" value={form.tenant_email} onChange={e => setForm({ ...form, tenant_email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label><input value={form.tenant_phone} onChange={e => setForm({ ...form, tenant_phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Lease Start</label><input type="date" value={form.lease_start} onChange={e => setForm({ ...form, lease_start: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Lease End</label><input type="date" value={form.lease_end} onChange={e => setForm({ ...form, lease_end: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Monthly Rent (₹)</label><input type="number" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Add Tenant</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}