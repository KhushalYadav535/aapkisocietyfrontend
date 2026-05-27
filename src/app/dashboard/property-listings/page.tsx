"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { propertyListingAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Home, Plus, CheckCircle2, XCircle,
  Eye, RotateCcw, Building2, Search
} from "lucide-react";

export default function PropertyListingsPage() {
  const { user, hasPermission } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'create' | 'queue'>('listings');
  const [listingType, setListingType] = useState<'FOR_SALE' | 'ON_RENT'>('FOR_SALE');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FOR_SALE' | 'ON_RENT'>('ALL');
  const [formData, setFormData] = useState({
    flat_number: '', wing: '', floor: '', carpet_area: '', super_builtup_area: '',
    bedrooms: '', bathrooms: '', parking: '', price: '', rent_amount: '',
    furnishing: 'UNFURNISHED', available_from: '', description: '',
    contact_name: '', contact_phone: '',
  });

  const role = String(user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'TREASURER'].includes(role);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [listingsRes, queueRes] = await Promise.all([
        propertyListingAPI.getListings(),
        isAdmin ? propertyListingAPI.getApprovalQueue() : Promise.resolve({ data: { listings: [] } }),
      ]);
      setListings(listingsRes.data.listings || []);
      setApprovalQueue(queueRes.data.listings || []);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fee = listingType === 'FOR_SALE' ? 99 : 49;
    const total = fee * 1.18;
    if (!confirm(`Listing fee: Rs.${fee} + 18% GST = Rs.${total.toFixed(0)}. Proceed?`)) return;

    try {
      await propertyListingAPI.create({ listing_type: listingType, ...formData });
      toast.success('Listing created! Payment processing...');
      setFormData({ flat_number: '', wing: '', floor: '', carpet_area: '', super_builtup_area: '', bedrooms: '', bathrooms: '', parking: '', price: '', rent_amount: '', furnishing: 'UNFURNISHED', available_from: '', description: '', contact_name: '', contact_phone: '' });
      setActiveTab('listings');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create listing');
    }
  };

  const handleApprove = async (listing_id: string) => {
    try {
      await propertyListingAPI.approve(listing_id);
      toast.success('Listing approved and published!');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (listing_id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await propertyListingAPI.reject(listing_id, reason);
      toast.success('Listing rejected. Refund will be processed.');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to reject');
    }
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-48 skeleton rounded-2xl" /></div>;
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
      PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
      SOLD: 'bg-gray-100 text-gray-600 border-gray-300',
      RENTED: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${map[status] || 'bg-gray-50 text-gray-600'}`}>{status?.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isAdmin ? 'Manage sale and rental listings' : 'Available properties'}</p>
        </div>
        <button onClick={() => setActiveTab('create')}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25">
          <Plus className="w-4 h-4" /> Post Listing
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'listings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
          Active ({listings.filter(l => ['APPROVED', 'ACTIVE'].includes(l.status)).length})
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'queue' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
            Approval Queue ({approvalQueue.length})
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'create' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
            New Listing
          </button>
        )}
      </div>

      {activeTab === 'listings' && (
        <>
          {/* Search & Filter */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by wing, flat, BHK, description..." />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'FOR_SALE', 'ON_RENT'] as const).map(f => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${typeFilter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                  {f === 'ALL' ? 'All' : f === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.filter(l => ['APPROVED', 'ACTIVE'].includes(l.status)).filter(l => {
            const matchSearch = !search || `${l.wing} ${l.flat_number} ${l.description || ''} ${l.bedrooms}`.toLowerCase().includes(search.toLowerCase());
            const matchType = typeFilter === 'ALL' || l.listing_type === typeFilter;
            return matchSearch && matchType;
          }).length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active listings</p>
            </div>
          ) : listings.filter(l => ['APPROVED', 'ACTIVE'].includes(l.status)).filter(l => {
            const matchSearch = !search || `${l.wing} ${l.flat_number} ${l.description || ''} ${l.bedrooms}`.toLowerCase().includes(search.toLowerCase());
            const matchType = typeFilter === 'ALL' || l.listing_type === typeFilter;
            return matchSearch && matchType;
          }).map(l => (
            <div key={l.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${l.listing_type === 'FOR_SALE' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                  {l.listing_type === 'FOR_SALE' ? 'FOR SALE' : 'ON RENT'}
                </span>
                {statusBadge(l.status)}
              </div>
              <h3 className="text-lg font-bold text-gray-900">Flat {l.wing}-{l.flat_number}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Floor {l.floor} | {l.bedrooms}BHK</p>
              <div className="mt-3 space-y-1 text-sm">
                {l.price && <p className="text-gray-900 font-bold text-lg">Rs.{Number(l.price).toLocaleString()}</p>}
                {l.rent_amount && <p className="text-gray-900 font-bold text-lg">Rs.{Number(l.rent_amount).toLocaleString()}/mo</p>}
                <p className="text-gray-500">{l.carpet_area} sq ft</p>
                <p className="text-gray-500">Bath: {l.bathrooms} | Parking: {l.parking}</p>
                <p className="text-gray-400 text-xs">{l.furnishing} | Avail: {l.available_from}</p>
              </div>
              {l.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{l.description}</p>}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => propertyListingAPI.close(l.id, 'SOLD')}
                  className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-100">
                  Mark Sold
                </button>
                <button onClick={() => propertyListingAPI.renew(l.id)}
                  className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-100">
                  Renew
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {activeTab === 'queue' && isAdmin && (
        <div className="space-y-4">
          {approvalQueue.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending approvals</p>
            </div>
          ) : approvalQueue.map(l => (
            <div key={l.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Flat {l.wing}-{l.flat_number}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${l.listing_type === 'FOR_SALE' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {l.listing_type === 'FOR_SALE' ? 'SALE' : 'RENT'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">By: {l.first_name} {l.last_name}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                  {l.fee_amount > 0 ? `Rs.${l.fee_amount} paid` : 'PENDING PAYMENT'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div><span className="text-gray-400">Area:</span> {l.carpet_area} sq ft</div>
                <div><span className="text-gray-400">BHK:</span> {l.bedrooms}</div>
                <div><span className="text-gray-400">Price:</span> Rs.{(l.price || l.rent_amount)?.toLocaleString()}</div>
              </div>
              {l.description && <p className="text-sm text-gray-600 mb-4">{l.description}</p>}
              <div className="flex gap-2">
                <button onClick={() => handleApprove(l.id)}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700">
                  Approve & Publish
                </button>
                <button onClick={() => handleReject(l.id)}
                  className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Post New Property Listing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Type</label>
              <select value={listingType} onChange={e => setListingType(e.target.value as any)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="FOR_SALE">For Sale</option>
                <option value="ON_RENT">On Rent</option>
              </select>
            </div>
            {[
              { label: 'Flat Number', name: 'flat_number', type: 'text' },
              { label: 'Wing', name: 'wing', type: 'text' },
              { label: 'Floor', name: 'floor', type: 'number' },
              { label: 'Carpet Area (sq ft)', name: 'carpet_area', type: 'number' },
              { label: 'Bedrooms (BHK)', name: 'bedrooms', type: 'number' },
              { label: 'Bathrooms', name: 'bathrooms', type: 'number' },
              { label: 'Parking', name: 'parking', type: 'number' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input type={field.type} name={field.name} value={formData[field.name as keyof typeof formData]} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" required />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{listingType === 'FOR_SALE' ? 'Asking Price (Rs.)' : 'Monthly Rent (Rs.)'}</label>
              <input type="number" name={listingType === 'FOR_SALE' ? 'price' : 'rent_amount'} value={listingType === 'FOR_SALE' ? formData.price : formData.rent_amount}
                onChange={e => setFormData({ ...formData, [listingType === 'FOR_SALE' ? 'price' : 'rent_amount']: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Furnishing</label>
              <select name="furnishing" value={formData.furnishing} onChange={e => setFormData({ ...formData, furnishing: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="UNFURNISHED">Unfurnished</option>
                <option value="SEMI_FURNISHED">Semi-Furnished</option>
                <option value="FULLY_FURNISHED">Fully Furnished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Available From</label>
              <input type="date" name="available_from" value={formData.available_from} onChange={e => setFormData({ ...formData, available_from: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (max 500 chars)</label>
            <textarea name="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
              <input type="text" name="contact_name" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
              <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-indigo-900">Listing Fee</p>
            <p className="text-indigo-700 mt-1">
              {listingType === 'FOR_SALE' ? 'Rs.99' : 'Rs.49'} + 18% GST = <span className="font-bold">{listingType === 'FOR_SALE' ? 'Rs.117' : 'Rs.58'}</span> per listing (30 days)
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Proceed to Payment
            </button>
            <button type="button" onClick={() => setActiveTab('listings')} className="px-6 py-3 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}