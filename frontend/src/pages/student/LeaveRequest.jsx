import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import {
  CalendarOff,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  X,
  ArrowRight,
  AlertTriangle,
  QrCode
} from "lucide-react";

// ============================================================
// Student Leave Request Page
// Integration: Leave Management System
// Features: Apply for leave, view history, cancel pending leaves
// ============================================================

export const LeaveRequest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    startDate: "",
    endDate: "",
    documentUrl: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const [selectedLeaveForQR, setSelectedLeaveForQR] = useState(null);

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
      const data = await api.student.getLeaves();
      setLeaves(normalizeLeaves(data));
    } catch (err) {
      error("Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason || !formData.startDate || !formData.endDate) {
      error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.student.applyLeave(formData);
      await fetchLeaves();
      setFormData({ reason: "", startDate: "", endDate: "", documentUrl: "" });
      setShowModal(false);
      success("Leave request submitted successfully!");
    } catch (err) {
      error(err.message || "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      await api.student.cancelLeave(id);
      await fetchLeaves();
      success("Leave request cancelled");
    } catch (err) {
      error(err.message || "Failed to cancel leave request");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      error("File size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, documentUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "Pending":
        return {
          icon: <Clock className="w-4 h-4" />,
          color: "bg-amber-50 text-amber-700 border-amber-200",
          dotColor: "bg-amber-400",
          variant: "warning"
        };
      case "Approved":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dotColor: "bg-emerald-400",
          variant: "success"
        };
      case "Rejected":
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: "bg-red-50 text-red-700 border-red-200",
          dotColor: "bg-red-400",
          variant: "danger"
        };
      default:
        return {
          icon: null,
          color: "",
          dotColor: "",
          variant: "default"
        };
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
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  // Get today's date string for min date on inputs
  const todayStr = new Date().toISOString().split("T")[0];

  // Stats
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === "Pending").length,
    approved: leaves.filter(l => l.status === "Approved").length,
    rejected: leaves.filter(l => l.status === "Rejected").length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const filteredLeaves = leaves.filter(l => filter === "All" || l.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <CalendarOff className="w-7 h-7" />
            </div>
            Leave Requests
          </h1>
          <p className="text-slate-600 mt-1">Apply for leave and track your request status</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Apply Leave
        </Button>
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

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All", "Pending", "Approved", "Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f
                ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/30"
                : "bg-white/70 text-slate-600 hover:bg-white border border-slate-200"
            }`}
          >
            {f}
            {f !== "All" && (
              <span className="ml-1.5 text-xs opacity-80">
                ({f === "Pending" ? stats.pending : f === "Approved" ? stats.approved : stats.rejected})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="space-y-4">
        {filteredLeaves.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CalendarOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">No leave requests found</p>
              <p className="text-slate-400 text-sm mt-1">Click "Apply Leave" to submit your first request</p>
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
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${statusConfig.color}`}>
                        <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
                        {statusConfig.icon}
                        {leave.status}
                      </div>
                      <span className="text-xs text-slate-400">
                        {days} day{days > 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{leave.reason}</h3>

                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>{formatDate(leave.startDate)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span>{formatDate(leave.endDate)}</span>
                    </div>

                    {leave.remarks && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium text-slate-700">Warden Remarks: </span>
                          {leave.remarks}
                        </p>
                        {leave.approvedByName && (
                          <p className="text-xs text-slate-400 mt-1">— {leave.approvedByName}</p>
                        )}
                      </div>
                    )}

                    {leave.documentUrl && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Document attached</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {leave.status === "Pending" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(leave.id)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    )}
                    {leave.status === "Approved" && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => setSelectedLeaveForQR(leave)}
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" />
                        View QR Pass
                      </Button>
                    )}
                  </div>
                </div>

                {/* Applied date */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                  <span>Applied: {formatDate(leave.createdAt)}</span>
                  {leave.updatedAt !== leave.createdAt && (
                    <span>Updated: {formatDate(leave.updatedAt)}</span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave" className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical min-h-[100px] transition-all"
              placeholder="Describe why you need leave..."
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1">{formData.reason.length}/500 characters</p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                min={todayStr}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                min={formData.startDate || todayStr}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Date preview */}
          {formData.startDate && formData.endDate && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
              <Calendar className="w-4 h-4" />
              <span>
                {getDayCount(formData.startDate, formData.endDate)} day(s) —{" "}
                {formatDate(formData.startDate)} to {formatDate(formData.endDate)}
              </span>
            </div>
          )}

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supporting Document <span className="text-slate-400">(optional, max 2MB)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all"
              />
              {formData.documentUrl && (
                <div className="flex items-center gap-2 mt-2 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Document attached</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, documentUrl: "" })}
                    className="text-red-400 hover:text-red-600 ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Your leave request will be sent to your hostel warden for approval. You'll be notified once it's reviewed.</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Submit Request
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Pass Modal */}
      <Modal 
        isOpen={!!selectedLeaveForQR} 
        onClose={() => setSelectedLeaveForQR(null)} 
        title="🏛️ Approved Leave QR Pass" 
        className="max-w-md"
      >
        {selectedLeaveForQR && (() => {
          const days = getDayCount(selectedLeaveForQR.startDate, selectedLeaveForQR.endDate);
          const approvalTime = selectedLeaveForQR.approvedAt ? new Date(selectedLeaveForQR.approvedAt) : null;
          const expiryTime = approvalTime ? new Date(approvalTime.getTime() + 3 * 60 * 60 * 1000) : null;
          const isExpired = expiryTime ? (Date.now() > expiryTime.getTime()) : false;
          
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedLeaveForQR.id)}&color=${isExpired ? "64748b" : "4f46e5"}&bgcolor=ffffff`;

          const formatTimeStr = (date) => {
            return date ? date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : 'N/A';
          };

          const handlePrint = () => {
            const printContent = document.getElementById("qr-pass-content").innerHTML;
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = `
              <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #334155;">
                ${printContent}
              </div>
            `;
            window.print();
            window.location.reload(); // Reload to restore page state
          };

          return (
            <div className="space-y-6 text-center">
              <div id="qr-pass-content" className="space-y-5">
                <div className={`border rounded-2xl p-5 shadow-sm inline-block relative overflow-hidden ${
                  isExpired 
                    ? "bg-slate-100 border-slate-200" 
                    : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100"
                }`}>
                  <div className="relative">
                    <img 
                      src={qrUrl} 
                      alt="Leave QR Pass" 
                      className={`w-48 h-48 mx-auto border-4 border-white rounded-xl shadow-md transition-all duration-300 ${
                        isExpired ? "opacity-30 blur-[0.5px]" : ""
                      }`}
                    />
                    {isExpired && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="border-4 border-double border-red-600 text-red-600 font-extrabold text-2xl px-3 py-1 uppercase tracking-widest rounded transform -rotate-12 bg-white/95 shadow-md">
                          Expired
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-3 break-all bg-slate-100/50 py-1 px-2 rounded-lg border border-slate-200/50">
                    Token: {selectedLeaveForQR.id}
                  </p>
                </div>

                <div className="text-left space-y-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500">Leave Period</span>
                    <span className="font-bold text-slate-800">
                      {formatDate(selectedLeaveForQR.startDate)} to {formatDate(selectedLeaveForQR.endDate)} ({days} day{days > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500">Reason</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]" title={selectedLeaveForQR.reason}>
                      {selectedLeaveForQR.reason}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500">Approved By</span>
                    <span className="font-semibold text-indigo-700">
                      {selectedLeaveForQR.approvedByName || 'Hostel Warden'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500">Approved At</span>
                    <span className="font-medium text-slate-700">
                      {approvalTime ? `${formatDate(approvalTime)} at ${formatTimeStr(approvalTime)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600 bg-red-50 border border-red-100/60 p-2.5 rounded-xl">
                    <span className="font-bold">Pass Expires At</span>
                    <span className="font-black">
                      {expiryTime ? `${formatDate(expiryTime)} at ${formatTimeStr(expiryTime)}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5 text-left">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> Show this QR code to the hostel guard at the gate. It is valid for exactly <strong>3 hours</strong> from the time of approval. If it expires, you must apply for a new pass or contact the warden.
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handlePrint} className="flex-1">
                  Print / Save Pass
                </Button>
                <Button variant="secondary" onClick={() => setSelectedLeaveForQR(null)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
