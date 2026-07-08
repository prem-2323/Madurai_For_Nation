import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ClipboardList,
  Calendar,
  UserCheck,
  MapPin,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Wind,
  BarChart3,
  HeartPulse,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { CitizenReport } from '../types';
import { fetchMyReports } from '../api/reports';
import { API_BASE_URL } from '../api/analyze';
import {
  getPublicStatusInfo,
  formatTimestamp,
  formatTimeAgo,
  STATUS_STAGES,
  getStageIndex,
  stageOrder,
} from '../utils/municipalStatus';
import { LoadingSpinner, EmptyState } from '../components/Common';

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

const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#1e293b" width="80" height="80"/><text x="40" y="44" text-anchor="middle" fill="#64748b" font-size="24" font-family="sans-serif">📷</text></svg>');

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
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-6 rounded-2xl bg-danger/10 border border-danger/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-danger mx-auto" />
          <p className="text-sm text-danger font-semibold">{error}</p>
          <button
            onClick={loadReports}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white border border-white/5 text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sorted = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">
            Citizen Portal
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-primary" /> My Reports
          </h1>
          <p className="text-sm text-muted-text">
            Track the municipal response progress for your submitted pollution reports.
          </p>
        </div>
        <button
          onClick={loadReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No Reports Yet"
          description="You haven't submitted any pollution reports yet. Go to the Report page to submit one."
          icon={<ClipboardList className="w-8 h-8" />}
        />
      ) : (
        <div className="space-y-6">
          {sorted.map((report, index) => {
            const statusInfo = getPublicStatusInfo(report.municipalStatus);
            const severityBadge = getSeverityBadge(report.severity);
            const currentStageIdx = getStageIndex(report.municipalStatus);

            const historyMap = new Map<string, string>();
            report.reviewHistory.forEach((entry) => {
              historyMap.set(entry.value, entry.reviewedAt);
            });

            return (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-card-dark border border-slate-800 overflow-hidden hover:border-slate-700 transition-all"
              >
                {/* Header with Image */}
                <div className="p-5 pb-4 border-b border-slate-800/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0 flex-1">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-900 flex items-center justify-center text-2xl">
                        {report.image ? (
                          <img
                            src={resolveImageUrl(report.image)}
                            alt={report.category}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.textContent = '📷';
                            }}
                          />
                        ) : (
                          <span>📷</span>
                        )}
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{report.category}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadge}`}>
                            {report.severity}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAQIColor(report.AQI)}`}>
                            AQI {report.AQI}
                          </span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-muted-text leading-relaxed">{report.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xl shrink-0">{statusInfo.emoji}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-800/60">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold flex items-center gap-1">
                      <Wind className="w-3 h-3" /> AQI
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white">{report.AQI || '—'}</span>
                      {report.aqiLevel && (
                        <span className="text-[10px] text-muted-text ml-1">({report.aqiLevel})</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Confidence
                    </span>
                    <span className="text-sm font-bold text-white">{report.confidence}%</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Severity
                    </span>
                    <span className="text-sm font-bold text-white capitalize">{report.severity}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold flex items-center gap-1">
                      <HeartPulse className="w-3 h-3" /> Health Risk
                    </span>
                    <span className="text-sm font-bold text-white leading-tight block">
                      {report.healthRisk || '—'}
                    </span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="p-5 border-b border-slate-800/60">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Municipal Response Progress
                    </span>
                    <span className={`text-xs font-semibold ${statusInfo.color}`}>
                      — {statusInfo.label}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-700" />

                    <div className="space-y-0">
                      {STATUS_STAGES.map((stage, stageIdx) => {
                        const stageHistoryTime = historyMap.get(stage.key);
                        const isCompleted = stageIdx <= currentStageIdx;
                        const isCurrent = stageIdx === currentStageIdx;

                        return (
                          <div key={stage.key} className="relative flex items-start gap-4 pb-5 last:pb-0">
                            <div
                              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                isCompleted
                                  ? stage.key === 'resolved'
                                    ? 'bg-green-500'
                                    : stage.key === 'team_assigned' || stage.key === 'in_progress'
                                    ? 'bg-orange-500'
                                    : stage.key === 'under_review'
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                                  : 'bg-slate-700'
                              }`}
                            >
                              {isCompleted ? (
                                stage.key === 'resolved' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-500" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-bold ${
                                    isCompleted ? 'text-white' : 'text-slate-500'
                                  }`}
                                >
                                  {stage.label}
                                </span>
                                {stageHistoryTime && (
                                  <span className="text-[10px] text-muted-text">
                                    {formatTimestamp(stageHistoryTime)}
                                  </span>
                                )}
                                {isCurrent && !stageHistoryTime && (
                                  <span className="text-[10px] text-primary font-semibold animate-pulse">
                                    Current
                                  </span>
                                )}
                              </div>
                              {isCurrent && (
                                <p className="text-[11px] text-muted-text mt-1 leading-relaxed">
                                  {statusInfo.message}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted-text">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>Submitted: {formatTimestamp(report.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-text">
                      <UserCheck className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>
                        Officer: {report.assignedOfficerName || 'Pending review'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-text">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>
                        Team: {report.assignedTeam || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-text">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>
                        Updated: {report.statusUpdatedAt ? `${formatTimeAgo(report.statusUpdatedAt)} — ${formatTimestamp(report.statusUpdatedAt)}` : '—'}
                      </span>
                    </div>
                  </div>

                  {report.resolvedAt && (
                    <div className="flex items-center gap-2 text-[11px] text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Resolved on: {formatTimestamp(report.resolvedAt)}</span>
                    </div>
                  )}

                  {report.recommendation && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="flex items-start gap-2 text-[11px] text-muted-text">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
                        <span>{report.recommendation}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-muted-text pt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span>{report.location}</span>
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
