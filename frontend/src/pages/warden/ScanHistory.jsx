import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card } from "../../components/Card";
import { 
  Clock, 
  Search, 
  Shield, 
  User, 
  Home, 
  BookOpen, 
  Building, 
  Calendar,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";

export const WardenScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.warden.getScanHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDateTime = (dt) => {
    if (!dt) return "N/A";
    return new Date(dt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      item.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentRoom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentDepartment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scannedByName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYear = selectedYearFilter === "all" || item.studentYear === selectedYearFilter;
    
    return matchesSearch && matchesYear;
  });

  // Calculate year counts for stats
  const getYearCount = (year) => {
    return history.filter(item => item.studentYear === year).length;
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    
    const headers = [
      "Student Name",
      "Student Email",
      "Academic Year",
      "Room",
      "Building",
      "Hostel Section",
      "Department",
      "Phone",
      "Leave Reason",
      "Pass Start Date",
      "Pass End Date",
      "Scanned At",
      "Scanned By (Guard)",
      "Status"
    ];

    const rows = filteredHistory.map(item => {
      const getHostelSectionLabel = (sec) => {
        if (sec === "boys") return "Boys Hostel";
        if (sec === "girls") return "Girls Hostel";
        return sec || "N/A";
      };

      const formatFullDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      };

      return [
        `"${(item.studentName || 'Unknown').replace(/"/g, '""')}"`,
        `"${(item.studentEmail || '').replace(/"/g, '""')}"`,
        `"${(item.studentYear || 'N/A').replace(/"/g, '""')}"`,
        `"${(item.studentRoom || 'N/A').replace(/"/g, '""')}"`,
        `"${(item.studentBuilding || 'N/A').replace(/"/g, '""')}"`,
        `"${getHostelSectionLabel(item.hostelSection).replace(/"/g, '""')}"`,
        `"${(item.studentDepartment || 'N/A').replace(/"/g, '""')}"`,
        `"${(item.studentPhone || 'N/A').replace(/"/g, '""')}"`,
        `"${(item.reason || 'N/A').replace(/"/g, '""')}"`,
        `"${formatFullDate(item.startDate)}"`,
        `"${formatFullDate(item.endDate)}"`,
        `"${formatDateTime(item.scannedAt)}"`,
        `"${(item.scannedByName || 'Guard').replace(/"/g, '""')}"`,
        `"Verified"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `warden_scan_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
              <Clock className="w-7 h-7" />
            </div>
            Section Scan Logs
          </h1>
          <p className="text-slate-600 mt-2">Log and audit records of all verified gate passes in your section</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            disabled={loading || filteredHistory.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/10 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center py-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200/50">
          <span className="text-2xl font-black text-indigo-700">{history.length}</span>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1">Total Scans</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/40">
          <span className="text-2xl font-black text-slate-700">{getYearCount("1st Year")}</span>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">1st Year</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/40">
          <span className="text-2xl font-black text-slate-700">{getYearCount("2nd Year")}</span>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">2nd Year</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/40">
          <span className="text-2xl font-black text-slate-700">{getYearCount("3rd Year")}</span>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">3rd Year</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/40">
          <span className="text-2xl font-black text-slate-700">{getYearCount("4th Year")}</span>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">4th Year</p>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="w-full md:w-80 relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, room, reason or guard..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Year Filter Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs gap-0.5 w-full md:w-auto overflow-x-auto">
            {["all", "1st Year", "2nd Year", "3rd Year", "4th Year"].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYearFilter(yr)}
                className={`px-4 py-2 font-semibold rounded-lg transition-all shrink-0 ${
                  selectedYearFilter === yr
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {yr === "all" ? "All Years" : yr}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Logs Table / List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-sm">Loading history logs...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No History Logs Found</h3>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery || selectedYearFilter !== "all"
                ? "Try adjusting your search query or year filter."
                : "No scanned gate logs exist in your section yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Student Info</th>
                  <th className="py-4 px-6">Leave Details</th>
                  <th className="py-4 px-6">Scanned By</th>
                  <th className="py-4 px-6">Scan Time</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Student Info Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                          item.hostelSection === 'boys' ? 'from-blue-500/10 to-indigo-500/15 border-blue-200/40 text-blue-700' : 'from-pink-500/10 to-rose-500/15 border-pink-200/40 text-pink-700'
                        } border flex items-center justify-center font-bold shrink-0 shadow-sm`}>
                          {item.studentName?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.studentName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                              {item.studentYear || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-1">
                            <span>Room {item.studentRoom}</span>
                            <span>•</span>
                            <span>Building {item.studentBuilding || "N/A"}</span>
                            <span>•</span>
                            <span>{item.studentDepartment}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leave Details Column */}
                    <td className="py-4 px-6">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {item.reason}
                        </span>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Pass Period: <strong className="text-slate-600">{formatDate(item.startDate)}</strong> to <strong className="text-slate-600">{formatDate(item.endDate)}</strong>
                        </p>
                      </div>
                    </td>

                    {/* Scanned By Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200">
                          {item.scannedByName?.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700">{item.scannedByName}</span>
                      </div>
                    </td>

                    {/* Scan Time Column */}
                    <td className="py-4 px-6">
                      <div className="text-xs">
                        <p className="font-bold text-slate-700">
                          {new Date(item.scannedAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {new Date(item.scannedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
