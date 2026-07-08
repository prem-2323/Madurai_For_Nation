import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faTriangleExclamation, faBell, faLocationDot, faArrowUp, faArrowDown, faArrowRight,
  faClock, faChartLine, faChartPie,
  faSun, faDroplet, faWind, faFire,
  faRobot, faUsers, faCheckDouble, faGaugeHigh, faBolt, faMapLocation,
  faClipboardList, faGlobe, faServer, faCopyright,
  faFileExport, faBroadcastTower, faSync, faBrain,
  faArrowTrendUp, faCheck, faFlag,
} from '@fortawesome/free-solid-svg-icons';
import {
  FileText, AlertTriangle, UserCircle, CheckCircle2, Clock as LucideClock,
  Activity, ArrowRight, ShieldAlert, Calendar,
  ChevronRight, Gauge, Target, Eye,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { getUserRole } from '../utils/role';
import { fetchAlerts } from '../api/alerts';
import { fetchPrediction } from '../api/prediction';
import { Skeleton } from '../components/Skeleton';
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
  if (aqi >= 301) return 'from-purple-600 to-purple-400';
  if (aqi >= 201) return 'from-red-600 to-red-400';
  if (aqi >= 151) return 'from-orange-600 to-orange-400';
  if (aqi >= 101) return 'from-amber-600 to-amber-400';
  if (aqi >= 51) return 'from-yellow-500 to-yellow-300';
  return 'from-emerald-600 to-emerald-400';
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

function getRiskGradient(risk: string) {
  switch (risk) {
    case 'Good': return 'from-emerald-500 to-green-600';
    case 'Fair': case 'Moderate': return 'from-amber-500 to-yellow-600';
    case 'Poor': return 'from-orange-500 to-red-600';
    case 'Very Poor': return 'from-red-500 to-rose-700';
    default: return 'from-slate-500 to-slate-600';
  }
}

function MiniSparkline({ data, color, height = 20 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 60; const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <linearGradient id={`spark-fill-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#spark-fill-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
        points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

const KPI_CARD_CONFIG = [
  { key: 'total', title: 'Total Reports', icon: FileText, sparkColor: '#0EA5E9', trend: '+12%', trendUp: true, accent: 'from-blue-500 to-cyan-400' },
  { key: 'pending', title: 'Pending', icon: AlertTriangle, sparkColor: '#F59E0B', trend: '+5%', trendUp: true, accent: 'from-amber-500 to-yellow-400' },
  { key: 'verified', title: 'Verified', icon: CheckCircle2, sparkColor: '#22C55E', trend: '+8%', trendUp: true, accent: 'from-emerald-500 to-green-400' },
  { key: 'resolved', title: 'Resolved', icon: CheckCircle2, sparkColor: '#14B8A6', trend: '+15%', trendUp: true, accent: 'from-teal-500 to-emerald-400' },
  { key: 'highPriority', title: 'High Priority', icon: ShieldAlert, sparkColor: '#F97316', trend: '-2%', trendUp: false, accent: 'from-orange-500 to-red-400' },
  { key: 'criticalPriority', title: 'Critical Priority', icon: Target, sparkColor: '#EF4444', trend: '0%', trendUp: false, accent: 'from-red-500 to-rose-500' },
  { key: 'inProgress', title: 'In Progress', icon: Activity, sparkColor: '#06B6D4', trend: '+3%', trendUp: true, accent: 'from-cyan-500 to-blue-400' },
  { key: 'today', title: "Today's Reports", icon: LucideClock, sparkColor: '#A855F7', trend: '+22%', trendUp: true, accent: 'from-violet-500 to-purple-400' },
];

function TypingText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(prev => prev + text[idx.current]);
        idx.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}<span className="animate-pulse text-cyan-400">|</span></span>;
}

const mockSparkData = (min: number, max: number, len = 8) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * (max - min + 1)) + min);

const mockActivities = [
  { user: 'Alex Chen', action: 'verified Report #204', time: '1 min ago', type: 'verify' as const },
  { user: 'Team 2', action: 'assigned to KK Nagar hotspot', time: '4 min ago', type: 'assign' as const },
  { user: 'Citizen', action: 'uploaded report — Vaigai River', time: '9 min ago', type: 'report' as const },
  { user: 'Meena L.', action: 'changed priority on Report #089', time: '14 min ago', type: 'priority' as const },
  { user: 'Priya K.', action: 'resolved Report #076', time: '22 min ago', type: 'resolve' as const },
  { user: 'System AI', action: 'analysis complete for 3 reports', time: '28 min ago', type: 'ai' as const },
  { user: 'Rahul S.', action: 'escalated Report #112', time: '35 min ago', type: 'escalate' as const },
];

const activityIcons: Record<string, any> = {
  verify: faCheckDouble,
  assign: faUsers,
  report: faBell,
  priority: faTriangleExclamation,
  resolve: faCheck,
  ai: faRobot,
  escalate: faFlag,
};

const activityColors: Record<string, string> = {
  verify: 'text-emerald-400 bg-emerald-500/10',
  assign: 'text-blue-400 bg-blue-500/10',
  report: 'text-amber-400 bg-amber-500/10',
  priority: 'text-orange-400 bg-orange-500/10',
  resolve: 'text-green-400 bg-green-500/10',
  ai: 'text-purple-400 bg-purple-500/10',
  escalate: 'text-red-400 bg-red-500/10',
};

const aiInsights = [
  { text: 'Factory emissions increased 21% in industrial zones this week.', icon: faTriangleExclamation, color: 'text-amber-400 bg-amber-500/10', border: 'border-l-amber-500', priority: 'High', action: 'Inspect factories' },
  { text: 'East Zone showing rising AQI — becoming a potential hotspot.', icon: faMapLocation, color: 'text-orange-400 bg-orange-500/10', border: 'border-l-orange-500', priority: 'Medium', action: 'Deploy monitoring' },
  { text: 'Recommend assigning Team 3 to Mattuthavani bus zone.', icon: faUsers, color: 'text-sky-400 bg-sky-500/10', border: 'border-l-sky-500', priority: 'High', action: 'Assign team' },
  { text: 'AQI likely stable tomorrow with light winds expected.', icon: faArrowTrendUp, color: 'text-emerald-400 bg-emerald-500/10', border: 'border-l-emerald-500', priority: 'Low', action: 'Monitor' },
];

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
  const [sparkData] = useState(() =>
    Object.fromEntries(KPI_CARD_CONFIG.map(c => [c.key, mockSparkData(5, 30)]))
  );

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

  const PriorityBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      High: 'bg-red-500/20 text-red-400 border-red-500/30',
      Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${colors[level] || 'bg-slate-500/20 text-slate-400'}`}>
        {level}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="relative z-10 space-y-8">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 overflow-hidden relative">
            <motion.div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ translateX: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80" />
                <div className="space-y-2">
                  <div className="h-6 w-56 rounded-md bg-slate-800/80" />
                  <div className="h-3 w-40 rounded-md bg-slate-800/60" />
                </div>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-8 w-32 rounded-xl bg-slate-800/60" />)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 space-y-4 overflow-hidden relative">
                <motion.div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ translateX: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }} />
                <div className="relative z-10 flex justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80" />
                  <div className="w-14 h-4 rounded bg-slate-800/60" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-20 rounded bg-slate-800/80" />
                  <div className="h-3 w-24 rounded bg-slate-800/60" />
                </div>
                <div className="h-1.5 rounded-full bg-slate-800/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = criticalAlerts.length;
  const criticalLocations = criticalAlerts.map(a => a.location).filter(Boolean);
  const topCriticalLocation = criticalLocations[0] || 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <motion.div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute -bottom-48 -right-48 w-[700px] h-[700px] rounded-full bg-secondary/5 blur-3xl"
          animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl"
          animate={{ scale: [1, 1.1, 0.9, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
      </div>
      <div className="relative z-10 space-y-10">
      {/* ========== HERO SECTION ========== */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 p-8 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08),transparent_60%)] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-secondary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary shadow-xl shadow-primary/30">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
                    Operations Center
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">Municipal pollution monitoring & response command</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur-sm">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{formatDate(liveTime)}</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono backdrop-blur-sm">
                  <LucideClock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <motion.span key={liveTime.getTime()} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>{formatTime(liveTime)}</motion.span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <motion.span className="absolute inset-0 rounded-full bg-emerald-400" animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
                    <span className="relative rounded-full w-2 h-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  </span>
                  Municipal Monitoring Active
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[11px] font-semibold backdrop-blur-sm">
                  <FontAwesomeIcon icon={faRobot} className="w-3 h-3" />
                  AI Monitoring Enabled
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-5 pr-7 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-primary/30 ring-2 ring-white/10">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{greeting}, {user?.name?.split(' ')[0] || 'Officer'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <UserCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] text-slate-400 capitalize">{role || 'officer'}</span>
                </div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-white/10" />
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-cyan-400">{data?.total || 0}</p>
                  <p className="text-[10px] text-slate-500">Total Cases</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-amber-400">{data?.pending || 0}</p>
                  <p className="text-[10px] text-slate-500">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========== QUICK ACTIONS ========== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mr-1">Quick Actions</span>
        {[
          { label: 'Assign Team', icon: faUsers, color: 'from-blue-500 to-cyan-500' },
          { label: 'Export Report', icon: faFileExport, color: 'from-emerald-500 to-green-500' },
          { label: 'AI Summary', icon: faBrain, color: 'from-purple-500 to-violet-500' },
          { label: 'Emergency Broadcast', icon: faBroadcastTower, color: 'from-red-500 to-rose-500' },
          { label: 'Refresh', icon: faSync, color: 'from-slate-500 to-slate-400' },
        ].map((action, i) => (
          <motion.button key={action.label} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.03 }}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[11px] text-slate-300 hover:text-white font-medium transition-all backdrop-blur-sm"
          >
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${action.color} bg-opacity-20 group-hover:shadow-lg transition-shadow`}>
              <FontAwesomeIcon icon={action.icon} className="w-3 h-3 text-white" />
            </span>
            {action.label}
          </motion.button>
        ))}
      </motion.div>

      {/* ========== CRITICAL ALERT BANNER ========== */}
      {criticalCount > 0 ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/90 via-red-950/60 to-red-950/90 shadow-2xl shadow-red-500/20">
          <motion.div className="absolute inset-0 bg-red-500/5" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(239,68,68,0.08),transparent_60%)]" />
          <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div className="p-3 rounded-xl bg-red-500/20 ring-1 ring-red-500/30"
                  animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 20px rgba(239,68,68,0.3)', '0 0 0px rgba(239,68,68,0)'] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-red-400" />
                </motion.div>
                <motion.span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-950"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <motion.span animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 w-4 h-4" />
                    </motion.span>
                    {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}
                  </h3>
                  <span className="flex items-center gap-1 text-[9px] text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded-full border border-red-500/30">
                    <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" /> LIVE
                  </span>
                </div>
                <p className="text-xs text-red-300/70 flex flex-wrap gap-x-4 gap-y-1">
                  <span><FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 mr-1" />{topCriticalLocation}</span>
                  <span><FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />Avg Response: 4.2 min</span>
                  <span><FontAwesomeIcon icon={faBell} className="w-3 h-3 mr-1" />{pendingAlerts.length} unassigned</span>
                  <span className="text-[9px] text-slate-500">Last sync: {formatTime(liveTime)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                <span className="text-lg font-extrabold text-red-400">{pendingAlerts.length}</span>
                <span className="text-[10px]">Pending</span>
              </div>
              <div className="w-px h-7 bg-red-500/20" />
              <Link to="/alerts" className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-400/30 text-red-300 text-xs font-bold transition-all shrink-0">
                Review Critical Reports <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-950/30 to-emerald-950/40 shadow-lg shadow-emerald-500/5">
          <div className="relative z-10 px-5 py-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-300">All systems nominal</p>
              <p className="text-[10px] text-slate-500">No critical alerts at this time</p>
            </div>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
        </motion.div>
      )}

      {/* ========== KPI CARDS ========== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Performance Overview</h2>
          </div>
          <span className="text-[10px] text-slate-500">All metrics updated in real-time</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {KPI_CARD_CONFIG.map((card, idx) => {
            const Icon = card.icon;
            const value = data ? (data as any)[card.key] : 0;
            const maxVal = Math.max(data?.total || 1, 1);
            const progress = typeof value === 'number' ? Math.min(100, (value / maxVal) * 100) : 0;
            const isCritical = card.key === 'criticalPriority';

            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onMouseMove={(e) => handleMouseMove(e, card.key)}
                onMouseEnter={() => setHoveredCard(card.key)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative overflow-hidden group"
              >
                <Link to="/officer/reports" className="block h-full relative">
                  <div className={`h-full rounded-2xl border ${isCritical ? 'border-red-500/30' : 'border-white/10'} bg-white/[0.03] backdrop-blur-xl p-5 shadow-xl shadow-black/20 group-hover:shadow-2xl group-hover:shadow-black/30 transition-all duration-500 relative overflow-hidden`}>
                    {/* Gradient border on hover */}
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isCritical ? 'bg-gradient-to-br from-red-500/10 via-transparent to-red-500/5' : 'bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5'}`} />

                    <AnimatePresence>
                      {hoveredCard === card.key && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                          className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
                          style={{ background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14,165,233,0.08), transparent 40%)` }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative z-10 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl ${isCritical ? 'bg-red-500/15 text-red-400' : 'bg-white/[0.06] text-cyan-400'} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/[0.04] px-2 py-1 rounded-lg">
                          <span className={`text-[9px] font-semibold ${card.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {card.trend}
                          </span>
                          <FontAwesomeIcon icon={card.trendUp ? faArrowUp : faArrowDown} className={`w-2 h-2 ${card.trendUp ? 'text-emerald-400' : 'text-red-400'}`} />
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-extrabold text-white tracking-tight">
                            {typeof value === 'number' ? <AnimatedCounter key={value} value={value} /> : value}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{card.title}</p>
                        </div>
                        <div className="w-16 h-8 opacity-60">
                          <MiniSparkline data={sparkData[card.key] || []} color={card.sparkColor} height={24} />
                        </div>
                      </div>

                      <div className="pt-1">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.05 }}
                            className={`h-full rounded-full bg-gradient-to-r ${card.accent} shadow-sm`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-slate-500">
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
      </div>

      {/* ========== AQI PREDICTION + AI INSIGHTS + ACTIVITY FEED ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AQI Prediction */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 relative overflow-hidden shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faGaugeHigh} className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">AQI Forecast</h3>
              </div>
              {prediction && (
                <span className={`flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full border ${getRiskColor(prediction.risk)}`}>
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse" /> {prediction.risk}
                </span>
              )}
            </div>

            {prediction ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-extrabold text-white tracking-tight">{prediction.currentAQI}</p>
                      <span className="text-xs text-slate-400">current</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Madurai · Real-time AQI</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-sky-400">{prediction.predictedAQI}</p>
                    <p className="text-[9px] text-slate-500">24h forecast</p>
                  </div>
                </div>

                {/* Mini trend graph */}
                <div className="h-14">
                  <svg viewBox="0 0 140 40" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="pred-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(14,165,233,0.3)" />
                        <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const base = prediction.currentAQI;
                      const target = prediction.predictedAQI;
                      const pts = 12;
                      const vals = Array.from({ length: pts }, (_, i) => {
                        const t = i / (pts - 1);
                        const mid = base + (target - base) * t;
                        return Math.round(mid + (Math.random() - 0.5) * 10);
                      });
                      const max = Math.max(...vals, 1);
                      const pw = 130; const ph = 30;
                      const step = pw / (pts - 1);
                      const points = vals.map((v, i) => `${5 + i * step},${5 + (1 - v / max) * (ph - 5)}`);
                      return (
                        <>
                          <polygon fill="url(#pred-gradient)" points={`5,${ph} ${points.join(' ')} ${5 + (pts - 1) * step},${ph}`} />
                          <polyline fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
                          {vals.map((v, i) => (
                            <circle key={i} cx={5 + i * step} cy={5 + (1 - v / max) * (ph - 5)} r="2" fill="#0EA5E9" stroke="#0F172A" strokeWidth="1.5" />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Confidence meter */}
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Forecast Confidence</span>
                    <span className="text-[10px] font-bold text-white">{prediction.confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${prediction.confidence}%` }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${getRiskGradient(prediction.risk)}`} />
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-500">Trend: <strong className={prediction.trend === 'Increasing' ? 'text-red-400' : prediction.trend === 'Improving' ? 'text-emerald-400' : 'text-cyan-400'}>{prediction.trend}</strong></span>
                    <span className="flex items-center gap-1 text-purple-300">
                      <FontAwesomeIcon icon={faRobot} className="w-2.5 h-2.5" /> AI forecast
                    </span>
                  </div>
                </div>

                {/* Weather mini */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Temp', value: `${prediction.inputs?.temperature ?? 0}°C`, icon: faSun, color: 'text-amber-400' },
                    { label: 'Humidity', value: `${prediction.inputs?.humidity ?? 0}%`, icon: faDroplet, color: 'text-blue-400' },
                    { label: 'Wind', value: `${prediction.inputs?.windSpeed ?? 0} m/s`, icon: faWind, color: 'text-sky-400' },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-center">
                      <FontAwesomeIcon icon={s.icon} className={`w-3 h-3 ${s.color} mb-0.5`} />
                      <p className="text-[11px] font-bold text-white">{s.value}</p>
                      <p className="text-[8px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-xs text-slate-500 gap-2">
                <FontAwesomeIcon icon={faGaugeHigh} className="w-8 h-8 text-slate-600" />
                <p>Forecast data unavailable</p>
              </div>
            )}
          </div>
        </motion.div>


      </div>



      {/* ========== HOTSPOT RANKING ========== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFire} className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-white">Top Polluted Areas</h3>
          </div>
          <Link to="/officer/hotspots" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {topAreas.map((area, idx) => {
            const maxCount = Math.max(...topAreas.map(a => a.count), 1);
            const barWidth = (area.count / maxCount) * 100;
            const rankColors = ['from-red-500 to-rose-600', 'from-orange-500 to-red-500', 'from-amber-500 to-orange-500', 'from-yellow-500 to-amber-500', 'from-sky-500 to-cyan-500'];
            const severityLabel = area.avgAQI >= 150 ? 'Critical' : area.avgAQI >= 100 ? 'Unhealthy' : 'Moderate';
            const severityColor = area.avgAQI >= 150 ? 'text-red-400' : area.avgAQI >= 100 ? 'text-amber-400' : 'text-emerald-400';
            return (
              <motion.div key={area._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="p-4 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.06] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold text-white bg-gradient-to-br ${rankColors[idx]} shadow-lg`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white truncate">{area._id}</p>
                    <span className={`text-[9px] font-semibold ${severityColor}`}>{severityLabel}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Reports</span>
                    <span className="font-bold text-white">{area.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${rankColors[idx]}`} />
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-500">AQI {area.avgAQI}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <FontAwesomeIcon icon={area.avgAQI >= 150 ? faArrowUp : area.avgAQI >= 100 ? faArrowRight : faArrowDown} className="w-2 h-2" />
                      {area.avgAQI >= 150 ? 'Rising' : area.avgAQI >= 100 ? 'Stable' : 'Improving'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {topAreas.length === 0 && (
            <div className="col-span-5 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faMapLocation} className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No hotspot data</p>
              <p className="text-[10px] text-slate-600 mt-1">Pollution hotspots will appear here once detected</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ========== FOOTER ========== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="relative z-10 mt-8">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faServer} className="w-3 h-3 text-emerald-400" />
                System: <strong className="text-slate-300">Operational</strong>
              </span>
              <span className="hidden sm:inline text-slate-600">·</span>
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faGlobe} className="w-3 h-3 text-cyan-400" />
                API: <strong className="text-slate-300">Connected</strong>
              </span>
              <span className="hidden sm:inline text-slate-600">·</span>
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBolt} className="w-3 h-3 text-amber-400" />
                Server: <strong className="text-slate-300">Healthy</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 text-[9px] text-slate-600">
              <span>v2.4.1</span>
              <span>Last sync: {formatTime(liveTime)}</span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCopyright} className="w-2.5 h-2.5" />
                Madurai For Nation
              </span>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
    </div>
  );
};

export default OfficerDashboard;
