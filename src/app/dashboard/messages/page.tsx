"use client";

import { useState, useEffect, useRef } from "react";
import { messageAPI, memberAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Send, Search, User, Circle, ArrowLeft } from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 20;

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [composeSearch, setComposeSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [receiver, setReceiver] = useState<any>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([messageAPI.getConversations(), memberAPI.getAll()]);
      setConversations(c.data.conversations || []);
      setMembers(m.data.members || []);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  };

  const loadMessages = async (conv: any) => {
    try {
      const r = await messageAPI.getMessages(conv.conversation_id);
      setMessages(r.data.messages || []);
      setSelectedConv(conv);
      setReceiver(null);
      setShowCompose(false);
    } catch { toast.error("Failed to load messages"); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedConv?.conversation_id?.split("-").find((id: string) => id !== user?.id) || receiver?.id;
    if (!content.trim()) return;
    setSending(true);
    try {
      const r = await messageAPI.send({ receiver_id: targetId, content: content.trim() });
      setMessages(prev => [...prev, r.data.message]);
      setContent("");
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to send"); }
    finally { setSending(false); }
  };

  const filtered = conversations.filter(c => {
    const name = `${c.other_name || ""} ${c.other_last_name || ""} ${c.other_flat ? `Wing ${c.other_wing} - ${c.other_flat}` : ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-indigo-500" /> Messages</h1>
          <p className="text-gray-400 text-sm mt-1">{conversations.length} conversations</p>
        </div>
        <button type="button" onClick={() => { setShowCompose(true); setSelectedConv(null); setReceiver(null); setMessages([]); setComposeSearch(""); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200"><Send className="w-4 h-4" /> New Message</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-220px)] min-h-[500px]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`${selectedConv || showCompose ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-100`}>
            <div className="p-3 border-b border-gray-100"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search conversations..." /></div></div>
            <div className="flex-1 overflow-y-auto">
              {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-20 border-b border-gray-50 px-4 py-3"><div className="h-4 skeleton rounded mb-2" /><div className="h-3 skeleton rounded w-3/4" /></div>) : paginated.length === 0 ? (
                <div className="text-center py-16"><MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p className="text-sm text-gray-400">No messages yet</p></div>
              ) : paginated.map(c => (
                <button type="button" key={c.conversation_id} onClick={() => loadMessages(c)} className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv?.conversation_id === c.conversation_id ? "bg-indigo-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">{c.other_name?.[0] || "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between"><p className="font-semibold text-sm text-gray-900 truncate">{c.other_name} {c.other_last_name}</p>{c.unread_count > 0 && <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">{c.unread_count}</span>}</div>
                      <p className="text-xs text-gray-500 truncate">{c.other_flat ? `Wing ${c.other_wing} - ${c.other_flat}` : ""}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedConv && !showCompose ? "hidden md:flex" : ""}`}>
            {selectedConv || showCompose ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  {selectedConv && <button type="button" onClick={() => setSelectedConv(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl" aria-label="Go back"><ArrowLeft className="w-4 h-4" /></button>}
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">{selectedConv ? selectedConv.other_name?.[0] : user?.first_name?.[0]}</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{selectedConv ? `${selectedConv.other_name} ${selectedConv.other_last_name}` : `To: ${receiver?.first_name} ${receiver?.last_name}`}</p>
                    <p className="text-xs text-gray-500">{selectedConv ? (selectedConv.other_flat ? `Wing ${selectedConv.other_wing} - ${selectedConv.other_flat}` : "") : (receiver ? `Wing ${receiver.wing} - ${receiver.flat_number}` : "")}</p>
                  </div>
                </div>

                {/* Compose Search */}
                {showCompose && !receiver && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={composeSearch} onChange={e => setComposeSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search member to message..." /></div>
                    {composeSearch && <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden">
                      {members.filter(u => `${u.first_name} ${u.last_name} ${u.flat_number || ""} ${u.wing || ""}`.toLowerCase().includes(composeSearch.toLowerCase())).slice(0, 5).map(u => (
                        <button type="button" key={u.conversation_id || u.id} onClick={() => { setReceiver(u); setShowCompose(false); setSelectedConv(null); }} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0">
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">{u.first_name?.[0]}</div>
                          <div><p className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</p><p className="text-xs text-gray-500">{u.flat_number ? `Wing ${u.wing} - ${u.flat_number}` : ""}</p></div>
                        </button>
                      ))}
                    </div>}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && !showCompose ? (
                    <div className="text-center py-16"><MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-200" /><p className="text-sm text-gray-400">Start the conversation</p></div>
                  ) : messages.map(m => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] ${isMe ? "order-2" : "order-1"}`}>
                          <div className={`rounded-2xl px-4 py-2.5 ${isMe ? "bg-indigo-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}>
                            <p className="text-sm">{m.content}</p>
                          </div>
                          <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>{formatDate(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
                  <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                  <button type="submit" disabled={sending || !content.trim()} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50" aria-label="Send message"><Send className="w-5 h-5" /></button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">Select a conversation or start a new message</p></div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
