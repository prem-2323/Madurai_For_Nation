import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Wind, TrendingUp, Thermometer, Droplets, Gauge, CloudRain, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { fetchPrediction } from '../api/prediction';
import type { AQIPrediction } from '../types';

const AQI_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string; label: string }> = {
  Good: { bg: 'bg-green-500/15', border: 'border-green-400/30', text: 'text-green-300', gradient: 'from-green-500/20 to-green-500/5', label: 'Good' },
  Fair: { bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-300', gradient: 'from-emerald-400/20 to-emerald-400/5', label: 'Fair' },
  Moderate: { bg: 'bg-yellow-500/15', border: 'border-yellow-400/30', text: 'text-yellow-300', gradient: 'from-yellow-500/20 to-yellow-500/5', label: 'Moderate' },
  Poor: { bg: 'bg-orange-500/15', border: 'border-orange-400/30', text: 'text-orange-300', gradient: 'from-orange-500/20 to-orange-500/5', label: 'Poor' },
  'Very Poor': { bg: 'bg-red-500/15', border: 'border-red-400/30', text: 'text-red-300', gradient: 'from-red-500/20 to-red-500/5', label: 'Very Poor' },
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  Increasing: <TrendingUp className="w-5 h-5 text-red-400" />,
  Improving: <TrendingUp className="w-5 h-5 text-green-400 rotate-180" />,
  Stable: <ArrowRight className="w-5 h-5 text-yellow-400" />,
};

const AQI_GUIDE = [
  { range: '0 - 50', level: 'Good', color: 'text-green-300', desc: 'Air quality is satisfactory, little or no risk.' },
  { range: '51 - 100', level: 'Fair', color: 'text-emerald-300', desc: 'Air quality is acceptable. Some pollutants may be a concern for sensitive people.' },
  { range: '101 - 150', level: 'Moderate', color: 'text-yellow-300', desc: 'Sensitive groups may experience health effects. General public less likely affected.' },
  { range: '151 - 200', level: 'Poor', color: 'text-orange-300', desc: 'Health effects may be felt by the general population. Avoid outdoor activity.' },
  { range: '201 - 300', level: 'Very Poor', color: 'text-red-300', desc: 'Health alert: serious effects on everyone. Avoid all outdoor exertion.' },
];

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
      setError(err instanceof Error ? err.message : 'Failed to load AQI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const colors = data ? AQI_COLORS[data.risk] || AQI_COLORS.Moderate : AQI_COLORS.Moderate;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
          Air Quality Index
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Wind className="w-8 h-8 text-secondary" /> Live AQI & Prediction
        </h1>
        <p className="text-sm text-muted-text">
          Real-time air quality data and AI-powered 24-hour pollution forecast for Madurai.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 animate-pulse space-y-4">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-16 w-24 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.gradient} bg-slate-900/80 p-8 shadow-xl`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <Gauge className="w-4 h-4" /> Current AQI
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
                  {data.risk}
                </span>
              </div>
              <div className="flex items-end gap-4">
                <span className="text-7xl font-extrabold text-white tracking-tight">{data.currentAQI}</span>
                <span className="text-lg text-muted-text pb-2">AQI</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-text">
                <CloudRain className="w-4 h-4" />
                <span>PM2.5: <strong className="text-white">{data.currentPM25.toFixed(1)}</strong> μg/m³</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/5 bg-slate-900/80 p-8 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> 24h Prediction
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-text font-mono">
                    {data.confidence}% confidence
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <span className="text-7xl font-extrabold text-white tracking-tight">{data.predictedAQI}</span>
                <span className="text-lg text-muted-text pb-2">AQI</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {TREND_ICONS[data.trend]}
                <span className="text-muted-text">
                  Trend: <strong className={data.trend === 'Increasing' ? 'text-red-400' : data.trend === 'Improving' ? 'text-green-400' : 'text-yellow-400'}>{data.trend}</strong>
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-xl"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2 mb-4">
                <Thermometer className="w-4 h-4" /> Weather Conditions
              </span>
              <div className="grid grid-cols-2 gap-4">
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

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-xl flex flex-col"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4" /> AI Analysis
              </span>
              <div className="flex-1 p-4 rounded-xl border border-white/5 bg-slate-950/60">
                <p className="text-sm text-white leading-relaxed">{data.reason}</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-text">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Prediction confidence: {data.confidence}%
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/5 bg-slate-900/80 p-6 shadow-xl"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4" /> AQI Reference Guide
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {AQI_GUIDE.map((item) => (
                <div
                  key={item.level}
                  className={`p-4 rounded-xl border ${AQI_COLORS[item.level].border} ${AQI_COLORS[item.level].bg} space-y-2`}
                >
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
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-secondary text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default AQI;
