"use client";
import { useState, useEffect } from "react";
import { complaintAPI, memberAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate, getStatusColor } from "@/lib/utils";
import { MessageSquareWarning, Plus, Search, X, CheckCircle2, UserCheck2, XCircle } from "lucide-react";

interface Complaint { id: string; title: string; description: string; category: string; priority: string; status: string; raised_by: string; assigned_to: string; resolution_notes: string; created_at: string; }

const CATEGORIES = ["GENERAL","PLUMBING","ELECTRICAL","SECURITY","HOUSEKEEPING","LIFT","PARKING","OTHER"];
const PRIORITIES = ["LOW","MEDIUM","HIGH","URGENT"];

const PRIORITY_COLORS: Record<string,string> = { LOW:"bg-blue-100 text-blue-700", MEDIUM:"bg-amber-100 text-amber-700", HIGH:"bg-orange-100 text-orange-700", URGENT:"bg-red-100 text-red-700" };
const STATUS_ICONS: Record<string,any> = { OPEN: MessageSquareWarning, IN_PROGRESS: UserCheck2, RESOLVED: CheckCircle2, CLOSED: XCircle };

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "GENERAL", priority: "MEDIUM" });

  const isAdmin = ["ADMIN","COMMITTEE","TREASURER","PLATFORM_ADMIN"].includes(user?.role || "");
  const canRaise = (user?.role || "") === "RESIDENT";

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([complaintAPI.getAll(), isAdmin ? memberAPI.getAll() : Promise.resolve({ data: { members: [] } })]);
      setComplaints(c.data.complaints);
      setMembers(m.data.members);
    } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await complaintAPI.create(form); toast.success("Complaint raised!"); setShowAdd(false); setForm({ title: "", description: "", category: "GENERAL", priority: "MEDIUM" }); load(); } catch { toast.error("Failed"); }
  };
  const handleAssign = async () => {
    if (!selected || !assignTo) return;
    try { await complaintAPI.assign(selected.id, { assigned_to: assignTo }); toast.success("Assigned!"); setSelected(null); load(); } catch { toast.error("Failed"); }
  };
  const handleResolve = async () => {
    if (!selected) return;
    try { await complaintAPI.resolve(selected.id, { resolution_notes: resolveNotes }); toast.success("Resolved!"); setSelected(null); setResolveNotes(""); load(); } catch { toast.error("Failed"); }
  };
  const handleClose = async (id: string) => {
    try { await complaintAPI.close(id); toast.success("Closed"); load(); } catch { toast.error("Failed"); }
  };

  const statuses = ["ALL","OPEN","IN_PROGRESS","RESOLVED","CLOSED"];
  const filtered = complaints.filter(c => {
    const ms = `${c.title} ${c.category} ${c.priority}`.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || c.status === statusFilter;
    return ms && mf;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("complaintsTitle")}</h1>
          <p className="text-gray-400 text-sm mt-1">{complaints.filter(c=>c.status==="OPEN").length} open · {complaints.filter(c=>c.status==="IN_PROGRESS").length} in progress</p>
        </div>
        {canRaise && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> {t("raiseComplaint")}
          </button>
        )}
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[{label:"Open",count:complaints.filter(c=>c.status==="OPEN").length,color:"bg-amber-50 border-amber-100",text:"text-amber-700"},
          {label:"In Progress",count:complaints.filter(c=>c.status==="IN_PROGRESS").length,color:"bg-blue-50 border-blue-100",text:"text-blue-700"},
          {label:"Resolved",count:complaints.filter(c=>c.status==="RESOLVED").length,color:"bg-emerald-50 border-emerald-100",text:"text-emerald-700"},
          {label:"Closed",count:complaints.filter(c=>c.status==="CLOSED").length,color:"bg-gray-50 border-gray-100",text:"text-gray-700"},
        ].map((s,i)=>(
          <div key={i} className={`rounded-2xl border p-4 ${s.color} animate-slide-up cursor-pointer hover:shadow-md transition-all`} onClick={()=>setStatusFilter(s.label.replace(" ","_").toUpperCase())}>
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            <p className={`text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search complaints..." /></div>
        <div className="flex gap-2 flex-wrap">{statuses.map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter===s?"bg-indigo-600 text-white":"bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>{s==="ALL"?"All":s.replace("_"," ")}</button>)}</div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><MessageSquareWarning className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No complaints found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const Icon = STATUS_ICONS[c.status] || MessageSquareWarning;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover animate-slide-up">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.status==="OPEN"?"bg-amber-50":c.status==="IN_PROGRESS"?"bg-blue-50":c.status==="RESOLVED"?"bg-emerald-50":"bg-gray-50"}`}>
                    <Icon className={`w-5 h-5 ${c.status==="OPEN"?"text-amber-500":c.status==="IN_PROGRESS"?"text-blue-500":c.status==="RESOLVED"?"text-emerald-500":"text-gray-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${PRIORITY_COLORS[c.priority]||"bg-gray-100 text-gray-600"}`}>{c.priority}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${getStatusColor(c.status)}`}>{c.status.replace("_"," ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{c.category}</span>
                      <span>{formatDate(c.created_at)}</span>
                      {c.assigned_to && <span className="text-blue-500">Assigned</span>}
                    </div>
                    {c.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.description}</p>}
                    {c.resolution_notes && <p className="text-sm text-emerald-600 mt-2 bg-emerald-50 rounded-lg px-3 py-2">✓ {c.resolution_notes}</p>}
                  </div>
                </div>

                {isAdmin && !["RESOLVED","CLOSED"].includes(c.status) && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    {c.status === "OPEN" && (
                      <button onClick={()=>setSelected(c)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"><UserCheck2 className="w-3 h-3" /> Assign & Progress</button>
                    )}
                    {c.status === "IN_PROGRESS" && (
                      <button onClick={()=>{setSelected(c);setResolveNotes("");}} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Mark Resolved</button>
                    )}
                    <button onClick={()=>handleClose(c.id)} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"><XCircle className="w-3 h-3" /> Close</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail/Action Modal */}
      {selected && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{selected.status==="OPEN"?"Assign Complaint":"Resolve Complaint"}</h2>
              <button onClick={()=>setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-medium text-gray-900 text-sm">{selected.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selected.category} · {selected.priority}</p>
            </div>
            {selected.status === "OPEN" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assign To</label>
                  <select value={assignTo} onChange={e=>setAssignTo(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                    <option value="">Select member...</option>
                    {members.filter(m=>["ADMIN","COMMITTEE"].includes(m.role)).map(m=><option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.role})</option>)}
                  </select>
                </div>
                <div className="flex gap-3"><button onClick={()=>setSelected(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={handleAssign} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200">Assign & Start</button></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Resolution Notes</label>
                  <textarea value={resolveNotes} onChange={e=>setResolveNotes(e.target.value)} placeholder="Describe how the issue was resolved..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-24 resize-none" />
                </div>
                <div className="flex gap-3"><button onClick={()=>setSelected(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={handleResolve} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200">Mark Resolved</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showAdd && canRaise && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Raise Complaint</h2><button onClick={()=>setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="Brief description of the issue" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-20 resize-none" placeholder="Detailed description..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label><select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Priority</label><select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Submit</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
