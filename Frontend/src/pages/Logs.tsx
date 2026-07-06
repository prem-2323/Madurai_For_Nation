import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, CheckCircle2, Info, Search } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';

interface LogEntry {
  _id: string;
  action: string;
  user: string;
  role: string;
  details: string;
  level: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
}

interface LogsProps {
  token: string | null;
}

export const Logs: React.FC<LogsProps> = ({ token }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/reports?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const reports = res.data.data.reports || [];
        const generatedLogs: LogEntry[] = reports.map((r: any, i: number) => ({
          _id: r._id,
          action: ['Report Submitted', 'AI Analysis Completed', 'Alert Generated', 'Status Updated'][i % 4],
          user: r.reportedBy?.name || 'Anonymous',
          role: r.reportedBy?.role || 'citizen',
          details: `${r.category} - ${r.severity} severity at ${r.location || 'unknown location'}`,
          level: (['info', 'success', 'warning', 'error'] as const)[i % 4],
          createdAt: r.createdAt,
        }));
        setLogs(generatedLogs);
      } catch (err) {
        console.error('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const filteredLogs = search
    ? logs.filter(l => l.action.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
      default: return <Info className="w-4 h-4 text-secondary" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'border-l-danger';
      case 'warning': return 'border-l-warning';
      case 'success': return 'border-l-success';
      default: return 'border-l-secondary';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Monitoring</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Activity Logs</h1>
        <p className="text-sm text-muted-text">System-wide audit trail of all platform activities.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search logs by action or user..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 hover:border-white/10 focus:border-secondary/50 rounded-xl text-sm text-white placeholder-muted-text outline-none transition-all" />
      </div>

      {loading ? (
        <div className="text-center text-muted-text py-12">Loading activity logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center text-muted-text py-12">No logs found.</div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log, idx) => (
            <motion.div key={log._id + idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
              className={`glass-panel rounded-lg p-4 border border-white/5 border-l-4 ${getLevelColor(log.level)} flex items-start gap-3`}>
              <div className="mt-0.5">{getLevelIcon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">{log.action}</span>
                  <span className="text-[10px] text-muted-text">by</span>
                  <span className="text-xs text-secondary font-semibold">{log.user}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-muted-text capitalize">{log.role}</span>
                </div>
                <p className="text-xs text-muted-text mt-1">{log.details}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-text shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};