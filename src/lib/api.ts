import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'MFA_REQUIRED') {
      if (typeof window !== 'undefined') {
        window.location.href = '/mfa-setup';
      }
    }
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
  setupMfa: (data: { method: 'SMS_OTP' | 'TOTP' | 'EMAIL_OTP' }) => api.post('/auth/mfa/setup', data),
  verifyMfa: (data: { otp: string }) => api.post('/auth/mfa/verify', data),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getCollectionSummary: () => api.get('/dashboard/collection-summary'),
  getComplaintStats: () => api.get('/dashboard/complaint-stats'),
};

// Member APIs
export const memberAPI = {
  getAll: () => api.get('/members'),
  getById: (id: string) => api.get(`/members/${id}`),
  create: (data: any) => api.post('/members', data),
  update: (id: string, data: any) => api.put(`/members/${id}`, data),
  deactivate: (id: string) => api.delete(`/members/${id}`),
};

// Billing APIs
export const billingAPI = {
  getAllBills: () => api.get('/billing/bills'),
  getBillById: (id: string) => api.get(`/billing/bills/${id}`),
  createBill: (data: any) => api.post('/billing/bills', data),
  approveBill: (id: string) => api.put(`/billing/bills/${id}/approve`),
  rejectBill: (id: string) => api.put(`/billing/bills/${id}/reject`),
  generateMonthly: (data: any) => api.post('/billing/generate-monthly', data),
  getPayments: () => api.get('/billing/payments'),
  recordPayment: (data: any) => api.post('/billing/payments', data),
  getSummary: () => api.get('/billing/summary'),
};

export const mandateAPI = {
  list: () => api.get('/mandates'),
  create: (data: any) => api.post('/mandates', data),
  updateStatus: (id: string, status: string) => api.put(`/mandates/${id}/status`, { status }),
};

export const complianceAPI = {
  getCalendar: () => api.get('/compliance/calendar'),
  addEvent: (data: any) => api.post('/compliance/calendar', data),
  updateEvent: (id: string, status: string) => api.put(`/compliance/calendar/${id}`, { status }),
};

export const featureAPI = {
  list: () => api.get('/features'),
  upsert: (data: any) => api.put('/features', data),
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  send: (data: any) => api.post('/notifications', data),
};

export const privacyAPI = {
  getConsent: () => api.get('/privacy/consent'),
  updateConsent: (data: any) => api.put('/privacy/consent', data),
  createRequest: (data: any) => api.post('/privacy/requests', data),
};

export const taxAPI = {
  getReturns: () => api.get('/tax/returns'),
  exportGst: (data: any) => api.post('/tax/gst/export', data),
  exportTds: (data: any) => api.post('/tax/tds/export', data),
};

// Complaint APIs
export const complaintAPI = {
  getAll: () => api.get('/complaints'),
  getById: (id: string) => api.get(`/complaints/${id}`),
  create: (data: any) => api.post('/complaints', data),
  update: (id: string, data: any) => api.put(`/complaints/${id}`, data),
  assign: (id: string, data: any) => api.put(`/complaints/${id}/assign`, data),
  resolve: (id: string, data: any) => api.put(`/complaints/${id}/resolve`, data),
  close: (id: string) => api.put(`/complaints/${id}/close`),
};

// Notice APIs
export const noticeAPI = {
  getAll: () => api.get('/notices'),
  getById: (id: string) => api.get(`/notices/${id}`),
  create: (data: any) => api.post('/notices', data),
  update: (id: string, data: any) => api.put(`/notices/${id}`, data),
  publish: (id: string) => api.put(`/notices/${id}/publish`),
  remove: (id: string) => api.delete(`/notices/${id}`),
};

// Visitor APIs
export const visitorAPI = {
  getAll: () => api.get('/visitors'),
  create: (data: any) => api.post('/visitors', data),
  checkout: (id: string) => api.put(`/visitors/${id}/checkout`),
  approve: (id: string) => api.put(`/visitors/${id}/approve`),
};

// Facility APIs
export const facilityAPI = {
  getAll: () => api.get('/facilities'),
  getById: (id: string) => api.get(`/facilities/${id}`),
  create: (data: any) => api.post('/facilities', data),
  getBookings: (id: string) => api.get(`/facilities/${id}/bookings`),
  book: (id: string, data: any) => api.post(`/facilities/${id}/book`, data),
  cancelBooking: (bookingId: string) => api.put(`/facilities/bookings/${bookingId}/cancel`),
};

// Society APIs
export const societyAPI = {
  getAll: () => api.get('/societies'),
  getById: (id: string) => api.get(`/societies/${id}`),
  create: (data: any) => api.post('/societies', data),
  update: (id: string, data: any) => api.put(`/societies/${id}`, data),
  getWings: (id: string) => api.get(`/societies/${id}/wings`),
  addWing: (id: string, data: any) => api.post(`/societies/${id}/wings`, data),
  getFlats: (id: string) => api.get(`/societies/${id}/flats`),
  addFlat: (id: string, data: any) => api.post(`/societies/${id}/flats`, data),
};

export const planAPI = {
  getAll: () => api.get('/plans'),
  create: (data: any) => api.post('/plans', data),
  update: (id: string, data: any) => api.put(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`)
};

// Accounting APIs
export const accountingAPI = {
  getAccounts:      () => api.get('/accounting/accounts'),
  createAccount:    (data: any) => api.post('/accounting/accounts', data),
  getVouchers:      (params?: any) => api.get('/accounting/vouchers', { params }),
  createVoucher:    (data: any) => api.post('/accounting/vouchers', data),
  approveVoucher:   (id: string) => api.put(`/accounting/vouchers/${id}/approve`),
  reverseVoucher:   (id: string) => api.put(`/accounting/vouchers/${id}/reverse`),
  getVoucherEntries:(id: string) => api.get(`/accounting/vouchers/${id}/entries`),
  getTrialBalance:  (params?: any) => api.get('/accounting/trial-balance', { params }),
  getLedger:        (accountId: string, params?: any) => api.get(`/accounting/ledger/${accountId}`, { params }),
};

// Audit Log APIs
export const auditAPI = {
  getLogs:       (params?: any) => api.get('/audit', { params }),
  getActionTypes:() => api.get('/audit/actions'),
  getStats:      () => api.get('/audit/stats'),
};

