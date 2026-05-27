"use client";

import { useState, useEffect } from "react";
import { meetingAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { Vote, Plus, Calendar, Clock, MapPin, Users, CheckCircle, X, Video, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;
const MEETING_TYPES = ["AGM", "EXTRAORDINARY", "COMMITTEE", "TOWN_HALL", "OTHER"];
const STATUS_COLORS: Record<string, string> = { SCHEDULED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700", COMPLETED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700" };

export default function MeetingsPage() {
  const { user, hasPermission } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"meetings" | "polls">("meetings");
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddPoll, setShowAddPoll] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [expandedPoll, setExpandedPoll] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [meetingForm, setMeetingForm] = useState({ title: "", description: "", meeting_type: "AGM", meeting_date: "", start_time: "", end_time: "", location: "", is_online: false, meeting_link: "" });
  const [pollForm, setPollForm] = useState({ meeting_id: "", title: "", description: "", poll_type: "OPEN", options: ["", ""], end_date: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const isCommittee = hasPermission('MEETING_MANAGE');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([meetingAPI.getAll(), meetingAPI.getPolls()]);
      setMeetings(m.data.meetings || []);
      setPolls(p.data.polls || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await meetingAPI.create(meetingForm);
      toast.success("Meeting scheduled!");
      setShowAddMeeting(false);
      setMeetingForm({ title: "", description: "", meeting_type: "AGM", meeting_date: "", start_time: "", end_time: "", location: "", is_online: false, meeting_link: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleAddPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollForm.options.filter(o => o.trim());
    if (validOptions.length < 2) return toast.error("At least 2 options required");
    try {
      await meetingAPI.createPoll({ ...pollForm, options: validOptions });
      toast.success("Poll created!");
      setShowAddPoll(false);
      setPollForm({ meeting_id: "", title: "", description: "", poll_type: "OPEN", options: ["", ""], end_date: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try { await meetingAPI.vote(pollId, optionId); setVotedPolls(prev => new Set([...prev, pollId])); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || "Already voted"); }
  };

  const handleClosePoll = async (pollId: string) => {
    try { await meetingAPI.closePoll(pollId); toast.success("Poll closed"); load(); }
    catch { toast.error("Failed"); }
  };

  const handleUpdateStatus = async (meetingId: string, status: string) => {
    try { await meetingAPI.updateStatus(meetingId, { status, currentStatus: meetings.find(m => m.id === meetingId)?.status }); toast.success("Status updated"); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const filtered = meetings.filter(m => statusFilter === "ALL" || m.status === statusFilter);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  const getPollStats = (poll: any) => {
    const options = typeof poll.options === "string" ? JSON.parse(poll.options) : (poll.options || []);
    const total = poll.total_votes || 0;
    return options.map((o: any) => ({ ...o, pct: total > 0 ? Math.round(((o.votes || 0) / total) * 100) : 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Vote className="w-6 h-6 text-indigo-500" /> Meetings & Polls</h1>
          <p className="text-gray-400 text-sm mt-1">{meetings.length} meetings • {polls.length} active polls</p>
        </div>
        <div className="flex gap-2">
          {isCommittee && <button onClick={() => setShowAddPoll(true)} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm"><BarChart3 className="w-4 h-4" /> Create Poll</button>}
          {isCommittee && <button onClick={() => setShowAddMeeting(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200"><Plus className="w-4 h-4" /> Schedule Meeting</button>}
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab("meetings")} className={`pb-3 px-4 text-sm font-medium ${activeTab === "meetings" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Meetings ({meetings.length})</button>
        <button onClick={() => setActiveTab("polls")} className={`pb-3 px-4 text-sm font-medium ${activeTab === "polls" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Active Polls ({polls.filter(p => p.status === "ACTIVE").length})</button>
      </div>

      {activeTab === "meetings" && (
        <>
          <div className="flex gap-2 flex-wrap">{["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{s}</button>)}</div>
          {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div> : paginated.length === 0 ? (
            <div className="text-center py-16"><Calendar className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No meetings found</p></div>
          ) : (
            <div className="space-y-3">
              {paginated.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Calendar className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{m.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(m.meeting_date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.start_time}{m.end_time ? ` - ${m.end_time}` : ""}</span>
                          {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                          {m.is_online && <span className="flex items-center gap-1"><Video className="w-3 h-3" />Online</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400"><span>By {m.first_name} {m.last_name}</span><span>• {m.meeting_type}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${STATUS_COLORS[m.status] || "bg-gray-100 text-gray-700"}`}>{m.status}</span>
                      {isCommittee && m.status === "SCHEDULED" && (
                        <button onClick={() => handleUpdateStatus(m.id, "IN_PROGRESS")} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-semibold">Start Meeting</button>
                      )}
                      {isCommittee && m.status === "IN_PROGRESS" && (
                        <button onClick={() => handleUpdateStatus(m.id, "COMPLETED")} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-semibold">Mark Complete</button>
                      )}
                    </div>
                  </div>
                  {m.description && <p className="text-sm text-gray-600 mt-3">{m.description}</p>}
                  {m.agenda_items?.length > 0 && <div className="mt-3 space-y-1">{m.agenda_items.map((a: string, i: number) => <div key={i} className="text-xs text-gray-500 flex items-center gap-2"><span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">{i + 1}</span>{a}</div>)}</div>}
                </div>
              ))}
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
        </>
      )}

      {activeTab === "polls" && (
        <>
          {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}</div> : polls.length === 0 ? (
            <div className="text-center py-16"><BarChart3 className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No polls yet</p></div>
          ) : (
            <div className="space-y-4">
              {polls.map(p => {
                const stats = getPollStats(p);
                const hasVoted = votedPolls.has(p.id) || (p as any)._voted;
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-900">{p.title}</h3><span className={`text-xs px-2.5 py-0.5 rounded-lg font-semibold ${p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span></div>
                        {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{p.total_votes} votes</span>
                          {p.end_date && <span>Ends: {formatDate(p.end_date)}</span>}
                          <span>Type: {p.poll_type}</span>
                        </div>
                      </div>
                      {isCommittee && p.status === "ACTIVE" && <button onClick={() => handleClosePoll(p.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg font-semibold">Close Poll</button>}
                    </div>
                    <div className="mt-4 space-y-2">
                      {stats.map((opt: any) => (
                        <div key={opt.id} className="relative">
                          <button onClick={() => p.status === "ACTIVE" && !hasVoted && handleVote(p.id, opt.id)} disabled={p.status !== "ACTIVE" || hasVoted} className={`w-full text-left px-4 py-2.5 rounded-xl border transition-colors ${hasVoted || p.status !== "ACTIVE" ? "border-gray-100 bg-gray-50" : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"}`}>
                            <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">{opt.text}</span>{hasVoted && <span className="text-xs font-semibold text-indigo-600">{opt.pct}%</span>}</div>
                          </button>
                          {hasVoted && <div className="absolute inset-y-0 left-0 bg-indigo-100 rounded-xl" style={{ width: `${opt.pct}%`, opacity: 0.4 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddMeeting && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Schedule Meeting</h2><button onClick={() => setShowAddMeeting(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAddMeeting} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label><input value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label><select value={meetingForm.meeting_type} onChange={e => setMeetingForm({ ...meetingForm, meeting_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{MEETING_TYPES.map(t => <option key={t}>{t}</option>)}</select></div><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label><input type="date" value={meetingForm.meeting_date} onChange={e => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Time</label><input type="time" value={meetingForm.start_time} onChange={e => setMeetingForm({ ...meetingForm, start_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">End Time</label><input type="time" value={meetingForm.end_time} onChange={e => setMeetingForm({ ...meetingForm, end_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label><input value={meetingForm.location} onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={meetingForm.is_online} onChange={e => setMeetingForm({ ...meetingForm, is_online: e.target.checked })} className="w-4 h-4" /><label className="text-sm text-gray-600">Online Meeting</label></div>
              {meetingForm.is_online && <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Meeting Link</label><input value={meetingForm.meeting_link} onChange={e => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })} placeholder="https://meet.google.com/..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>}
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label><textarea value={meetingForm.description} onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-20 resize-none" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAddMeeting(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Schedule</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddPoll && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Create Poll</h2><button onClick={() => setShowAddPoll(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAddPoll} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label><input value={pollForm.title} onChange={e => setPollForm({ ...pollForm, title: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label><textarea value={pollForm.description} onChange={e => setPollForm({ ...pollForm, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-20 resize-none" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label><select value={pollForm.poll_type} onChange={e => setPollForm({ ...pollForm, poll_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"><option>OPEN</option><option>ANONYMOUS</option><option>NAMED</option></select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Options (at least 2)</label>{pollForm.options.map((opt, i) => <input key={i} value={opt} onChange={e => { const n = [...pollForm.options]; n[i] = e.target.value; setPollForm({ ...pollForm, options: n }); }} placeholder={`Option ${i + 1}`} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 mb-2" />)}<button type="button" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">+ Add Option</button></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label><input type="date" value={pollForm.end_date} onChange={e => setPollForm({ ...pollForm, end_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAddPoll(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Create Poll</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
