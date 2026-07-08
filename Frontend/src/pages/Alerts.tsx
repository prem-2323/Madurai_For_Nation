import React, { useEffect, useState, useMemo } from 'react';
import { fetchAlerts, updateAlertStatus } from '../api/alerts';
import type { AlertData } from '../types';
import { isOfficerOrAdmin } from '../utils/role';

interface AlertsProps {
  token?: string | null;
  user?: any;
}

export const Alerts: React.FC<AlertsProps> = ({ token, user }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    try {
      const updated = await updateAlertStatus(id, newStatus, token);
      setAlerts((prev) => prev.map((a) => (a._id === id ? updated : a)));
    } catch (err) {
      alert('Failed to update alert status');
    }
  };

  const metrics = useMemo(() => {
    let critical = 0, high = 0, medium = 0, resolved = 0;
    alerts.forEach((a) => {
      if (a.status === 'Resolved') resolved++;
      if (a.priority === 'Critical') critical++;
      if (a.priority === 'High') high++;
      if (a.priority === 'Medium') medium++;
    });
    return { critical, high, medium, resolved };
  }, [alerts]);

  const getPriorityEmoji = (p: string) => {
    switch(p) {
      case 'Critical': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusEmoji = (s: string) => {
    switch(s) {
      case 'Pending': return '🟡';
      case 'In Progress': return '🔵';
      case 'Resolved': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left font-mono">
      {/* ASCII Header */}
      <div className="bg-slate-950 p-6 rounded-lg border border-white/10 text-secondary whitespace-pre-wrap flex justify-center text-center shadow-lg">
        {`+--------------------------------------------------------------+
|                 🚨 MUNICIPAL ALERT CENTER                    |
|  AI-generated emergency alerts for city authorities          |
+--------------------------------------------------------------+`}
      </div>

      {/* Summary Metrics */}
      <div className="flex flex-wrap gap-6 text-lg font-bold">
        <span>🔴 Critical Alerts: {metrics.critical}</span>
        <span>🟠 High Alerts: {metrics.high}</span>
        <span>🟡 Medium Alerts: {metrics.medium}</span>
        <span>🟢 Resolved: {metrics.resolved}</span>
      </div>

      <hr className="border-white/10 my-8" />

      {/* Alerts List */}
      {loading ? (
        <div className="text-center text-muted-text">Loading alerts...</div>
      ) : error ? (
        <div className="text-center text-danger">{error}</div>
      ) : alerts.length === 0 ? (
        <div className="text-center text-muted-text">No alerts active at this time.</div>
      ) : (
        <div className="space-y-8">
          {alerts.map((alert, index) => (
            <div key={alert._id} className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-white">
                  🚨 ALERT #{String(index + 1).padStart(3, '0')}
                </span>
                <span className="text-lg font-bold tracking-widest uppercase">
                  [{alert.priority}]
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-text block mb-1">📍 Location</span>
                    <span className="text-white font-semibold text-base">{alert.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block mb-1">🗓 Time</span>
                    <span className="text-white font-semibold text-base">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block mb-1">🔥 Pollution Type</span>
                    <span className="text-white font-semibold text-base">{alert.pollutionType}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block mb-1">🎯 Severity</span>
                    <span className="text-white font-semibold text-base">{alert.severity}%</span>
                  </div>
                  <div>
                    <span className="text-muted-text block mb-1">🌍 Current AQI</span>
                    <span className="text-white font-semibold text-base">{alert.aqi}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block mb-1">📈 Predicted AQI</span>
                    <span className="text-white font-semibold text-base">{alert.predictedAQI}</span>
                  </div>
                </div>

                <div className="mt-4 bg-slate-950 p-4 rounded-md border border-white/5">
                  <span className="text-muted-text block mb-1">🤖 AI Reason</span>
                  <span className="text-white font-semibold">{alert.reason}</span>
                </div>

                <div className="mt-4">
                  <span className="text-muted-text block mb-1">🚒 Suggested Action</span>
                  <ul className="text-secondary font-semibold list-disc pl-5">
                    <li>{alert.suggestedAction}</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <span className="text-muted-text font-bold">Status:</span>
                  <span className="font-bold text-lg">{getStatusEmoji(alert.status)} {alert.status}</span>
                </div>

                <div className="flex gap-4 mt-6">
                  {isOfficerOrAdmin(user) && alert.status !== 'In Progress' && alert.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(alert._id, 'In Progress')}
                      className="px-6 py-2 bg-primary hover:bg-primary/80 text-white font-bold rounded shadow-lg transition-colors border border-white/10"
                    >
                      [Dispatch Team]
                    </button>
                  )}
                  {isOfficerOrAdmin(user) && alert.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(alert._id, 'Resolved')}
                      className="px-6 py-2 bg-success hover:bg-success/80 text-white font-bold rounded shadow-lg transition-colors border border-white/10"
                    >
                      [Mark Resolved]
                    </button>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
