"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { accountingAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BookOpen, Plus, CheckCircle2, XCircle, FileText, X, TrendingUp, Scale, Landmark, CreditCard } from "lucide-react";

type Tab = 'vouchers' | 'accounts' | 'trial-balance' | 'income-statement' | 'balance-sheet' | 'bank-reconciliation';

interface IncomeRow { account_name: string; code: string; amount: number; }
interface ExpenseRow { account_name: string; code: string; amount: number; }
interface AssetRow { name: string; code: string; amount: number; }
interface LiabilityRow { name: string; code: string; amount: number; }
interface CapitalRow { name: string; code: string; amount: number; }

export default function AccountingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('trial-balance');
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [incomeStatement, setIncomeStatement] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [bankReconciliation, setBankReconciliation] = useState<any>(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);
  const [newVoucher, setNewVoucher] = useState({ voucher_type: "RECEIPT", voucher_date: new Date().toISOString().split('T')[0], narration: "", entries: [{ account_id: "", entry_type: "DEBIT", amount: "" }, { account_id: "", entry_type: "CREDIT", amount: "" }] });

  // Date filters
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [asOnDate, setAsOnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [brMonth, setBrMonth] = useState(() => new Date().getMonth() + 1);
  const [brYear, setBrYear] = useState(() => new Date().getFullYear());
  const [brAccount, setBrAccount] = useState("");
  const [brStatementBalance, setBrStatementBalance] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'vouchers':
          setVouchers((await accountingAPI.getVouchers({ from: fromDate, to: toDate })).data.vouchers || []);
          break;
        case 'accounts':
          setAccounts((await accountingAPI.getAccounts()).data.accounts || []);
          break;
        case 'trial-balance':
          setTrialBalance((await accountingAPI.getTrialBalance({ from: fromDate, to: toDate })).data || null);
          break;
        case 'income-statement':
          setIncomeStatement((await accountingAPI.getIncomeStatement({ start_date: fromDate, end_date: toDate })).data || null);
          break;
        case 'balance-sheet':
          setBalanceSheet((await accountingAPI.getBalanceSheet({ as_on_date: asOnDate })).data || null);
          break;
        case 'bank-reconciliation':
          setBankReconciliation((await accountingAPI.getBankReconciliation({ account_id: brAccount, month: brMonth, year: brYear })).data || null);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'accounts' && accounts.length === 0) {
      accountingAPI.getAccounts().then(res => setAccounts(res.data.accounts || []));
    }
  }, [activeTab]);

  const handleApproveVoucher = async (id: string) => {
    try { await accountingAPI.approveVoucher(id); fetchData(); } catch { alert("Failed to approve voucher."); }
  };
  const handleReverseVoucher = async (id: string) => {
    if (!confirm("Reverse this voucher?")) return;
    try { await accountingAPI.reverseVoucher(id); fetchData(); } catch { alert("Failed to reverse voucher."); }
  };
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountingAPI.createVoucher(newVoucher);
      setIsCreatingVoucher(false);
      setNewVoucher({ voucher_type: "RECEIPT", voucher_date: new Date().toISOString().split('T')[0], narration: "", entries: [{ account_id: "", entry_type: "DEBIT", amount: "" }, { account_id: "", entry_type: "CREDIT", amount: "" }] });
      fetchData();
    } catch (error: any) { alert(error.response?.data?.error || "Failed to create voucher"); }
  };
  const handleAddEntry = () => setNewVoucher({ ...newVoucher, entries: [...newVoucher.entries, { account_id: "", entry_type: "DEBIT", amount: "" }] });
  const updateEntry = (i: number, f: string, v: string) => { const e = [...newVoucher.entries]; e[i] = { ...e[i], [f]: v }; setNewVoucher({ ...newVoucher, entries: e }); };
  const removeEntry = (i: number) => setNewVoucher({ ...newVoucher, entries: newVoucher.entries.filter((_: any, idx: number) => idx !== i) });

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'trial-balance', label: 'Trial Balance', icon: Scale },
    { key: 'income-statement', label: 'I&E Statement', icon: TrendingUp },
    { key: 'balance-sheet', label: 'Balance Sheet', icon: Landmark },
    { key: 'bank-reconciliation', label: 'BRS', icon: CreditCard },
    { key: 'vouchers', label: 'Vouchers', icon: FileText },
    { key: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
  ];

  const totalDr = (rows: any[]) => rows.reduce((s: number, r: any) => s + parseFloat(r.total_debit || 0), 0);
  const totalCr = (rows: any[]) => rows.reduce((s: number, r: any) => s + parseFloat(r.total_credit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Accounting & General Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">Double-entry bookkeeping with Maker-Checker</p>
        </div>
        {activeTab === 'vouchers' && (
          <button onClick={() => setIsCreatingVoucher(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4" /> New Voucher
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tb => {
          const Icon = tb.icon;
          return (
            <button key={tb.key} onClick={() => setActiveTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tb.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {tb.label}
            </button>
          );
        })}
      </div>

      {/* Date Filters for reports */}
      {(activeTab === 'trial-balance' || activeTab === 'income-statement' || activeTab === 'vouchers') && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={fetchData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Apply
          </button>
        </div>
      )}

      {activeTab === 'balance-sheet' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">As on Date</label>
            <input type="date" value={asOnDate} onChange={e => setAsOnDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={fetchData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Generate
          </button>
        </div>
      )}

      {activeTab === 'bank-reconciliation' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Bank Account</label>
            <select value={brAccount} onChange={e => setBrAccount(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="">Select Account</option>
              {accounts.filter(a => a.sub_category === 'Bank').map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Month</label>
            <input type="number" value={brMonth} onChange={e => setBrMonth(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-20 focus:ring-2 focus:ring-indigo-500" min="1" max="12" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Year</label>
            <input type="number" value={brYear} onChange={e => setBrYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Bank Stmt Balance</label>
            <input type="number" value={brStatementBalance} onChange={e => setBrStatementBalance(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-32 focus:ring-2 focus:ring-indigo-500" placeholder="₹" />
          </div>
          <button onClick={fetchData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Reconcile
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-48 skeleton rounded-2xl" />
      ) : (
        <>
          {/* TRIAL BALANCE */}
          {activeTab === 'trial-balance' && trialBalance && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Trial Balance — {fromDate} to {toDate}</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${trialBalance.balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {trialBalance.balanced ? 'BALANCED' : 'UNBALANCED'}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-white border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Account</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Debit (₹)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Credit (₹)</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {trialBalance.accounts?.map((a: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600 font-mono">{a.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                      <td className="px-4 py-3 text-right">{parseFloat(a.total_debit) > 0 ? formatCurrency(a.total_debit) : '—'}</td>
                      <td className="px-4 py-3 text-right">{parseFloat(a.total_credit) > 0 ? formatCurrency(a.total_credit) : '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan={2} className="px-4 py-3 text-right text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right text-indigo-700 font-bold">{formatCurrency(trialBalance.total_debit)}</td>
                    <td className="px-4 py-3 text-right text-indigo-700 font-bold">{formatCurrency(trialBalance.total_credit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* INCOME & EXPENDITURE */}
          {activeTab === 'income-statement' && incomeStatement && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-700">Total Income</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{formatCurrency(incomeStatement.total_income)}</p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200">
                <p className="text-sm font-semibold text-rose-700">Total Expenses</p>
                <p className="text-2xl font-bold text-rose-800 mt-1">{formatCurrency(incomeStatement.total_expenses)}</p>
              </div>
              <div className={`rounded-2xl p-5 border ${(incomeStatement.total_income - incomeStatement.total_expenses) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm font-semibold text-gray-700">Net {incomeStatement.net_result >= 0 ? 'Surplus' : 'Deficit'}</p>
                <p className={`text-2xl font-bold mt-1 ${incomeStatement.net_result >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(Math.abs(incomeStatement.net_result))}</p>
              </div>
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div>
                    <div className="p-4 border-b border-gray-100 bg-emerald-50"><h3 className="font-semibold text-emerald-800">Income</h3></div>
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Account</th><th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Amount</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {incomeStatement.income?.map((r: IncomeRow, i: number) => (
                          <tr key={i}><td className="px-4 py-2.5 text-gray-700">{r.account_name}</td><td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{formatCurrency(r.amount)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="p-4 border-b border-gray-100 bg-rose-50"><h3 className="font-semibold text-rose-800">Expenses</h3></div>
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Account</th><th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Amount</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {incomeStatement.expenses?.map((r: ExpenseRow, i: number) => (
                          <tr key={i}><td className="px-4 py-2.5 text-gray-700">{r.account_name}</td><td className="px-4 py-2.5 text-right font-semibold text-rose-700">{formatCurrency(r.amount)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BALANCE SHEET */}
          {activeTab === 'balance-sheet' && balanceSheet && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-5 border ${balanceSheet.balanced ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {balanceSheet.balanced ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Balance Sheet — {balanceSheet.as_on_date}</p>
                    <p className={`text-xl font-bold mt-0.5 ${balanceSheet.balanced ? 'text-emerald-700' : 'text-red-700'}`}>
                      {balanceSheet.balanced ? 'BALANCED ✓' : 'UNBALANCED ✗'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Total Assets', items: balanceSheet.assets, color: 'blue' },
                  { label: 'Total Liabilities', items: balanceSheet.liabilities, color: 'amber' },
                  { label: 'Capital & Reserves', items: balanceSheet.capital, color: 'purple' },
                ].map((section, si) => (
                  <div key={si} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`p-4 border-b border-gray-100 bg-${section.color}-50`}>
                      <h3 className={`font-semibold text-${section.color}-800`}>{section.label}</h3>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {section.items?.map((r: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 text-gray-700 text-xs">{r.name}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(r.amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-4 py-2.5">Total</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(balanceSheet.totals?.[section.label.toLowerCase().replace(/ /g, '_')] || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANK RECONCILIATION */}
          {activeTab === 'bank-reconciliation' && bankReconciliation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Book Balance', value: bankReconciliation.bank_balance_book, color: 'blue' },
                  { label: 'Stmt Balance', value: bankReconciliation.bank_statement_balance, color: 'gray' },
                  { label: 'Adjusted Balance', value: bankReconciliation.adjusted_bank_balance, color: bankReconciliation.balanced ? 'emerald' : 'amber' },
                  { label: 'Status', value: bankReconciliation.balanced ? 'Reconciled' : 'Gap Found', color: bankReconciliation.balanced ? 'emerald' : 'red' },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400">{c.label}</p>
                    <p className={`text-lg font-bold mt-1 ${c.color === 'emerald' ? 'text-emerald-700' : c.color === 'red' ? 'text-red-700' : c.color === 'blue' ? 'text-blue-700' : 'text-gray-700'}`}>
                      {typeof c.value === 'number' ? formatCurrency(c.value) : c.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-amber-50"><h3 className="font-semibold text-amber-800">Unpresented Cheques</h3></div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs">Date</th><th className="text-right px-4 py-2 text-xs">Amount</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {bankReconciliation.unpresented_cheques?.length > 0 ? bankReconciliation.unpresented_cheques.map((c: any, i: number) => (
                        <tr key={i}><td className="px-4 py-2.5 text-gray-600">{c.date || '—'}</td><td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(c.amount)}</td></tr>
                      )) : <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400 text-xs">None</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-blue-50"><h3 className="font-semibold text-blue-800">Uncredited Deposits</h3></div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs">Date</th><th className="text-right px-4 py-2 text-xs">Amount</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {bankReconciliation.uncredited_deposits?.length > 0 ? bankReconciliation.uncredited_deposits.map((d: any, i: number) => (
                        <tr key={i}><td className="px-4 py-2.5 text-gray-600">{d.date || '—'}</td><td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(d.amount)}</td></tr>
                      )) : <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400 text-xs">None</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VOUCHERS */}
          {activeTab === 'vouchers' && !isCreatingVoucher && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  {["Voucher #", "Type & Date", "Amount", "Narration", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {vouchers.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">No vouchers found</td></tr>
                    : vouchers.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.voucher_number}</td>
                        <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900">{v.voucher_type}</div><div className="text-xs text-gray-500">{new Date(v.voucher_date).toLocaleDateString()}</div></td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(v.amount)}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={v.narration}>{v.narration || '—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : v.status === 'REVERSED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{v.status}</span></td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {v.status === 'DRAFT' && v.maker_id !== user?.id && <button onClick={() => handleApproveVoucher(v.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Approve</button>}
                          {v.status === 'APPROVED' && <button onClick={() => handleReverseVoucher(v.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Reverse</button>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'vouchers' && isCreatingVoucher && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Create New Voucher</h2>
                <button onClick={() => setIsCreatingVoucher(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateVoucher} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
                    <select value={newVoucher.voucher_type} onChange={e => setNewVoucher({ ...newVoucher, voucher_type: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500">
                      <option value="RECEIPT">Receipt</option><option value="PAYMENT">Payment</option>
                      <option value="JOURNAL">Journal</option><option value="CONTRA">Contra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={newVoucher.voucher_date} onChange={e => setNewVoucher({ ...newVoucher, voucher_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                  <input type="text" value={newVoucher.narration} onChange={e => setNewVoucher({ ...newVoucher, narration: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" placeholder="E.g., Payment received for maintenance..." />
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b"><tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Account</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-28">Type</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 w-36">Amount (₹)</th>
                      <th className="w-12"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {newVoucher.entries.map((entry, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select value={entry.account_id} onChange={e => updateEntry(idx, 'account_id', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm" required>
                              <option value="">Select Account...</option>
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                          </td>
                          <td className="p-2">
                            <select value={entry.entry_type} onChange={e => updateEntry(idx, 'entry_type', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm">
                              <option value="DEBIT">Debit (Dr)</option><option value="CREDIT">Credit (Cr)</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="number" value={entry.amount} onChange={e => updateEntry(idx, 'amount', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-right" min="0" step="0.01" placeholder="0.00" required />
                          </td>
                          <td className="p-2 text-center">
                            {newVoucher.entries.length > 2 && <button type="button" onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700"><XCircle className="w-4 h-4" /></button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 p-3 border-t border-gray-200">
                    <button type="button" onClick={handleAddEntry} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Add Line
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-sm text-gray-600">
                    Total Debit: <strong className="text-gray-900">₹{newVoucher.entries.filter(e => e.entry_type === 'DEBIT').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2)}</strong>
                    <span className="mx-3">|</span>
                    Total Credit: <strong className="text-gray-900">₹{newVoucher.entries.filter(e => e.entry_type === 'CREDIT').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsCreatingVoucher(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Submit Voucher</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* CHART OF ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div><p className="text-xs font-semibold text-indigo-600 mb-1">{acc.code}</p><h3 className="font-bold text-gray-900 truncate">{acc.name}</h3></div>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${acc.category === 'ASSET' ? 'bg-blue-100 text-blue-700' : acc.category === 'LIABILITY' ? 'bg-amber-100 text-amber-700' : acc.category === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : acc.category === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{acc.category}</span>
                  </div>
                  <p className="text-sm text-gray-500">{acc.sub_category || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
