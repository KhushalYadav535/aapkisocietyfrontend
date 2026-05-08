"use client";

import { useState, useEffect } from "react";
import api, { planAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { Globe, Plus, Search, Building2, Users, CheckCircle2, X, MapPin, Calendar, CreditCard, Trash2, ShieldAlert, PlayCircle } from "lucide-react";

interface Society {
  id: string; name: string; registration_number: string; address: string;
  city: string; state: string; total_units: number; total_wings: number;
  status: string; subscription_plan: string; subscription_status: string;
  active_modules?: string[];
  created_at: string;
}

interface Plan {
  id: string; name: string; code: string; price: number;
  features: string[]; color: string; created_at: string;
}

const availableModules = ["MEMBERS", "BILLING", "COMPLAINTS", "NOTICES", "VISITORS", "FACILITIES", "REPORTS"];

export default function SocietiesPage() {
  const { t } = useLocale();
  const [tab, setTab] = useState("Societies");
  const [societies, setSocieties] = useState<Society[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Society Modals
  const [showAddSociety, setShowAddSociety] = useState(false);
  const [showEditSociety, setShowEditSociety] = useState<Society | null>(null);
  const [societyForm, setSocietyForm] = useState({
    name: "", registration_number: "", address: "", city: "Mumbai",
    state: "Maharashtra", pincode: "", total_units: "", total_wings: "",
    subscription_plan: "CORE", active_modules: ["MEMBERS", "BILLING"] as string[]
  });

  // Plan Modals
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "", code: "", price: "", features: [] as string[], color: "bg-blue-100 text-blue-700"
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [socRes, planRes] = await Promise.all([
        api.get("/societies"),
        planAPI.getAll()
      ]);
      setSocieties(socRes.data.societies);
      setPlans(planRes.data.plans);
    } catch { toast.error(t("failedToLoadData")); }
    finally { setLoading(false); }
  };

  const getPlanLabel = (code: string) => plans.find(p => p.code === code)?.name || code;
  const getPlanColor = (code: string) => plans.find(p => p.code === code)?.color || "bg-gray-100 text-gray-600";

  // Society Handlers
  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/societies", {
        ...societyForm,
        total_units: parseInt(societyForm.total_units) || 0,
        total_wings: parseInt(societyForm.total_wings) || 0,
      });
      toast.success(t("societyCreatedSuccessfully"));
      setShowAddSociety(false);
      setSocietyForm({ name: "", registration_number: "", address: "", city: "Mumbai", state: "Maharashtra", pincode: "", total_units: "", total_wings: "", subscription_plan: plans[0]?.code || "CORE", active_modules: ["MEMBERS", "BILLING"] });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("failedToCreateSociety"));
    }
  };

  const handleEditSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditSociety) return;
    try {
      await api.put(`/societies/${showEditSociety.id}`, {
        subscription_plan: societyForm.subscription_plan,
        active_modules: societyForm.active_modules
      });
      toast.success(t("societyPlanUpdated"));
      setShowEditSociety(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("failedToUpdateSociety"));
    }
  };

  const toggleSocietyModule = (mod: string) => {
    setSocietyForm(prev => ({
      ...prev,
      active_modules: prev.active_modules.includes(mod) 
        ? prev.active_modules.filter(m => m !== mod)
        : [...prev.active_modules, mod]
    }));
  };

  const handleSuspendSociety = async (id: string, currentStatus: string) => {
    const action = currentStatus === "ACTIVE" ? "suspend" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} this society?`)) return;
    try {
      await api.put(`/societies/${id}/${action}`);
      toast.success(`Society ${action}d successfully`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action} society`);
    }
  };

  const handleDeleteSociety = async (id: string) => {
    if (!window.confirm("WARNING: This will permanently delete the society and all its data. Proceed?")) return;
    try {
      await api.delete(`/societies/${id}`);
      toast.success("Society deleted permanently");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete society");
    }
  };

  // Plan Handlers
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await planAPI.create({
        ...planForm, price: parseFloat(planForm.price) || 0
      });
      toast.success(t("planCreatedSuccessfully"));
      setShowAddPlan(false);
      setPlanForm({ name: "", code: "", price: "", features: [], color: "bg-blue-100 text-blue-700" });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("failedToCreatePlan"));
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm(t("confirmDeletePlan"))) return;
    try {
      await planAPI.delete(id);
      toast.success(t("planDeleted"));
      loadData();
    } catch { toast.error(t("failedToDeletePlan")); }
  };

  const togglePlanFeature = (mod: string) => {
    setPlanForm(prev => ({
      ...prev,
      features: prev.features.includes(mod) 
        ? prev.features.filter(m => m !== mod)
        : [...prev.features, mod]
    }));
  };

  const filteredSocieties = societies.filter(s =>
    `${s.name} ${s.city} ${s.registration_number}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500" /> {t("societiesTitle")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("societiesSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          {tab === "Societies" ? (
            <button onClick={() => setShowAddSociety(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4" /> {t("addSociety")}
            </button>
          ) : (
            <button onClick={() => setShowAddPlan(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4" /> {t("addPlan")}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: "Societies", label: t("societies") },
          { id: "Plans", label: t("plans") }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === item.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      {tab === "Societies" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up stagger" style={{ animationDelay: "80ms" }}>
          {[
            { label: t("totalSocieties"), value: societies.length, icon: Building2, color: "from-indigo-500 to-indigo-600" },
            { label: t("active"), value: societies.filter(s => s.status === "ACTIVE").length, icon: CheckCircle2, color: "from-emerald-500 to-green-600" },
            { label: t("totalUnits"), value: societies.reduce((sum, s) => sum + (s.total_units || 0), 0), icon: Users, color: "from-blue-500 to-blue-600" },
            { label: t("activePlans"), value: plans.length, icon: CreditCard, color: "from-violet-500 to-purple-600" },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : tab === "Societies" ? (
        <>
          <div className="relative animate-slide-up" style={{ animationDelay: "120ms" }}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t("searchSocieties")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {filteredSocieties.map((society, i) => (
              <div key={society.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden animate-slide-up">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight">{society.name}</h3>
                      <p className="text-indigo-200 text-xs mt-0.5">{society.registration_number || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium cursor-pointer hover:opacity-80 transition-opacity ${getPlanColor(society.subscription_plan)}`} onClick={() => {
                      setSocietyForm({ ...societyForm, subscription_plan: society.subscription_plan || (plans[0]?.code || "CORE"), active_modules: society.active_modules || [] });
                      setShowEditSociety(society);
                    }}>
                      {getPlanLabel(society.subscription_plan)} ✏️
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{society.city}, {society.state}</span>
                  </div>
                  {society.address && (
                    <p className="text-xs text-gray-400 truncate pl-5">{society.address}</p>
                  )}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{society.total_units || 0}</p>
                      <p className="text-xs text-gray-400">{t("units")}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{society.total_wings || 0}</p>
                      <p className="text-xs text-gray-400">{t("totalWings")}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${society.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {society.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 pt-1 border-t border-gray-50">
                    <Calendar className="w-3 h-3" />
                    {t("registered")}: {new Date(society.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => handleSuspendSociety(society.id, society.status)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${society.status === "ACTIVE" ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}>
                      {society.status === "ACTIVE" ? <span className="flex items-center justify-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Suspend</span> : <span className="flex items-center justify-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> Reactivate</span>}
                    </button>
                    <button onClick={() => handleDeleteSociety(society.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredSocieties.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-300">
                <Building2 className="w-14 h-14 mx-auto mb-3 opacity-40" />
                <p className="text-gray-400">{t("noSocietiesFound")}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover">
              <div className="flex justify-between items-start">
                <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${p.color}`}>{p.name}</span>
                <button onClick={() => handleDeletePlan(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-4">₹{p.price}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("includedModules")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.features?.map(f => (
                    <span key={f} className="text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-md text-gray-600">{f.replace("_"," ")}</span>
                  ))}
                  {(!p.features || p.features.length === 0) && <span className="text-xs text-gray-400">{t("noSpecificFeatures")}</span>}
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-300">
              <CreditCard className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <p className="text-gray-400">{t("noPlansYet")}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Society Modal */}
      {showAddSociety && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-gray-900">{t("addNewSociety")}</h2></div>
              <button onClick={() => setShowAddSociety(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateSociety} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("societyName")} *</label><input value={societyForm.name} onChange={e => setSocietyForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Sunrise Heights CHS" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("registrationNumber")}</label><input value={societyForm.registration_number} onChange={e => setSocietyForm(p => ({ ...p, registration_number: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("pinCode")}</label><input value={societyForm.pincode} onChange={e => setSocietyForm(p => ({ ...p, pincode: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("city")}</label><input value={societyForm.city} onChange={e => setSocietyForm(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("plan")}</label><select value={societyForm.subscription_plan} onChange={e => setSocietyForm(p => ({ ...p, subscription_plan: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("totalUnits")}</label><input type="number" value={societyForm.total_units} onChange={e => setSocietyForm(p => ({ ...p, total_units: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("totalWings")}</label><input type="number" value={societyForm.total_wings} onChange={e => setSocietyForm(p => ({ ...p, total_wings: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("activeModules")}</label>
                <div className="flex flex-wrap gap-2">
                  {availableModules.map(mod => (
                    <button key={mod} type="button" onClick={() => toggleSocietyModule(mod)} className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${societyForm.active_modules.includes(mod) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"}`}>{mod.replace("_"," ")}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAddSociety(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50">{t("cancel")}</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">{t("createSociety")}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan & Modules Modal for Society */}
      {showEditSociety && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-gray-900">{t("managePlanModules")}</h2><p className="text-xs text-gray-400 mt-0.5">{showEditSociety.name}</p></div>
              <button onClick={() => setShowEditSociety(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleEditSociety} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("subscriptionPlan")}</label><select value={societyForm.subscription_plan} onChange={e => setSocietyForm(p => ({ ...p, subscription_plan: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("activeModules")}</label>
                <div className="flex flex-wrap gap-2">
                  {availableModules.map(mod => (
                    <button key={mod} type="button" onClick={() => toggleSocietyModule(mod)} className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${societyForm.active_modules.includes(mod) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"}`}>{mod.replace("_"," ")}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowEditSociety(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50">{t("cancel")}</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">{t("saveChanges")}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddPlan && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-bold text-gray-900">{t("createSubscriptionPlan")}</h2></div>
              <button onClick={() => setShowAddPlan(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("planName")} *</label><input value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value, code: e.target.value.toUpperCase().replace(/\s+/g,"_") }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="AI Pro" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("planCodeUnique")}</label><input value={planForm.code} onChange={e => setPlanForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="AI_PRO" required /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("monthlyPrice")}</label><input type="number" value={planForm.price} onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="999" required /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("includedFeatures")}</label>
                <div className="flex flex-wrap gap-2">
                  {availableModules.map(mod => (
                    <button key={mod} type="button" onClick={() => togglePlanFeature(mod)} className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${planForm.features.includes(mod) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300"}`}>{mod.replace("_"," ")}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("badgeColor")}</label>
                <select value={planForm.color} onChange={e => setPlanForm(p => ({ ...p, color: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="bg-blue-100 text-blue-700">Blue (Standard)</option>
                  <option value="bg-violet-100 text-violet-700">Violet (Pro)</option>
                  <option value="bg-amber-100 text-amber-700">Amber (Enterprise)</option>
                  <option value="bg-emerald-100 text-emerald-700">Green (Growth)</option>
                  <option value="bg-gray-100 text-gray-600">Gray (Core)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAddPlan(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50">{t("cancel")}</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">{t("createPlan")}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
