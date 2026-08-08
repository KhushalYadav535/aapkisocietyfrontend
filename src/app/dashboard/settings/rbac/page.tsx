"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rbacAPI, memberAPI, platformAPI } from '@/lib/api';
import { X, Building2, RefreshCw } from 'lucide-react';

export default function RBACManagement() {
  const { user, hasPermission } = useAuth();
  const [positions, setPositions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Platform Admin state
  const [societies, setSocieties] = useState<any[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>('');

  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal state
  const [historyUser, setHistoryUser] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'PLATFORM_ADMIN') {
      platformAPI.getAllSocieties().then(res => {
        setSocieties(res.data.societies || []);
        if (user.society_id) setSelectedSocietyId(user.society_id);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to fetch societies', err);
        setError('Failed to fetch societies');
        setLoading(false);
      });
    } else if (user?.society_id) {
      setSelectedSocietyId(user.society_id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedSocietyId) {
      fetchData(selectedSocietyId);
    }
  }, [selectedSocietyId]);

  const fetchData = async (societyId: string) => {
    try {
      setLoading(true);
      setError('');
      const [posRes, assignRes, memRes] = await Promise.all([
        rbacAPI.getPositions(societyId),
        rbacAPI.getAssignments(societyId),
        memberAPI.getAll({ limit: 1000 })
      ]);
      console.log('Positions from API:', posRes.data);
      setPositions(posRes.data.positions || []);
      setAssignments(assignRes.data.assignments || []);
      
      let fetchedMembers = memRes.data.members || memRes.data.data || [];
      if (user?.role === 'PLATFORM_ADMIN') {
        fetchedMembers = fetchedMembers.filter((m: any) => m.society_id === societyId);
      }
      setMembers(fetchedMembers);
    } catch (err: any) {
      console.error('Failed to fetch RBAC data', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedPosition || !startDate || !endDate || !selectedSocietyId) return;

    try {
      await rbacAPI.assignPosition(selectedSocietyId, {
        userId: selectedUser,
        positionCode: selectedPosition,
        startDate,
        endDate
      });
      fetchData(selectedSocietyId); // refresh list
      // Reset form
      setSelectedUser('');
      setSelectedPosition('');
      setStartDate('');
      setEndDate('');
      alert('Position assigned successfully');
    } catch (err) {
      console.error('Failed to assign position', err);
      alert('Failed to assign position. Check if user already has an active assignment for this term.');
    }
  };

  if (!hasPermission('SOCIETY_MANAGE')) {
    return <div className="p-6 text-red-500">You do not have permission to access RBAC Management.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading RBAC data...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Role & Position Management</h1>
          <p className="text-gray-500 text-sm">Assign positions to society members to grant them specific permissions dynamically based on their term.</p>
          <p className="text-xs text-gray-400 mt-1">Positions loaded: <strong>{positions.length}</strong> | Members loaded: <strong>{members.length}</strong></p>
        </div>
        <button
          onClick={() => selectedSocietyId && fetchData(selectedSocietyId)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title="Refresh positions and members"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Assign New Position</h2>
        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          
          {user?.role === 'PLATFORM_ADMIN' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Society</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select 
                  value={selectedSocietyId} onChange={e => setSelectedSocietyId(e.target.value)}
                  className="w-full border border-gray-200 rounded pl-9 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Society</option>
                  {societies.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Member {members.length > 0 ? `(${members.length})` : '(No members found)'}
            </label>
            <select 
              value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              disabled={!selectedSocietyId || members.length === 0}
            >
              <option value="">Select Member</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Position</label>
            <select 
              value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              disabled={!selectedSocietyId}
            >
              <option value="">Select Position</option>
              {positions.map((p: any) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            {selectedPosition && (() => {
              const POSITION_INFO: Record<string, { color: string; hint: string }> = {
                TREASURY_MAKER:   { color: 'amber',  hint: 'Can CREATE vouchers/bills — awaits Checker approval' },
                TREASURY_CHECKER: { color: 'indigo', hint: 'Can APPROVE vouchers/bills — cannot approve own entries' },
                TREASURER:        { color: 'emerald', hint: 'Full finance access — bills, vouchers, tax, ledger' },
                SECRETARY:        { color: 'violet', hint: 'Full society admin access' },
                MEMBER:           { color: 'blue',   hint: 'Committee member — notices, complaints' },
                RESIDENT:         { color: 'orange', hint: 'Basic resident access' },
              };
              const info = POSITION_INFO[selectedPosition];
              if (!info) return null;
              const colorMap: Record<string, string> = {
                amber: 'bg-amber-50 border-amber-200 text-amber-700',
                indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                violet: 'bg-violet-50 border-violet-200 text-violet-700',
                blue: 'bg-blue-50 border-blue-200 text-blue-700',
                orange: 'bg-orange-50 border-orange-200 text-orange-700',
              };
              return (
                <p className={`mt-1.5 text-xs px-2 py-1 rounded border ${colorMap[info.color]}`}>
                  💡 {info.hint}
                </p>
              );
            })()}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded text-sm transition-colors font-medium"
            >
              Assign Position
            </button>
          </div>

        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Current & Past Assignments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Position</th>
                <th className="p-4 font-medium">Start Date</th>
                <th className="p-4 font-medium">End Date</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a: any) => (
                <tr 
                  key={a.id} 
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => setHistoryUser(a)}
                >
                  <td className="p-4">
                    <div className="font-medium">{a.first_name} {a.last_name}</div>
                    <div className="text-xs text-gray-500">{a.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {a.position_name}
                    </span>
                  </td>
                  <td className="p-4">{new Date(a.start_date).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(a.end_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    {a.status === 'ACTIVE' && new Date() >= new Date(a.start_date) && new Date() <= new Date(a.end_date) ? (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">Active</span>
                    ) : (
                      <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No assignments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History Modal */}
      {historyUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{historyUser.first_name} {historyUser.last_name}</h3>
                <p className="text-sm text-gray-500">{historyUser.email}</p>
              </div>
              <button 
                onClick={() => setHistoryUser(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Assignment History</h4>
              
              <div className="space-y-4">
                {assignments.filter((a: any) => a.user_id === historyUser.user_id).map((history: any) => {
                  const isActive = history.status === 'ACTIVE' && new Date() >= new Date(history.start_date) && new Date() <= new Date(history.end_date);
                  return (
                    <div key={history.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-900">{history.position_name}</span>
                          {isActive ? (
                            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-green-200">Active</span>
                          ) : (
                            <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-gray-200">Past</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(history.start_date).toLocaleDateString()} — {new Date(history.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <div>ID: {history.id.split('-')[0]}...</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button 
                onClick={() => setHistoryUser(null)}
                className="px-5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
