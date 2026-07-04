import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, HeartPulse, ClipboardCheck, Percent, Flame } from 'lucide-react';
import { SeverityLevel } from '../types';

interface AIResultCardProps {
  isLoading: boolean;
  isAnalyzed: boolean;
  result: {
    category: string;
    severity: SeverityLevel;
    confidence: number;
    healthRisk: string;
    recommendation: string;
  } | null;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({
  isLoading,
  isAnalyzed,
  result,
}) => {
  const badgeStyles = (level: SeverityLevel) => {
    switch (level) {
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

  return (
    <div className="glass-panel rounded-2xl border border-white/5 h-full flex flex-col justify-between overflow-hidden shadow-xl min-h-[360px]">
      
      {/* Card Header */}
      <div className="flex items-center gap-2 p-5 bg-slate-900/40 border-b border-white/5">
        <div className="p-1.5 rounded-lg bg-secondary/15 text-secondary">
          <Sparkles className="w-4 h-4 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white leading-none">AI Diagnostics Hub</h3>
          <span className="text-[10px] text-muted-text font-mono">MODEL_ALIAS: GEMINI_2.5_FLASH</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {isLoading ? (
          /* Loading Assessment HUD */
          <div className="space-y-6 py-4 text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-emerald-500 font-bold block animate-pulse">Running Neural Image Pipeline...</span>
              <span className="text-[10px] text-muted-text block max-w-xs mx-auto">Extracting metadata, matching pollution profiles, and calculating toxic emission scores...</span>
            </div>
          </div>
        ) : !isAnalyzed || !result ? (
          /* Empty / Prompt State */
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center text-muted-text mx-auto border border-white/5">
              <Sparkles className="w-6 h-6 text-muted-text/70" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Awaiting AI Assessment</span>
              <p className="text-xs text-muted-text max-w-xs mx-auto mt-1 leading-normal">
                Upload or select a pollution scene photograph on the left, then trigger the <strong>Analyze with AI</strong> command.
              </p>
            </div>
          </div>
        ) : (
          /* Active Results Display */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            {/* Top Row: Type & Severity */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] font-bold text-muted-text block uppercase tracking-wider">Detected Category</span>
                <span className="text-sm font-extrabold text-white">{result.category}</span>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 border rounded-lg ${badgeStyles(result.severity)}`}>
                  {result.severity} Severity
                </span>
              </div>
            </div>

            {/* Assessment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Confidence Meter */}
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <Percent className="w-4 h-4" />
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

              {/* Status Badge */}
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase text-muted-text">Alert Code</span>
                </div>
                <span className="text-xs font-extrabold text-white block mt-0.5">
                  {result.severity === 'High' ? 'CRIT-A1_URGENT' : result.severity === 'Medium' ? 'WARN-B2_MONITOR' : 'INFO-C3_RECORD'}
                </span>
                <span className="text-[9px] text-muted-text block mt-1 leading-none">Automated alert generation active</span>
              </div>

            </div>

            {/* Health Risk */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-red-400">
                <HeartPulse className="w-4.5 h-4.5 text-danger shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text">Biological & Health Risks</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{result.healthRisk}</p>
            </div>

            {/* Recommendation */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-success">
                <ClipboardCheck className="w-4.5 h-4.5 text-success shrink-0" />
                <span className="text-[10px] font-bold uppercase text-muted-text">Action Recommendation</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{result.recommendation}</p>
            </div>

          </motion.div>
        )}
      </div>

      {/* Decorative footer glow */}
      {isAnalyzed && !isLoading && (
        <div className="bg-gradient-to-r from-primary/10 via-secondary/15 to-primary/10 h-1" />
      )}
    </div>
  );
};
