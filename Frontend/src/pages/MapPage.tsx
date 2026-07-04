import React from 'react';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { PollutionReport } from '../types';
import { Map, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

interface MapPageProps {
  reports: PollutionReport[];
}

export const MapPage: React.FC<MapPageProps> = ({ reports }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Spatial Operations Center</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Map className="w-8 h-8 text-secondary" /> Live Spatial Incident Map
          </h1>
          <p className="text-sm text-muted-text">
            Geospatial mapping grid tracking localized emissions, particulate clouds, water sheen, and illegal dumps reported across Seattle corridors.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-muted-text">
            <Layers className="w-3.5 h-3.5 text-secondary" />
            <span>GIS Satellite Layers: <strong>Active</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-success font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Telemetry Secure</span>
          </div>
        </div>
      </div>

      {/* CORE INTERACTIVE MAP PLACEHOLDER */}
      <MapPlaceholder reports={reports} />

      {/* ADDITIONAL METADATA SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-5 rounded-2xl bg-card-dark border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white block">EXIF Extraction</span>
          <p className="text-xs text-muted-text leading-relaxed">
            The platform automatically processes coordinate metadata contained within uploaded JPEG/HEIC photographs, plotting coordinates to the local municipal grid instantly without human coordination.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card-dark border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white block">Hyperlocal Heat Tracking</span>
          <p className="text-xs text-muted-text leading-relaxed">
            By analyzing the density of high-severity markers in localized grids (such as the Seward Park Industrial Zone), municipal crews can identify chronic compliance violators or drainage leak points.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card-dark border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white block">Public Safety Directives</span>
          <p className="text-xs text-muted-text leading-relaxed">
            When high-severity industrial smoke plumes are logged, localized advisories are immediately made available through map pin audits, outlining respiratory and HEPA filter directives.
          </p>
        </div>

      </div>

    </div>
  );
};
export default MapPage;
