const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORAGE_TOKEN_KEY = 'hostel_token';
const STORAGE_USER_KEY = 'hostel_user';

const migrateAuthFromLocalStorage = () => {
  const localToken = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (localToken && !sessionStorage.getItem(STORAGE_TOKEN_KEY)) {
    sessionStorage.setItem(STORAGE_TOKEN_KEY, localToken);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }

  const localUser = localStorage.getItem(STORAGE_USER_KEY);
  if (localUser && !sessionStorage.getItem(STORAGE_USER_KEY)) {
    sessionStorage.setItem(STORAGE_USER_KEY, localUser);
    localStorage.removeItem(STORAGE_USER_KEY);
  }
};

const getToken = () => {
  migrateAuthFromLocalStorage();
  return sessionStorage.getItem(STORAGE_TOKEN_KEY);
};

const handleResponse = async (response) => {
  if (response.status === 401 && !response.url.includes('/auth/login')) {
    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Create headers with auth token
const authHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra
});

export const api = {
  // Auth APIs
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },
    register: async (data) => {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getMe: async () => {
      const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    forgotPassword: async (email) => {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    },
    resetPassword: async (token, password) => {
      const response = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return handleResponse(response);
    },
    // Universal profile update — works for all roles
    // Supports: name, email, phone, parentPhone, address, department, room
    // Password change: currentPassword, newPassword, confirmNewPassword
    updateProfile: async (data) => {
      const response = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    }
  },

  // Student APIs
  student: {
    getAttendanceHistory: async () => {
      const response = await fetch(`${BASE_URL}/student/attendance`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    markAttendance: async (location) => {
      const response = await fetch(`${BASE_URL}/student/attendance`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(location),
      });
      return handleResponse(response);
    },
    getReports: async () => {
      const response = await fetch(`${BASE_URL}/student/reports`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getResolutions: async () => {
      const response = await fetch(`${BASE_URL}/student/resolutions`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    submitResolution: async (data) => {
      const response = await fetch(`${BASE_URL}/student/resolutions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    // Backward compatibility aliases
    getResolutions: async () => {
      const response = await fetch(`${BASE_URL}/student/resolutions`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    submitResolution: async (data) => {
      const response = await fetch(`${BASE_URL}/student/resolutions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getProfile: async () => {
      const response = await fetch(`${BASE_URL}/student/profile`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateProfile: async (data) => {
      const response = await fetch(`${BASE_URL}/student/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getSettings: async () => {
      const response = await fetch(`${BASE_URL}/student/settings`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getNotices: async () => {
      const response = await fetch(`${BASE_URL}/student/notices`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    // Leave Management APIs
    getLeaves: async () => {
      const response = await fetch(`${BASE_URL}/student/leaves`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    applyLeave: async (data) => {
      const response = await fetch(`${BASE_URL}/student/leaves`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    cancelLeave: async (id) => {
      const response = await fetch(`${BASE_URL}/student/leaves/${id}/cancel`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      return handleResponse(response);
    }
  },
  
  // Admin APIs
  admin: {
    getSettings: async () => {
      const response = await fetch(`${BASE_URL}/admin/settings`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateSettings: async (data) => {
      const response = await fetch(`${BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    sendAttendanceReminders: async (role = 'admin') => {
      const response = await fetch(`${BASE_URL}/${role}/attendance/remind`, {
        method: 'POST',
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getDashboardStats: async () => {
      const response = await fetch(`${BASE_URL}/admin/stats`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getStudents: async () => {
      const response = await fetch(`${BASE_URL}/admin/students`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getStudentDetails: async (id) => {
      const response = await fetch(`${BASE_URL}/admin/students/${id}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    addStudent: async (data) => {
      const response = await fetch(`${BASE_URL}/admin/students`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    bulkImportStudents: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/admin/students/bulk-import`, {
        method: 'POST',
        headers: {
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: formData,
      });
      return handleResponse(response);
    },
    getAttendance: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/admin/attendance${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getReports: async () => {
      const response = await fetch(`${BASE_URL}/admin/reports`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getResolutions: async () => {
      const response = await fetch(`${BASE_URL}/admin/resolutions`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateResolution: async (id, data) => {
      const response = await fetch(`${BASE_URL}/admin/resolutions/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    // Backward compatibility
    getResolutions: async () => {
      const response = await fetch(`${BASE_URL}/admin/resolutions`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateResolution: async (id, data) => {
      const response = await fetch(`${BASE_URL}/admin/resolutions/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getNotices: async () => {
      const response = await fetch(`${BASE_URL}/admin/notices`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    createNotice: async (data) => {
      const response = await fetch(`${BASE_URL}/admin/notices`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    updateNotice: async (id, data) => {
      const response = await fetch(`${BASE_URL}/admin/notices/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deleteNotice: async (id) => {
      const response = await fetch(`${BASE_URL}/admin/notices/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getWardens: async () => {
      const response = await fetch(`${BASE_URL}/admin/wardens`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getWardenDetails: async (id) => {
      const response = await fetch(`${BASE_URL}/admin/wardens/${id}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    addWarden: async (data) => {
      const response = await fetch(`${BASE_URL}/admin/wardens`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deleteWarden: async (id) => {
      const response = await fetch(`${BASE_URL}/admin/wardens/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getPendingLeaves: async () => {
      const response = await fetch(`${BASE_URL}/admin/leaves`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getLeaves: async () => {
      const response = await fetch(`${BASE_URL}/admin/leaves/all`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    approveLeave: async (id, data) => {
      const response = await fetch(`${BASE_URL}/admin/leaves/${id}/approve`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    rejectLeave: async (id, data) => {
      const response = await fetch(`${BASE_URL}/admin/leaves/${id}/reject`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getGuards: async () => {
      const response = await fetch(`${BASE_URL}/admin/guards`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    addGuard: async (data) => {
      const response = await fetch(`${BASE_URL}/admin/guards`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deleteGuard: async (id) => {
      const response = await fetch(`${BASE_URL}/admin/guards/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    bulkImportGuards: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/admin/guards/bulk-import`, {
        method: 'POST',
        headers: {
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: formData,
      });
      return handleResponse(response);
    },
    getScanHistory: async () => {
      const response = await fetch(`${BASE_URL}/admin/scan-history`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Warden APIs
  warden: {
    getDashboardStats: async () => {
      const response = await fetch(`${BASE_URL}/warden/stats`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getStudents: async () => {
      const response = await fetch(`${BASE_URL}/warden/students`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getStudentDetails: async (id) => {
      const response = await fetch(`${BASE_URL}/warden/students/${id}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getResolutions: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/warden/resolutions${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateResolution: async (id, data) => {
      const response = await fetch(`${BASE_URL}/warden/resolutions/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getResolutions: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/warden/resolutions${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateResolution: async (id, data) => {
      const response = await fetch(`${BASE_URL}/warden/resolutions/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getNotices: async () => {
      const response = await fetch(`${BASE_URL}/warden/notices`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    createNotice: async (data) => {
      const response = await fetch(`${BASE_URL}/warden/notices`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    updateNotice: async (id, data) => {
      const response = await fetch(`${BASE_URL}/warden/notices/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deleteNotice: async (id) => {
      const response = await fetch(`${BASE_URL}/warden/notices/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    // Leave Management APIs
    getPendingLeaves: async () => {
      const response = await fetch(`${BASE_URL}/warden/leaves`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getAllLeaves: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/warden/leaves/all${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    approveLeave: async (id, data) => {
      const response = await fetch(`${BASE_URL}/warden/leaves/${id}/approve`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    rejectLeave: async (id, data) => {
      const response = await fetch(`${BASE_URL}/warden/leaves/${id}/reject`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    addStudent: async (data) => {
      const response = await fetch(`${BASE_URL}/warden/students`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    bulkImportStudents: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/warden/students/bulk-import`, {
        method: 'POST',
        headers: {
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: formData,
      });
      return handleResponse(response);
    },
    getScanHistory: async () => {
      const response = await fetch(`${BASE_URL}/warden/scan-history`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Device Info APIs
  device: {
    storeDeviceInfo: async (data) => {
      const response = await fetch(`${BASE_URL}/device/info`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getAllDeviceInfo: async () => {
      const response = await fetch(`${BASE_URL}/device/info`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    getUserDeviceInfo: async (userId) => {
      const response = await fetch(`${BASE_URL}/device/info/${userId}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Guard APIs
  guard: {
    verifyQr: async (token) => {
      const response = await fetch(`${BASE_URL}/guard/verify-qr`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ token }),
      });
      return handleResponse(response);
    },
    getHistory: async () => {
      const response = await fetch(`${BASE_URL}/guard/history`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Notifications APIs
  notifications: {
    get: async () => {
      const response = await fetch(`${BASE_URL}/notifications`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    markRead: async (id) => {
      const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    markAllRead: async () => {
      const response = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      return handleResponse(response);
    }
  }
};
