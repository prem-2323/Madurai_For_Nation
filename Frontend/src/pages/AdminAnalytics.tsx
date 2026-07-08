import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Bell, CheckCircle2, Wind, Calendar, BarChart4,
  PieChart, Activity, TrendingUp, Globe, RefreshCw, Download,
  Clock, AlertTriangle, AlertCircle, CheckCircle, XCircle,
  ChevronDown, Filter, ArrowUp, ArrowDown, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
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

type TimePeriod = 'week' | 'month' | 'year';

const CARD_GRADIENTS: Record<string, string> = {
  'Total Reports': 'from-amber-500 to-orange-600',
  'Active Alerts': 'from-red-500 to-rose-600',
  'Resolved Reports': 'from-green-500 to-teal-600',
  'Average AQI': 'from-purple-500 to-violet-600',
  'Reports This Week': 'from-sky-500 to-indigo-600',
  'Pending Reports': 'from-yellow-500 to-amber-600',
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; gradient: string; label: string }> = {
  resolved: { icon: CheckCircle, gradient: 'from-green-500/20 to-teal-500/10', label: 'Resolved' },
  pending: { icon: Clock, gradient: 'from-yellow-500/20 to-amber-500/10', label: 'Pending' },
  'in_progress': { icon: Activity, gradient: 'from-blue-500/20 to-indigo-500/10', label: 'In Progress' },
};

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'from-red-500 to-rose-500';
    case 'high': return 'from-orange-500 to-red-500';
    case 'moderate': return 'from-amber-500 to-yellow-500';
    default: return 'from-green-500 to-emerald-500';
  }
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return 'from-green-500 to-emerald-500';
  if (aqi <= 100) return 'from-yellow-500 to-amber-500';
  if (aqi <= 150) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-rose-500';
}

function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

const BarChart: React.FC<{
  data: { _id: string; count: number; secondary?: string }[];
  maxValue: number;
  colorFn?: (id: string) => string;
  showPercentage?: boolean;
  delay?: number;
}> = ({ data, maxValue, colorFn, showPercentage, delay = 0.2 }) => (
  <div className="space-y-3">
    {data.map((item, i) => {
      const pct = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
      return (
        <div key={item._id} className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white font-medium truncate max-w-[60%]">{item._id}</span>
            <span className="text-muted-text shrink-0">
              {item.count}{item.secondary ? ` · ${item.secondary}` : ''}
              {showPercentage && maxValue > 0 ? ` (${Math.round(pct)}%)` : ''}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/60 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: delay + i * 0.06, ease: 'easeOut' }}
              className={`h-full rounded-full relative ${colorFn ? colorFn(item._id) : 'bg-gradient-to-r from-primary to-secondary'}`}
            >
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: delay + i * 0.06 }}
              />
            </motion.div>
          </div>
        </div>
      );
    })}
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left w-full">
    <div className="space-y-3">
      <Skeleton type="text" className="h-3 w-24" />
      <Skeleton type="text" className="h-10 w-72" />
      <Skeleton type="text" className="h-4 w-56" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton type="rectangular" className="h-64" />
      <Skeleton type="rectangular" className="h-64" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Skeleton type="rectangular" className="h-32" />
      <Skeleton type="rectangular" className="h-32" />
      <Skeleton type="rectangular" className="h-32" />
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-3xl p-12 border border-red-500/20 text-center max-w-lg mx-auto space-y-6"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Failed to Load Analytics</h2>
        <p className="text-sm text-muted-text">{message}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-shadow"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </motion.button>
    </motion.div>
  </div>
);

const EmptyPanel: React.FC<{ icon: React.ElementType; title: string; description?: string }> = ({ icon: Icon, title, description }) => (
  <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center min-h-[200px] space-y-3">
    <Icon className="w-8 h-8 text-muted-text/50" />
    <p className="text-sm text-muted-text font-medium">{title}</p>
    {description && <p className="text-xs text-muted-text/60">{description}</p>}
  </div>
);

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ token }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/officer/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load analytics';
      if (!showRefreshIndicator) setError(msg);
      else toast.error(msg, { id: 'analytics-refresh-error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <LoadingSkeleton />;

  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); fetchAnalytics(); }} />;

  if (!data) return null;

  const totalFromStatus = data.statusStats.reduce((sum, s) => sum + s.count, 0);
  const resolvedPct = totalFromStatus > 0 ? Math.round((data.reports.resolvedReports / totalFromStatus) * 100) : 0;
  const pendingPct = totalFromStatus > 0 ? Math.round((data.reports.pendingReports / totalFromStatus) * 100) : 0;
  const inProgressPct = totalFromStatus > 0 ? Math.round((data.reports.inProgressReports / totalFromStatus) * 100) : 0;

  const cards = [
    { title: 'Total Reports', value: data.reports.totalReports, icon: MapPin, subtitle: 'All time reports' },
    { title: 'Active Alerts', value: data.alerts.activeAlerts, icon: Bell, subtitle: 'Currently active' },
    { title: 'Resolved Reports', value: data.reports.resolvedReports, icon: CheckCircle2, subtitle: `${resolvedPct}% of total` },
    { title: 'Average AQI', value: data.averageAQI, icon: Wind, subtitle: getAQILabel(data.averageAQI) },
    { title: 'Reports This Week', value: data.reportsThisWeek, icon: Calendar, subtitle: 'Last 7 days' },
    { title: 'Pending Reports', value: data.reports.pendingReports, icon: Activity, subtitle: `${pendingPct}% of total` },
  ];

  const maxCategory = Math.max(...data.categoryStats.map(c => c.count), 1);
  const maxSeverity = Math.max(...data.severityStats.map(s => s.count), 1);
  const maxDaily = Math.max(...data.reportsPerDay.map(d => d.count), 1);
  const maxAqi = Math.max(...data.aqiTrend.map(a => a.avgAQI), 1);
  const maxArea = Math.max(...data.topPollutedAreas.map(a => a.count), 1);

  const handleExport = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics data exported', { id: 'export-analytics' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-[0.15em] block">Analytics</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">Analytics Dashboard</span>
          </h1>
          <p className="text-sm text-muted-text">
            Platform overview and performance metrics.
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-text/60">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Period Filter */}
          <div className="flex bg-slate-800/60 rounded-xl p-0.5 border border-white/5">
            {TIME_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setTimePeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timePeriod === p.value
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                    : 'text-muted-text hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800/60 border border-white/5 text-muted-text hover:text-white hover:border-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="p-2 rounded-xl bg-slate-800/60 border border-white/5 text-muted-text hover:text-white hover:border-white/10 transition-all"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Insight Banner */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-4 border border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-text">
              <span className="text-white font-semibold">Platform Summary: </span>
              {data.reports.totalReports} total reports · {data.alerts.activeAlerts} active alerts ·
              <span className="text-green-400 font-medium"> {resolvedPct}% resolved</span> ·
              Avg AQI <span className={data.averageAQI > 100 ? 'text-red-400' : 'text-green-400'}>{Math.round(data.averageAQI)}</span>
              {' · '}{data.reportsThisWeek} reports this week
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="glass-panel rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br opacity-[0.03] rounded-full group-hover:opacity-[0.06] transition-opacity" />
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider block truncate">{card.title}</span>
                <div className="text-2xl font-extrabold text-white">
                  {typeof card.value === 'number' ? <AnimatedCounter value={card.value} /> : card.value}
                </div>
                <span className="text-[10px] text-muted-text/60 block">{card.subtitle}</span>
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${CARD_GRADIENTS[card.title]} opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all shrink-0`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            {/* Mini progress bar at bottom */}
            {card.title !== 'Average AQI' && card.title !== 'Active Alerts' && data.reports.totalReports > 0 && (
              <div className="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(typeof card.value === 'number' ? card.value : 0) / (card.title === 'Total Reports' ? data.reports.totalReports : data.reports.totalReports) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 + idx * 0.06 }}
                  className={`h-full rounded-full bg-gradient-to-r ${CARD_GRADIENTS[card.title]}`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 - Category & Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-secondary/10">
                <BarChart4 className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reports by Category</h3>
                <p className="text-[10px] text-muted-text/60">Distribution across pollution types</p>
              </div>
            </div>
            <span className="text-xs text-muted-text font-medium">{data.categoryStats.length} categories</span>
          </div>
          {data.categoryStats.length > 0 ? (
            <BarChart data={data.categoryStats} maxValue={maxCategory} showPercentage delay={0.3} />
          ) : (
            <EmptyPanel icon={BarChart4} title="No category data available" />
          )}
        </motion.div>

        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <PieChart className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reports by Severity</h3>
                <p className="text-[10px] text-muted-text/60">Severity level distribution</p>
              </div>
            </div>
            <span className="text-xs text-muted-text font-medium">{data.severityStats.length} levels</span>
          </div>
          {data.severityStats.length > 0 ? (
            <BarChart
              data={data.severityStats}
              maxValue={maxSeverity}
              colorFn={(id) => `bg-gradient-to-r ${getSeverityColor(id)}`}
              showPercentage
              delay={0.35}
            />
          ) : (
            <EmptyPanel icon={PieChart} title="No severity data available" />
          )}
        </motion.div>
      </div>

      {/* Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Status Overview</h3>
            <p className="text-[10px] text-muted-text/60">Current report status breakdown</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.statusStats.map((s, idx) => {
            const cfg = STATUS_CONFIG[s._id] || { icon: Activity, gradient: 'from-blue-500/20 to-indigo-500/10', label: s._id };
            const Icon = cfg.icon;
            const pct = totalFromStatus > 0 ? Math.round((s.count / totalFromStatus) * 100) : 0;
            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.08 }}
                className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${cfg.gradient} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">{cfg.label}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">
                        <AnimatedCounter value={s.count} />
                      </span>
                      <span className="text-xs text-muted-text/60 font-medium">{pct}%</span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5 + idx * 0.08 }}
                        className="h-full rounded-full bg-gradient-to-r from-white/30 to-white/10"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Row 2 - Daily, AQI, Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports per Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reports per Day</h3>
                <p className="text-[10px] text-muted-text/60">Daily report volume</p>
              </div>
            </div>
            <span className="text-xs text-muted-text font-medium">{data.reportsPerDay.length}d</span>
          </div>
          {data.reportsPerDay.length > 0 ? (
            <BarChart
              data={data.reportsPerDay}
              maxValue={maxDaily}
              colorFn={() => 'bg-gradient-to-r from-sky-500 to-indigo-500'}
              delay={0.4}
            />
          ) : (
            <EmptyPanel icon={Calendar} title="No daily data available" />
          )}
        </motion.div>

        {/* AQI Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AQI Trend</h3>
                <p className="text-[10px] text-muted-text/60">Average AQI over time</p>
              </div>
            </div>
            <span className="text-xs text-muted-text font-medium">{data.aqiTrend.length} periods</span>
          </div>
          {data.aqiTrend.length > 0 ? (
            <BarChart
              data={data.aqiTrend.map(a => ({ ...a, secondary: `${a.count} reports` }))}
              maxValue={maxAqi}
              colorFn={(id) => {
                const item = data.aqiTrend.find(a => a._id === id);
                return `bg-gradient-to-r ${item ? getAQIColor(item.avgAQI) : 'from-amber-500 to-red-500'}`;
              }}
              delay={0.45}
            />
          ) : (
            <EmptyPanel icon={TrendingUp} title="No AQI trend data available" />
          )}
        </motion.div>

        {/* Top Polluted Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Globe className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Top Polluted Locations</h3>
                <p className="text-[10px] text-muted-text/60">Most affected areas</p>
              </div>
            </div>
            <span className="text-xs text-muted-text font-medium">{data.topPollutedAreas.length} areas</span>
          </div>
          {data.topPollutedAreas.length > 0 ? (
            <BarChart
              data={data.topPollutedAreas.map(a => ({ ...a, secondary: `AQI ${Math.round(a.avgAQI)}` }))}
              maxValue={maxArea}
              colorFn={() => 'bg-gradient-to-r from-red-500 to-rose-500'}
              delay={0.5}
            />
          ) : (
            <EmptyPanel icon={Globe} title="No location data available" />
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-[10px] text-muted-text/40">
          Data refreshes automatically · Last updated {lastUpdated?.toLocaleString() || 'N/A'}
        </p>
      </motion.div>
    </div>
  );
};