"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { exportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText, CreditCard, File } from "lucide-react";

type ExportType = 'billing' | 'collection' | 'visitors' | 'complaints' | 'tally';
type DateRange = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

export default function ExportPage() {
  const { user, hasPermission } = useAuth();
  const [exportType, setExportType] = useState<ExportType>('billing');
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'excel' | 'pdf' | 'tally'>('excel');

  const role = String(user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'TREASURER', 'COMMITTEE', 'PLATFORM_ADMIN'].includes(role);

  const getDateFilter = () => {
    const now = new Date();
    let start: string, end: string;
    switch (dateRange) {
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'this_quarter':
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'custom':
        start = startDate;
        end = endDate;
        break;
    }
    return { start_date: start, end_date: end };
  };

  const handleExport = async () => {
    if (dateRange === 'custom' && (!startDate || !endDate)) {
      toast.error("Please select start and end dates");
      return;
    }

    setLoading(true);
    try {
      const { start_date, end_date } = getDateFilter();
      const payload = { report_type: exportType, start_date, end_date };

      let blob: Blob;
      let filename: string;
      const ext = format === 'tally' ? 'xml' : format === 'excel' ? 'xlsx' : 'pdf';
      filename = `${exportType}_${dateRange}_${new Date().toISOString().split('T')[0]}.${ext}`;

      if (format === 'tally') {
        const res = await exportAPI.tallyExport(payload);
        blob = new Blob([res.data], { type: 'application/xml' });
      } else if (format === 'excel') {
        const res = await exportAPI.excelExport(payload);
        blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else {
        const res = await exportAPI.pdfExport(payload);
        blob = new Blob([res.data], { type: 'application/pdf' });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filename}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const exportOptions: { key: ExportType; label: string; desc: string; icon: any }[] = [
    { key: 'billing', label: 'Billing & Payments', desc: 'Outstanding, received, pending bills', icon: CreditCard },
    { key: 'collection', label: 'Collection Summary', desc: 'Income vs expenses breakdown', icon: FileSpreadsheet },
    { key: 'visitors', label: 'Visitors Log', desc: 'Entry/exit records with details', icon: FileText },
    { key: 'complaints', label: 'Complaints Report', desc: 'Open, resolved, pending complaints', icon: File },
    { key: 'tally', label: 'Tally Export (XML)', desc: 'Tally ERP compatible ledger entries', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Download reports in Excel, PDF, or Tally XML format</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Type Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Select Report</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.key}
                    onClick={() => setExportType(opt.key)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      exportType === opt.key
                        ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      exportType === opt.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Date Range</h2>
            <div className="flex flex-wrap gap-2">
              {([
                ['this_month', 'This Month'],
                ['last_month', 'Last Month'],
                ['this_quarter', 'This Quarter'],
                ['this_year', 'This Year'],
                ['custom', 'Custom Range'],
              ] as [DateRange, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setDateRange(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    dateRange === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {dateRange === 'custom' && (
              <div className="flex gap-3 mt-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Export Format</h2>
            <div className="space-y-2">
              {([
                ['excel', 'Excel (.xlsx)', FileSpreadsheet],
                ['pdf', 'PDF (.pdf)', FileText],
                ...(exportType === 'tally' ? [] : []),
              ] as [string, string, any][]).map(([key, label, Icon]) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="format" checked={format === key} onChange={() => setFormat(key as any)}
                    className="w-4 h-4 text-indigo-600" />
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {exportType === 'tally' && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700">Tally XML format generates ledger masters and voucher entries compatible with Tally ERP 9 & Prime.</p>
              </div>
            )}

            <button onClick={handleExport} disabled={loading}
              className="mt-5 w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Generating...' : 'Download Report'}
            </button>
          </div>

          {/* Format info */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Format Notes</h2>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>Excel: sortable, filterable, ₹ currency formatted</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>PDF: print-ready A4 format with headers</p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>Tally XML: import directly into Tally ERP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
