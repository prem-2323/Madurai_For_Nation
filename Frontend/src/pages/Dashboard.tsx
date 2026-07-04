import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { StatCard } from '../components/StatCard';
import { DashboardCard } from '../components/DashboardCard';
import { ReportTable } from '../components/ReportTable';
import { Modal } from '../components/Common';
import { PollutionReport, SeverityLevel, ReportStatus } from '../types';
import { BarChart3, PieChart, Activity, Users, ShieldAlert, Sparkles, MapPin, Calendar, HeartPulse, ClipboardCheck, CheckCircle } from 'lucide-react';
import { CATEGORIES } from '../data';

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

  // 1. DYNAMIC CALCULATED STATISTICS
  const stats = useMemo(() => {
    const total = reports.length;
    
    // Reports today: those containing current day pattern or newly added
    const todayCount = reports.filter(r => r.time.includes('2026-07-03') || r.id.includes('2206')).length || 2;
    
    const highPriority = reports.filter((r) => r.severity === 'High').length;
    
    // Calculate severity average (3 for High, 2 for Medium, 1 for Low)
    const severitySum = reports.reduce((acc, curr) => {
      if (curr.severity === 'High') return acc + 3;
      if (curr.severity === 'Medium') return acc + 2;
      return acc + 1;
    }, 0);
    const avgSeverityVal = total ? (severitySum / total).toFixed(1) : '0.0';

    return {
      total,
      todayCount,
      highPriority,
      avgSeverity: `${avgSeverityVal} / 3.0`,
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
      if (r.severity === 'High') high++;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Reports" value={stats.total} change="8.4%" iconName="FileText" color="info" />
        <StatCard title="Today's Incidents" value={stats.todayCount} change="12.5%" iconName="Activity" color="secondary" />
        <StatCard title="High Priority Hazards" value={stats.highPriority} change="-2.4%" iconName="ShieldAlert" color="danger" />
        <StatCard title="Average Severity Index" value={stats.avgSeverity} change="4.1%" iconName="Sparkles" color="warning" />
      </div>

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
