import { useState, useEffect } from "react";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Calendar, Filter } from "lucide-react";

export const Activity = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("monthly");
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.student.getAttendanceHistory();
        setAttendanceHistory(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getStatistics = () => {
    const total = attendanceHistory.length;
    const present = attendanceHistory.filter(r => r.status === "Present").length;
    const late = attendanceHistory.filter(r => r.status === "Late").length;
    const absent = attendanceHistory.filter(r => r.status === "Absent").length;

    return {
      total,
      present,
      late,
      absent,
      percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
    };
  };

  if (isLoading) {
    return (
      <>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  const stats = getStatistics();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Activity</h1>
            <p className="text-slate-600 mt-1">View your attendance history and statistics</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "weekly" ? "primary" : "secondary"}
              onClick={() => setFilter("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={filter === "monthly" ? "primary" : "secondary"}
              onClick={() => setFilter("monthly")}
            >
              Monthly
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Days", value: stats.total, color: "bg-blue-50 text-blue-600" },
            { label: "Present", value: stats.present, color: "bg-green-50 text-green-600" },
            { label: "Late", value: stats.late, color: "bg-yellow-50 text-yellow-600" },
            { label: "Absent", value: stats.absent, color: "bg-red-50 text-red-600" }
          ].map((stat, idx) => (
            <Card key={idx} className="text-center">
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Attendance Percentage */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Rate</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.percentage}%</div>
          </div>
        </Card>

        {/* List View */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Records</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {attendanceHistory.length === 0 ? (
              <p className="text-center text-slate-600 py-8">No records found</p>
            ) : (
              attendanceHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{record.date}</p>
                    <p className="text-sm text-slate-600">{record.time}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      record.status === "Present"
                        ? "bg-green-100 text-green-700"
                        : record.status === "Late"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
