"use client";

import { useState, useEffect } from "react";
import { platformAPI, plansAPI } from "@/lib/api";
import Link from "next/link";
import {
  Building2, Users, Globe, TrendingUp, CreditCard, CheckCircle2,
  XCircle, Clock, AlertTriangle, ArrowUpRight, Activity, Search,
  Filter, ChevronRight, Plus, Pause, Play, Trash2, FileText,
  BarChart3, Calendar, MessageSquare, Eye, Ban, RotateCcw,
  Package, Pencil
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import toast from "react-hot-toast";

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [societies, setSocieties] = useState<any[]>([]);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'societies' | 'kyc' | 'renewals' | 'plans'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [planForm, setPlanForm] = useState<{
    id?: string;
    name: string;
    code: string;
    price: string;
    featuresStr: string;
    color: string;
  } | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [renewModal, setRenewModal] = useState<any | null>(null);
  const [renewForm, setRenewForm] = useState({ renewal_date: '', extend_months: '12', reason: '' });
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadPlans = async () => {
    try {
      const res = await plansAPI.list();
      setDbPlans(res.data.plans || []);
    } catch {
      toast.error("Failed to load plans");
    }
  };

  useEffect(() => {
    if (activeTab === "plans") loadPlans();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [statsRes, societiesRes, kycRes, renewalsRes] = await Promise.all([
        platformAPI.getStats(),
        platformAPI.getAllSocieties(),
        platformAPI.getKYCPending(),
        platformAPI.getRenewals({ days: 90 }),
      ]);
      setStats(statsRes.data.stats);
      setSocieties(societiesRes.data.societies || []);
      setKycQueue(kycRes.data.societies || []);
      setRenewals(renewalsRes.data.renewals || []);
    } catch (error) {
      console.error("Failed to load platform data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (society_id: string, action: string, reason?: string) => {
    try {
      await platformAPI.updateSubscription(society_id, action, reason);
      toast.success(`Society ${action.toLowerCase()}d successfully`);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || `Failed to ${action.toLowerCase()}`);
    }
  };

  const openRenew = (society: any) => {
    setRenewForm({ renewal_date: '', extend_months: '12', reason: '' });
    setRenewModal(society);
  };

  const submitRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewModal) return;
    setRenewSubmitting(true);
    try {
      const hasFixedDate = Boolean(renewForm.renewal_date?.trim());
      await platformAPI.renewSubscription(renewModal.id, {
        renewal_date: hasFixedDate ? renewForm.renewal_date.trim() : undefined,
        extend_months: hasFixedDate ? undefined : parseInt(renewForm.extend_months, 10) || 12,
        reason: renewForm.reason.trim() || undefined,
      });
      toast.success('Renewal recorded');
      setRenewModal(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Renewal failed');
    } finally {
      setRenewSubmitting(false);
    }
  };

  const openNewPlan = () => {
    setPlanForm({
      name: "",
      code: "",
      price: "0",
      featuresStr: "accounting, billing",
      color: "bg-slate-100 text-slate-700",
    });
  };

  const openEditPlan = (p: any) => {
    const feats = Array.isArray(p.features) ? p.features.join(", ") : "";
    setPlanForm({
      id: p.id,
      name: p.name || "",
      code: p.code || "",
      price: String(p.price ?? 0),
      featuresStr: feats,
      color: p.color || "bg-slate-100 text-slate-700",
    });
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm) return;
    if (!planForm.name.trim() || (!planForm.id && !planForm.code.trim())) {
      toast.error("Name and code are required");
      return;
    }
    setSavingPlan(true);
    try {
      const features = planForm.featuresStr.split(",").map((s) => s.trim()).filter(Boolean);
      if (planForm.id) {
        await plansAPI.update(planForm.id, {
          name: planForm.name.trim(),
          price: Number(planForm.price) || 0,
          features,
          color: planForm.color.trim() || undefined,
        });
        toast.success("Plan updated");
      } else {
        await plansAPI.create({
          name: planForm.name.trim(),
          code: planForm.code.trim().toUpperCase(),
          price: Number(planForm.price) || 0,
          features,
          color: planForm.color.trim() || undefined,
        });
        toast.success("Plan created");
      }
      setPlanForm(null);
      loadPlans();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Save failed");
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (id: string, code: string) => {
    if (!confirm(`Delete plan ${code}? Societies using this code keep it until you change them.`)) return;
    try {
      await plansAPI.remove(id);
      toast.success("Plan removed");
      loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Delete failed");
    }
  };

  const handleKYCAction = async (society_id: string, action: 'approve' | 'reject', reason?: string) => {
    if (action === 'reject' && !reason) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      if (action === 'approve') {
        await platformAPI.approveKYC(society_id, 'Approved by platform admin');
      } else {
        await platformAPI.rejectKYC(society_id, reason!);
      }
      toast.success(`KYC ${action}d`);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    TRIAL: 'bg-blue-50 text-blue-700 border-blue-200',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
    OFFBOARDED: 'bg-gray-100 text-gray-600 border-gray-300',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    KYC_UNDER_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const planColors: Record<string, string> = {
    CORE: 'bg-slate-100 text-slate-700',
    COMPLIANCE: 'bg-amber-50 text-amber-700',
    AI_PRO: 'bg-violet-50 text-violet-700',
  };

  const filteredSocieties = societies.filter(s => {
    const matchSearch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || s.subscription_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all housing societies</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={() => { setActiveTab("plans"); openNewPlan(); }}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Package className="w-4 h-4" /> New plan
          </button>
          <Link href="/dashboard/societies" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25">
            <Plus className="w-4 h-4" /> Register Society
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['overview', 'societies', 'kyc', 'renewals', 'plans'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'plans' ? 'Plans & pricing' : tab}
            {tab === 'kyc' && kycQueue.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{kycQueue.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Societies', value: stats.total_societies, icon: Building2, gradient: 'from-indigo-500 to-indigo-600', color: 'text-indigo-600' },
              { label: 'Active', value: stats.by_status.ACTIVE || 0, icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600', color: 'text-emerald-600' },
              { label: 'Trial', value: stats.by_status.TRIAL || 0, icon: Clock, gradient: 'from-blue-500 to-blue-600', color: 'text-blue-600' },
              { label: 'Suspended', value: stats.by_status.SUSPENDED || 0, icon: Pause, gradient: 'from-red-500 to-red-600', color: 'text-red-600' },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                    <card.icon className="w-5.5 h-5.5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Plan Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {Object.entries(stats.by_plan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${planColors[plan] || 'bg-gray-100 text-gray-700'}`}>{plan}</span>
                    <span className="text-sm font-bold text-gray-900">{count as number}</span>
                  </div>
                ))}
                {!Object.keys(stats.by_plan).length && <p className="text-sm text-gray-400 text-center py-4">No data yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Societies</h3>
              <div className="space-y-2">
                {(stats.recent || []).slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.city}, {s.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${statusColors[s.subscription_status] || statusColors.PENDING}`}>
                        {s.subscription_status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {!stats.recent?.length && <p className="text-sm text-gray-400 text-center py-4">No societies yet</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Societies Tab */}
      {activeTab === 'societies' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search societies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="OFFBOARDED">Offboarded</option>
            </select>
          </div>

          {/* Societies Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Society</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Renewal</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Units</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSocieties.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.contact_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{s.city}, {s.state}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${planColors[s.subscription_plan] || ''}`}>
                          {s.subscription_plan || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusColors[s.subscription_status] || statusColors.PENDING}`}>
                          {s.subscription_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {s.renewal_date
                          ? new Date(s.renewal_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{s.total_units || 0}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button type="button" onClick={() => openRenew(s)}
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Record renewal">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                          </button>
                          <Link href={`/dashboard/societies/${s.id}`} className="p-2 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          {s.subscription_status === 'ACTIVE' && (
                            <button onClick={() => handleSubscriptionAction(s.id, 'SUSPEND', 'Payment issue')}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Suspend">
                              <Pause className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                          {s.subscription_status === 'SUSPENDED' && (
                            <button onClick={() => handleSubscriptionAction(s.id, 'REACTIVATE')}
                              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Reactivate">
                              <RotateCcw className="w-4 h-4 text-emerald-500" />
                            </button>
                          )}
                          {s.subscription_status === 'TRIAL' && (
                            <button onClick={() => handleSubscriptionAction(s.id, 'ACTIVATE')}
                              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Activate">
                              <Play className="w-4 h-4 text-emerald-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredSocieties.length && (
                <div className="py-12 text-center text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No societies found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KYC Queue Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">KYC Review Queue</h2>
            <span className="text-sm text-gray-500">{kycQueue.length} pending</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {kycQueue.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{s.registration_number || 'No Reg. No.'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                    s.onboarding_state === 'KYC_PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {s.onboarding_state?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div><span className="text-gray-400">City:</span> {s.city}</div>
                  <div><span className="text-gray-400">State:</span> {s.state}</div>
                  <div><span className="text-gray-400">Contact:</span> {s.contact_name}</div>
                  <div><span className="text-gray-400">Plan:</span> {s.subscription_plan}</div>
                  <div><span className="text-gray-400">Units:</span> {s.total_units}</div>
                  <div><span className="text-gray-400">Email:</span> {s.contact_email}</div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => handleKYCAction(s.id, 'approve')}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => {
                    const reason = prompt('Enter rejection reason (required):');
                    if (reason) handleKYCAction(s.id, 'reject', reason ?? '');
                  }}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                    Reject
                  </button>
                  <Link href={`/dashboard/tenants/${s.id}`}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))}
            {!kycQueue.length && (
              <div className="lg:col-span-2 py-12 text-center text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No KYC applications pending</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plans & pricing */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Subscription plans</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Price is per unit per month (₹). Same <span className="font-mono text-xs">code</span> as in society <span className="font-mono text-xs">subscription_plan</span> (e.g. CORE). DB rows override built-in defaults for that code.
              </p>
            </div>
            <button type="button" onClick={openNewPlan}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add plan
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">₹ / unit / mo</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Features</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dbPlans.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.name}</td>
                      <td className="px-4 py-4"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg">{p.code}</span></td>
                      <td className="px-4 py-4 text-sm font-medium text-indigo-600">₹{Number(p.price || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-4 text-xs text-gray-600 max-w-xs truncate" title={Array.isArray(p.features) ? p.features.join(", ") : ""}>
                        {Array.isArray(p.features) ? p.features.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button type="button" onClick={() => openEditPlan(p)} className="p-2 hover:bg-indigo-50 rounded-lg inline-flex" title="Edit">
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button type="button" onClick={() => deletePlan(p.id, p.code)} className="p-2 hover:bg-red-50 rounded-lg inline-flex" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!dbPlans.length && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No rows in <span className="font-mono">platform.plans</span> yet. Add a plan to override prices; until then built-in CORE / COMPLIANCE / AI_PRO defaults apply.
                </div>
              )}
            </div>
          </div>

          {planForm && (
            <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{planForm.id ? "Edit plan" : "New plan"}</h3>
                  <button type="button" onClick={() => setPlanForm(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={savePlan} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Display name *</label>
                    <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required placeholder="e.g. Compliance Plus" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Plan code * {!planForm.id && <span className="font-normal text-gray-400">(uppercase, e.g. CORE)</span>}</label>
                    <input value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono" required
                      disabled={!!planForm.id} placeholder="CORE" />
                    {planForm.id && <p className="text-[10px] text-gray-400 mt-1">Code cannot be changed; create a new plan to use another code.</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹ per unit / month) *</label>
                    <input type="number" min={0} step={1} value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Features (comma-separated)</label>
                    <textarea value={planForm.featuresStr} rows={3}
                      onChange={(e) => setPlanForm({ ...planForm, featuresStr: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="accounting, billing, gst" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Badge color (Tailwind classes)</label>
                    <input value={planForm.color} onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono text-xs" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setPlanForm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={savingPlan}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                      {savingPlan ? "Saving…" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Renewals Tab */}
      {activeTab === 'renewals' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Renewal Calendar</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Society</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Units</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(renewals || []).length > 0 ? renewals.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><p className="text-sm font-semibold text-gray-900">{r.name}</p></td>
                    <td className="px-4 py-4"><span className={`text-xs font-semibold px-2 py-1 rounded-lg ${planColors[r.subscription_plan] || ''}`}>{r.subscription_plan}</span></td>
                    <td className="px-4 py-4 text-sm">{r.total_units}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{r.contact_email}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {r.renewal_date ? new Date(r.renewal_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openRenew(r)}
                          className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors font-medium">
                          Record renewal
                        </button>
                        <button type="button" onClick={() => handleSubscriptionAction(r.id, 'ACTIVATE')}
                          className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
                          Send Reminder
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400">No upcoming renewals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {renewModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Manual renewal</h3>
              <button type="button" onClick={() => setRenewModal(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{renewModal.name}</span>
              {renewModal.subscription_status === 'OFFBOARDED' && (
                <span className="block mt-1 text-amber-700 text-xs">This society is offboarded — renewal will set status back to <strong>ACTIVE</strong>.</span>
              )}
            </p>
            <form onSubmit={submitRenew} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Next renewal date (optional)</label>
                <input type="date" value={renewForm.renewal_date}
                  onChange={(e) => setRenewForm({ ...renewForm, renewal_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                <p className="text-[11px] text-gray-500 mt-1">If set, this exact date is saved. Leave empty to extend from today / current renewal by months below.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Extend by (months)</label>
                <select value={renewForm.extend_months} disabled={Boolean(renewForm.renewal_date?.trim())}
                  onChange={(e) => setRenewForm({ ...renewForm, extend_months: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-400">
                  {[1, 3, 6, 12, 24, 36].map((m) => (
                    <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Note (optional)</label>
                <textarea value={renewForm.reason} rows={2}
                  onChange={(e) => setRenewForm({ ...renewForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                  placeholder="e.g. Payment received — UTR …" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setRenewModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={renewSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  {renewSubmitting ? 'Saving…' : 'Save renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}