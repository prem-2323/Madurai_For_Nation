import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { StatCard } from '../components/StatCard';
import { DashboardCard } from '../components/DashboardCard';
import { ReportTable } from '../components/ReportTable';
import { Modal } from '../components/Common';
import { PollutionReport, SeverityLevel, ReportStatus, AQIPrediction } from '../types';
import { BarChart3, PieChart, Activity, ShieldAlert, MapPin, Calendar, HeartPulse, ClipboardCheck, Wind, Sparkles } from 'lucide-react';
import { AirQualityCard } from '../components/AirQualityCard';
import { CATEGORIES } from '../data';
import { fetchPrediction } from '../api/prediction';

interface DashboardProps {
  reports: PollutionReport[];
  onUpdateStatus: (id: string, newStatus: ReportStatus) => void;
  onDeleteReport: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  reports,
  onUpdateStatus,
  onDeleteReport,
}) => {
  const [selectedReport, setSelectedReport] = useState<PollutionReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prediction, setPrediction] = useState<AQIPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPrediction = async () => {
      setPredictionLoading(true);
      setPredictionError(null);

      try {
        const data = await fetchPrediction();
        if (isMounted) {
          setPrediction(data);
        }
      } catch (error) {
        if (isMounted) {
          setPredictionError(error instanceof Error ? error.message : 'Failed to load prediction');
        }
      } finally {
        if (isMounted) {
          setPredictionLoading(false);
        }
      }
    };

    loadPrediction();

    return () => {
      isMounted = false;
    };
  }, [reports]);

  // 1. DYNAMIC CALCULATED STATISTICS
  const stats = useMemo(() => {
    const total = reports.length;

    const todayCount = reports.filter(r => r.time.includes('2026-07-03') || r.id.includes('2206')).length || 2;

    const highPriority = reports.filter((r) => r.severity === 'High' || r.severity === 'Critical').length;

    const reportsWithAqi = reports.filter((r) => r.airQuality?.aqi);
    const avgAqi = reportsWithAqi.length
      ? Math.round(reportsWithAqi.reduce((acc, r) => acc + (r.airQuality?.aqi ?? 0), 0) / reportsWithAqi.length)
      : 0;

    const latestAqiReport = reportsWithAqi[0];
    const currentAqiLevel = latestAqiReport?.airQuality?.aqiLevel || 'N/A';

    const highestPm25 = reportsWithAqi.length
      ? Math.max(...reportsWithAqi.map((r) => r.airQuality?.pm25 ?? 0))
      : 0;

    const criticalAreas = reports.filter(
      (r) =>
        (r.airQuality?.aqi ?? 0) >= 4 ||
        r.airQuality?.aqiLevel === 'Poor' ||
        r.airQuality?.aqiLevel === 'Very Poor' ||
        r.severity === 'High' ||
        r.severity === 'Critical'
    ).length;

    const severitySum = reports.reduce((acc, curr) => {
      if (curr.severity === 'Critical' || curr.severity === 'High') return acc + 3;
      if (curr.severity === 'Medium') return acc + 2;
      return acc + 1;
    }, 0);
    const avgSeverityVal = total ? (severitySum / total).toFixed(1) : '0.0';

    return {
      total,
      todayCount,
      highPriority,
      avgSeverity: `${avgSeverityVal} / 3.0`,
      avgAqi,
      currentAqiLevel,
      highestPm25,
      criticalAreas,
    };
  }, [reports]);

  // 2. DYNAMIC CHART DATA COMPILATION (SVG-based rendering)
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => { counts[cat] = 0; });
    
    reports.forEach((r) => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      } else {
        counts[r.category] = 1;
      }
    });

    return Object.entries(counts).map(([name, val]) => ({ name, val }));
  }, [reports]);

  const severityChartData = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    reports.forEach((r) => {
      if (r.severity === 'Critical' || r.severity === 'High') high++;
      else if (r.severity === 'Medium') medium++;
      else low++;
    });

    const total = high + medium + low || 1;

    return [
      { name: 'High', val: high, pct: Math.round((high / total) * 100), color: '#EF4444' },
      { name: 'Medium', val: medium, pct: Math.round((medium / total) * 100), color: '#F59E0B' },
      { name: 'Low', val: low, pct: Math.round((low / total) * 100), color: '#16A34A' },
    ];
  }, [reports]);

  // View Details click response
  const handleViewDetails = (report: PollutionReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const getStatusTextLabel = (status: ReportStatus) => {
    switch (status) {
      case 'Reported': return 'Report Filed';
      case 'AI Analyzed': return 'AI Diagnostics Applied';
      case 'Action Scheduled': return 'Remediation Active';
      case 'Resolved': return 'Cleared & Resolved';
      default: return status;
    }
  };

  const formatPredictionFactor = (label: string, value: string | number) => `${label}: ${value}`;

  const getPredictionFactors = () => {
    if (!prediction) return [];

    const factors = [
      formatPredictionFactor('Wind speed', `${prediction.inputs?.windSpeed ?? 0} m/s`),
      formatPredictionFactor('Humidity', `${prediction.inputs?.humidity ?? 0}%`),
      formatPredictionFactor('Nearby reports', prediction.inputs?.nearbyCount ?? 0),
      formatPredictionFactor('Critical hotspots', prediction.inputs?.criticalCount ?? 0),
      formatPredictionFactor('Hotspot score', Math.round(prediction.inputs?.hotspotScore ?? 0)),
    ];

    return factors;
  };

  const getPredictionSparklinePoints = () => {
    if (!prediction) return '10,42 52,28 94,12';

    const current = Math.min(260, Math.max(0, prediction.currentAQI));
    const predicted = Math.min(260, Math.max(0, prediction.predictedAQI));
    const mid = Math.round((current + predicted) / 2);

    const scale = (value: number) => 48 - (value / 260) * 36;
    return `6,${scale(current)} 30,${scale(mid)} 54,${scale(predicted)} 78,${scale(predicted + 10)} 102,${scale(predicted)}`;
  };

  const getRiskBadgeClasses = () => {
    if (!prediction) return 'bg-slate-800 text-white border-white/5';

    switch (prediction.risk) {
      case 'Good':
        return 'bg-success/15 text-success border-success/30';
      case 'Fair':
      case 'Moderate':
        return 'bg-warning/15 text-warning border-warning/30';
      case 'Poor':
        return 'bg-orange-500/15 text-orange-300 border-orange-400/30';
      case 'Very Poor':
        return 'bg-danger/15 text-danger border-danger/30';
      default:
        return 'bg-slate-800 text-white border-white/5';
    }
  };

  const getConfidenceLabel = () => {
    if (!prediction) return 'Unknown';
    if (prediction.confidence >= 80) return 'High';
    if (prediction.confidence >= 60) return 'Medium';
    return 'Low';
  };

  const getTrendClasses = () => {
    if (!prediction) return 'text-muted-text';
    if (prediction.trend === 'Increasing') return 'text-danger';
    if (prediction.trend === 'Improving') return 'text-success';
    return 'text-sky-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Municipal Administration</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Air Quality Dashboard</h1>
          <p className="text-sm text-muted-text">Command console for city managers to track active emissions hotspots, map toxic hazards, and schedule clean-air details.</p>
        </div>
      </div>

      {/* TOP STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Current AQI" value={prediction?.currentAQI ?? stats.avgAqi ?? '—'} iconName="Wind" color="info" />
        <StatCard
          title="Air Quality"
          value={prediction ? <span className={`inline-flex items-center px-3 py-1 rounded-full border text-base font-bold ${getRiskBadgeClasses()}`}>{prediction.risk}</span> : (stats.currentAqiLevel || 'N/A')}
          iconName="Activity"
          color="warning"
        />
        <StatCard title="Highest PM2.5" value={prediction?.currentPM25 ? `${prediction.currentPM25.toFixed(1)} μg/m³` : (stats.highestPm25 ? `${stats.highestPm25} μg/m³` : '—')} iconName="ShieldAlert" color="danger" />
        <StatCard title="Critical Areas" value={stats.criticalAreas} iconName="MapPin" color="secondary" />
        <StatCard
          title="24h Forecast"
          value={prediction ? `${prediction.predictedAQI}` : '—'}
          change={prediction ? `${prediction.trendArrow} ${prediction.confidence}% ${getConfidenceLabel()}` : undefined}
          isPositive={prediction ? prediction.trend !== 'Increasing' : true}
          iconName="Sparkles"
          color="primary"
        />
      </div>

      <DashboardCard
        title="24-Hour AQI Prediction"
        subtitle="Hybrid engine using current AQI, weather, nearby reports, and hotspot pressure"
        actions={<Sparkles className="w-4 h-4 text-secondary" />}
      >
        {predictionLoading ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-text">
            Calculating prediction...
          </div>
        ) : predictionError ? (
          <div className="h-40 flex items-center justify-center text-sm text-danger">
            {predictionError}
          </div>
        ) : prediction ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-4 overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-text block">Current AQI</span>
                  <div className="text-3xl font-extrabold text-white mt-1">{prediction.currentAQI}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-muted-text block">Tomorrow</span>
                  <div className="text-3xl font-extrabold text-secondary mt-1">{prediction.predictedAQI}</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-white/5 p-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-text mb-2">
                  <span>Trend line</span>
                  <span>{prediction.trendArrow} {prediction.trend}</span>
                </div>
                <svg viewBox="0 0 108 48" className="w-full h-12 overflow-visible">
                  <defs>
                    <linearGradient id="aqi-forecast-gradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="75%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#aqi-forecast-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getPredictionSparklinePoints()}
                  />
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-900/80 border border-white/5 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-text block">Risk</span>
                  <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full border text-sm font-bold ${getRiskBadgeClasses()}`}>
                    {prediction.risk}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-white/5 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-text block">Trend</span>
                  <strong className={`text-2xl font-extrabold block mt-1 ${getTrendClasses()}`}>
                    {prediction.trendArrow}
                  </strong>
                  <span className={`text-sm font-semibold block -mt-1 ${getTrendClasses()}`}>{prediction.trend}</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-white/5 p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-text block">Confidence</span>
                <strong className="text-lg text-white block mt-1">{prediction.confidence}% <span className="text-muted-text">{getConfidenceLabel()}</span></strong>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-white/5 p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-text block">Forecast State</span>
                <strong className="text-lg text-white block mt-1">{prediction.trend} in 24h</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-text block">Why the prediction?</span>
                <p className="text-sm text-white leading-relaxed mt-2">{prediction.reason}</p>
              </div>

              {prediction.inputs && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-text block">Reason factors</span>
                  <div className="space-y-1 text-[11px] text-muted-text">
                    {getPredictionFactors().map((factor) => (
                      <div key={factor} className="flex items-start gap-2">
                        <span className="text-secondary mt-0.5">•</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DashboardCard>

      {/* CHARTS GRAPHICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Distribution Bar Chart */}
        <DashboardCard
          title="Emissions Category Frequency"
          subtitle="Relative incident count logged per environmental category"
          className="lg:col-span-7"
          actions={<BarChart3 className="w-4 h-4 text-secondary" />}
        >
          <div className="h-64 flex flex-col justify-between pt-4">
            {/* Visual Bars Container */}
            <div className="flex-1 flex items-end gap-3 sm:gap-6 pb-2 border-b border-white/5">
              {categoryChartData.map((item, idx) => {
                // Find max val for ratios
                const maxVal = Math.max(...categoryChartData.map((c) => c.val), 1);
                const heightPct = (item.val / maxVal) * 100;

                return (
                  <div key={item.name} className="flex-1 flex flex-col items-center h-full group cursor-help justify-end">
                    {/* Tooltip on hover */}
                    <span className="text-[10px] font-mono font-bold text-white bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-10">
                      {item.val}
                    </span>
                    {/* SVG Bar */}
                    <div className="w-full relative rounded-t-lg overflow-hidden bg-slate-900 border border-white/5 h-full flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 1, delay: idx * 0.05 }}
                        className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-md relative"
                      >
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
                      </motion.div>
                    </div>
                    {/* Abbreviated Name */}
                    <span className="text-[9px] text-muted-text font-medium mt-2 block w-full truncate text-center" title={item.name}>
                      {item.name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Legend guide info */}
            <div className="flex justify-between items-center text-[10px] text-muted-text pt-2">
              <span>Primary Y-Axis: Incident Volume (Qty)</span>
              <span>Units: Logged cases</span>
            </div>
          </div>
        </DashboardCard>

        {/* Severity Donut Chart */}
        <DashboardCard
          title="Incident Severity Ratio"
          subtitle="Proportional hazard ratings distribution"
          className="lg:col-span-5"
          actions={<PieChart className="w-4 h-4 text-primary" />}
        >
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
            {/* Gorgeous SVG Donut */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />

                {/* Donut Sections */}
                {(() => {
                  let accumulatedPercent = 0;
                  return severityChartData.map((item, idx) => {
                    const strokeDash = `${item.pct} ${100 - item.pct}`;
                    const strokeOffset = 100 - accumulatedPercent;
                    accumulatedPercent += item.pct;

                    return (
                      <motion.circle
                        key={item.name}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="10"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 100' }}
                        animate={{ strokeDasharray: strokeDash }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="transition-all hover:stroke-[12] cursor-help"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Inner Central text readouts */}
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-white leading-none">{stats.total}</span>
                <span className="text-[9px] uppercase font-bold text-muted-text tracking-wider mt-1">Total Logs</span>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-3 shrink-0">
              {severityChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">{item.name} Severity</span>
                    <span className="text-[10px] text-muted-text block leading-none">{item.val} reports ({item.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </DashboardCard>

      </div>

      {/* CORE REPORTS TABLE */}
      <DashboardCard
        title="Recent Environmental Hazards Queue"
        subtitle="Operational ledger of active community alerts and municipal resolutions"
      >
        <ReportTable
          reports={reports}
          onViewReport={handleViewDetails}
          onUpdateStatus={onUpdateStatus}
          onDeleteReport={onDeleteReport}
        />
      </DashboardCard>

      {/* DETAILED INSPECTOR MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Hyperlocal Environmental Audit Detail"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white rounded-lg transition-all"
            >
              Dismiss Audit
            </button>
            {selectedReport && selectedReport.status !== 'Resolved' && (
              <button
                onClick={() => {
                  const nextStatusMap: Record<ReportStatus, ReportStatus> = {
                    'Reported': 'AI Analyzed',
                    'AI Analyzed': 'Action Scheduled',
                    'Action Scheduled': 'Resolved',
                    'Resolved': 'Resolved'
                  };
                  onUpdateStatus(selectedReport.id, nextStatusMap[selectedReport.status]);
                  // Refresh modal data
                  setSelectedReport({
                    ...selectedReport,
                    status: nextStatusMap[selectedReport.status]
                  });
                }}
                className="px-4 py-2 bg-primary hover:bg-emerald-500 text-xs font-bold text-white rounded-lg shadow-md shadow-primary/10 transition-all"
              >
                Advance Audit Workflow
              </button>
            )}
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-6 text-left">
            {/* Visual Grid: Image + Core Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image Preview */}
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg h-56 bg-slate-950/80">
                <img
                  src={selectedReport.imageUrl}
                  alt={selectedReport.category}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Core Telemetry */}
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-text block">Report Identity</span>
                  <span className="text-base font-mono font-bold text-white">{selectedReport.id}</span>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-text block">Classification</span>
                  <span className="text-sm font-extrabold text-secondary">{selectedReport.category}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-text block">Current Workflow</span>
                    <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-white border border-white/5">
                      {getStatusTextLabel(selectedReport.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-text block">Severity Scale</span>
                    <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md border ${
                      selectedReport.severity === 'High' ? 'bg-danger/10 text-danger border-danger/30' : selectedReport.severity === 'Medium' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-success/10 text-success border-success/30'
                    }`}>
                      {selectedReport.severity} Hazard
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-muted-text">
                  <Calendar className="w-4 h-4 text-secondary shrink-0" />
                  <span>Logged Date: {new Date(selectedReport.time).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-text block tracking-wide">Contextual Description</span>
              <p className="text-xs text-white leading-relaxed">{selectedReport.description}</p>
            </div>

            {/* Spatial Pinpoint coordinates */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-secondary">
                <MapPin className="w-4.5 h-4.5 text-secondary shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text tracking-wide">Spatial GPS coordinates</span>
              </div>
              <p className="text-xs text-white font-medium">{selectedReport.location}</p>
              <span className="text-[10px] text-muted-text block font-mono">
                LENS_LAT: {selectedReport.coordinates.lat.toFixed(6)} | LENS_LNG: {selectedReport.coordinates.lng.toFixed(6)}
              </span>
            </div>

            {/* Live air quality data */}
            {selectedReport.airQuality && selectedReport.airQuality.aqi > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-secondary">
                  <Wind className="w-4 h-4 text-secondary shrink-0" />
                  <span className="text-[10px] font-bold uppercase text-muted-text tracking-wide">Live Air Quality at Incident Site</span>
                </div>
                <AirQualityCard data={selectedReport.airQuality} />
              </div>
            )}

            {/* Health risk analysis */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-red-400">
                <HeartPulse className="w-4.5 h-4.5 text-danger shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text tracking-wide">Toxicity & Health Threat Assessment</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{selectedReport.healthRisk}</p>
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-secondary">
                <span>AI Confidence Factor:</span>
                <span>{selectedReport.confidence}% matching correctness</span>
              </div>
            </div>

            {/* Municipal Action Directives */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-success">
                <ClipboardCheck className="w-4.5 h-4.5 text-success shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text tracking-wide">Remediation Guidelines</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{selectedReport.recommendation}</p>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};
export default Dashboard;
