"use client";

import { useState, useEffect } from "react";
import { societyAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Building, Plus, X, Home, Building2, AlignJustify } from "lucide-react";

interface Wing { id: string; name: string; total_floors: number; flats_per_floor: number; created_at: string; }
interface Flat { id: string; wing_id: string; flat_number: string; floor_number: number; area_sqft: number; flat_type: string; is_occupied: number; }

export default function PropertiesPage() {
  const { user } = useAuth();
  const [wings, setWings] = useState<Wing[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddWing, setShowAddWing] = useState(false);
  const [wingForm, setWingForm] = useState({ name: "", total_floors: "", flats_per_floor: "" });

  const [showAddFlat, setShowAddFlat] = useState(false);
  const [flatForm, setFlatForm] = useState({ wing_id: "", flat_number: "", floor_number: "", area_sqft: "", flat_type: "2BHK" });

  useEffect(() => {
    if (user?.society_id) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.society_id) return;
    setLoading(true);
    try {
      const [wRes, fRes] = await Promise.all([
        societyAPI.getWings(user.society_id),
        societyAPI.getFlats(user.society_id)
      ]);
      setWings(wRes.data.wings || []);
      setFlats(fRes.data.flats || []);
    } catch { toast.error("Failed to load property data"); }
    finally { setLoading(false); }
  };

  const handleAddWing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.society_id) return;
    try {
      await societyAPI.addWing(user.society_id, {
        name: wingForm.name,
        total_floors: parseInt(wingForm.total_floors) || 0,
        flats_per_floor: parseInt(wingForm.flats_per_floor) || 0,
      });
      toast.success("Wing added!");
      setShowAddWing(false);
      setWingForm({ name: "", total_floors: "", flats_per_floor: "" });
      loadData();
    } catch { toast.error("Failed to add wing"); }
  };

  const handleAddFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.society_id) return;
    try {
      await societyAPI.addFlat(user.society_id, {
        ...flatForm,
        floor_number: parseInt(flatForm.floor_number) || 0,
        area_sqft: parseInt(flatForm.area_sqft) || 0,
      });
      toast.success("Flat added!");
      setShowAddFlat(false);
      setFlatForm({ wing_id: "", flat_number: "", floor_number: "", area_sqft: "", flat_type: "2BHK" });
      loadData();
    } catch { toast.error("Failed to add flat"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-500" /> Property Setup
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage Wings, Floors, and Flats in your society</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddWing(true)} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border border-indigo-200">
            <Plus className="w-4 h-4" /> Add Wing
          </button>
          <button onClick={() => { if(wings.length===0){ toast.error("Please add a Wing first!"); return; } setFlatForm(p=>({...p, wing_id: wings[0].id})); setShowAddFlat(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4" /> Add Flat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 animate-slide-up">
        {[{label:"Total Wings", val: wings.length, icon: Building2, color:"bg-indigo-50 text-indigo-600"},
          {label:"Total Flats", val: flats.length, icon: Home, color:"bg-blue-50 text-blue-600"},
          {label:"Occupied Flats", val: flats.filter(f=>f.is_occupied).length, icon: AlignJustify, color:"bg-emerald-50 text-emerald-600"}].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-6 h-6" /></div>
            <div><p className="text-xs text-gray-500 font-semibold">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i)=><div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : wings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><Building className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No wings added yet. Start by adding a wing.</p></div>
      ) : (
        <div className="space-y-6">
          {wings.map(wing => {
            const wingFlats = flats.filter(f => f.wing_id === wing.id).sort((a,b)=>parseInt(a.flat_number)-parseInt(b.flat_number));
            return (
              <div key={wing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Wing {wing.name}</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">{wingFlats.length} Flats</span>
                </div>
                <div className="p-5">
                  {wingFlats.length === 0 ? (
                    <p className="text-sm text-gray-400">No flats in this wing yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {wingFlats.map(f => (
                        <div key={f.id} className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${f.is_occupied ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300" : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md"}`}>
                          <Home className={`w-5 h-5 mb-1 ${f.is_occupied ? "text-emerald-500" : "text-gray-400"}`} />
                          <span className="font-bold text-gray-900">{f.flat_number}</span>
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{f.flat_type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Wing Modal */}
      {showAddWing && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-gray-900">Add New Wing</h2></div><button onClick={() => setShowAddWing(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAddWing} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Wing Name/Letter *</label><input value={wingForm.name} onChange={e=>setWingForm(p=>({...p,name:e.target.value.toUpperCase()}))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="A, B, or Tower 1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Floors</label><input type="number" value={wingForm.total_floors} onChange={e=>setWingForm(p=>({...p,total_floors:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="10" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Flats/Floor</label><input type="number" value={wingForm.flats_per_floor} onChange={e=>setWingForm(p=>({...p,flats_per_floor:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="4" /></div>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAddWing(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Save Wing</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flat Modal */}
      {showAddFlat && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-gray-900">Add Flat</h2></div><button onClick={() => setShowAddFlat(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAddFlat} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Wing *</label><select required value={flatForm.wing_id} onChange={e=>setFlatForm(p=>({...p,wing_id:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{wings.map(w=><option key={w.id} value={w.id}>Wing {w.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Flat Number *</label><input required value={flatForm.flat_number} onChange={e=>setFlatForm(p=>({...p,flat_number:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="101" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Floor</label><input type="number" value={flatForm.floor_number} onChange={e=>setFlatForm(p=>({...p,floor_number:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Flat Type</label><select value={flatForm.flat_type} onChange={e=>setFlatForm(p=>({...p,flat_type:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{["1BHK","2BHK","3BHK","4BHK","Penthouse","Shop"].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Area (Sq.ft)</label><input type="number" value={flatForm.area_sqft} onChange={e=>setFlatForm(p=>({...p,area_sqft:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1000" /></div>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShowAddFlat(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Save Flat</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
