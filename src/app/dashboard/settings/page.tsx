"use client";
import { useState, useEffect } from "react";
import { authAPI, societyAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { Settings, User, Lock, Building2, Eye, EyeOff, Save, Check } from "lucide-react";

function Field({ label, value, onChange, type = "text", placeholder = "", readOnly = false }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${readOnly ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed" : "border-gray-200 bg-gray-50 focus:bg-white"}`} />
    </div>
  );
}

export default function SettingsPage() {
  const { user, setUser, hasPermission } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState("Profile");
  const TABS = [
    { id: "Profile", label: t("profile") },
    { id: "Security", label: t("security") },
    { id: "Society", label: t("society") }
  ];

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [society, setSociety] = useState<any>(null);

  const [profile, setProfile] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [societyForm, setSocietyForm] = useState({ name: "", address: "", city: "", state: "", pincode: "", bank_name: "", bank_account_number: "", bank_ifsc: "" });

  useEffect(() => {
    if (user?.society_id) {
      societyAPI.getById(user.society_id).then(r => {
        setSociety(r.data.society);
        setSocietyForm({ name: r.data.society.name || "", address: r.data.society.address || "", city: r.data.society.city || "", state: r.data.society.state || "", pincode: r.data.society.pincode || "", bank_name: r.data.society.bank_name || "", bank_account_number: r.data.society.bank_account_number || "", bank_ifsc: r.data.society.bank_ifsc || "" });
      }).catch(() => {});
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const r = await authAPI.updateProfile(profile);
      if (setUser) setUser((prev: any) => ({ ...prev, ...r.data.user }));
      toast.success(t("profileUpdated"));
    } catch { toast.error(t("failedToUpdateProfile")); } finally { setSavingProfile(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (passwords.newPassword.length < 8) { toast.error(t("passwordMinLength")); return; }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success(t("passwordChangedSuccessfully"));
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) { toast.error(err.response?.data?.error || t("failedToChangePassword")); } finally { setSavingPassword(false); }
  };

  const saveSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.society_id) return;
    try {
      await societyAPI.update(user.society_id, societyForm);
      toast.success(t("societySettingsSaved"));
    } catch { toast.error(t("failedToSave")); }
  };

  const isAdmin = hasPermission('SOCIETY_MANAGE');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">{t("settingsTitle")}</h1>
        <p className="text-gray-400 text-sm mt-1">{t("settingsSubtitle")}</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit animate-slide-up">
        {TABS.filter(x => x.id !== "Society" || isAdmin).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === x.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{x.label}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "Profile" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{user?.first_name} {user?.last_name}</h2>
              <p className="text-sm text-indigo-500">{(user?.role || 'Member')} · {user?.email}</p>
              {user?.flat_number && <p className="text-xs text-gray-400 mt-0.5">{t("flat")} {user.flat_number} · {t("wing")} {user.wing}</p>}
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("firstName")} value={profile.first_name} onChange={(e: any) => setProfile(p => ({ ...p, first_name: e.target.value }))} placeholder="Rajesh" />
              <Field label={t("lastName")} value={profile.last_name} onChange={(e: any) => setProfile(p => ({ ...p, last_name: e.target.value }))} placeholder="Sharma" />
            </div>
            <Field label={t("emailAddress")} value={user?.email || ""} readOnly />
            <Field label={t("phoneNumber")} value={profile.phone} onChange={(e: any) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
            <Field label={t("role")} value={(user?.role || 'Member') || ""} readOnly />
            <button type="submit" disabled={savingProfile} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">
              {savingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />} {t("saveProfile")}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {tab === "Security" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-indigo-600" /></div>
            <div><h2 className="font-semibold text-gray-900">{t("changePassword")}</h2><p className="text-xs text-gray-400">{t("changePasswordHint")}</p></div>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{t("multiFactorAuthentication")}</p>
                <p className="text-xs text-gray-500">{(user as { mfa_enabled?: number } | null)?.mfa_enabled ? t("enabled") : t("requiredForFinancialRoles")}</p>
              </div>
              <Link href="/mfa-setup" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white">
                {t("configureMfa")}
              </Link>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("currentPassword")}</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("newPassword")}</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required minLength={8} className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t("confirmNewPassword")}</label>
              <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
              {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && <p className="text-xs text-red-500 mt-1">{t("passwordsDontMatch")}</p>}
            </div>
            <button type="submit" disabled={savingPassword} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">
              {savingPassword ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />} {t("changePassword")}
            </button>
          </form>
        </div>
      )}

      {/* Society Tab */}
      {tab === "Society" && isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-indigo-600" /></div>
            <div><h2 className="font-semibold text-gray-900">{t("societySettings")}</h2><p className="text-xs text-gray-400">{t("societyInfoHint")}</p></div>
          </div>
          {society ? (
            <form onSubmit={saveSociety} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl mb-2 text-xs text-gray-500">
                <div><span className="font-semibold">{t("registrationNo")}: </span>{society.registration_number || "—"}</div>
                <div><span className="font-semibold">{t("plan")}: </span>{society.subscription_plan}</div>
                <div><span className="font-semibold">{t("units")}: </span>{society.total_units}</div>
                <div><span className="font-semibold">{t("status")}: </span><span className="text-emerald-600">{society.status}</span></div>
              </div>
              <Field label={t("societyName")} value={societyForm.name} onChange={(e: any) => setSocietyForm(p => ({ ...p, name: e.target.value }))} />
              <Field label={t("address")} value={societyForm.address} onChange={(e: any) => setSocietyForm(p => ({ ...p, address: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <Field label={t("city")} value={societyForm.city} onChange={(e: any) => setSocietyForm(p => ({ ...p, city: e.target.value }))} />
                <Field label={t("state")} value={societyForm.state} onChange={(e: any) => setSocietyForm(p => ({ ...p, state: e.target.value }))} />
                <Field label={t("pinCode")} value={societyForm.pincode} onChange={(e: any) => setSocietyForm(p => ({ ...p, pincode: e.target.value }))} />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">{t("bankDetails")}</p>
              <Field label={t("bankName")} value={societyForm.bank_name} onChange={(e: any) => setSocietyForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="State Bank of India" />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("accountNumber")} value={societyForm.bank_account_number} onChange={(e: any) => setSocietyForm(p => ({ ...p, bank_account_number: e.target.value }))} placeholder="00000000000" />
                <Field label={t("ifscCode")} value={societyForm.bank_ifsc} onChange={(e: any) => setSocietyForm(p => ({ ...p, bank_ifsc: e.target.value }))} placeholder="SBIN0000000" />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition-all">
                <Save className="w-4 h-4" /> {t("saveSocietySettings")}
              </button>
            </form>
          ) : (
            <div className="h-40 skeleton rounded-xl" />
          )}
        </div>
      )}
    </div>
  );
}
