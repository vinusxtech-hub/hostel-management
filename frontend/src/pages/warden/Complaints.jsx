import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { useAuth } from "../../store/AuthContext";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Home,
  Mail,
  Phone,
  Filter,
  ArrowRight,
  Search
} from "lucide-react";

export const WardenComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();
  const sectionLabel = user?.hostelSection === "girls" ? "Girls Hostel" : user?.hostelSection === "boys" ? "Boys Hostel" : "Assigned Hostel";

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await api.warden.getComplaints();
      setComplaints(data);
    } catch (err) {
      error("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    setIsUpdating(true);
    try {
      const updateData = { status: newStatus };
      if (responseText.trim()) {
        updateData.wardenResponse = responseText.trim();
      }

      const updated = await api.warden.updateComplaint(complaintId, updateData);
      setComplaints(complaints.map(c => c.id === complaintId ? updated : c));
      setResponseText("");
      success(`Complaint marked as ${newStatus}`);
    } catch (err) {
      error("Failed to update complaint");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResponse = async (complaintId) => {
    if (!responseText.trim()) {
      error("Please enter a response");
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await api.warden.updateComplaint(complaintId, {
        wardenResponse: responseText.trim()
      });
      setComplaints(complaints.map(c => c.id === complaintId ? updated : c));
      setResponseText("");
      success("Response sent successfully");
    } catch (err) {
      error("Failed to send response");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setResponseText("");
    } else {
      setExpandedId(id);
      const complaint = complaints.find(c => c.id === id);
      setResponseText(complaint?.wardenResponse || "");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return <AlertCircle className="w-4 h-4" />;
      case "In Progress": return <Clock className="w-4 h-4" />;
      case "Resolved": return <CheckCircle className="w-4 h-4" />;
      case "Rejected": return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Rejected": return "bg-red-100 text-red-600 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case "Maintenance": return "🔧";
      case "Electrical": return "⚡";
      case "Plumbing": return "🚿";
      case "Cleanliness": return "🧹";
      case "Internet/Wi-Fi": return "📶";
      case "Mess Food": return "🍽️";
      default: return "📋";
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get available next statuses
  const getNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case "Pending": return ["In Progress", "Resolved", "Rejected"];
      case "In Progress": return ["Resolved", "Rejected"];
      case "Resolved": return [];
      case "Rejected": return ["In Progress"];
      default: return [];
    }
  };

  const getStatusButtonStyle = (status) => {
    switch (status) {
      case "In Progress": return "bg-blue-600 hover:bg-blue-700 text-white";
      case "Resolved": return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "Rejected": return "bg-red-600 hover:bg-red-700 text-white";
      default: return "bg-slate-600 hover:bg-slate-700 text-white";
    }
  };

  const categories = ["All", "Maintenance", "Electrical", "Plumbing", "Cleanliness", "Internet/Wi-Fi", "Mess Food", "Other"];
  const statuses = ["All", "Pending", "In Progress", "Resolved", "Rejected"];

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || c.category === categoryFilter;
    const matchesSearch = searchTerm === "" ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentRoom.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Count by status
  const statusCounts = {
    All: complaints.length,
    Pending: complaints.filter(c => c.status === "Pending").length,
    "In Progress": complaints.filter(c => c.status === "In Progress").length,
    Resolved: complaints.filter(c => c.status === "Resolved").length,
    Rejected: complaints.filter(c => c.status === "Rejected").length
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl text-white shadow-lg shadow-rose-500/25">
              <MessageSquare className="w-7 h-7" />
            </div>
            Manage Complaints
          </h1>
          <p className="text-slate-600 mt-2">Review, respond to, and resolve student complaints for {sectionLabel}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              statusFilter === status
                ? status === "All" ? "bg-slate-900 text-white shadow-lg shadow-slate-900/25"
                  : status === "Pending" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : status === "In Progress" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : status === "Resolved" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-red-500 text-white shadow-lg shadow-red-500/25"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {status !== "All" && getStatusIcon(status)}
            {status}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              statusFilter === status
                ? "bg-white/20"
                : "bg-slate-100 text-slate-500"
            }`}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Category Filter */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, room, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
            />
          </div>
          <div className="relative">
            <Filter className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 appearance-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="p-4 bg-slate-100 rounded-full inline-block mb-4">
              <CheckCircle className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-500">No complaints found</p>
            <p className="text-sm text-slate-400 mt-1">
              {statusFilter !== "All" || categoryFilter !== "All" 
                ? "Try changing your filters" 
                : "All clear! No complaints have been submitted."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => {
            const isExpanded = expandedId === complaint.id;
            const nextStatuses = getNextStatuses(complaint.status);

            return (
              <Card
                key={complaint.id}
                className={`transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary-200 shadow-lg' : ''}`}
              >
                {/* Complaint Header — Clickable */}
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => toggleExpand(complaint.id)}
                >
                  <span className="text-3xl flex-shrink-0 mt-1">{getCategoryEmoji(complaint.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900">{complaint.studentName}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Home className="w-3 h-3" /> {complaint.studentRoom}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{complaint.studentDepartment}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {complaint.category}
                      </span>
                      <span className="text-xs text-slate-400">{getTimeAgo(complaint.createdAt)}</span>
                    </div>
                    <p className={`text-sm text-slate-700 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {complaint.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      {complaint.status}
                    </span>
                    <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Student Contact */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Student Contact</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{complaint.studentEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{complaint.studentPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">Room {complaint.studentRoom}</span>
                        </div>
                      </div>
                    </div>

                    {/* Full Description */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Description</h4>
                      <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-100 leading-relaxed">
                        {complaint.description}
                      </p>
                    </div>

                    {/* Existing Response */}
                    {complaint.wardenResponse && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Your Previous Response</h4>
                        <p className="text-sm text-indigo-800">{complaint.wardenResponse}</p>
                      </div>
                    )}

                    {complaint.adminResponse && (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Admin Response</h4>
                        <p className="text-sm text-purple-800">{complaint.adminResponse}</p>
                      </div>
                    )}

                    {/* Response Input + Status Actions */}
                    {complaint.status !== "Resolved" && (
                      <div className="space-y-4">
                        {/* Response textarea */}
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            Add Response
                          </label>
                          <div className="relative">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write a response to the student..."
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
                              rows={3}
                            />
                            <button
                              onClick={() => handleSendResponse(complaint.id)}
                              disabled={isUpdating || !responseText.trim()}
                              className="absolute bottom-3 right-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Status Actions */}
                        {nextStatuses.length > 0 && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                              Update Status
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {nextStatuses.map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusUpdate(complaint.id, status)}
                                  disabled={isUpdating}
                                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${getStatusButtonStyle(status)}`}
                                >
                                  {getStatusIcon(status)}
                                  Mark as {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resolved Info */}
                    {complaint.status === "Resolved" && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">This complaint has been resolved</p>
                          {complaint.resolvedByName && (
                            <p className="text-xs text-emerald-600 mt-0.5">Handled by: {complaint.resolvedByName}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>Created: {new Date(complaint.createdAt).toLocaleString()}</span>
                        <span className="text-slate-300">|</span>
                        <span>Last Updated: {new Date(complaint.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
