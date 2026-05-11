import { useState, useEffect, useRef } from "react";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Search, MapPin, Plus, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Users } from "lucide-react";

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ name: "", room: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  // Excel import state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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
    if (!newStudentData.name || !newStudentData.room) {
      error("Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.admin.addStudent(newStudentData);
      success("Student added successfully");
      setShowModal(false);
      setNewStudentData({ name: "", room: "" });
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

  const downloadTemplate = () => {
    // Create a sample CSV template for download
    const headers = "Name,Email,Room,Department,Phone,Password";
    const sample1 = "John Doe,john@example.com,A-101,Computer Science,9876543210,password123";
    const sample2 = "Jane Smith,jane@example.com,B-205,AIDS,9123456789,password123";
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
    const matchesFilter = filter === "all" || 
                         (filter === "inside" && s.status === "Inside") ||
                         (filter === "outside" && s.status === "Outside");
    return matchesSearch && matchesFilter;
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
              {["all", "inside", "outside"].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "primary" : "secondary"}
                  onClick={() => setFilter(f)}
                  size="sm"
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
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
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Room</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Attendance</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-600">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-medium text-slate-900">{student.name}</td>
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
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          student.status === "Inside"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          <MapPin className="w-4 h-4" />
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="secondary" size="sm">
                          View Details
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
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Total Students", value: students.length },
            { label: "Inside Hostel", value: students.filter(s => s.status === "Inside").length },
            { label: "Outside Hostel", value: students.filter(s => s.status === "Outside").length }
          ].map((stat, idx) => (
            <Card key={idx}>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            </Card>
          ))}
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
                  Optional: Room, Department, Phone, Password.
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
      </div>
    </>
  );
};
