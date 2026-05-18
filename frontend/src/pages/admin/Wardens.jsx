import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import {
  Shield,
  ShieldCheck,
  Users,
  MessageSquare,
  Megaphone,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Eye,
  UserCheck,
  UserX,
  ChevronRight,
  Star,
  Activity
} from "lucide-react";

export const AdminWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [wardenDetails, setWardenDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchWardens = async () => {
      try {
        const data = await api.admin.getWardens();
        setWardens(data);
      } catch (err) {
        showError("Failed to load wardens");
      } finally {
        setIsLoading(false);
      }
    };
    fetchWardens();
  }, []);

  const openWardenDetails = async (warden) => {
    setSelectedWarden(warden);
    setActiveTab("overview");
    setDetailsLoading(true);
    try {
      const data = await api.admin.getWardenDetails(warden.id);
      setWardenDetails(data);
    } catch (err) {
      showError("Failed to load warden details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedWarden(null);
    setWardenDetails(null);
  };

  const getSectionGradient = (section) => {
    if (section === "boys") return "from-blue-500 to-indigo-600";
    if (section === "girls") return "from-pink-500 to-rose-600";
    return "from-slate-500 to-slate-600";
  };

  const getSectionBg = (section) => {
    if (section === "boys") return "bg-blue-50 text-blue-700 border-blue-200";
    if (section === "girls") return "bg-pink-50 text-pink-700 border-pink-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getSectionLabel = (section) => {
    if (section === "boys") return "Boys Hostel";
    if (section === "girls") return "Girls Hostel";
    return "Unassigned";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-red-100 text-red-700";
      case "High": return "bg-orange-100 text-orange-700";
      case "Medium": return "bg-blue-100 text-blue-700";
      case "Low": return "bg-slate-100 text-slate-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "No activity";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
              <Shield className="w-7 h-7" />
            </div>
            Warden Management
          </h1>
          <p className="text-slate-600 mt-2">Monitor warden activity, profiles, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-slate-700">{wardens.length} Wardens</span>
          </div>
        </div>
      </div>

      {/* Warden Cards */}
      {wardens.length === 0 ? (
        <Card className="text-center py-16">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-500">No Wardens Found</h3>
          <p className="text-slate-400 mt-2">No warden accounts have been created yet.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {wardens.map((warden) => (
            <Card
              key={warden.id}
              className="relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 cursor-pointer"
              onClick={() => openWardenDetails(warden)}
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getSectionGradient(warden.hostelSection)} opacity-80`} />

              {/* Header Row */}
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getSectionGradient(warden.hostelSection)} flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0`}>
                  {warden.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900">{warden.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSectionBg(warden.hostelSection)}`}>
                      {getSectionLabel(warden.hostelSection)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {warden.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {warden.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      {timeAgo(warden.lastActivity)}
                    </span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex-shrink-0">
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                  <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{warden.studentCount}</p>
                  <p className="text-[10px] text-blue-600 font-medium">Students</p>
                </div>
                <div className="text-center p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{warden.complaintsResolved}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Resolved</p>
                </div>
                <div className="text-center p-3 bg-amber-50/80 rounded-xl border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{warden.sectionPendingComplaints}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Pending</p>
                </div>
                <div className="text-center p-3 bg-violet-50/80 rounded-xl border border-violet-100">
                  <Megaphone className="w-4 h-4 text-violet-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{warden.noticeCount}</p>
                  <p className="text-[10px] text-violet-600 font-medium">Notices</p>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {formatDate(warden.joinedAt)}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-violet-600 group-hover:translate-x-1 transition-transform">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Warden Detail Modal */}
      <Modal
        isOpen={!!selectedWarden}
        onClose={closeDetails}
        title={selectedWarden ? `${selectedWarden.name} — Warden Profile` : ""}
        className="max-w-2xl"
      >
        {detailsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : wardenDetails ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getSectionGradient(wardenDetails.profile.hostelSection)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                {wardenDetails.profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{wardenDetails.profile.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSectionBg(wardenDetails.profile.hostelSection)}`}>
                    {getSectionLabel(wardenDetails.profile.hostelSection)}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Since {formatDate(wardenDetails.profile.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Email</p>
                  <p className="text-sm text-slate-700 truncate">{wardenDetails.profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Phone</p>
                  <p className="text-sm text-slate-700">{wardenDetails.profile.phone}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { key: "overview", label: "Overview", icon: TrendingUp },
                { key: "complaints", label: "Complaints", icon: MessageSquare },
                { key: "notices", label: "Notices", icon: Megaphone }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Users className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold text-slate-800">{wardenDetails.stats.studentCount}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">Students</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold text-slate-800">{wardenDetails.stats.totalHandled}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Handled</p>
                  </div>
                  <div className="text-center p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <Megaphone className="w-5 h-5 text-violet-600 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold text-slate-800">{wardenDetails.stats.noticeCount}</p>
                    <p className="text-xs text-violet-600 font-medium mt-0.5">Notices</p>
                  </div>
                </div>

                {/* Resolution Rate */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">Resolution Rate</span>
                    <span className="font-bold text-slate-800">{wardenDetails.stats.resolutionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                      style={{ width: `${wardenDetails.stats.resolutionRate}%` }}
                    />
                  </div>
                </div>

                {/* Complaint Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Resolved", value: wardenDetails.stats.complaintsResolved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Rejected", value: wardenDetails.stats.complaintsRejected, icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
                    { label: "In Progress", value: wardenDetails.stats.complaintsInProgress, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Pending (Section)", value: wardenDetails.stats.sectionPendingComplaints, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.bg} border ${item.border}`}>
                      <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                      <div>
                        <p className="text-lg font-bold text-slate-800">{item.value}</p>
                        <p className={`text-xs font-medium ${item.color}`}>{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Today's Attendance */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Today's Section Attendance
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-600">{wardenDetails.stats.presentToday}</p>
                      <p className="text-xs text-slate-500">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600">{wardenDetails.stats.lateToday}</p>
                      <p className="text-xs text-slate-500">Late</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-500">{wardenDetails.stats.absentToday}</p>
                      <p className="text-xs text-slate-500">Absent</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "complaints" && (
              <div className="space-y-3">
                {wardenDetails.recentComplaints.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No complaints handled yet</p>
                    <p className="text-slate-400 text-sm mt-1">This warden hasn't resolved or responded to any complaints.</p>
                  </div>
                ) : (
                  wardenDetails.recentComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">{complaint.studentName}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">Room {complaint.studentRoom}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-400">{complaint.category}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{complaint.description}</p>
                          {complaint.wardenResponse && (
                            <div className="mt-2 p-2 bg-violet-50 rounded-lg border border-violet-100">
                              <p className="text-xs text-violet-600 font-medium mb-0.5">Warden Response:</p>
                              <p className="text-sm text-violet-700">{complaint.wardenResponse}</p>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2">Filed: {complaint.date} • Handled: {complaint.handledAt}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "notices" && (
              <div className="space-y-3">
                {wardenDetails.notices.length === 0 ? (
                  <div className="text-center py-10">
                    <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No notices posted</p>
                    <p className="text-slate-400 text-sm mt-1">This warden hasn't created any notices yet.</p>
                  </div>
                ) : (
                  wardenDetails.notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="p-2 bg-violet-100 rounded-lg flex-shrink-0">
                        <Megaphone className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">{notice.title}</h4>
                          {notice.isPinned && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{notice.category}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">{notice.date}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${getPriorityColor(notice.priority)}`}>
                        {notice.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
