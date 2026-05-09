"use client";

import { useState, useEffect } from "react";
import { auditAPI } from "@/lib/api";
import { ClipboardList, ShieldAlert, Key, UserCheck, Settings, AlertCircle, FileText, Database } from "lucide-react";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    action: "",
    from: "",
    to: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, actionsRes, statsRes] = await Promise.all([
        auditAPI.getLogs(filters),
        auditAPI.getActionTypes(),
        auditAPI.getStats()
      ]);
      setLogs(logsRes.data.logs || []);
      setActions(actionsRes.data.actions || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error("Failed to fetch audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <Key className="w-4 h-4 text-emerald-500" />;
    if (action.includes('PERMISSION') || action.includes('ROLE')) return <ShieldAlert className="w-4 h-4 text-red-500" />;
    if (action.includes('VOUCHER') || action.includes('BILL') || action.includes('PAYMENT')) return <FileText className="w-4 h-4 text-indigo-500" />;
    if (action.includes('MEMBER') || action.includes('VISITOR')) return <UserCheck className="w-4 h-4 text-amber-500" />;
    return <Database className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-500" />
            System Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-1">Immutable log of system events, financial operations, and security actions.</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Events</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Last 24 Hours</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.last_24h}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Financial Events</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.financial_events}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Security Events</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.security_events}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Action Filter</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Actor</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Entity</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Details (IP / Trace)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No audit logs found for given criteria</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-semibold text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{log.actor_name || log.user_id}</div>
                      <div className="text-xs text-gray-500">{log.actor_email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 uppercase font-mono text-xs">{log.entity_type || '-'}</div>
                      <div className="text-[10px] text-gray-500 truncate w-32" title={log.entity_id}>{log.entity_id}</div>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      <div>IP: {log.ip_address || 'System'}</div>
                      <div className="text-[10px] truncate w-32" title={log.trace_id}>Trace: {log.trace_id}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
