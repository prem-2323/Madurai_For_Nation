import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { Wind, Thermometer, Droplets } from 'lucide-react';
import { AirQualityData } from '../types';

interface AirQualityCardProps {
  data: AirQualityData | null;
  isLoading?: boolean;
}

const aqiStyles = (level: string) => {
  switch (level) {
    case 'Good':
      return 'text-success border-success/30 bg-success/10';
    case 'Fair':
      return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    case 'Moderate':
      return 'text-warning border-warning/30 bg-warning/10';
    case 'Poor':
      return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
    case 'Very Poor':
      return 'text-danger border-danger/30 bg-danger/10';
    default:
      return 'text-muted-text border-white/5 bg-slate-800/60';
  }
};

export const AirQualityCard: React.FC<AirQualityCardProps> = ({ data, isLoading }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl border border-white/5 p-5 shadow-xl animate-pulse">
        <div className="h-4 w-32 bg-slate-800 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-2xl border border-white/5 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Wind className="w-4 h-4 text-secondary" />
          <h3 className="text-sm font-bold text-white">Live Air Quality</h3>
        </div>
        <p className="text-xs text-muted-text">Live AQI data unavailable for this location.</p>
      </div>
    );
  }

  const pollutants = [
    { label: 'PM2.5', value: data.pm25, unit: 'μg/m³' },
    { label: 'PM10', value: data.pm10, unit: 'μg/m³' },
    { label: 'CO', value: data.co, unit: 'μg/m³' },
    { label: 'NO₂', value: data.no2, unit: 'μg/m³' },
    { label: 'O₃', value: data.o3, unit: 'μg/m³' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl group"
    >
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(14, 165, 233, 0.08), transparent 40%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-center gap-2 p-5 bg-slate-900/40 border-b border-white/5">
        <div className="p-1.5 rounded-lg bg-secondary/15 text-secondary">
          <Wind className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white leading-none">Live Air Quality</h3>
          <span className="text-[10px] text-muted-text font-mono">SOURCE: OPENWEATHER AIR POLLUTION</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60">
            <span className="text-[10px] font-bold uppercase text-muted-text">AQI</span>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full border ${aqiStyles(data.aqiLevel)}`}>
                <FontAwesomeIcon icon={faCircle} className={data.aqiLevel === 'Good' ? 'text-success w-3 h-3' : data.aqiLevel === 'Fair' ? 'text-amber-300 w-3 h-3' : data.aqiLevel === 'Moderate' ? 'text-orange-400 w-3 h-3' : data.aqiLevel === 'Poor' ? 'text-orange-500 w-3 h-3' : 'text-purple-400 w-3 h-3'} /> {data.aqiLevel}
              </span>
              <span className="text-3xl font-extrabold text-white">{data.aqi}</span>
            </div>
            <p className="text-[10px] text-muted-text mt-2">{data.updatedAt ? new Date(data.updatedAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Updated live'}</p>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60">
            <span className="text-[10px] font-bold uppercase text-muted-text">Recommendation</span>
            <p className="mt-3 text-sm font-semibold text-white">
              {data.aqi <= 1 && 'Outdoor activity is safe.'}
              {data.aqi === 2 && 'Air quality is fair. Sensitive groups should take caution.'}
              {data.aqi === 3 && 'Moderate air quality. Reduce prolonged outdoor exertion.'}
              {data.aqi === 4 && 'Poor air quality. Avoid outdoor exercise and wear a mask.'}
              {data.aqi >= 5 && 'Very poor air quality. Stay indoors and keep windows closed.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {pollutants.map((p, index) => (
            <motion.div 
              key={p.label} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, type: "spring" }}
              className="p-3 bg-slate-900/60 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-muted-text block">{p.label}</span>
              <span className="text-sm font-extrabold text-white">{p.value}</span>
              <span className="text-[10px] text-muted-text ml-1">{p.unit}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 bg-slate-900/60 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors flex items-center gap-2"
          >
            <Thermometer className="w-4 h-4 text-orange-400 shrink-0 group-hover:rotate-12 transition-transform" />
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-text block">Temperature</span>
              <span className="text-sm font-extrabold text-white">{data.temperature.toFixed(1)}°C</span>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-3 bg-slate-900/60 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors flex items-center gap-2"
          >
            <Droplets className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-text block">Humidity</span>
              <span className="text-sm font-extrabold text-white">{data.humidity}%</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AirQualityCard;
