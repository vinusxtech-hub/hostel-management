import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export const AuthLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    if (user?.role === "admin") {
      return <Navigate to="/admin/dashboard" state={{ from: location }} replace />;
    }
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  const isSignup = location.pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-in-down">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-3xl font-bold text-white">HT</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Hostel Attendance Management System
        </p>
      </div>

      <div className={`mt-8 sm:mx-auto sm:w-full relative z-10 animate-slide-in-up ${isSignup ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="glass-panel rounded-2xl py-8 px-4 sm:px-10 border border-white/40 shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
