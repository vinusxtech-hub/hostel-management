import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { 
  ShieldCheck, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2, 
  Upload, 
  AlertCircle, 
  FileText, 
  CheckCircle,
  UserX
} from "lucide-react";

export const AdminGuards = () => {
  const [guards, setGuards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("manual"); // "manual" | "import"
  const [addedGuard, setAddedGuard] = useState(null);
  const [guardToDelete, setGuardToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const [newGuardData, setNewGuardData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const { error: showError, success } = useToast();

  const fetchGuards = async () => {
    try {
      const data = await api.admin.getGuards();
      setGuards(data);
    } catch (err) {
      showError("Failed to load guards");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const handleAddGuard = async (e) => {
    e.preventDefault();
    if (!newGuardData.name || !newGuardData.email) {
      showError("Name and email are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.admin.addGuard(newGuardData);
      success("Guard added successfully!");
      setShowAddModal(false);
      setAddedGuard(response);
      setNewGuardData({ name: "", email: "", phone: "" });
      fetchGuards();
    } catch (err) {
      showError(err.message || "Failed to add guard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      showError("Please select an Excel file first");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.admin.bulkImportGuards(excelFile);
      setImportResult(response);
      success("Guards imported successfully!");
      setExcelFile(null);
      fetchGuards();
    } catch (err) {
      showError(err.message || "Failed to import Excel file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuard = async (id) => {
    setIsDeleting(true);
    try {
      await api.admin.deleteGuard(id);
      success("Guard removed successfully!");
      setGuardToDelete(null);
      fetchGuards();
    } catch (err) {
      showError(err.message || "Failed to remove guard");
    } finally {
      setIsDeleting(false);
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

  const handleDownloadTemplate = () => {
    // Generate dummy template headers CSV
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone\nRajesh Kumar,rajesh.guard@test.com,+91-9876543210\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "guards_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            Guard Management
          </h1>
          <p className="text-slate-600 mt-2">Manage gatekeeper credentials, access levels, and security roster</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
            {guards.length} Security Guards
          </div>
          <Button
            onClick={() => {
              setActiveTab("manual");
              setShowAddModal(true);
            }}
            size="md"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Guard
          </Button>
        </div>
      </div>

      {/* Guards List */}
      {guards.length === 0 ? (
        <Card className="text-center py-16">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-500">No Security Guards</h3>
          <p className="text-slate-400 mt-2">No security guard accounts have been created yet.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guards.map((guard) => (
            <Card
              key={guard.id}
              className="relative overflow-hidden group hover:scale-[1.01] transition-all duration-300"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                  {guard.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{guard.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{guard.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
                    <Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <span>{guard.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => setGuardToDelete(guard)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Remove Guard"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Joined metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-5 pt-3 border-t border-slate-100">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(guard.joinedAt)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Guard Modal (Manual / Bulk) */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New Security Guard" 
        className="max-w-lg"
      >
        <div className="space-y-5">
          {/* Tab Selection */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "manual" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Manual Add
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "import" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Excel Import
            </button>
          </div>

          {activeTab === "manual" ? (
            <form onSubmit={handleAddGuard} className="space-y-4">
              <Input
                label="Guard Name"
                value={newGuardData.name}
                onChange={(e) => setNewGuardData({ ...newGuardData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={newGuardData.email}
                onChange={(e) => setNewGuardData({ ...newGuardData, email: e.target.value })}
                placeholder="e.g. ramesh.guard@test.com"
                required
              />
              <Input
                label="Phone Number"
                value={newGuardData.phone}
                onChange={(e) => setNewGuardData({ ...newGuardData, phone: e.target.value })}
                placeholder="e.g. +91-9876543210"
              />
              <div className="flex gap-3 pt-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Adding...' : 'Add Guard'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleExcelUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">Choose Excel file</p>
                <p className="text-xs text-slate-400 mt-1">Accepts .xlsx, .xls, or .csv formats (max 5MB)</p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                />
                {excelFile && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium">
                    <FileText className="w-4 h-4" />
                    <span>Selected: {excelFile.name}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
                <span className="text-slate-500 font-medium">Need the file format structure?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                >
                  Download Template
                </button>
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="submit" disabled={isSubmitting || !excelFile} className="flex-1">
                  {isSubmitting ? 'Importing...' : 'Import Guards'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Manual Add Success Credentials Modal */}
      <Modal 
        isOpen={!!addedGuard} 
        onClose={() => setAddedGuard(null)} 
        title="Guard Added Successfully"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Guard Created</h3>
            <p className="text-xs text-slate-600 font-semibold mt-2 px-2">
              Login credentials (username and password) have been sent directly to their registered email:
              <br/>
              <strong className="text-emerald-700 break-all">{addedGuard?.email}</strong>
            </p>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Full Name:</strong> {addedGuard?.name}
            </p>
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Role:</strong> Security Guard
            </p>
          </div>

          <Button className="w-full" onClick={() => setAddedGuard(null)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Excel Import Success/Failure Result Modal */}
      <Modal 
        isOpen={!!importResult} 
        onClose={() => setImportResult(null)} 
        title="Import Summary"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-800">{importResult?.message}</p>
              <p className="text-xs text-slate-500 mt-0.5">Processed {importResult?.totalProcessed} records total.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-2xl font-bold text-emerald-700">{importResult?.success}</span>
              <p className="text-[10px] text-emerald-600 font-medium">Successfully Added</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
              <span className="text-2xl font-bold text-red-700">{importResult?.failed}</span>
              <p className="text-[10px] text-red-600 font-medium">Failed / Skipped</p>
            </div>
          </div>

          {importResult?.errors && importResult.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Errors List</p>
              <div className="max-h-40 overflow-y-auto border border-red-100 bg-red-50/50 rounded-xl p-3 text-xs space-y-1.5 font-medium text-red-700">
                {importResult.errors.map((err, idx) => (
                  <p key={idx}>• Row {err.row}: {err.reason} {err.name ? `(${err.name})` : ""}</p>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={() => setImportResult(null)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!guardToDelete}
        onClose={() => setGuardToDelete(null)}
        title="Remove Guard Account"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
            <UserX className="w-12 h-12 text-red-500 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to remove guard <strong className="text-slate-900 font-bold">{guardToDelete?.name}</strong>?
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
              onClick={() => handleDeleteGuard(guardToDelete?.id)}
            >
              Remove Guard
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setGuardToDelete(null)}
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
