"use client";

import { useState, useEffect, useMemo } from "react";
import { marketplaceAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getWhatsAppUrl } from "@/lib/phone";
import {
  ShoppingBag, Plus, Search, MessageSquare, Phone, Tag,
  Sparkles, CheckCircle2, AlertCircle, Trash2, X, Filter,
  Share2, Heart, Armchair, Laptop, Car, Baby, BookOpen, Gift, MoreHorizontal
} from "lucide-react";

interface MarketplaceItem {
  id: string;
  society_id: string;
  seller_id: string;
  seller_name: string;
  seller_flat: string;
  seller_wing: string;
  seller_phone?: string;
  title: string;
  description?: string;
  category: string;
  listing_type: "SELL" | "RENT" | "FREE";
  price: number;
  original_price?: number;
  condition: "BRAND_NEW" | "LIKE_NEW" | "GOOD" | "FAIR";
  photos?: string[];
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  created_at: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All Items", icon: ShoppingBag },
  { id: "FURNITURE", label: "Furniture", icon: Armchair },
  { id: "ELECTRONICS", label: "Electronics", icon: Laptop },
  { id: "APPLIANCES", label: "Appliances", icon: Sparkles },
  { id: "VEHICLES", label: "Vehicles / Cycles", icon: Car },
  { id: "KIDS_TOYS", label: "Kids & Toys", icon: Baby },
  { id: "BOOKS_SPORTS", label: "Books & Sports", icon: BookOpen },
  { id: "FREE_GIVEAWAY", label: "Free Giveaway", icon: Gift },
  { id: "OTHER", label: "Others", icon: Tag },
];

const CONDITION_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  BRAND_NEW: { label: "Brand New", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  LIKE_NEW:  { label: "Like New", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  GOOD:      { label: "Good Condition", color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  FAIR:      { label: "Fair / Used", color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewFilter, setViewFilter] = useState<"ALL" | "MINE">("ALL");

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  // Form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "FURNITURE",
    listing_type: "SELL",
    price: "",
    original_price: "",
    condition: "LIKE_NEW",
    seller_phone: user?.phone || "",
    photoUrlInput: ""
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await marketplaceAPI.getAll({
        mine: viewFilter === "MINE" ? "true" : undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined
      });
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load marketplace items", err);
      toast.error("Failed to load marketplace items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedCategory, viewFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required");

    const photos = formData.photoUrlInput.trim() ? [formData.photoUrlInput.trim()] : [];

    try {
      await marketplaceAPI.create({
        ...formData,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        photos
      });
      toast.success("Item posted on Society Marketplace!");
      setShowPostModal(false);
      setFormData({
        title: "",
        description: "",
        category: "FURNITURE",
        listing_type: "SELL",
        price: "",
        original_price: "",
        condition: "LIKE_NEW",
        seller_phone: user?.phone || "",
        photoUrlInput: ""
      });
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to list item");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await marketplaceAPI.updateStatus(id, status);
      toast.success(`Item marked as ${status.toLowerCase()}`);
      loadItems();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    try {
      await marketplaceAPI.deleteListing(id);
      toast.success("Listing removed");
      loadItems();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  // Filtered
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.seller_name.toLowerCase().includes(q) ||
        item.seller_flat.toLowerCase().includes(q);

      return matchSearch;
    });
  }, [items, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Society Marketplace &amp; Classifieds</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/50">
              Residents Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Buy, sell, rent, and share pre-loved goods safely with your verified society neighbours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setViewFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewFilter === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All Society Listings
            </button>
            <button
              onClick={() => setViewFilter("MINE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewFilter === "MINE"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              My Listings
            </button>
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Post an Item
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search listings by keyword, furniture, appliance, flat number..."
          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
        />
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 shadow-sm">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No items listed in this category</p>
          <p className="text-xs text-slate-400 mt-1">Be the first resident to post an item for your community!</p>
          <button
            onClick={() => setShowPostModal(true)}
            className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold"
          >
            Post Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const isOwner = user?.id === item.seller_id || ["ADMIN", "PLATFORM_ADMIN"].includes(user?.role || "");
            const cond = CONDITION_COLORS[item.condition] || CONDITION_COLORS.GOOD;
            const photo = item.photos && item.photos.length > 0 ? item.photos[0] : null;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Photo or Graphic Header */}
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {photo ? (
                      <img
                        src={photo}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                        <ShoppingBag className="w-10 h-10 mb-1" />
                        <span className="text-[11px] font-semibold">Society Classified</span>
                      </div>
                    )}

                    {/* Condition Chip */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-sm border border-white/20 backdrop-blur-md ${cond.bg} ${cond.color}`}>
                        {cond.label}
                      </span>
                    </div>

                    {/* Status Chip */}
                    {item.status !== "AVAILABLE" && (
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-sm ${
                          item.status === "SOLD" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{item.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {item.listing_type === "FREE" ? (
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">FREE GIVEAWAY</span>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            {formatCurrency(item.price)}
                          </span>
                          {item.original_price && item.original_price > item.price && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {formatCurrency(item.original_price)}
                            </span>
                          )}
                          {item.listing_type === "RENT" && (
                            <span className="text-xs text-slate-400 font-medium">/ month</span>
                          )}
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Verified Seller Chip */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.seller_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.seller_wing ? `Wing ${item.seller_wing} - ` : ""}Unit {item.seller_flat}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                        Verified Resident
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 pb-5 pt-0">
                  {isOwner ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {item.status === "AVAILABLE" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "RESERVED")}
                            className="flex-1 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 rounded-xl hover:bg-amber-100"
                          >
                            Mark Reserved
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "SOLD")}
                            className="flex-1 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 rounded-xl hover:bg-emerald-100"
                          >
                            Mark Sold
                          </button>
                        </>
                      )}
                      {item.status !== "AVAILABLE" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "AVAILABLE")}
                          className="flex-1 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100"
                        >
                          Relist Item
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <a
                        href={getWhatsAppUrl(
                          item.seller_phone,
                          `Hi ${item.seller_name}, I saw your listing for "${item.title}" on AapkiSociety Marketplace. Is it still available?`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat on WhatsApp
                      </a>
                      {item.seller_phone && (
                        <a
                          href={`tel:${item.seller_phone}`}
                          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center transition-colors"
                          title="Call Seller"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Item Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 sm:p-7 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Post Item on Marketplace</h2>
                  <p className="text-xs text-slate-400">Sell, rent, or give away items to your neighbours</p>
                </div>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Item Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Solid Teakwood Coffee Table / Kid Bicycle"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="FURNITURE">Furniture</option>
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="APPLIANCES">Home Appliances</option>
                    <option value="VEHICLES">Vehicles / Cycles</option>
                    <option value="KIDS_TOYS">Kids &amp; Toys</option>
                    <option value="BOOKS_SPORTS">Books &amp; Sports</option>
                    <option value="FREE_GIVEAWAY">Free Giveaway</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Listing Type *</label>
                  <select
                    value={formData.listing_type}
                    onChange={e => setFormData({ ...formData, listing_type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="SELL">For Sale</option>
                    <option value="RENT">For Rent</option>
                    <option value="FREE">Free Giveaway</option>
                  </select>
                </div>
              </div>

              {formData.listing_type !== "FREE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 2500"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Original / Purchase Price (₹)</label>
                    <input
                      type="number"
                      value={formData.original_price}
                      onChange={e => setFormData({ ...formData, original_price: e.target.value })}
                      placeholder="e.g. 8000"
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Item Condition</label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="BRAND_NEW">Brand New / Unused</option>
                    <option value="LIKE_NEW">Like New (Mint Condition)</option>
                    <option value="GOOD">Good / Gently Used</option>
                    <option value="FAIR">Fair / Functional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Phone #</label>
                  <input
                    type="text"
                    value={formData.seller_phone}
                    onChange={e => setFormData({ ...formData, seller_phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Photo Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.photoUrlInput}
                  onChange={e => setFormData({ ...formData, photoUrlInput: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description &amp; Details</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe dimensions, reasons for selling, pick-up time from flat..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  List Item Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
