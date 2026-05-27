"use client";

import { useState, useEffect } from "react";
import { documentAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { FolderOpen, Plus, Search, Upload, FileText, Image, File, X, Download, Trash2 } from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 12;
const CATEGORIES = ['AGREEMENT', 'RECEIPT', 'COMPLIANCE', 'MAINTENANCE', 'INSURANCE', 'PERMIT', 'OTHER'];

export default function DocumentsPage() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "OTHER" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([documentAPI.getAll(), documentAPI.getCategories()]);
      setDocuments(d.data.documents || []);
      setCategories(c.data.categories || []);
    } catch { toast.error("Failed to load documents"); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("category", form.category);
    try {
      await documentAPI.upload(fd);
      toast.success("Document uploaded!");
      setShowUpload(false);
      setForm({ title: "", description: "", category: "OTHER" });
      setFile(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try { await documentAPI.delete(id); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const getFileIcon = (type: string) => {
    if (type?.includes("image")) return Image;
    if (type?.includes("pdf")) return FileText;
    return File;
  };

  const filtered = documents.filter(d => {
    const matchSearch = `${d.title} ${d.description || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || d.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedDocs = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, catFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FolderOpen className="w-6 h-6 text-indigo-500" /> Documents</h1>
          <p className="text-gray-400 text-sm mt-1">{documents.length} documents</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200"><Plus className="w-4 h-4" /> Upload</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search documents..." /></div>
        <div className="flex gap-2 flex-wrap">{["ALL", ...CATEGORIES].map(c => <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${catFilter === c ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{c}</button>)}</div>
      </div>

      {loading ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}</div> : paginatedDocs.length === 0 ? (
        <div className="text-center py-16"><FolderOpen className="w-14 h-14 mx-auto mb-3 text-gray-200" /><p className="text-gray-400">No documents found</p></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedDocs.map(d => {
              const Icon = getFileIcon(d.file_type);
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5 text-indigo-600" /></div>
                    <button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-3 truncate">{d.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{d.category}</p>
                  <p className="text-xs text-gray-400 mt-1">{(d.file_size / 1024).toFixed(0)} KB</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{formatDate(d.created_at)}</span>
                    <a href={d.file_path} target="_blank" rel="noopener" className="ml-auto text-indigo-600 hover:text-indigo-700"><Download className="w-4 h-4" /></a>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900">Upload Document</h2><button onClick={() => setShowUpload(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-20 resize-none" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">File *</label><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" disabled={uploading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50">{uploading ? "Uploading..." : "Upload"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}