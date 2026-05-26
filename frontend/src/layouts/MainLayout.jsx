import { useState } from "react";
import { Outlet, Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  History, 
  MessageSquare, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X,
  Users,
  Megaphone,
  Shield,
  CalendarOff
} from "lucide-react";
import { cn } from "../utils/cn";

const studentNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Activity', href: '/activity', icon: History },
  { name: 'Resolutions', href: '/resolutions', icon: MessageSquare },
  { name: 'Leaves', href: '/leaves', icon: CalendarOff },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Notices', href: '/notices', icon: Megaphone },
  { name: 'Profile', href: '/profile', icon: User },
];

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Notices', href: '/admin/notices', icon: Megaphone },
  { name: 'Wardens', href: '/admin/wardens', icon: Shield },
];

const wardenNavigation = [
  { name: 'Dashboard', href: '/warden/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/warden/students', icon: Users },
  { name: 'Resolutions', href: '/warden/resolutions', icon: MessageSquare },
  { name: 'Leaves', href: '/warden/leaves', icon: CalendarOff },
  { name: 'Notices', href: '/warden/notices', icon: Megaphone },
  { name: 'Profile', href: '/warden/profile', icon: User },
];

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = user?.role === 'admin' ? adminNavigation : user?.role === 'warden' ? wardenNavigation : studentNavigation;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-xl tracking-tight">
          Sistec Hostel
        </div>
        
        <div className="px-4 py-6 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  isActive ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn("mr-3 flex-shrink-0 h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-600 mr-4"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium text-slate-900">{user?.name}</p>
              <p className="text-slate-500">{user?.role === 'admin' ? 'Administrator' : user?.role === 'warden' ? 'Warden' : `Room ${user?.room}`}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
              {user?.name.charAt(0)}
            </div>
            {user?.role !== 'student' && (
              <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
