const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('hostel_token');

const handleResponse = async (response) => {
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
    getComplaints: async () => {
      const response = await fetch(`${BASE_URL}/student/complaints`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    submitComplaint: async (data) => {
      const response = await fetch(`${BASE_URL}/student/complaints`, {
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
    }
  },
  
  // Admin APIs
  admin: {
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
    getComplaints: async () => {
      const response = await fetch(`${BASE_URL}/admin/complaints`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateComplaint: async (id, data) => {
      const response = await fetch(`${BASE_URL}/admin/complaints/${id}`, {
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
    getComplaints: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/warden/complaints${query ? `?${query}` : ''}`, {
        headers: authHeaders(),
      });
      return handleResponse(response);
    },
    updateComplaint: async (id, data) => {
      const response = await fetch(`${BASE_URL}/warden/complaints/${id}`, {
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
    }
  }
};
