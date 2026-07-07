import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Circle, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Flame,
  ShieldAlert,
  Globe,
  BarChart3,
  MapPin,
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  Trash2,
  Eye,
  Target,
  AlertTriangle,
  Gauge,
  Building2,
  Calendar,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PollutionHotspot } from '../types';
import { fetchHotspots, updateHotspotStatus, updateHotspot, deleteHotspot } from '../api/hotspots';
import { fetchPrediction } from '../api/prediction';
import { formatHotspotTimestamp } from '../utils/hotspotTransform';
import { Modal, LoadingSpinner, EmptyState, AlertBanner } from '../components/Common';

const MADURAI_CENTER: [number, number] = [9.9252, 78.1198];
const DEFAULT_ZOOM = 12;

const SEVERITY_COLORS = {
  Low: { fill: '#22c55e', border: '#16a34a', bg: 'bg-green-500/15 text-green-300 border-green-400/25' },
  Medium: { fill: '#eab308', border: '#ca8a04', bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/25' },
  High: { fill: '#f97316', border: '#ea580c', bg: 'bg-orange-500/15 text-orange-300 border-orange-400/25' },
  Critical: { fill: '#ef4444', border: '#dc2626', bg: 'bg-red-500/15 text-red-300 border-red-400/25' },
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-green-400 bg-green-500/10 border-green-500/20',
  'In Progress': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Resolved: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const MADURAI_AREAS: Record<string, { lat: number; lng: number }> = {
  'SIDCO Industrial Estate': { lat: 9.9123, lng: 78.1145 },
  'Vaigai River Bank': { lat: 9.8956, lng: 78.1289 },
  'Mattuthavani Bus Stand': { lat: 9.9198, lng: 78.1195 },
  'KK Nagar Construction Zone': { lat: 9.9345, lng: 78.1056 },
  'Vandiyur Lake': { lat: 9.9412, lng: 78.1312 },
  'Meenakshi Amman Temple Area': { lat: 9.9252, lng: 78.1198 },
  'Anna Nagar': { lat: 9.9400, lng: 78.1300 },
  'Periyar': { lat: 9.9150, lng: 78.1100 },
  'Goripalayam': { lat: 9.9300, lng: 78.1250 },
  'Simmakkal': { lat: 9.9200, lng: 78.1150 },
  'Arapalayam': { lat: 9.9050, lng: 78.1050 },
};

interface HotspotsPageProps {
  token?: string | null;
  user?: any;
}

function getRiskBadge(risk: string) {
  return SEVERITY_COLORS[risk as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.Low;
}

function getStatusBadge(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.Active;
}

function getHotspotName(hotspot: PollutionHotspot): string {
  if (hotspot.location) return hotspot.location;
  let closest = 'Hotspot';
  let minDist = Infinity;
  Object.entries(MADURAI_AREAS).forEach(([name, coord]) => {
    const dist = Math.sqrt(
      (hotspot.center.lat - coord.lat) ** 2 + (hotspot.center.lng - coord.lng) ** 2
    );
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  });
  return minDist < 0.03 ? closest : `Hotspot (${hotspot.center.lat.toFixed(3)}, ${hotspot.center.lng.toFixed(3)})`;
}

function MapController({ flyTo }: { flyTo: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTo) return;
    map.flyTo(flyTo, 14, { duration: 0.8 });
  }, [map, flyTo]);
  return null;
}

export const HotspotsPage: React.FC<HotspotsPageProps> = ({ token, user }) => {
  const [hotspots, setHotspots] = useState<PollutionHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<PollutionHotspot | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [assignModal, setAssignModal] = useState<PollutionHotspot | null>(null);
  const [assignTeam, setAssignTeam] = useState('');
  const [detailModal, setDetailModal] = useState<PollutionHotspot | null>(null);
  const [predictionData, setPredictionData] = useState<Record<string, number>>({});
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'danger' | 'info'; text: string } | null>(null);

  const isOfficer = user?.role === 'officer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const loadHotspots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHotspots(token);
      setHotspots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotspots');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  useEffect(() => {
    if (hotspots.length === 0) return;
    const loadPredictions = async () => {
      try {
        const pred = await fetchPrediction();
        setPredictionData({ default: pred.predictedAQI });
      } catch { }
    };
    loadPredictions();
  }, [hotspots.length]);

  const stats = useMemo(() => {
    const active = hotspots.length;
    const critical = hotspots.filter((h) => h.risk === 'Critical').length;
    const highRisk = hotspots.filter((h) => h.risk === 'High').length;
    const totalReports = hotspots.reduce((s, h) => s + h.reportCount, 0);
    const avgAqi = active ? Math.round(hotspots.reduce((s, h) => s + h.averageAQI, 0) / active) : 0;
    return { active, critical, highRisk, avgAqi, totalReports };
  }, [hotspots]);

  const sortedHotspots = useMemo(() => {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return [...hotspots].sort((a, b) => (rank[b.risk] - rank[a.risk]) || (b.reportCount - a.reportCount));
  }, [hotspots]);

  const filteredSidebar = useMemo(() => {
    if (!sidebarSearch) return sortedHotspots;
    const q = sidebarSearch.toLowerCase();
    return sortedHotspots.filter((h) => {
      const name = getHotspotName(h).toLowerCase();
      return name.includes(q) || h.dominantPollution.toLowerCase().includes(q) || h.risk.toLowerCase().includes(q);
    });
  }, [sortedHotspots, sidebarSearch]);

  const handleStatusChange = async (hotspot: PollutionHotspot, status: 'Active' | 'In Progress' | 'Resolved') => {
    try {
      const updated = await updateHotspotStatus(hotspot.id, status, token);
      setHotspots((prev) => prev.map((h) => (h.id === hotspot.id ? { ...h, status: updated.status } : h)));
      setActionMsg({ type: 'success', text: `Hotspot marked as "${status}"` });
    } catch (err) {
      setActionMsg({ type: 'danger', text: err instanceof Error ? err.message : 'Failed to update status' });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleAssignTeam = async () => {
    if (!assignModal || !assignTeam.trim()) return;
    try {
      const updated = await updateHotspot(assignModal.id, { assignedTeam: assignTeam.trim() }, token);
      setHotspots((prev) => prev.map((h) => (h.id === assignModal.id ? { ...h, assignedTeam: updated.assignedTeam } : h)));
      setAssignModal(null);
      setAssignTeam('');
      setActionMsg({ type: 'success', text: `Team "${updated.assignedTeam}" assigned to hotspot` });
    } catch (err) {
      setActionMsg({ type: 'danger', text: err instanceof Error ? err.message : 'Failed to assign team' });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHotspot(id, token);
      setHotspots((prev) => prev.filter((h) => h.id !== id));
      setActionMsg({ type: 'success', text: 'Hotspot deleted successfully' });
    } catch (err) {
      setActionMsg({ type: 'danger', text: err instanceof Error ? err.message : 'Failed to delete' });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            Municipal Command Center
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-8 h-8 text-red-400" /> Pollution Hotspot Intelligence
          </h1>
          <p className="text-sm text-muted-text">
            Strategic view of automatically detected pollution clusters across Madurai. Each hotspot
            aggregates multiple citizen reports for coordinated municipal response.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHotspots}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <AlertBanner
          type={actionMsg.type as 'success' | 'danger' | 'info'}
          message={actionMsg.text}
          onClose={() => setActionMsg(null)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-card-dark border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-400" /> Active Hotspots
          </span>
          <p className="text-2xl font-extrabold text-white">{stats.active}</p>
          <p className="text-[10px] text-muted-text">Currently active clusters</p>
        </div>
        <div className="p-4 rounded-2xl bg-card-dark border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Critical
          </span>
          <p className="text-2xl font-extrabold text-red-400">{stats.critical}</p>
          <p className="text-[10px] text-muted-text">Require immediate action</p>
        </div>
        <div className="p-4 rounded-2xl bg-card-dark border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> High Risk
          </span>
          <p className="text-2xl font-extrabold text-orange-400">{stats.highRisk}</p>
          <p className="text-[10px] text-muted-text">Areas to monitor closely</p>
        </div>
        <div className="p-4 rounded-2xl bg-card-dark border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-yellow-400" /> Average AQI
          </span>
          <p className="text-2xl font-extrabold text-yellow-300">{stats.avgAqi || '—'}</p>
          <p className="text-[10px] text-muted-text">Across all hotspots</p>
        </div>
        <div className="p-4 rounded-2xl bg-card-dark border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Reports Inside
          </span>
          <p className="text-2xl font-extrabold text-blue-300">{stats.totalReports}</p>
          <p className="text-[10px] text-muted-text">Total reports clustered</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[600px] rounded-2xl overflow-hidden border border-white/5 bg-slate-950 shadow-2xl">
        <div className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-secondary" /> Hotspot List
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
                placeholder="Search hotspots..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-lg text-xs text-white placeholder-muted-text outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredSidebar.map((hotspot) => {
              const colors = getRiskBadge(hotspot.risk);
              const name = getHotspotName(hotspot);
              return (
                <button
                  key={hotspot.id}
                  onClick={() => {
                    setFlyTo([hotspot.center.lat, hotspot.center.lng]);
                    setSelectedHotspot(hotspot);
                  }}
                  className="w-full text-left p-3 hover:bg-slate-800/60 transition-colors space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 shrink-0" style={{ color: colors.border }} />
                      {name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${colors.bg}`}>
                      {hotspot.risk}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-text">
                    <span>{hotspot.reportCount} reports</span>
                    <span>AQI {hotspot.averageAQI}</span>
                  </div>
                </button>
              );
            })}
            {filteredSidebar.length === 0 && !loading && (
              <div className="p-6 text-center text-xs text-muted-text">No hotspots match your search</div>
            )}
            {loading && (
              <div className="p-6 text-center text-xs text-muted-text">Loading hotspots...</div>
            )}
          </div>
          <div className="p-3 border-t border-white/5 bg-slate-950/60">
            <div className="flex items-center gap-2 text-[10px] text-muted-text">
              <Info className="w-3 h-3 text-secondary shrink-0" />
              <span>Click a hotspot to zoom to its location on the map.</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
              {error}
            </div>
          )}
          <MapContainer center={MADURAI_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="w-full h-full">
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
                    fillOpacity: isSelected ? 0.35 : 0.2,
                    opacity: isSelected ? 0.9 : 0.7,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => setSelectedHotspot(hotspot),
                  }}
                >
                  <Popup closeButton autoPan keepInView>
                    <div className="min-w-[260px] max-w-sm text-slate-900 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-red-500" /> {getHotspotName(hotspot)}
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white`}
                          style={{ backgroundColor: colors.fill }}>
                          {hotspot.risk}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wide">Reports</span>
                          <strong className="text-slate-900">{hotspot.reportCount}</strong>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wide">Avg AQI</span>
                          <strong className="text-slate-900">{hotspot.averageAQI}</strong>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wide">Dominant</span>
                          <strong className="text-slate-900 text-[10px]">{hotspot.dominantPollution}</strong>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wide">Severity</span>
                          <strong className="text-slate-900">{hotspot.highestSeverity}</strong>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wide">Confidence</span>
                          <strong className="text-slate-900">{hotspot.averageConfidence}%</strong>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wide">Status</span>
                          <strong className="text-slate-900">{hotspot.status}</strong>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-slate-700 border-t border-slate-200 pt-3">
                        {predictionData.default && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>24h Predicted AQI: <strong>{predictionData.default}</strong></span>
                          </div>
                        )}
                        {hotspot.assignedTeam && (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Team: <strong>{hotspot.assignedTeam}</strong></span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <Building2 className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                          <span>{hotspot.recommendedAction}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                          <span>{formatHotspotTimestamp(hotspot.createdAt)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                          <span>Radius {Math.round(hotspot.radius)} m</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            })}
            <MapController flyTo={flyTo} />
          </MapContainer>
          {hotspots.length === 0 && !loading && !error && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center pointer-events-none z-10">
              <div className="text-center space-y-3 p-6">
                <Flame className="w-10 h-10 text-muted-text mx-auto" />
                <span className="text-sm font-bold text-white block">No active hotspots</span>
                <span className="text-xs text-muted-text block max-w-xs">
                  Hotspots appear automatically when 3+ reports cluster within the detection radius.
                </span>
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-white/5 text-[10px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-3 backdrop-blur-md text-muted-text z-10 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} /> Low</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#eab308' }} /> Med</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f97316' }} /> High</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} /> Crit</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-secondary" /> Hotspot Action Center
          </h2>
          <span className="text-xs text-muted-text">{hotspots.length} hotspots detected</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedHotspots.map((hotspot) => {
            const colors = getRiskBadge(hotspot.risk);
            const name = getHotspotName(hotspot);
            return (
              <motion.div
                key={hotspot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-card-dark border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${colors.fill}20` }}>
                        <Flame className="w-5 h-5" style={{ color: colors.fill }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{name}</h3>
                        <p className="text-[10px] text-muted-text">{formatHotspotTimestamp(hotspot.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${colors.bg}`}>
                        {hotspot.risk}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(hotspot.status)}`}>
                        {hotspot.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
                      <span className="text-muted-text block text-[10px] uppercase tracking-wide">Avg AQI</span>
                      <strong className="text-white text-lg">{hotspot.averageAQI}</strong>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3">
                      <span className="text-muted-text block text-[10px] uppercase tracking-wide">Reports</span>
                      <strong className="text-white text-lg">{hotspot.reportCount}</strong>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3 col-span-2">
                      <span className="text-muted-text block text-[10px] uppercase tracking-wide">Dominant Pollution</span>
                      <strong className="text-white text-sm leading-tight">{hotspot.dominantPollution}</strong>
                    </div>
                  </div>

                  {predictionData.default && (
                    <div className="flex items-center gap-2 text-xs text-muted-text">
                      <Globe className="w-3.5 h-3.5 text-secondary" />
                      <span>24h Predicted AQI: <strong className="text-white">{predictionData.default}</strong></span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{hotspot.recommendedAction}</span>
                    </div>
                  )}

                  {hotspot.assignedTeam && (
                    <div className="flex items-center gap-2 text-xs text-muted-text">
                      <UserCheck className="w-3.5 h-3.5 text-green-400" />
                      <span>Assigned Team: <strong className="text-green-300">{hotspot.assignedTeam}</strong></span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setFlyTo([hotspot.center.lat, hotspot.center.lng]);
                        setSelectedHotspot(hotspot);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-semibold hover:bg-secondary/20 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> View on Map
                    </button>
                    <button
                      onClick={() => setDetailModal(hotspot)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white border border-white/5 text-[10px] font-semibold hover:bg-slate-700 transition-all"
                    >
                      <Info className="w-3.5 h-3.5" /> Details
                    </button>
                    {isOfficer && hotspot.status !== 'Resolved' && (
                      <>
                        <button
                          onClick={() => setAssignModal(hotspot)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-400/20 text-[10px] font-semibold hover:bg-blue-500/20 transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Assign Team
                        </button>
                        <button
                          onClick={() => handleStatusChange(hotspot, 'In Progress')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-400/20 text-[10px] font-semibold hover:bg-amber-500/20 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5" /> In Progress
                        </button>
                        <button
                          onClick={() => handleStatusChange(hotspot, 'Resolved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-300 border border-green-400/20 text-[10px] font-semibold hover:bg-green-500/20 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(hotspot.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-400/20 text-[10px] font-semibold hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {sortedHotspots.length === 0 && !loading && (
            <div className="lg:col-span-2">
              <EmptyState
                title="No Hotspots Detected"
                description="Hotspots will appear automatically when three or more recent pollution reports cluster within the configured radius. Submit reports via the Report page to generate new clusters."
                icon={<Flame className="w-8 h-8" />}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!assignModal}
        onClose={() => { setAssignModal(null); setAssignTeam(''); }}
        title="Assign Response Team"
        footer={
          <>
            <button
              onClick={() => { setAssignModal(null); setAssignTeam(''); }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white border border-white/5 text-xs font-semibold hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTeam}
              disabled={!assignTeam.trim()}
              className="px-4 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-400/20 text-xs font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              Assign Team
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-text">
            Assign a municipal response team to handle <strong className="text-white">{assignModal ? getHotspotName(assignModal) : ''}</strong>.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white block">Team Name / ID</label>
            <input
              type="text"
              value={assignTeam}
              onChange={(e) => setAssignTeam(e.target.value)}
              placeholder="e.g. Fire & Safety Crew 3, Pollution Control Unit"
              className="w-full p-3 bg-slate-900 border border-white/5 focus:border-secondary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={`Hotspot Details: ${detailModal ? getHotspotName(detailModal) : ''}`}
        footer={
          <button
            onClick={() => setDetailModal(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white border border-white/5 text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            Close
          </button>
        }
      >
        {detailModal && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getRiskBadge(detailModal.risk).bg}`}>
                  {detailModal.risk}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(detailModal.status)}`}>
                  {detailModal.status}
                </span>
              </div>
              <span className="text-[10px] text-muted-text font-mono">{detailModal.id.slice(-8)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Report Count</span>
                <strong className="text-white text-xl">{detailModal.reportCount}</strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Average AQI</span>
                <strong className="text-white text-xl">{detailModal.averageAQI}</strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Avg Confidence</span>
                <strong className="text-white text-xl">{detailModal.averageConfidence}%</strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Highest Severity</span>
                <strong className="text-white text-xl">{detailModal.highestSeverity}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-text block">Dominant Pollution</span>
              <strong className="text-white text-sm">{detailModal.dominantPollution}</strong>
            </div>

            {predictionData.default && (
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">24-Hour AQI Prediction</span>
                <strong className="text-white text-xl">{predictionData.default}</strong>
              </div>
            )}

            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-text block">Recommended Municipal Action</span>
              <p className="text-sm text-white leading-relaxed mt-1">{detailModal.recommendedAction}</p>
            </div>

            {detailModal.assignedTeam && (
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Assigned Officer / Team</span>
                <div className="flex items-center gap-2 mt-1">
                  <UserCheck className="w-4 h-4 text-green-400" />
                  <strong className="text-white text-sm">{detailModal.assignedTeam}</strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Coordinates</span>
                <strong className="text-white text-sm">
                  {detailModal.center.lat.toFixed(4)}, {detailModal.center.lng.toFixed(4)}
                </strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                <span className="text-[10px] uppercase tracking-wide text-muted-text block">Radius</span>
                <strong className="text-white text-sm">{Math.round(detailModal.radius)} m</strong>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-text block">Created At</span>
              <strong className="text-white text-sm">{formatHotspotTimestamp(detailModal.createdAt)}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HotspotsPage;