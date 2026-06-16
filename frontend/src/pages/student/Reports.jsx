import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const Reports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.student.getReports();
        setReportData(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading || !reportData) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Reports</h1>
          <p className="text-slate-600 mt-1">Analyze your attendance patterns and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Days", value: reportData.total, color: "text-blue-600" },
            { label: "Present", value: reportData.present, color: "text-green-600" },
            { label: "Late", value: reportData.late, color: "text-yellow-600" },
            { label: "Attendance Rate", value: `${reportData.percentage}%`, color: "text-emerald-600" }
          ].map((stat, idx) => (
            <Card key={idx}>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Attendance Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">This Week's Attendance</h3>
            <div className="h-[300px] w-full -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="late" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Monthly Overview Pie */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Overall Breakdown</h3>
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

        {/* Trend Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">5-Month Attendance Trend</h3>
          <div className="h-[300px] w-full -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} dot={{fill: '#3b82f6', r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Current Status</p>
              <p className={`text-2xl font-bold ${reportData.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.percentage >= 75 ? 'On Track' : 'Needs Improvement'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Attendance Rate</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full transition-all duration-500" style={{ width: `${reportData.percentage}%` }}></div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{reportData.percentage}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
