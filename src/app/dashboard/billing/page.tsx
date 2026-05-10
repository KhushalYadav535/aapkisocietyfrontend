"use client";
import { useState, useEffect } from "react";
import { billingAPI, mandateAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Receipt, Plus, Search, CheckCircle, XCircle, IndianRupee, Zap, X, TrendingUp } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

interface Bill { id: string; bill_number: string; member_id: string; amount: number; total_amount: number; paid_amount: number; status: string; bill_type: string; billing_period: string; due_date: string; created_at: string; }
interface Payment { id: string; amount: number; payment_method: string; payment_reference?: string; status: string; payment_date: string; member_id: string; }

interface Mandate { id: string; type: "UPI_AUTOPAY" | "NACH"; status: "ACTIVE" | "PAUSED" | "CANCELLED" | "FAILED"; amount_limit: number; }
const TABS = ["Bills", "Payments", "Mandates"];

export default function BillingPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState("Bills");
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [mandates, setMandates] = useState<Mandate[]>([]);
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

  const isAdmin = ["ADMIN", "TREASURER", "MAKER", "CHECKER", "PLATFORM_ADMIN"].includes(user?.role || "");
  const canApprove = ["ADMIN", "TREASURER", "CHECKER"].includes(user?.role || "");
  const canCreate = ["ADMIN", "TREASURER", "MAKER"].includes(user?.role || "");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [b, p, s, m] = await Promise.all([billingAPI.getAllBills(), billingAPI.getPayments(), billingAPI.getSummary(), mandateAPI.list()]);
      setBills(b.data.bills); setPayments(p.data.payments); setSummary(s.data.summary); setMandates(m.data.mandates || []);
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

  const createMandate = async (type: "UPI_AUTOPAY" | "NACH") => {
    try {
      await mandateAPI.create({ type, amount_limit: 15000 });
      toast.success(`${type} ${t("mandateCreated")}`);
      load();
    } catch {
      toast.error(t("failedToCreateMandate"));
    }
  };

  const updateMandate = async (id: string, status: "ACTIVE" | "PAUSED" | "CANCELLED") => {
    try {
      await mandateAPI.updateStatus(id, status);
      load();
    } catch {
      toast.error(t("failedToUpdateMandate"));
    }
  };

  const filtered = bills.filter(b => {
    const ms = `${b.bill_number} ${b.bill_type} ${b.billing_period}`.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || b.status === statusFilter;
    return ms && mf;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedBills = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const statuses = ["ALL", "PENDING", "PENDING_APPROVAL", "APPROVED", "PAID", "OVERDUE", "REJECTED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("billingTitle")}</h1>
          <p className="text-gray-400 text-sm mt-1">{t("billingSubtitle")}</p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5">
              <Zap className="w-4 h-4" /> {t("generateMonthly")}
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> {t("createBill")}
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tabName => (
          <button key={tabName} onClick={() => setTab(tabName)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === tabName ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tabName === "Bills" ? t("bills") : tabName === "Payments" ? t("payments") : t("mandates")}
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
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
            <button onClick={() => createMandate("UPI_AUTOPAY")} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">{t("setupUpiAutopay")}</button>
            <button onClick={() => createMandate("NACH")} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold">{t("setupNach")}</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {["Type", "Amount Limit", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {mandates.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">{t("noMandatesFound")}</td></tr>
                ) : mandates.map((m) => (
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
                { label: "Due Date", key: "due_date", type: "date" },
                { label: "Description", key: "description", placeholder: "Monthly maintenance" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={(createForm as any)[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bill Type</label>
                <select value={createForm.bill_type} onChange={e => setCreateForm(p => ({ ...p, bill_type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                  {["MAINTENANCE","WATER","ELECTRICITY","PARKING","CLUB_HOUSE","OTHER"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t("cancel")}</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">{t("createBill")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Monthly Modal */}
      {showGenerate && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{t("generateMonthlyBillsTitle")}</h2>
              <button onClick={() => setShowGenerate(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-4">This will generate bills for ALL active residents in the society.</p>
            <form onSubmit={handleGenerate} className="space-y-3">
              {[
                { label: "Amount per Flat (₹) *", key: "amount", type: "number", placeholder: "3500" },
                { label: "Billing Period *", key: "billing_period", placeholder: "May 2026" },
                { label: "Due Date *", key: "due_date", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={(genForm as any)[f.key]} onChange={e => setGenForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGenerate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t("cancel")}</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200">{t("generate")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{t("recordPaymentTitle")}</h2>
              <button onClick={() => { setShowPayment(false); setSelectedBill(null); }} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {selectedBill && <div className="bg-indigo-50 rounded-xl p-3 mb-4 text-sm"><p className="font-semibold text-indigo-800">{selectedBill.bill_number}</p><p className="text-indigo-600">Outstanding: {formatCurrency(selectedBill.total_amount - (selectedBill.paid_amount || 0))}</p></div>}
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹) *</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("method")}</label>
                <select value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                  {["UPI","NEFT","RTGS","NACH","CASH","CHEQUE","ONLINE"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t("referenceNo")}</label>
                <input value={payForm.payment_reference} onChange={e => setPayForm(p => ({ ...p, payment_reference: e.target.value }))} placeholder="UTR / Cheque No." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPayment(false); setSelectedBill(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t("cancel")}</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">{t("recordPayment")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
