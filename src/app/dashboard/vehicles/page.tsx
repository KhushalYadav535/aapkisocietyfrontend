"use client";

import React, { useState, useEffect } from "react";
import { vehicleAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Car, Plus, Search, X, Trash2, ParkingSquare, CheckCircle } from "lucide-react";

const VEHICLE_TYPES = ["CAR", "BIKE", "SCOTTY", "BICYCLE", "OTHER"];

export default function VehiclesPage() {
  const { user } = useAuth();
  const isAdmin = ["ADMIN", "COMMITTEE", "PLATFORM_ADMIN"].includes(user?.role || "");

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vehicles" | "parking">("vehicles");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Register vehicle modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ vehicle_number: "", vehicle_type: "CAR", make_model: "", color: "", parking_slot: "" });

  // Add parking slot modal
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({ slot_number: "", slot_type: "CAR", floor: "", section: "" });

  // Assign slot modal
  const [assigningVehicle, setAssigningVehicle] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [v, s] = await Promise.all([vehicleAPI.getAll(), vehicleAPI.getParkingSlots()]);
      setVehicles(v.data.vehicles || []);
      setSlots(s.data.slots || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleAPI.create({ ...form, flat_id: user?.id });
      toast.success("Vehicle registered!");
      setShowAdd(false);
      setForm({ vehicle_number: "", vehicle_type: "CAR", make_model: "", color: "", parking_slot: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this vehicle?")) return;
    try { await vehicleAPI.delete(id); toast.success("Removed"); load(); }
    catch { toast.error("Failed"); }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleAPI.createParkingSlot(slotForm);
      toast.success("Parking slot added!");
      setShowAddSlot(false);
      setSlotForm({ slot_number: "", slot_type: "CAR", floor: "", section: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to add slot"); }
  };

  const handleAssignSlot = async () => {
    if (!selectedSlot || !assigningVehicle) return;
    try {
      // Update the vehicle with the parking slot number
      await vehicleAPI.update(assigningVehicle.id, { parking_slot: selectedSlot });
      toast.success(`Slot ${selectedSlot} assigned to ${assigningVehicle.vehicle_number}!`);
      setAssigningVehicle(null);
      setSelectedSlot("");
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to assign slot"); }
  };

  const filtered = vehicles.filter(v => {
    const matchSearch = `${v.vehicle_number} ${v.make_model || ""} ${v.color || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || v.vehicle_type === typeFilter;
    return matchSearch && matchType;
  });

  // Available slots for the vehicle's type
  const availableSlotsForVehicle = assigningVehicle
    ? slots.filter(s => s.slot_type === assigningVehicle.vehicle_type && s.is_available)
    : [];

  const getTypeIcon = (type: string): React.ReactNode =>
    type === "CAR" ? <Car className="w-6 h-6 text-indigo-600" /> :
    type === "BIKE" ? "🏍️" :
    type === "SCOTTY" ? "🛵" : "🚲";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Car className="w-6 h-6 text-indigo-500" /> Vehicles & Parking</h1>
          <p className="text-gray-400 text-sm mt-1">{vehicles.length} registered vehicles · {slots.filter(s => s.is_available).length} slots available</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Register Vehicle
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab("vehicles")} className={`pb-3 px-4 text-sm font-medium ${activeTab === "vehicles" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Registered Vehicles ({vehicles.length})</button>
        <button onClick={() => setActiveTab("parking")} className={`pb-3 px-4 text-sm font-medium ${activeTab === "parking" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Parking Slots ({slots.length})</button>
      </div>

      {activeTab === "vehicles" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search by number plate..." /></div>
            <div className="flex gap-2 flex-wrap">{["ALL", ...VEHICLE_TYPES].map(t => <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${typeFilter === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{t}</button>)}</div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16"><Car className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No vehicles found</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(v => (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">{getTypeIcon(v.vehicle_type)}</div>
                      <div>
                        <p className="font-bold text-gray-900 font-mono tracking-wide">{v.vehicle_number}</p>
                        <p className="text-xs text-gray-500">{v.vehicle_type}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(v.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                    {v.make_model && <p className="text-sm text-gray-600">{v.make_model}</p>}
                    {v.color && <p className="text-xs text-gray-400">{v.color}</p>}
                    <div className="flex items-center justify-between mt-2">
                      {v.parking_slot ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                          <ParkingSquare className="w-3 h-3" /> Slot {v.parking_slot}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No slot assigned</span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => { setAssigningVehicle(v); setSelectedSlot(v.parking_slot || ""); }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                        >
                          <ParkingSquare className="w-3 h-3" /> {v.parking_slot ? "Change Slot" : "Assign Slot"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "parking" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => setShowAddSlot(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all">
                <Plus className="w-4 h-4" /> Add Parking Slot
              </button>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">{["Slot #", "Type", "Floor", "Section", "Status", "Vehicle"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {slots.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                      <ParkingSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      No parking slots configured.{isAdmin && " Click \"Add Parking Slot\" to create one."}
                    </td></tr>
                  ) : slots.map(s => {
                    const assignedVehicle = vehicles.find(v => v.parking_slot === s.slot_number && v.vehicle_type === s.slot_type);
                    return (
                      <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-bold text-gray-900">{s.slot_number}</td>
                        <td className="px-4 py-3 text-gray-600">{s.slot_type}</td>
                        <td className="px-4 py-3 text-gray-500">{s.floor || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{s.section || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${s.is_available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {s.is_available ? "Available" : "Occupied"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{assignedVehicle?.vehicle_number || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Register Vehicle Modal */}
      {showAdd && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Register Vehicle</h2><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Vehicle Number *</label><input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })} required placeholder="MH01AB1234" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label><select value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value, parking_slot: "" })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Make & Model</label><input value={form.make_model} onChange={e => setForm({ ...form, make_model: e.target.value })} placeholder="Maruti Swift" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Color</label><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="White" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Parking Slot (optional)</label>
                <select value={form.parking_slot} onChange={e => setForm({ ...form, parking_slot: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                  <option value="">No slot</option>
                  {slots.filter(s => s.slot_type === form.vehicle_type && s.is_available).map(s => (
                    <option key={s.id} value={s.slot_number}>Slot {s.slot_number}{s.floor ? ` · Floor ${s.floor}` : ""}{s.section ? ` · ${s.section}` : ""}</option>
                  ))}
                </select>
                {slots.filter(s => s.slot_type === form.vehicle_type && s.is_available).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No available {form.vehicle_type} slots. Add slots from the Parking Slots tab.</p>
                )}
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">Register</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parking Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Add Parking Slot</h2><button onClick={() => setShowAddSlot(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Slot Number *</label><input value={slotForm.slot_number} onChange={e => setSlotForm({ ...slotForm, slot_number: e.target.value.toUpperCase() })} required placeholder="A1 or P-101" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Slot Type</label><select value={slotForm.slot_type} onChange={e => setSlotForm({ ...slotForm, slot_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Floor</label><input value={slotForm.floor} onChange={e => setSlotForm({ ...slotForm, floor: e.target.value })} placeholder="B1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Section</label><input value={slotForm.section} onChange={e => setSlotForm({ ...slotForm, section: e.target.value })} placeholder="North" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              </div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAddSlot(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200">Add Slot</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Slot Modal */}
      {assigningVehicle && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Assign Parking Slot</h2>
              <button onClick={() => setAssigningVehicle(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="mb-4 p-3 bg-indigo-50 rounded-xl">
              <p className="text-xs text-indigo-500 font-semibold">VEHICLE</p>
              <p className="font-bold text-indigo-900 font-mono">{assigningVehicle.vehicle_number}</p>
              <p className="text-xs text-indigo-600">{assigningVehicle.vehicle_type} · {assigningVehicle.make_model || "—"}</p>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600">Select Available Slot</label>
              {availableSlotsForVehicle.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <ParkingSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No available {assigningVehicle.vehicle_type} slots.</p>
                  <p className="text-xs mt-1">Add slots from the Parking Slots tab first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlotsForVehicle.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSlot(s.slot_number)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${selectedSlot === s.slot_number ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}
                    >
                      <ParkingSquare className={`w-5 h-5 mx-auto mb-1 ${selectedSlot === s.slot_number ? "text-indigo-600" : "text-gray-400"}`} />
                      <p className="text-xs font-bold text-gray-900">{s.slot_number}</p>
                      {s.floor && <p className="text-xs text-gray-400">Fl.{s.floor}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAssigningVehicle(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssignSlot} disabled={!selectedSlot} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}