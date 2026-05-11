import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CardSkeleton } from "../../components/Skeleton";
import { api } from "../../services/api";
import { Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.admin.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Students", 
      value: stats.totalStudents, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: `${stats.totalStudents} registered`
    },
    { 
      title: "Present Today", 
      value: stats.presentToday, 
      icon: UserCheck, 
      color: "text-green-600", 
      bg: "bg-green-50",
      trend: `${stats.presentToday} checked in`
    },
    { 
      title: "Absent Today", 
      value: stats.absentToday, 
      icon: UserX, 
      color: "text-red-600", 
      bg: "bg-red-50",
      trend: `${stats.absentToday} missing`
    },
    { 
      title: "Late Check-ins", 
      value: stats.lateToday, 
      icon: Clock, 
      color: "text-yellow-600", 
      bg: "bg-yellow-50",
      trend: `${stats.lateToday} after cutoff`
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of hostel attendance and student management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">{stat.title}</p>
                  <h4 className="text-3xl font-bold text-slate-900">{stat.value}</h4>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Weekly Attendance Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Attendance Overview</h3>
        <div className="h-[300px] w-full -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { 
            label: "Attendance Rate", 
            value: `${stats.attendanceRate}%`, 
            description: "Current week average",
            color: "text-green-600"
          },
          { 
            label: "Active Students", 
            value: stats.activeStudents, 
            description: `Out of ${stats.totalStudents} total`,
            color: "text-blue-600"
          },
          { 
            label: "Pending Complaints", 
            value: stats.pendingComplaints, 
            description: "Awaiting resolution",
            color: "text-yellow-600"
          }
        ].map((stat, idx) => (
          <Card key={idx}>
            <p className="text-sm text-slate-600 font-medium mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
