import React, { useState, useEffect, useCallback } from 'react';
import { PollutionMap } from '../components/PollutionMap';
import { PollutionHotspot, PollutionReport } from '../types';
import { Map, ShieldCheck } from 'lucide-react';
import { fetchMapReports } from '../api/reports';
import { fetchHotspots } from '../api/hotspots';

interface MapPageProps {
  reports?: PollutionReport[];
  token?: string | null;
}

export const MapPage: React.FC<MapPageProps> = ({ reports: fallbackReports = [], token }) => {
  const [reports, setReports] = useState<PollutionReport[]>(fallbackReports);
  const [hotspots, setHotspots] = useState<PollutionHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReports(fallbackReports);
  }, [fallbackReports]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportResult, hotspotResult] = await Promise.allSettled([
        fetchMapReports(token),
        fetchHotspots(token),
      ]);

      let nextError: string | null = null;

      if (reportResult.status === 'fulfilled') {
        setReports(reportResult.value);
      } else if (fallbackReports.length > 0) {
        setReports(fallbackReports);
        nextError = reportResult.reason instanceof Error ? reportResult.reason.message : 'Failed to load reports';
      } else {
        nextError = reportResult.reason instanceof Error ? reportResult.reason.message : 'Failed to load reports';
      }

      if (hotspotResult.status === 'fulfilled') {
        setHotspots(hotspotResult.value);
      } else {
        setHotspots([]);
        if (!nextError) {
          nextError = hotspotResult.reason instanceof Error ? hotspotResult.reason.message : 'Failed to load hotspots';
        }
      }

      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [token, fallbackReports]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            Spatial Operations Center
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Map className="w-8 h-8 text-secondary" /> Live Pollution Map
          </h1>
          <p className="text-sm text-muted-text">
            Real-time OpenStreetMap view of citizen-reported pollution across Madurai — from garbage burning
            to vehicle emissions, analyzed by Gemini AI and plotted from MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-success font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{reports.length} Reports Loaded</span>
          </div>
        </div>
      </div>

      <PollutionMap reports={reports} hotspots={hotspots} loading={loading} error={error} onRefresh={loadReports} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-card-dark border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white block">Citizen Reports → Map</span>
          <p className="text-xs text-muted-text leading-relaxed">
            Every report submitted via photo upload is analyzed by Gemini AI, enriched with OpenWeather AQI
            data, saved to MongoDB, and instantly plotted as a colored marker on this map.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card-dark border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white block">Severity Color Coding</span>
          <p className="text-xs text-muted-text leading-relaxed">
            Green markers indicate low-risk pollution, yellow for medium severity, and red for high or
            critical incidents — helping municipalities prioritize response areas instantly.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card-dark border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white block">Hotspot Detection Engine</span>
          <p className="text-xs text-muted-text leading-relaxed">
            Hotspots are automatically clustered from reports in the last 24 hours and shown as semi-transparent
            circles with response guidance for municipal crews.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
