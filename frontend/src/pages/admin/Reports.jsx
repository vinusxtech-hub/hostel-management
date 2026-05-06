import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const AdminReports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.admin.getReports();
        setReportData(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading || !reportData) {
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive attendance analytics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Avg Attendance Rate", value: reportData.avgAttendanceRate, color: "text-green-600" },
            { label: "Total Students", value: reportData.totalStudents, color: "text-blue-600" },
            { label: "Present This Month", value: reportData.totalPresentMonth, color: "text-emerald-600" },
            { label: "Absent This Month", value: reportData.totalAbsentMonth, color: "text-red-600" }
          ].map((metric, idx) => (
            <Card key={idx}>
              <p className="text-sm text-slate-600 font-medium">{metric.label}</p>
              <p className={`text-3xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Attendance Trend</h3>
            <div className="h-[300px] w-full -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Current Month Breakdown */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Month Breakdown</h3>
            <div className="h-[300px] w-full -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportData.pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {reportData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Weekly Trend */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Attendance Rate Trend</h3>
          <div className="h-[300px] w-full -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[85, 100]} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{fill: '#3b82f6', r: 5}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Wise Analysis */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Department-wise Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Department</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Total Students</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Present</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.departmentData.map((dept, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-900">{dept.name}</td>
                    <td className="py-4 px-4 text-slate-600">{dept.value}</td>
                    <td className="py-4 px-4 text-slate-600">{dept.present}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${dept.attendance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">{dept.attendance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
};
