import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./store/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader } from "./components/Loader";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";

// Layouts
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";

// Auth
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";

// Student Pages
import { Dashboard as StudentDashboard } from "./pages/student/Dashboard";
import { Attendance } from "./pages/student/Attendance";
import { Activity } from "./pages/student/Activity";
import { Complaints } from "./pages/student/Complaints";
import { Reports as StudentReports } from "./pages/student/Reports";
import { Profile } from "./pages/student/Profile";
import { Notices as StudentNotices } from "./pages/student/Notices";
import { LeaveRequest } from "./pages/student/LeaveRequest"; 

// Admin Pages
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminStudents } from "./pages/admin/Students";
import { Attendance as AdminAttendance } from "./pages/admin/Attendance";
import { AdminReports } from "./pages/admin/Reports";
import { AdminNotices } from "./pages/admin/Notices";
import { AdminWardens } from "./pages/admin/Wardens";

// Warden Pages
import { WardenDashboard } from "./pages/warden/Dashboard";
import { WardenStudents } from "./pages/warden/Students";
import { WardenComplaints } from "./pages/warden/Complaints";
import { WardenNotices } from "./pages/warden/Notices";
import { WardenLeaves } from "./pages/warden/Leaves";  

function AppContent() {
  const { user, isLoading } = useAuth();
  const { toasts, removeToast } = useToast();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="Initializing application..." />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthLayout />}>
          <Route index element={<Login />} />
        </Route>
        <Route path="/signup" element={<AuthLayout />}>
          <Route index element={<Signup />} />
        </Route>
        <Route path="/forgot-password" element={<AuthLayout />}>
          <Route index element={<ForgotPassword />} />
        </Route>
        <Route path="/reset-password" element={<AuthLayout />}>
          <Route index element={<ResetPassword />} />
        </Route>

        {/* Student Routes */}
        <Route path="/" element={<ProtectedRoute requiredRole="student"><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="activity" element={<Activity />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="reports" element={<StudentReports />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="leaves" element={<LeaveRequest />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="wardens" element={<AdminWardens />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Warden Routes */}
        <Route path="/warden" element={<ProtectedRoute requiredRole="warden"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<WardenDashboard />} />
          <Route path="students" element={<WardenStudents />} />
          <Route path="complaints" element={<WardenComplaints />} />
          <Route path="notices" element={<WardenNotices />} />
          <Route path="leaves" element={<WardenLeaves />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
