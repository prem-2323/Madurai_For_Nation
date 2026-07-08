import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowUpDown, ShieldAlert, CheckCircle2, AlertCircle, Eye, Calendar } from 'lucide-react';
import { PollutionReport, SeverityLevel, ReportStatus } from '../types';
import { isOfficerOrAdmin } from '../utils/role';

interface ReportTableProps {
  reports: PollutionReport[];
  onViewReport: (report: PollutionReport) => void;
  onUpdateStatus: (id: string, newStatus: ReportStatus) => void;
  onDeleteReport?: (id: string) => void;
  user?: any;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onViewReport,
  onUpdateStatus,
  onDeleteReport,
  user,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Filter & Search Logic
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'All' || report.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || report.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'High':
        return 'bg-danger/15 text-danger border-danger/35';
      case 'Medium':
        return 'bg-warning/15 text-warning border-warning/35';
      case 'Low':
        return 'bg-success/15 text-success border-success/35';
      default:
        return 'bg-slate-800 text-muted-text border-white/5';
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Reported':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'AI Analyzed':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Action Scheduled':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Resolved':
        return 'bg-success/10 text-success border-success/20';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search reports by ID, category, coordinates, or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 hover:border-white/10 focus:border-secondary/50 rounded-xl text-sm text-white placeholder-muted-text outline-none transition-all"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex gap-2 shrink-0">
          <div className="relative flex items-center bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 gap-2 text-sm text-muted-text">
            <Filter className="w-4 h-4" />
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white text-xs font-semibold outline-none border-none cursor-pointer pr-4"
            >
              <option value="All">All Severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex items-center bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 gap-2 text-sm text-muted-text">
            <Filter className="w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white text-xs font-semibold outline-none border-none cursor-pointer pr-4"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="AI Analyzed">AI Analyzed</option>
              <option value="Action Scheduled">Action Scheduled</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div 
        className="relative glass-panel rounded-2xl overflow-hidden shadow-2xl group"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-30 pointer-events-none group-hover:opacity-100 transition-opacity duration-1000 bg-[length:200%_auto] animate-gradient" />
        <div className="absolute inset-[1px] bg-slate-950 rounded-2xl z-0" />
        
        {/* Spotlight effect */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(14, 165, 233, 0.05), transparent 40%)`,
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-900/80 border-b border-white/5 text-xs text-muted-text font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Report ID</th>
                <th className="p-4">Pollution Scenario</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Location</th>
                <th className="p-4">Time Logged</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action Hub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    layoutId={`row-${report.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative hover:bg-white/[0.02] transition-colors group/row cursor-pointer"
                  >
                    {/* Hover Indicator left bar */}
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-secondary opacity-0 group-hover/row:opacity-100 transition-opacity pointer-events-none" />

                    {/* ID & Miniature Image */}
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5">
                          <img
                            src={report.imageUrl}
                            alt={report.category}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span>{report.id}</span>
                      </div>
                    </td>

                    {/* Scenario */}
                    <td className="p-4 font-medium text-white max-w-[200px]">
                      <span className="block font-bold">{report.category}</span>
                      <span className="block text-xs text-muted-text truncate mt-0.5">{report.description}</span>
                    </td>

                    {/* Severity */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getSeverityBadge(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-xs text-muted-text max-w-[150px] truncate whitespace-nowrap">
                      {report.location}
                    </td>

                    {/* Time */}
                    <td className="p-4 text-xs text-muted-text whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                        <span>{formatDate(report.time)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-lg ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </td>

                    {/* Action Hub */}
                    <td className="p-4 text-right pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inspect detail */}
                        <button
                          onClick={() => onViewReport(report)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-secondary text-muted-text border border-white/5 transition-all"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Quick toggle status - Officer/Admin only */}
                        {isOfficerOrAdmin(user) && report.status !== 'Resolved' ? (
                          <button
                            onClick={() => {
                              const nextStatusMap: Record<ReportStatus, ReportStatus> = {
                                'Reported': 'AI Analyzed',
                                'AI Analyzed': 'Action Scheduled',
                                'Action Scheduled': 'Resolved',
                                'Resolved': 'Resolved'
                              };
                              onUpdateStatus(report.id, nextStatusMap[report.status]);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-xs font-semibold transition-all"
                            title="Advance Workflow Status"
                          >
                            Advance Status
                          </button>
                        ) : report.status === 'Resolved' ? (
                          <span className="flex items-center gap-1 text-success text-xs font-semibold px-2 py-1">
                            <CheckCircle2 className="w-4 h-4 text-success" /> Resolved
                          </span>
                        ) : null}


                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-muted-text/60" />
                      <span className="text-sm font-bold text-white">No environmental reports matched search criteria</span>
                      <span className="text-xs text-muted-text">Try resetting filters or expanding search query terms.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="relative z-10 bg-slate-900/60 border-t border-white/5 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-muted-text">
            Showing <strong className="text-white">{filteredReports.length ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-white">{Math.min(startIndex + itemsPerPage, filteredReports.length)}</strong> of{' '}
            <strong className="text-white">{filteredReports.length}</strong> reports
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-all disabled:pointer-events-none"
            >
              Previous
            </button>
            <span className="flex items-center text-xs text-muted-text px-2">
              Page <strong className="text-white mx-1">{currentPage}</strong> of <strong className="text-white mx-1">{totalPages}</strong>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-all disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
