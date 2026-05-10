"use client";

import { useState, useEffect } from "react";
import { billingAPI, mandateAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  Receipt, Plus, Search, CheckCircle, XCircle, IndianRupee, Zap, X,
  TrendingUp, AlertTriangle, Clock, Send, Users, FileText
} from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

interface Bill { id: string; bill_number: string; member_id: string; amount: number; total_amount: number; paid_amount: number; status: string; bill_type: string; billing_period: string; due_date: string; created_at: string; }
interface Payment { id: string; amount: number; payment_method: string; payment_reference?: string; status: string; payment_date: string; member_id: string; }
interface Defaulter { member_id: string; member_name: string; flat_number: string; wing: string; total_outstanding: number; oldest_bill_date: string; days_overdue: number; bill_count: number; }
interface ArrearsBucket { label: string; days_from: number; days_to: number; total_amount: number; bill_count: number; oldest_date: string | null; }
interface DunningRecord { id: string; member_id: string; bill_id: string; member_name: string; bill_number: string; reminder_date: string; reminder_type: string; status: string; }

const TABS = ["Bills", "Payments", "Mandates", "Arrears Aging", "Defaulters", "Dunning"];

export default function BillingPage() {
  const { user } = useAuth();
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
  const [showPayment, setShowPayment] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [createForm, setCreateForm] = useState({ member_id: "", amount: "", tax_amount: "", bill_type: "MAINTENANCE", billing_period: "", due_date: "", description: "" });
  const [genForm, setGenForm] = useState({ amount: "", billing_period: "", due_date: "", bill_type: "MAINTENANCE" });
  const [payForm, setPayForm] = useState({ bill_id: "", amount: "", payment_method: "UPI", payment_reference: "" });
  const [reminderBillId, setReminderBillId] = useState("");
  const [reminderType, setReminderType] = useState<'EMAIL' | 'SMS' | 'APP'>('APP');

  const isAdmin = ["ADMIN", "TREASURER", "MAKER", "CHECKER", "PLATFORM_ADMIN"].includes(user?.role || "");
  const canApprove = ["ADMIN", "TREASURER", "CHECKER"].includes(user?.role || "");
  const canCreate = ["ADMIN", "TREASURER", "MAKER"].includes(user?.role || "");

  useEffect(() => { load(); }, [tab]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("billingTitle")}</h1>
          <p className="text-gray-400 text-sm mt-1">{t("billingSubtitle")}</p>
        </div>
        {canCreate && tab === "Bills" && (
          <div className="flex gap-2">
            <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-200">
              <Zap className="w-4 h-4" /> {t("generateMonthly")}
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4" /> {t("createBill")}
            </button>
          </div>
        )}
      </div>

      {summary && tab !== "Arrears Aging" && tab !== "Defaulters" && tab !== "Dunning" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { label: t("totalBilled"), value: formatCurrency(summary.total_billed), color: "from-blue-500 to-blue-600", icon: Receipt },
            { label: t("collected"), value: formatCurrency(summary.total_collected), color: "from-emerald-500 to-green-600", icon: IndianRupee },
            { label: t("outstanding"), value: formatCurrency(summary.outstanding), color: "from-rose-500 to-red-600", icon: TrendingUp },
            { label: t("collectionRate"), value: `${summary.collection_rate}%`, color: "from-violet-500 to-purple-600", icon: CheckCircle },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm card-hover animate-slide-up">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-gray-400">{c.label}</p><p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p></div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}><Icon className="w-5 h-5 text-white" /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tabName => (
          <button key={tabName} onClick={() => setTab(tabName)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === tabName ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tabName}
          </button>
        ))}
      </div>

      {tab === "Bills" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t("searchBills")} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statuses.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>{s === "ALL" ? t("all") : s.replace(/_/g, " ")}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  {["Bill No.", "Type", "Period", "Amount", "Paid", "Due Date", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {loading ? [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td></tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />{t("noBillsFound")}</td></tr>
                  ) : paginatedBills.map(bill => (
                    <tr key={bill.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{bill.bill_number}</td>
                      <td className="px-4 py-3 text-gray-700">{bill.bill_type}</td>
                      <td className="px-4 py-3 text-gray-500">{bill.billing_period || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(bill.total_amount)}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{formatCurrency(bill.paid_amount || 0)}</td>
                      <td className="px-4 py-3 text-gray-500">{bill.due_date ? formatDate(bill.due_date) : "—"}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${getStatusColor(bill.status)}`}>{bill.status.replace(/_/g, " ")}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {canApprove && bill.status === "PENDING_APPROVAL" && (
                            <>
                              <button onClick={() => handleApprove(bill.id)} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReject(bill.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          {["APPROVED", "PENDING", "OVERDUE"].includes(bill.status) && (
                            <button onClick={() => { setSelectedBill(bill); setPayForm(p => ({ ...p, amount: String(bill.total_amount - (bill.paid_amount || 0)), bill_id: bill.id })); setShowPayment(true); }} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors text-xs font-semibold px-2.5"><IndianRupee className="w-3 h-3 inline" /> {t("pay")}</button>
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
        </>
      )}

      {tab === "Payments" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {["Date", "Amount", "Method", "Reference", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td></tr>)
                  : payments.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">{t("noPaymentsYet")}</td></tr>
                  : payments.map(p => (
                    <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">{p.payment_method}</span></td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.payment_reference || "—"}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${getStatusColor(p.status)}`}>{p.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Mandates" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => createMandate("UPI_AUTOPAY")} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Setup UPI Autopay</button>
            <button onClick={() => createMandate("NACH")} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold">Setup NACH</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {["Type", "Amount Limit", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {mandates.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-gray-400">{t("noMandatesFound")}</td></tr>
                  : mandates.map((m) => (
                    <tr key={m.id} className="border-t border-gray-50">
                      <td className="px-4 py-3">{m.type}</td>
                      <td className="px-4 py-3">{formatCurrency(m.amount_limit || 0)}</td>
                      <td className="px-4 py-3">{m.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => updateMandate(m.id, "PAUSED")} className="px-2 py-1 text-xs border border-gray-200 rounded-lg">Pause</button>
                          <button onClick={() => updateMandate(m.id, "ACTIVE")} className="px-2 py-1 text-xs border border-gray-200 rounded-lg">Activate</button>
                          <button onClick={() => updateMandate(m.id, "CANCELLED")} className="px-2 py-1 text-xs border border-gray-200 rounded-lg">Cancel</button>
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
          {arrears?.buckets?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {arrears.buckets.map((b: ArrearsBucket, i: number) => (
                <div key={i} className={`rounded-2xl p-4 border ${AGING_COLORS[i] || 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 opacity-60" />
                    <span className="text-sm font-semibold text-gray-700">{b.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(b.total_amount)}</p>
                  <p className="text-xs text-gray-500 mt-1">{b.bill_count} bills</p>
                  {b.oldest_date && <p className="text-xs text-gray-400 mt-0.5">Oldest: {formatDate(b.oldest_date)}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No arrears data available</p>
            </div>
          )}
        </div>
      )}

      {tab === "Defaulters" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Member", "Flat", "Wing", "Outstanding (₹)", "Bills", "Days Overdue", "Oldest Bill"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td></tr>)
                : defaulters.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />No defaulters found</td></tr>
                : defaulters.map((d: Defaulter, i: number) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.member_name || d.member_id}</td>
                    <td className="px-4 py-3 text-gray-600">{d.flat_number || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{d.wing || "—"}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(d.total_outstanding)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{d.bill_count}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${d.days_overdue > 90 ? 'bg-red-100 text-red-700' : d.days_overdue > 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.days_overdue}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.oldest_bill_date ? formatDate(d.oldest_bill_date) : "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Dunning" && (
        <div className="space-y-4">
          {/* Send Reminder */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 max-w-xl">
            <Send className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Send Payment Reminder</p>
              <p className="text-xs text-gray-400">Send dunning reminder to any member</p>
            </div>
            <input type="text" value={reminderBillId} onChange={e => setReminderBillId(e.target.value)} placeholder="Bill ID"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-indigo-500" />
            <select value={reminderType} onChange={e => setReminderType(e.target.value as any)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="APP">In-App</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
            <button onClick={handleSendReminder} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Send
            </button>
          </div>
          {/* Dunning History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {["Date", "Type", "Bill", "Member", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td></tr>)
                  : dunningHistory.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />No dunning history</td></tr>
                  : dunningHistory.map((d: DunningRecord, i: number) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">{d.reminder_date ? formatDate(d.reminder_date) : "—"}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">{d.reminder_type}</span></td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.bill_number || d.bill_id?.slice(0, 8) || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.member_name || d.member_id?.slice(0, 8) || "—"}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${d.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' : d.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>{d.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showCreate && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{t("createBillTitle")}</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: "Member ID", key: "member_id", placeholder: "Member UUID" },
                { label: "Amount (₹) *", key: "amount", type: "number", placeholder: "3500" },
                { label: "Tax Amount (₹)", key: "tax_amount", type: "number", placeholder: "0" },
                { label: "Billing Period", key: "billing_period", placeholder: "May 2026" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
                  <input type={field.type || "text"} value={createForm[field.key as keyof typeof createForm]} onChange={e => setCreateForm({ ...createForm, [field.key]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={field.placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                <input type="date" value={createForm.due_date} onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">{t("cancel")}</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">{t("create")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Monthly Modal */}
      {showGenerate && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{t("generateMonthly")}</h2>
              <button onClick={() => setShowGenerate(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-3">
              {[
                { label: "Amount per Member (₹) *", key: "amount", type: "number" },
                { label: "Billing Period", key: "billing_period", placeholder: "May 2026" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
                  <input type={field.type || "text"} value={genForm[field.key as keyof typeof genForm]} onChange={e => setGenForm({ ...genForm, [field.key]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={field.placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                <input type="date" value={genForm.due_date} onChange={e => setGenForm({ ...genForm, due_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGenerate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">{t("cancel")}</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">{t("generate")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{t("recordPayment")}</h2>
              <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("amount")} (₹) *</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("paymentMethod")}</label>
                <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {["UPI", "NEFT", "RTGS", "IMPS", "CASH", "CHEQUE", "NACH"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("paymentReference")}</label>
                <input type="text" value={payForm.payment_reference} onChange={e => setPayForm({ ...payForm, payment_reference: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Transaction ID / Reference" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayment(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">{t("cancel")}</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">{t("recordPayment")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
