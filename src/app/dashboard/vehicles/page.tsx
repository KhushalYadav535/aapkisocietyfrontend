"use client";

import React, { useState, useEffect } from "react";
import { vehicleAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { 
  Car, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  ParkingSquare, 
  CheckCircle, 
  Bike, 
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Hash
} from "lucide-react";

const VEHICLE_TYPES = ["CAR", "BIKE", "SCOTTY", "BICYCLE", "OTHER"];

export default function VehiclesPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission('VEHICLE_MANAGE');

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
      const normalizedSlots = (s.data.slots || []).map((slot: any) => ({
        ...slot,
        is_available: slot.is_available === true || slot.is_available === 1 || slot.is_available === 't',
      }));
      setSlots(normalizedSlots);
    } catch { 
      toast.error("Failed to load vehicles & parking slots"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleAPI.create({ ...form, flat_id: user?.id });
      toast.success("Vehicle registered successfully!");
      setShowAdd(false);
      setForm({ vehicle_number: "", vehicle_type: "CAR", make_model: "", color: "", parking_slot: "" });
      load();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Failed to register vehicle"); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vehicle?")) return;
    try { 
      await vehicleAPI.delete(id); 
      toast.success("Vehicle removed"); 
      load(); 
    } catch { 
      toast.error("Failed to remove vehicle"); 
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleAPI.createParkingSlot(slotForm);
      toast.success("Parking slot added successfully!");
      setShowAddSlot(false);
      setSlotForm({ slot_number: "", slot_type: "CAR", floor: "", section: "" });
      load();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Failed to add parking slot"); 
    }
  };

  const handleAssignSlot = async () => {
    if (!selectedSlot || !assigningVehicle) return;
    try {
      await vehicleAPI.update(assigningVehicle.id, { parking_slot: selectedSlot });
      toast.success(`Slot ${selectedSlot} assigned to ${assigningVehicle.vehicle_number}!`);
      setAssigningVehicle(null);
      setSelectedSlot("");
      load();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Failed to assign slot"); 
    }
  };

  const filtered = vehicles.filter(v => {
    const matchSearch = `${v.vehicle_number} ${v.make_model || ""} ${v.color || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || v.vehicle_type === typeFilter;
    return matchSearch && matchType;
  });

  const availableSlotsForVehicle = assigningVehicle
    ? slots.filter(s => s.slot_type === assigningVehicle.vehicle_type && s.is_available)
    : [];

  const availableSlotsCount = slots.filter(s => s.is_available).length;
  const occupiedSlotsCount = slots.filter(s => !s.is_available).length;

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Vehicles & Parking
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {vehicles.length} registered vehicles · {availableSlotsCount} of {slots.length} parking slots free
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {activeTab === "parking" ? (
              <button 
                onClick={() => setShowAddSlot(true)} 
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Parking Slot
              </button>
            ) : (
              <button 
                onClick={() => setShowAdd(true)} 
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Register Vehicle
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Bento Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Registered</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{vehicles.length}</span>
            <span className="text-xs font-medium text-slate-400">vehicles</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Free Parking Slots</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{availableSlotsCount}</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">available</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Occupied Slots</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ParkingSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{occupiedSlotsCount}</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">allocated</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 max-w-fit border border-slate-200/60 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab("vehicles")} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "vehicles" 
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Registered Vehicles ({vehicles.length})
        </button>
        <button 
          onClick={() => setActiveTab("parking")} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "parking" 
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Parking Slots & Matrix ({slots.length})
        </button>
      </div>

      {activeTab === "vehicles" && (
        <div className="space-y-4">
          {/* Search & Type Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none" 
                placeholder="Search by license number, model or color..." 
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 pl-1 pr-2 text-xs font-semibold text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Type:</span>
              </div>
              {["ALL", ...VEHICLE_TYPES].map(t => {
                const active = typeFilter === t;
                return (
                  <button 
                    key={t} 
                    onClick={() => setTypeFilter(t)} 
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      active 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center mx-auto mb-3.5 text-slate-400">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">No vehicles found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                {search || typeFilter !== "ALL" 
                  ? "No registered vehicle matches your current filter criteria." 
                  : "No vehicles have been registered yet. Add vehicles to allocate dedicated parking slots."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(v => (
                <div 
                  key={v.id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Plate + Delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-mono font-extrabold text-sm tracking-wider text-slate-900 dark:text-white">
                          {v.vehicle_number}
                        </span>
                      </div>

                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(v.id)} 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Remove Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Make & Model info */}
                    <div className="mt-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {v.make_model || "Unspecified Model"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                          {v.vehicle_type}
                        </span>
                        {v.color && (
                          <>
                            <span>•</span>
                            <span>{v.color}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Slot assignment section */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    {v.parking_slot ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 px-2.5 py-1 rounded-lg font-bold">
                        <ParkingSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Slot {v.parking_slot}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        No slot assigned
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => { setAssigningVehicle(v); setSelectedSlot(v.parking_slot || ""); }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1 hover:underline"
                      >
                        <ParkingSquare className="w-3.5 h-3.5" /> 
                        {v.parking_slot ? "Change Slot" : "Assign Slot"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "parking" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Parking Slot Inventory</h3>
                <p className="text-xs text-slate-400">All registered slots with real-time occupancy status</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slot #</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Floor</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Section</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Vehicle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {slots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400 text-xs">
                        <ParkingSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        No parking slots configured.{isAdmin && " Click \"Add Parking Slot\" to create one."}
                      </td>
                    </tr>
                  ) : slots.map(s => {
                    const assignedVehicle = vehicles.find(v => v.parking_slot === s.slot_number && v.vehicle_type === s.slot_type);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white font-mono">
                          {s.slot_number}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                          {s.slot_type}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {s.floor || "Ground"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {s.section || "General"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 ${
                            s.is_available 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50" 
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.is_available ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {s.is_available ? "Available" : "Occupied"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
                          {assignedVehicle ? (
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {assignedVehicle.vehicle_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Register Vehicle</h2>
              </div>
              <button 
                onClick={() => setShowAdd(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle Number Plate *
                </label>
                <input 
                  value={form.vehicle_number} 
                  onChange={e => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })} 
                  required 
                  placeholder="e.g. DL 01 AB 1234" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle Type
                </label>
                <select 
                  value={form.vehicle_type} 
                  onChange={e => setForm({ ...form, vehicle_type: e.target.value, parking_slot: "" })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Make & Model
                  </label>
                  <input 
                    value={form.make_model} 
                    onChange={e => setForm({ ...form, make_model: e.target.value })} 
                    placeholder="Hyundai Creta" 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Color
                  </label>
                  <input 
                    value={form.color} 
                    onChange={e => setForm({ ...form, color: e.target.value })} 
                    placeholder="Polar White" 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Parking Slot (Optional)
                </label>
                <select 
                  value={form.parking_slot} 
                  onChange={e => setForm({ ...form, parking_slot: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">No slot assigned</option>
                  {slots.filter(s => s.slot_type === form.vehicle_type && s.is_available).map(s => (
                    <option key={s.id} value={s.slot_number}>
                      Slot {s.slot_number}{s.floor ? ` · Floor ${s.floor}` : ""}{s.section ? ` · ${s.section}` : ""}
                    </option>
                  ))}
                </select>
                {slots.filter(s => s.slot_type === form.vehicle_type && s.is_available).length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    No available {form.vehicle_type} slots. You can assign one later.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parking Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ParkingSquare className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Parking Slot</h2>
              </div>
              <button 
                onClick={() => setShowAddSlot(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slot Number / Code *
                </label>
                <input 
                  value={slotForm.slot_number} 
                  onChange={e => setSlotForm({ ...slotForm, slot_number: e.target.value.toUpperCase() })} 
                  required 
                  placeholder="e.g. A-101 or B2-44" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slot Vehicle Type
                </label>
                <select 
                  value={slotForm.slot_type} 
                  onChange={e => setSlotForm({ ...slotForm, slot_type: e.target.value })} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Floor
                  </label>
                  <input 
                    value={slotForm.floor} 
                    onChange={e => setSlotForm({ ...slotForm, floor: e.target.value })} 
                    placeholder="e.g. Basement 1" 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Section
                  </label>
                  <input 
                    value={slotForm.section} 
                    onChange={e => setSlotForm({ ...slotForm, section: e.target.value })} 
                    placeholder="e.g. Block A" 
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddSlot(false)} 
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Slot Modal */}
      {assigningVehicle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ParkingSquare className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Assign Parking Slot</h2>
              </div>
              <button 
                onClick={() => setAssigningVehicle(null)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Vehicle</p>
              <p className="font-mono font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                {assigningVehicle.vehicle_number}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {assigningVehicle.vehicle_type} · {assigningVehicle.make_model || "—"}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Free Parking Slot
              </label>
              {availableSlotsForVehicle.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <ParkingSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No available {assigningVehicle.vehicle_type} slots.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Please create parking slots first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {availableSlotsForVehicle.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSlot(s.slot_number)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedSlot === s.slot_number 
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600" 
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <ParkingSquare className={`w-4 h-4 mx-auto mb-1 ${selectedSlot === s.slot_number ? "text-indigo-600" : "text-slate-400"}`} />
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{s.slot_number}</p>
                      {s.floor && <p className="text-[10px] text-slate-400">Fl.{s.floor}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button 
                type="button" 
                onClick={() => setAssigningVehicle(null)} 
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleAssignSlot} 
                disabled={!selectedSlot} 
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Confirm Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}