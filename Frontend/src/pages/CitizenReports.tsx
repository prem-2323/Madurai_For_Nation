import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faMagnifyingGlass, faCamera } from '@fortawesome/free-solid-svg-icons';
import {
  ClipboardList, Calendar, MapPin, AlertCircle, RefreshCw,
} from 'lucide-react';
import type { CitizenReport } from '../types';
import { fetchMyReports } from '../api/reports';
import { API_BASE_URL } from '../api/analyze';
import {
  getPublicStatusInfo,
  formatTimestamp,
} from '../utils/municipalStatus';
import { EmptyState } from '../components/Common';
import { SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';

interface CitizenReportsProps {
  token?: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-500/15 text-green-300 border-green-400/25',
  moderate: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/25',
  high: 'bg-orange-500/15 text-orange-300 border-orange-400/25',
  critical: 'bg-red-500/15 text-red-300 border-red-400/25',
};

function getSeverityBadge(severity: string): string {
  return SEVERITY_COLORS[severity?.toLowerCase()] || SEVERITY_COLORS.low;
}

function getAQIColor(aqi: number): string {
  if (aqi >= 301) return 'text-purple-400 bg-purple-500/10 border-purple-400/30';
  if (aqi >= 201) return 'text-red-400 bg-red-500/10 border-red-400/30';
  if (aqi >= 151) return 'text-orange-400 bg-orange-500/10 border-orange-400/30';
  if (aqi >= 101) return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30';
  if (aqi >= 51) return 'text-yellow-300 bg-yellow-400/10 border-yellow-300/30';
  return 'text-green-400 bg-green-500/10 border-green-400/30';
}

const STAGE_DOT_COLORS: Record<string, string> = {
  reported: 'bg-blue-500',
  under_review: 'bg-yellow-500',
  team_assigned: 'bg-orange-500',
  in_progress: 'bg-orange-500',
  resolved: 'bg-green-500',
};

const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#1e293b" width="80" height="80"/><g fill="none" stroke="#64748b" stroke-width="2" transform="translate(24,20)"><rect x="2" y="8" width="32" height="24" rx="4"/><circle cx="18" cy="20" r="6"/><path d="M12 8 L14 4 L22 4 L24 8"/></g></svg>');

function resolveImageUrl(image: string): string {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('data:')) return image;
  return `${API_BASE_URL.replace(/\/+$/, '')}/${image.replace(/^\//, '')}`;
}

export const CitizenReports: React.FC<CitizenReportsProps> = ({ token }) => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyReports(token);
      setReports(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load reports';
      setError(msg);
      toast.error(msg, { id: 'fetch-reports-error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-2 mb-8">
          <div className="h-3 w-20 bg-slate-800 rounded skeleton" />
          <div className="h-10 w-48 bg-slate-800 rounded skeleton" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-10 border border-red-500/20 text-center max-w-lg mx-auto space-y-5"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-danger" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Failed to Load Reports</h2>
            <p className="text-sm text-muted-text">{error}</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={loadReports}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const sorted = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const resolvedCount = sorted.filter(r => r.municipalStatus === 'resolved').length;
  const inProgressCount = sorted.filter(r => r.municipalStatus === 'in_progress' || r.municipalStatus === 'team_assigned').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block">Citizen Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="text-gradient">My Reports</span>
          </h1>
          <p className="text-xs text-muted-text">Track the municipal response progress for your submitted pollution reports.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={loadReports} disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </motion.button>
      </motion.div>

      {/* Summary bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Total Reports', value: sorted.length, color: 'text-white', bg: 'bg-slate-800/60', border: 'border-white/5' },
          { label: 'Resolved', value: resolvedCount, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
          { label: 'In Progress', value: inProgressCount, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}
            className={`glass-panel rounded-xl p-3 text-center border ${s.border}`}
          >
            <span className="text-lg font-extrabold text-white">{s.value}</span>
            <span className="text-[9px] text-muted-text block mt-0.5 uppercase tracking-wider font-semibold">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Reports list */}
      {sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <EmptyState
            title="No Reports Yet"
            description="You haven't submitted any pollution reports yet. Go to the Report page to submit one."
            icon={<ClipboardList className="w-8 h-8" />}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorted.map((report, index) => {
            const statusInfo = getPublicStatusInfo(report.municipalStatus);
            const severityBadge = getSeverityBadge(report.severity);

            return (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group"
              >
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-purple-500" />
                  <div className="p-4 space-y-3">
                    {/* Header: thumbnail + badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-900 flex items-center justify-center">
                          {report.image ? (
                            <img src={resolveImageUrl(report.image)} alt={report.category}
                              className="w-full h-full object-cover" referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon icon={faCamera} className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">{report.category}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${severityBadge}`}>
                              {report.severity}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${getAQIColor(report.AQI)}`}>
                              AQI {report.AQI}
                            </span>
                          </div>
                        </div>
                      </div>
                      <FontAwesomeIcon icon={statusInfo.icon === 'circle' ? faCircle : faMagnifyingGlass} className={`${statusInfo.color} text-lg shrink-0`} />
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-900/60 rounded-lg border border-white/5 text-center">
                        <span className="text-[8px] uppercase font-bold text-muted-text block">Confidence</span>
                        <span className="text-xs font-bold text-white">{report.confidence}%</span>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded-lg border border-white/5 text-center">
                        <span className="text-[8px] uppercase font-bold text-muted-text block">Health Risk</span>
                        <span className="text-xs font-bold text-white truncate block">{report.healthRisk || '—'}</span>
                      </div>
                    </div>

                    {/* Status bar */}
                    <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-white/5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.color.replace('text-', 'bg-').replace(/\s+\S+/, '')}`} />
                      <span className={`text-[9px] font-bold ${statusInfo.color} truncate`}>{statusInfo.label}</span>
                    </div>

                    {/* Footer: date + location */}
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-text">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatTimestamp(report.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-text">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitizenReports;
