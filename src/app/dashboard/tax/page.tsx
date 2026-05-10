"use client";

import { useEffect, useState } from "react";
import { taxAPI } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import {
  FileSpreadsheet, Download, RefreshCw, TrendingUp,
  CheckCircle2, XCircle, AlertTriangle, IndianRupee
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Tab = 'gstr1' | 'gstr3b' | 'gstr9' | 'reconciliation' | 'tds';

interface GSTR1Row { rate: number; taxable_value: number; igst: number; cgst: number; sgst: number; cess: number; count: number; }
interface GSTR3BSummary { total_output_tax: number; total_igst: number; total_cgst: number; total_sgst: number; total_cess: number; total_ITC: number; net_tax_payable: number; }
interface Reconciliation { period: string; matched_count: number; mismatched_count: number; total_reported: number; total_paid: number; difference: number; details: any[]; }

export default function TaxPage() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('gstr1');

  // GST Period
  const [gstPeriod, setGstPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [tdsPeriod, setTdsPeriod] = useState(() => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3);
    return `${d.getFullYear()}-Q${q}`;
  });
  const [fyYear, setFyYear] = useState(String(new Date().getFullYear() - 1));

  // Data states
  const [gstr1Data, setGstr1Data] = useState<{ summary: any; by_rate: GSTR1Row[] } | null>(null);
  const [gstr3bData, setGstr3bData] = useState<{ summary: GSTR3BSummary } | null>(null);
  const [gstr9Data, setGstr9Data] = useState<{ annual_summary: any } | null>(null);
  const [reconData, setReconData] = useState<Reconciliation | null>(null);
  const [tdsForm, setTdsForm] = useState('26Q');
  const [loading, setLoading] = useState(false);

  const loadGSTR1 = async () => {
    if (!gstPeriod) return;
    setLoading(true);
    try {
      const res = await taxAPI.exportGst({ return_type: 'GSTR-1', period: gstPeriod });
      setGstr1Data(res.data);
    } catch { toast.error("Failed to load GSTR-1 data"); }
    finally { setLoading(false); }
  };

  const loadGSTR3B = async () => {
    if (!gstPeriod) return;
    setLoading(true);
    try {
      const res = await taxAPI.exportGst({ return_type: 'GSTR-3B', period: gstPeriod });
      setGstr3bData(res.data);
    } catch { toast.error("Failed to load GSTR-3B data"); }
    finally { setLoading(false); }
  };

  const loadGSTR9 = async () => {
    if (!fyYear) return;
    setLoading(true);
    try {
      const res = await taxAPI.exportGst({ return_type: 'GSTR-9', period: fyYear });
      setGstr9Data(res.data);
    } catch { toast.error("Failed to load GSTR-9 data"); }
    finally { setLoading(false); }
  };

  const loadReconciliation = async () => {
    if (!gstPeriod) return;
    setLoading(true);
    try {
      const res = await taxAPI.exportGst({ return_type: 'GST_RECONCILIATION', period: gstPeriod });
      setReconData(res.data);
    } catch { toast.error("Failed to load reconciliation data"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'gstr1') loadGSTR1();
    else if (tab === 'gstr3b') loadGSTR3B();
    else if (tab === 'gstr9') loadGSTR9();
    else if (tab === 'reconciliation') loadReconciliation();
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'gstr1', label: 'GSTR-1' },
    { key: 'gstr3b', label: 'GSTR-3B' },
    { key: 'gstr9', label: 'GSTR-9' },
    { key: 'reconciliation', label: 'GST Reconciliation' },
    { key: 'tds', label: 'TDS' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax & Compliance</h1>
          <p className="text-sm text-gray-500 mt-0.5">GST returns, TDS filings, and reconciliation</p>
        </div>
        <button onClick={() => {
          if (tab === 'gstr1') loadGSTR1();
          else if (tab === 'gstr3b') loadGSTR3B();
          else if (tab === 'gstr9') loadGSTR9();
          else if (tab === 'reconciliation') loadReconciliation();
        }}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Period Selector */}
      {(tab === 'gstr1' || tab === 'gstr3b' || tab === 'reconciliation') && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <label className="text-sm font-medium text-gray-600">GST Period</label>
          <input type="month" value={gstPeriod} onChange={e => setGstPeriod(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => {
            if (tab === 'gstr1') loadGSTR1();
            else if (tab === 'gstr3b') loadGSTR3B();
            else if (tab === 'reconciliation') loadReconciliation();
          }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Load Data
          </button>
        </div>
      )}
      {tab === 'gstr9' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <label className="text-sm font-medium text-gray-600">Financial Year</label>
          <input type="number" value={fyYear} onChange={e => setFyYear(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-28 focus:ring-2 focus:ring-indigo-500"
            placeholder="2025" min="2020" max="2030" />
          <button onClick={loadGSTR9}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Load Data
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tb.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4"><div className="h-48 skeleton rounded-2xl" /></div>
      ) : tab === 'gstr1' && gstr1Data ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Taxable Value', value: formatCurrency(gstr1Data.summary?.total_taxable_value || 0), color: 'blue' },
              { label: 'Total IGST', value: formatCurrency(gstr1Data.summary?.total_igst || 0), color: 'purple' },
              { label: 'Total CGST', value: formatCurrency(gstr1Data.summary?.total_cgst || 0), color: 'indigo' },
              { label: 'Total SGST', value: formatCurrency(gstr1Data.summary?.total_sgst || 0), color: 'violet' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className={`text-lg font-bold text-${c.color}-700 mt-1`}>{c.value}</p>
              </div>
            ))}
          </div>
          {/* Rate Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Tax Rate Breakdown — {gstPeriod}</h3>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Rate</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Taxable Value (₹)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">IGST (₹)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">CGST (₹)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">SGST (₹)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Bills</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {gstr1Data.by_rate?.map((row: GSTR1Row, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{row.rate}%</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.taxable_value)}</td>
                    <td className="px-4 py-3 text-right text-purple-600">{formatCurrency(row.igst)}</td>
                    <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(row.cgst)}</td>
                    <td className="px-4 py-3 text-right text-violet-600">{formatCurrency(row.sgst)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.count}</td>
                  </tr>
                ))}
                {(!gstr1Data.by_rate || gstr1Data.by_rate.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'gstr3b' && gstr3bData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Output Tax', value: formatCurrency(gstr3bData.summary?.total_output_tax || 0), color: 'rose' },
              { label: 'CGST', value: formatCurrency(gstr3bData.summary?.total_cgst || 0), color: 'indigo' },
              { label: 'SGST', value: formatCurrency(gstr3bData.summary?.total_sgst || 0), color: 'violet' },
              { label: 'IGST', value: formatCurrency(gstr3bData.summary?.total_igst || 0), color: 'purple' },
              { label: 'ITC Claimed', value: formatCurrency(gstr3bData.summary?.total_ITC || 0), color: 'emerald' },
              { label: 'Net Tax Payable', value: formatCurrency(gstr3bData.summary?.net_tax_payable || 0), color: 'amber' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className={`text-lg font-bold text-${c.color}-600 mt-1`}>{c.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Net Tax Payable for {gstPeriod}</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(gstr3bData.summary?.net_tax_payable || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : tab === 'gstr9' && gstr9Data ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-200 mb-4">
            <h3 className="font-semibold text-indigo-800">GSTR-9 Annual Return — FY {fyYear}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Taxable Supplies', value: formatCurrency(gstr9Data.annual_summary?.total_taxable_supplies || 0) },
              { label: 'Total Exempt Supplies', value: formatCurrency(gstr9Data.annual_summary?.total_exempt_supplies || 0) },
              { label: 'Total Tax', value: formatCurrency(gstr9Data.annual_summary?.total_tax || 0) },
              { label: 'Net Tax Payable', value: formatCurrency(gstr9Data.annual_summary?.net_tax_payable || 0) },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Component</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Amount (₹)</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: 'Total IGST', value: gstr9Data.annual_summary?.total_igst || 0 },
                  { label: 'Total CGST', value: gstr9Data.annual_summary?.total_cgst || 0 },
                  { label: 'Total SGST', value: gstr9Data.annual_summary?.total_sgst || 0 },
                  { label: 'Total CESS', value: gstr9Data.annual_summary?.total_cess || 0 },
                  { label: 'Total TDS', value: gstr9Data.annual_summary?.total_tds || 0 },
                  { label: 'Total ITC Availed', value: gstr9Data.annual_summary?.total_ITC_availed || 0 },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700">{r.label}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'reconciliation' && reconData ? (
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 border ${reconData.difference === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {reconData.difference === 0 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {reconData.difference === 0 ? 'GST Fully Reconciled' : 'GST Mismatch Detected'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">Period: {reconData.period || gstPeriod}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Reported', value: formatCurrency(reconData.total_reported || 0), color: 'blue' },
              { label: 'Total Paid', value: formatCurrency(reconData.total_paid || 0), color: 'green' },
              { label: 'Difference', value: formatCurrency(reconData.difference || 0), color: reconData.difference === 0 ? 'emerald' : 'red' },
              { label: 'Status', value: reconData.matched_count > 0 ? 'Matched' : 'Mismatched', color: reconData.matched_count > 0 ? 'emerald' : 'red' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className={`text-lg font-bold mt-1 ${c.color === 'blue' ? 'text-blue-700' : c.color === 'green' ? 'text-green-700' : c.color === 'emerald' ? 'text-emerald-700' : 'text-red-700'}`}>{c.value}</p>
              </div>
            ))}
          </div>
          {reconData.details?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Mismatch Details</h3>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Amount (₹)</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {reconData.details.map((d: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-lg font-semibold">{d.type}</span></td>
                      <td className="px-4 py-3 text-gray-600">{d.description}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'tds' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 max-w-lg">
            <h3 className="font-semibold text-gray-900">Generate TDS File</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Form Type</label>
                <select value={tdsForm} onChange={e => setTdsForm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="26Q">26Q</option>
                  <option value="24Q">24Q</option>
                  <option value="16A">16A</option>
                  <option value="ITNS-281">ITNS-281</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Period (YYYY-QN)</label>
                <input type="text" value={tdsPeriod} onChange={e => setTdsPeriod(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="2026-Q1" />
              </div>
            </div>
            <button onClick={async () => {
              try {
                await taxAPI.exportTds({ form_type: tdsForm, period: tdsPeriod });
                toast.success('TDS file generated');
              } catch { toast.error('Failed to generate TDS file'); }
            }}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
              Generate TDS
            </button>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a tab and load period data</p>
        </div>
      )}
    </div>
  );
}
