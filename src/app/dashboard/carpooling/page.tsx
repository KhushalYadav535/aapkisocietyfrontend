"use client";

import { useState, useEffect } from "react";
import { carpoolAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { getWhatsAppUrl } from "@/lib/phone";
import {
  Car,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  Phone,
  MessageCircle,
  CheckCircle2,
  X,
  Filter,
  ShieldCheck,
  AlertCircle,
  Share2,
  Trash2
} from "lucide-react";

interface Carpool {
  id: string;
  society_id: string;
  driver_id: string;
  driver_name: string;
  driver_flat: string;
  driver_wing: string;
  driver_phone: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  vehicle_type: string;
  vehicle_number: string;
  available_seats: number;
  cost_per_seat: number;
  notes: string;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

export default function CarpoolingPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Carpool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "TODAY" | "MY_RIDES">("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    origin: "Society Main Gate",
    destination: "",
    departure_date: new Date().toISOString().split("T")[0],
    departure_time: "08:30",
    vehicle_type: "CAR",
    vehicle_number: "",
    available_seats: "3",
    cost_per_seat: "0",
    notes: ""
  });

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await carpoolAPI.getAll();
      setRides(res.data?.carpools || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load carpool rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) {
      toast.error("Please enter a destination");
      return;
    }
    try {
      setSubmitting(true);
      await carpoolAPI.create(form);
      toast.success("Carpool ride offered to society!");
      setShowCreateModal(false);
      setForm({
        origin: "Society Main Gate",
        destination: "",
        departure_date: new Date().toISOString().split("T")[0],
        departure_time: "08:30",
        vehicle_type: "CAR",
        vehicle_number: "",
        available_seats: "3",
        cost_per_seat: "0",
        notes: ""
      });
      fetchRides();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create carpool");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await carpoolAPI.updateStatus(id, status);
      toast.success(`Ride marked as ${status.toLowerCase()}`);
      fetchRides();
    } catch (err: any) {
      toast.error("Failed to update ride status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this carpool offer?")) return;
    try {
      await carpoolAPI.deleteCarpool(id);
      toast.success("Ride offer removed");
      fetchRides();
    } catch (err: any) {
      toast.error("Failed to delete ride");
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredRides = rides.filter((r) => {
    const matchesSearch =
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.driver_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "TODAY") {
      const rideDate = r.departure_date ? r.departure_date.split("T")[0] : "";
      return rideDate === todayStr;
    }
    if (filterType === "MY_RIDES") {
      return r.driver_id === user?.id;
    }
    return true;
  });

  const getWhatsAppLink = (ride: Carpool) => {
    const myName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Resident";
    const myFlat = user?.flat_number ? `Flat ${user.wing ? user.wing + "-" : ""}${user.flat_number}` : "Neighbor";
    const msg = `Hi ${ride.driver_name}! I am ${myName} from ${myFlat}. I saw your carpool ride on AapkiSociety to ${ride.destination} on ${ride.departure_date} at ${ride.departure_time}. Are seats still available?`;
    return getWhatsAppUrl(ride.driver_phone, msg);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold uppercase tracking-wider">
            <Car className="w-3.5 h-3.5 text-emerald-200" />
            Zero Commission • Eco-Friendly
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Society Carpooling & Rides</h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Share daily office commutes, airport runs, or weekend trips with verified society neighbors. Save fuel, cut traffic, and travel securely.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="relative z-10 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-800 font-semibold hover:bg-emerald-50 active:scale-95 transition-all shadow-md shrink-0"
        >
          <Plus className="w-5 h-5 text-emerald-600" />
          Offer a Ride
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search destination, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              filterType === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All Rides ({rides.length})
          </button>
          <button
            onClick={() => setFilterType("TODAY")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              filterType === "TODAY"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Today's Commutes
          </button>
          <button
            onClick={() => setFilterType("MY_RIDES")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              filterType === "MY_RIDES"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            My Offered Rides
          </button>
        </div>
      </div>

      {/* Rides Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No Carpool Rides Found</h3>
          <p className="text-sm text-slate-500 mb-6">
            Be the first neighbor to offer a ride today! Share your office commute or route.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Offer a Ride Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRides.map((ride) => {
            const isMyRide = ride.driver_id === user?.id;
            const isOpen = ride.status === "OPEN";

            return (
              <div
                key={ride.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Status & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        ride.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-800"
                          : ride.status === "FULL"
                          ? "bg-amber-100 text-amber-800"
                          : ride.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ride.status}
                    </span>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">
                      {ride.cost_per_seat > 0 ? (
                        <>
                          <IndianRupee className="w-3.5 h-3.5" />
                          {ride.cost_per_seat} / seat
                        </>
                      ) : (
                        <span className="text-emerald-700 font-bold">FREE RIDE</span>
                      )}
                    </span>
                  </div>

                  {/* Origin & Destination */}
                  <div className="space-y-2 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-400 block text-[10px] uppercase">From</span>
                        <span className="font-medium text-slate-800">{ride.origin}</span>
                      </div>
                    </div>
                    <div className="w-[1px] h-3 bg-slate-200 ml-1" />
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-400 block text-[10px] uppercase">To</span>
                        <span className="font-semibold text-slate-900 text-sm">{ride.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date, Time & Vehicle */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ride.departure_date ? ride.departure_date.split("T")[0] : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{ride.departure_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {ride.vehicle_type} {ride.vehicle_number ? `(${ride.vehicle_number})` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ride.available_seats} seats open</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {ride.notes && (
                    <p className="text-xs text-slate-500 italic bg-amber-50/50 border border-amber-100/80 p-2 rounded-lg mb-4">
                      "{ride.notes}"
                    </p>
                  )}

                  {/* Driver Profile */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {ride.driver_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{ride.driver_name}</div>
                        <div className="text-[10px] text-slate-400">
                          Flat {ride.driver_wing ? `${ride.driver_wing}-` : ""}
                          {ride.driver_flat}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  {isMyRide ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      {ride.status === "OPEN" ? (
                        <button
                          onClick={() => handleStatusChange(ride.id, "FULL")}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                        >
                          Mark Full
                        </button>
                      ) : ride.status === "FULL" ? (
                        <button
                          onClick={() => handleStatusChange(ride.id, "OPEN")}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                        >
                          Reopen Seats
                        </button>
                      ) : null}

                      {ride.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleStatusChange(ride.id, "COMPLETED")}
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                        >
                          Finish
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(ride.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete ride"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <a
                      href={getWhatsAppLink(ride)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200" />
                      Chat / Book on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offer a Ride Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Offer a Society Ride</h2>
                <p className="text-xs text-slate-500">Post your commute details to share with neighbors</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Starting Point (Origin)
                </label>
                <input
                  type="text"
                  required
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  placeholder="e.g. Society Main Gate / Wing B"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="e.g. Cyber Hub Gurgaon, BKC Mumbai, Airport"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.departure_date}
                    onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    required
                    value={form.departure_time}
                    onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="CAR">Car / Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                    <option value="BIKE">Two Wheeler / Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.vehicle_number}
                    onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                    placeholder="e.g. DL 1C AB 1234"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Available Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={form.available_seats}
                    onChange={(e) => setForm({ ...form, available_seats: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cost per Seat (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.cost_per_seat}
                    onChange={(e) => setForm({ ...form, cost_per_seat: e.target.value })}
                    placeholder="0 for Free"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. AC will be on, please be on time at Gate 1, boot space available"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Ride Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
