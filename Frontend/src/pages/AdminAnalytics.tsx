import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Bell, CheckCircle2, Wind, Calendar, BarChart4, PieChart, Activity, TrendingUp, Globe } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import toast from 'react-hot-toast';

interface AnalyticsData {
  reports: { totalReports: number; resolvedReports: number; pendingReports: number; inProgressReports: number };
  alerts: { activeAlerts: number };
  reportsThisWeek: number;
  averageAQI: number;
  categoryStats: { _id: string; count: number }[];
  reportsPerDay: { _id: string; count: number }[];
  aqiTrend: { _id: string; avgAQI: number; count: number }[];
  severityStats: { _id: string; count: number }[];
  statusStats: { _id: string; count: number }[];
  topPollutedAreas: { _id: string; count: number; avgAQI: number }[];
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
        const res = await axios.get(`${API_BASE_URL}/api/officer/analytics`, {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );

  if (error) {
    toast.error(error, { id: 'admin-analytics-error' });
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 w-full text-center">
        <p className="text-muted-text">Failed to load analytics dashboard.</p>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { title: 'Total Reports', value: data.reports.totalReports, icon: MapPin, color: 'from-amber-500 to-orange-700' },
    { title: 'Active Alerts', value: data.alerts.activeAlerts, icon: Bell, color: 'from-red-500 to-rose-700' },
    { title: 'Resolved Reports', value: data.reports.resolvedReports, icon: CheckCircle2, color: 'from-green-500 to-teal-700' },
    { title: 'Average AQI', value: data.averageAQI, icon: Wind, color: 'from-purple-500 to-violet-700' },
    { title: 'Reports This Week', value: data.reportsThisWeek, icon: Calendar, color: 'from-sky-500 to-indigo-700' },
    { title: 'Pending Reports', value: data.reports.pendingReports, icon: Activity, color: 'from-yellow-500 to-amber-700' },
  ];

  const maxCategory = Math.max(...data.categoryStats.map(c => c.count), 1);
  const maxSeverity = Math.max(...data.severityStats.map(s => s.count), 1);
  const maxDaily = Math.max(...data.reportsPerDay.map(d => d.count), 1);
  const maxAqi = Math.max(...data.aqiTrend.map(a => a.avgAQI), 1);
  const maxArea = Math.max(...data.topPollutedAreas.map(a => a.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Analytics</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-muted-text">Platform analytics and statistics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider">{card.title}</span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {typeof card.value === 'number' ? <AnimatedCounter value={card.value} /> : card.value}
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} opacity-80 group-hover:scale-110 transition-transform`}>
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
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCategory) * 100}%` }} transition={{ duration: 1, delay: 0.2 }}
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
          <div key={s._id} className="glass-panel rounded-2xl p-5 border border-white/5 text-center group hover:bg-slate-800/60 transition-colors cursor-default">
            <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider block capitalize">{s._id.replace('_', ' ')}</span>
            <div className="text-4xl font-extrabold text-white mt-1 group-hover:scale-110 transition-transform">
              <AnimatedCounter value={s.count} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports per Day */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold text-white">Reports per Day</h3>
          </div>
          <div className="space-y-2">
            {data.reportsPerDay.map((d) => (
              <div key={d._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{d._id}</span>
                  <span className="text-muted-text">{d.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(d.count / maxDaily) * 100}%` }}
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AQI Trend */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold text-white">AQI Trend</h3>
          </div>
          <div className="space-y-2">
            {data.aqiTrend.map((a) => (
              <div key={a._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{a._id}</span>
                  <span className="text-muted-text">AQI {Math.round(a.avgAQI)} ({a.count} reports)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(a.avgAQI / maxAqi) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Polluted Areas */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold text-white">Top Polluted Locations</h3>
          </div>
          <div className="space-y-2">
            {data.topPollutedAreas.map((area) => (
              <div key={area._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{area._id}</span>
                  <span className="text-muted-text">{area.count} reports · AQI {Math.round(area.avgAQI)}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(area.count / maxArea) * 100}%` }}
                    className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};