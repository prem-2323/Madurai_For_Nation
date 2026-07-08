import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faTriangleExclamation, faBell, faLocationDot, faArrowUp, faArrowDown, faArrowRight,
  faClock, faChartLine, faChartPie,
  faSun, faDroplet, faWind, faFire,
  faRobot, faUsers, faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { FileText, AlertTriangle, UserCircle, CheckCircle2, Clock as LucideClock, Activity, ArrowRight, ShieldAlert, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { getUserRole } from '../utils/role';
import { fetchAlerts } from '../api/alerts';
import { fetchPrediction } from '../api/prediction';
import { SkeletonCard } from '../components/Skeleton';
import { AnimatedCounter } from '../components/AnimatedCounter';
import type { AlertData, AQIPrediction } from '../types';

interface OfficerDashboardProps {
  user?: any;
  token?: string | null;
}

interface DashboardData {
  total: number;
  pending: number;
  verified: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  criticalPriority: number;
  today: number;
}

interface AnalyticsData {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  inProgressReports: number;
  reportsThisWeek: number;
  averageAQI: number;
  categoryStats: { _id: string; count: number }[];
  reportsPerDay: { _id: string; count: number }[];
  aqiTrend: { _id: string; avgAQI: number; count: number }[];
  severityStats: { _id: string; count: number }[];
  topPollutedAreas: { _id: string; count: number; avgAQI: number }[];
}

const KPI_CARD_CONFIG = [
  { key: 'total', title: 'Total Reports', icon: FileText, gradient: 'from-blue-500/20 to-cyan-500/5', iconBg: 'bg-blue-500/20 text-blue-400', trend: '+12%', progressColor: 'bg-blue-500' },
  { key: 'pending', title: 'Pending', icon: AlertTriangle, gradient: 'from-amber-500/20 to-yellow-500/5', iconBg: 'bg-amber-500/20 text-amber-400', trend: '+5%', progressColor: 'bg-amber-500' },
  { key: 'verified', title: 'Verified', icon: CheckCircle2, gradient: 'from-emerald-500/20 to-green-500/5', iconBg: 'bg-emerald-500/20 text-emerald-400', trend: '+8%', progressColor: 'bg-emerald-500' },
  { key: 'inProgress', title: 'In Progress', icon: Activity, gradient: 'from-sky-500/20 to-blue-500/5', iconBg: 'bg-sky-500/20 text-sky-400', trend: '+3%', progressColor: 'bg-sky-500' },
  { key: 'resolved', title: 'Resolved', icon: CheckCircle2, gradient: 'from-green-500/20 to-teal-500/5', iconBg: 'bg-green-500/20 text-green-400', trend: '+15%', progressColor: 'bg-green-500' },
  { key: 'highPriority', title: 'High Priority', icon: AlertTriangle, gradient: 'from-orange-500/20 to-red-500/5', iconBg: 'bg-orange-500/20 text-orange-400', trend: '-2%', progressColor: 'bg-orange-500' },
  { key: 'criticalPriority', title: 'Critical Priority', icon: ShieldAlert, gradient: 'from-red-500/20 to-rose-500/5', iconBg: 'bg-red-500/20 text-red-400', trend: '0%', progressColor: 'bg-red-500' },
  { key: 'today', title: "Today's Reports", icon: LucideClock, gradient: 'from-violet-500/20 to-purple-500/5', iconBg: 'bg-violet-500/20 text-violet-400', trend: '+22%', progressColor: 'bg-violet-500' },
];

function getSeverityColor(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'text-red-400 bg-red-500/15 border-red-500/30';
    case 'high': return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    case 'moderate': case 'medium': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'low': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    default: return 'text-slate-400 bg-slate-500/15 border-slate-500/30';
  }
}

function getAQIColor(aqi: number) {
  if (aqi >= 301) return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
  if (aqi >= 201) return 'text-red-400 bg-red-500/15 border-red-500/30';
  if (aqi >= 151) return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
  if (aqi >= 101) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
  if (aqi >= 51) return 'text-yellow-300 bg-yellow-400/15 border-yellow-300/30';
  return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'Increasing': return faArrowUp;
    case 'Improving': return faArrowDown;
    default: return faArrowRight;
  }
}

function getTrendColor(trend: string) {
  switch (trend) {
    case 'Increasing': return 'text-red-400';
    case 'Improving': return 'text-emerald-400';
    default: return 'text-sky-400';
  }
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'Good': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    case 'Fair': case 'Moderate': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'Poor': return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    case 'Very Poor': return 'text-red-400 bg-red-500/15 border-red-500/30';
    default: return 'text-slate-400 bg-slate-500/15 border-slate-500/30';
  }
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 60; const h = 20;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-5">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ user, token }) => {
  const role = getUserRole(user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveTime, setLiveTime] = useState(new Date());
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  const [prediction, setPrediction] = useState<AQIPrediction | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/officer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard stats');
    }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/officer/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch { }
  }, [token]);

  useEffect(() => {
    Promise.all([
      fetchDashboard(),
      fetchAlerts(token).then(setAlerts).catch(() => {}),

      fetchPrediction().then(setPrediction).catch(() => {}),
      fetchAnalytics(),
    ]).finally(() => setLoading(false));
  }, [token, fetchDashboard, fetchAnalytics]);

  const criticalAlerts = alerts.filter(a => a.priority === 'Critical');
  const pendingAlerts = alerts.filter(a => a.status === 'Pending');


  const reportsTrend = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = analytics?.reportsPerDay?.find(r => r._id === key);
      days.push({ date: key, count: found?.count || 0 });
    }
    return days;
  }, [analytics]);

  const severityData = useMemo(() => {
    const stats = analytics?.severityStats || [];
    const total = stats.reduce((s, x) => s + x.count, 0) || 1;
    const colors: Record<string, string> = { 'critical': '#EF4444', 'high': '#F97316', 'moderate': '#F59E0B', 'medium': '#F59E0B', 'low': '#22C55E', 'pending': '#94A3B8' };
    return stats.map(s => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      val: s.count,
      pct: Math.round((s.count / total) * 100),
      color: colors[s._id.toLowerCase()] || '#64748B',
    }));
  }, [analytics]);

  const topAreas = useMemo(() => {
    const areas = analytics?.topPollutedAreas || [];
    if (areas.length === 0) {
      return [
        { _id: 'Simmakkal', count: 18, avgAQI: 156 },
        { _id: 'Mattuthavani', count: 14, avgAQI: 134 },
        { _id: 'KK Nagar', count: 11, avgAQI: 142 },
        { _id: 'Anna Nagar', count: 9, avgAQI: 118 },
        { _id: 'Goripalayam', count: 7, avgAQI: 98 },
      ];
    }
    return areas.slice(0, 5);
  }, [analytics]);

  const handleMouseMove = (e: React.MouseEvent, key: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const greeting = useMemo(() => {
    const h = liveTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [liveTime]);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-32 rounded-2xl bg-slate-900/50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const criticalCount = criticalAlerts.length;
  const criticalLocations = criticalAlerts.map(a => a.location).filter(Boolean);
  const topCriticalLocation = criticalLocations[0] || 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <motion.div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl"
          animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl"
          animate={{ scale: [1, 1.1, 0.9, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
      </div>
      <div className="relative z-10 space-y-8">
      {/* ========== HERO SECTION ========== */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-8">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.06),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
                <FontAwesomeIcon icon={faShieldHalved} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">Operations Center</h1>
                <p className="text-sm text-muted-text">Municipal pollution monitoring & response command</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-xs text-muted-text">
                <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span>{formatDate(liveTime)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-xs text-muted-text font-mono">
                <LucideClock className="w-3.5 h-3.5 text-secondary shrink-0" />
                <motion.span key={liveTime.getTime()} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>{formatTime(liveTime)}</motion.span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <motion.span className="absolute inset-0 rounded-full bg-emerald-400" animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
                </span>
                Municipal Monitoring Active
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                <FontAwesomeIcon icon={faRobot} className="w-3 h-3" />
                AI Monitoring Enabled
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/50 rounded-2xl border border-white/5 p-4 pr-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white shadow-lg">
              {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{greeting}, {user?.name?.split(' ')[0] || 'Officer'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <UserCircle className="w-3.5 h-3.5 text-secondary" />
                <span className="text-[10px] text-muted-text capitalize">{role || 'officer'}</span>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-white/5" />
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div className="text-center">
                <p className="text-lg font-extrabold text-secondary">{data?.total || 0}</p>
                <p className="text-[10px] text-muted-text">Total Cases</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-amber-400">{data?.pending || 0}</p>
                <p className="text-[10px] text-muted-text">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========== CRITICAL ALERT BANNER ========== */}
      {criticalCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/80 via-red-950/50 to-red-950/80 shadow-lg shadow-red-500/10">
          <motion.div className="absolute inset-0 bg-red-500/5" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
          <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-red-500/20">
                  <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-red-400" />
                </div>
                <motion.span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <motion.span animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 w-4 h-4" />
                  </motion.span>
                  {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-red-300/70 mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                  <span><FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 mr-1" />{topCriticalLocation}</span>
                  <span><FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />Avg Response: 4.2 min</span>
                  <span><FontAwesomeIcon icon={faBell} className="w-3 h-3 mr-1" />{pendingAlerts.length} unassigned</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1 text-xs text-red-300">
                <span className="text-lg font-extrabold text-red-400">{pendingAlerts.length}</span>
                <span className="text-[10px]">Pending</span>
              </div>
              <div className="w-px h-6 bg-red-500/20" />
              <Link to="/alerts" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 text-xs font-bold transition-all shrink-0">
                Review Critical Reports <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========== KPI CARDS ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {KPI_CARD_CONFIG.map((card) => {
          const Icon = card.icon;
          const value = data ? (data as any)[card.key] : 0;
          const maxVal = Math.max(data?.total || 1, 1);
          const progress = typeof value === 'number' ? Math.min(100, (value / maxVal) * 100) : 0;
          const isCritical = card.key === 'criticalPriority';
          const isHigh = card.key === 'highPriority';

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onMouseMove={(e) => handleMouseMove(e, card.key)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative overflow-hidden"
            >
              <Link to="/officer/reports" className="block h-full relative">
                <div className={`h-full rounded-2xl border ${isCritical ? 'border-red-500/30' : 'border-white/5'} bg-gradient-to-br ${card.gradient} p-5 backdrop-blur-sm shadow-lg group transition-all duration-300`}>
                  <AnimatePresence>
                    {hoveredCard === card.key && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                        className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
                        style={{ background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14,165,233,0.08), transparent 40%)` }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold ${card.key === 'highPriority' || card.key === 'criticalPriority' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {card.trend}
                        </span>
                        <FontAwesomeIcon icon={card.key === 'highPriority' || card.key === 'criticalPriority' ? faArrowUp : faArrowUp} className={`w-2.5 h-2.5 ${card.key === 'highPriority' || card.key === 'criticalPriority' ? 'text-red-400' : 'text-emerald-400'}`} />
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-extrabold text-white">
                        {typeof value === 'number' ? <AnimatedCounter key={value} value={value} /> : value}
                      </p>
                      <p className="text-xs text-muted-text mt-0.5 font-medium">{card.title}</p>
                    </div>

                    <div className="pt-2">
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${card.progressColor}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-muted-text">
                      <LucideClock className="w-2.5 h-2.5" />
                      <span>Updated {formatTime(liveTime)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ========== ANALYTICS CHARTS ========== */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reports Trend (Line Chart) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 rounded-2xl border border-white/5 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-bold text-white">Reports Trend</h3>
              </div>
              <span className="text-[10px] text-muted-text">Last 7 days</span>
            </div>
            <div className="h-48">
              <svg viewBox="0 0 280 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="trend-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(14,165,233,0.3)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                  </linearGradient>
                </defs>
                {(() => {
                  const vals = reportsTrend.map(d => d.count);
                  const max = Math.max(...vals, 1);
                  const w = 260; const h = 80; const pts = 6;
                  const step = w / pts;
                  const points = vals.map((v, i) => `${10 + i * step},${10 + (1 - v / max) * (h - 10)}`);
                  const areaPts = [...points, `${10 + pts * step},${h}`, `10,${h}`].join(' ');
                  return (
                    <>
                      <polygon fill="url(#trend-gradient)" points={areaPts} />
                      <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeInOut' }}
                        fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
                      {vals.map((v, i) => (
                        <motion.circle key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 + i * 0.1 }}
                          cx={10 + i * step} cy={10 + (1 - v / max) * (h - 10)} r="3.5" fill="#0EA5E9" stroke="#0F172A" strokeWidth="2" />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-muted-text">
              {reportsTrend.map((d, i) => (
                <span key={i}>{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              ))}
            </div>
          </motion.div>

          {/* Severity Distribution (Donut) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5 rounded-2xl border border-white/5 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faChartPie} className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-bold text-white">Severity Distribution</h3>
              </div>
              <span className="text-[10px] text-muted-text">{severityData.reduce((s, x) => s + x.val, 0)} total</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                  {(() => {
                    let acc = 0;
                    return severityData.map((item, idx) => {
                      const offset = 100 - acc;
                      const dash = `${item.pct} ${100 - item.pct}`;
                      acc += item.pct;
                      return (
                        <motion.circle key={item.name} cx="50" cy="50" r="38" fill="transparent"
                          stroke={item.color} strokeWidth="10" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round"
                          initial={{ strokeDasharray: '0 100' }} animate={{ strokeDasharray: dash }} transition={{ duration: 1, delay: 0.3 + idx * 0.1 }}
                          className="hover:stroke-[12] transition-all cursor-default" />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white">{data?.total || 0}</span>
                  <span className="text-[9px] text-muted-text uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="space-y-2">
                {severityData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <span className="text-[11px] font-semibold text-white">{item.name}</span>
                      <span className="text-[9px] text-muted-text ml-1.5">{item.val} ({item.pct}%)</span>
                    </div>
                  </div>
                ))}
                {severityData.length === 0 && <span className="text-xs text-muted-text">No severity data</span>}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========== WEATHER/AQI + HOTSPOT RANKING ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weather & AQI Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-5 rounded-2xl border border-white/5 bg-gradient-to-br from-sky-950/60 to-slate-900/70 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSun} className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Weather & AQI</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>

            {prediction ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-extrabold text-white">{prediction.currentAQI}</p>
                    <p className="text-xs text-muted-text mt-0.5">Current AQI · Madurai</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getRiskColor(prediction.risk)}`}>
                    {prediction.risk}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Temperature', value: `${prediction.inputs?.temperature ?? 0}°C`, icon: faSun, color: 'text-amber-400' },
                    { label: 'Humidity', value: `${prediction.inputs?.humidity ?? 0}%`, icon: faDroplet, color: 'text-blue-400' },
                    { label: 'Wind Speed', value: `${prediction.inputs?.windSpeed ?? 0} m/s`, icon: faWind, color: 'text-sky-400' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                      <FontAwesomeIcon icon={s.icon} className={`w-4 h-4 ${s.color} mb-1`} />
                      <p className="text-xs font-bold text-white">{s.value}</p>
                      <p className="text-[9px] text-muted-text">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-text">
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-secondary" />
                  <span>24h forecast: <strong className="text-white">{prediction.predictedAQI}</strong> AQI · {prediction.trend} trend</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-xs text-muted-text">Weather data unavailable</div>
            )}
          </div>
        </motion.div>

        {/* Hotspot Ranking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-7 rounded-2xl border border-white/5 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFire} className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white">Top Polluted Areas</h3>
            </div>
            <Link to="/officer/hotspots" className="text-[10px] text-secondary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {topAreas.map((area, idx) => {
              const maxCount = Math.max(...topAreas.map(a => a.count), 1);
              const barWidth = (area.count / maxCount) * 100;
              const colors = ['from-red-500 to-red-600', 'from-orange-500 to-orange-600', 'from-amber-500 to-amber-600', 'from-yellow-500 to-yellow-600', 'from-sky-500 to-sky-600'];
              return (
                <motion.div key={area._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors group"
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br ${colors[idx]} shrink-0`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-white truncate">{area._id}</span>
                      <span className="text-xs font-bold text-white tabular-nums">{area.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${colors[idx]}`}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-text">AQI {area.avgAQI}</span>
                      <span className={`text-[9px] font-semibold ${area.avgAQI >= 150 ? 'text-red-400' : area.avgAQI >= 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {area.avgAQI >= 150 ? 'Critical' : area.avgAQI >= 100 ? 'Unhealthy' : 'Moderate'}
                      </span>
                    </div>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-muted-text opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.div>
              );
            })}
            {topAreas.length === 0 && <div className="text-xs text-muted-text text-center py-8">No hotspot data available</div>}
          </div>
        </motion.div>
      </div>
    </div>
    </div>
  );
};

export default OfficerDashboard;
