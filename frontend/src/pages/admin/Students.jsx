import { useState, useEffect, useRef } from "react";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Search, MapPin, Plus, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Users, Mail, Phone, Building, Calendar, Clock, UserCheck, UserX, ChevronRight, MessageSquare, TrendingUp, Eye, FileText } from "lucide-react";

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ name: "", room: "", email: "", hostelSection: "", building: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  // Excel import state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Student detail modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("overview");

  const fetchStudents = async () => {
    try {
      const data = await api.admin.getStudents();
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentData.name || !newStudentData.room || !newStudentData.email || !newStudentData.hostelSection || !newStudentData.building) {
      error("Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.admin.addStudent(newStudentData);
      success("Student added successfully");
      setShowModal(false);
      setNewStudentData({ name: "", room: "", email: "", hostelSection: "", building: "" });
      fetchStudents();
    } catch (err) {
      error("Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Excel Import Handlers ----
  const handleFileSelect = (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      error("Please upload an Excel file (.xlsx, .xls) or CSV file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error("File size must be under 5MB");
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      error("Please select a file first");
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await api.admin.bulkImportStudents(selectedFile);
      setImportResult(result);
      if (result.success > 0) {
        success(`${result.success} students imported successfully!`);
        fetchStudents();
      }
    } catch (err) {
      error(err.message || "Failed to import students");
      setImportResult({ success: 0, failed: 0, errors: [{ reason: err.message }], message: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setImportResult(null);
    setIsDragging(false);
  };

  // Student detail handlers
  const openStudentDetails = async (student) => {
    setSelectedStudent(student);
    setDetailTab("overview");
    setDetailsLoading(true);
    try {
      const data = await api.admin.getStudentDetails(student.id);
      setStudentDetails(data);
    } catch (err) {
      error("Failed to load student details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
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

  const downloadTemplate = () => {
    // Create a sample CSV template for download
    const headers = "Name,Email,HostelSection,Building,Room,Department,Phone,Password";
    const sample1 = "Anshu,anshu@example.com,boys,A,A-101,Computer Science,9876543210,password123";
    const sample2 = "Jane Smith,jane@example.com,girls,B,B-205,AIDS,9123456789,password123";
    const csvContent = `${headers}\n${sample1}\n${sample2}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.room.toLowerCase().includes(search.toLowerCase());
    const matchesBuilding = buildingFilter === "all" || s.building === buildingFilter;
    return matchesSearch && matchesBuilding;
  });

  if (isLoading) {
    return (
      <>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Students</h1>
            <p className="text-slate-600 mt-1">View and manage all hostel students</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button size="lg" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
              <Input 
                placeholder="Search by name or room number..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
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

        {/* Students Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Section</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Building</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Room</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Attendance</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-600">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-medium text-slate-900">{student.name}</td>
                      <td className="py-4 px-4 text-slate-600 capitalize">{student.hostelSection || "N/A"}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {student.building || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{student.room}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: student.attendanceRate }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{student.attendanceRate}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openStudentDetails(student); }}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-1 gap-6">
          <Card>
            <p className="text-sm text-slate-600 font-medium">Total Students</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{students.length}</p>
          </Card>
        </div>

        {/* Add Student Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <h2 className="text-2xl font-bold">Add New Student</h2>
            <Input
              label="Full Name"
              value={newStudentData.name}
              onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={newStudentData.email}
              onChange={(e) => setNewStudentData({...newStudentData, email: e.target.value})}
              placeholder="e.g. john@example.com"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hostel Section</label>
              <select
                value={newStudentData.hostelSection}
                onChange={(e) => setNewStudentData({ ...newStudentData, hostelSection: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white text-sm"
              >
                <option value="">Select section</option>
                <option value="boys">Boys Hostel</option>
                <option value="girls">Girls Hostel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Building</label>
              <select
                value={newStudentData.building}
                onChange={(e) => setNewStudentData({ ...newStudentData, building: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white text-sm"
              >
                <option value="">Select building</option>
                <option value="A">Building A</option>
                <option value="B">Building B</option>
                <option value="C">Building C</option>
              </select>
            </div>
            <Input
              label="Room Number"
              value={newStudentData.room}
              onChange={(e) => setNewStudentData({...newStudentData, room: e.target.value})}
              placeholder="e.g. A-101"
            />
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Excel Import Modal */}
        <Modal isOpen={showImportModal} onClose={handleCloseImportModal}>
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-green-500/25">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Import from Excel</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Bulk add students from a spreadsheet</p>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">Required Columns</p>
                <p className="text-xs text-blue-600 mt-1">
                  Your Excel file must have <strong>Name</strong> and <strong>Email</strong> columns.
                  Optional: HostelSection, Room, Department, Phone, Password.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template (.csv)
                </button>
              </div>
            </div>

            {/* Drop Zone */}
            {!importResult && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50/50 scale-[1.02]'
                    : selectedFile
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-slate-300 bg-slate-50/50 hover:border-primary-400 hover:bg-primary-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mt-1"
                    >
                      <X className="w-3 h-3" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-primary-100' : 'bg-slate-100'}`}>
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">
                        {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        or <span className="text-primary-600 font-medium">browse files</span> — .xlsx, .xls, .csv (max 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-4 animate-fade-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">{importResult.success}</span>
                    </div>
                    <p className="text-xs text-green-600 font-medium">Successfully Added</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-700">{importResult.failed}</span>
                    </div>
                    <p className="text-xs text-red-600 font-medium">Failed</p>
                  </div>
                </div>

                {/* Error Details */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                    <div className="space-y-1.5">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="text-xs text-red-700 flex items-start gap-2 bg-white/60 p-2 rounded-lg">
                          <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                            Row {err.row || '?'}
                          </span>
                          <span>{err.name ? `${err.name}: ` : ''}{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success List (collapsed) */}
                {importResult.created && importResult.created.length > 0 && (
                  <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 max-h-40 overflow-y-auto">
                    <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Students Added ({importResult.created.length}):
                    </p>
                    <div className="space-y-1">
                      {importResult.created.map((s, i) => (
                        <div key={i} className="text-xs text-green-700 flex items-center justify-between bg-white/60 p-2 rounded-lg">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-green-500">{s.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!importResult ? (
                <>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || isImporting}
                    isLoading={isImporting}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import Students'}
                  </Button>
                  <Button variant="secondary" onClick={handleCloseImportModal}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => { setSelectedFile(null); setImportResult(null); }}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Another File
                  </Button>
                  <Button onClick={handleCloseImportModal}>
                    Done
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>

        {/* Student Detail Modal */}
        <Modal isOpen={!!selectedStudent} onClose={closeStudentDetails} title={selectedStudent ? `${selectedStudent.name} — Student Profile` : ""} className="max-w-2xl">
          {detailsLoading ? (
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
                  </div>
                </div>
              </div>

              {/* Contact Info */}
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
                      { label: "Leave Requests", value: studentDetails.leaveRequests.length, icon: Calendar, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" }
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
                          {c.adminResponse && <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100"><p className="text-xs text-blue-600 font-medium">Admin: {c.adminResponse}</p></div>}
                          {c.wardenResponse && <div className="mt-2 p-2 bg-violet-50 rounded-lg border border-violet-100"><p className="text-xs text-violet-600 font-medium">Warden: {c.wardenResponse}</p></div>}
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
                  {studentDetails.leaveRequests.length === 0 ? (
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
    </>
  );
};
