import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Wind, TrendingUp, Thermometer, Droplets, Gauge, CloudRain, AlertTriangle, RefreshCw, ArrowRight, BarChart3, CircleGauge } from 'lucide-react';
import { fetchPrediction } from '../api/prediction';
import type { AQIPrediction } from '../types';
import { SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';

const AQI_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string; label: string }> = {
  Good: { bg: 'bg-green-500/15', border: 'border-green-400/30', text: 'text-green-300', gradient: 'from-green-500/20 to-green-500/5', label: 'Good' },
  Fair: { bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-300', gradient: 'from-emerald-400/20 to-emerald-400/5', label: 'Fair' },
  Moderate: { bg: 'bg-yellow-500/15', border: 'border-yellow-400/30', text: 'text-yellow-300', gradient: 'from-yellow-500/20 to-yellow-500/5', label: 'Moderate' },
  Poor: { bg: 'bg-orange-500/15', border: 'border-orange-400/30', text: 'text-orange-300', gradient: 'from-orange-500/20 to-orange-500/5', label: 'Poor' },
  'Very Poor': { bg: 'bg-red-500/15', border: 'border-red-400/30', text: 'text-red-300', gradient: 'from-red-500/20 to-red-500/5', label: 'Very Poor' },
};

const POLLUTANT_CONFIG = [
  { key: 'currentPM25', label: 'PM2.5', unit: 'μg/m³', color: 'bg-red-500', max: 200 },
  { key: 'pm10', label: 'PM10', unit: 'μg/m³', color: 'bg-orange-500', max: 300 },
  { key: 'no2', label: 'NO₂', unit: 'ppb', color: 'bg-yellow-500', max: 100 },
  { key: 'so2', label: 'SO₂', unit: 'ppb', color: 'bg-purple-500', max: 100 },
  { key: 'co', label: 'CO', unit: 'ppb', color: 'bg-blue-500', max: 50 },
  { key: 'o3', label: 'O₃', unit: 'ppb', color: 'bg-cyan-500', max: 100 },
];

const AQI_GUIDE = [
  { range: '0 - 50', level: 'Good', color: 'text-green-300', desc: 'Air quality is satisfactory.' },
  { range: '51 - 100', level: 'Fair', color: 'text-emerald-300', desc: 'Acceptable. Some concern for sensitive people.' },
  { range: '101 - 150', level: 'Moderate', color: 'text-yellow-300', desc: 'Sensitive groups may experience health effects.' },
  { range: '151 - 200', level: 'Poor', color: 'text-orange-300', desc: 'Health effects for general population.' },
  { range: '201 - 300', level: 'Very Poor', color: 'text-red-300', desc: 'Health alert for everyone.' },
];

const ConfidenceGauge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (confidence / 100) * circumference;
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={confidence >= 80 ? 'text-success' : confidence >= 60 ? 'text-warning' : 'text-danger'}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-extrabold text-white">{confidence}%</span>
      </div>
    </div>
  );
};

const TrendChart: React.FC = () => {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const values = hours.map(() => Math.floor(Math.random() * 150) + 30);
  const maxVal = Math.max(...values);
  return (
    <div className="flex items-end gap-1 h-24">
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / maxVal) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.03 }}
          className={`flex-1 rounded-t-sm ${
            v <= 50 ? 'bg-success/60' : v <= 100 ? 'bg-warning/60' : v <= 150 ? 'bg-orange-500/60' : 'bg-danger/60'
          }`}
          style={{ minHeight: 2 }}
        />
      ))}
    </div>
  );
};

export const AQI: React.FC = () => {
  const [data, setData] = useState<AQIPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPrediction();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load AQI data';
      setError(msg);
      toast.error(msg, { id: 'aqi-fetch-error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const colors = data ? AQI_COLORS[data.risk] || AQI_COLORS.Moderate : AQI_COLORS.Moderate;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Air Quality Index</span>
        <h1 className="heading-text text-white flex items-center gap-2">
          <Wind className="w-8 h-8 text-secondary" /> Live AQI & Prediction
        </h1>
        <p className="body-text text-muted-text">Real-time air quality data and AI-powered 24-hour pollution forecast for Madurai.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.gradient} glass-panel p-6 shadow-xl relative overflow-hidden lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2"><Gauge className="w-4 h-4" /> Current AQI</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>{data.risk}</span>
              </div>
              <div className="flex items-end gap-4">
                <span className="hero-text text-white">{data.currentAQI}</span>
                <span className="text-lg text-muted-text pb-2">AQI</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-text">
                <CloudRain className="w-4 h-4" />
                <span>PM2.5: <strong className="text-white">{data.currentPM25.toFixed(1)}</strong> μg/m³</span>
              </div>
              <div className="mt-4">
                <TrendChart />
                <div className="flex justify-between text-[9px] text-muted-text mt-1">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-white/5 glass-panel p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 24h Prediction</span>
              </div>
              <div className="flex items-end gap-4">
                <span className="hero-text text-white">{data.predictedAQI}</span>
                <span className="text-lg text-muted-text pb-2">AQI</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                {data.trend === 'Increasing' ? <TrendingUp className="w-4 h-4 text-red-400" /> : data.trend === 'Improving' ? <TrendingUp className="w-4 h-4 text-green-400 rotate-180" /> : <ArrowRight className="w-4 h-4 text-yellow-400" />}
                <span className="text-muted-text">Trend: <strong className={data.trend === 'Increasing' ? 'text-red-400' : data.trend === 'Improving' ? 'text-green-400' : 'text-yellow-400'}>{data.trend}</strong></span>
              </div>
              <div className="mt-6 flex flex-col items-center">
                <ConfidenceGauge confidence={data.confidence} />
                <span className="text-[10px] text-muted-text mt-2">Prediction Confidence</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-white/5 glass-panel p-6 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2 mb-4"><Thermometer className="w-4 h-4" /> Weather Conditions</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
                  <span className="text-[10px] text-muted-text uppercase block">Temperature</span>
                  <strong className="text-white text-xl">{data.inputs?.temperature.toFixed(1) ?? '—'}°C</strong>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
                  <span className="text-[10px] text-muted-text uppercase block">Humidity</span>
                  <strong className="text-white text-xl">{data.inputs?.humidity ?? '—'}%</strong>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
                  <span className="text-[10px] text-muted-text uppercase block">Wind Speed</span>
                  <strong className="text-white text-xl">{data.inputs?.windSpeed.toFixed(1) ?? '—'} m/s</strong>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
                  <span className="text-[10px] text-muted-text uppercase block">Nearby Reports</span>
                  <strong className="text-white text-xl">{data.inputs?.nearbyCount ?? 0}</strong>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-white/5 glass-panel p-6 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4" /> Pollutants</span>
              <div className="space-y-3">
                {POLLUTANT_CONFIG.map((p) => {
                  const val = (data as any).inputs?.[p.key] ?? 0;
                  const pct = Math.min(100, (val / p.max) * 100);
                  return (
                    <div key={p.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-text">{p.label}</span>
                        <span className="text-white font-semibold">{val.toFixed(1)} {p.unit}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-full rounded-full ${p.color}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-white/5 glass-panel p-6 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2 mb-4"><CircleGauge className="w-4 h-4" /> AQI Reference Guide</span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {AQI_GUIDE.map((item) => (
                <div key={item.level} className={`p-4 rounded-xl border ${AQI_COLORS[item.level].border} ${AQI_COLORS[item.level].bg} space-y-2`}>
                  <span className="text-[10px] text-muted-text uppercase">{item.range}</span>
                  <span className={`text-sm font-bold block ${item.color}`}>{item.level}</span>
                  <p className="text-[10px] text-muted-text leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      ) : (
        <div className="text-center py-16 space-y-4">
          <Wind className="w-12 h-12 text-muted-text mx-auto" />
          <p className="text-muted-text text-sm">No AQI data available. Check back later.</p>
          <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-secondary text-xs font-semibold transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}
    </div>
  );
};
export default AQI;
