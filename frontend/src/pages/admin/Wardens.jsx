import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Plus } from "lucide-react";
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
  Activity,
  Trash2
} from "lucide-react";

export const AdminWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [wardenDetails, setWardenDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { error: showError, success } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addedWarden, setAddedWarden] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wardenToDelete, setWardenToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newWardenData, setNewWardenData] = useState({
    name: "",
    email: "",
    hostelSection: "",
    building: "",
    phone: ""
  });

  const handleAddWarden = async (e) => {
    e.preventDefault();
    if (!newWardenData.name || !newWardenData.email) {
      showError("Name and email are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.admin.addWarden(newWardenData);
      success("Warden added successfully!");
      setShowAddModal(false);
      setAddedWarden(response);
      setNewWardenData({ name: "", email: "", hostelSection: "", building: "", phone: "" });
      // Reload wardens list
      const data = await api.admin.getWardens();
      setWardens(data);
    } catch (err) {
      showError(err.message || "Failed to add warden");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWarden = async (id) => {
    setIsDeleting(true);
    try {
      await api.admin.deleteWarden(id);
      success("Warden removed successfully!");
      setWardenToDelete(null);
      setSelectedWarden(null);
      setWardenDetails(null);
      // Reload wardens list
      const data = await api.admin.getWardens();
      setWardens(data);
    } catch (err) {
      showError(err.message || "Failed to remove warden");
    } finally {
      setIsDeleting(false);
    }
  };

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

  const getSectionLabel = (section, building) => {
    if (section === "boys") {
      return building ? `Boys Hostel · Building ${building}` : "Boys Hostel";
    }
    if (section === "girls") {
      return building ? `Girls Hostel · Building ${building}` : "Girls Hostel";
    }
    return building ? `Building ${building}` : "Unassigned";
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
          <Button
            onClick={() => setShowAddModal(true)}
            size="md"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Warden
          </Button>
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
                      {getSectionLabel(warden.hostelSection, warden.building)}
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
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openWardenDetails(warden)}
                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setWardenToDelete(warden)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Warden"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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
                  <p className="text-lg font-bold text-slate-800">{warden.resolutionsResolved}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Resolved</p>
                </div>
                <div className="text-center p-3 bg-amber-50/80 rounded-xl border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{warden.sectionPendingResolutions}</p>
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
                    {getSectionLabel(wardenDetails.profile.hostelSection, wardenDetails.profile.building)}
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
                { key: "resolutions", label: "Resolutions", icon: MessageSquare },
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
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Users className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-slate-800">{wardenDetails.stats.studentCount}</p>
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5">Students</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-slate-800">{wardenDetails.stats.totalHandled}</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Handled</p>
                  </div>
                  <div className="text-center p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <Megaphone className="w-5 h-5 text-violet-600 mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-slate-800">{wardenDetails.stats.noticeCount}</p>
                    <p className="text-[10px] text-violet-600 font-medium mt-0.5">Notices</p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Calendar className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-slate-800">{wardenDetails.stats.leavesApproved || 0}</p>
                    <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Leaves Appr.</p>
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

                {/* Resolution Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Resolved", value: wardenDetails.stats.resolutionsResolved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Rejected", value: wardenDetails.stats.resolutionsRejected, icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
                    { label: "In Progress", value: wardenDetails.stats.resolutionsInProgress, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Pending (Section)", value: wardenDetails.stats.sectionPendingResolutions, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
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

            {activeTab === "resolutions" && (
              <div className="space-y-3">
                {wardenDetails.recentResolutions.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No resolutions handled yet</p>
                    <p className="text-slate-400 text-sm mt-1">This warden hasn't resolved or responded to any resolutions.</p>
                  </div>
                ) : (
                  wardenDetails.recentResolutions.map((resolution) => (
                    <div
                      key={resolution.id}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">{resolution.studentName}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">Room {resolution.studentRoom}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-400">{resolution.category}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{resolution.description}</p>
                          {resolution.wardenResponse && (
                            <div className="mt-2 p-2 bg-violet-50 rounded-lg border border-violet-100">
                              <p className="text-xs text-violet-600 font-medium mb-0.5">Warden Response:</p>
                              <p className="text-sm text-violet-700">{resolution.wardenResponse}</p>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2">Filed: {resolution.date} • Handled: {resolution.handledAt}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusColor(resolution.status)}`}>
                          {resolution.status}
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

            {/* Action Footer */}
            <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-200">
              <Button
                variant="danger"
                onClick={() => setWardenToDelete({ id: wardenDetails.profile.id, name: wardenDetails.profile.name })}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Remove Warden
              </Button>
              <Button
                variant="secondary"
                onClick={closeDetails}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Add Warden Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Warden" className="max-w-lg">
        <form onSubmit={handleAddWarden} className="space-y-4">
          <Input
            label="Warden Name"
            value={newWardenData.name}
            onChange={(e) => setNewWardenData({ ...newWardenData, name: e.target.value })}
            placeholder="e.g. Rajesh Kumar"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={newWardenData.email}
            onChange={(e) => setNewWardenData({ ...newWardenData, email: e.target.value })}
            placeholder="e.g. rajesh@test.com"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Hostel Section</label>
            <select
              value={newWardenData.hostelSection}
              onChange={(e) => setNewWardenData({ ...newWardenData, hostelSection: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white text-sm"
            >
              <option value="">Select section</option>
              <option value="boys">Boys Hostel</option>
              <option value="girls">Girls Hostel</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Building (Optional)</label>
            <select
              value={newWardenData.building}
              onChange={(e) => setNewWardenData({ ...newWardenData, building: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white text-sm"
            >
              <option value="">Select building</option>
              <option value="A">Building A</option>
              <option value="B">Building B</option>
              <option value="C">Building C</option>
            </select>
          </div>
          <Input
            label="Phone Number"
            value={newWardenData.phone}
            onChange={(e) => setNewWardenData({ ...newWardenData, phone: e.target.value })}
            placeholder="e.g. +91-9876543210"
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Adding...' : 'Add Warden'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal showing warden creation status */}
      <Modal 
        isOpen={!!addedWarden} 
        onClose={() => setAddedWarden(null)} 
        title="Warden Added Successfully"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Warden Added</h3>
            <p className="text-xs text-slate-500 mt-1">Account created successfully.</p>
            <p className="text-xs text-slate-600 font-semibold mt-2 px-2">
              Login credentials (username and password) have been sent directly to their registered email:
              <br/>
              <strong className="text-emerald-700 break-all">{addedWarden?.email}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{addedWarden?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hostel Section</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{addedWarden?.hostelSection || 'Boys'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Building</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{addedWarden?.building || 'All'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => setAddedWarden(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!wardenToDelete}
        onClose={() => setWardenToDelete(null)}
        title="Remove Warden Account"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
            <UserX className="w-12 h-12 text-red-500 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to remove warden <strong className="text-slate-900 font-bold">{wardenToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-500 mt-2">
              This action is permanent and cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              className="flex-1"
              isLoading={isDeleting}
              onClick={() => handleDeleteWarden(wardenToDelete?.id)}
            >
              Remove Warden
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setWardenToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
