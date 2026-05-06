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

// Student Pages
import { Dashboard as StudentDashboard } from "./pages/student/Dashboard";
import { Attendance } from "./pages/student/Attendance";
import { Activity } from "./pages/student/Activity";
import { Complaints } from "./pages/student/Complaints";
import { Reports as StudentReports } from "./pages/student/Reports";
import { Profile } from "./pages/student/Profile";

// Admin Pages
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminStudents } from "./pages/admin/Students";
import { Attendance as AdminAttendance } from "./pages/admin/Attendance";
import { AdminReports } from "./pages/admin/Reports";

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

        {/* Student Routes */}
        <Route path="/" element={<ProtectedRoute requiredRole="student"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="activity" element={<Activity />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="reports" element={<StudentReports />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Default Routes */}
        <Route path="/" element={<Navigate to={user ? (user?.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login"} />} />
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
