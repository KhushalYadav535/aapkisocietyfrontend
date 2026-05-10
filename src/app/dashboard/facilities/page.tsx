"use client";
import { useState, useEffect } from "react";
import { facilityAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate, getStatusColor } from "@/lib/utils";
import { CalendarDays, Plus, X, Users, Clock, Zap, BookOpen } from "lucide-react";

interface Facility { id: string; name: string; type: string; capacity: number; rate_per_hour: number; rate_per_day: number; is_active: number; description: string; rules: string; }
interface Booking { id: string; facility_id: string; booked_by: string; booking_date: string; start_time: string; end_time: string; purpose: string; status: string; created_at: string; }

const TYPE_ICONS: Record<string,string> = { HALL:"🏛️", POOL:"🏊", GYM:"💪", PLAYGROUND:"🛝", EV_CHARGING:"⚡", COMMON_AREA:"🌿", TERRACE:"🌆", CLUB_ROOM:"🎱" };

const TABS = ["Facilities", "My Bookings"];

export default function FacilitiesPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState("Facilities");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState<Facility | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [bookForm, setBookForm] = useState({ booking_date: "", start_time: "", end_time: "", purpose: "" });
  const [addForm, setAddForm] = useState({ name: "", type: "HALL", capacity: "", rate_per_hour: "", rate_per_day: "", description: "", rules: "" });

  const isAdmin = ["ADMIN","COMMITTEE","PLATFORM_ADMIN"].includes(user?.role || "");

  useEffect(() => { loadFacilities(); }, []);

  const loadFacilities = async () => {
    setLoading(true);
    try { const r = await facilityAPI.getAll(); setFacilities(r.data.facilities); }
    catch { toast.error("Failed to load"); } finally { setLoading(false); }
  };

  const loadBookings = async () => {
    try {
      const allBookings: Booking[] = [];
      for (const f of facilities) {
        const r = await facilityAPI.getBookings(f.id);
        allBookings.push(...r.data.bookings);
      }
      setBookings(allBookings.filter(b => b.booked_by === user?.id || isAdmin).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch {}
  };

  useEffect(() => { if (tab === "My Bookings" && facilities.length > 0) loadBookings(); }, [tab, facilities]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBook) return;
    try { await facilityAPI.book(showBook.id, bookForm); toast.success(`${showBook.name} booked!`); setShowBook(null); setBookForm({ booking_date:"", start_time:"", end_time:"", purpose:"" }); }
    catch { toast.error("Booking failed"); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await facilityAPI.create({ ...addForm, capacity: parseInt(addForm.capacity)||0, rate_per_hour: parseFloat(addForm.rate_per_hour)||0, rate_per_day: parseFloat(addForm.rate_per_day)||0 }); toast.success("Facility added!"); setShowAdd(false); loadFacilities(); }
    catch { toast.error("Failed"); }
  };

  const handleCancel = async (bookingId: string) => {
    try { await facilityAPI.cancelBooking(bookingId); toast.success("Booking cancelled"); loadBookings(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div><h1 className="text-2xl font-bold text-gray-900">{t("facilitiesTitle")}</h1><p className="text-gray-400 text-sm mt-1">{facilities.filter(f=>f.is_active).length} {t("facilitiesSubtitle")}</p></div>
        {isAdmin && <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all"><Plus className="w-4 h-4" /> Add Facility</button>}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t?"bg-white text-gray-900 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>{t}</button>)}
      </div>

      {tab === "Facilities" && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(5)].map((_,i)=><div key={i} className="h-48 skeleton rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {facilities.map((f,i)=>(
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden animate-slide-up">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 relative">
                  <div className="absolute right-4 top-4 text-3xl opacity-30">{TYPE_ICONS[f.type]||"🏢"}</div>
                  <div className="text-3xl mb-2">{TYPE_ICONS[f.type]||"🏢"}</div>
                  <h3 className="font-bold text-white">{f.name}</h3>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{f.type.replace("_"," ")}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {f.capacity} cap</span>
                    {f.rate_per_hour > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ₹{f.rate_per_hour}/hr</span>}
                    {f.rate_per_day > 0 && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> ₹{f.rate_per_day}/day</span>}
                  </div>
                  {f.description && <p className="text-xs text-gray-400 line-clamp-2">{f.description}</p>}
                  {f.rules && <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 line-clamp-1">📋 {f.rules}</p>}
                  <button onClick={()=>setShowBook(f)} disabled={!f.is_active} className="w-full mt-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200">
                    {f.is_active ? "Book Now" : "Unavailable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "My Bookings" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">{["Facility","Date","Time","Purpose","Status","Action"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {bookings.length === 0
                  ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />No bookings yet</td></tr>
                  : bookings.map(b=>{
                    const f = facilities.find(x=>x.id===b.facility_id);
                    return (
                      <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-medium text-gray-900">{f?.name||"—"}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(b.booking_date)}</td>
                        <td className="px-4 py-3 text-gray-500">{b.start_time&&b.end_time?`${b.start_time}–${b.end_time}`:"All Day"}</td>
                        <td className="px-4 py-3 text-gray-500">{b.purpose||"—"}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${getStatusColor(b.status)}`}>{b.status}</span></td>
                        <td className="px-4 py-3">{b.status==="CONFIRMED"&&<button onClick={()=>handleCancel(b.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {showBook && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-bold text-gray-900">Book {showBook.name}</h2><p className="text-xs text-gray-400">{showBook.type.replace("_"," ")} · Capacity: {showBook.capacity}</p></div><button onClick={()=>setShowBook(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleBook} className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label><input type="date" value={bookForm.booking_date} onChange={e=>setBookForm(p=>({...p,booking_date:e.target.value}))} required min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">From</label><input type="time" value={bookForm.start_time} onChange={e=>setBookForm(p=>({...p,start_time:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">To</label><input type="time" value={bookForm.end_time} onChange={e=>setBookForm(p=>({...p,end_time:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Purpose</label><input value={bookForm.purpose} onChange={e=>setBookForm(p=>({...p,purpose:e.target.value}))} placeholder="Birthday party, Meeting, etc." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              {showBook.rate_per_hour > 0 && <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700"><Zap className="w-3.5 h-3.5 inline mr-1" />Rate: ₹{showBook.rate_per_hour}/hr {showBook.rate_per_day > 0 && `· ₹${showBook.rate_per_day}/day`}</div>}
              <div className="flex gap-3 pt-1"><button type="button" onClick={()=>setShowBook(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Confirm Booking</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Add Facility</h2><button onClick={()=>setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label><input value={addForm.name} onChange={e=>setAddForm(p=>({...p,name:e.target.value}))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="Community Hall" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label><select value={addForm.type} onChange={e=>setAddForm(p=>({...p,type:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{["HALL","POOL","GYM","PLAYGROUND","EV_CHARGING","COMMON_AREA","TERRACE","CLUB_ROOM"].map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Capacity</label><input type="number" value={addForm.capacity} onChange={e=>setAddForm(p=>({...p,capacity:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="200" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Rate/Hour (₹)</label><input type="number" value={addForm.rate_per_hour} onChange={e=>setAddForm(p=>({...p,rate_per_hour:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="0" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Rate/Day (₹)</label><input type="number" value={addForm.rate_per_day} onChange={e=>setAddForm(p=>({...p,rate_per_day:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="0" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Rules / Notes</label><input value={addForm.rules} onChange={e=>setAddForm(p=>({...p,rules:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" placeholder="No outside food allowed" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Add Facility</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
