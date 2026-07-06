import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  HeartPulse,
  ClipboardCheck,
  Percent,
  Flame,
  Wind,
  AlertTriangle,
  Building2,
  MapPin,
} from 'lucide-react';
import type { AIAnalysisResult, AirQualityData } from '../types';

interface AIResultCardProps {
  isLoading: boolean;
  isAnalyzed: boolean;
  result: AIAnalysisResult | null;
  imageUrl?: string | null;
  airQuality?: AirQualityData | null;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({
  isLoading,
  isAnalyzed,
  result,
  imageUrl,
  airQuality,
}) => {
  const badgeStyles = (level: string) => {
    switch (level) {
      case 'Critical':
      case 'High':
        return 'bg-danger/15 text-danger border-danger/30';
      case 'Medium':
        return 'bg-warning/15 text-warning border-warning/30';
      case 'Low':
        return 'bg-success/15 text-success border-success/30';
      default:
        return 'bg-slate-800 text-muted-text border-white/5';
    }
  };

  const emergencyStyles = (level: string) => {
    switch (level) {
      case 'Red':
        return 'bg-danger/20 text-danger border-danger/40';
      case 'Orange':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Yellow':
        return 'bg-warning/15 text-warning border-warning/30';
      default:
        return 'bg-success/15 text-success border-success/30';
    }
  };

  const pollutionIcon = (type: string) => {
    if (type === 'Clean Environment') return '✅';
    if (type.includes('Water')) return '💧';
    if (type.includes('Smoke') || type.includes('Burning') || type.includes('Emission')) return '🔥';
    if (type.includes('Dust') || type.includes('Construction')) return '🏗️';
    if (type.includes('Vehicle')) return '🚗';
    if (type.includes('Plastic') || type.includes('Waste')) return '🗑️';
    return '⚠️';
  };

  const getAqiBadge = (level: string) => {
    switch (level) {
      case 'Good':
        return { emoji: '🟢', label: 'Good', classes: 'text-success border-success/30 bg-success/10' };
      case 'Fair':
        return { emoji: '🟡', label: 'Fair', classes: 'text-amber-300 border-amber-300/30 bg-amber-300/10' };
      case 'Moderate':
        return { emoji: '🟠', label: 'Moderate', classes: 'text-orange-400 border-orange-400/30 bg-orange-400/10' };
      case 'Poor':
        return { emoji: '🔴', label: 'Poor', classes: 'text-orange-500 border-orange-500/30 bg-orange-500/10' };
      case 'Very Poor':
        return { emoji: '🟣', label: 'Very Poor', classes: 'text-purple-400 border-purple-400/30 bg-purple-400/10' };
      default:
        return { emoji: '⚪', label: level || 'Unknown', classes: 'text-muted-text border-white/5 bg-slate-800/60' };
    }
  };

  const getAqiAdvice = (aqi: number, level: string) => {
    if (aqi <= 1) return 'Outdoor activity is safe.';
    if (aqi === 2) return 'Air quality is fair. Sensitive groups should take caution.';
    if (aqi === 3) return 'Moderate air quality. Reduce prolonged outdoor exertion.';
    if (aqi === 4) return 'Poor air quality. Avoid outdoor exercise and wear a mask.';
    if (aqi >= 5) return 'Very poor air quality. Stay indoors and keep windows closed.';
    return `AQI ${level}. Be cautious.`;
  };

  const formatAqiUpdated = (updatedAt?: string) => {
    if (!updatedAt) return 'Live now';
    const date = new Date(updatedAt);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getAqiComparison = (airQuality: AirQualityData) => {
    const aqiLevel = airQuality.aqiLevel;
    const matchesPollution = ['High', 'Critical'].includes(result?.severity || 'Low');
    if (matchesPollution && airQuality.aqi >= 4) {
      return `Image analysis and measured AQI both indicate severe pollution.`;
    }
    if (matchesPollution && airQuality.aqi <= 2) {
      return `Image shows pollution, but current measured air quality is still ${aqiLevel}.`;
    }
    return `AI image analysis and live AQI are aligned with current conditions.`;
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/5 h-full flex flex-col justify-between overflow-hidden shadow-xl min-h-[360px]">

      <div className="flex items-center gap-2 p-5 bg-slate-900/40 border-b border-white/5">
        <div className="p-1.5 rounded-lg bg-secondary/15 text-secondary">
          <Sparkles className="w-4 h-4 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white leading-none">AI Diagnostics Hub</h3>
          <span className="text-[10px] text-muted-text font-mono">MODEL: GEMINI_2.5_FLASH</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="space-y-6 py-4 text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-emerald-500 font-bold block animate-pulse">Running Gemini Vision Pipeline...</span>
              <span className="text-[10px] text-muted-text block max-w-xs mx-auto">
                Inspecting pollution markers with Gemini Vision and fetching live air quality data for your coordinates...
              </span>
            </div>
          </div>
        ) : !isAnalyzed || !result ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center text-muted-text mx-auto border border-white/5">
              <Sparkles className="w-6 h-6 text-muted-text/70" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Awaiting AI Assessment</span>
              <p className="text-xs text-muted-text max-w-xs mx-auto mt-1 leading-normal">
                Upload a pollution photo, set your location, then tap <strong>Analyze with AI</strong>.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 h-28 bg-slate-950/80">
                <img src={imageUrl} alt="Analyzed" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] font-bold text-muted-text block uppercase tracking-wider">Pollution Type</span>
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>{pollutionIcon(result.pollutionType)}</span>
                  {result.pollutionType}
                </span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 border rounded-lg ${badgeStyles(result.severity)}`}>
                {result.severity}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-secondary" />
                  <span className="text-[10px] font-bold uppercase text-muted-text">Confidence</span>
                </div>
                <span className="text-base font-extrabold text-white">{result.confidence}%</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-secondary to-blue-500 rounded-full"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] font-bold uppercase text-muted-text">Emergency</span>
                </div>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md border ${emergencyStyles(result.emergencyLevel)}`}>
                  {result.emergencyLevel}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text">Priority</span>
              </div>
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md border ${badgeStyles(result.priority || 'Medium')}`}>
                {result.priority || 'Medium'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-muted-text mb-1">
                  <Wind className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">PM2.5 Impact</span>
                </div>
                <span className="text-xs font-bold text-white">{result.estimatedPM25Impact}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-muted-text mb-1">
                  <Wind className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">PM10 Impact</span>
                </div>
                <span className="text-xs font-bold text-white">{result.estimatedPM10Impact}</span>
              </div>
            </div>

            {result.possibleSource && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-start gap-2">
                <Building2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-text block">Possible Source</span>
                  <span className="text-xs text-white">{result.possibleSource}</span>
                </div>
              </div>
            )}

            {result.reason && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold uppercase text-muted-text block mb-1">AI Reasoning</span>
                <p className="text-xs text-white leading-relaxed">{result.reason}</p>
              </div>
            )}

            {airQuality && (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-text">Live AQI</span>
                    <div className={`mt-2 inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-full border ${getAqiBadge(airQuality.aqiLevel).classes}`}>
                      {getAqiBadge(airQuality.aqiLevel).emoji} {getAqiBadge(airQuality.aqiLevel).label}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-text">Updated</span>
                    <p className="text-xs text-white mt-1">{formatAqiUpdated(airQuality.updatedAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-muted-text block">AQI</span>
                    <span className="text-xl font-extrabold text-white">{airQuality.aqi}</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-muted-text block">Recommendation</span>
                    <span className="text-xs text-white block mt-1">{getAqiAdvice(airQuality.aqi, airQuality.aqiLevel)}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-muted-text block mb-2">AI vs AQI Comparison</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-muted-text">
                    <div className="p-2 bg-slate-950/80 rounded-xl border border-white/5">
                      <span className="font-bold text-white block">AI Analysis</span>
                      <span>{result.pollutionType}</span>
                    </div>
                    <div className="p-2 bg-slate-950/80 rounded-xl border border-white/5">
                      <span className="font-bold text-white block">AQI</span>
                      <span>{getAqiBadge(airQuality.aqiLevel).label}</span>
                    </div>
                    <div className="p-2 bg-slate-950/80 rounded-xl border border-white/5">
                      <span className="font-bold text-white block">Conclusion</span>
                      <span>{getAqiComparison(airQuality)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-red-400">
                <HeartPulse className="w-4 h-4 text-danger shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text">Health Risk</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{result.healthRisk}</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-success">
                <ClipboardCheck className="w-4 h-4 text-success shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text">Recommendation</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{result.recommendation}</p>
            </div>

            {result.needsMunicipalAction && (
              <div className="p-3 bg-danger/10 rounded-xl border border-danger/30 flex items-center gap-2">
                <Flame className="w-4 h-4 text-danger shrink-0" />
                <span className="text-xs font-bold text-danger">Municipal action required immediately</span>
              </div>
            )}

            {!result.pollutionDetected && (
              <div className="p-3 bg-success/10 rounded-xl border border-success/30 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-success shrink-0" />
                <span className="text-xs font-bold text-success">Environment appears clean — no pollution detected</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {isAnalyzed && !isLoading && (
        <div className="bg-gradient-to-r from-primary/10 via-secondary/15 to-primary/10 h-1" />
      )}
    </div>
  );
};
