"use client";
import { useState, useEffect } from "react";
import { emergencyContactAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Phone, Plus, Pencil, Trash2, X, ShieldAlert, Flame, HeartPulse, Wrench, Users, Building2 } from "lucide-react";

const CATEGORIES = [
  { value: "FIRE", label: "Fire", icon: Flame, color: "bg-red-100 text-red-600 border-red-200" },
  { value: "POLICE", label: "Police", icon: ShieldAlert, color: "bg-blue-100 text-blue-600 border-blue-200" },
  { value: "MEDICAL", label: "Medical", icon: HeartPulse, color: "bg-pink-100 text-pink-600 border-pink-200" },
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench, color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
  { value: "COMMITTEE", label: "Committee", icon: Users, color: "bg-indigo-100 text-indigo-600 border-indigo-200" },
  { value: "UTILITY", label: "Utility", icon: Building2, color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { value: "OTHER", label: "Other", icon: Phone, color: "bg-gray-100 text-gray-600 border-gray-200" },
];

interface Contact {
  id: string; category: string; name: string; phone: string;
  alternate_phone: string; notes: string; display_order: number;
}

const EMPTY_FORM = { category: "FIRE", name: "", phone: "", alternate_phone: "", notes: "", display_order: 0 };

export default function EmergencyContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [catFilter, setCatFilter] = useState("ALL");

  const isAdmin = ["ADMIN", "COMMITTEE", "PLATFORM_ADMIN"].includes(user?.role || "");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const r = await emergencyContactAPI.getAll(); setContacts(r.data.contacts); }
    catch { toast.error("Failed to load contacts"); } finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm({ category: c.category, name: c.name, phone: c.phone, alternate_phone: c.alternate_phone || "", notes: c.notes || "", display_order: c.display_order || 0 }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await emergencyContactAPI.update(editing.id, form); toast.success("Updated!"); }
      else { await emergencyContactAPI.create(form); toast.success("Contact added!"); }
      setShowForm(false); setEditing(null); load();
    } catch { toast.error("Failed to save"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    try { await emergencyContactAPI.remove(id); toast.success("Removed"); load(); }
    catch { toast.error("Failed"); }
  };

  const filtered = catFilter === "ALL" ? contacts : contacts.filter(c => c.category === catFilter);
  const grouped = filtered.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);

  const getCategoryMeta = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-7 h-7 text-red-500" /> Emergency Contacts
          </h1>
          <p className="text-gray-400 text-sm mt-1">{contacts.length} contacts · available 24/7</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCatFilter("ALL")}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${catFilter === "ALL" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCatFilter(cat.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${catFilter === cat.value ? `${cat.color} border` : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Phone className="w-14 h-14 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No emergency contacts added yet</p>
          {isAdmin && <p className="text-gray-300 text-sm mt-1">Add important contacts for residents</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catContacts]) => {
            const meta = getCategoryMeta(cat);
            const Icon = meta.icon;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-700">{meta.label}</h3>
                  <span className="text-xs text-gray-400">({catContacts.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catContacts.map(c => (
                    <div key={c.id} className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow ${meta.color.includes('red') ? 'border-red-100' : 'border-gray-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-1 w-fit">
                            <Phone className="w-3.5 h-3.5" /> {c.phone}
                          </a>
                          {c.alternate_phone && (
                            <a href={`tel:${c.alternate_phone}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-600 text-xs mt-0.5 w-fit">
                              <Phone className="w-3 h-3" /> {c.alternate_phone}
                            </a>
                          )}
                          {c.notes && <p className="text-xs text-gray-400 mt-1.5 italic">{c.notes}</p>}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Contact" : "Add Emergency Contact"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Category *</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button type="button" key={cat.value} onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                      className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${form.category === cat.value ? `${cat.color} border-2` : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="Fire Station / Dr. Sharma..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="101 / 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alternate Phone</label>
                  <input value={form.alternate_phone} onChange={e => setForm(p => ({ ...p, alternate_phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="Available 24/7, Near Gate 2..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">
                  {editing ? "Save Changes" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
