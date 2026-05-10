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

// Reports APIs
export const reportsAPI = {
  getCollection:  (params?: any) => api.get('/reports/collection', { params }),
  getComplaints:   (params?: any) => api.get('/reports/complaints', { params }),
  getBilling:      (params?: any) => api.get('/reports/billing', { params }),
  getVisitors:     (params?: any) => api.get('/reports/visitors', { params }),
  getDashboardSummary: () => api.get('/reports/dashboard-summary'),
};

// Staff APIs
export const staffAPI = {
  getAll: () => api.get('/staff'),
  getStaff: () => api.get('/staff/list'),
  create: (data: any) => api.post('/staff', data),
  checkIn: (staffId: string) => api.post('/staff/check-in', { staff_id: staffId }),
  checkOut: (staffId: string, notes?: string) => api.post('/staff/check-out', { staff_id: staffId, notes }),
  markAbsent: (staffId: string, date?: string, reason?: string) => api.post('/staff/mark-absent', { staff_id: staffId, date, reason }),
  getSummary: (params?: any) => api.get('/staff/summary', { params }),
  deactivate: (id: string) => api.delete(`/staff/${id}`),
};

// Document APIs
export const documentAPI = {
  getAll: (params?: any) => api.get('/documents', { params }),
  getById: (id: string) => api.get(`/documents/${id}`),
  upload: (formData: any) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  getCategories: () => api.get('/documents/categories'),
};

// Notice Read APIs
export const noticeReadAPI = {
  markRead: (noticeId: string) => api.post('/notice-reads/mark-read', { notice_id: noticeId }),
  getReceipts: (noticeId: string) => api.get(`/notice-reads/receipts/${noticeId}`),
  getUnread: () => api.get('/notice-reads/unread'),
};

// Tenant APIs
export const tenantAPI = {
  getAll: (params?: any) => api.get('/tenants', { params }),
  getMine: () => api.get('/tenants/mine'),
  create: (data: any) => api.post('/tenants', data),
  approve: (id: string) => api.post(`/tenants/${id}/approve`),
  reject: (id: string, reason?: string) => api.post(`/tenants/${id}/reject`, { reason }),
  extendLease: (id: string, data: any) => api.put(`/tenants/${id}/extend`, data),
  terminate: (id: string, reason?: string) => api.post(`/tenants/${id}/terminate`, { reason }),
};

// Vehicle APIs
export const vehicleAPI = {
  getAll: (params?: any) => api.get('/vehicles', { params }),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  getParkingSlots: (params?: any) => api.get('/vehicles/parking-slots', { params }),
  createParkingSlot: (data: any) => api.post('/vehicles/parking-slots', data),
  assignSlot: (id: string, flatId: string) => api.post(`/vehicles/parking-slots/${id}/assign`, { flat_id: flatId }),
};

// Vendor APIs
export const vendorAPI = {
  getAll: (params?: any) => api.get('/vendors', { params }),
  create: (data: any) => api.post('/vendors', data),
  update: (id: string, data: any) => api.put(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
  rate: (id: string, data: { rating: number; review?: string }) => api.post(`/vendors/${id}/rate`, data),
  getReviews: (id: string) => api.get(`/vendors/${id}/reviews`),
  getCategories: () => api.get('/vendors/categories'),
};

// Message APIs
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string, params?: any) => api.get(`/messages/${conversationId}`, { params }),
  send: (data: { receiver_id: string; content: string }) => api.post('/messages/send', data),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// Meeting APIs
export const meetingAPI = {
  getAll: (params?: any) => api.get('/meetings', { params }),
  getById: (id: string) => api.get(`/meetings/${id}`),
  create: (data: any) => api.post('/meetings', data),
  updateStatus: (id: string, data: any) => api.put(`/meetings/${id}/status`, data),
  getPolls: (params?: any) => api.get('/meetings/polls/all', { params }),
  createPoll: (data: any) => api.post('/meetings/polls', data),
  vote: (id: string, optionId: string) => api.post(`/meetings/polls/${id}/vote`, { option_id: optionId }),
  closePoll: (id: string) => api.put(`/meetings/polls/${id}/close`),
};

// SOS Emergency Alert APIs
export const sosAPI = {
  getAll: (params?: any) => api.get('/sos', { params }),
  raise: (data: { alert_type: string; description?: string }) => api.post('/sos', data),
  respond: (id: string) => api.put(`/sos/${id}/respond`),
  resolve: (id: string) => api.put(`/sos/${id}/resolve`),
  getActiveCount: () => api.get('/sos/active-count'),
};

// Guard Patrol APIs
export const patrolAPI = {
  getCheckpoints: () => api.get('/patrol/checkpoints'),
  createCheckpoint: (data: any) => api.post('/patrol/checkpoints', data),
  deleteCheckpoint: (id: string) => api.delete(`/patrol/checkpoints/${id}`),
  scan: (data: { qr_code: string; notes?: string }) => api.post('/patrol/scan', data),
  getLogs: (params?: any) => api.get('/patrol/logs', { params }),
  getSummary: () => api.get('/patrol/summary'),
};

// Emergency Contact APIs
export const emergencyContactAPI = {
  getAll: () => api.get('/emergency-contacts'),
  create: (data: any) => api.post('/emergency-contacts', data),
  update: (id: string, data: any) => api.put(`/emergency-contacts/${id}`, data),
  remove: (id: string) => api.delete(`/emergency-contacts/${id}`),
};

// Asset Management APIs
export const assetAPI = {
  getAll: (params?: any) => api.get('/assets', { params }),
  getAmcAlerts: () => api.get('/assets/amc-alerts'),
  getByQr: (qrCode: string) => api.get(`/assets/by-qr/${qrCode}`),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.put(`/assets/${id}`, data),
  remove: (id: string) => api.delete(`/assets/${id}`),
  addServiceLog: (id: string, data: any) => api.post(`/assets/${id}/service-log`, data),
  getServiceLogs: (id: string) => api.get(`/assets/${id}/service-logs`),
};

// Extended Reports APIs
export const extendedReportsAPI = {
  getDefaulterAging: () => api.get('/reports/defaulters'),
};
