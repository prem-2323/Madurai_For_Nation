import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  Search,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  Wind,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ShieldAlert,
  HeartPulse,
  ClipboardCheck,
  Settings2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PollutionReport, SeverityLevel, MunicipalStatus, ReportStatus } from '../types';
import { fetchMapReports, fetchReportById } from '../api/reports';
import { updateReportDetails } from '../api/hotspots';
import { Modal, EmptyState } from '../components/Common';
import { MunicipalResponseModal } from '../components/MunicipalResponseModal';
import { AirQualityCard } from '../components/AirQualityCard';
import { SkeletonCard } from '../components/Skeleton';
import { CATEGORIES } from '../data';
import { getPublicStatusInfo, STATUS_STAGES, getStageIndex } from '../utils/municipalStatus';

interface OfficerReportsProps {
  reports?: PollutionReport[];
  onUpdateStatus: (id: string, newStatus: ReportStatus) => void;
  onDeleteReport?: (id: string) => void;
  user?: any;
  token?: string | null;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'newest' | 'oldest' | 'severity' | 'aqi';

const SEVERITY_RANK: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const SEVERITY_STYLES: Record<string, { badge: string; stripe: string; glow: string }> = {
  Critical: {
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    stripe: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/10',
  },
  High: {
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    stripe: 'from-orange-500 to-amber-600',
    glow: 'shadow-orange-500/10',
  },
  Medium: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    stripe: 'from-amber-500 to-yellow-500',
    glow: 'shadow-amber-500/10',
  },
  Low: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    stripe: 'from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/10',
  },
};

function getSeverityStyle(severity: SeverityLevel | string) {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.Medium;
}

function getMunicipalStatus(report: PollutionReport): MunicipalStatus {
  const status = report.municipalStatus as MunicipalStatus | undefined;
  if (status && STATUS_STAGES.some((s) => s.key === status)) return status;
  if (report.backendStatus === 'resolved' || report.status === 'Resolved') return 'resolved';
  if (report.backendStatus === 'in_progress' || report.status === 'Action Scheduled') return 'in_progress';
  return 'pending';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string) {
  return id.length > 8 ? `#${id.slice(-6).toUpperCase()}` : `#${id}`;
}

export const OfficerReports: React.FC<OfficerReportsProps> = ({
  reports: initialReports = [],
  onUpdateStatus,
  user,
  token,
}) => {
  const [reports, setReports] = useState<PollutionReport[]>(initialReports);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [selectedReport, setSelectedReport] = useState<PollutionReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [manageReport, setManageReport] = useState<PollutionReport | null>(null);
  const [manageInitial, setManageInitial] = useState({ status: 'pending', officer: '', team: '' });
  const [statusSaving, setStatusSaving] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMapReports(token);
      setReports(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load reports');
      if (initialReports.length) setReports(initialReports);
    } finally {
      setLoading(false);
    }
  }, [token, initialReports]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => getMunicipalStatus(r) === 'pending').length;
    const inProgress = reports.filter((r) =>
      ['under_review', 'team_assigned', 'in_progress'].includes(getMunicipalStatus(r))
    ).length;
    const resolved = reports.filter((r) => getMunicipalStatus(r) === 'resolved').length;
    const critical = reports.filter((r) => r.severity === 'Critical' || r.severity === 'High').length;
    return { total: reports.length, pending, inProgress, resolved, critical };
  }, [reports]);

  const filteredReports = useMemo(() => {
    let list = reports.filter((report) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        report.category.toLowerCase().includes(q) ||
        report.location.toLowerCase().includes(q) ||
        report.description.toLowerCase().includes(q) ||
        report.id.toLowerCase().includes(q) ||
        (report.reporter || '').toLowerCase().includes(q);

      const matchesSeverity = severityFilter === 'All' || report.severity === severityFilter;
      const municipal = getMunicipalStatus(report);
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Pending' && municipal === 'pending') ||
        (statusFilter === 'In Progress' &&
          ['under_review', 'team_assigned', 'in_progress'].includes(municipal)) ||
        (statusFilter === 'Resolved' && municipal === 'resolved');
      const matchesCategory = categoryFilter === 'All' || report.category === categoryFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'newest') return new Date(b.time).getTime() - new Date(a.time).getTime();
      if (sortKey === 'oldest') return new Date(a.time).getTime() - new Date(b.time).getTime();
      if (sortKey === 'severity')
        return (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
      if (sortKey === 'aqi') return (b.airQuality?.aqi || 0) - (a.airQuality?.aqi || 0);
      return 0;
    });

    return list;
  }, [reports, search, severityFilter, statusFilter, categoryFilter, sortKey]);

  const handleViewReport = (report: PollutionReport) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const handleManageReport = async (report: PollutionReport) => {
    setSelectedReport(report);
    const initial = {
      status: getMunicipalStatus(report),
      officer: report.assignedOfficerName || '',
      team: report.assignedTeam || '',
    };
    setManageInitial(initial);
    setManageReport(report);

    if (!token) return;
    try {
      const full = await fetchReportById(report.id, token);
      setManageInitial({
        status: full.municipalStatus || initial.status,
        officer: full.assignedOfficerName || '',
        team: full.assignedTeam || '',
      });
    } catch {
      /* use list defaults */
    }
  };

  const handleSaveStatus = async (data: {
    municipalStatus: string;
    assignedOfficerName: string;
    assignedTeam: string;
  }) => {
    if (!manageReport || !token) return;
    setStatusSaving(true);
    try {
      const result = await updateReportDetails(
        manageReport.id,
        {
          municipalStatus: data.municipalStatus || undefined,
          assignedOfficerName: data.assignedOfficerName || undefined,
          assignedTeam: data.assignedTeam || undefined,
        },
        token
      );

      const updated: PollutionReport = {
        ...manageReport,
        municipalStatus: result.municipalStatus,
        assignedOfficerName: result.assignedOfficerName,
        assignedTeam: result.assignedTeam,
      };

      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedReport((prev) => (prev?.id === updated.id ? updated : prev));
      toast.success('Municipal response updated');
      setManageReport(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setStatusSaving(false);
    }
  };

  const kpiCards = [
    { label: 'Total Reports', value: stats.total, icon: ClipboardList, color: 'text-sky-400', bg: 'from-sky-500/20 to-cyan-500/5' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'from-amber-500/20 to-yellow-500/5' },
    { label: 'In Progress', value: stats.inProgress, icon: AlertTriangle, color: 'text-orange-400', bg: 'from-orange-500/20 to-red-500/5' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-green-500/5' },
    { label: 'High Priority', value: stats.critical, icon: ShieldAlert, color: 'text-red-400', bg: 'from-red-500/20 to-rose-500/5' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            Municipal Operations
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-9 h-9 text-secondary shrink-0" />
            All Reports
          </h1>
          <p className="text-sm text-muted-text max-w-2xl">
            Review, assign, and track every citizen pollution report across Madurai — filter by
            severity, monitor municipal response, and take action.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/officer/hotspots"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/25 text-xs font-semibold text-secondary transition-all"
          >
            <MapPin className="w-4 h-4" />
            Hotspot Map
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${card.bg} p-4`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-text tracking-wider">{card.label}</p>
                <p className="text-2xl font-extrabold text-white mt-1">{card.value}</p>
              </div>
              <card.icon className={`w-5 h-5 ${card.color} shrink-0`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl border border-white/5 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category, location, reporter, or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/5 focus:border-secondary/50 rounded-xl text-sm text-white placeholder-muted-text outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-white/5 rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-muted-text" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-white/5 rounded-xl px-3 py-2">
              <ArrowUpDown className="w-4 h-4 text-muted-text" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="severity">Highest Severity</option>
                <option value="aqi">Highest AQI</option>
              </select>
            </div>
            <div className="flex rounded-xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-secondary/20 text-secondary' : 'bg-slate-950 text-muted-text hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-xs font-semibold transition-all ${
                  viewMode === 'list' ? 'bg-secondary/20 text-secondary' : 'bg-slate-950 text-muted-text hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-text self-center mr-1">Severity</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                severityFilter === s
                  ? 'bg-secondary/15 text-secondary border-secondary/30'
                  : 'bg-slate-950 text-muted-text border-white/5 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="w-px h-6 bg-white/10 mx-1 self-center hidden sm:block" />
          <span className="text-[10px] uppercase font-bold text-muted-text self-center mr-1">Status</span>
          {['All', 'Pending', 'In Progress', 'Resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-slate-950 text-muted-text border-white/5 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between text-xs text-muted-text">
        <span>
          Showing <strong className="text-white">{filteredReports.length}</strong> of{' '}
          <strong className="text-white">{reports.length}</strong> reports
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          description="Try adjusting your filters or refresh to load the latest data from MongoDB."
          icon={<ClipboardList className="w-8 h-8" />}
          actionButton={
            <button
              onClick={loadReports}
              className="px-4 py-2 rounded-xl bg-secondary/15 text-secondary border border-secondary/25 text-xs font-semibold"
            >
              Refresh Reports
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredReports.map((report, index) => {
              const style = getSeverityStyle(report.severity);
              const municipal = getMunicipalStatus(report);
              const statusInfo = getPublicStatusInfo(municipal);
              const stageIdx = getStageIndex(municipal);

              return (
                <motion.article
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 hover:border-white/10 transition-all shadow-xl ${style.glow} hover:shadow-2xl`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.stripe}`} />

                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={report.imageUrl}
                      alt={report.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute top-3 left-4 flex gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {report.severity}
                      </span>
                      {report.airQuality?.aqi ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-950/80 text-sky-300 border-sky-500/30 backdrop-blur-sm">
                          AQI {report.airQuality.aqi}
                        </span>
                      ) : null}
                    </div>
                    <span className="absolute bottom-3 left-4 text-[10px] font-mono text-white/70">
                      {shortId(report.id)}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{report.category}</h3>
                      <p className="text-xs text-muted-text line-clamp-2 mt-1">{report.description}</p>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-muted-text">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>{report.reporter || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>{formatDate(report.time)}</span>
                      </div>
                    </div>

                    {/* Status pipeline */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                        <span className="text-[10px] text-muted-text">{statusInfo.progressPercent}%</span>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_STAGES.map((stage, i) => (
                          <div
                            key={stage.key}
                            className={`h-1 flex-1 rounded-full ${
                              i <= stageIdx ? stage.dotColor : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      {report.assignedOfficerName ? (
                        <p className="text-[10px] text-muted-text mt-2 truncate">
                          Officer: <span className="text-white">{report.assignedOfficerName}</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => handleManageReport(report)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-xs font-semibold text-primary transition-all"
                      >
                        <Settings2 className="w-3.5 h-3.5" /> Manage
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-white/5 text-[10px] text-muted-text font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Report</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReports.map((report) => {
                  const style = getSeverityStyle(report.severity);
                  const statusInfo = getPublicStatusInfo(getMunicipalStatus(report));
                  return (
                    <tr key={report.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 shrink-0">
                            <img src={report.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate">{report.category}</p>
                            <p className="text-[10px] text-muted-text font-mono">{shortId(report.id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-text max-w-[160px] truncate">{report.location}</td>
                      <td className="p-4 text-xs text-muted-text">{report.reporter || 'Anonymous'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="p-4 text-xs text-muted-text whitespace-nowrap">{formatDate(report.time)}</td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/5"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleManageReport(report)}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary border border-primary/25"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Report Details"
        footer={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white rounded-lg"
            >
              Close
            </button>
            {selectedReport && (
              <button
                onClick={() => handleManageReport(selectedReport)}
                className="px-4 py-2 bg-primary hover:bg-emerald-500 text-xs font-bold text-white rounded-lg"
              >
                Manage Municipal Response
              </button>
            )}
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl overflow-hidden border border-white/10 h-52">
                <img src={selectedReport.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-text">Category</span>
                  <p className="text-lg font-bold text-white">{selectedReport.category}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${getSeverityStyle(selectedReport.severity).badge}`}>
                    {selectedReport.severity}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getPublicStatusInfo(getMunicipalStatus(selectedReport)).color} bg-slate-800 border border-white/5`}>
                    {getPublicStatusInfo(getMunicipalStatus(selectedReport)).label}
                  </span>
                </div>
                <div className="text-xs text-muted-text space-y-1">
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-secondary" /> {selectedReport.location}</p>
                  <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-secondary" /> {selectedReport.reporter || 'Anonymous'}</p>
                  <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-secondary" /> {formatDate(selectedReport.time)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <p className="text-xs text-white leading-relaxed">{selectedReport.description}</p>
            </div>

            {selectedReport.airQuality && selectedReport.airQuality.aqi > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase">
                  <Wind className="w-4 h-4" /> Air Quality at Site
                </div>
                <AirQualityCard data={selectedReport.airQuality} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-danger text-[10px] font-bold uppercase">
                  <HeartPulse className="w-3.5 h-3.5" /> Health Risk
                </div>
                <p className="text-xs text-white leading-relaxed">{selectedReport.healthRisk}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-success text-[10px] font-bold uppercase">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Recommendation
                </div>
                <p className="text-xs text-white leading-relaxed">{selectedReport.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <MunicipalResponseModal
        isOpen={!!manageReport}
        onClose={() => setManageReport(null)}
        onSave={handleSaveStatus}
        saving={statusSaving}
        initialStatus={manageInitial.status}
        initialOfficer={manageInitial.officer}
        initialTeam={manageInitial.team}
      />
    </div>
  );
};

export default OfficerReports;
