import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Shield, MapPin, Bell, CheckCircle2, Wind, Calendar, Flame, Activity, TrendingUp, BarChart4, PieChart } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';

interface AnalyticsData {
  users: { totalCitizens: number; totalOfficers: number; totalAdmins: number };
  reports: { totalReports: number; resolvedReports: number; pendingReports: number; inProgressReports: number };
  alerts: { activeAlerts: number; totalAlerts: number };
  reportsThisWeek: number;
  averageAQI: number;
  topCategory: string;
  categoryStats: { _id: string; count: number }[];
  severityStats: { _id: string; count: number }[];
  statusStats: { _id: string; count: number }[];
}

interface AdminAnalyticsProps {
  token: string | null;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ token }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-text">Loading analytics...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="p-4 rounded-xl bg-danger/20 border border-danger/40 text-sm text-white">{error}</div>
    </div>
  );

  if (!data) return null;

  const cards = [
    { title: 'Total Citizens', value: data.users.totalCitizens, icon: Users, color: 'from-green-500 to-emerald-700' },
    { title: 'Total Officers', value: data.users.totalOfficers, icon: Shield, color: 'from-blue-500 to-blue-700' },
    { title: 'Total Reports', value: data.reports.totalReports, icon: MapPin, color: 'from-amber-500 to-orange-700' },
    { title: 'Active Alerts', value: data.alerts.activeAlerts, icon: Bell, color: 'from-red-500 to-rose-700' },
    { title: 'Resolved Reports', value: data.reports.resolvedReports, icon: CheckCircle2, color: 'from-green-500 to-teal-700' },
    { title: 'Average AQI', value: data.averageAQI, icon: Wind, color: 'from-purple-500 to-violet-700' },
    { title: 'Reports This Week', value: data.reportsThisWeek, icon: Calendar, color: 'from-sky-500 to-indigo-700' },
    { title: 'Top Category', value: data.topCategory, icon: Flame, color: 'from-pink-500 to-rose-700' },
  ];

  const maxCategory = Math.max(...data.categoryStats.map(c => c.count), 1);
  const maxSeverity = Math.max(...data.severityStats.map(s => s.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Analytics</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Analytics Dashboard</h1>
        <p className="text-sm text-muted-text">Comprehensive platform analytics and statistics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider">{card.title}</span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {typeof card.value === 'number' ? card.value : card.value}
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} opacity-80`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart4 className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold text-white">Reports by Category</h3>
          </div>
          <div className="space-y-2">
            {data.categoryStats.map((cat) => (
              <div key={cat._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{cat._id}</span>
                  <span className="text-muted-text">{cat.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCategory) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold text-white">Reports by Severity</h3>
          </div>
          <div className="space-y-2">
            {data.severityStats.map((s) => (
              <div key={s._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium capitalize">{s._id}</span>
                  <span className="text-muted-text">{s.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / maxSeverity) * 100}%` }}
                    className={`h-full rounded-full ${s._id === 'critical' || s._id === 'high' ? 'bg-gradient-to-r from-red-500 to-rose-500' : s._id === 'moderate' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.statusStats.map((s) => (
          <div key={s._id} className="glass-panel rounded-2xl p-5 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider block capitalize">{s._id.replace('_', ' ')}</span>
            <div className="text-4xl font-extrabold text-white mt-1">{s.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};