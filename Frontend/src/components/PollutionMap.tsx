import React, { useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { divIcon } from 'leaflet';
import 'leaflet.heat/dist/leaflet-heat.js';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Calendar, Filter, Info, LocateFixed, MapPin, Search, ShieldAlert } from 'lucide-react';
import { PollutionHotspot, PollutionReport, SeverityLevel } from '../types';
import { CATEGORIES } from '../data';
import { formatReportStatus, getMarkerColor } from '../utils/reportTransform';
import { formatHotspotTimestamp, resolveHotspotBadgeColor } from '../utils/hotspotTransform';

const MADURAI_CENTER: [number, number] = [9.9252, 78.1198];
const DEFAULT_ZOOM = 13;
const SEVERITY_LABELS: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical'];
const HEAT_GRADIENT = {
  0.2: '#22c55e',
  0.5: '#eab308',
  0.8: '#f97316',
  1.0: '#ef4444',
};

interface PollutionMapProps {
  reports: PollutionReport[];
  hotspots?: PollutionHotspot[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

function createMarkerIcon(severity: SeverityLevel, selected?: boolean) {
  const color = getMarkerColor(severity);
  const size = selected ? 24 : 20;

  return divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;inset:-8px;border-radius:9999px;background:${color};opacity:${selected ? 0.28 : 0.16};filter:blur(1px);"></span>
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 10px 24px rgba(15,23,42,0.35);"></span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function getCategoryEmoji(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes('industrial')) return '🏭';
  if (normalized.includes('traffic') || normalized.includes('exhaust') || normalized.includes('vehicle')) return '🚗';
  if (normalized.includes('construction')) return '🏗';
  if (normalized.includes('water')) return '💧';
  if (normalized.includes('burning')) return '🔥';
  if (normalized.includes('waste') || normalized.includes('dump')) return '🗑️';
  if (normalized.includes('clean')) return '🌿';
  return '📍';
}

function createCategoryMarkerIcon(category: string, severity: SeverityLevel, selected?: boolean) {
  const color = getMarkerColor(severity);
  const emoji = getCategoryEmoji(category);
  const size = selected ? 34 : 30;

  return divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;inset:-10px;border-radius:9999px;background:${color};opacity:${selected ? 0.3 : 0.18};filter:blur(1px);"></span>
        <span style="position:absolute;inset:0;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 12px 28px rgba(15,23,42,0.42);display:flex;align-items:center;justify-content:center;font-size:${selected ? 17 : 15}px;line-height:1;">
          ${emoji}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

const USER_LOCATION_ICON = divIcon({
  className: '',
  html: `
    <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;inset:-10px;border-radius:9999px;background:#2563eb;opacity:0.2;filter:blur(1px);"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;border:2px solid #ffffff;box-shadow:0 12px 28px rgba(37,99,235,0.42);"></span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

function MapFlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();

  React.useEffect(() => {
    if (!position) return;
    map.flyTo(position, 15, { duration: 0.9 });
  }, [map, position]);

  return null;
}

function HeatLayer({ points }: { points: Array<[number, number, number]> }) {
  const map = useMap();

  React.useEffect(() => {
    const heatLayer = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: HEAT_GRADIENT,
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

function UserLocationLayer({ position }: { position: [number, number] | null }) {
  if (!position) return null;

  return (
    <Marker position={position} icon={USER_LOCATION_ICON}>
      <Popup>
        <div className="text-slate-900 text-sm font-semibold">Your Location</div>
      </Popup>
    </Marker>
  );
}

function PopupStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
      <span className="text-slate-500 block text-[10px] uppercase tracking-wide">{label}</span>
      <strong className="text-slate-900 text-[11px] leading-tight">{value}</strong>
    </div>
  );
}

function getHotspotPopupBackground(risk: SeverityLevel): string {
  const color = resolveHotspotBadgeColor(risk);
  return color;
}

export const PollutionMap: React.FC<PollutionMapProps> = ({ reports, hotspots = [], loading, error, onRefresh }) => {
  const [selectedReport, setSelectedReport] = useState<PollutionReport | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<PollutionHotspot | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.location.toLowerCase().includes(locationSearch.toLowerCase()) ||
        report.description.toLowerCase().includes(locationSearch.toLowerCase()) ||
        report.category.toLowerCase().includes(locationSearch.toLowerCase()) ||
        report.id.toLowerCase().includes(locationSearch.toLowerCase());

      const matchesSeverity = severityFilter === 'All' || report.severity === severityFilter;
      const matchesCategory = categoryFilter === 'All' || report.category === categoryFilter;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [reports, severityFilter, categoryFilter, locationSearch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAqi = (report: PollutionReport) => {
    const level = report.airQuality?.aqiLevel || 'Unknown';
    const value = report.airQuality?.aqi ?? '—';
    return `${level} (${value})`;
  };

  const heatPoints = useMemo(() => {
    const weightBySeverity: Record<SeverityLevel, number> = {
      Low: 0.2,
      Medium: 0.5,
      High: 0.8,
      Critical: 1.0,
    };

    return filteredReports.map((report) => [
      report.coordinates.lat,
      report.coordinates.lng,
      weightBySeverity[report.severity] ?? 0.5,
    ] as [number, number, number]);
  }, [filteredReports]);

  const hotspotCount = hotspots.length;

  const handleLocateMe = () => {
    setLocationMessage(null);

    if (!('geolocation' in navigator)) {
      setLocationMessage('Your browser does not support location access.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationMessage('Showing your current location on the map.');
        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);
        setLocationMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location access was denied. Please allow GPS permission to locate yourself on the map.'
            : 'Unable to fetch your location right now. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[620px] rounded-2xl overflow-hidden border border-white/5 bg-slate-950 shadow-2xl relative">
      <div className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-white/5 p-5 flex flex-col justify-between shrink-0 overflow-y-auto z-10">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Filter className="w-4.5 h-4.5 text-secondary" /> Spatial Filters
            </h3>
            <span className="text-[11px] text-muted-text block">
              Filter pollution reports across Madurai municipality.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">
              Search Location
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search location or category..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">
              Severity
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['All', ...SEVERITY_LABELS.slice().reverse()].map((level) => (
                <button
                  key={level}
                  onClick={() => setSeverityFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    severityFilter === level
                      ? level === 'High' || level === 'Critical'
                        ? 'bg-danger/15 text-danger border-danger/40'
                        : level === 'Medium'
                          ? 'bg-warning/15 text-warning border-warning/40'
                          : level === 'Low'
                            ? 'bg-success/15 text-success border-success/40'
                            : 'bg-secondary/15 text-secondary border-secondary/40'
                      : 'bg-slate-950 text-muted-text border-white/5 hover:text-white hover:border-white/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">
              Pollution Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-xl text-xs text-white outline-none cursor-pointer transition-all"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">
              Map Layers
            </label>
            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-white/5 cursor-pointer hover:border-secondary/30 transition-all">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="w-4 h-4 rounded accent-danger bg-slate-900 border-white/10 cursor-pointer"
              />
              <span className="text-xs font-semibold text-white">
                Heatmap Overlay
              </span>
              <span className="ml-auto text-[10px] text-muted-text">intensity</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="w-full py-2.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-400/20 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-60"
          >
            <LocateFixed className="w-4 h-4" />
            {isLocating ? 'Locating...' : 'Locate Me'}
          </button>

          {locationMessage && (
            <div className="rounded-xl border border-white/5 bg-slate-950/70 px-3 py-2 text-xs text-muted-text flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
              <span>{locationMessage}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 space-y-2.5 mt-6 lg:mt-0">
          <div className="flex items-center justify-between text-xs text-muted-text">
            <span>Active Markers</span>
            <strong className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5">
              {filteredReports.length} / {reports.length}
            </strong>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-text">
            <span>Active Hotspots</span>
            <strong className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5">
              {hotspotCount}
            </strong>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="w-full py-2 text-xs font-semibold rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh from MongoDB'}
            </button>
          )}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex gap-2 items-center">
            <Info className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-[10px] text-muted-text leading-normal">
              Click any marker to view pollution details, AQI, and municipal recommendations.
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-950">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
            {error}
          </div>
        )}

        {loading && reports.length === 0 && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 flex items-center justify-center">
            <span className="text-sm text-muted-text">Loading reports from MongoDB...</span>
          </div>
        )}

        <MapContainer
          center={MADURAI_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className="w-full h-full"
          attributionControl
          whenReady={(event) => {
            event.target.setView(MADURAI_CENTER, DEFAULT_ZOOM);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHeatmap && <HeatLayer points={heatPoints} />}

          {filteredReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.coordinates.lat, report.coordinates.lng]}
              icon={createCategoryMarkerIcon(report.category, report.severity, selectedReport?.id === report.id)}
              eventHandlers={{
                click: () => setSelectedReport(report),
              }}
            >
              <Popup
                closeButton
                autoPan
                keepInView
                eventHandlers={{
                  remove: () => setSelectedReport((current) => (current?.id === report.id ? null : current)),
                }}
              >
                <div className="min-w-[280px] max-w-sm text-slate-900 space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={report.imageUrl}
                      alt={report.category}
                      className="w-20 h-20 rounded-lg object-cover border border-slate-200 bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {report.category}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-3">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <PopupStat label="AQI" value={formatAqi(report)} />
                    <PopupStat label="Severity" value={report.severity} />
                    <PopupStat label="Confidence" value={`${Math.round(report.confidence)}%`} />
                    <PopupStat label="Health Risk" value={report.healthRisk || 'Unknown'} />
                    <PopupStat label="Reporter" value={report.reporter || 'Anonymous'} />
                    <PopupStat label="Status" value={formatReportStatus(report.status)} />
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-700 border-t border-slate-200 pt-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span>{formatDate(report.time)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span>{report.recommendation || 'No recommendation available.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                      <span>{report.location}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {hotspots.map((hotspot) => {
            const hotspotColor = getHotspotPopupBackground(hotspot.risk);
            const isSelected = selectedHotspot?.id === hotspot.id;

            return (
              <Circle
                key={hotspot.id}
                center={[hotspot.center.lat, hotspot.center.lng]}
                radius={hotspot.radius}
                pathOptions={{
                  color: hotspotColor,
                  fillColor: hotspotColor,
                  fillOpacity: isSelected ? 0.3 : 0.2,
                  opacity: isSelected ? 0.9 : 0.75,
                  weight: isSelected ? 2.5 : 1.5,
                }}
                eventHandlers={{
                  click: () => setSelectedHotspot(hotspot),
                }}
              >
                <Popup
                  closeButton
                  autoPan
                  keepInView
                  eventHandlers={{
                    remove: () => setSelectedHotspot((current) => (current?.id === hotspot.id ? null : current)),
                  }}
                >
                  <div className="min-w-[280px] max-w-sm text-slate-900 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">Pollution Hotspot</h4>
                        <p className="text-[11px] text-slate-600 mt-1">Automatic cluster from the last 24 hours</p>
                      </div>
                      <span
                        className="px-2 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: hotspotColor }}
                      >
                        {hotspot.risk}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <PopupStat label="Reports" value={`${hotspot.reportCount}`} />
                      <PopupStat label="Average AQI" value={`${hotspot.averageAQI}`} />
                      <PopupStat label="Dominant" value={hotspot.dominantPollution} />
                      <PopupStat label="Severity" value={hotspot.highestSeverity} />
                      <PopupStat label="Confidence" value={`${hotspot.averageConfidence}%`} />
                      <PopupStat label="Status" value={hotspot.status} />
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-700 border-t border-slate-200 pt-3">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                        <span>{formatHotspotTimestamp(hotspot.createdAt)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                        <span>{hotspot.recommendedAction}</span>
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

          <MapFlyTo position={userLocation} />
          <UserLocationLayer position={userLocation} />
        </MapContainer>

        {filteredReports.length === 0 && !loading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-6 text-center pointer-events-none z-10">
            <div className="space-y-3">
              <ShieldAlert className="w-8 h-8 text-muted-text mx-auto" />
              <span className="text-sm font-bold text-white block">No reports match your filters</span>
              <span className="text-xs text-muted-text block max-w-xs">
                Adjust filters or submit a new pollution report to see markers on the map.
              </span>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-slate-900/95 border border-white/5 text-[10px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-3 backdrop-blur-md text-muted-text z-10 shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" /> Low
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" /> High
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7f1d1d]" /> Critical
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:block">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3 py-2 text-[10px] font-semibold text-muted-text shadow-xl backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            OpenStreetMap live layer
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollutionMap;
