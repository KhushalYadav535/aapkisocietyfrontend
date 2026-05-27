"use client";

import { useState, useEffect } from "react";
import { vendorAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { Wrench, Plus, Search, X, Star, Phone, Mail, MapPin, Trash2, StarHalf, User } from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 12;
const CATEGORIES = ["PLUMBER", "ELECTRICIAN", "CARPENTER", "PAINTER", "CLEANING", "PEST_CONTROL", "GARDENER", "SECURITY", "MOVING", "AC_REPAIR", "APPLIANCE", "GENERAL"];

export default function VendorsPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission('VENDOR_MANAGE');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [showReview, setShowReview] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", category: "GENERAL", contact_person: "", phone: "", email: "", address: "", services: "", hourly_rate: "" });
  const [ratingForm, setRatingForm] = useState({ rating: 5, review: "" });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await vendorAPI.getAll();
      setVendors(r.data.vendors || []);
    } catch { toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vendorAPI.create({ ...form, services: form.services.split(",").map(s => s.trim()).filter(Boolean), hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : 0 });
      toast.success("Vendor added!");
      setShowAdd(false);
      setForm({ name: "", category: "GENERAL", contact_person: "", phone: "", email: "", address: "", services: "", hourly_rate: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReview) return;
    try {
      await vendorAPI.rate(showReview.id, ratingForm);
      toast.success("Thanks for your feedback!");
      setShowReview(null);
      setRatingForm({ rating: 5, review: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this vendor?")) return;
    try { await vendorAPI.delete(id); toast.success("Removed"); load(); }
    catch { toast.error("Failed"); }
  };

  const openReviews = async (vendor: any) => {
    try {
      const r = await vendorAPI.getReviews(vendor.id);
      setReviews(r.data.reviews || []);
      setShowReview(vendor);
    } catch { toast.error("Failed to load reviews"); }
  };

  const filtered = vendors.filter(v => {
    const matchSearch = `${v.name} ${v.contact_person || ""} ${v.services || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || v.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, catFilter]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />);
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wrench className="w-6 h-6 text-indigo-500" /> Vendor Directory</h1>
          <p className="text-gray-400 text-sm mt-1">{vendors.length} registered vendors</p>
        </div>
        {isAdmin && <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200"><Plus className="w-4 h-4" /> Add Vendor</button>}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search vendors..." /></div>
        <div className="flex gap-2 flex-wrap">{["ALL", ...CATEGORIES].map(c => <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${catFilter === c ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{c.replace(/_/g, " ")}</button>)}</div>
      </div>

      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}</div> : paginated.length === 0 ? (
        <div className="text-center py-16"><Wrench className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No vendors found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">{v.category === "PLUMBER" ? "🔧" : v.category === "ELECTRICIAN" ? "💡" : v.category === "CARPENTER" ? "🪚" : v.category === "PAINTER" ? "🎨" : v.category === "CLEANING" ? "🧹" : v.category === "PEST_CONTROL" ? "🐜" : v.category === "GARDENER" ? "🌿" : v.category === "SECURITY" ? "🛡️" : v.category === "AC_REPAIR" ? "❄️" : "🔧"}</div>
                <div className="flex items-center gap-1">{v.is_verified && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-semibold">Verified</span>}</div>
              </div>
              <h3 className="font-bold text-gray-900 mt-3">{v.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{v.category?.replace(/_/g, " ")}</p>
              <div className="flex items-center gap-1 mt-2">{renderStars(Math.round(v.rating || 0))}<span className="text-xs text-gray-500 ml-1">({v.total_ratings || 0})</span></div>
              <div className="mt-3 space-y-1.5">
                {v.contact_person && <div className="flex items-center gap-2 text-xs text-gray-600"><User className="w-3.5 h-3.5 text-gray-400" />{v.contact_person}</div>}
                {v.phone && <div className="flex items-center gap-2 text-xs text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{v.phone}</div>}
                {v.email && <div className="flex items-center gap-2 text-xs text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{v.email}</div>}
                {v.address && <div className="flex items-center gap-2 text-xs text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400" />{v.address}</div>}
              </div>
              {v.services?.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{v.services.slice(0, 3).map((s: string, i: number) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{s}</span>)}</div>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => openReviews(v)} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">Reviews</button>
                {isAdmin && <button onClick={() => handleDelete(v.id)} className="ml-auto text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />

      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Add Vendor</h2><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Person</label><input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div><div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Services (comma-separated)</label><input value={form.services} onChange={e => setForm({ ...form, services: e.target.value })} placeholder="Pipe repair, Leak fixing" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Hourly Rate (₹)</label><input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Add Vendor</button></div>
            </form>
          </div>
        </div>
      )}

      {showReview && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-900">Reviews for {showReview.name}</h2><button onClick={() => setShowReview(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {reviews.length === 0 ? <p className="text-center py-8 text-gray-400">No reviews yet</p> : reviews.map(r => (
                <div key={r.id} className="border-b border-gray-50 pb-4"><div className="flex items-center gap-2">{renderStars(r.rating)}<span className="text-xs font-semibold text-gray-700">{r.first_name} {r.last_name?.[0]}.</span><span className="text-xs text-gray-400">{r.flat_number ? `Wing ${r.wing} - ${r.flat_number}` : ""}</span></div>{r.review && <p className="text-sm text-gray-600 mt-1.5">{r.review}</p>}<p className="text-xs text-gray-400 mt-1">{formatDate(r.created_at)}</p></div>
              ))}
            </div>
            <form onSubmit={handleRate} className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3"><label className="text-xs font-semibold text-gray-600">Your Rating</label><div className="flex gap-1">{[1,2,3,4,5].map(s => <button type="button" key={s} onClick={() => setRatingForm({ ...ratingForm, rating: s })}><Star className={`w-4 h-4 ${s <= ratingForm.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} /></button>)}</div></div>
              <textarea value={ratingForm.review} onChange={e => setRatingForm({ ...ratingForm, review: e.target.value })} placeholder="Share your experience..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-20 resize-none mb-3" />
              <div className="flex gap-3"><button type="button" onClick={() => setShowReview(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Close</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Submit</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
