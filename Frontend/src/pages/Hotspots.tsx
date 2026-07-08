import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Circle, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import {
  Flame,
  ShieldAlert,
  Globe,
  BarChart3,
  MapPin,
  CheckCircle2,
  Clock,
  UserCheck,
  Eye,
  Target,
  AlertTriangle,
  Gauge,
  Building2,
  Calendar,
  ArrowRight,
  RefreshCw,
  Info,
  ClipboardList,
  X,
  Wind,
  Settings2,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PollutionHotspot, MunicipalStatus } from '../types';
import { getPublicStatusInfo, STATUS_STAGES, getStageIndex } from '../utils/municipalStatus';
import { fetchHotspots, updateHotspotStatus } from '../api/hotspots';
import { fetchPrediction } from '../api/prediction';
import { formatHotspotTimestamp } from '../utils/hotspotTransform';
import { API_BASE_URL } from '../api/analyze';
import { Modal, EmptyState } from '../components/Common';
import { MunicipalResponseModal } from '../components/MunicipalResponseModal';
import { SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';

const MADURAI_CENTER: [number, number] = [9.9252, 78.1198];
const DEFAULT_ZOOM = 12;

const SEVERITY_COLORS = {
  Low: { fill: '#22c55e', border: '#16a34a', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25', stripe: 'from-emerald-500 to-green-500' },
  Medium: { fill: '#eab308', border: '#ca8a04', bg: 'bg-amber-500/15 text-amber-300 border-amber-400/25', stripe: 'from-amber-500 to-yellow-500' },
  High: { fill: '#f97316', border: '#ea580c', bg: 'bg-orange-500/15 text-orange-300 border-orange-400/25', stripe: 'from-orange-500 to-amber-600' },
  Critical: { fill: '#ef4444', border: '#dc2626', bg: 'bg-red-500/15 text-red-300 border-red-400/25', stripe: 'from-red-500 to-rose-600' },
};

const MADURAI_AREAS: Record<string, { lat: number; lng: number }> = {
  'SIDCO Industrial Estate': { lat: 9.9123, lng: 78.1145 },
  'Vaigai River Bank': { lat: 9.8956, lng: 78.1289 },
  'Mattuthavani Bus Stand': { lat: 9.9198, lng: 78.1195 },
  'KK Nagar Construction Zone': { lat: 9.9345, lng: 78.1056 },
  'Vandiyur Lake': { lat: 9.9412, lng: 78.1312 },
  'Meenakshi Amman Temple Area': { lat: 9.9252, lng: 78.1198 },
};

interface HotspotsPageProps {
  token?: string | null;
  user?: any;
}

function resolveImgUrl(image: string): string {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${API_BASE_URL.replace(/\/+$/, '')}/${image.replace(/^\//, '')}`;
}

function getRiskStyle(risk: string) {
  return SEVERITY_COLORS[risk as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.Low;
}

function getHotspotName(hotspot: PollutionHotspot): string {
  if (hotspot.location) return hotspot.location;
  let closest = 'Hotspot';
  let minDist = Infinity;
  Object.entries(MADURAI_AREAS).forEach(([name, coord]) => {
    const dist = Math.sqrt((hotspot.center.lat - coord.lat) ** 2 + (hotspot.center.lng - coord.lng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  });
  return minDist < 0.03 ? closest : `Zone (${hotspot.center.lat.toFixed(3)}, ${hotspot.center.lng.toFixed(3)})`;
}

function getMunicipalStatus(hotspot: PollutionHotspot): MunicipalStatus {
  const s = hotspot.municipalStatus as MunicipalStatus | undefined;
  if (s && STATUS_STAGES.some((stage) => stage.key === s)) return s;
  return 'pending';
}

function MapController({ flyTo }: { flyTo: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTo) return;
    map.flyTo(flyTo, 14, { duration: 0.8 });
  }, [map, flyTo]);
  return null;
}

function HotspotDetailPanel({
  hotspot,
  isOfficer,
  predictionAqi,
  onClose,
  onFlyTo,
  onManage,
  onOpenFullDetail,
}: {
  hotspot: PollutionHotspot;
  isOfficer: boolean;
  predictionAqi?: number;
  onClose: () => void;
  onFlyTo: () => void;
  onManage: () => void;
  onOpenFullDetail: () => void;
}) {
  const colors = getRiskStyle(hotspot.risk);
  const municipal = getMunicipalStatus(hotspot);
  const statusInfo = getPublicStatusInfo(municipal);
  const stageIdx = getStageIndex(municipal);
  const name = getHotspotName(hotspot);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full xl:w-[300px] bg-slate-900 border-l border-white/5 flex flex-col shrink-0 overflow-hidden max-h-[380px] xl:max-h-none"
    >
      <div className={`h-1 bg-gradient-to-r ${colors.stripe}`} />
      <div className="p-3 border-b border-white/5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 shrink-0" style={{ color: colors.fill }} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg}`}>{hotspot.risk}</span>
          </div>
          <h3 className="text-sm font-bold text-white leading-snug">{name}</h3>
          <p className="text-[10px] text-muted-text mt-0.5">{formatHotspotTimestamp(hotspot.createdAt)}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-text hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="rounded-lg border border-white/5 bg-slate-950/60 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
            <span className="text-[10px] text-muted-text">{statusInfo.progressPercent}%</span>
          </div>
          <div className="flex gap-1">
            {STATUS_STAGES.map((stage, i) => (
              <div key={stage.key} className={`h-1.5 flex-1 rounded-full ${i <= stageIdx ? stage.dotColor : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Reports', value: hotspot.reportCount, icon: BarChart3 },
            { label: 'Avg AQI', value: hotspot.averageAQI, icon: Gauge },
            { label: 'Conf.', value: `${hotspot.averageConfidence}%`, icon: Target },
            { label: 'Radius', value: `${Math.round(hotspot.radius)}m`, icon: MapPin },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-white/5 bg-slate-950/60 p-2">
              <div className="flex items-center gap-1 text-muted-text mb-0.5">
                <Icon className="w-2.5 h-2.5" />
                <span className="text-[8px] uppercase font-bold tracking-wider">{label}</span>
              </div>
              <p className="text-sm font-extrabold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-white/5 bg-slate-950/60 p-2.5 space-y-0.5">
          <span className="text-[8px] uppercase font-bold text-muted-text tracking-wider">Dominant Pollution</span>
          <p className="text-xs font-semibold text-white line-clamp-1">{hotspot.dominantPollution}</p>
        </div>

        {predictionAqi && (
          <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-2 text-[10px]">
            <Globe className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="text-muted-text">
              24h AQI: <strong className="text-white">{predictionAqi}</strong>
            </span>
          </div>
        )}

        <div className="rounded-lg border border-white/5 bg-slate-950/60 p-2.5">
          <span className="text-[8px] uppercase font-bold text-muted-text tracking-wider block mb-1">Action</span>
          <p className="text-[10px] text-white leading-relaxed line-clamp-3">{hotspot.recommendedAction}</p>
        </div>

        {hotspot.assignedTeam && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[10px]">
            <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>
              Team: <strong className="text-emerald-300">{hotspot.assignedTeam}</strong>
            </span>
          </div>
        )}

        {hotspot.sourceReportData && hotspot.sourceReportData.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {hotspot.sourceReportData.slice(0, 4).map((src) => (
              <div key={src._id} className="w-12 h-12 rounded-md overflow-hidden shrink-0 border border-white/10 bg-slate-800">
                {src.image ? (
                  <img src={resolveImgUrl(src.image)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faCamera} className="w-3 h-3 text-muted-text" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5 space-y-1.5 bg-slate-950/40">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onFlyTo}
            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/25 text-[10px] font-semibold text-secondary transition-all"
          >
            <Eye className="w-3 h-3" /> Map
          </button>
          <button
            onClick={onOpenFullDetail}
            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 text-[10px] font-semibold text-white transition-all"
          >
            <Info className="w-3 h-3" /> Details
          </button>
        </div>
        {isOfficer && (
          <button
            onClick={onManage}
            className="col-span-2 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/25 text-[10px] font-semibold text-primary transition-all"
          >
            <Settings2 className="w-3 h-3" /> Manage Municipal Response
          </button>
        )}
      </div>
    </motion.div>
  );
}

export const HotspotsPage: React.FC<HotspotsPageProps> = ({ token, user }) => {
  const [hotspots, setHotspots] = useState<PollutionHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<PollutionHotspot | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [manageHotspot, setManageHotspot] = useState<PollutionHotspot | null>(null);
  const [manageSaving, setManageSaving] = useState(false);
  const [detailModal, setDetailModal] = useState<PollutionHotspot | null>(null);
  const [predictionAqi, setPredictionAqi] = useState<number | null>(null);

  const isOfficer = user?.role === 'officer';

  const loadHotspots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHotspots(token, isOfficer);
      setHotspots(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load hotspots';
      setError(msg);
      toast.error(msg, { id: 'hotspots-fetch' });
    } finally {
      setLoading(false);
    }
  }, [token, isOfficer]);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  useEffect(() => {
    fetchPrediction()
      .then((p) => setPredictionAqi(p.predictedAQI))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const active = hotspots.length;
    const critical = hotspots.filter((h) => h.risk === 'Critical').length;
    const highRisk = hotspots.filter((h) => h.risk === 'High').length;
    const totalReports = hotspots.reduce((s, h) => s + h.reportCount, 0);
    const avgAqi = active ? Math.round(hotspots.reduce((s, h) => s + h.averageAQI, 0) / active) : 0;
    const unresolved = hotspots.filter((h) => getMunicipalStatus(h) !== 'resolved').length;
    return { active, critical, highRisk, avgAqi, totalReports, unresolved };
  }, [hotspots]);

  const sortedHotspots = useMemo(() => {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return [...hotspots].sort((a, b) => rank[b.risk] - rank[a.risk] || b.reportCount - a.reportCount);
  }, [hotspots]);

  const filteredSidebar = useMemo(() => {
    return sortedHotspots.filter((h) => {
      const q = sidebarSearch.toLowerCase();
      const name = getHotspotName(h).toLowerCase();
      const matchesSearch =
        !q || name.includes(q) || h.dominantPollution.toLowerCase().includes(q) || h.risk.toLowerCase().includes(q);
      const matchesRisk = riskFilter === 'All' || h.risk === riskFilter;
      const municipal = getMunicipalStatus(h);
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Pending' && municipal === 'pending') ||
        (statusFilter === 'Active' && ['under_review', 'team_assigned', 'in_progress'].includes(municipal)) ||
        (statusFilter === 'Resolved' && municipal === 'resolved');
      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [sortedHotspots, sidebarSearch, riskFilter, statusFilter]);

  const selectHotspot = (hotspot: PollutionHotspot) => {
    setSelectedHotspot(hotspot);
    setFlyTo([hotspot.center.lat, hotspot.center.lng]);
  };

  const handleManageHotspot = (hotspot: PollutionHotspot) => {
    setSelectedHotspot(hotspot);
    setManageHotspot(hotspot);
  };

  const handleSaveHotspotManage = async (data: {
    municipalStatus: string;
    assignedOfficerName: string;
    assignedTeam: string;
  }) => {
    if (!manageHotspot) return;
    setManageSaving(true);
    try {
      const updated = await updateHotspotStatus(
        manageHotspot.id,
        {
          municipalStatus: data.municipalStatus || undefined,
          assignedOfficerName: data.assignedOfficerName || undefined,
          assignedTeam: data.assignedTeam || undefined,
        },
        token
      );
      setHotspots((prev) => prev.map((h) => (h.id === manageHotspot.id ? updated : h)));
      if (selectedHotspot?.id === manageHotspot.id) setSelectedHotspot(updated);
      toast.success('Municipal response updated');
      setManageHotspot(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update hotspot');
    } finally {
      setManageSaving(false);
    }
  };

  const kpiCards = [
    { label: 'Active Hotspots', value: stats.active, icon: Flame, color: 'text-red-400', bg: 'from-red-500/20 to-orange-500/5' },
    { label: 'Critical', value: stats.critical, icon: ShieldAlert, color: 'text-red-400', bg: 'from-red-600/25 to-rose-500/5' },
    { label: 'High Risk', value: stats.highRisk, icon: AlertTriangle, color: 'text-orange-400', bg: 'from-orange-500/20 to-amber-500/5' },
    { label: 'Avg AQI', value: stats.avgAqi || '—', icon: Wind, color: 'text-sky-400', bg: 'from-sky-500/20 to-cyan-500/5' },
    { label: 'Reports Clustered', value: stats.totalReports, icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/20 to-indigo-500/5' },
    ...(isOfficer
      ? [{ label: 'Needs Action', value: stats.unresolved, icon: Clock, color: 'text-amber-400', bg: 'from-amber-500/20 to-yellow-500/5' }]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            {isOfficer ? 'Municipal Intelligence' : 'Citizen View'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-7 h-7 text-red-400 shrink-0" />
            Hotspot Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted-text max-w-xl">
            Pollution clusters detected across Madurai from grouped citizen reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadHotspots}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isOfficer && (
            <Link
              to="/officer/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/25 text-xs font-semibold text-secondary transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              All Reports
            </Link>
          )}
        </div>
      </div>

      {/* Critical alert banner */}
      {stats.critical > 0 && isOfficer && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30"
        >
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-300">
              {stats.critical} critical hotspot{stats.critical > 1 ? 's' : ''} require immediate action
            </p>
            <p className="text-xs text-red-400/80 mt-0.5">Assign response teams and advance municipal status promptly.</p>
          </div>
          <button
            onClick={() => {
              const critical = sortedHotspots.find((h) => h.risk === 'Critical');
              if (critical) selectHotspot(critical);
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            View First
          </button>
        </motion.div>
      )}

      {/* KPI Strip — compact */}
      <div className={`grid grid-cols-3 sm:grid-cols-3 ${isOfficer ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-2`}>
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-xl border border-white/5 bg-gradient-to-br ${card.bg} px-3 py-2.5`}
          >
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-[9px] uppercase font-bold text-muted-text tracking-wider leading-none">{card.label}</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{card.value}</p>
              </div>
              <card.icon className={`w-4 h-4 ${card.color} shrink-0 opacity-80`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map Workspace — reduced height */}
      <div className="flex flex-col xl:flex-row h-[320px] sm:h-[360px] xl:h-[380px] rounded-2xl overflow-hidden border border-white/5 bg-slate-950 shadow-xl">
        {/* Sidebar */}
        <div className="w-full xl:w-60 bg-slate-900 border-b xl:border-b-0 xl:border-r border-white/5 flex flex-col shrink-0 z-10 max-h-[180px] xl:max-h-none">
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary" />
                Hotspots
              </h3>
              <span className="text-[10px] font-mono text-muted-text bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                {filteredSidebar.length}
              </span>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search zones..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-lg text-xs text-white placeholder-muted-text outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                    riskFilter === r ? 'bg-secondary/15 text-secondary border-secondary/30' : 'bg-slate-950 text-muted-text border-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {isOfficer && (
              <div className="flex flex-wrap gap-1">
                {['All', 'Pending', 'Active', 'Resolved'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                      statusFilter === s ? 'bg-primary/15 text-primary border-primary/30' : 'bg-slate-950 text-muted-text border-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredSidebar.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-text">No hotspots match filters</div>
            ) : (
              filteredSidebar.map((hotspot) => {
                const colors = getRiskStyle(hotspot.risk);
                const name = getHotspotName(hotspot);
                const isSelected = selectedHotspot?.id === hotspot.id;
                const municipal = getMunicipalStatus(hotspot);
                const stageIdx = getStageIndex(municipal);

                return (
                  <button
                    key={hotspot.id}
                    onClick={() => selectHotspot(hotspot)}
                    className={`w-full text-left p-3 border-b border-white/5 transition-all ${
                      isSelected ? 'bg-secondary/10 border-l-2 border-l-secondary' : 'hover:bg-slate-800/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 shrink-0" style={{ color: colors.fill }} />
                        {name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${colors.bg}`}>
                        {hotspot.risk}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-text mb-2">
                      <span>{hotspot.reportCount} reports</span>
                      <span>AQI {hotspot.averageAQI}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {STATUS_STAGES.map((stage, i) => (
                        <div key={stage.key} className={`h-1 flex-1 rounded-full ${i <= stageIdx ? stage.dotColor : 'bg-slate-800'}`} />
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="hidden xl:block p-2 border-t border-white/5 bg-slate-950/60">
            <p className="text-[9px] text-muted-text text-center">Click a zone to inspect · Map zooms automatically</p>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[160px]">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
              {error}
            </div>
          )}
          <MapContainer center={MADURAI_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hotspots.map((hotspot) => {
              const colors = SEVERITY_COLORS[hotspot.risk as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.Low;
              const isSelected = selectedHotspot?.id === hotspot.id;
              return (
                <Circle
                  key={hotspot.id}
                  center={[hotspot.center.lat, hotspot.center.lng]}
                  radius={hotspot.radius}
                  pathOptions={{
                    color: colors.border,
                    fillColor: colors.fill,
                    fillOpacity: isSelected ? 0.4 : 0.22,
                    opacity: isSelected ? 1 : 0.75,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{ click: () => selectHotspot(hotspot) }}
                >
                  <Popup>
                    <div className="min-w-[220px] text-slate-900 space-y-2">
                      <h4 className="font-bold text-sm">{getHotspotName(hotspot)}</h4>
                      <p className="text-xs">
                        {hotspot.reportCount} reports · AQI {hotspot.averageAQI} · {hotspot.risk}
                      </p>
                      <p className="text-[11px] text-slate-600">{hotspot.dominantPollution}</p>
                    </div>
                  </Popup>
                </Circle>
              );
            })}
            <MapController flyTo={flyTo} />
          </MapContainer>

          {hotspots.length === 0 && !loading && !error && (
            <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-10 pointer-events-none">
              <EmptyState
                title="No Hotspots Yet"
                description="Hotspots appear when 3+ pollution reports cluster within the detection radius."
                icon={<Flame className="w-8 h-8" />}
              />
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/5 text-[9px] px-2 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md text-muted-text z-10 pointer-events-none">
            {(['Low', 'Medium', 'High', 'Critical'] as const).map((r) => (
              <div key={r} className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[r].fill }} />
                {r === 'Medium' ? 'Med' : r === 'Critical' ? 'Crit' : r}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel (officer + selected) */}
        <AnimatePresence>
          {isOfficer && selectedHotspot && (
            <HotspotDetailPanel
              hotspot={selectedHotspot}
              isOfficer={isOfficer}
              predictionAqi={predictionAqi ?? undefined}
              onClose={() => setSelectedHotspot(null)}
              onFlyTo={() => setFlyTo([selectedHotspot.center.lat, selectedHotspot.center.lng])}
              onManage={() => handleManageHotspot(selectedHotspot)}
              onOpenFullDetail={() => setDetailModal(selectedHotspot)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Hotspot cards — always visible below map */}
      {!loading && sortedHotspots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-secondary" />
              {isOfficer ? 'Hotspot Zones' : 'Overview'}
            </h2>
            <span className="text-[10px] text-muted-text">{sortedHotspots.length} detected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedHotspots.map((hotspot, index) => {
              const colors = getRiskStyle(hotspot.risk);
              const municipal = getMunicipalStatus(hotspot);
              const statusInfo = getPublicStatusInfo(municipal);
              const isSelected = selectedHotspot?.id === hotspot.id;
              return (
                <motion.div
                  key={hotspot.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => selectHotspot(hotspot)}
                  className={`rounded-xl border overflow-hidden cursor-pointer transition-all group ${
                    isSelected
                      ? 'border-secondary/50 bg-secondary/5 ring-1 ring-secondary/30'
                      : 'border-white/5 bg-slate-900/60 hover:border-white/10'
                  }`}
                >
                  <div className={`h-0.5 bg-gradient-to-r ${colors.stripe}`} />
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate">{getHotspotName(hotspot)}</h3>
                        <p className="text-[9px] text-muted-text">{hotspot.reportCount} reports · AQI {hotspot.averageAQI}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${colors.bg}`}>{hotspot.risk}</span>
                    </div>
                    <p className="text-[10px] text-muted-text line-clamp-1">{hotspot.dominantPollution}</p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <span className={`text-[9px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                      <span className="text-[9px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        Inspect <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <MunicipalResponseModal
        isOpen={!!manageHotspot}
        onClose={() => setManageHotspot(null)}
        onSave={handleSaveHotspotManage}
        saving={manageSaving}
        initialStatus={manageHotspot ? getMunicipalStatus(manageHotspot) : 'pending'}
        initialOfficer={manageHotspot?.assignedOfficerName || ''}
        initialTeam={manageHotspot?.assignedTeam || ''}
      />

      {/* Full Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal ? getHotspotName(detailModal) : 'Hotspot Details'}
        footer={
          <button onClick={() => setDetailModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold">
            Close
          </button>
        }
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskStyle(detailModal.risk).bg}`}>{detailModal.risk}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-800 text-white border-white/5">
                {getPublicStatusInfo(getMunicipalStatus(detailModal)).label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Reports', detailModal.reportCount],
                ['Avg AQI', detailModal.averageAQI],
                ['Confidence', `${detailModal.averageConfidence}%`],
                ['Radius', `${Math.round(detailModal.radius)} m`],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
                  <span className="text-[10px] uppercase text-muted-text block">{label}</span>
                  <strong className="text-white text-lg">{val}</strong>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
              <span className="text-[10px] uppercase text-muted-text block">Dominant Pollution</span>
              <p className="text-sm text-white mt-1">{detailModal.dominantPollution}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
              <span className="text-[10px] uppercase text-muted-text block">Recommended Action</span>
              <p className="text-sm text-white mt-1 leading-relaxed">{detailModal.recommendedAction}</p>
            </div>
            {detailModal.sourceReportData && detailModal.sourceReportData.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {detailModal.sourceReportData.map((src) => (
                  <div key={src._id} className="rounded-lg overflow-hidden border border-white/5">
                    {src.image ? (
                      <img src={resolveImgUrl(src.image)} alt="" className="w-full h-20 object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-20 bg-slate-800 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCamera} className="text-muted-text" />
                      </div>
                    )}
                    <p className="p-1.5 text-[9px] font-bold text-white truncate">{src.category}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-text">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                {detailModal.center.lat.toFixed(4)}, {detailModal.center.lng.toFixed(4)}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {formatHotspotTimestamp(detailModal.createdAt)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HotspotsPage;
