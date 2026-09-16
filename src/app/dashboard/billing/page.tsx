"use client";

import { useState, useEffect } from "react";
import { billingAPI, mandateAPI, memberAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  Receipt, Plus, Search, CheckCircle, XCircle, IndianRupee, Zap, X,
  TrendingUp, AlertTriangle, Clock, Send, Users, FileText, Download,
  FileSpreadsheet, FilePlus, Layers, ArrowRight, Settings, Calendar, CreditCard
} from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import Pagination from "@/components/Pagination";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

interface Bill { id: string; bill_number: string; member_id: string; amount: number; total_amount: number; paid_amount: number; status: string; bill_type: string; billing_period: string; due_date: string; created_at: string; items?: any[]; }
interface Payment { id: string; amount: number; payment_method: string; payment_reference?: string; status: string; payment_date: string; member_id: string; }
interface Defaulter { member_id: string; member_name: string; flat_number: string; wing: string; total_outstanding: number; oldest_bill_date: string; days_overdue: number; bill_count: number; }
interface ArrearsBucket { label: string; days_from: number; days_to: number; total_amount: number; bill_count: number; oldest_date: string | null; }
interface DunningRecord { id: string; member_id: string; bill_id: string; member_name: string; bill_number: string; reminder_date: string; reminder_type: string; status: string; }
interface BillingHead { id: string; name: string; default_amount: number; tax_rate: number; head_type: string; frequency: string; is_active: boolean; }

const TABS = ["Bills", "Payments", "Mandates", "Arrears Aging", "Defaulters", "Dunning", "Generate"];

export default function BillingPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState("Bills");
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [mandates, setMandates] = useState<any[]>([]);
  const [arrears, setArrears] = useState<{ buckets: ArrearsBucket[] } | null>(null);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [dunningHistory, setDunningHistory] = useState<DunningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showGenerateHeads, setShowGenerateHeads] = useState(false);
  const [showCreateWithHeads, setShowCreateWithHeads] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [billingHeads, setBillingHeads] = useState<BillingHead[]>([]);

  const [createForm, setCreateForm] = useState({ member_id: "", amount: "", tax_amount: "", bill_type: "MAINTENANCE", billing_period: "", due_date: "", description: "" });
  const [genForm, setGenForm] = useState({ amount: "", billing_period: "", due_date: "", bill_type: "MAINTENANCE" });
  const [genHeadsForm, setGenHeadsForm] = useState({ billing_period: "", due_date: "", include_arrears: false, selected_heads: [] as string[] });
  const [createWithHeadsForm, setCreateWithHeadsForm] = useState({ member_id: "", billing_period: "", due_date: "", selected_heads: [] as string[], custom_items: [] as { name: string; amount: string; tax_rate: string }[] });
  const [payForm, setPayForm] = useState({ bill_id: "", amount: "", payment_method: "UPI", payment_reference: "" });
  const [reminderBillId, setReminderBillId] = useState("");
  const [reminderType, setReminderType] = useState<'EMAIL' | 'SMS' | 'APP'>('APP');

  // Members for dropdown
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSearchHeads, setMemberSearchHeads] = useState("");

  const isAdmin = hasPermission('BILL_APPROVE');
  const canApprove = hasPermission('BILL_APPROVE');
  const canCreate = hasPermission('BILL_APPROVE');

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    memberAPI.getAll().then(r => setMembers(r.data.members || [])).catch(() => { });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const promises = [billingAPI.getAllBills(), billingAPI.getPayments(), billingAPI.getSummary()];
      if (isAdmin) {
        promises.push(mandateAPI.list());
        if (tab === "Arrears Aging") promises.push(Promise.resolve({ data: { buckets: [] }, status: 200, statusText: 'OK', headers: {}, config: {} } as any));
        if (tab === "Defaulters") promises.push(billingAPI.getDefaulters().catch(() => ({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} } as any)));
        if (tab === "Dunning") promises.push(billingAPI.getDunningHistory().catch(() => ({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} } as any)));
      }
      const [b, p, s, ...rest] = await Promise.all(promises);
      setBills(b.data.bills); setPayments(p.data.payments); setSummary(s.data.summary);
      if (tab === "Mandates") setMandates(rest[0]?.data?.mandates || []);
      if (tab === "Defaulters") setDefaulters(rest[0]?.data?.defaulters || rest[0]?.data || []);
      if (tab === "Dunning") setDunningHistory(rest[0]?.data?.records || rest[0]?.data || []);
      if (tab === "Arrears Aging") {
        const ar = await billingAPI.getArrearsAging().catch(() => ({ data: { buckets: [] } }));
        setArrears(ar.data);
      }
    } catch { toast.error(t("failedToLoadBillingData")); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try { await billingAPI.approveBill(id); toast.success(t("billApproved")); load(); } catch { toast.error(t("failedGeneric")); }
  };
  const handleReject = async (id: string) => {
    try { await billingAPI.rejectBill(id); toast.success(t("billRejected")); load(); } catch { toast.error(t("failedGeneric")); }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await billingAPI.createBill({ ...createForm, amount: parseFloat(createForm.amount), tax_amount: parseFloat(createForm.tax_amount) || 0 }); toast.success(t("billCreated")); setShowCreate(false); load(); } catch { toast.error(t("failedToCreate")); }
  };
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await billingAPI.generateMonthly({ ...genForm, amount: parseFloat(genForm.amount) }); toast.success(r.data.message); setShowGenerate(false); load(); } catch { toast.error(t("failedToGenerate")); }
  };
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await billingAPI.recordPayment({ ...payForm, amount: parseFloat(payForm.amount), bill_id: selectedBill?.id || payForm.bill_id }); toast.success(t("paymentRecorded")); setShowPayment(false); setSelectedBill(null); load(); } catch { toast.error(t("failedGeneric")); }
  };
  const handleSendReminder = async () => {
    if (!reminderBillId) return;
    try { await billingAPI.sendReminder({ bill_id: reminderBillId, type: reminderType }); toast.success("Reminder sent"); setReminderBillId(""); load(); } catch { toast.error("Failed to send reminder"); }
  };
  const createMandate = async (type: "UPI_AUTOPAY" | "NACH") => {
    try { await mandateAPI.create({ type, amount_limit: 15000 }); toast.success(`${type} created`); load(); } catch { toast.error(t("failedToCreateMandate")); }
  };
  const updateMandate = async (id: string, status: "ACTIVE" | "PAUSED" | "CANCELLED") => {
    try { await mandateAPI.updateStatus(id, status); load(); } catch { toast.error(t("failedToUpdateMandate")); }
  };

  const loadBillingHeads = async () => {
    try {
      const res = await billingAPI.getAllHeads();
      setBillingHeads(res.data.heads || []);
    } catch { console.error("Failed to load billing heads"); }
  };

  const handleGenerateWithHeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (genHeadsForm.selected_heads.length === 0) {
      toast.error("Please select at least one billing head");
      return;
    }
    try {
      const res = await billingAPI.generateBulkWithHeads({
        head_ids: genHeadsForm.selected_heads,
        billing_period: genHeadsForm.billing_period,
        due_date: genHeadsForm.due_date || null,
        include_arrears: genHeadsForm.include_arrears
      });
      toast.success(res.data.message);
      setShowGenerateHeads(false);
      setGenHeadsForm({ billing_period: "", due_date: "", include_arrears: false, selected_heads: [] });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to generate bills");
    }
  };

  const handleCreateWithHeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createWithHeadsForm.member_id) {
      toast.error("Please select a member");
      return;
    }
    if (createWithHeadsForm.selected_heads.length === 0 && createWithHeadsForm.custom_items.length === 0) {
      toast.error("Please select billing heads or add custom items");
      return;
    }
    try {
      await billingAPI.generateWithHeads({
        member_id: createWithHeadsForm.member_id,
        head_ids: createWithHeadsForm.selected_heads,
        custom_items: createWithHeadsForm.custom_items.map(i => ({
          name: i.name,
          amount: parseFloat(i.amount) || 0,
          tax_rate: parseFloat(i.tax_rate) || 0
        })),
        billing_period: createWithHeadsForm.billing_period,
        due_date: createWithHeadsForm.due_date || null
      });
      toast.success("Bill created with billing heads");
      setShowCreateWithHeads(false);
      setCreateWithHeadsForm({ member_id: "", billing_period: "", due_date: "", selected_heads: [], custom_items: [] });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create bill");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await billingAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'billing-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error("Failed to export Excel"); }
  };

  const handleExportPDF = async () => {
    try {
      const res = await billingAPI.exportPDF();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'billing-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error("Failed to export PDF"); }
  };

  const handleDownloadBillPDF = async (billId: string) => {
    try {
      const res = await billingAPI.generatePDF(billId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill-${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error("Failed to download PDF"); }
  };

  useEffect(() => {
    if (showGenerateHeads || showCreateWithHeads) {
      loadBillingHeads();
    }
  }, [showGenerateHeads, showCreateWithHeads]);

  const toggleHeadSelection = (headId: string, isHeadsForm: boolean) => {
    if (isHeadsForm) {
      setGenHeadsForm(prev => ({
        ...prev,
        selected_heads: prev.selected_heads.includes(headId)
          ? prev.selected_heads.filter(id => id !== headId)
          : [...prev.selected_heads, headId]
      }));
    } else {
      setCreateWithHeadsForm(prev => ({
        ...prev,
        selected_heads: prev.selected_heads.includes(headId)
          ? prev.selected_heads.filter(id => id !== headId)
          : [...prev.selected_heads, headId]
      }));
    }
  };

  const addCustomItem = () => {
    setCreateWithHeadsForm(prev => ({
      ...prev,
      custom_items: [...prev.custom_items, { name: "", amount: "0", tax_rate: "0" }]
    }));
  };

  const removeCustomItem = (index: number) => {
    setCreateWithHeadsForm(prev => ({
      ...prev,
      custom_items: prev.custom_items.filter((_, i) => i !== index)
    }));
  };

  const updateCustomItem = (index: number, field: string, value: string) => {
    setCreateWithHeadsForm(prev => ({
      ...prev,
      custom_items: prev.custom_items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const filtered = bills.filter(b => {
    const ms = `${b.bill_number} ${b.bill_type} ${b.billing_period}`.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || b.status === statusFilter;
    return ms && mf;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedBills = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const statuses = ["ALL", "PENDING", "PENDING_APPROVAL", "APPROVED", "PAID", "OVERDUE", "REJECTED"];

  const AGING_COLORS = ['bg-emerald-50 border-emerald-200', 'bg-blue-50 border-blue-200', 'bg-amber-50 border-amber-200', 'bg-orange-50 border-orange-200', 'bg-red-50 border-red-200'];

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("billingTitle")}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("billingSubtitle")}
            </p>
          </div>
        </div>

        {canCreate && tab === "Bills" && (
          <div className="flex gap-2 flex-wrap items-center">
            <Link 
              href="/dashboard/billing/heads" 
              className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" /> Billing Heads
            </Link>
            <button 
              onClick={() => setShowGenerateHeads(true)} 
              className="inline-flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              <FilePlus className="w-3.5 h-3.5" /> Auto-Heads Run
            </button>
            <button 
              onClick={() => setShowGenerate(true)} 
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5" /> {t("generateMonthly")}
            </button>
            <button 
              onClick={() => setShowCreate(true)} 
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> {t("createBill")}
            </button>
            <button 
              onClick={() => setShowCreateWithHeads(true)} 
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-[0.98]"
            >
              <FileText className="w-3.5 h-3.5" /> Itemized Bill
            </button>
          </div>
        )}

        {canCreate && tab === "Generate" && (
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel} 
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button 
              onClick={handleExportPDF} 
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-rose-500/20"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Bento Strip */}
      {summary && tab !== "Arrears Aging" && tab !== "Defaulters" && tab !== "Dunning" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { label: t("totalBilled"), value: formatCurrency(summary.total_billed), icon: Receipt, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/80 dark:bg-blue-950/40", border: "border-blue-200/60 dark:border-blue-900/40" },
            { label: t("collected"), value: formatCurrency(summary.total_collected), icon: IndianRupee, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/80 dark:bg-emerald-950/40", border: "border-emerald-200/60 dark:border-emerald-900/40" },
            { label: t("outstanding"), value: formatCurrency(summary.outstanding), icon: TrendingUp, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/80 dark:bg-rose-950/40", border: "border-rose-200/60 dark:border-rose-900/40" },
            { label: t("collectionRate"), value: `${summary.collection_rate}%`, icon: CheckCircle, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/80 dark:bg-indigo-950/40", border: "border-indigo-200/60 dark:border-indigo-900/40" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div 
                key={i} 
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">{c.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl ${c.bg} ${c.color} border ${c.border} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto border border-slate-200/60 dark:border-slate-800">
        {TABS.filter(t => isAdmin || !["Arrears Aging", "Defaulters", "Dunning", "Generate"].includes(t)).map(tabName => (
          <button 
            key={tabName} 
            onClick={() => setTab(tabName)} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === tabName 
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {tab === "Bills" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none" 
                placeholder={t("searchBills")} 
              />
            </div>
            <div className="flex gap-1.5 flex-wrap overflow-x-auto">
              {statuses.map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatusFilter(s)} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === s 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {s === "ALL" ? t("all") : s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                    {["Bill No.", "Type", "Period", "Amount", "Paid", "Due Date", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {loading ? [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>
                  )) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-400 text-xs">
                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                        {t("noBillsFound")}
                      </td>
                    </tr>
                  ) : paginatedBills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {bill.bill_number}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        {bill.bill_type}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                        {bill.billing_period || "—"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        {formatCurrency(bill.paid_amount || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                        {bill.due_date ? formatDate(bill.due_date) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${getStatusColor(bill.status)}`}>
                          {bill.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {canApprove && bill.status === "PENDING_APPROVAL" && (
                            <>
                              <button 
                                onClick={() => handleApprove(bill.id)} 
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition-colors" 
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleReject(bill.id)} 
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg transition-colors" 
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {["APPROVED", "PENDING", "OVERDUE"].includes(bill.status) && (
                            <button 
                              onClick={() => { setSelectedBill(bill); setPayForm(p => ({ ...p, amount: String(bill.total_amount - (bill.paid_amount || 0)), bill_id: bill.id })); setShowPayment(true); }} 
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 border border-indigo-200/50"
                            >
                              <IndianRupee className="w-3 h-3" /> {t("pay")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {tab === "Payments" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                  {["Date", "Amount", "Method", "Reference", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>)
                  : payments.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-400 text-xs">{t("noPaymentsYet")}</td></tr>
                    : payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.payment_reference || "—"}</td>
                        <td className="px-4 py-3.5"><span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${getStatusColor(p.status)}`}>{p.status}</span></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Mandates" && (
        <div className="space-y-4">
          <div className="flex gap-2.5">
            <button onClick={() => createMandate("UPI_AUTOPAY")} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all">Setup UPI Autopay</button>
            <button onClick={() => createMandate("NACH")} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all">Setup NACH e-Mandate</button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                  {["Type", "Amount Limit", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {mandates.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-400 text-xs">{t("noMandatesFound")}</td></tr>
                  : mandates.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-xs">{m.type}</td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{formatCurrency(m.amount_limit || 0)}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => updateMandate(m.id, "PAUSED")} className="px-2.5 py-1 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Pause</button>
                          <button onClick={() => updateMandate(m.id, "ACTIVE")} className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">Activate</button>
                          <button onClick={() => updateMandate(m.id, "CANCELLED")} className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Arrears Aging" && (
        <div className="space-y-4">
          {arrears && arrears.buckets && arrears.buckets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {arrears.buckets.map((b: ArrearsBucket, i: number) => (
                <div key={i} className="rounded-2xl p-4.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.label}</span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{formatCurrency(b.total_amount)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.bill_count} unpaid bills</p>
                  {b.oldest_date && <p className="text-[10px] text-slate-400 mt-1">Oldest: {formatDate(b.oldest_date)}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-xs font-medium">No arrears data recorded in system</p>
            </div>
          )}
        </div>
      )}

      {tab === "Defaulters" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                {["Member", "Flat", "Wing", "Outstanding (₹)", "Bills", "Days Overdue", "Oldest Bill"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>)
                : defaulters.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-xs"><Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />No defaulters on record</td></tr>
                  : defaulters.map((d: Defaulter, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-xs">{d.member_name || d.member_id}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-xs">{d.flat_number || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-xs">{d.wing || "—"}</td>
                      <td className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(d.total_outstanding)}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-xs">{d.bill_count}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${d.days_overdue > 90 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : d.days_overdue > 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {d.days_overdue}d overdue
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{d.oldest_bill_date ? formatDate(d.oldest_bill_date) : "—"}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Dunning" && (
        <div className="space-y-4">
          {/* Send Reminder Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Dispatch Payment Notice</p>
              <p className="text-xs text-slate-400">Send reminder message via In-App, Email, or SMS</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <input 
                type="text" 
                value={reminderBillId} 
                onChange={e => setReminderBillId(e.target.value)} 
                placeholder="Bill ID"
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <select 
                value={reminderType} 
                onChange={e => setReminderType(e.target.value as any)}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="APP">In-App</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
              <button 
                onClick={handleSendReminder} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                Send Notice
              </button>
            </div>
          </div>

          {/* Dunning History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                  {["Date", "Channel", "Bill #", "Member", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td></tr>)
                  : dunningHistory.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-400 text-xs"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />No dunning records dispatched</td></tr>
                    : dunningHistory.map((d: DunningRecord, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{d.reminder_date ? formatDate(d.reminder_date) : "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 px-2.5 py-1 rounded-lg font-bold">
                            {d.reminder_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{d.bill_number || d.bill_id?.slice(0, 8) || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-900 dark:text-white font-semibold text-xs">{d.member_name || d.member_id?.slice(0, 8) || "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${d.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : d.status === 'FAILED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Generate" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Generate with Heads Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Bulk Generate with Heads</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Generate bills using billing heads</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-6">Create automated invoices for all members using predefined society billing heads with amounts and tax rates.</p>
              </div>
              <button 
                onClick={() => setShowGenerateHeads(true)} 
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                Generate Bulk Bills
              </button>
            </div>

            {/* Create Individual with Heads Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Individual Bill with Heads</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Create bill for single member</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-6">Create a tailored invoice for a specific resident using predefined heads or custom itemized fees.</p>
              </div>
              <button 
                onClick={() => setShowCreateWithHeads(true)} 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                Create Individual Bill
              </button>
            </div>

            {/* Export Reports Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Export Audit Reports</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Download billing spreadsheets</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-6">Export certified society billing reports and receipts to Microsoft Excel or printable PDF format.</p>
              </div>
              <div className="flex gap-2.5">
                <button 
                  onClick={handleExportExcel} 
                  className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl font-bold text-xs transition-all"
                >
                  Excel (.xlsx)
                </button>
                <button 
                  onClick={handleExportPDF} 
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50 rounded-xl font-bold text-xs transition-all"
                >
                  PDF Document
                </button>
              </div>
            </div>

            {/* Billing Heads Link Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 border border-purple-200/50 dark:border-purple-800/50 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Configure Billing Heads</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage charge categories</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-6">Add, calibrate, or deactivate society billing heads for maintenance, parking, water, and sinking fund.</p>
              </div>
              <Link 
                href="/dashboard/billing/heads" 
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 active:scale-[0.98] transition-all"
              >
                Go to Billing Heads <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-7 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t("createBillTitle")}</h2>
                  <p className="text-xs text-slate-400">Generate a custom invoice for a resident</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreate(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Member Searchable Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Member *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={e => { setMemberSearch(e.target.value); if (!e.target.value) setCreateForm({ ...createForm, member_id: "" }); }}
                    placeholder="Search by name or flat number..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    autoComplete="off"
                  />
                  {memberSearch && !createForm.member_id && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                      {members
                        .filter(m => {
                          const q = memberSearch.toLowerCase();
                          return (
                            `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
                            (m.flat_number && m.flat_number.toLowerCase().includes(q)) ||
                            (m.wing && m.wing.toLowerCase().includes(q))
                          );
                        })
                        .slice(0, 10)
                        .map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setCreateForm({ ...createForm, member_id: m.id });
                              setMemberSearch(`${m.first_name} ${m.last_name} — ${m.wing || ''} ${m.flat_number || ''}`.trim());
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                          >
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{m.first_name} {m.last_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{m.wing} {m.flat_number}</span>
                          </button>
                        ))}
                      {members.filter(m => {
                        const q = memberSearch.toLowerCase();
                        return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || (m.flat_number && m.flat_number.toLowerCase().includes(q));
                      }).length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">No members found</div>
                      )}
                    </div>
                  )}
                </div>
                {createForm.member_id && (
                  <div className="mt-1.5 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 px-3 py-1.5 rounded-xl">
                    <span>✓ Resident selected</span>
                    <button type="button" onClick={() => { setCreateForm({ ...createForm, member_id: "" }); setMemberSearch(""); }} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 font-bold">Clear</button>
                  </div>
                )}
              </div>

              {[
                { label: "Amount (₹) *", key: "amount", type: "number", placeholder: "3500" },
                { label: "Tax Amount (₹)", key: "tax_amount", type: "number", placeholder: "0" },
                { label: "Billing Period", key: "billing_period", placeholder: "e.g., May 2026" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                  <input 
                    type={field.type || "text"} 
                    value={createForm[field.key as keyof typeof createForm]} 
                    onChange={e => setCreateForm({ ...createForm, [field.key]: e.target.value })} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                    placeholder={field.placeholder} 
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                <input 
                  type="date" 
                  value={createForm.due_date} 
                  onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea 
                  value={createForm.description} 
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })} 
                  rows={2} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                  placeholder="Additional notes for resident..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  {t("create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Monthly Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-7 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t("generateMonthly")}</h2>
                  <p className="text-xs text-slate-400">Apply recurring fee to all active members</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGenerate(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              {[
                { label: "Amount per Member (₹) *", key: "amount", type: "number", placeholder: "3500" },
                { label: "Billing Period", key: "billing_period", placeholder: "e.g., May 2026" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                  <input 
                    type={field.type || "text"} 
                    value={genForm[field.key as keyof typeof genForm]} 
                    onChange={e => setGenForm({ ...genForm, [field.key]: e.target.value })} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                    placeholder={field.placeholder} 
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                <input 
                  type="date" 
                  value={genForm.due_date} 
                  onChange={e => setGenForm({ ...genForm, due_date: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowGenerate(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  {t("generate")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-7 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t("recordPayment")}</h2>
                  <p className="text-xs text-slate-400">Acknowledge receipt of funds</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPayment(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t("amount")} (₹) *</label>
                <input 
                  type="number" 
                  value={payForm.amount} 
                  onChange={e => setPayForm({ ...payForm, amount: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t("paymentMethod")}</label>
                <select 
                  value={payForm.payment_method} 
                  onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                >
                  {["UPI", "NEFT", "RTGS", "IMPS", "CASH", "CHEQUE", "NACH"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t("paymentReference")}</label>
                <input 
                  type="text" 
                  value={payForm.payment_reference} 
                  onChange={e => setPayForm({ ...payForm, payment_reference: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono" 
                  placeholder="Transaction ID / UTR number" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPayment(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  {t("recordPayment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Bulk Bills with Heads Modal */}
      {showGenerateHeads && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 sm:p-7 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Bulk Generate with Heads</h2>
                  <p className="text-xs text-slate-400">Batch generate invoices across all residents</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGenerateHeads(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateWithHeads} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Billing Period *</label>
                <input
                  type="text"
                  value={genHeadsForm.billing_period}
                  onChange={(e) => setGenHeadsForm({ ...genHeadsForm, billing_period: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  placeholder="e.g., May 2026"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={genHeadsForm.due_date}
                  onChange={(e) => setGenHeadsForm({ ...genHeadsForm, due_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  id="include_arrears"
                  checked={genHeadsForm.include_arrears}
                  onChange={(e) => setGenHeadsForm({ ...genHeadsForm, include_arrears: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="include_arrears" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Include past unpaid arrears on this invoice</label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Select Billing Heads *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-2.5 bg-slate-50/30 dark:bg-slate-800/30">
                  {billingHeads.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-2 text-center py-4">No billing heads found. Please configure heads first.</p>
                  ) : (
                    billingHeads.map((head) => (
                      <label key={head.id} className="flex items-center gap-2.5 p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={genHeadsForm.selected_heads.includes(head.id)}
                          onChange={() => toggleHeadSelection(head.id, true)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{head.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">₹{head.default_amount} + {head.tax_rate}% tax</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              {genHeadsForm.selected_heads.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                    ✓ {genHeadsForm.selected_heads.length} billing head(s) active
                  </span>
                  <span className="text-[11px] text-indigo-500 dark:text-indigo-400">Applied to all units</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowGenerateHeads(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  Generate Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Individual Bill with Heads Modal */}
      {showCreateWithHeads && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 sm:p-7 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Create Bill with Heads</h2>
                  <p className="text-xs text-slate-400">Itemized invoice for single resident</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateWithHeads(false)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWithHeads} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Member *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearchHeads}
                    onChange={e => { setMemberSearchHeads(e.target.value); if (!e.target.value) setCreateWithHeadsForm({ ...createWithHeadsForm, member_id: "" }); }}
                    placeholder="Search by name or flat number..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    autoComplete="off"
                  />
                  {memberSearchHeads && !createWithHeadsForm.member_id && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                      {members
                        .filter(m => {
                          const q = memberSearchHeads.toLowerCase();
                          return (
                            `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
                            (m.flat_number && m.flat_number.toLowerCase().includes(q)) ||
                            (m.wing && m.wing.toLowerCase().includes(q))
                          );
                        })
                        .slice(0, 10)
                        .map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setCreateWithHeadsForm({ ...createWithHeadsForm, member_id: m.id });
                              setMemberSearchHeads(`${m.first_name} ${m.last_name} — ${m.wing || ''} ${m.flat_number || ''}`.trim());
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                          >
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{m.first_name} {m.last_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{m.wing} {m.flat_number}</span>
                          </button>
                        ))}
                      {members.filter(m => {
                        const q = memberSearchHeads.toLowerCase();
                        return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || (m.flat_number && m.flat_number.toLowerCase().includes(q));
                      }).length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">No members found</div>
                      )}
                    </div>
                  )}
                </div>
                {createWithHeadsForm.member_id && (
                  <div className="mt-1.5 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 px-3 py-1.5 rounded-xl">
                    <span>✓ Resident selected</span>
                    <button type="button" onClick={() => { setCreateWithHeadsForm({ ...createWithHeadsForm, member_id: "" }); setMemberSearchHeads(""); }} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 font-bold">Clear</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Billing Period *</label>
                <input
                  type="text"
                  value={createWithHeadsForm.billing_period}
                  onChange={(e) => setCreateWithHeadsForm({ ...createWithHeadsForm, billing_period: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  placeholder="e.g., May 2026"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={createWithHeadsForm.due_date}
                  onChange={(e) => setCreateWithHeadsForm({ ...createWithHeadsForm, due_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Select Billing Heads</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-2.5 bg-slate-50/30 dark:bg-slate-800/30">
                  {billingHeads.map((head) => (
                    <label key={head.id} className="flex items-center gap-2.5 p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={createWithHeadsForm.selected_heads.includes(head.id)}
                        onChange={() => toggleHeadSelection(head.id, false)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{head.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">₹{head.default_amount}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Custom Line Items</label>
                  <button type="button" onClick={addCustomItem} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">+ Add Custom Line Item</button>
                </div>
                {createWithHeadsForm.custom_items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateCustomItem(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="Item name (e.g. Club House)"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateCustomItem(idx, 'amount', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                        placeholder="Amount ₹"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        step="0.01"
                        value={item.tax_rate}
                        onChange={(e) => updateCustomItem(idx, 'tax_rate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                        placeholder="Tax %"
                      />
                    </div>
                    <button type="button" onClick={() => removeCustomItem(idx)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateWithHeads(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
