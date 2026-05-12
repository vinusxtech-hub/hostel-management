import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  UserCheck,
  UserX
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const WardenDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.warden.getDashboardStats();
        setStats(data);
      } catch (err) {
        error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/25",
      bg: "bg-blue-50",
      text: "text-blue-700"
    },
    {
      label: "Pending Complaints",
      value: stats.pendingComplaints,
      icon: AlertCircle,
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/25",
      bg: "bg-amber-50",
      text: "text-amber-700"
    },
    {
      label: "In Progress",
      value: stats.inProgressComplaints,
      icon: Clock,
      color: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/25",
      bg: "bg-violet-50",
      text: "text-violet-700"
    },
    {
      label: "Resolved Today",
      value: stats.resolvedToday,
      icon: CheckCircle,
      color: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-500/25",
      bg: "bg-emerald-50",
      text: "text-emerald-700"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getCategoryIcon = (category) => {
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

  // Calculate complaint resolution rate
  const resolutionRate = stats.totalComplaints > 0
    ? Math.round(((stats.resolvedComplaints + stats.rejectedComplaints) / stats.totalComplaints) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            Warden Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Monitor students and manage complaints</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-2.5 bg-gradient-to-br ${stat.color} rounded-xl text-white shadow-lg ${stat.shadow}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-60`} />
          </Card>
        ))}
      </div>

      {/* Middle Row — Attendance Summary + Complaint Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Today's Attendance
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <UserCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-700">{stats.presentToday}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Present</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{stats.lateToday}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">Late</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
              <UserX className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
              <p className="text-xs text-red-500 font-medium mt-1">Absent</p>
            </div>
          </div>
          {/* Attendance bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Attendance Rate</span>
              <span className="font-semibold text-slate-700">
                {stats.totalStudents > 0 ? Math.round(((stats.presentToday + stats.lateToday) / stats.totalStudents) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                style={{ width: `${stats.totalStudents > 0 ? ((stats.presentToday + stats.lateToday) / stats.totalStudents) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Complaint Resolution Stats */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              Complaint Overview
            </h2>
            <span className="text-sm font-medium text-slate-500">
              Total: {stats.totalComplaints}
            </span>
          </div>

          {/* Resolution progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Resolution Rate</span>
              <span className="font-semibold text-slate-700">{resolutionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div
                className="h-3 bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                style={{ width: `${stats.totalComplaints > 0 ? (stats.resolvedComplaints / stats.totalComplaints) * 100 : 0}%` }}
              />
              <div
                className="h-3 bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700"
                style={{ width: `${stats.totalComplaints > 0 ? (stats.rejectedComplaints / stats.totalComplaints) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pending", value: stats.pendingComplaints, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              { label: "In Progress", value: stats.inProgressComplaints, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { label: "Resolved", value: stats.resolvedComplaints, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "Rejected", value: stats.rejectedComplaints, icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
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
        </Card>
      </div>

      {/* Weekly Complaint Trend */}
      {stats.weeklyComplaints && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Weekly Complaint Trend
          </h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {stats.weeklyComplaints.map((day, i) => {
              const maxVal = Math.max(...stats.weeklyComplaints.map(d => Math.max(d.new, d.resolved)), 1);
              const newH = (day.new / maxVal) * 100;
              const resolvedH = (day.resolved / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-28">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-amber-600 font-semibold mb-1">{day.new || ''}</span>
                      <div
                        className="w-4 sm:w-6 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(newH, 4)}%` }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-emerald-600 font-semibold mb-1">{day.resolved || ''}</span>
                      <div
                        className="w-4 sm:w-6 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(resolvedH, 4)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{day.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-400" />
              <span className="text-xs text-slate-600">New</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-xs text-slate-600">Resolved</span>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Complaints */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-rose-500" />
            Recent Complaints
          </h2>
          <button
            onClick={() => navigate('/warden/complaints')}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {stats.recentComplaints.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No complaints yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate('/warden/complaints')}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{getCategoryIcon(complaint.category)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{complaint.studentName}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">Room {complaint.studentRoom}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 truncate">{complaint.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{complaint.date}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
