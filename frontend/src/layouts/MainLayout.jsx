import { useState, useEffect } from "react";
import { Outlet, Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { api } from "../services/api";
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
  ShieldCheck,
  CalendarOff,
  Settings
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
];

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Leaves', href: '/admin/leaves', icon: CalendarOff },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Notices', href: '/admin/notices', icon: Megaphone },
  { name: 'Wardens', href: '/admin/wardens', icon: Shield },
  { name: 'Guards', href: '/admin/guards', icon: ShieldCheck },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Scan History', href: '/admin/scan-history', icon: History },
];

const wardenNavigation = [
  { name: 'Dashboard', href: '/warden/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/warden/students', icon: Users },
  { name: 'Resolutions', href: '/warden/resolutions', icon: MessageSquare },
  { name: 'Leaves', href: '/warden/leaves', icon: CalendarOff },
  { name: 'Notices', href: '/warden/notices', icon: Megaphone },
  { name: 'Scan History', href: '/warden/scan-history', icon: History },
];

const guardNavigation = [
  { name: 'Scan QR', href: '/guard/dashboard', icon: LayoutDashboard },
  { name: 'Scan History', href: '/guard/history', icon: History },
];

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const [badges, setBadges] = useState({
    leaves: 0,
    resolutions: 0,
    notices: 0
  });

  const fetchBadges = async () => {
    if (!user) return;
    try {
      if (user.role === 'admin') {
        const pendingLeaves = await api.admin.getPendingLeaves().catch(() => []);
        const allResolutions = await api.admin.getResolutions().catch(() => []);
        const pendingResCount = allResolutions.filter(r => r.status === 'Pending').length;
        setBadges({
          leaves: pendingLeaves.length,
          resolutions: pendingResCount,
          notices: 0
        });
      } else if (user.role === 'warden') {
        const pendingLeaves = await api.warden.getPendingLeaves().catch(() => []);
        const pendingResolutions = await api.warden.getResolutions({ status: 'Pending' }).catch(() => []);
        setBadges({
          leaves: pendingLeaves.length,
          resolutions: pendingResolutions.length,
          notices: 0
        });
      } else if (user.role === 'student') {
        const allNotices = await api.student.getNotices().catch(() => []);
        const allLeaves = await api.student.getLeaves().catch(() => []);
        
        // Count unread notices
        const lastSeenCountStr = localStorage.getItem('sistec_notice_count');
        const lastSeenCount = lastSeenCountStr ? parseInt(lastSeenCountStr, 10) : 0;
        const newNoticesCount = Math.max(0, allNotices.length - lastSeenCount);

        // Count active approved leaves
        const activeApprovedCount = allLeaves.filter(l => l.status === 'Approved').length;

        setBadges({
          leaves: activeApprovedCount,
          resolutions: 0,
          notices: newNoticesCount
        });
      }
    } catch (err) {
      console.warn("Failed to fetch badge counts:", err);
    }
  };

  useEffect(() => {
    fetchBadges();
    // Poll every 15 seconds to keep counts relatively fresh
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Reset notices badge when visiting Notices page, and update localStorage
  useEffect(() => {
    if (user?.role === 'student' && location.pathname === '/notices') {
      const resetNotices = async () => {
        try {
          const allNotices = await api.student.getNotices().catch(() => []);
          localStorage.setItem('sistec_notice_count', String(allNotices.length));
          setBadges(prev => ({ ...prev, notices: 0 }));
        } catch (err) {
          console.warn("Failed to reset notices badge:", err);
        }
      };
      resetNotices();
    }
  }, [location.pathname, user]);

  const getBadgeCount = (name) => {
    switch (name) {
      case 'Leaves': return badges.leaves;
      case 'Resolutions': return badges.resolutions;
      case 'Notices': return badges.notices;
      default: return 0;
    }
  };

  const baseNavigation = user?.role === 'admin' 
    ? adminNavigation 
    : user?.role === 'warden' 
    ? wardenNavigation 
    : user?.role === 'guard'
    ? guardNavigation
    : studentNavigation;

  const navigation = baseNavigation.map(item => ({
    ...item,
    badge: getBadgeCount(item.name)
  }));

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
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-xl tracking-tight">
          Sistec Hostel
        </div>
        
        <div className="flex flex-col h-[calc(100vh-4rem)] justify-between">
          <nav className="px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className={cn("mr-3 flex-shrink-0 h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors",
                      isActive ? "bg-white text-primary-600" : "bg-red-500 text-white"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Profile & Sign Out */}
          <div className="p-4 border-t border-slate-700/50">
            <NavLink
              to={user?.role === 'warden' ? '/warden/profile' : user?.role === 'admin' ? '/admin/profile' : user?.role === 'guard' ? '/guard/profile' : '/profile'}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="h-9 w-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 font-bold text-sm shrink-0">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'warden' ? 'Warden' : user?.role === 'guard' ? 'Hostel Guard' : `Room ${user?.room}`}
                </p>
              </div>
            </NavLink>
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
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
              <p className="text-slate-500">{user?.role === 'admin' ? 'Administrator' : user?.role === 'warden' ? 'Warden' : user?.role === 'guard' ? 'Hostel Guard' : `Room ${user?.room}`}</p>
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
