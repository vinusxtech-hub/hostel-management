import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { useAuth } from "../../store/AuthContext";
import {
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Home,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Clock,
  CalendarCheck,
  Calendar,
  X,
  MessageSquare,
  TrendingUp,
  Shield,
  Building,
  FileText,
  Eye
} from "lucide-react";

export const WardenStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("overview");
  const { user } = useAuth();
  const { error } = useToast();
  const sectionLabel = user?.hostelSection === "girls" ? "Girls Hostel" : user?.hostelSection === "boys" ? "Boys Hostel" : "Assigned Hostel";
  const normalizedWardenSection = String(user?.hostelSection || "").trim().toLowerCase();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api.warden.getStudents();
      setStudents(data);
    } catch (err) {
      error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  };

  const openStudentDetail = async (student) => {
    setSelectedStudent(student);
    setDetailTab("overview");
    setIsDetailLoading(true);
    try {
      const data = await api.warden.getStudentDetails(student.id);
      setStudentDetails(data);
    } catch (err) {
      error("Failed to load student details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  const sectionStudents = students.filter((student) => {
    if (!normalizedWardenSection) return true;
    return String(student.hostelSection || "").trim().toLowerCase() === normalizedWardenSection;
  });

  const filteredStudents = sectionStudents.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.room.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "inside" && s.status === "Inside") ||
      (filter === "outside" && s.status === "Outside") ||
      (filter === "resolutions" && s.pendingResolutions > 0);
    const matchesBuilding = buildingFilter === "all" || s.building === buildingFilter;
    return matchesSearch && matchesFilter && matchesBuilding;
  });

  const getAttendanceColor = (rate) => {
    if (rate >= 85) return "text-emerald-600 bg-emerald-50";
    if (rate >= 70) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getAttendanceBarColor = (rate) => {
    if (rate >= 85) return "bg-emerald-500";
    if (rate >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-700";
      case "Late": return "bg-yellow-100 text-yellow-700";
      case "On Leave": return "bg-blue-100 text-blue-700";
      default: return "bg-red-100 text-red-700";
    }
  };

  const getResolutionStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "bg-emerald-100 text-emerald-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      case "Rejected": return "bg-red-100 text-red-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
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
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
              <Users className="w-7 h-7" />
            </div>
            Student Management
          </h1>
          <p className="text-slate-600 mt-2">View student details, attendance, and resolutions for {sectionLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-200">
            {sectionStudents.filter(s => s.status === "Inside").length} Inside
          </span>
          <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full font-medium border border-red-200">
            {sectionStudents.filter(s => s.status === "Outside").length} Outside
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by name, room, or department..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "inside", label: "Inside" },
              { key: "outside", label: "Outside" },
              { key: "resolutions", label: "⚠️ Has Resolutions" }
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "primary" : "secondary"}
                onClick={() => setFilter(f.key)}
                size="sm"
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "A", "B", "C"].map((b) => (
              <Button
                key={b}
                variant={buildingFilter === b ? "primary" : "secondary"}
                onClick={() => setBuildingFilter(b)}
                size="sm"
              >
                {b === "all" ? "All Buildings" : `Building ${b}`}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No students found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group"
              onClick={() => openStudentDetail(student)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{student.name}</h3>
                    <p className="text-xs text-slate-500">{student.department}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  student.status === "Inside"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-red-100 text-red-600 border border-red-200"
                }`}>
                  <MapPin className="w-3 h-3" />
                  {student.status}
                </span>
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>{student.room}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    Building {student.building || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{student.phone}</span>
                </div>
              </div>

              {/* Attendance Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-slate-500">Attendance</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getAttendanceColor(student.attendanceRate)}`}>
                    {student.attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getAttendanceBarColor(student.attendanceRate)}`}
                    style={{ width: `${student.attendanceRate}%` }}
                  />
                </div>
              </div>

              {/* Resolutions Badge */}
              {student.pendingResolutions > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-amber-700">
                    {student.pendingResolutions} pending resolution{student.pendingResolutions > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* View Arrow */}
              <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400 group-hover:text-primary-600 flex items-center gap-1 transition-colors">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: sectionStudents.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Inside Hostel", value: sectionStudents.filter(s => s.status === "Inside").length, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Outside Hostel", value: sectionStudents.filter(s => s.status === "Outside").length, icon: UserX, color: "text-red-500", bg: "bg-red-50" },
          { label: "With Resolutions", value: sectionStudents.filter(s => s.pendingResolutions > 0).length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" }
        ].map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={closeDetail} title={selectedStudent ? `${selectedStudent.name} — Student Profile` : ""} className="max-w-2xl">
        {isDetailLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (<div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />))}
          </div>
        ) : studentDetails ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
                studentDetails.student.hostelSection === 'boys' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600'
              } flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                {studentDetails.student.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{studentDetails.student.name}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    studentDetails.student.hostelSection === 'boys' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'
                  }`}>{studentDetails.student.hostelSection === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    Building {studentDetails.student.building || 'N/A'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(studentDetails.student.todayStatus)}`}>
                    {studentDetails.student.todayStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail, label: "Email", value: studentDetails.student.email },
                { icon: Phone, label: "Phone", value: studentDetails.student.phone },
                { icon: MapPin, label: "Room", value: studentDetails.student.room },
                { icon: Building, label: "Department", value: studentDetails.student.department },
                { icon: Phone, label: "Parent Phone", value: studentDetails.student.parentPhone },
                { icon: Calendar, label: "Joined", value: formatDate(studentDetails.student.createdAt) }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <item.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{item.label}</p>
                    <p className="text-sm text-slate-700 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { key: "overview", label: "Overview", icon: TrendingUp },
                { key: "attendance", label: "Attendance", icon: UserCheck },
                { key: "resolutions", label: "Resolutions", icon: MessageSquare },
                { key: "leaves", label: "Leaves", icon: FileText }
              ].map((tab) => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    detailTab === tab.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {detailTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Attendance", value: `${studentDetails.attendance.rate}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                    { label: "Present Days", value: studentDetails.attendance.presentDays, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Absent Days", value: studentDetails.attendance.absentDays, icon: UserX, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" }
                  ].map((s, i) => (
                    <div key={i} className={`text-center p-4 ${s.bg} rounded-xl border ${s.border}`}>
                      <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1.5`} />
                      <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                      <p className={`text-xs ${s.color} font-medium mt-0.5`}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">Attendance Rate</span>
                    <span className="font-bold text-slate-800">{studentDetails.attendance.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700" style={{ width: `${studentDetails.attendance.rate}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Late Days", value: studentDetails.attendance.lateDays, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                    { label: "On Leave", value: studentDetails.attendance.onLeaveDays || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Resolutions", value: studentDetails.resolutions.length, icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                    { label: "Leave Requests", value: studentDetails.leaveRequests?.length || 0, icon: Calendar, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.bg} border ${item.border}`}>
                      <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                      <div><p className="text-lg font-bold text-slate-800">{item.value}</p><p className={`text-xs font-medium ${item.color}`}>{item.label}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {detailTab === "attendance" && (
              <div className="space-y-3">
                {studentDetails.attendance.history.length === 0 ? (
                  <div className="text-center py-10">
                    <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No attendance records yet</p>
                  </div>
                ) : studentDetails.attendance.history.map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${record.status === 'Present' ? 'bg-green-100' : record.status === 'Late' ? 'bg-amber-100' : record.status === 'On Leave' ? 'bg-blue-100' : 'bg-red-100'}`}>
                        {record.status === 'Present' ? <UserCheck className="w-4 h-4 text-green-600" /> : record.status === 'Late' ? <Clock className="w-4 h-4 text-amber-600" /> : <UserX className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{record.date}</p>
                        <p className="text-xs text-slate-500">{record.time} • {record.location}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(record.status)}`}>{record.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Resolutions Tab */}
            {detailTab === "resolutions" && (
              <div className="space-y-3">
                {studentDetails.resolutions.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No resolutions filed</p>
                  </div>
                ) : studentDetails.resolutions.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-xs text-slate-400">{c.category}</span><span className="text-xs text-slate-400">• {c.date}</span></div>
                        <p className="text-sm text-slate-700 mt-1">{c.description}</p>
                        {c.wardenResponse && <div className="mt-2 p-2 bg-violet-50 rounded-lg border border-violet-100"><p className="text-xs text-violet-600 font-medium">Warden: {c.wardenResponse}</p></div>}
                        {c.adminResponse && <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100"><p className="text-xs text-blue-600 font-medium">Admin: {c.adminResponse}</p></div>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getResolutionStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leaves Tab */}
            {detailTab === "leaves" && (
              <div className="space-y-3">
                {(!studentDetails.leaveRequests || studentDetails.leaveRequests.length === 0) ? (
                  <div className="text-center py-10">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No leave requests</p>
                  </div>
                ) : studentDetails.leaveRequests.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{l.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(l.startDate)} → {formatDate(l.endDate)} • {l.type}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Rejected' ? 'bg-red-100 text-red-700' : l.status === 'Cancelled' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                    }`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
