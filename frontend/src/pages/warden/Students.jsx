import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { CardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
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
  X,
  MessageSquare,
  TrendingUp,
  Shield
} from "lucide-react";

export const WardenStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const { error } = useToast();

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

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.room.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "inside" && s.status === "Inside") ||
      (filter === "outside" && s.status === "Outside") ||
      (filter === "complaints" && s.pendingComplaints > 0);
    return matchesSearch && matchesFilter;
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
          <p className="text-slate-600 mt-2">View student details, attendance, and complaints</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-200">
            {students.filter(s => s.status === "Inside").length} Inside
          </span>
          <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full font-medium border border-red-200">
            {students.filter(s => s.status === "Outside").length} Outside
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
              { key: "complaints", label: "⚠️ Has Complaints" }
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

              {/* Complaints Badge */}
              {student.pendingComplaints > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-amber-700">
                    {student.pendingComplaints} pending complaint{student.pendingComplaints > 1 ? 's' : ''}
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
          { label: "Total Students", value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Inside Hostel", value: students.filter(s => s.status === "Inside").length, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Outside Hostel", value: students.filter(s => s.status === "Outside").length, icon: UserX, color: "text-red-500", bg: "bg-red-50" },
          { label: "With Complaints", value: students.filter(s => s.pendingComplaints > 0).length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" }
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
      <Modal isOpen={!!selectedStudent} onClose={closeDetail} className="max-w-2xl">
        {isDetailLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-32 bg-slate-200 rounded" />
            </div>
          </div>
        ) : studentDetails ? (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/25">
                {studentDetails.student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{studentDetails.student.name}</h2>
                <p className="text-slate-500">{studentDetails.student.department} • Room {studentDetails.student.room}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 truncate">{studentDetails.student.email}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{studentDetails.student.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-700">Parent: {studentDetails.student.parentPhone}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700 truncate">{studentDetails.student.address}</span>
              </div>
            </div>

            {/* Attendance Stats */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                Attendance Summary
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xl font-bold text-blue-700">{studentDetails.attendance.rate}%</p>
                  <p className="text-[10px] text-blue-600 font-medium mt-1">Rate</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xl font-bold text-emerald-700">{studentDetails.attendance.presentDays}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">Present</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xl font-bold text-amber-700">{studentDetails.attendance.lateDays}</p>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">Late</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xl font-bold text-red-600">{studentDetails.attendance.absentDays}</p>
                  <p className="text-[10px] text-red-500 font-medium mt-1">Absent</p>
                </div>
              </div>

              {/* Recent attendance */}
              {studentDetails.attendance.history.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  <div className="space-y-1.5">
                    {studentDetails.attendance.history.slice(0, 7).map((record, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">{record.date}</span>
                        <span className="text-slate-500">{record.time}</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                        }`}>{record.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Complaints */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                Complaints ({studentDetails.complaints.length})
              </h3>
              {studentDetails.complaints.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No complaints filed</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {studentDetails.complaints.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800">{c.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          c.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-600'
                        }`}>{c.status}</span>
                      </div>
                      <p className="text-xs text-slate-600">{c.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{c.date}</p>
                      {c.wardenResponse && (
                        <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-[10px] font-semibold text-indigo-600 mb-0.5">Warden Response</p>
                          <p className="text-xs text-indigo-700">{c.wardenResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={closeDetail} className="w-full">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
