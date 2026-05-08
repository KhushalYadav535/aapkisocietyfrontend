"use client";

import { useEffect, useState } from "react";
import { privacyAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";

interface ConsentState {
  billing_comms: boolean;
  statutory_notices: boolean;
  marketing: boolean;
}

export default function PrivacyPage() {
  const { t } = useLocale();
  const [consent, setConsent] = useState<ConsentState>({
    billing_comms: true,
    statutory_notices: true,
    marketing: false
  });
  const [requestType, setRequestType] = useState<"ERASURE" | "PORTABILITY">("ERASURE");
  const [reason, setReason] = useState("");

  const load = async () => {
    try {
      const res = await privacyAPI.getConsent();
      setConsent(res.data.consent || consent);
    } catch {
      toast.error(t("failedToLoadConsent"));
    }
  };

  useEffect(() => { load(); }, []);

  const saveConsent = async () => {
    try {
      await privacyAPI.updateConsent(consent);
      toast.success(t("consentUpdated"));
    } catch {
      toast.error(t("failedToUpdateConsent"));
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await privacyAPI.createRequest({ type: requestType, reason });
      toast.success(t("privacyRequestSubmitted"));
      setReason("");
    } catch {
      toast.error(t("failedToCreatePrivacyRequest"));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("privacyTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("privacySubtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Consent Preferences</h2>
        <label className="flex items-center justify-between text-sm border border-gray-100 rounded-xl px-3 py-2.5">
          <span>Billing Communications</span>
          <input type="checkbox" checked={consent.billing_comms} onChange={(e) => setConsent((p) => ({ ...p, billing_comms: e.target.checked }))} />
        </label>
        <label className="flex items-center justify-between text-sm border border-gray-100 rounded-xl px-3 py-2.5">
          <span>Statutory Notices</span>
          <input type="checkbox" checked={consent.statutory_notices} onChange={(e) => setConsent((p) => ({ ...p, statutory_notices: e.target.checked }))} />
        </label>
        <label className="flex items-center justify-between text-sm border border-gray-100 rounded-xl px-3 py-2.5">
          <span>Marketing Communication</span>
          <input type="checkbox" checked={consent.marketing} onChange={(e) => setConsent((p) => ({ ...p, marketing: e.target.checked }))} />
        </label>
        <button onClick={saveConsent} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">{t("saveConsent")}</button>
      </div>

      <form onSubmit={createRequest} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Data Request</h2>
        <select value={requestType} onChange={(e) => setRequestType(e.target.value as "ERASURE" | "PORTABILITY")} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
          <option value="ERASURE">Erasure Request</option>
          <option value="PORTABILITY">Portability Request</option>
        </select>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-24" />
        <button className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold">{t("submitRequest")}</button>
      </form>
    </div>
  );
}
