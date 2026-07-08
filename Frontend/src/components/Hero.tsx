import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShieldAlert, Activity, Map, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-full bg-primary/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/10 w-80 h-80 rounded-full bg-secondary/10 blur-3xl -z-10 pointer-events-none" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full"
            style={{
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text Panel */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* AI Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-xs font-semibold text-secondary"
            >
              <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
              <span>AI-Powered Municipal Air Intelligence</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
            >
              Protect Your City.<br />
              <span className="text-gradient">One Report. One Click.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-text leading-relaxed max-w-2xl"
            >
              AI Detects Pollution Before It Becomes Dangerous. Citizens report, AI analyzes, and municipalities act — all in real-time.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                to="/report"
                className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-white text-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-primary/20 hover:shadow-primary/35"
              >
                <span>Report Pollution</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-white/10 hover:border-secondary/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>View Dashboard</span>
                <Activity className="w-4 h-4 text-secondary" />
              </Link>
            </motion.div>

          </div>

          {/* Right Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.2 },
              scale: { duration: 0.8, delay: 0.2 },
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="lg:col-span-5 relative flex justify-center"
          >
            {/* Ambient Outer Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/15 rounded-3xl filter blur-xl opacity-70 pointer-events-none" />
            
            {/* Main Interactive Map Card */}
            <div className="w-full max-w-[420px] glass-panel rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono text-muted-text">RADAR: HIGH RESOLUTION</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-success">
                  GRID_OK: 99.8%
                </span>
              </div>

              {/* Map Radar Sweep Graphic */}
              <div className="h-64 rounded-xl bg-slate-950/90 relative overflow-hidden border border-white/5 flex items-center justify-center">
                
                {/* Radar Scanline */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  className="absolute inset-0 origin-center pointer-events-none z-20"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 40%, rgba(22, 163, 74, 0.15) 85%, rgba(22, 163, 74, 0.4) 100%)',
                    borderRight: '2px solid rgba(22, 163, 74, 0.6)',
                    boxShadow: '2px 0 10px rgba(22, 163, 74, 0.5)',
                  }}
                />

                {/* Radar rings */}
                <div className="absolute w-4/5 h-4/5 rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-3/5 h-3/5 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-2/5 h-2/5 rounded-full border border-white/5" />
                  </div>
                </div>

                {/* Simulated Nodes on Map */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                  className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-danger border border-white/50 cursor-pointer shadow-lg shadow-danger/50 z-10"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                  className="absolute bottom-1/3 right-1/4 w-3.5 h-3.5 rounded-full bg-warning border border-white/50 cursor-pointer shadow-lg shadow-warning/50 z-10"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
                  className="absolute top-1/2 right-1/3 w-3 h-3 rounded-full bg-success border border-white/50 cursor-pointer shadow-lg shadow-success/50 z-10"
                />

                {/* Crosshairs */}
                <div className="absolute inset-y-0 left-1/2 border-l border-white/5 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-t border-white/5 pointer-events-none" />

                {/* Radar Label Overlay */}
                <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-10">
                  <span className="text-[10px] font-mono text-muted-text flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-white/5">
                    <Map className="w-3 h-3 text-secondary" /> Madurai Urban Center
                  </span>
                </div>
              </div>

              {/* Interactive Status Metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[10px] text-muted-text block mb-1">PM2.5 Index</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-sm font-bold text-white">82 μg/m³</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[10px] text-muted-text block mb-1">Response Rate</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-bold text-white">4.2 min</span>
                  </div>
                </div>
              </div>

              {/* Small floating card: AI Detected notification */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: [-5, 5, -5] }}
                transition={{ 
                  opacity: { duration: 0.6, delay: 0.8 },
                  x: { duration: 0.6, delay: 0.8 },
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 } 
                }}
                className="absolute top-28 right-2 max-w-[180px] p-2.5 rounded-xl bg-slate-900/95 border border-red-500/30 shadow-lg shadow-red-500/5 flex gap-2 items-start z-30"
              >
                <div className="p-1 bg-danger/25 rounded text-danger">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-white block">AI Alert Detected</span>
                  <span className="text-[9px] text-muted-text block leading-normal">Industrial emissions plume detected in Sector 4</span>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
