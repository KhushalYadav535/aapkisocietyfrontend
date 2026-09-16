"use client";

import { useState, useEffect } from "react";
import { noticeAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import {
  Megaphone, Plus, Search, X, Calendar, Send, Trash2,
  AlertTriangle, Info, Zap, Sparkles, Filter, Bell,
  FileText, CheckCircle2, ArrowRight, Languages, Wand2
} from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 12;

interface Notice {
  id: string; 
  title: string; 
  content: string; 
  category: string;
  priority: string; 
  is_published: number; 
  publish_date: string;
  expiry_date: string; 
  created_at: string;
}

const noticeCategories = ["GENERAL", "MAINTENANCE", "EVENT", "RULES", "AGM", "EMERGENCY", "FINANCIAL"];

const CATEGORY_THEMES: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  GENERAL:     { icon: Info, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/60 dark:border-blue-900/40" },
  MAINTENANCE: { icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/60 dark:border-amber-900/40" },
  EVENT:       { icon: Megaphone, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200/60 dark:border-purple-900/40" },
  RULES:       { icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" },
  AGM:         { icon: Megaphone, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/60 dark:border-indigo-900/40" },
  EMERGENCY:   { icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200/60 dark:border-rose-900/40" },
  FINANCIAL:   { icon: Sparkles, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/60 dark:border-emerald-900/40" },
};

const PRIORITY_BADGES: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/40", text: "text-rose-700 dark:text-rose-300" },
  HIGH:   { bg: "bg-orange-50 dark:bg-orange-950/50 border border-orange-200/60 dark:border-orange-900/40", text: "text-orange-700 dark:text-orange-300" },
  NORMAL: { bg: "bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  LOW:    { bg: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700", text: "text-slate-600 dark:text-slate-400" },
};

const BILINGUAL_TEMPLATES = [
  {
    id: "WATER_TANK",
    title_en: "Water Tank Cleaning & Supply Cut",
    title_hi: "पानी की टंकी की सफाई एवं जलापूर्ति व्यवधान",
    category: "MAINTENANCE",
    priority: "HIGH",
    generate: (date: string) => ({
      title: "Water Tank Cleaning & Supply Cut / पानी की टंकी की सफाई सूचना",
      content: `[ENGLISH]\nDear Residents,\nPlease be informed that the bi-annual cleaning and sanitization of the society's water tanks will take place on ${date || "tomorrow"} from 10:00 AM to 04:00 PM.\nWater supply across all wings will remain suspended during these hours. Kindly store adequate water in advance for daily household requirements.\n\n[हिंदी]\nसमस्त निवासियों को सूचित किया जाता है कि सोसायटी की पानी की टंकियों की सफाई एवं स्वच्छता कार्य ${date || "कल"} सुबह 10:00 बजे से शाम 04:00 बजे तक किया जाएगा।\nइस अवधि के दौरान सभी विंगों में जलापूर्ति बाधित रहेगी। कृपया अपनी दैनिक आवश्यकताओं हेतु पहले से पानी का भंडारण कर लें।\n\n- Managing Committee`
    })
  },
  {
    id: "AGM_NOTICE",
    title_en: "Annual General Meeting (AGM) 2026",
    title_hi: "वार्षिक आम बैठक (AGM) की औपचारिक सूचना",
    category: "AGM",
    priority: "URGENT",
    generate: (date: string) => ({
      title: "Notice of Annual General Meeting (AGM) / वार्षिक आम बैठक सूचना",
      content: `[ENGLISH]\nDear Society Members,\nNotice is hereby given that the Annual General Body Meeting (AGM) will be convened on ${date || "Sunday"} at 10:30 AM in the Society Clubhouse.\n\nKey Agenda:\n1. Presentation and approval of annual audited balance sheets.\n2. Society security, EV charging installation, and facility upgrades.\n3. 1-Flat-1-Vote electronic ballot on proposed resolution.\nQuorum rules apply. Your presence is essential.\n\n[हिंदी]\nसमस्त सदस्यों को सूचित किया जाता है कि सोसायटी की वार्षिक आम बैठक (AGM) ${date || "रविवार"} को सुबह 10:30 बजे सोसायटी क्लबहाउस में आयोजित होगी।\n\nमुख्य कार्यसूची:\n1. वार्षिक अंकेक्षित वित्तीय विवरणों एवं बजट की समीक्षा तथा स्वीकृति।\n2. सुरक्षा व्यवस्था, ईवी चार्जिंग स्टेशन एवं सुविधाओं के विकास पर चर्चा।\n3. 'एक फ्लैट - एक वोट' नियम अनुसार प्रस्ताव पर मतदान।\nकृपया ससमय पधारकर अपने सुझाव साझा करें।\n\n- Managing Committee`
    })
  },
  {
    id: "LIFT_AMC",
    title_en: "Passenger Lift AMC Service & Safety Audit",
    title_hi: "लिफ्ट की मासिक सर्विस एवं मेंटेनेंस",
    category: "MAINTENANCE",
    priority: "NORMAL",
    generate: (date: string) => ({
      title: "Passenger Lift AMC Maintenance / लिफ्ट सर्विसिंग सूचना",
      content: `[ENGLISH]\nDear Residents,\nThe scheduled monthly preventive maintenance and safety overhaul of the passenger lifts will be conducted on ${date || "upcoming Saturday"} between 11:00 AM and 03:00 PM.\nLifts will be stopped one by one. Elderly residents and patients are advised to plan accordingly. Service stairs remain accessible.\n\n[हिंदी]\nसभी निवासियों को सूचित किया जाता है कि पैसेंजर लिफ्ट की मासिक सर्विसिंग एवं सुरक्षा जांच ${date || "शनिवार"} को सुबह 11:00 से दोपहर 03:00 बजे तक की जाएगी।\nइस दौरान एक-एक करके लिफ्ट बंद रखी जाएगी। बुजुर्गों एवं मरीजों से निवेदन है कि अपनी दिनचर्या इसी अनुसार तय करें।\n\n- Managing Committee`
    })
  },
  {
    id: "LATE_NIGHT_NOISE",
    title_en: "Advisory on Late Night Noise & Balcony Clutter",
    title_hi: "देर रात शांति व्यवस्था एवं नियमों के पालन हेतु परामर्श",
    category: "RULES",
    priority: "HIGH",
    generate: () => ({
      title: "Advisory: Late Night Noise & Society Decorum / शांति व्यवस्था परामर्श",
      content: `[ENGLISH]\nDear Residents,\nMultiple noise complaints have been noted regarding loud music, balcony gatherings, and hallway shouting post 10:00 PM.\nAs per Society Bye-Laws:\n1. Loud speakers and terrace parties are strictly banned between 10:00 PM and 06:00 AM.\n2. Common corridors must remain free of shoes, cycle racks, and trash.\nRepeated violations will invite penalty fines.\n\n[हिंदी]\nसभी निवासियों से निवेदन है कि रात 10:00 बजे के बाद तेज आवाज में म्यूजिक बजाने एवं बालकनी में शोरगुल करने से अन्य परिवारों को असुविधा होती है।\nसोसायटी नियमानुसार:\n1. रात 10:00 बजे से सुबह 06:00 बजे तक तेज आवाज पर पूर्ण प्रतिबंध है।\n2. कॉमन कॉरिडोर में जूते, साइकिल अथवा कूड़ा न रखें।\nउल्लंघन करने पर नियमानुसार जुर्माना देय होगा।\n\n- Managing Committee`
    })
  },
  {
    id: "PEST_CONTROL",
    title_en: "Mosquito Fogging & Pest Control Drive",
    title_hi: "सोसायटी में फॉगिंग एवं कीटनाशक छिड़काव अभियान",
    category: "MAINTENANCE",
    priority: "NORMAL",
    generate: (date: string) => ({
      title: "Mosquito Fogging & Pest Control / कीटनाशक छिड़काव अभियान",
      content: `[ENGLISH]\nDear Residents,\nTo prevent dengue and insect breeding, a comprehensive mosquito fogging drive will be conducted across basement parking, shafts, and common garden areas on ${date || "this Friday"} at 05:30 PM.\nPlease keep balcony windows closed and keep pets indoors during spraying.\n\n[हिंदी]\nसोसायटी में डेंगू, मलेरिया एवं मच्छरों की रोकथाम हेतु बेसमेंट, डक्ट एवं गार्डन एरिया में फॉगिंग अभियान ${date || "शुक्रवार"} शाम 05:30 बजे चलाया जाएगा।\nफॉगिंग के दौरान खिड़कियां व बालकनी दरवाजे बंद रखें एवं पालतू जानवरों को अंदर रखें।\n\n- Managing Committee`
    })
  },
  {
    id: "FESTIVAL_EVENT",
    title_en: "Society Community Festival Celebration",
    title_hi: "सोसायटी त्योहार उत्सव एवं सांस्कृतिक संध्या",
    category: "EVENT",
    priority: "NORMAL",
    generate: (date: string) => ({
      title: "Community Festival Celebration / त्योहार उत्सव आमंत्रण",
      content: `[ENGLISH]\nDear Residents,\nWe joyfully invite you and your family to the Society Community Festival Celebration on ${date || "the upcoming weekend"} starting at 06:30 PM at the Central Lawn.\nJoin us for cultural performances, children's games, music, and community dinner!\n\n[हिंदी]\nसमस्त निवासियों को सपरिवार सोसायटी के आगामी त्योहार उत्सव में सादर आमंत्रित किया जाता है। कार्यक्रम ${date || "आगामी सप्ताहांत"} शाम 06:30 बजे से सेंट्रल लॉन में होगा।\nआइए सांस्कृतिक कार्यक्रमों, खेलों एवं सुरुचि भोज के साथ उत्सव का आनंद लें!\n\n- Managing Committee`
    })
  }
];

export default function NoticesPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useLocale();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiDrafterModal, setShowAiDrafterModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("WATER_TANK");
  const [drafterDate, setDrafterDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: "", content: "", category: "GENERAL", priority: "NORMAL", expiry_date: ""
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadNotices(); }, []);

  const loadNotices = async () => {
    try {
      const res = await noticeAPI.getAll();
      setNotices(res.data.notices || []);
    } catch { 
      toast.error("Failed to load notices"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await noticeAPI.create(formData);
      toast.success("Notice created successfully!");
      setShowAddModal(false);
      setFormData({ title: "", content: "", category: "GENERAL", priority: "NORMAL", expiry_date: "" });
      loadNotices();
    } catch { 
      toast.error("Failed to create notice"); 
    }
  };

  const handlePublish = async (id: string) => {
    try { 
      await noticeAPI.publish(id); 
      toast.success("Notice published to residents!"); 
      loadNotices(); 
    } catch { 
      toast.error("Failed to publish notice"); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try { 
      await noticeAPI.remove(id); 
      toast.success("Notice deleted"); 
      loadNotices(); 
    } catch { 
      toast.error("Failed to delete notice"); 
    }
  };

  const cats = ["ALL", ...Array.from(new Set(notices.map(n => n.category)))];
  const filtered = notices.filter(n => {
    const matchSearch = `${n.title} ${n.content} ${n.category}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = catFilter === "ALL" || n.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedNotices = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, catFilter]);

  const isAdmin = hasPermission('NOTICE_CREATE');
  const publishedCount = notices.filter(n => n.is_published).length;
  const draftCount = notices.filter(n => !n.is_published).length;

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("noticesTitle")}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {publishedCount} broadcasted notices · {draftCount} pending drafts
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={() => setShowAiDrafterModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all shadow-sm"
            >
              <Wand2 className="w-4 h-4 text-indigo-600" />
              Smart Drafter (Bilingual)
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> {t("newNotice")}
            </button>
          </div>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            placeholder="Search by keyword, agenda, category..." 
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 pl-1 pr-2 text-xs font-semibold text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          {cats.map(cat => {
            const active = catFilter === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat === "ALL" ? "All Notices" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center mx-auto mb-3.5 text-slate-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-base">No announcements found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            {searchTerm || catFilter !== "ALL"
              ? "No notices match your active query. Try searching different terms or clearing filters."
              : "No notices posted yet. Admins can broadcast announcements anytime."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedNotices.map((notice) => {
              const theme = CATEGORY_THEMES[notice.category] || CATEGORY_THEMES.GENERAL;
              const Icon = theme.icon;
              const prio = PRIORITY_BADGES[notice.priority] || PRIORITY_BADGES.NORMAL;

              return (
                <div 
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  {/* Emergency / Urgent Top accent */}
                  {notice.priority === "URGENT" && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
                  )}

                  <div>
                    {/* Tags row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${theme.bg} ${theme.border} ${theme.color}`}>
                          <Icon className="w-3 h-3" />
                          {notice.category}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${prio.bg}`}>
                          {notice.priority}
                        </span>
                      </div>

                      {notice.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50">
                          Draft
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {notice.content}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(notice.publish_date || notice.created_at)}</span>
                    </div>

                    {isAdmin && !notice.is_published ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handlePublish(notice.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200/50 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Publish
                        </button>
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
          onClick={() => setSelectedNotice(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[85vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${PRIORITY_BADGES[selectedNotice.priority]?.bg || "bg-slate-100 text-slate-600"}`}>
                  {selectedNotice.priority}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedNotice.category}
                </span>
                {selectedNotice.is_published ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                    Published
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50">
                    Draft
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedNotice(null)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 mb-3">
              {selectedNotice.title}
            </h2>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                {selectedNotice.content}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date: {formatDate(selectedNotice.publish_date || selectedNotice.created_at)}</span>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Announcement</h2>
                  <p className="text-[11px] text-slate-400">Broadcast to all society residents</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notice Title *
                </label>
                <input 
                  value={formData.title} 
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual General Body Meeting (AGM) 2026" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notice Content & Details *
                </label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="Provide complete notice details, agenda, timing and instructions..." 
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 h-28 resize-none" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {noticeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority Level
                  </label>
                  <select 
                    value={formData.priority} 
                    onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Bilingual Notice Drafter Modal */}
      {showAiDrafterModal && (() => {
        const activeTpl = BILINGUAL_TEMPLATES.find(t => t.id === selectedTemplateId) || BILINGUAL_TEMPLATES[0];
        const draft = activeTpl.generate(drafterDate);

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                      Smart Bilingual Notice Drafter
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">English + हिंदी</span>
                    </h2>
                    <p className="text-xs text-slate-500">Auto-formats legal, professional society announcements</p>
                  </div>
                </div>
                <button onClick={() => setShowAiDrafterModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mt-4">
                {/* Template picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Choose Pre-Approved Notice Template
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BILINGUAL_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all ${
                          selectedTemplateId === tpl.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="truncate">{tpl.title_en}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{tpl.title_hi}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date parameter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event / Maintenance Date
                    </label>
                    <input
                      type="date"
                      value={drafterDate}
                      onChange={e => setDrafterDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Audience
                    </label>
                    <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold">
                      All Society Wings & Residents
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Generated Bilingual Notice Preview
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Ready to broadcast</span>
                  </div>
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-800">
                    <div className="text-amber-400 font-bold mb-2 text-sm">{draft.title}</div>
                    {draft.content}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        title: draft.title,
                        content: draft.content,
                        category: activeTpl.category,
                        priority: activeTpl.priority,
                        expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
                      });
                      setShowAiDrafterModal(false);
                      setShowAddModal(true);
                      toast.success("Draft loaded into notice editor!");
                    }}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
                  >
                    Edit Draft First
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await noticeAPI.create({
                          title: draft.title,
                          content: draft.content,
                          category: activeTpl.category,
                          priority: activeTpl.priority,
                          expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
                        });
                        const newNotice = res.data?.notice;
                        if (newNotice?.id) {
                          await noticeAPI.publish(newNotice.id);
                        }
                        toast.success("Bilingual notice published to residents!");
                        setShowAiDrafterModal(false);
                        loadNotices();
                      } catch {
                        toast.error("Failed to publish notice");
                      }
                    }}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    1-Click Instant Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
