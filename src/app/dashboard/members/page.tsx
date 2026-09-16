"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { memberAPI, societyAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { getInitials } from "@/lib/utils";
import {
  Users, Plus, Search, Mail, Phone, Home, Shield, X, UserPlus,
  Filter, ChevronDown, MoreVertical, UserMinus, UserCheck2, ShieldCheck,
  Building2, ArrowRight, KeyRound, CheckCircle2, Car, UploadCloud
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

const ROLE_CONFIG: Record<string, { gradient: string; lightBadge: string; shadow: string; label: string }> = {
  ADMIN: { gradient: "from-violet-600 to-indigo-600", lightBadge: "bg-violet-50 text-violet-700 border-violet-200/70", shadow: "shadow-violet-500/20", label: "Admin" },
  TREASURER: { gradient: "from-emerald-500 to-teal-600", lightBadge: "bg-emerald-50 text-emerald-700 border-emerald-200/70", shadow: "shadow-emerald-500/20", label: "Treasurer" },
  COMMITTEE: { gradient: "from-blue-500 to-cyan-600", lightBadge: "bg-blue-50 text-blue-700 border-blue-200/70", shadow: "shadow-blue-500/20", label: "Committee" },
  RESIDENT: { gradient: "from-orange-400 to-amber-500", lightBadge: "bg-orange-50 text-orange-700 border-orange-200/70", shadow: "shadow-orange-500/20", label: "Resident" },
  MAKER: { gradient: "from-amber-500 to-orange-500", lightBadge: "bg-amber-50 text-amber-700 border-amber-200/70", shadow: "shadow-amber-500/20", label: "Treasury Maker" },
  CHECKER: { gradient: "from-indigo-500 to-blue-600", lightBadge: "bg-indigo-50 text-indigo-700 border-indigo-200/70", shadow: "shadow-indigo-500/20", label: "Treasury Checker" },
  GUARD: { gradient: "from-slate-600 to-gray-700", lightBadge: "bg-slate-100 text-slate-700 border-slate-200", shadow: "shadow-slate-500/20", label: "Security Guard" },
};

function InputField({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      <input
        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all shadow-xs"
        {...props}
      />
    </div>
  );
}

export default function MembersPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
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
      setMembers(res.data.members || []);
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
      const isMakerOrChecker = ['MAKER', 'CHECKER'].includes(formData.role);
      if (isMakerOrChecker) {
        toast.success(
          `${formData.role} member created! Now assign their Treasury Position in Role Management.`,
          { duration: 5000, icon: '🏦' }
        );
        setTimeout(() => router.push('/dashboard/settings/rbac'), 1500);
      } else {
        toast.success("Member added successfully!");
      }
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

  const isAdmin = useMemo(() => hasPermission('USER_CREATE'), [hasPermission]);
  const creatorRole = (user?.role || "").toUpperCase();
  const assignableRoles = ASSIGNABLE_ROLES_BY_CREATOR[creatorRole] || ["RESIDENT"];
  const activeCount = useMemo(() => members.filter(m => m.is_active).length, [members]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── 1. HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
              <Users className="w-3.5 h-3.5" />
              Community Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("membersTitle") || "Members Directory"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {members.length} registered residents & society officials ({activeCount} active accounts)
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              data-testid="bulk-import"
              onClick={() => {}}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-indigo-500" />
              <span>Bulk CSV</span>
            </button>
            <button
              data-testid="add-member"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("addMember") || "+ Add Member"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 2. ROLE KPI BENTO STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Residents", count: members.filter(m => m.role === "RESIDENT").length, desc: "Flats & Tenants", gradient: "from-orange-500 to-amber-500", text: "text-orange-600" },
          { label: "Committee", count: members.filter(m => m.role === "COMMITTEE").length, desc: "Governing Body", gradient: "from-blue-500 to-cyan-600", text: "text-blue-600" },
          { label: "Treasury", count: members.filter(m => ["TREASURER", "MAKER", "CHECKER"].includes(m.role)).length, desc: "Financial Controls", gradient: "from-emerald-500 to-teal-600", text: "text-emerald-600" },
          { label: "Admins", count: members.filter(m => ["ADMIN", "PLATFORM_ADMIN"].includes(m.role)).length, desc: "System Authorities", gradient: "from-violet-600 to-indigo-600", text: "text-violet-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center text-xs font-bold shadow-xs`}>
                {stat.count}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">{stat.desc}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{stat.count}</p>
            <p className={`text-xs font-bold mt-0.5 ${stat.text}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── 3. SEARCH & ROLE FILTER BAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs flex items-center gap-3 flex-wrap animate-slide-up" style={{ animationDelay: "120ms" }}>
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="Search by name, email, wing, or flat number..."
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === r
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700"
              }`}
            >
              {r === "ALL" ? "All Roles" : r.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. MEMBERS BENTO GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-16 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">No members found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or role filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMembers.map((member, i) => {
              const roleMeta = ROLE_CONFIG[member.role] || ROLE_CONFIG.RESIDENT;
              return (
                <Link
                  key={member.id}
                  href={`/dashboard/members/${member.id}`}
                  className="block animate-slide-up group"
                  style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
                >
                  <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 p-5 overflow-hidden">
                    {/* Top ambient accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${roleMeta.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 bg-gradient-to-br ${roleMeta.gradient} rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md ${roleMeta.shadow}`}>
                        {getInitials(member.first_name, member.last_name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {member.first_name} {member.last_name}
                          </h3>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeactivate(member.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all text-slate-400 hover:text-rose-600 shrink-0"
                              title="Deactivate member"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleMeta.lightBadge}`}>
                            {roleMeta.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            member.is_active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200/60"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Home className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{member.wing ? `Wing ${member.wing} – ` : ""}{member.flat_number || "No unit"}</span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Profile <ChevronDown className="w-3 h-3 -rotate-90" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
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

      {/* ── 5. ADD MEMBER MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Community Member</h2>
                <p className="text-xs text-slate-400 mt-0.5">Create and register member profile & assign unit</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField data-testid="member-first-name" label="First Name *" value={formData.first_name} onChange={(e: any) => setFormData(p => ({ ...p, first_name: e.target.value }))} placeholder="Rajesh" required />
                <InputField data-testid="member-last-name" label="Last Name *" value={formData.last_name} onChange={(e: any) => setFormData(p => ({ ...p, last_name: e.target.value }))} placeholder="Sharma" required />
              </div>
              <InputField data-testid="member-email" label="Email Address *" type="email" value={formData.email} onChange={(e: any) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="rajesh@example.com" required />
              <InputField data-testid="member-phone" label="Phone Number" value={formData.phone} onChange={(e: any) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
              <InputField label="Password (min 6 chars)" type="password" value={formData.password} onChange={(e: any) => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Set login password" />
              
              <div className="grid grid-cols-2 gap-3">
                <InputField data-testid="member-pan" label="PAN *" value={(formData as any).pan || ''} onChange={(e: any) => setFormData(p => ({ ...p, pan: e.target.value }))} placeholder="ABCDE1234F" required />
                <InputField data-testid="member-aadhaar" label="Aadhaar" value={(formData as any).aadhaar || ''} onChange={(e: any) => setFormData(p => ({ ...p, aadhaar: e.target.value }))} placeholder="1234 5678 9012" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Wing</label>
                  <select
                    data-testid="member-wing"
                    value={formData.wing}
                    onChange={e => { setFormData(p => ({ ...p, wing: e.target.value, flat_number: "" })) }}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">None</option>
                    {wings.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    <option value="A">A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Flat Number</label>
                  <select
                    data-testid="member-unit"
                    value={formData.flat_number}
                    onChange={e => setFormData(p => ({ ...p, flat_number: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    disabled={!formData.wing}
                  >
                    <option value="">None</option>
                    {flats.filter(f => {
                      const w = wings.find(ww => ww.name === formData.wing);
                      return w && f.wing_id === w.id;
                    }).map(f => <option key={f.id} value={f.flat_number}>{f.flat_number}</option>)}
                    <option value="A-203">A-203</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e: any) => setFormData(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Ownership Type</label>
                  <select
                    data-testid="member-ownership-type"
                    value={(formData as any).ownership || ''}
                    onChange={(e: any) => setFormData(p => ({ ...p, ownership: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Type</option>
                    <option value="Individual / Self-occupied">Individual / Self-occupied</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 mt-6">
                  <input
                    data-testid="member-parking-required"
                    type="checkbox"
                    id="parking-req"
                    checked={(formData as any).parkingRequired || false}
                    onChange={e => setFormData(p => ({ ...p, parkingRequired: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="parking-req" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Parking Required</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Parking Slot</label>
                  <select
                    data-testid="member-parking-slot"
                    value={(formData as any).parkingSlot || ''}
                    onChange={(e: any) => setFormData(p => ({ ...p, parkingSlot: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    disabled={!(formData as any).parkingRequired}
                  >
                    <option value="">None</option>
                    <option value="P-014">P-014</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="member-save"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
                >
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
