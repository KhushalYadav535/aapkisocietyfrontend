"use client";

import { useState, useEffect } from "react";
import { emergencyContactAPI, bloodAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { 
  Phone, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  ShieldAlert, 
  Flame, 
  HeartPulse, 
  Wrench, 
  Users, 
  Building2,
  Droplet,
  Heart,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Share2
} from "lucide-react";

const CATEGORIES = [
  { value: "FIRE", label: "Fire", icon: Flame, color: "bg-red-100 text-red-600 border-red-200" },
  { value: "POLICE", label: "Police", icon: ShieldAlert, color: "bg-blue-100 text-blue-600 border-blue-200" },
  { value: "MEDICAL", label: "Medical", icon: HeartPulse, color: "bg-pink-100 text-pink-600 border-pink-200" },
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench, color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
  { value: "COMMITTEE", label: "Committee", icon: Users, color: "bg-indigo-100 text-indigo-600 border-indigo-200" },
  { value: "UTILITY", label: "Utility", icon: Building2, color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { value: "OTHER", label: "Other", icon: Phone, color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface Contact {
  id: string; 
  category: string; 
  name: string; 
  phone: string;
  alternate_phone: string; 
  notes: string; 
  display_order: number;
}

interface BloodDonor {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  flat_number: string;
  wing: string;
  blood_group: string;
}

interface BloodRequest {
  id: string;
  society_id: string;
  requester_name: string;
  flat_number: string;
  wing: string;
  blood_group_needed: string;
  patient_name: string;
  hospital_name: string;
  contact_phone: string;
  units_needed: number;
  urgency: string;
  status: string;
  created_at: string;
}

const EMPTY_FORM = { category: "FIRE", name: "", phone: "", alternate_phone: "", notes: "", display_order: 0 };

export default function EmergencyContactsPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<"contacts" | "blood">("contacts");

  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [catFilter, setCatFilter] = useState("ALL");

  // Blood Donor State
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [showBloodRequestModal, setShowBloodRequestModal] = useState(false);
  const [myBloodGroup, setMyBloodGroup] = useState(user?.blood_group || "");
  const [updatingGroup, setUpdatingGroup] = useState(false);

  const [bloodForm, setBloodForm] = useState({
    blood_group_needed: "O+",
    patient_name: "",
    hospital_name: "",
    contact_phone: user?.phone || "",
    units_needed: "1",
    urgency: "CRITICAL",
    notes: ""
  });

  const isAdmin = hasPermission('EMERGENCY_MANAGE') || ['ADMIN', 'COMMITTEE'].includes(String(user?.role).toUpperCase());

  const load = async () => {
    setLoading(true);
    try { 
      const [cRes, dRes, rRes] = await Promise.all([
        emergencyContactAPI.getAll(),
        bloodAPI.getDonors().catch(() => ({ data: { donors: [] } })),
        bloodAPI.getRequests().catch(() => ({ data: { requests: [] } }))
      ]);
      setContacts(cRes.data.contacts || []);
      setDonors(dRes.data?.donors || []);
      setBloodRequests(rRes.data?.requests || []);
    } catch { 
      toast.error("Failed to load emergency data"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c: Contact) => { 
    setEditing(c); 
    setForm({ 
      category: c.category, 
      name: c.name, 
      phone: c.phone, 
      alternate_phone: c.alternate_phone || "", 
      notes: c.notes || "", 
      display_order: c.display_order || 0 
    }); 
    setShowForm(true); 
  };

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

  const handleUpdateMyBloodGroup = async (group: string) => {
    try {
      setUpdatingGroup(true);
      await bloodAPI.updateMyGroup(group);
      setMyBloodGroup(group);
      toast.success(`Blood group updated to ${group}! Thank you for being a potential donor.`);
      load();
    } catch (err: any) {
      toast.error("Failed to update blood group");
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleCreateBloodRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bloodAPI.createRequest(bloodForm);
      toast.success("🚨 Emergency blood request broadcasted to society!");
      setShowBloodRequestModal(false);
      setBloodForm({
        blood_group_needed: "O+",
        patient_name: "",
        hospital_name: "",
        contact_phone: user?.phone || "",
        units_needed: "1",
        urgency: "CRITICAL",
        notes: ""
      });
      load();
    } catch {
      toast.error("Failed to submit blood request");
    }
  };

  const handleFulfillRequest = async (id: string) => {
    try {
      await bloodAPI.updateStatus(id, "FULFILLED");
      toast.success("Request marked as fulfilled!");
      load();
    } catch {
      toast.error("Failed to update request");
    }
  };

  const filteredContacts = catFilter === "ALL" ? contacts : contacts.filter(c => c.category === catFilter);
  const groupedContacts = filteredContacts.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);

  const getCategoryMeta = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

  const filteredDonors = selectedGroupFilter === "ALL" 
    ? donors 
    : donors.filter(d => d.blood_group === selectedGroupFilter);

  const getRequestWhatsAppLink = (req: BloodRequest) => {
    const text = `🚨 *URGENT BLOOD REQUIREMENT - AAPKISOCIETY*\n\nBlood Needed: *${req.blood_group_needed}* (${req.units_needed} unit)\nPatient: ${req.patient_name || "Resident / Family"}\nHospital: *${req.hospital_name}*\nUrgency: ${req.urgency}\nContact: ${req.contact_phone}\n\nIf you or a family member can donate, please contact immediately!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Emergency & Life Safety</h1>
            <p className="text-slate-500 text-xs mt-0.5">24/7 Society Directory, Police/Fire, & Verified Blood Donors</p>
          </div>
        </div>

        {activeTab === "contacts" && isAdmin && (
          <button 
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Emergency Number
          </button>
        )}

        {activeTab === "blood" && (
          <button 
            onClick={() => setShowBloodRequestModal(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" /> Urgent Blood Needed SOS
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button 
          onClick={() => setActiveTab("contacts")} 
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "contacts" 
              ? "text-rose-600 border-rose-600" 
              : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <Phone className="w-4 h-4" />
          Helpline Directory ({contacts.length})
        </button>
        <button 
          onClick={() => setActiveTab("blood")} 
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "blood" 
              ? "text-rose-600 border-rose-600" 
              : "text-slate-500 border-transparent hover:text-slate-800"
          }`}
        >
          <Droplet className="w-4 h-4 text-rose-500 fill-rose-500" />
          Society Blood Donor Network ({donors.length})
        </button>
      </div>

      {/* Tab 1: Standard Contacts */}
      {activeTab === "contacts" && (
        <div className="space-y-6">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setCatFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                catFilter === "ALL" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Numbers
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.value} 
                onClick={() => setCatFilter(cat.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  catFilter === cat.value ? `${cat.color} border font-bold` : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grouped Contacts */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : Object.keys(groupedContacts).length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
              <Phone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Contacts Found</h3>
              <p className="text-xs text-slate-500 mt-1">Add emergency contacts for fire, ambulance, security gate, and lift technicians.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedContacts).map(([cat, list]) => {
                const meta = getCategoryMeta(cat);
                const Icon = meta.icon;
                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{meta.label} Services</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map(c => (
                        <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEdit(c)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(c.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {c.notes && <p className="text-xs text-slate-500 mt-1">{c.notes}</p>}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-800">{c.phone}</span>
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call Now
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Blood Donor Network */}
      {activeTab === "blood" && (
        <div className="space-y-6">
          {/* Active Urgent Requests Strip */}
          {bloodRequests.filter(r => r.status === "ACTIVE").length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <Heart className="w-5 h-5 text-rose-600 fill-rose-600 animate-pulse" />
                  <span>URGENT BLOOD REQUIREMENTS IN SOCIETY</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  {bloodRequests.filter(r => r.status === "ACTIVE").length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bloodRequests.filter(r => r.status === "ACTIVE").map(req => (
                  <div key={req.id} className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-rose-600 flex items-center gap-1">
                          <Droplet className="w-5 h-5 fill-rose-600" /> {req.blood_group_needed} Needed
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                          {req.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2 font-medium">
                        Patient: {req.patient_name || "Resident"} • Hospital: <span className="font-bold text-slate-900">{req.hospital_name}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Posted by {req.requester_name} (Flat {req.wing ? req.wing + "-" : ""}{req.flat_number})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${req.contact_phone}`}
                        className="flex-1 text-center py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call ({req.contact_phone})
                      </a>
                      <a
                        href={getRequestWhatsAppLink(req)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1 border border-emerald-200"
                        title="Broadcast on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Share
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleFulfillRequest(req.id)}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Donor Registration Card */}
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                Be a Hero • Society Donor Registry
              </div>
              <h3 className="text-lg font-bold text-slate-900">Your Registered Blood Group</h3>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                In medical emergencies inside the society, your neighbors can reach you directly to save a life.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0 bg-white p-2 rounded-2xl border border-rose-200/80 shadow-sm">
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  disabled={updatingGroup}
                  onClick={() => handleUpdateMyBloodGroup(bg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    myBloodGroup === bg
                      ? "bg-rose-600 text-white shadow-sm scale-105"
                      : "text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Donor Filter & Directory */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-slate-900 text-base">Registered Society Donors ({filteredDonors.length})</h3>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedGroupFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    selectedGroupFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All Groups
                </button>
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    onClick={() => setSelectedGroupFilter(bg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      selectedGroupFilter === bg ? "bg-rose-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {filteredDonors.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto">
                <Droplet className="w-12 h-12 text-rose-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base">No Donors for this Group Yet</h4>
                <p className="text-xs text-slate-500 mt-1">Register your blood group above to start this list!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDonors.map(d => (
                  <div key={d.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                        {d.blood_group}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{d.first_name} {d.last_name}</h4>
                        <span className="text-xs text-slate-400 block">Flat {d.wing ? d.wing + "-" : ""}{d.flat_number || "Resident"}</span>
                      </div>
                    </div>

                    <a
                      href={`tel:${d.phone}`}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition-all shrink-0"
                      title="Call Donor"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Urgent Blood Request Modal */}
      {showBloodRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Urgent Blood SOS</h2>
                  <p className="text-[11px] text-slate-500">Broadcast to all society residents</p>
                </div>
              </div>
              <button onClick={() => setShowBloodRequestModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBloodRequest} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group Needed *</label>
                  <select
                    value={bloodForm.blood_group_needed}
                    onChange={e => setBloodForm({ ...bloodForm, blood_group_needed: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-white"
                  >
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Units Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={bloodForm.units_needed}
                    onChange={e => setBloodForm({ ...bloodForm, units_needed: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Blood Bank Name *</label>
                <input
                  required
                  placeholder="e.g. Fortis Hospital, Apollo Clinic, AIIMS"
                  value={bloodForm.hospital_name}
                  onChange={e => setBloodForm({ ...bloodForm, hospital_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                <input
                  placeholder="Patient Full Name"
                  value={bloodForm.patient_name}
                  onChange={e => setBloodForm({ ...bloodForm, patient_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  required
                  placeholder="9876543210"
                  value={bloodForm.contact_phone}
                  onChange={e => setBloodForm({ ...bloodForm, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
                <select
                  value={bloodForm.urgency}
                  onChange={e => setBloodForm({ ...bloodForm, urgency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="CRITICAL">Critical (Immediate surgery / ICU)</option>
                  <option value="WITHIN_24_HOURS">Within 24 Hours</option>
                  <option value="SCHEDULED">Scheduled Procedure</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBloodRequestModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-md">
                  Broadcast Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Emergency Contact" : "Add Emergency Contact"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone</label>
                <input value={form.alternate_phone} onChange={e => setForm({ ...form, alternate_phone: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Operating Hours</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. 24x7 control room, Ext 104" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md">{editing ? "Save Changes" : "Add Number"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
