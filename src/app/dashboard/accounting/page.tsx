"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { accountingAPI } from "@/lib/api";
import { BookOpen, Plus, CheckCircle2, XCircle, FileText, IndianRupee, ArrowRightLeft, CreditCard, Building2, User } from "lucide-react";

export default function AccountingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"vouchers" | "accounts" | "trial-balance">("vouchers");
  const [loading, setLoading] = useState(true);
  
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<{ accounts: any[], total_debit: number, total_credit: number, balanced: boolean } | null>(null);

  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    voucher_type: "RECEIPT",
    voucher_date: new Date().toISOString().split('T')[0],
    narration: "",
    entries: [
      { account_id: "", entry_type: "DEBIT", amount: "" },
      { account_id: "", entry_type: "CREDIT", amount: "" }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "vouchers") {
        const res = await accountingAPI.getVouchers();
        setVouchers(res.data.vouchers || []);
      } else if (activeTab === "accounts") {
        const res = await accountingAPI.getAccounts();
        setAccounts(res.data.accounts || []);
      } else if (activeTab === "trial-balance") {
        const res = await accountingAPI.getTrialBalance();
        setTrialBalance(res.data || null);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Fetch accounts early for voucher creation
    if (activeTab === 'vouchers' && accounts.length === 0) {
      accountingAPI.getAccounts().then(res => setAccounts(res.data.accounts || []));
    }
  }, [activeTab]);

  const handleApproveVoucher = async (id: string) => {
    try {
      await accountingAPI.approveVoucher(id);
      fetchData();
    } catch (error) {
      alert("Failed to approve voucher or Maker-Checker violation.");
    }
  };

  const handleReverseVoucher = async (id: string) => {
    if (!confirm("Are you sure you want to reverse this voucher?")) return;
    try {
      await accountingAPI.reverseVoucher(id);
      fetchData();
    } catch (error) {
      alert("Failed to reverse voucher.");
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountingAPI.createVoucher(newVoucher);
      setIsCreatingVoucher(false);
      setNewVoucher({
        voucher_type: "RECEIPT",
        voucher_date: new Date().toISOString().split('T')[0],
        narration: "",
        entries: [
          { account_id: "", entry_type: "DEBIT", amount: "" },
          { account_id: "", entry_type: "CREDIT", amount: "" }
        ]
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create voucher");
    }
  };

  const handleAddEntry = () => {
    setNewVoucher({
      ...newVoucher,
      entries: [...newVoucher.entries, { account_id: "", entry_type: "DEBIT", amount: "" }]
    });
  };

  const updateEntry = (index: number, field: string, value: string) => {
    const updated = [...newVoucher.entries];
    updated[index] = { ...updated[index], [field]: value };
    setNewVoucher({ ...newVoucher, entries: updated });
  };

  const removeEntry = (index: number) => {
    const updated = newVoucher.entries.filter((_, i) => i !== index);
    setNewVoucher({ ...newVoucher, entries: updated });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Accounting & General Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage vouchers, chart of accounts, and trial balance</p>
        </div>
        
        {activeTab === "vouchers" && (
          <button
            onClick={() => setIsCreatingVoucher(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Voucher
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "vouchers" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Vouchers
          {activeTab === "vouchers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "accounts" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Chart of Accounts
          {activeTab === "accounts" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("trial-balance")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "trial-balance" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Trial Balance
          {activeTab === "trial-balance" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Vouchers Tab */}
          {activeTab === "vouchers" && !isCreatingVoucher && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Voucher #</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Type & Date</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Narration</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vouchers.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">No vouchers found</td></tr>
                    ) : vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-900">{v.voucher_number}</td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">{v.voucher_type}</div>
                          <div className="text-xs text-gray-500">{new Date(v.voucher_date).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4 text-sm font-semibold text-gray-900">₹{parseFloat(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={v.narration}>{v.narration || '-'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            v.status === 'REVERSED' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {v.status === 'DRAFT' && v.maker_id !== user?.id && (
                            <button onClick={() => handleApproveVoucher(v.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Approve</button>
                          )}
                          {v.status === 'APPROVED' && (
                            <button onClick={() => handleReverseVoucher(v.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Reverse</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create Voucher Form */}
          {activeTab === "vouchers" && isCreatingVoucher && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Create New Voucher</h2>
                <button onClick={() => setIsCreatingVoucher(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateVoucher} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
                    <select
                      value={newVoucher.voucher_type}
                      onChange={(e) => setNewVoucher({ ...newVoucher, voucher_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="RECEIPT">Receipt</option>
                      <option value="PAYMENT">Payment</option>
                      <option value="JOURNAL">Journal</option>
                      <option value="CONTRA">Contra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newVoucher.voucher_date}
                      onChange={(e) => setNewVoucher({ ...newVoucher, voucher_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                    <input
                      type="text"
                      placeholder="E.g., Payment received for maintenance..."
                      value={newVoucher.narration}
                      onChange={(e) => setNewVoucher({ ...newVoucher, narration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-gray-500">Account</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 w-32">Type</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 w-48">Amount (₹)</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {newVoucher.entries.map((entry, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              required
                              value={entry.account_id}
                              onChange={(e) => updateEntry(idx, 'account_id', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">Select Account...</option>
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              required
                              value={entry.entry_type}
                              onChange={(e) => updateEntry(idx, 'entry_type', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="DEBIT">Debit (Dr)</option>
                              <option value="CREDIT">Credit (Cr)</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required min="0" step="0.01"
                              value={entry.amount}
                              onChange={(e) => updateEntry(idx, 'amount', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {newVoucher.entries.length > 2 && (
                              <button type="button" onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700">
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}
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
                    <span className="mx-4">|</span>
                    Total Credit: <strong className="text-gray-900">₹{newVoucher.entries.filter(e => e.entry_type === 'CREDIT').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsCreatingVoucher(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">Submit Voucher</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === "accounts" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-1">{acc.code}</p>
                      <h3 className="font-bold text-gray-900 truncate">{acc.name}</h3>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md">
                      {acc.category}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Sub-category: {acc.sub_category || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trial Balance Tab */}
          {activeTab === "trial-balance" && trialBalance && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Trial Balance</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${trialBalance.balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {trialBalance.balanced ? 'BALANCED' : 'UNBALANCED'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-200">
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Account Name</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Debit (₹)</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trialBalance.accounts.map((acc, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm text-gray-600">{acc.code}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">{acc.name}</td>
                        <td className="p-4 text-sm text-right text-gray-900">{parseFloat(acc.total_debit) > 0 ? parseFloat(acc.total_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                        <td className="p-4 text-sm text-right text-gray-900">{parseFloat(acc.total_credit) > 0 ? parseFloat(acc.total_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                      <td colSpan={2} className="p-4 text-right text-gray-900">Total</td>
                      <td className="p-4 text-right text-indigo-700">₹{parseFloat(trialBalance.total_debit as any).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-indigo-700">₹{parseFloat(trialBalance.total_credit as any).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
