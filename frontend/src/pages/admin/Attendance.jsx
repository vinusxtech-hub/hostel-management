import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import {
  AlertCircle,
  CalendarDays,
  Download,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";

export const Attendance = () => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = { date: dateFilter };
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await api.admin.getAttendance(params);
      setAttendanceData(data);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setAttendanceData([]);
      setError(err.message || "Unable to load attendance records right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, statusFilter]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredData = attendanceData.filter((record) => {
    if (!normalizedQuery) return true;

    return [record.name, record.room, record.location, record.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
      case "Late":
        return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
      default:
        return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
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
      ...filteredData.map(
        (record) =>
          `"${record.name}","${record.room}","${record.date}","${record.time}","${record.status}","${record.location}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `attendance_report_${dateFilter}.csv`);
    link.style.visibility = "hidden";
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

  const presentCount = filteredData.filter((record) => record.status === "Present").length;
  const lateCount = filteredData.filter((record) => record.status === "Late").length;
  const absentCount = filteredData.filter((record) => record.status === "Absent").length;
  const total = filteredData.length || 1;
  const rate = Math.round(((presentCount + lateCount) / total) * 100);
  const uniqueRooms = new Set(filteredData.map((record) => record.room).filter(Boolean)).size;
  const issueCount = lateCount + absentCount;
  const topLocations = filteredData.reduce((acc, record) => {
    const key = record.location || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const busiestLocation =
    Object.entries(topLocations).sort((a, b) => b[1] - a[1])[0]?.[0] || "No location data";
  const attentionRecords = filteredData
    .filter((record) => record.status !== "Present")
    .slice(0, 5);
  const statCards = [
    {
      label: "On-Time Presence",
      value: presentCount,
      helper: `${rate}% attendance rate`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: UserCheck,
    },
    {
      label: "Late Check-ins",
      value: lateCount,
      helper: issueCount ? `${issueCount} records need review` : "No issues detected",
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: TrendingUp,
    },
    {
      label: "Absentees",
      value: absentCount,
      helper: `${uniqueRooms} rooms represented`,
      color: "text-rose-600",
      bg: "bg-rose-50",
      icon: UserX,
    },
    {
      label: "Busiest Location",
      value: busiestLocation,
      helper: `${filteredData.length} filtered records`,
      color: "text-sky-600",
      bg: "bg-sky-50",
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-7 text-white shadow-xl shadow-slate-900/20 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <CalendarDays className="h-3.5 w-3.5" />
              Admin Attendance Panel
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Daily attendance command center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-200 sm:text-base">
              Track presence, catch late arrivals quickly, and export a clean attendance
              view for the selected date.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              onClick={fetchAttendance}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button size="lg" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="all">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, room, location..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="min-w-[180px] xl:max-w-[220px]">
            <Button variant="secondary" className="w-full" onClick={fetchAttendance}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <span className="font-semibold text-slate-800">{filteredData.length}</span>{" "}
            records for <span className="font-semibold text-slate-800">{dateFilter}</span>
          </p>
          <p>{lastUpdated ? `Last synced: ${lastUpdated}` : "Waiting for first sync"}</p>
        </div>
      </Card>

      {error && (
        <Card className="border border-rose-200 bg-rose-50/80">
          <div className="flex items-start gap-3 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load attendance data</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;

          return (
            <Card key={idx}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Attendance Records</h2>
              <p className="mt-1 text-sm text-slate-500">
                Live filtered list for the selected date and status.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {statusFilter === "all" ? "All statuses" : statusFilter}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">Student Name</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">Room</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">Time</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-600">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-600">
                      No records found for the selected date and status
                    </td>
                  </tr>
                ) : (
                  filteredData.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{record.name}</td>
                      <td className="px-4 py-4 text-slate-600">{record.room}</td>
                      <td className="px-4 py-4 text-slate-600">{record.date}</td>
                      <td className="px-4 py-4 text-slate-600">{record.time}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{record.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="bg-slate-950 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Needs Attention</h2>
              <p className="mt-1 text-sm text-slate-300">
                Late and absent students surfaced first.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
              {issueCount} flagged
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {attentionRecords.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Everyone in the filtered view is present. No urgent follow-up right now.
              </div>
            ) : (
              attentionRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{record.name}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Room {record.room || "N/A"} | {record.time || "Time unavailable"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Location: <span className="text-white">{record.location || "Unknown"}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
