"use client";

import { useEffect, useState } from "react";
import { taxAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";

interface TaxRecord {
  id: string;
  period: string;
  status: string;
  return_type?: string;
  form_type?: string;
  created_at: string;
}

export default function TaxPage() {
  const { t } = useLocale();
  const [gstType, setGstType] = useState("GSTR-1");
  const [gstPeriod, setGstPeriod] = useState("");
  const [tdsType, setTdsType] = useState("26Q");
  const [tdsPeriod, setTdsPeriod] = useState("");
  const [gstReturns, setGstReturns] = useState<TaxRecord[]>([]);
  const [tdsReturns, setTdsReturns] = useState<TaxRecord[]>([]);

  const load = async () => {
    try {
      const res = await taxAPI.getReturns();
      setGstReturns(res.data.gst_returns || []);
      setTdsReturns(res.data.tds_returns || []);
    } catch {
      toast.error(t("failedToLoadTaxReturns"));
    }
  };

  useEffect(() => { load(); }, []);

  const exportGst = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taxAPI.exportGst({ return_type: gstType, period: gstPeriod, payload: {} });
      toast.success(t("gstExportGenerated"));
      setGstPeriod("");
      load();
    } catch {
      toast.error(t("failedToExportGstReturn"));
    }
  };

  const exportTds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taxAPI.exportTds({ form_type: tdsType, period: tdsPeriod, payload: {} });
      toast.success(t("tdsExportGenerated"));
      setTdsPeriod("");
      load();
    } catch {
      toast.error(t("failedToExportTdsReturn"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("taxTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("taxSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={exportGst} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">GST Export</h2>
          <select value={gstType} onChange={(e) => setGstType(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
            {["GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-7"].map((x) => <option key={x}>{x}</option>)}
          </select>
          <input value={gstPeriod} onChange={(e) => setGstPeriod(e.target.value)} placeholder="Period (e.g. 2026-05)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
          <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Generate GST</button>
        </form>

        <form onSubmit={exportTds} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">TDS Export</h2>
          <select value={tdsType} onChange={(e) => setTdsType(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
            {["26Q", "24Q", "16A", "ITNS-281"].map((x) => <option key={x}>{x}</option>)}
          </select>
          <input value={tdsPeriod} onChange={(e) => setTdsPeriod(e.target.value)} placeholder="Period (e.g. 2026-Q1)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
          <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Generate TDS</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">GST Exports</h3>
          <div className="space-y-2">
            {gstReturns.length === 0 ? <p className="text-sm text-gray-400">No GST exports yet</p> : gstReturns.map((r) => (
              <div key={r.id} className="text-sm border border-gray-100 rounded-xl px-3 py-2">
                <p className="font-medium text-gray-800">{r.return_type} · {r.period}</p>
                <p className="text-xs text-gray-500">{r.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">TDS Exports</h3>
          <div className="space-y-2">
            {tdsReturns.length === 0 ? <p className="text-sm text-gray-400">No TDS exports yet</p> : tdsReturns.map((r) => (
              <div key={r.id} className="text-sm border border-gray-100 rounded-xl px-3 py-2">
                <p className="font-medium text-gray-800">{r.form_type} · {r.period}</p>
                <p className="text-xs text-gray-500">{r.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
