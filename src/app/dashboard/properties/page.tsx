"use client";

import { useState, useEffect } from "react";
import { societyAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Building, Plus, X, Home, Building2, AlignJustify, Info } from "lucide-react";

interface Wing { id: string; name: string; total_floors: number; flats_per_floor: number; created_at: string; }
interface Flat { 
  id: string; wing_id: string; flat_number: string; floor_number: number; 
  area_sqft: number; flat_type: string; is_occupied: number; 
  unit_category?: string; unit_subtype?: string; occupancy_type?: string; 
  ownership_type?: string; rera_unit_id?: string; super_builtup_area?: number; 
  carpet_area?: number; uds_sqft?: number; maintenance_slab?: string; 
  vastu_facing?: string; meter_numbers?: string; gst_applicable?: number; 
  occupancy_certificate_status?: string;
}

const defaultFlatForm = { 
  wing_id: "", flat_number: "", floor_number: "", area_sqft: "", 
  flat_type: "2 BHK", unit_category: "Residential", unit_subtype: "Standard",
  occupancy_type: "Owner Occupied", ownership_type: "Freehold", rera_unit_id: "",
  super_builtup_area: "", carpet_area: "", uds_sqft: "", maintenance_slab: "",
  vastu_facing: "", meter_numbers: "", gst_applicable: false, occupancy_certificate_status: ""
};

export default function PropertiesPage() {
  const { user, hasPermission } = useAuth();
  const [wings, setWings] = useState<Wing[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [masters, setMasters] = useState<{
    unit_category_master: any[];
    unit_type_master: any[];
    unit_subtype_master: any[];
    occupancy_type_master: any[];
    ownership_type_master: any[];
  }>({
    unit_category_master: [], unit_type_master: [], unit_subtype_master: [],
    occupancy_type_master: [], ownership_type_master: []
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddWing, setShowAddWing] = useState(false);
  const [wingForm, setWingForm] = useState({ name: "", total_floors: "", flats_per_floor: "" });

  const [showAddFlat, setShowAddFlat] = useState(false);
  const [flatForm, setFlatForm] = useState(defaultFlatForm);

  useEffect(() => {
    if (user?.society_id) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.society_id) return;
    setLoading(true);
    try {
      const [wRes, fRes, mRes] = await Promise.all([
        societyAPI.getWings(user.society_id),
        societyAPI.getFlats(user.society_id),
        societyAPI.getHomeTypeMasters()
      ]);
      setWings(wRes.data.wings || []);
      setFlats(fRes.data.flats || []);
      if (mRes.data) {
        setMasters(mRes.data);
      }
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
        area_sqft: parseInt(flatForm.carpet_area) || parseInt(flatForm.super_builtup_area) || parseInt(flatForm.area_sqft) || 0,
        super_builtup_area: parseInt(flatForm.super_builtup_area) || 0,
        carpet_area: parseInt(flatForm.carpet_area) || 0,
        uds_sqft: parseInt(flatForm.uds_sqft) || 0,
      });
      toast.success("Flat added!");
      setShowAddFlat(false);
      setFlatForm(defaultFlatForm);
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
                        <div key={f.id} className={`group relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${f.is_occupied ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300" : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md"}`}>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative group/tooltip">
                              <Info className="w-4 h-4 text-gray-400 hover:text-indigo-500 cursor-pointer" />
                              <div className="absolute z-10 hidden group-hover/tooltip:block w-48 bg-gray-900 text-white text-xs rounded-lg p-2 right-0 bottom-6 shadow-xl">
                                {f.unit_category && <p><strong>Category:</strong> {f.unit_category}</p>}
                                {f.occupancy_type && <p><strong>Occupancy:</strong> {f.occupancy_type}</p>}
                                {f.rera_unit_id && <p><strong>RERA:</strong> {f.rera_unit_id}</p>}
                                {f.carpet_area && <p><strong>Carpet:</strong> {f.carpet_area} sqft</p>}
                                {f.vastu_facing && <p><strong>Vastu:</strong> {f.vastu_facing}</p>}
                              </div>
                            </div>
                          </div>
                          <Home className={`w-5 h-5 mb-1 ${f.is_occupied ? "text-emerald-500" : "text-gray-400"}`} />
                          <span className="font-bold text-gray-900">{f.flat_number}</span>
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide truncate w-full text-center">{f.unit_category ? `${f.unit_category} - ${f.flat_type}` : f.flat_type}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
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

      {/* Add Flat Modal - Extended for Master Types */}
      {showAddFlat && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Flat / Unit</h2>
                <p className="text-sm text-gray-500 mt-1">Configure real estate properties with comprehensive master attributes</p>
              </div>
              <button onClick={() => setShowAddFlat(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddFlat} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Wing *</label>
                      <select required value={flatForm.wing_id} onChange={e=>setFlatForm(p=>({...p,wing_id:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                        {wings.map(w=><option key={w.id} value={w.id}>Wing {w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Floor</label>
                      <input type="number" value={flatForm.floor_number} onChange={e=>setFlatForm(p=>({...p,floor_number:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Flat Number *</label>
                    <input required value={flatForm.flat_number} onChange={e=>setFlatForm(p=>({...p,flat_number:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="101" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Category</label>
                      <select value={flatForm.unit_category} onChange={e=>setFlatForm(p=>({...p,unit_category:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                        {masters.unit_category_master.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Type</label>
                      <select value={flatForm.flat_type} onChange={e=>setFlatForm(p=>({...p,flat_type:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                        {masters.unit_type_master.filter(t => !flatForm.unit_category || t.category_id === flatForm.unit_category).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subtype / Parking</label>
                      <select value={flatForm.unit_subtype} onChange={e=>setFlatForm(p=>({...p,unit_subtype:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                        {masters.unit_subtype_master.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Occupancy Type</label>
                      <select value={flatForm.occupancy_type} onChange={e=>setFlatForm(p=>({...p,occupancy_type:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                        {masters.occupancy_type_master.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ownership Type</label>
                    <select value={flatForm.ownership_type} onChange={e=>setFlatForm(p=>({...p,ownership_type:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                      {masters.ownership_type_master.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                    </select>
                  </div>

                </div>

                {/* Right Column: Technical & India Specific Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Technical Details</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Carpet Area (Sq.ft)</label>
                      <input type="number" value={flatForm.carpet_area} onChange={e=>setFlatForm(p=>({...p,carpet_area:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1000" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Super Built-up (Sq.ft)</label>
                      <input type="number" value={flatForm.super_builtup_area} onChange={e=>setFlatForm(p=>({...p,super_builtup_area:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="1250" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">UDS (Sq.ft)</label>
                      <input type="number" value={flatForm.uds_sqft} onChange={e=>setFlatForm(p=>({...p,uds_sqft:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vastu Facing</label>
                      <select value={flatForm.vastu_facing} onChange={e=>setFlatForm(p=>({...p,vastu_facing:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                        <option value="">None</option>
                        {['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'].map(v=><option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">RERA Unit ID</label>
                    <input value={flatForm.rera_unit_id} onChange={e=>setFlatForm(p=>({...p,rera_unit_id:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="P518000XXXXX" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meter Numbers</label>
                      <input value={flatForm.meter_numbers} onChange={e=>setFlatForm(p=>({...p,meter_numbers:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Elec: M123, Water: W456" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Maintenance Slab</label>
                      <input value={flatForm.maintenance_slab} onChange={e=>setFlatForm(p=>({...p,maintenance_slab:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. SLAB_A" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="gst_applicable" checked={flatForm.gst_applicable} onChange={e=>setFlatForm(p=>({...p,gst_applicable:e.target.checked}))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="gst_applicable" className="text-sm font-semibold text-gray-700">GST Applicable on Maintenance (For Commercial/Large properties)</label>
                  </div>

                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={()=>setShowAddFlat(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
