import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  AlertCircle,
  BarChart3,
  Users,
  X
} from "lucide-react";
import { cn } from "../utils/cn";

const studentLinks = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: CheckSquare, label: "Attendance", path: "/attendance" },
  { icon: Clock, label: "Activity", path: "/activity" },
  { icon: AlertCircle, label: "Complaints", path: "/complaints" },
  { icon: BarChart3, label: "Reports", path: "/reports" }
];

const adminLinks = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Students", path: "/admin/students" },
  { icon: CheckSquare, label: "Attendance", path: "/admin/attendance" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" }
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const links = user?.role === "admin" ? adminLinks : studentLinks;

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed md:static left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-lg md:shadow-none transition-transform duration-300 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive(link.path)
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
