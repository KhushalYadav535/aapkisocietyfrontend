"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard, Users, Receipt, MessageSquareWarning,
  Megaphone, UserCheck, CalendarDays, Settings, LogOut, Menu, X,
  Bell, BarChart3, Globe, ChevronRight, Sparkles, ShieldCheck, CalendarClock,
  FileSpreadsheet, Fingerprint, BookOpen, ClipboardList, User, Moon, Sun,
  Home as HomeIcon, Car, MessageSquare, Vote, Wrench, FolderOpen, HardHat,
  ShieldAlert, QrCode, Phone, Package, Download, LayoutGrid, ChevronLeft,
  Truck, ShoppingBag, AlertTriangle, Scale, Search, ChevronDown
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useLocale } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import { scrollerAPI } from "@/lib/api";
import api from "@/lib/api";

const normalizeRole = (role: string) => {
  const r = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (r === "MEMBER") return "COMMITTEE";
  return r;
};

interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles: string[];
  section: string;
  permission?: string;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  // ── 1. MAIN
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN", "MAKER", "CHECKER", "GUARD"], section: "main" },

  // ── 2. OPERATIONS & SOCIETY
  { href: "/dashboard/members", label: "Members Directory", icon: Users, roles: ["ADMIN", "TREASURER", "COMMITTEE"], permission: "USER_CREATE", section: "management" },
  { href: "/dashboard/properties", label: "Properties & Flats", icon: Wrench, roles: ["ADMIN"], permission: "SOCIETY_MANAGE", section: "management" },
  { href: "/dashboard/vehicles", label: "Vehicles & Parking", icon: Car, roles: ["ADMIN", "COMMITTEE", "RESIDENT"], permission: "VEHICLE_MANAGE", section: "management" },
  { href: "/dashboard/complaints", label: "Helpdesk Complaints", icon: MessageSquareWarning, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT"], permission: "COMPLAINT_ASSIGN", section: "management" },
  { href: "/dashboard/notices", label: "Notices & Circulars", icon: Megaphone, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "GUARD", "MAKER", "CHECKER"], permission: "NOTICE_CREATE", section: "management" },
  { href: "/dashboard/facilities", label: "Clubhouse Amenities", icon: CalendarDays, roles: ["ADMIN", "COMMITTEE", "TREASURER", "RESIDENT"], permission: "FACILITY_MANAGE", section: "management" },
  { href: "/dashboard/staff", label: "Domestic Staff", icon: HardHat, roles: ["ADMIN", "COMMITTEE", "RESIDENT"], permission: "STAFF_MANAGE", section: "management" },

  // ── 3. GATE & SECURITY
  { href: "/dashboard/visitors", label: "Visitors & Passes", icon: UserCheck, roles: ["ADMIN", "COMMITTEE", "RESIDENT", "GUARD"], permission: "VISITOR_MANAGE", section: "security" },
  { href: "/dashboard/parcels", label: "Gate Parcels & PIN", icon: Package, roles: ["ADMIN", "COMMITTEE", "RESIDENT", "GUARD"], section: "security", badge: "OTP", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { href: "/dashboard/move-requests", label: "Move-In & NOC", icon: Truck, roles: ["ADMIN", "COMMITTEE", "RESIDENT", "GUARD"], section: "security" },
  { href: "/dashboard/violations", label: "Rule Violations", icon: AlertTriangle, roles: ["ADMIN", "COMMITTEE", "TREASURER", "RESIDENT", "GUARD"], section: "security", badge: "New", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
  { href: "/dashboard/patrol", label: "Guard Patrolling", icon: QrCode, roles: ["ADMIN", "COMMITTEE", "GUARD"], permission: "PATROL_MANAGE", section: "security" },
  { href: "/dashboard/emergency-contacts", label: "SOS & Blood Network", icon: Phone, roles: ["ADMIN", "COMMITTEE", "TREASURER", "RESIDENT", "GUARD", "MAKER", "CHECKER"], permission: "EMERGENCY_MANAGE", section: "security" },
  { href: "/dashboard/sos", label: "Panic SOS Alerts", icon: ShieldAlert, roles: ["ADMIN", "COMMITTEE", "TREASURER", "RESIDENT", "GUARD"], permission: "SOS_RESPOND", section: "security" },

  // ── 4. BILLING & FINANCE
  { href: "/dashboard/billing", label: "Billing & Invoices", icon: Receipt, roles: ["ADMIN", "TREASURER", "MAKER", "CHECKER", "RESIDENT", "COMMITTEE"], permission: "BILLING_CREATE", section: "finance" },
  { href: "/dashboard/reports", label: "Financial Reports", icon: BarChart3, roles: ["ADMIN", "TREASURER", "COMMITTEE", "PLATFORM_ADMIN"], permission: "REPORT_VIEW", section: "finance" },
  { href: "/dashboard/tax", label: "GST & Tax Returns", icon: FileSpreadsheet, roles: ["ADMIN", "TREASURER"], permission: "TAX_VIEW", section: "finance" },
  { href: "/dashboard/accounting", label: "Ledger & Tally", icon: BookOpen, roles: ["ADMIN", "TREASURER", "MAKER", "CHECKER", "COMMITTEE"], permission: "ACCOUNTING_MANAGE", section: "finance" },
  { href: "/dashboard/compliance", label: "Statutory Compliance", icon: CalendarClock, roles: ["ADMIN", "TREASURER", "COMMITTEE"], permission: "COMPLIANCE_MANAGE", section: "finance" },
  { href: "/dashboard/reports/export", label: "Export Data (Excel)", icon: Download, roles: ["ADMIN", "TREASURER", "COMMITTEE", "PLATFORM_ADMIN"], permission: "REPORT_VIEW", section: "finance" },
  { href: "/dashboard/audit", label: "Audit Logs", icon: ClipboardList, roles: ["ADMIN", "TREASURER", "CHECKER", "COMMITTEE"], permission: "AUDIT_VIEW", section: "finance" },

  // ── 5. COMMUNITY & LIFESTYLE
  { href: "/dashboard/bye-laws-ai", label: "Bye-Laws AI Assistant", icon: Scale, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "GUARD"], section: "community", badge: "AI RAG", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { href: "/dashboard/marketplace", label: "Society Marketplace", icon: ShoppingBag, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT"], section: "community", badge: "OLX", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { href: "/dashboard/carpooling", label: "Carpooling & Rides", icon: Car, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT"], section: "community", badge: "Rides", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { href: "/dashboard/meetings", label: "AGM Meetings & Polls", icon: Vote, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT"], permission: "MEETING_MANAGE", section: "community" },
  { href: "/dashboard/messages", label: "Community Chat", icon: MessageSquare, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN"], section: "community" },
  { href: "/dashboard/scrollers", label: "Broadcast Scrollers", icon: Globe, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN"], section: "community" },

  // ── 6. ASSETS & MAINTENANCE
  { href: "/dashboard/assets", label: "AMC & Asset Tracker", icon: Package, roles: ["ADMIN", "COMMITTEE", "TREASURER"], permission: "ASSET_MANAGE", section: "maintenance" },
  { href: "/dashboard/vendors", label: "Approved Vendors", icon: Wrench, roles: ["ADMIN", "COMMITTEE", "TREASURER", "RESIDENT"], permission: "VENDOR_MANAGE", section: "maintenance" },
  { href: "/dashboard/documents", label: "Society Documents", icon: FolderOpen, roles: ["ADMIN", "TREASURER", "COMMITTEE", "MAKER", "CHECKER"], permission: "DOCUMENT_MANAGE", section: "maintenance" },

  // ── 7. SYSTEM & SETUP
  { href: "/dashboard/settings", label: "Society Settings", icon: Settings, roles: ["ADMIN", "PLATFORM_ADMIN"], section: "settings" },
  { href: "/dashboard/settings/rbac", label: "Role Management", icon: ShieldCheck, roles: ["ADMIN"], permission: "SOCIETY_MANAGE", section: "settings" },
  { href: "/dashboard/notifications", label: "Notification Channels", icon: Bell, roles: ["ADMIN", "TREASURER", "COMMITTEE"], permission: "NOTIFICATION_MANAGE", section: "settings" },
  { href: "/dashboard/privacy", label: "Privacy & Consent", icon: Fingerprint, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN", "MAKER", "CHECKER", "GUARD"], section: "settings" },
  { href: "/dashboard/profile", label: "My Profile", icon: User, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN", "MAKER", "CHECKER", "GUARD"], section: "settings" },
  { href: "/dashboard/societies", label: "All Societies & Plans", icon: LayoutGrid, roles: ["PLATFORM_ADMIN"], section: "settings" },
  { href: "/dashboard/platform-admin", label: "SuperAdmin Console", icon: Globe, roles: ["PLATFORM_ADMIN"], section: "settings" },
];

const sectionConfig: Record<string, { label: string; color: string; bg: string }> = {
  main: { label: "", color: "", bg: "" },
  management: { label: "Operations & Society", color: "text-indigo-600", bg: "bg-indigo-50" },
  security: { label: "Gate & Security", color: "text-emerald-600", bg: "bg-emerald-50" },
  finance: { label: "Billing & Finance", color: "text-blue-600", bg: "bg-blue-50" },
  community: { label: "Community & Lifestyle", color: "text-purple-600", bg: "bg-purple-50" },
  maintenance: { label: "Assets & Maintenance", color: "text-amber-600", bg: "bg-amber-50" },
  settings: { label: "System & Setup", color: "text-slate-600", bg: "bg-slate-100" },
};

const roleInfo: Record<string, { label: string; darkColor: string; darkBg: string; lightColor: string; lightBg: string; gradient: string }> = {
  ADMIN: { label: "Administrator", darkColor: "text-indigo-300", darkBg: "bg-indigo-500/20", lightColor: "text-indigo-600", lightBg: "bg-indigo-100", gradient: "from-indigo-500 to-purple-600" },
  TREASURER: { label: "Treasurer", darkColor: "text-emerald-300", darkBg: "bg-emerald-500/20", lightColor: "text-emerald-700", lightBg: "bg-emerald-100", gradient: "from-emerald-500 to-teal-600" },
  COMMITTEE: { label: "Committee", darkColor: "text-blue-300", darkBg: "bg-blue-500/20", lightColor: "text-blue-600", lightBg: "bg-blue-100", gradient: "from-blue-500 to-cyan-600" },
  RESIDENT: { label: "Resident", darkColor: "text-orange-300", darkBg: "bg-orange-500/20", lightColor: "text-orange-600", lightBg: "bg-orange-100", gradient: "from-orange-400 to-rose-500" },
  PLATFORM_ADMIN: { label: "Platform Admin", darkColor: "text-violet-300", darkBg: "bg-violet-500/20", lightColor: "text-violet-600", lightBg: "bg-violet-100", gradient: "from-violet-600 to-fuchsia-600" },
  GUARD: { label: "Guard", darkColor: "text-slate-300", darkBg: "bg-slate-500/20", lightColor: "text-slate-600", lightBg: "bg-slate-100", gradient: "from-slate-500 to-gray-600" },
  MAKER: { label: "Treasury Maker", darkColor: "text-cyan-300", darkBg: "bg-cyan-500/20", lightColor: "text-cyan-700", lightBg: "bg-cyan-100", gradient: "from-cyan-500 to-blue-600" },
  CHECKER: { label: "Treasury Checker", darkColor: "text-teal-300", darkBg: "bg-teal-500/20", lightColor: "text-teal-700", lightBg: "bg-teal-100", gradient: "from-teal-500 to-emerald-600" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { user, logout, loading, isAuthenticated, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const userRole = normalizeRole(user?.role || "");

  const [scrollers, setScrollers] = useState<any[]>([]);
  const [renewalBanner, setRenewalBanner] = useState<any>(null);

  const toggleSection = (secKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secKey]: !prev[secKey]
    }));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    scrollerAPI.getActive({}).then(res => setScrollers(res.data?.scrollers || [])).catch(() => { });
    api.get('/notifications/v4/renewal-banner').then(res => setRenewalBanner(res.data?.banner || null)).catch(() => { });
    
    if (userRole === 'ADMIN' && user?.society_id) {
      api.get(`/societies/${user.society_id}`).then(res => {
        if (res.data?.society?.onboarding_state === 'CONFIGURATION_WIZARD' && pathname !== '/dashboard/setup') {
          router.push('/dashboard/setup');
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, userRole, user?.society_id, pathname, router]);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (loading || !isAuthenticated || !pathname) return;
    if (pathname === '/dashboard/setup') return;
    
    const allowed = navItems.some((item) => {
      const allowedRoles = item.roles.map(normalizeRole);
      const roleAllowed = allowedRoles.includes(userRole);
      const permAllowed = item.permission ? hasPermission(item.permission) : false;
      if (!roleAllowed && !permAllowed) return false;
      if (item.href === "/dashboard") return pathname === "/dashboard";
      return pathname === item.href || pathname.startsWith(item.href + "/");
    });
    if (!allowed) router.replace("/dashboard");
  }, [loading, isAuthenticated, pathname, router, userRole, hasPermission]);

  const filteredNav = useMemo(
    () => navItems.filter(item => {
      const roleAllowed = item.roles.map(normalizeRole).includes(userRole);
      const permAllowed = item.permission ? hasPermission(item.permission) : false;
      return roleAllowed || permAllowed;
    }),
    [userRole, hasPermission]
  );

  const handleLogout = () => { logout(); router.push("/login"); };

  const isActive = useCallback((href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }, [pathname]);

  const searchedNav = useMemo(() => {
    if (!sidebarSearch.trim()) return filteredNav;
    const q = sidebarSearch.toLowerCase().trim();
    return filteredNav.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q)
    );
  }, [filteredNav, sidebarSearch]);

  const groupedNav = useMemo(() =>
    searchedNav.reduce((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {} as Record<string, typeof navItems>),
    [searchedNav]
  );

  const currentRoleInfo = roleInfo[userRole] || roleInfo.RESIDENT;
  const isLight = theme === 'light';
  const roleColor = isLight ? currentRoleInfo.lightColor : currentRoleInfo.darkColor;
  const roleBg = isLight ? currentRoleInfo.lightBg : currentRoleInfo.darkBg;

  if (loading || !isAuthenticated) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-mesh overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/20 blur-[80px] rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
          <div className="relative flex items-center justify-center w-28 h-28">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border-4 border-purple-100 border-b-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)] animate-[spin_2s_linear_infinite_reverse]" />
            <div className="animate-pulse bg-white p-3 rounded-full shadow-xl">
              <Logo size="md" showText={false} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_2.5s_linear_infinite]">
              AapkiSociety
            </h2>
            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm font-semibold text-slate-600 tracking-wide">Preparing your experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-mesh">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col ${sidebarCollapsed ? 'lg:w-[72px] w-72' : 'w-72'} h-full transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={isLight
          ? { background: '#ffffff', boxShadow: '2px 0 24px rgba(0, 0, 0, 0.04)', borderRight: '1px solid #e2e8f0' }
          : { background: '#090d16', boxShadow: '4px 0 60px rgba(0, 0, 0, 0.6)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }
        }
      >
        {/* Logo Header */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b shrink-0 ${isLight ? 'border-slate-100 bg-white' : 'border-white/[0.06] bg-slate-950/40'}`}>
          <div className="relative shrink-0">
            <Logo size="sm" showText={false} href="/dashboard" />
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#090d16]'} shadow-sm`} />
          </div>
          <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-sm font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Aapki<span className="text-indigo-600">Society</span>
              </h1>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                v4.0
              </span>
            </div>
            <p className={`text-[10px] font-medium truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Smart Society Platform
            </p>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-lg border transition-all duration-200 shrink-0 cursor-pointer
              ${isLight ? 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-500 hover:text-indigo-600' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'}`}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            className={`lg:hidden p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <Link
            href="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200 group ${
              isLight
                ? 'bg-slate-50/80 hover:bg-indigo-50/50 hover:border-indigo-200/80 border-slate-200/80 shadow-xs'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06]'
            } ${sidebarCollapsed ? 'lg:justify-center lg:p-2' : ''}`}
          >
            <div className={`relative w-9 h-9 rounded-xl bg-gradient-to-tr ${currentRoleInfo.gradient} flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0`}>
              {getInitials(user?.first_name || "", user?.last_name || "")}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs font-bold truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {user?.first_name} {user?.last_name}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${roleBg} ${roleColor}`}>
                    {currentRoleInfo.label}
                  </span>
                  {user?.flat_number && (
                    <span className="text-[10px] font-semibold text-slate-500 truncate">
                      • Flat {user.flat_number}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Quick Search Input */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-2 pb-1 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Quick find..."
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border transition-all placeholder-slate-400 focus:outline-none ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100/60 focus:bg-white border-slate-200/80 focus:border-indigo-500 text-slate-800 focus:ring-2 focus:ring-indigo-500/10"
                    : "bg-slate-900/80 border-slate-800 text-white focus:border-indigo-500"
                }`}
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav List */}
        <nav
          className={`flex-1 ${sidebarCollapsed ? 'lg:px-2 px-3' : 'px-3'} py-2 overflow-y-auto overflow-x-hidden custom-scrollbar`}
          style={{ scrollbarWidth: sidebarCollapsed ? 'none' : 'thin' }}
        >
          {Object.entries(groupedNav).map(([section, items]) => {
            const sec = sectionConfig[section];
            const isCollapsed = !sidebarSearch && collapsedSections[section];

            return (
              <div key={section} className="mb-3 last:mb-0">
                {sec?.label && !sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-left group cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? sec.color : 'text-slate-400'}`}>
                      {sec.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500">
                        {items.length}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                    </div>
                  </button>
                )}

                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                          onClick={() => setSidebarOpen(false)}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`relative flex items-center gap-2.5 rounded-xl text-xs transition-all duration-150 group overflow-hidden ${
                            sidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2' : 'px-2.5 py-2'
                          } ${
                            active
                              ? isLight
                                ? "bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 font-bold shadow-xs"
                                : "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                              : isLight
                                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent font-medium"
                          }`}
                        >
                          {/* Active Indicator Left Glow Bar */}
                          {active && !sidebarCollapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />
                          )}

                          {/* Icon Container */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                            active
                              ? isLight
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                                : "bg-white/20 text-white"
                              : isLight
                                ? "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-105"
                                : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white group-hover:scale-105"
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>

                          {/* Label */}
                          <span className={`flex-1 truncate leading-tight ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                            {item.label}
                          </span>

                          {/* Feature Badge */}
                          {item.badge && !sidebarCollapsed && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${item.badgeColor || "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                              {item.badge}
                            </span>
                          )}

                          {active && !item.badge && !sidebarCollapsed && (
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t shrink-0 ${isLight ? 'border-slate-100 bg-white' : 'border-white/[0.06] bg-slate-950/40'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AapkiSociety OS</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO v4.0
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 w-full py-2 px-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer ${
              sidebarCollapsed ? 'lg:justify-center px-0' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 px-5 py-3 border-b border-gray-200/60 transition-all shrink-0" style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 20px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl transition-all duration-200"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth >= 1024) setSidebarCollapsed(!sidebarCollapsed);
                  else setSidebarOpen(true);
                }}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-600 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-800 font-semibold capitalize tracking-tight">
                  {pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Dashboard"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                {theme === 'light' ? <Moon className="w-4 h-4 text-gray-500" /> : <Sun className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={() => setLocale(locale === "en" ? "hi" : "en")} className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 transition-all" title="Switch language">
                {locale === "en" ? "EN" : "HI"}
              </button>
              <button className="relative p-2 hover:bg-indigo-50 rounded-xl transition-colors group">
                <Bell className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>
              <div className="w-px h-7 bg-gray-200 mx-1" />
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className={`w-8 h-8 bg-gradient-to-br ${currentRoleInfo.gradient} rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white`}>
                  {getInitials(user?.first_name || "", user?.last_name || "")}
                </div>
                <div className="hidden md:block leading-tight">
                  <p className="text-[13px] font-semibold text-gray-900">{user?.first_name}</p>
                  <p className={`text-[10px] font-medium ${currentRoleInfo.lightColor}`}>{currentRoleInfo.label}</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {renewalBanner && userRole === 'ADMIN' && (
          <div className={`px-5 py-2.5 text-sm font-medium flex items-center justify-between shrink-0 ${renewalBanner.type === 'error' ? 'bg-red-50 text-red-700 border-b border-red-100' : renewalBanner.type === 'warning' ? 'bg-amber-50 text-amber-700 border-b border-amber-100' : 'bg-blue-50 text-blue-700 border-b border-blue-100'}`}>
            <span>{renewalBanner.title} — {renewalBanner.message}</span>
            {renewalBanner.action && <Link href={renewalBanner.action} className="text-xs underline ml-2 whitespace-nowrap">View</Link>}
          </div>
        )}

        {scrollers.length > 0 && (
          <div className={`overflow-hidden border-b shrink-0 ${isLight ? 'border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white' : 'border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800'}`}>
            {(() => {
              const doubled = [...scrollers, ...scrollers];
              const speed = scrollers.some((s: any) => s.scroll_speed === 'FAST') ? 15 : scrollers.some((s: any) => s.scroll_speed === 'SLOW') ? 50 : 30;
              return (
                <div className="flex whitespace-nowrap py-2" style={{ animation: `marquee ${speed}s linear infinite` }}>
                  {doubled.map((s: any, i: number) => {
                    const urgencyClass = isLight
                      ? (s.urgency_level === 'URGENT' ? 'bg-red-100 text-red-700 border-red-200' : s.urgency_level === 'IMPORTANT' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200')
                      : (s.urgency_level === 'URGENT' ? 'bg-red-500/20 text-red-300 border-red-500/30' : s.urgency_level === 'IMPORTANT' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30');
                    const dot = s.urgency_level === 'URGENT' ? 'bg-red-500' : s.urgency_level === 'IMPORTANT' ? 'bg-amber-500' : 'bg-indigo-500';
                    return (
                      <span key={`${s.id}-${i}`} className={`inline-flex items-center gap-2 mx-6 px-3 py-1 rounded-full text-xs font-medium border ${urgencyClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
                        {s.message}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
