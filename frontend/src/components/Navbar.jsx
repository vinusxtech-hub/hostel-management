import { Menu, LogOut, Bell, User } from "lucide-react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";

export const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleLabel = user?.role === "warden" && user?.hostelSection
    ? `${user.hostelSection} warden`
    : user?.role;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Hostel Attendance</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{roleLabel}</p>
            </div>
            <button
              onClick={() => navigate(`/${user?.role}/profile`)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <User className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
