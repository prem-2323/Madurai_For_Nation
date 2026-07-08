import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faDroplet, faFire, faHardHat, faCar, faTrash, faTriangleExclamation, faCircle,
} from '@fortawesome/free-solid-svg-icons';
import {
  Sparkles, HeartPulse, ClipboardCheck, Percent, Flame, Wind, AlertTriangle, Building2, MapPin,
  BrainCircuit, ShieldCheck, Gauge, Activity, Eye, Upload, Target, BookOpen, Thermometer,
} from 'lucide-react';
import type { AIAnalysisResult, AirQualityData } from '../types';

interface AIResultCardProps {
  isLoading: boolean; isAnalyzed: boolean; result: AIAnalysisResult | null;
  imageUrl?: string | null; airQuality?: AirQualityData | null;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: <Target className="w-3 h-3" /> },
  { id: 'environment', label: 'Environment', icon: <Wind className="w-3 h-3" /> },
  { id: 'health', label: 'Health', icon: <HeartPulse className="w-3 h-3" /> },
  { id: 'recommendation', label: 'Action', icon: <BookOpen className="w-3 h-3" /> },
];

const badgeStyles = (level: string) => {
  switch (level) {
    case 'Critical': case 'High': return 'bg-danger/15 text-danger border-danger/30';
    case 'Medium': return 'bg-warning/15 text-warning border-warning/30';
    case 'Low': return 'bg-success/15 text-success border-success/30';
    default: return 'bg-slate-800 text-muted-text border-white/5';
  }
};

const emergencyStyles = (level: string) => {
  switch (level) {
    case 'Red': return 'bg-danger/20 text-danger border-danger/40';
    case 'Orange': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Yellow': return 'bg-warning/15 text-warning border-warning/30';
    default: return 'bg-success/15 text-success border-success/30';
  }
};

const pollutionIcon = (type: string) => {
  if (type === 'Clean Environment') return <FontAwesomeIcon icon={faCheckCircle} className="text-success w-4 h-4" />;
  if (type.includes('Water')) return <FontAwesomeIcon icon={faDroplet} className="text-blue-400 w-4 h-4" />;
  if (type.includes('Smoke') || type.includes('Burning') || type.includes('Emission')) return <FontAwesomeIcon icon={faFire} className="text-orange-500 w-4 h-4" />;
  if (type.includes('Dust') || type.includes('Construction')) return <FontAwesomeIcon icon={faHardHat} className="text-yellow-500 w-4 h-4" />;
  if (type.includes('Vehicle')) return <FontAwesomeIcon icon={faCar} className="text-sky-400 w-4 h-4" />;
  if (type.includes('Plastic') || type.includes('Waste')) return <FontAwesomeIcon icon={faTrash} className="text-gray-400 w-4 h-4" />;
  return <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-500 w-4 h-4" />;
};

const getAqiBadge = (level: string) => {
  const map: Record<string, { icon: JSX.Element; label: string; classes: string }> = {
    Good: { icon: <FontAwesomeIcon icon={faCircle} className="text-success w-2.5 h-2.5" />, label: 'Good', classes: 'text-success border-success/30 bg-success/10' },
    Fair: { icon: <FontAwesomeIcon icon={faCircle} className="text-amber-300 w-2.5 h-2.5" />, label: 'Fair', classes: 'text-amber-300 border-amber-300/30 bg-amber-300/10' },
    Moderate: { icon: <FontAwesomeIcon icon={faCircle} className="text-orange-400 w-2.5 h-2.5" />, label: 'Moderate', classes: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
    Poor: { icon: <FontAwesomeIcon icon={faCircle} className="text-orange-500 w-2.5 h-2.5" />, label: 'Poor', classes: 'text-orange-500 border-orange-500/30 bg-orange-500/10' },
    'Very Poor': { icon: <FontAwesomeIcon icon={faCircle} className="text-purple-400 w-2.5 h-2.5" />, label: 'Very Poor', classes: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
  };
  return map[level] || { icon: <FontAwesomeIcon icon={faCircle} className="text-muted-text w-2.5 h-2.5" />, label: level || 'Unknown', classes: 'text-muted-text border-white/5 bg-slate-800/60' };
};

const getAqiAdvice = (aqi: number) => {
  if (aqi <= 1) return 'Outdoor activity is safe.';
  if (aqi === 2) return 'Fair. Sensitive groups take caution.';
  if (aqi === 3) return 'Moderate. Reduce prolonged exertion.';
  if (aqi === 4) return 'Poor. Avoid outdoor exercise, wear a mask.';
  return 'Very poor. Stay indoors, keep windows closed.';
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = 'text-secondary' }) => (
  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className={color}>{icon}</span>
      <span className="text-[9px] font-bold uppercase text-muted-text">{label}</span>
    </div>
    <span className="text-xs font-bold text-white">{value}</span>
  </div>
);

export const AIResultCard: React.FC<AIResultCardProps> = ({ isLoading, isAnalyzed, result, imageUrl, airQuality }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-xl h-full">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-purple-500" />
        <div className="flex items-center gap-3 p-4 bg-slate-900/40 border-b border-white/5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary/20 to-purple-500/20">
            <BrainCircuit className="w-3.5 h-3.5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-none">AI Diagnostics Hub</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-gradient-to-r from-purple-500/15 to-secondary/15 text-purple-300 border border-purple-500/20">
                <Sparkles className="w-2 h-2" /> GEMINI_2.5_FLASH
              </span>
              {isAnalyzed && <span className="flex items-center gap-1 text-[8px] text-success/80"><ShieldCheck className="w-2 h-2" /> Active</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isAnalyzed && result && (
        <div className="flex bg-slate-900/60 border-b border-white/5 p-1 gap-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeTab === tab.id ? 'bg-slate-800 text-white border border-white/5 shadow-sm' : 'text-muted-text hover:text-white hover:bg-slate-800/40'
              }`}
            >{tab.icon}{tab.label}</button>
          ))}
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-12 h-12 border-[3px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-1"><Sparkles className="w-4 h-4 text-emerald-400" /></motion.div>
              </div>
              <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-xs text-emerald-500 font-bold block">Running Gemini Vision Pipeline...</motion.span>
              <span className="text-[10px] text-muted-text block max-w-xs mx-auto leading-relaxed">Inspecting pollution markers and fetching live air quality data...</span>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary" animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />)}
              </div>
            </div>
          </div>
        ) : !isAnalyzed || !result ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800/80 rounded-xl flex items-center justify-center mx-auto border border-white/5"><Eye className="w-5 h-5 text-muted-text/50" /></div>
              <span className="text-sm font-bold text-white block">Awaiting AI Assessment</span>
              <div className="space-y-1.5 text-left max-w-[200px] mx-auto">
                {[
                  { icon: <Upload className="w-2.5 h-2.5" />, text: 'Upload a pollution photo' },
                  { icon: <MapPin className="w-2.5 h-2.5" />, text: 'Set your location' },
                  { icon: <Sparkles className="w-2.5 h-2.5" />, text: 'Tap "Analyze with AI"' },
                ].map((s, i) => <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-text"><span className="text-secondary shrink-0">{s.icon}</span>{s.text}</div>)}
              </div>
            </div>
          </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
            {/* Image thumbnail (shown in all tabs) */}
            {imageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-white/10 h-20 bg-slate-950/80">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <motion.div initial={{ top: '-10%' }} animate={{ top: '110%' }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }} className="absolute left-0 right-0 h-0.5 bg-secondary/60 shadow-[0_0_10px_rgba(34,197,94,0.6)] z-10" />
              </div>
            )}

            {/* === OVERVIEW TAB === */}
            {activeTab === 'overview' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[9px] font-bold text-muted-text block uppercase tracking-wider">Pollution Type</span>
                    <span className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                      {pollutionIcon(result.pollutionType)} {result.pollutionType}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 border rounded-lg ${badgeStyles(result.severity)}`}>{result.severity}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MetricCard label="Confidence" value={`${result.confidence}%`} icon={<Percent className="w-3 h-3" />} />
                  <MetricCard label="Emergency" value={result.emergencyLevel} icon={<AlertTriangle className="w-3 h-3" />} color="text-orange-400" />
                  <MetricCard label="Priority" value={result.priority || 'Medium'} icon={<Gauge className="w-3 h-3" />} color="text-danger" />
                  <MetricCard label="Source" value={result.possibleSource || 'Unknown'} icon={<Building2 className="w-3 h-3" />} color="text-secondary" />
                </div>
              </div>
            )}

            {/* === ENVIRONMENT TAB === */}
            {activeTab === 'environment' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="PM2.5 Impact" value={result.estimatedPM25Impact} icon={<Wind className="w-3 h-3" />} />
                  <MetricCard label="PM10 Impact" value={result.estimatedPM10Impact} icon={<Wind className="w-3 h-3" />} />
                </div>
                {result.reason && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold uppercase text-muted-text block mb-1">AI Reasoning</span>
                    <p className="text-[11px] text-white leading-relaxed">{result.reason}</p>
                  </div>
                )}
                {airQuality && (
                  <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-white/5">
                      <span className="text-[9px] uppercase font-bold text-muted-text">Live AQI</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getAqiBadge(airQuality.aqiLevel).classes}`}>
                          {getAqiBadge(airQuality.aqiLevel).icon}{getAqiBadge(airQuality.aqiLevel).label}</span>
                        <span className="text-[9px] text-muted-text">{airQuality.aqi}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3">
                      <div className="text-center"><span className="text-[8px] uppercase font-bold text-muted-text block">AQI</span><span className="text-lg font-extrabold text-white">{airQuality.aqi}</span></div>
                      <div className="text-center"><span className="text-[8px] uppercase font-bold text-muted-text block">Temp</span><span className="text-lg font-extrabold text-white">{airQuality.temperature.toFixed(0)}°</span></div>
                      <div className="text-center"><span className="text-[8px] uppercase font-bold text-muted-text block">Humidity</span><span className="text-lg font-extrabold text-white">{airQuality.humidity}%</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === HEALTH TAB === */}
            {activeTab === 'health' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HeartPulse className="w-3.5 h-3.5 text-danger" />
                    <span className="text-[9px] font-bold uppercase text-muted-text">Health Risk</span>
                  </div>
                  <p className="text-[11px] text-white leading-relaxed">{result.healthRisk}</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-success" />
                    <span className="text-[9px] font-bold uppercase text-muted-text">Recommendation</span>
                  </div>
                  <p className="text-[11px] text-white leading-relaxed">{result.recommendation}</p>
                </div>
                {airQuality && (
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] text-muted-text">Air Quality Advice</span>
                    <span className="text-[11px] text-white font-medium">{getAqiAdvice(airQuality.aqi)}</span>
                  </div>
                )}
              </div>
            )}

            {/* === ACTION TAB === */}
            {activeTab === 'recommendation' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold uppercase text-muted-text block mb-1">AI Recommendation</span>
                  <p className="text-[11px] text-white leading-relaxed">{result.recommendation}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {result.needsMunicipalAction && (
                    <div className="p-2.5 bg-danger/10 rounded-xl border border-danger/30 flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-danger shrink-0" />
                      <span className="text-[10px] font-bold text-danger">Municipal action required</span>
                    </div>
                  )}
                  {!result.pollutionDetected && (
                    <div className="p-2.5 bg-success/10 rounded-xl border border-success/30 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-success shrink-0" />
                      <span className="text-[10px] font-bold text-success">Clean environment</span>
                    </div>
                  )}
                </div>
                {result.possibleSource && (
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5 flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-text block">Source</span>
                      <span className="text-[11px] text-white">{result.possibleSource}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
      {isAnalyzed && !isLoading && <div className="bg-gradient-to-r from-primary/10 via-secondary/15 to-primary/10 h-0.5" />}
    </motion.div>
  );
};
