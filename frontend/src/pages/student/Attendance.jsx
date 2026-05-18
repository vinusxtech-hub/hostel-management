import { useState, useEffect } from "react";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useToast } from "../../hooks/useToast";
import { Loader } from "../../components/Loader";
import { api } from "../../services/api";
import { CheckCircle, Clock } from "lucide-react";

export const Attendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [settings, setSettings] = useState(null);
  const { error } = useToast();

  useEffect(() => {
    fetchAttendanceHistory();
    const loadSettings = async () => {
      try {
        const data = await api.student.getSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, []);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.student.getAttendanceHistory();
      setAttendanceHistory(data);
    } catch (err) {
      error("Failed to load attendance history");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "text-green-600 bg-green-50";
      case "Late":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-red-600 bg-red-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle className="w-4 h-4" />;
      case "Late":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
            <p className="text-slate-600 mt-1">View your daily attendance status and history</p>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Today's Status</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Check-in Time", value: settings?.checkInTime ?? "-" },
              { label: "Cutoff Time", value: settings?.cutoffTime ?? "-" },
              { label: "Status", value: settings?.status ?? "-" }
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Attendance History</h2>
            <Button variant="secondary" onClick={() => setShowHistoryModal(true)}>
              View Calendar
            </Button>
          </div>

          {isLoading ? (
            <Loader text="Loading history..." />
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900">{record.date}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}
                        >
                          {getStatusIcon(record.status)}
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-900">{record.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
          <div>Calendar view coming soon...</div>
        </Modal>
      </div>
    </>
  );
};
