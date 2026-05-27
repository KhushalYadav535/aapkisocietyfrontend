"use client";

import { useState, useEffect } from "react";
import { platformAPI } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import {
  Globe, Plus, Search, Building2, Users, CheckCircle2, X, MapPin, Calendar,
  CreditCard, Trash2, ShieldAlert, PlayCircle, Clock, Upload, FileText,
  CheckCircle, ArrowRight, AlertTriangle, Loader2
} from "lucide-react";

interface Society {
  id: string; name: string; registration_number: string; address: string;
  city: string; state: string; total_units: number; total_wings: number;
  status: string; subscription_plan: string; subscription_status: string;
  onboarding_state: string; kyc_documents?: any;
  renewal_date?: string; contact_name: string; contact_email: string; contact_phone: string;
  created_at: string;
}

const ONBOARDING_STEPS = [
  { key: 'REGISTRATION_FORM', label: 'Registration', desc: 'Form submitted' },
  { key: 'EMAIL_VERIFICATION', label: 'Email Verified', desc: 'Verification pending' },
  { key: 'KYC_PENDING', label: 'KYC Pending', desc: 'Documents submitted' },
  { key: 'KYC_UNDER_REVIEW', label: 'KYC Under Review', desc: 'Admin review' },
  { key: 'SCHEMA_PROVISIONED', label: 'Setup Complete', desc: 'Schema created' },
  { key: 'ACTIVE', label: 'Active', desc: 'Fully operational' },
];

const PLAN_COLORS: Record<string, string> = {
  CORE: 'bg-blue-100 text-blue-700',
  COMPLIANCE: 'bg-amber-100 text-amber-700',
  AI_PRO: 'bg-violet-100 text-violet-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REGISTRATION_FORM: 'bg-blue-100 text-blue-700',
  KYC_PENDING: 'bg-amber-100 text-amber-700',
  KYC_UNDER_REVIEW: 'bg-purple-100 text-purple-700',
  KYC_APPROVED: 'bg-emerald-100 text-emerald-700',
  TRIAL_ACTIVE: 'bg-cyan-100 text-cyan-700',
};

export default function SocietiesPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState<'societies' | 'plans' | 'onboarding'>('societies');
  const [societies, setSocieties] = useState<Society[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Public registration
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', registration_number: '', address: '', city: 'Mumbai',
    state: 'Maharashtra', pincode: '', total_units: '', total_wings: '',
    contact_name: '', contact_email: '', contact_phone: '', plan: 'CORE',
  });
  const [registering, setRegistering] = useState(false);

  type PlanCatalogEntry = { name: string; pricePerUnit: number; features: string[] };
  const [planCatalog, setPlanCatalog] = useState<Record<string, PlanCatalogEntry>>({});

  // KYC submission
  const [showKYC, setShowKYC] = useState<Society | null>(null);
  const [kycForm, setKycForm] = useState({
    reg_certificate: '', bye_laws: '', committee_resolution: '',
    bank_details: '', pan_cert: '', gst_cert: '',
  });
  const [submittingKYC, setSubmittingKYC] = useState(false);

  // Subscription actions
  const [actionModal, setActionModal] = useState<{ society: Society; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');

  const role = String(user?.role || '').toUpperCase();
  const isPlatformAdmin = role === 'PLATFORM_ADMIN';
  const isPublic = !user; // for registration page

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    platformAPI.getPlans().then((res) => setPlanCatalog(res.data.plans || {})).catch(() => setPlanCatalog({}));
  }, [isPlatformAdmin]);

  useEffect(() => {
    const keys = Object.keys(planCatalog);
    if (!keys.length) return;
    setRegForm((f) => ({ ...f, plan: keys.includes(f.plan) ? f.plan : keys[0] }));
  }, [planCatalog]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [socRes, statsRes] = await Promise.all([
        platformAPI.getAllSocieties(),
        isPlatformAdmin ? platformAPI.getStats() : Promise.resolve({ data: {} }),
      ]);
      setSocieties(socRes.data.societies || []);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await platformAPI.registerSociety({
        ...regForm,
        total_units: parseInt(regForm.total_units) || 0,
        total_wings: parseInt(regForm.total_wings) || 0,
      });
      toast.success('Registration submitted! Check email to verify.');
      setShowRegister(false);
      setRegForm({ name: '', registration_number: '', address: '', city: 'Mumbai', state: 'Maharashtra', pincode: '', total_units: '', total_wings: '', contact_name: '', contact_email: '', contact_phone: '', plan: 'CORE' });
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Registration failed'); }
    finally { setRegistering(false); }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showKYC) return;
    setSubmittingKYC(true);
    try {
      await platformAPI.submitKYC({ society_id: showKYC.id, documents: kycForm });
      toast.success('KYC submitted for review');
      setShowKYC(null);
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'KYC submission failed'); }
    finally { setSubmittingKYC(false); }
  };

  const handleSubscriptionAction = async () => {
    if (!actionModal) return;
    try {
      await platformAPI.updateSubscription(actionModal.society.id, actionModal.action, actionReason || undefined);
      toast.success(`Society ${actionModal.action.toLowerCase()}d`);
      setActionModal(null);
      setActionReason('');
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Action failed'); }
  };

  const handleApproveKYC = async (id: string) => {
    try {
      await platformAPI.approveKYC(id);
      toast.success('KYC approved');
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Approval failed'); }
  };
  const handleRejectKYC = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await platformAPI.rejectKYC(id, reason);
      toast.success('KYC rejected');
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Rejection failed'); }
  };

  const getOnboardingStepIndex = (state: string) => {
    return ONBOARDING_STEPS.findIndex(s => s.key === state) || 0;
  };

  const getStepStatus = (state: string, stepKey: string) => {
    const currentIdx = getOnboardingStepIndex(state);
    const stepIdx = ONBOARDING_STEPS.findIndex(s => s.key === stepKey);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  const filtered = societies.filter(s =>
    `${s.name} ${s.city} ${s.registration_number} ${s.contact_email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500" /> Societies & Onboarding
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isPlatformAdmin ? 'Manage society onboarding, KYC, and subscriptions' : 'Browse and manage societies'}
          </p>
        </div>
        {isPlatformAdmin && (
          <button onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4" /> New Registration
          </button>
        )}
      </div>

      {/* Stats */}
      {isPlatformAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Societies', value: stats.total || 0, color: 'indigo' },
            { label: 'Active', value: stats.active || 0, color: 'emerald' },
            { label: 'Pending KYC', value: stats.kyc_pending || 0, color: 'amber' },
            { label: 'Renewals Due', value: stats.renewals_due || 0, color: 'rose' },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400">{c.label}</p>
              <p className={`text-2xl font-bold text-${c.color}-600 mt-1`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['societies', 'plans', 'onboarding'].map(tb => (
          <button key={tb} onClick={() => setTab(tb as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tb ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
            }`}>
            {tb.charAt(0).toUpperCase() + tb.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : tab === 'societies' ? (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Search societies..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`p-4 border-b ${s.subscription_plan === 'AI_PRO' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600' : s.subscription_plan === 'COMPLIANCE' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white leading-tight">{s.name}</h3>
                      <p className="text-white/70 text-xs mt-0.5">{s.registration_number || 'Unregistered'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-medium bg-white/20 text-white`}>
                      {s.subscription_plan}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span>{s.city}, {s.state}</span></div>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="text-center"><p className="text-lg font-bold text-gray-900">{s.total_units || 0}</p><p className="text-xs text-gray-400">Units</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-gray-900">{s.total_wings || 0}</p><p className="text-xs text-gray-400">Wings</p></div>
                    <div className="ml-auto">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[s.subscription_status] || 'bg-gray-100 text-gray-600'}`}>
                        {s.subscription_status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  {/* Onboarding Progress */}
                  {isPlatformAdmin && s.onboarding_state && s.onboarding_state !== 'ACTIVE' && (
                    <div className="pt-2 border-t border-gray-50">
                      <p className="text-xs font-medium text-gray-500 mb-2">Onboarding Progress</p>
                      <div className="flex items-center gap-1">
                        {ONBOARDING_STEPS.map((step, i) => {
                          const status = getStepStatus(s.onboarding_state, step.key);
                          return (
                            <div key={i} className={`flex-1 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-500' : status === 'active' ? 'bg-indigo-500' : 'bg-gray-200'}`}
                              title={`${step.label} (${step.desc})`} />
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {ONBOARDING_STEPS.find(st => st.key === s.onboarding_state)?.label || s.onboarding_state?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {/* Renewal */}
                  {s.renewal_date && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Renewal due: {new Date(s.renewal_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    {isPlatformAdmin && ['PENDING', 'REGISTRATION_FORM', 'KYC_PENDING'].includes(s.onboarding_state) && (
                      <button onClick={() => setShowKYC(s)} className="flex-1 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200">
                        Submit KYC
                      </button>
                    )}
                    {isPlatformAdmin && ['SUSPENDED', 'REGISTRATION_FORM'].includes(s.subscription_status) && (
                      <button onClick={() => setActionModal({ society: s, action: 'ACTIVATE' })}
                        className="flex-1 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200">
                        Activate
                      </button>
                    )}
                    {isPlatformAdmin && s.subscription_status === 'ACTIVE' && (
                      <button onClick={() => setActionModal({ society: s, action: 'SUSPEND' })}
                        className="flex-1 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200">
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Building2 className="w-14 h-14 mx-auto mb-3 opacity-40" /><p>No societies found</p>
              </div>
            )}
          </div>
        </>
      ) : tab === 'plans' && isPlatformAdmin ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            Plans and prices for new society registration. To create or edit billing tiers, use{' '}
            <Link href="/dashboard/platform-admin" className="text-indigo-600 font-medium hover:underline">
              Platform Admin → Plans
            </Link>
            .
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(planCatalog).map(([code, p]) => (
              <div key={code} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className="text-sm text-indigo-600 font-medium mt-1">₹{p.pricePerUnit} / unit / month</div>
                <div className="text-xs text-gray-500 mt-2 font-mono">{code}</div>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3">{(p.features || []).join(', ')}</p>
              </div>
            ))}
          </div>
          {!Object.keys(planCatalog).length && (
            <p className="text-sm text-gray-400 text-center py-8">Loading plans…</p>
          )}
        </div>
      ) : tab === 'onboarding' && isPlatformAdmin ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">KYC Approval Queue</h3>
          {societies.filter(s => ['KYC_PENDING', 'KYC_UNDER_REVIEW'].includes(s.onboarding_state)).length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No pending KYC reviews</p>
            </div>
          ) : (
            societies.filter(s => ['KYC_PENDING', 'KYC_UNDER_REVIEW'].includes(s.onboarding_state)).map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{s.contact_email} | {s.contact_phone}</p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                    {s.onboarding_state?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div><span className="text-gray-400">City:</span> {s.city}</div>
                  <div><span className="text-gray-400">Units:</span> {s.total_units}</div>
                  <div><span className="text-gray-400">Plan:</span> {s.subscription_plan}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveKYC(s.id)}
                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
                    Approve KYC
                  </button>
                  <button onClick={() => handleRejectKYC(s.id)}
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 border border-red-200">
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Select a tab</p>
        </div>
      )}

      {/* Public Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-gray-900">Register Your Society</h2><p className="text-xs text-gray-400 mt-0.5">Fill in the details to get started</p></div>
              <button onClick={() => setShowRegister(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Society Name *</label>
                <input value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Sunrise Heights CHS Ltd" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Reg. Number</label><input value={regForm.registration_number} onChange={e => setRegForm({ ...regForm, registration_number: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Pincode</label><input value={regForm.pincode} onChange={e => setRegForm({ ...regForm, pincode: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                <textarea value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Flat/Building, Street, Area" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">City *</label><input value={regForm.city} onChange={e => setRegForm({ ...regForm, city: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label><input value={regForm.state} onChange={e => setRegForm({ ...regForm, state: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Name *</label><input value={regForm.contact_name} onChange={e => setRegForm({ ...regForm, contact_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone *</label><input type="tel" value={regForm.contact_phone} onChange={e => setRegForm({ ...regForm, contact_phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                <input type="email" value={regForm.contact_email} onChange={e => setRegForm({ ...regForm, contact_email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Units</label><input type="number" value={regForm.total_units} onChange={e => setRegForm({ ...regForm, total_units: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Wings</label><input type="number" value={regForm.total_wings} onChange={e => setRegForm({ ...regForm, total_wings: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Plan *</label>
                {Object.keys(planCatalog).length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    No plans loaded. Add plans under Platform Admin, or refresh the page.
                  </p>
                ) : (
                  <div className={`grid gap-2 ${Object.keys(planCatalog).length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {Object.entries(planCatalog).map(([code, p]) => (
                      <button key={code} type="button" onClick={() => setRegForm({ ...regForm, plan: code })}
                        className={`p-3 rounded-xl border text-center transition-all ${regForm.plan === code ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500' : 'border-gray-200 hover:border-indigo-200'}`}>
                        <p className="text-xs font-bold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">₹{p.pricePerUnit}/unit/mo</p>
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5">{code}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRegister(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={registering}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {registering ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Register Society'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KYC Submission Modal */}
      {showKYC && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-gray-900">Submit KYC Documents</h2><p className="text-xs text-gray-400 mt-0.5">{showKYC.name}</p></div>
              <button onClick={() => setShowKYC(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmitKYC} className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-700">
                <p className="font-semibold">Required Documents</p>
                <p className="mt-0.5">Upload document URLs or reference numbers. For full verification, please provide:</p>
                <ul className="mt-1 space-y-0.5 list-disc list-inside text-amber-600">
                  <li>Registration Certificate</li>
                  <li>Bye-Laws / Society Rules</li>
                  <li>Committee Resolution</li>
                  <li>Bank Account Details</li>
                  <li>PAN Certificate</li>
                  <li>GST Registration (if applicable)</li>
                </ul>
              </div>
              {[
                { key: 'reg_certificate', label: 'Registration Certificate', placeholder: 'Reg. Cert. Number or URL' },
                { key: 'bye_laws', label: 'Bye-Laws', placeholder: 'Document reference' },
                { key: 'committee_resolution', label: 'Committee Resolution', placeholder: 'Resolution number' },
                { key: 'bank_details', label: 'Bank Account Details', placeholder: 'A/c No., Bank, IFSC' },
                { key: 'pan_cert', label: 'PAN Certificate', placeholder: 'PAN Number' },
                { key: 'gst_cert', label: 'GST Certificate', placeholder: 'GSTIN (if registered)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                  <input value={kycForm[f.key as keyof typeof kycForm]} onChange={e => setKycForm({ ...kycForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowKYC(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submittingKYC}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingKYC ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit KYC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{actionModal.action} Society</h2>
              <button onClick={() => setActionModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to <strong>{actionModal.action.toLowerCase()}</strong> <strong>{actionModal.society.name}</strong>?
              {actionModal.action === 'SUSPEND' && ' A dual-approval process will be initiated for discontinuation.'}
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason / Notes</label>
              <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional reason or notes..." />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setActionModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubscriptionAction}
                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold ${actionModal.action === 'SUSPEND' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
