"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authAPI, rbacAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  society_id: string | null;
  flat_number: string | null;
  wing: string | null;
  phone: string | null;
  avatar_url: string | null;
  blood_group?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  hasPermission: (code: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await rbacAPI.getPermissions();
      setPermissions(res.data.permissions || []);
    } catch (err) {
      console.error('Failed to fetch permissions', err);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
      fetchPermissions();

      // Refresh profile to keep user synced (especially society_id after auto-assignment)
      authAPI.getProfile().then(res => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      }).catch(() => {});
    }
    setLoading(false);
  }, [fetchPermissions]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    await fetchPermissions();
  };

  const register = async (data: any) => {
    const res = await authAPI.register(data);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    await fetchPermissions();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (code: string) => {
    const role = String(user?.role || '').toUpperCase();
    if (role === 'PLATFORM_ADMIN' || role === 'ADMIN') return true;
    if (['COMMITTEE', 'SECRETARY'].includes(role)) {
      if (['COMPLAINT_ASSIGN', 'COMPLAINT_RESOLVE', 'SOCIETY_MANAGE', 'NOC_MANAGE', 'NOC_APPROVE', 'VIOLATION_MANAGE', 'ACCOUNTING_MANAGE', 'AUDIT_VIEW', 'VOUCHER_VIEW', 'REPORT_VIEW', 'COMPLIANCE_MANAGE', 'NOTIFICATION_MANAGE', 'NOTICE_CREATE', 'FACILITY_MANAGE', 'STAFF_MANAGE', 'VEHICLE_MANAGE'].includes(code)) return true;
    }
    if (['TREASURER', 'TREASURY'].includes(role)) {
      if (['ACCOUNTING_MANAGE', 'AUDIT_VIEW', 'VOUCHER_VIEW', 'REPORT_VIEW', 'BILLING_APPROVE', 'BILL_APPROVE', 'BILLING_CREATE', 'COMPLIANCE_MANAGE', 'NOTIFICATION_MANAGE', 'TAX_MANAGE', 'TAX_VIEW'].includes(code)) return true;
    }
    if (['CHECKER', 'TREASURY_CHECKER'].includes(role)) {
      if (['ACCOUNTING_MANAGE', 'AUDIT_VIEW', 'VOUCHER_VIEW', 'REPORT_VIEW', 'BILLING_APPROVE', 'BILL_APPROVE', 'COMPLIANCE_MANAGE', 'TAX_MANAGE', 'TAX_VIEW', 'NOTIFICATION_MANAGE'].includes(code)) return true;
    }
    if (['MAKER', 'TREASURY_MAKER'].includes(role)) {
      if (['ACCOUNTING_MANAGE', 'AUDIT_VIEW', 'VOUCHER_VIEW', 'REPORT_VIEW', 'BILLING_CREATE', 'COMPLIANCE_MANAGE'].includes(code)) return true;
    }
    if (role === 'GUARD') {
      if (['VISITOR_MANAGE', 'PATROL_MANAGE', 'SOS_RESPOND'].includes(code)) return true;
    }
    return permissions.includes(code);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      permissions,
      hasPermission,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!token && !!user,
      setUser,
      refreshPermissions: fetchPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
