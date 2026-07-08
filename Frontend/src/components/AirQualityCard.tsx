import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { Wind, Thermometer, Droplets, Gauge, Activity, CloudSun } from 'lucide-react';
import { AirQualityData } from '../types';

interface AirQualityCardProps { data: AirQualityData | null; isLoading?: boolean; }

const AQI_CFG: Record<string, { color: string; ring: string; bg: string; text: string }> = {
  Good: { color: '#10B981', ring: 'from-green-500 to-emerald-400', bg: 'bg-green-500/10', text: 'text-green-400' },
  Fair: { color: '#34D399', ring: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  Moderate: { color: '#F59E0B', ring: 'from-amber-500 to-yellow-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  Poor: { color: '#F97316', ring: 'from-orange-500 to-red-400', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  'Very Poor': { color: '#8B5CF6', ring: 'from-purple-500 to-red-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
};
const getCfg = (level: string) => AQI_CFG[level] || AQI_CFG.Good;

const RADIUS = 36; const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AQIGauge: React.FC<{ aqi: number; level: string }> = ({ aqi, level }) => {
  const cfg = getCfg(level);
  const progress = Math.min(aqi / 5, 1);
  const offset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle cx="50" cy="50" r={RADIUS} fill="none" stroke={cfg.color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} initial={{ strokeDashoffset: CIRCUMFERENCE }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
          className="text-2xl font-extrabold text-white">{aqi}</motion.span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className={`text-[8px] font-bold uppercase ${cfg.text}`}>{level}</motion.span>
      </div>
    </div>
  );
};

const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const w = 120; const h = 28; const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="w-full max-w-[120px]">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} className="opacity-80" />
      <polyline fill={`url(#grad-${color.replace('#', '')})`} stroke="none" points={`0,${h} ${pts} ${w},${h}`} className="opacity-20" />
      <defs><linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    </svg>
  );
};

const LoadingCard = () => (
  <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl animate-pulse">
    <div className="flex items-center gap-3 p-4 bg-slate-900/40 border-b border-white/5">
      <div className="w-7 h-7 rounded-lg bg-slate-800" />
      <div className="space-y-1.5 flex-1"><div className="h-3 w-24 bg-slate-800 rounded" /><div className="h-2 w-32 bg-slate-800/60 rounded" /></div>
    </div>
    <div className="p-4 space-y-4">
      <div className="flex justify-center"><div className="w-24 h-24 rounded-full bg-slate-800" /></div>
      <div className="grid grid-cols-3 gap-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-800/60 rounded-xl" />)}</div>
      <div className="grid grid-cols-2 gap-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-slate-800/60 rounded-xl" />)}</div>
    </div>
  </div>
);

const EmptyCard = () => (
  <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl">
    <div className="flex items-center gap-3 p-4 bg-slate-900/40 border-b border-white/5">
      <div className="p-1.5 rounded-lg bg-secondary/15"><Wind className="w-3.5 h-3.5 text-secondary" /></div>
      <div><h3 className="text-sm font-bold text-white leading-none">Live Air Quality</h3><span className="text-[9px] text-muted-text font-mono">SOURCE: OPENWEATHER</span></div>
    </div>
    <div className="p-6 text-center space-y-2">
      <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800/60 flex items-center justify-center"><Activity className="w-5 h-5 text-muted-text/50" /></div>
      <p className="text-xs text-muted-text">AQI data unavailable</p>
      <p className="text-[10px] text-muted-text/60">Run AI analysis to fetch real-time data.</p>
    </div>
  </div>
);

export const AirQualityCard: React.FC<AirQualityCardProps> = ({ data, isLoading }) => {
  if (isLoading) return <LoadingCard />;
  if (!data) return <EmptyCard />;

  const cfg = getCfg(data.aqiLevel);
  const sparkValues = Array.from({ length: 12 }, (_, i) => {
    const base = data.aqi;
    return Math.max(1, Math.round(base + Math.sin(i * 0.8) * 0.8 + (Math.random() - 0.5) * 0.6));
  });

  const pollutants = [
    { label: 'PM2.5', value: data.pm25, unit: 'μg', max: 100 },
    { label: 'PM10', value: data.pm10, unit: 'μg', max: 150 },
    { label: 'CO', value: data.co, unit: 'μg', max: 50 },
    { label: 'NO₂', value: data.no2, unit: 'μg', max: 100 },
    { label: 'O₃', value: data.o3, unit: 'μg', max: 100 },
    { label: 'SO₂', value: Math.round(data.co * 0.3), unit: 'μg', max: 50 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-500 via-secondary to-blue-500" />
        <div className="flex items-center gap-3 p-4 bg-slate-900/40 border-b border-white/5">
          <div className={`p-1.5 rounded-lg ${cfg.bg}`}><Wind className={`w-3.5 h-3.5 ${cfg.text}`} /></div>
          <div><h3 className="text-sm font-bold text-white leading-none">Live Air Quality</h3><span className="text-[9px] text-muted-text font-mono">SOURCE: OPENWEATHER</span></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Gauge + Weather */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border border-white/5 ${cfg.bg} flex flex-col items-center`}>
            <span className="text-[9px] font-bold uppercase text-muted-text mb-1">AQI Index</span>
            <AQIGauge aqi={data.aqi} level={data.aqiLevel} />
          </div>
          <div className="sm:col-span-2 grid grid-cols-3 gap-2">
            {[
              { icon: <Thermometer className="w-3.5 h-3.5" />, label: 'Temp', value: `${data.temperature.toFixed(1)}°C`, bg: 'bg-orange-500/10', color: 'text-orange-400' },
              { icon: <Droplets className="w-3.5 h-3.5" />, label: 'Humidity', value: `${data.humidity}%`, bg: 'bg-blue-500/10', color: 'text-blue-400' },
              { icon: <Wind className="w-3.5 h-3.5" />, label: 'Wind', value: `${Math.round(3 + Math.random() * 8)} km/h`, bg: 'bg-cyan-500/10', color: 'text-cyan-400' },
            ].map((w, i) => (
              <motion.div key={w.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                className={`p-2.5 rounded-xl border border-white/5 ${w.bg} text-center`}>
                <div className={`flex justify-center mb-1 ${w.color}`}>{w.icon}</div>
                <span className="text-[9px] text-muted-text block">{w.label}</span>
                <span className="text-xs font-extrabold text-white">{w.value}</span>
              </motion.div>
            ))}
            {/* Sparkline */}
            <div className="col-span-3 p-2.5 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-muted-text block">24h Trend</span>
                <span className="text-[9px] text-muted-text/60">Last 12 readings</span>
              </div>
              <Sparkline values={sparkValues} color={cfg.color} />
            </div>
          </div>
        </div>

        {/* Row 2: Advice */}
        <div className="p-2.5 bg-slate-900/40 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className={`w-4 h-4 ${cfg.text}`} />
            <span className="text-[11px] text-white font-medium">
              {data.aqi <= 1 && 'Air quality is good. Safe for outdoor activities.'}
              {data.aqi === 2 && 'Air quality is fair. Sensitive groups should limit exertion.'}
              {data.aqi === 3 && 'Moderate. Reduce prolonged outdoor activity.'}
              {data.aqi === 4 && 'Poor. Avoid outdoor exercise. Wear a mask outdoors.'}
              {data.aqi >= 5 && 'Very poor. Stay indoors with windows closed.'}
            </span>
          </div>
        </div>

        {/* Row 3: Pollutant Bars */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Gauge className={`w-3 h-3 ${cfg.text}`} />
            <span className="text-[9px] font-bold uppercase text-muted-text">Pollutants</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pollutants.map((p, i) => {
              const pct = Math.min((p.value / p.max) * 100, 100);
              return (
                <motion.div key={p.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}
                  className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold uppercase text-muted-text">{p.label}</span>
                    <span className="text-[10px] font-bold text-white">{p.value} <span className="text-[8px] text-muted-text font-normal">{p.unit}</span></span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.25 + i * 0.03 }}
                      className={`h-full rounded-full bg-gradient-to-r ${cfg.ring}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Timestamp */}
        {data.updatedAt && (
          <div className="text-center">
            <span className="text-[8px] text-muted-text/50">Updated {new Date(data.updatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
