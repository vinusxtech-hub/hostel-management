import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import {
  CalendarOff,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  FileText,
  ArrowRight,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Home,
  Phone,
  Mail,
  BookOpen
} from "lucide-react";

// ============================================================
// Warden Leave Dashboard
// Integration: Leave Management System
// Features: View/filter leaves, approve/reject with remarks,
//           gender-based filtering (automatic via backend)
// ============================================================

export const WardenLeaves = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const normalizeLeaves = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.leaves)) return data.leaves;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchLeaves = async () => {
    try {
      const data = await api.warden.getAllLeaves();
      setLeaves(normalizeLeaves(data));
    } catch (err) {
      error("Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setRemarks("");
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedLeave) return;

    setIsProcessing(true);
    try {
      if (actionType === "approve") {
        await api.warden.approveLeave(selectedLeave.id, { remarks });
        success("Leave request approved successfully!");
      } else {
        await api.warden.rejectLeave(selectedLeave.id, { remarks });
        success("Leave request rejected");
      }
      setShowActionModal(false);
      setShowDetailModal(false);
      fetchLeaves(); // Refresh the list
    } catch (err) {
      error(err.message || `Failed to ${actionType} leave request`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "Pending":
        return {
          icon: <Clock className="w-4 h-4" />,
          color: "bg-amber-50 text-amber-700 border-amber-200",
          dotColor: "bg-amber-400",
          bgGradient: "from-amber-500 to-orange-500"
        };
      case "Approved":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dotColor: "bg-emerald-400",
          bgGradient: "from-emerald-500 to-green-500"
        };
      case "Rejected":
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: "bg-red-50 text-red-700 border-red-200",
          dotColor: "bg-red-400",
          bgGradient: "from-red-500 to-rose-500"
        };
      default:
        return { icon: null, color: "", dotColor: "", bgGradient: "" };
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getDayCount = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Stats
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === "Pending").length,
    approved: leaves.filter(l => l.status === "Approved").length,
    rejected: leaves.filter(l => l.status === "Rejected").length
  };

  // Filter + search
  const filteredLeaves = leaves
    .filter(l => filter === "All" || l.status === filter)
    .filter(l =>
      searchTerm === "" ||
      l.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.studentRoom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/30">
            <CalendarOff className="w-7 h-7" />
          </div>
          Leave Management
        </h1>
        <p className="text-slate-600 mt-1">Review and manage student leave requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, gradient: "from-slate-500 to-slate-600", icon: FileText },
          { label: "Pending", value: stats.pending, gradient: "from-amber-500 to-orange-500", icon: Clock },
          { label: "Approved", value: stats.approved, gradient: "from-emerald-500 to-green-500", icon: CheckCircle },
          { label: "Rejected", value: stats.rejected, gradient: "from-red-500 to-rose-500", icon: XCircle }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          );
        })}
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, room, or reason..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            {["All", "Pending", "Approved", "Rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/30"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {f}
                {f !== "All" && (
                  <span className="ml-1 text-xs opacity-80">
                    ({f === "Pending" ? stats.pending : f === "Approved" ? stats.approved : stats.rejected})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {filteredLeaves.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CalendarOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">No leave requests found</p>
              <p className="text-slate-400 text-sm mt-1">
                {filter !== "All" ? `No ${filter.toLowerCase()} requests` : "No requests from your hostel section"}
              </p>
            </div>
          </Card>
        ) : (
          filteredLeaves.map((leave, index) => {
            const statusConfig = getStatusConfig(leave.status);
            const days = getDayCount(leave.startDate, leave.endDate);

            return (
              <Card
                key={leave.id}
                className="animate-slide-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Student Info + Leave Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Student avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                        {leave.studentName?.charAt(0) || "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{leave.studentName}</h3>
                          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${statusConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${leave.status === 'Pending' ? 'animate-pulse' : ''}`} />
                            {statusConfig.icon}
                            {leave.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            Room {leave.studentRoom}
                          </span>
                          {leave.studentBuilding && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              Block {leave.studentBuilding}
                            </span>
                          )}
                          {leave.studentDepartment !== "N/A" && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {leave.studentDepartment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-slate-700 mb-2 pl-[52px]">{leave.reason}</p>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 pl-[52px]">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium">{formatDate(leave.startDate)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="font-medium">{formatDate(leave.endDate)}</span>
                      <span className="text-xs text-slate-400 ml-1">({days} day{days > 1 ? "s" : ""})</span>
                    </div>

                    {/* Remarks (if any) */}
                    {leave.remarks && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 ml-[52px]">
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Remarks:</span> {leave.remarks}
                        </p>
                        {leave.approvedByName && (
                          <p className="text-xs text-slate-400 mt-0.5">— {leave.approvedByName}</p>
                        )}
                      </div>
                    )}

                    {/* Document indicator */}
                    {leave.documentUrl && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 pl-[52px]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Supporting document attached</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pl-[52px] lg:pl-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    {leave.status === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openActionModal(leave, "approve")}
                          className="!bg-gradient-to-r !from-emerald-500 !to-green-600 !shadow-emerald-500/30"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openActionModal(leave, "reject")}
                        >
                          <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400 pl-[52px]">
                  <span>Applied: {formatDate(leave.createdAt)}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Leave Request Details"
        className="max-w-lg"
      >
        {selectedLeave && (
          <div className="space-y-5">
            {/* Student Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {selectedLeave.studentName?.charAt(0) || "?"}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{selectedLeave.studentName}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                  <span>{selectedLeave.studentEmail}</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Home className="w-3 h-3" />
                  Room
                </div>
                <p className="font-medium text-slate-900">{selectedLeave.studentRoom}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Building className="w-3 h-3" />
                  Building
                </div>
                <p className="font-medium text-slate-900">{selectedLeave.studentBuilding || "N/A"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <BookOpen className="w-3 h-3" />
                  Department
                </div>
                <p className="font-medium text-slate-900">{selectedLeave.studentDepartment}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Phone className="w-3 h-3" />
                  Phone
                </div>
                <p className="font-medium text-slate-900">{selectedLeave.studentPhone}</p>
              </div>
            </div>

            {/* Leave Info */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <h4 className="font-semibold text-indigo-900 mb-2">Leave Details</h4>
              <p className="text-sm text-indigo-800 mb-3">{selectedLeave.reason}</p>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedLeave.startDate)}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{formatDate(selectedLeave.endDate)}</span>
                <span className="text-xs ml-1">
                  ({getDayCount(selectedLeave.startDate, selectedLeave.endDate)} day{getDayCount(selectedLeave.startDate, selectedLeave.endDate) > 1 ? "s" : ""})
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Status:</span>
              {(() => {
                const sc = getStatusConfig(selectedLeave.status);
                return (
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${sc.color}`}>
                    {sc.icon}
                    {selectedLeave.status}
                  </span>
                );
              })()}
            </div>

            {/* Remarks */}
            {selectedLeave.remarks && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Remarks:</span> {selectedLeave.remarks}
                </p>
                {selectedLeave.approvedByName && (
                  <p className="text-xs text-slate-400 mt-1">— {selectedLeave.approvedByName}</p>
                )}
              </div>
            )}

            {/* Document */}
            {selectedLeave.documentUrl && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Supporting document attached</span>
                </div>
                {selectedLeave.documentUrl.startsWith("data:image") && (
                  <img
                    src={selectedLeave.documentUrl}
                    alt="Leave document"
                    className="mt-2 max-h-48 rounded-lg border"
                  />
                )}
              </div>
            )}

            {/* Actions */}
            {selectedLeave.status === "Pending" && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => openActionModal(selectedLeave, "approve")}
                  className="flex-1 !bg-gradient-to-r !from-emerald-500 !to-green-600 !shadow-emerald-500/30"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => openActionModal(selectedLeave, "reject")}
                  className="flex-1"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action (Approve/Reject) Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
      >
        {selectedLeave && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              actionType === "approve"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}>
              <p className={`text-sm font-medium ${
                actionType === "approve" ? "text-emerald-800" : "text-red-800"
              }`}>
                {actionType === "approve"
                  ? "You are about to approve this leave request. The student's attendance will automatically be marked as 'On Leave' for the requested period."
                  : "You are about to reject this leave request. The student will be notified."
                }
              </p>
              <div className="mt-2 text-sm opacity-80">
                <strong>{selectedLeave.studentName}</strong> — {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Remarks / Comments <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical min-h-[80px] transition-all"
                placeholder={actionType === "approve" ? "e.g., Approved. Take care." : "e.g., Reason for rejection..."}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAction}
                isLoading={isProcessing}
                className={`flex-1 ${
                  actionType === "approve"
                    ? "!bg-gradient-to-r !from-emerald-500 !to-green-600 !shadow-emerald-500/30"
                    : ""
                }`}
                variant={actionType === "reject" ? "danger" : "primary"}
              >
                {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
