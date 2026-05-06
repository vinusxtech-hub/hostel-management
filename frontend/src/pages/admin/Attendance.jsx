import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Download, RefreshCw } from "lucide-react";

export const Attendance = () => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const params = { date: dateFilter };
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await api.admin.getAttendance(params);
      setAttendanceData(data);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, statusFilter]);

  const filteredData = attendanceData;

  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-700";
      case "Late": return "bg-yellow-100 text-yellow-700";
      default: return "bg-red-100 text-red-700";
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ["Student Name", "Room", "Date", "Time", "Status", "Location"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(r => `"${r.name}","${r.room}","${r.date}","${r.time}","${r.status}","${r.location}"`)
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `attendance_report_${dateFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const presentCount = filteredData.filter(r => r.status === "Present").length;
  const lateCount = filteredData.filter(r => r.status === "Late").length;
  const absentCount = filteredData.filter(r => r.status === "Absent").length;
  const total = filteredData.length || 1;
  const rate = Math.round(((presentCount + lateCount) / total) * 100);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance Management</h1>
            <p className="text-slate-600 mt-1">View and manage student attendance records</p>
          </div>
          <Button size="lg" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="all">All Status</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="secondary" className="w-full" onClick={fetchAttendance}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Present", value: presentCount, color: "text-green-600" },
            { label: "Total Late", value: lateCount, color: "text-yellow-600" },
            { label: "Total Absent", value: absentCount, color: "text-red-600" },
            { label: "Present Rate", value: `${rate}%`, color: "text-blue-600" }
          ].map((stat, idx) => (
            <Card key={idx}>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Student Name</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Room</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Time</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-600">
                      No records found for the selected date and status
                    </td>
                  </tr>
                ) : (
                  filteredData.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-medium text-slate-900">{record.name}</td>
                      <td className="py-4 px-4 text-slate-600">{record.room}</td>
                      <td className="py-4 px-4 text-slate-600">{record.date}</td>
                      <td className="py-4 px-4 text-slate-600">{record.time}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{record.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
};
