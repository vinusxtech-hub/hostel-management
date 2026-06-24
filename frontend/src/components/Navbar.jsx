import { Menu, LogOut, Bell, User, Settings, ChevronDown, Megaphone, CheckCircle2, XCircle, Info, Clock, Check } from "lucide-react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { api } from "../services/api";

export const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabel = user?.role === "warden" && user?.hostelSection
    ? `${user.hostelSection} warden`
    : user?.role;

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate(`/${user?.role}/profile`);
    setIsProfileOpen(false);
  };

  const fetchNotifications = async () => {
    try {
      if (user) {
        const data = await api.notifications.get();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Poll notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, type) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      
      // Navigate based on notification type
      if (type === 'leave') {
        navigate(`/${user?.role}/leaves`);
      } else if (type === 'notice') {
        navigate(`/${user?.role === 'student' ? 'student' : 'admin'}/dashboard`);
      } else if (type === 'attendance') {
        navigate('/student/dashboard');
      }
      setIsNotifOpen(false);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotifIcon = (type, title) => {
    const isReject = title.toLowerCase().includes('reject');
    switch (type) {
      case 'leave':
        return isReject 
          ? <XCircle className="w-4 h-4 text-red-500" />
          : <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'notice':
        return <Megaphone className="w-4 h-4 text-amber-500" />;
      case 'attendance':
        return <Clock className="w-4 h-4 text-violet-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
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
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg relative transition-colors duration-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 bg-rose-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center px-1 border border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-bounce" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id, notif.type)}
                        className={`p-4 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors duration-150 ${
                          !notif.read ? 'bg-indigo-50/40 hover:bg-indigo-50/70 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-full h-fit mt-0.5 ${
                          !notif.read ? 'bg-white shadow-sm' : 'bg-slate-100'
                        }`}>
                          {getNotifIcon(notif.type, notif.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center animate-pulse"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{roleLabel}</p>
            </div>

            {/* Profile Icon with Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex items-center gap-1"
                title="Profile Menu"
              >
                <User className="w-5 h-5 text-slate-700" />
                <ChevronDown className="w-4 h-4 text-slate-600" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{roleLabel}</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-3 transition-colors duration-150"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate(`/${user?.role}/settings`);
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-3 transition-colors duration-150"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-2"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-3 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
