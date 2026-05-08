"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Building2, LayoutDashboard, Users, Receipt, MessageSquareWarning,
  Megaphone, UserCheck, CalendarDays, Settings, LogOut, Menu, X,
  Bell, BarChart3, Globe, ChevronRight, Sparkles, ShieldCheck, CalendarClock
  , FileSpreadsheet, Fingerprint
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useLocale } from "@/context/LocaleContext";

const normalizeRole = (role: string) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN", "MAKER", "CHECKER"], section: "main" },
  { href: "/dashboard/members", label: "Members", icon: Users, roles: ["ADMIN", "TREASURER", "COMMITTEE", "PLATFORM_ADMIN"], section: "management" },
  { href: "/dashboard/properties", label: "Properties Setup", icon: Building2, roles: ["ADMIN"], section: "management" },
  { href: "/dashboard/billing", label: "Billing & Payments", icon: Receipt, roles: ["ADMIN", "TREASURER", "MAKER", "CHECKER", "RESIDENT"], section: "management" },
  { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT"], section: "management" },
  { href: "/dashboard/notices", label: "Notices", icon: Megaphone, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT"], section: "management" },
  { href: "/dashboard/visitors", label: "Visitors", icon: UserCheck, roles: ["ADMIN", "COMMITTEE", "RESIDENT", "GUARD"], section: "management" },
  { href: "/dashboard/facilities", label: "Facilities", icon: CalendarDays, roles: ["ADMIN", "COMMITTEE", "RESIDENT"], section: "management" },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "TREASURER"], section: "analytics" },
  { href: "/dashboard/tax", label: "Tax & Returns", icon: FileSpreadsheet, roles: ["ADMIN", "TREASURER"], section: "analytics" },
  { href: "/dashboard/compliance", label: "Compliance Calendar", icon: CalendarClock, roles: ["ADMIN", "TREASURER", "COMMITTEE"], section: "analytics" },
  { href: "/dashboard/notifications", label: "Notifications", icon: ShieldCheck, roles: ["ADMIN", "TREASURER", "COMMITTEE"], section: "analytics" },
  { href: "/dashboard/privacy", label: "Privacy & Consent", icon: Fingerprint, roles: ["ADMIN", "TREASURER", "COMMITTEE", "RESIDENT", "PLATFORM_ADMIN", "MAKER", "CHECKER"], section: "settings" },
  { href: "/dashboard/societies", label: "Societies & Plans", icon: Globe, roles: ["PLATFORM_ADMIN"], section: "analytics" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "PLATFORM_ADMIN"], section: "settings" },
];

const sections: Record<string, string> = {
  main: "",
  management: "Management",
  analytics: "Analytics",
  settings: "System",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const userRole = normalizeRole(user?.role || "");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Route-level access guard (prevents direct URL access). Must be declared before any early returns.
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    if (!pathname) return;
    const allowed = navItems.some((item) => {
      const allowedRoles = item.roles.map(normalizeRole);
      if (!allowedRoles.includes(userRole)) return false;
      if (item.href === "/dashboard") return pathname === "/dashboard";
      return pathname === item.href || pathname.startsWith(item.href + "/");
    });
    if (!allowed) router.replace("/dashboard");
  }, [loading, isAuthenticated, pathname, router, userRole]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float shadow-2xl shadow-indigo-500/30">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  const filteredNav = navItems.filter(item => item.roles.map(normalizeRole).includes(userRole));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Group nav by section
  const groupedNav = filteredNav.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const roleColors: Record<string, string> = {
    ADMIN: "from-indigo-500 to-purple-600",
    TREASURER: "from-emerald-500 to-teal-600",
    COMMITTEE: "from-blue-500 to-cyan-600",
    RESIDENT: "from-orange-400 to-rose-500",
    PLATFORM_ADMIN: "from-violet-600 to-fuchsia-600",
    GUARD: "from-slate-500 to-gray-600",
  };
  const avatarGradient = roleColors[userRole] || "from-indigo-500 to-purple-600";

  return (
    <div className="min-h-screen flex bg-mesh">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#0f172a] text-white transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`} style={{ boxShadow: '4px 0 40px rgba(0,0,0,0.3)' }}>
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/8">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Building2 className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f172a]" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-base font-bold text-white tracking-tight">AapkiSociety</h1>
            <p className="text-xs text-slate-400 truncate">Smart Management Platform</p>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {Object.entries(groupedNav).map(([section, items]) => (
            <div key={section} className={section !== "main" ? "mt-5" : ""}>
              {sections[section] && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
                  {sections[section]}
                </p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25"
                        : "text-slate-400 hover:text-white hover:bg-white/6"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* AI Badge */}
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 rounded-xl p-3 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-300">AI Pro Plan</p>
              <p className="text-[10px] text-slate-500 truncate">Smart insights active</p>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="px-3 pb-4 border-t border-white/8 pt-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className={`w-9 h-9 bg-gradient-to-br ${avatarGradient} rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md`}>
              {getInitials(user?.first_name || "", user?.last_name || "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full mt-1 group"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/60 px-6 py-3.5" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 hover:bg-indigo-50 rounded-xl transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-800 font-medium capitalize">
                  {pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Dashboard"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocale(locale === "en" ? "hi" : "en")}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50"
                title="Switch language"
              >
                {locale === "en" ? "EN" : "HI"}
              </button>
              {/* Notification Bell */}
              <button className="relative p-2.5 hover:bg-indigo-50 rounded-xl transition-colors group">
                <Bell className="w-4.5 h-4.5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
                <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradient} rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                  {getInitials(user?.first_name || "", user?.last_name || "")}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.first_name}</p>
                  <p className="text-xs text-indigo-500 leading-tight">{user?.role?.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
