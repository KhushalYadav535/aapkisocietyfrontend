"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { memberAPI, societyAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { getInitials } from "@/lib/utils";
import {
  Users, Plus, Search, Mail, Phone, Home, Shield, X, UserPlus,
  Filter, ChevronDown, MoreVertical, UserMinus, UserCheck2
} from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 12;

interface Member {
  id: string; email: string; first_name: string; last_name: string;
  phone: string; role: string; flat_number: string; wing: string;
  is_active: number; created_at: string;
}

const ASSIGNABLE_ROLES_BY_CREATOR: Record<string, string[]> = {
  PLATFORM_ADMIN: ["PLATFORM_ADMIN", "ADMIN", "TREASURER", "MAKER", "CHECKER", "COMMITTEE", "RESIDENT", "GUARD"],
  ADMIN: ["ADMIN", "TREASURER", "MAKER", "CHECKER", "COMMITTEE", "RESIDENT", "GUARD"]
};
const ROLE_GRADIENTS: Record<string, string> = {
  ADMIN: "from-violet-600 to-fuchsia-600",
  TREASURER: "from-emerald-500 to-teal-600",
  COMMITTEE: "from-blue-500 to-cyan-600",
  RESIDENT: "from-orange-400 to-rose-500",
  MAKER: "from-amber-500 to-orange-500",
  CHECKER: "from-indigo-500 to-blue-600",
  GUARD: "from-slate-500 to-gray-600",
};
const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  TREASURER: "bg-emerald-100 text-emerald-700",
  COMMITTEE: "bg-blue-100 text-blue-700",
  RESIDENT: "bg-orange-100 text-orange-700",
  MAKER: "bg-amber-100 text-amber-700",
  CHECKER: "bg-indigo-100 text-indigo-700",
  GUARD: "bg-slate-100 text-slate-700",
};

function InputField({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors"
        {...props}
      />
    </div>
  );
}

export default function MembersPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [members, setMembers] = useState<Member[]>([]);
  const [wings, setWings] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "", first_name: "", last_name: "", phone: "",
    role: "RESIDENT", flat_number: "", wing: "", password: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await memberAPI.getAll();
      setMembers(res.data.members);
      if (user?.society_id) {
        const [wRes, fRes] = await Promise.all([
          societyAPI.getWings(user.society_id),
          societyAPI.getFlats(user.society_id)
        ]);
        setWings(wRes.data.wings || []);
        setFlats(fRes.data.flats || []);
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await memberAPI.create(formData);
      toast.success("Member added successfully!");
      setShowAddModal(false);
      setFormData({ email: "", first_name: "", last_name: "", phone: "", role: "RESIDENT", flat_number: "", wing: "", password: "" });
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to add member"); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this member?")) return;
    try {
      await memberAPI.deactivate(id);
      toast.success("Member deactivated");
      loadData();
    } catch { toast.error("Failed to deactivate"); }
  };

  const roles = useMemo(() => ["ALL", ...Array.from(new Set(members.map(m => m.role)))], [members]);
  const filtered = useMemo(() => members.filter(m => {
    const matchSearch = `${m.first_name} ${m.last_name} ${m.email} ${m.flat_number} ${m.wing}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchSearch && matchRole;
  }), [members, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ), [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter]);

  const isAdmin = useMemo(() => hasPermission('USER_CREATE'), [user?.role]);
  const creatorRole = (user?.role || "").toUpperCase();
  const assignableRoles = ASSIGNABLE_ROLES_BY_CREATOR[creatorRole] || ["RESIDENT"];
  const activeCount = useMemo(() => members.filter(m => m.is_active).length, [members]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("membersTitle")}</h1>
          <p className="text-gray-400 text-sm mt-1">{members.length} {t("membersSubtitle")} ({activeCount})</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4" /> {t("addMember")}
          </button>
        )}
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Residents", count: members.filter(m => m.role === "RESIDENT").length, color: "bg-orange-50 border-orange-100", text: "text-orange-700" },
          { label: "Committee", count: members.filter(m => m.role === "COMMITTEE").length, color: "bg-blue-50 border-blue-100", text: "text-blue-700" },
          { label: "Treasurer", count: members.filter(m => m.role === "TREASURER").length, color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
          { label: "Admin", count: members.filter(m => m.role === "ADMIN").length, color: "bg-violet-50 border-violet-100", text: "text-violet-700" },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${stat.color} animate-slide-up`}>
            <p className="text-2xl font-bold" style={{ color: '#111827' }}>{stat.count}</p>
            <p className={`text-xs font-semibold mt-0.5 ${stat.text}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap animate-slide-up" style={{ animationDelay: "120ms" }}>
        <div className="flex-1 min-w-56 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={t("searchBills")}
          />
        </div>
        <div className="flex items-center gap-2">
          {roles.map(role => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                roleFilter === role
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}>
              {role === "ALL" ? "All" : role.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-300 animate-fade-in">
          <Users className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-gray-400">No members found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMembers.map((member, i) => (
              <Link
                key={member.id}
                href={`/dashboard/members/${member.id}`}
                className="block animate-slide-up"
                style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden group cursor-pointer">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${ROLE_GRADIENTS[member.role] || "from-indigo-500 to-purple-600"} rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                        {getInitials(member.first_name, member.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{member.first_name} {member.last_name}</h3>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeactivate(member.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all text-gray-400 hover:text-red-500 flex-shrink-0"
                              title="Deactivate member"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${ROLE_BADGE[member.role] || "bg-gray-100 text-gray-600"}`}>
                            {member.role.replace(/_/g, " ")}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${member.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.flat_number && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Home className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-700">
                            {member.wing ? `Wing ${member.wing} – ` : ""}{member.flat_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Member</h2>
                <p className="text-xs text-gray-400 mt-0.5">Invite a resident or committee member</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="First Name *" value={formData.first_name} onChange={(e: any) => setFormData(p => ({ ...p, first_name: e.target.value }))} placeholder="Rajesh" required />
                <InputField label="Last Name *" value={formData.last_name} onChange={(e: any) => setFormData(p => ({ ...p, last_name: e.target.value }))} placeholder="Sharma" required />
              </div>
              <InputField label="Email Address *" type="email" value={formData.email} onChange={(e: any) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="rajesh@example.com" required />
              <InputField label="Phone Number" value={formData.phone} onChange={(e: any) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
              <InputField label="Password (min 6 chars)" type="password" value={formData.password} onChange={(e: any) => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Set login password" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Wing</label>
                  <select value={formData.wing} onChange={e => { setFormData(p => ({ ...p, wing: e.target.value, flat_number: "" })) }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    <option value="">None</option>
                    {wings.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Flat Number</label>
                  <select value={formData.flat_number} onChange={e => setFormData(p => ({ ...p, flat_number: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" disabled={!formData.wing}>
                    <option value="">None</option>
                    {flats.filter(f => {
                      const w = wings.find(ww => ww.name === formData.wing);
                      return w && f.wing_id === w.id;
                    }).map(f => <option key={f.id} value={f.flat_number}>{f.flat_number}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                <div className="flex gap-2">
                  <select value={formData.role} onChange={(e: any) => setFormData(p => ({ ...p, role: e.target.value }))} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition-all">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
