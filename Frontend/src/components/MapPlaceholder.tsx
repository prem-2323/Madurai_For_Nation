import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Filter, Info, ShieldAlert, X, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { PollutionReport, SeverityLevel } from '../types';
import { CATEGORIES } from '../data';

interface MapPlaceholderProps {
  reports: PollutionReport[];
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState<PollutionReport | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [locationSearch, setLocationSearch] = useState('');

  // Coordinate projection boundaries (Seattle Region)
  // Max/Min coordinates based on our dummy data to map onto standard SVG coordinates:
  // Lat range: 47.15 to 47.75
  // Lng range: -122.40 to -121.95
  const mapBounds = {
    minLat: 47.15,
    maxLat: 47.75,
    minLng: -122.40,
    maxLng: -121.95
  };

  // Convert lat/lng to responsive percent coordinates (X and Y on SVG/Div)
  const projectCoordinates = (lat: number, lng: number) => {
    const latPercent = ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    const lngPercent = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    
    // Invert Y because SVG coordinates start at top, while Latitudes increase going North (upwards)
    return {
      x: Math.min(Math.max(lngPercent, 5), 95),
      y: Math.min(Math.max(100 - latPercent, 5), 95)
    };
  };

  // Filter markers based on sidebar filters
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.location.toLowerCase().includes(locationSearch.toLowerCase()) ||
        report.description.toLowerCase().includes(locationSearch.toLowerCase()) ||
        report.id.toLowerCase().includes(locationSearch.toLowerCase());

      const matchesSeverity = severityFilter === 'All' || report.severity === severityFilter;
      const matchesCategory = categoryFilter === 'All' || report.category === categoryFilter;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [reports, severityFilter, categoryFilter, locationSearch]);

  const getMarkerColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'High':
        return 'text-danger bg-danger/15 border-danger';
      case 'Medium':
        return 'text-warning bg-warning/15 border-warning';
      case 'Low':
        return 'text-success bg-success/15 border-success';
      default:
        return 'text-secondary bg-secondary/15 border-secondary';
    }
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'High':
        return 'bg-danger/15 text-danger border-danger/30';
      case 'Medium':
        return 'bg-warning/15 text-warning border-warning/30';
      case 'Low':
        return 'bg-success/15 text-success border-success/30';
      default:
        return 'bg-slate-800 text-white border-white/5';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[620px] rounded-2xl overflow-hidden border border-white/5 bg-slate-950 shadow-2xl relative">
      
      {/* 1. LEFT SIDEBAR FILTERS */}
      <div className="w-full lg:w-80 bg-slate-900 border-b lg:border-b-0 lg:border-r border-white/5 p-5 flex flex-col justify-between shrink-0 overflow-y-auto z-10">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Filter className="w-4.5 h-4.5 text-secondary" /> Spatial Filters
            </h3>
            <span className="text-[11px] text-muted-text block">Filter active environmental reports geographically.</span>
          </div>

          {/* Search location */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">Search Coordinates</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search location keywords..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all"
              />
            </div>
          </div>

          {/* Severity filter checkboxes/pills */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">Severity Magnitude</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'High', 'Medium', 'Low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSeverityFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    severityFilter === level
                      ? level === 'High'
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

          {/* Pollution Type dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-text tracking-wider block">Pollution Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-xl text-xs text-white outline-none cursor-pointer transition-all"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sidebar Footer Metrics */}
        <div className="pt-4 border-t border-white/5 space-y-2.5 mt-6 lg:mt-0">
          <div className="flex items-center justify-between text-xs text-muted-text">
            <span>Filtered Reports</span>
            <strong className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5">
              {filteredReports.length} / {reports.length}
            </strong>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex gap-2 items-center">
            <Info className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-[10px] text-muted-text leading-normal">
              Click any colored pin to investigate hyperlocal AI analysis & municipal recommendations.
            </span>
          </div>
        </div>
      </div>

      {/* 2. VECTOR MAP AREA */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden select-none flex items-center justify-center">
        
        {/* Background stylized grid pattern representing map coordinates */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        {/* Mock Seattle Coastal Outline (Sleek minimalist glowing paths) */}
        <svg className="absolute inset-0 w-full h-full text-slate-800/40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Simulated Puget Sound / Elliott Bay outline on Left */}
          <path d="M 0,0 Q 150,150 120,300 T 50,550 T 0,620 L 0,0 Z" fill="rgba(14, 165, 233, 0.015)" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="2" strokeDasharray="5,5" />
          
          {/* Simulated Lake Washington outline on Right */}
          <path d="M 500,0 Q 420,180 440,320 T 480,500 T 500,620 L 500,0 Z" fill="rgba(14, 165, 233, 0.01)" stroke="rgba(14, 165, 233, 0.05)" strokeWidth="2" strokeDasharray="5,5" />

          {/* Major arterial lines (Freeways/Streets representation) */}
          <path d="M 250,0 Q 220,200 240,400 T 260,620" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1.5" />
          <path d="M 0,350 Q 200,320 400,380 T 500,410" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
          <path d="M 100,100 Q 250,220 380,180" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
        </svg>

        {/* HUD Overlay Labels */}
        <div className="absolute top-4 right-4 bg-slate-900/95 border border-white/5 text-[10px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md text-muted-text z-10 shadow-lg">
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /> HIGH</div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warning" /> MED</div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success" /> LOW</div>
        </div>

        {/* Compass Dial Indicator */}
        <div className="absolute bottom-4 right-4 text-slate-800 pointer-events-none hidden sm:block">
          <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center font-mono text-[9px] relative font-semibold">
            <span>N</span>
            <div className="absolute inset-y-1 left-1/2 border-l border-slate-800" />
            <div className="absolute inset-x-1 top-1/2 border-t border-slate-800" />
          </div>
        </div>

        {/* Render Interactive Pulsating Markers */}
        {filteredReports.map((report) => {
          const pos = projectCoordinates(report.coordinates.lat, report.coordinates.lng);
          const activeColor = getMarkerColor(report.severity);
          const isSelected = selectedReport?.id === report.id;

          return (
            <div
              key={report.id}
              className="absolute"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <button
                onClick={() => setSelectedReport(report)}
                className="relative -translate-x-1/2 -translate-y-1/2 focus:outline-none z-10 cursor-pointer group"
              >
                {/* Outer Ring Ripple */}
                <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border opacity-50 transition-all ${
                  report.severity === 'High' ? 'border-danger animate-ping' : report.severity === 'Medium' ? 'border-warning animate-ping [animation-duration:3s]' : 'border-success animate-ping [animation-duration:4s]'
                }`} />

                {/* Inner Marker Point */}
                <div className={`p-2 rounded-full border shadow-xl transition-all duration-300 ${activeColor} ${
                  isSelected ? 'scale-125 ring-4 ring-secondary/40 z-20' : 'group-hover:scale-115'
                }`}>
                  <MapPin className="w-4 h-4" />
                </div>

                {/* Hover Quick-tooltip */}
                <span className="absolute left-1/2 top-full -translate-x-1/2 mt-1 px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {report.category} ({report.severity})
                </span>
              </button>
            </div>
          );
        })}

        {/* Map state empty banner if no reports */}
        {filteredReports.length === 0 && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 text-center">
            <div className="space-y-3">
              <ShieldAlert className="w-8 h-8 text-muted-text mx-auto" />
              <span className="text-sm font-bold text-white block">No coordinates found matching active parameters</span>
              <span className="text-xs text-muted-text block max-w-xs">Adjust sidebar spatial filter terms to display localized markers.</span>
            </div>
          </div>
        )}

        {/* 3. INTERACTIVE HUD POPUP DRAWER (Click marker response) */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-[380px] p-4 rounded-2xl glass-panel border border-white/15 shadow-2xl z-20 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span className="text-[10px] font-mono text-muted-text font-bold">GRID_ID: {selectedReport.id}</span>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded bg-white/5 text-muted-text hover:text-white hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Content Info */}
              <div className="flex gap-3">
                {/* Mini Image Preview */}
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <img
                    src={selectedReport.imageUrl}
                    alt={selectedReport.category}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-white block truncate">{selectedReport.category}</span>
                  <span className="text-[10px] text-muted-text block mt-0.5 truncate">{selectedReport.location}</span>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-md ${getSeverityBadge(selectedReport.severity)}`}>
                      {selectedReport.severity} Severity
                    </span>
                    <span className="text-[9px] font-mono text-secondary font-bold">
                      {selectedReport.confidence}% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-text leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-white/5 max-h-16 overflow-y-auto">
                {selectedReport.description}
              </p>

              {/* AI Recommendations */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-success block tracking-wider">AI Directives</span>
                <p className="text-[10px] text-white leading-normal font-medium">
                  {selectedReport.recommendation}
                </p>
              </div>

              {/* Footer info (date) */}
              <div className="flex items-center gap-1.5 text-[9px] text-muted-text border-t border-white/5 pt-2">
                <Calendar className="w-3 h-3 text-secondary" />
                <span>Detected: {formatDate(selectedReport.time)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
