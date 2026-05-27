"use client";

import { useState, useEffect } from "react";
import { billingAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Plus, Search, Edit, Trash2, X, FileText, Settings, DollarSign } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

interface BillingHead {
  id: string;
  name: string;
  description: string | null;
  default_amount: number;
  tax_rate: number;
  head_type: string;
  frequency: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
}

const HEAD_TYPES = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CHARGE', label: 'Charge' },
  { value: 'TAX', label: 'Tax' },
  { value: 'FEE', label: 'Fee' },
];

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE-TIME', label: 'One-time' },
];

export default function BillingHeadsPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [heads, setHeads] = useState<BillingHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedHead, setSelectedHead] = useState<BillingHead | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", default_amount: "", tax_rate: "0", head_type: "MAINTENANCE", frequency: "MONTHLY"
  });

  const canManage = hasPermission('BILL_APPROVE');

  useEffect(() => { loadHeads(); }, []);

  const loadHeads = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getAllHeads();
      setHeads(res.data.heads || []);
    } catch {
      toast.error("Failed to load billing heads");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await billingAPI.createHead({
        name: form.name,
        description: form.description || null,
        default_amount: parseFloat(form.default_amount) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
        head_type: form.head_type,
        frequency: form.frequency
      });
      toast.success("Billing head created");
      setShowCreate(false);
      setForm({ name: "", description: "", default_amount: "", tax_rate: "0", head_type: "MAINTENANCE", frequency: "MONTHLY" });
      loadHeads();
    } catch {
      toast.error("Failed to create billing head");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHead) return;
    try {
      await billingAPI.updateHead(selectedHead.id, {
        name: form.name,
        description: form.description || null,
        default_amount: parseFloat(form.default_amount) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
        head_type: form.head_type,
        frequency: form.frequency,
        is_active: selectedHead.is_active
      });
      toast.success("Billing head updated");
      setShowEdit(false);
      setSelectedHead(null);
      loadHeads();
    } catch {
      toast.error("Failed to update billing head");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this billing head?")) return;
    try {
      await billingAPI.deleteHead(id);
      toast.success("Billing head deactivated");
      loadHeads();
    } catch {
      toast.error("Failed to deactivate billing head");
    }
  };

  const openEdit = (head: BillingHead) => {
    setSelectedHead(head);
    setForm({
      name: head.name,
      description: head.description || "",
      default_amount: String(head.default_amount),
      tax_rate: String(head.tax_rate),
      head_type: head.head_type,
      frequency: head.frequency
    });
    setShowEdit(true);
  };

  const filtered = heads.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Heads</h1>
          <p className="text-gray-400 text-sm mt-1">Manage billing charge categories</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" /> Add Billing Head
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search billing heads..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-32">
              <div className="h-4 skeleton rounded w-3/4 mb-2"></div>
              <div className="h-3 skeleton rounded w-1/2"></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No billing heads found</p>
          </div>
        ) : (
          filtered.map((head) => (
            <div
              key={head.id}
              className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow ${
                head.is_active ? 'border-gray-100' : 'border-red-100 bg-red-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{head.name}</h3>
                    {head.is_system && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">System</span>
                    )}
                    {!head.is_active && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{head.description || "No description"}</p>
                </div>
                {canManage && !head.is_system && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(head)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(head.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Default Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(head.default_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Tax Rate</p>
                  <p className="font-semibold text-gray-900">{head.tax_rate}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Type</p>
                  <p className="font-medium text-gray-700">{head.head_type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Frequency</p>
                  <p className="font-medium text-gray-700">{head.frequency}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Billing Head</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Monthly Maintenance"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Default Amount (₹)</label>
                  <input
                    type="number"
                    value={form.default_amount}
                    onChange={(e) => setForm({ ...form, default_amount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select
                    value={form.head_type}
                    onChange={(e) => setForm({ ...form, head_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {HEAD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedHead && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Billing Head</h2>
              <button onClick={() => { setShowEdit(false); setSelectedHead(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Default Amount (₹)</label>
                  <input
                    type="number"
                    value={form.default_amount}
                    onChange={(e) => setForm({ ...form, default_amount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select
                    value={form.head_type}
                    onChange={(e) => setForm({ ...form, head_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {HEAD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEdit(false); setSelectedHead(null); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}