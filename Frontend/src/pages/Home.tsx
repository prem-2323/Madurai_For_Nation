import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faRobot, faUserGear, faCheckCircle, faTrash, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { Hero } from '../components/Hero';
import { StatCard } from '../components/StatCard';
import { FeatureCard } from '../components/FeatureCard';
import { Upload, Cpu, MapPin, Database, Sparkles, CheckCircle2, Activity, Clock, UserCheck, Map, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/analyze';

interface LiveActivity {
  id: number;
  action: string;
  location: string;
  time: string;
  type: 'reported' | 'analyzed' | 'assigned' | 'resolved';
}

export const Home: React.FC = () => {
  const [liveFeed, setLiveFeed] = useState<LiveActivity[]>([
    { id: 1, action: 'Industrial emission reported', location: 'SIDCO Industrial Estate', time: '2 min ago', type: 'reported' },
    { id: 2, action: 'AI Analysis Complete', location: 'Vaigai River Bank', time: '8 min ago', type: 'analyzed' },
    { id: 3, action: 'Officer assigned to waste dumping', location: 'KK Nagar', time: '15 min ago', type: 'assigned' },
    { id: 4, action: 'Cleanup completed', location: 'Mattuthavani Bus Stand', time: '32 min ago', type: 'resolved' },
    { id: 5, action: 'New hotspot detected', location: 'Periyar Bus Stand', time: '45 min ago', type: 'reported' },
    { id: 6, action: 'AI re-analysis scheduled', location: 'Goripalayam', time: '1 hour ago', type: 'analyzed' },
  ]);

  const [realtimeAQI, setRealtimeAQI] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeAQI(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(10, Math.min(300, prev + change));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const typeConfig = {
    reported: { icon: <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />, color: 'text-warning', bg: 'bg-warning/10' },
    analyzed: { icon: <FontAwesomeIcon icon={faRobot} className="w-4 h-4" />, color: 'text-secondary', bg: 'bg-secondary/10' },
    assigned: { icon: <FontAwesomeIcon icon={faUserGear} className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10' },
    resolved: { icon: <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />, color: 'text-success', bg: 'bg-success/10' },
  };

  const stats = [
    { title: 'Reports Today', value: 47, change: '12.5%', isPositive: true, iconName: 'FileText', color: 'primary' as const },
    { title: 'Active Hotspots', value: 23, change: '-8.3%', isPositive: false, iconName: 'AlertTriangle', color: 'danger' as const },
    { title: 'AI Accuracy', value: 96.4, change: '2.1%', isPositive: true, iconName: 'Cpu', color: 'warning' as const },
    { title: 'Avg Response Time', value: 4.2, change: '-18%', isPositive: true, iconName: 'Clock', color: 'secondary' as const },
  ];

  const features = [
    { title: 'AI Image Detection', description: 'Upload standard cell phone photographs. Our neural image processors automatically isolate particulate, trash dumps, emissions density, and hazardous leak boundaries.', iconName: 'Cpu' },
    { title: 'Google Maps Integration', description: 'Pinpoints precision latitudes and longitudes from EXIF photo metadata, rendering hyperlocal markers on municipal air quality maps in real-time.', iconName: 'Map' },
    { title: 'Real-Time Dashboard', description: 'Centralized telemetry dashboard for city planners and inspectors to filter reports by severity, track daily logs, and coordinate incident responses.', iconName: 'Activity' },
    { title: 'Pollution Analytics', description: 'Durable trend modeling of PM2.5, PM10, SO2, and VOC levels. Displays visual pie and bar charts detailing pollution categories across city grids.', iconName: 'BarChart3' },
    { title: 'Community Reporting', description: 'Empowers citizens to easily log incidents anonymously or via accounts. Bridging the gap between active neighborhoods and public health officers.', iconName: 'Users' },
    { title: 'Fast AI Recommendations', description: 'Instantly generates clinical health warning assessments and tactical remediation instructions for municipal teams based on environmental profiles.', iconName: 'Sparkles' },
  ];

  const timelineSteps = [
    { number: '01', title: 'Upload Photo', description: 'A citizen logs an incident by uploading a photo of a localized emission or illegal dump via their mobile browser.', icon: <Upload className="w-5 h-5 text-emerald-500" />, glow: 'shadow-emerald-500/10' },
    { number: '02', title: 'AI Analysis', description: 'CleanAir AI analyzes pixels, identifying pollutant category, calculating severity thresholds, and assigning a confidence score.', icon: <Cpu className="w-5 h-5 text-sky-400" />, glow: 'shadow-sky-400/10' },
    { number: '03', title: 'Location Detection', description: 'GPS sensors decode spatial coordinates, pinning the incident to our live map grid with pinpoint precision.', icon: <MapPin className="w-5 h-5 text-rose-400" />, glow: 'shadow-rose-400/10' },
    { number: '04', title: 'Dashboard Update', description: 'The incident enters the municipal queue, immediately alerting regional response coordinators and local dispatchers.', icon: <Database className="w-5 h-5 text-amber-500" />, glow: 'shadow-amber-500/10' },
    { number: '05', title: 'Municipal Action', description: 'Hazard crews and clean-air inspectors resolve the hazard, updating the database logs and notifying the community.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, glow: 'shadow-emerald-400/10' },
  ];

  return (
    <div className="space-y-20 pb-16">

      <Hero />

      {/* ANIMATED STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      {/* LIVE ACTIVITY FEED + AQI WIDGET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-bold text-white">Live Activity</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-2">
              {liveFeed.map((item) => {
                const cfg = typeConfig[item.type];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center text-sm ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.action}</p>
                      <p className="text-[10px] text-muted-text truncate">{item.location}</p>
                    </div>
                    <span className="text-[10px] text-muted-text shrink-0">{item.time}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-bold text-white">Live AQI Index</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                key={realtimeAQI}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-6xl font-extrabold ${
                  realtimeAQI <= 50 ? 'text-success' : realtimeAQI <= 100 ? 'text-warning' : realtimeAQI <= 150 ? 'text-orange-500' : 'text-danger'
                }`}
              >
                {realtimeAQI}
              </motion.div>
              <span className="text-sm text-muted-text mt-2">Madurai City Center</span>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  realtimeAQI <= 50 ? 'bg-success/15 text-success' : realtimeAQI <= 100 ? 'bg-warning/15 text-warning' : realtimeAQI <= 150 ? 'bg-orange-500/15 text-orange-500' : 'bg-danger/15 text-danger'
                }`}>
                  {realtimeAQI <= 50 ? 'Good' : realtimeAQI <= 100 ? 'Fair' : realtimeAQI <= 150 ? 'Unhealthy' : 'Hazardous'}
                </span>
              </div>
              <div className="mt-6 w-full space-y-2">
                <div className="flex justify-between text-[10px] text-muted-text">
                  <span>PM2.5</span>
                  <span>{Math.floor(realtimeAQI * 0.6)} μg/m³</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, realtimeAQI * 0.8)}%` }}
                    className={`h-full rounded-full ${realtimeAQI <= 50 ? 'bg-success' : realtimeAQI <= 100 ? 'bg-warning' : 'bg-danger'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">Advanced Technology</span>
          <h2 className="heading-text text-white">Platform Capabilities</h2>
          <p className="body-text text-muted-text">Explore the high-performance toolsets driving modern municipal climate response pipelines.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => (
            <FeatureCard key={feat.title} title={feat.title} description={feat.description} iconName={feat.iconName} index={index} />
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER SLIDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Impact Showcase</span>
          <h2 className="heading-text text-white">Before & After Cleanup</h2>
          <p className="body-text text-muted-text">Real results from community-driven pollution cleanup efforts.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { before: 'Illegal waste dumping at Vaigai River Bank', after: 'Area cleaned and restored', location: 'Vaigai River Bank', date: 'March 2026' },
            { before: 'Industrial smoke emission in SIDCO', after: 'Factory ordered to install scrubbers', location: 'SIDCO Industrial Estate', date: 'February 2026' },
          ].map((item, i) => (
            <div key={i} className="glass-panel rounded-2xl overflow-hidden group">
              <div className="grid grid-cols-2">
                <div className="relative p-4">
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-danger bg-danger/20 px-2 py-0.5 rounded">Before</span>
                  <div className="h-32 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5">
                    <div className="text-center">
                      <div className="text-2xl mb-1"><FontAwesomeIcon icon={faTrash} className="w-6 h-6 text-red-400" /></div>
                      <span className="text-[10px] text-muted-text">{item.before}</span>
                    </div>
                  </div>
                </div>
                <div className="relative p-4">
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-success bg-success/20 px-2 py-0.5 rounded">After</span>
                  <div className="h-32 rounded-xl bg-gradient-to-br from-primary/20 to-slate-900 flex items-center justify-center border border-primary/20">
                    <div className="text-center">
                      <div className="text-2xl mb-1"><FontAwesomeIcon icon={faLeaf} className="w-6 h-6 text-success" /></div>
                      <span className="text-[10px] text-muted-text">{item.after}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">{item.location}</span>
                  <span className="text-[10px] text-muted-text block">{item.date}</span>
                </div>
                <span className="text-[10px] text-success font-semibold">Resolved <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Workflow Lifecycle</span>
          <h2 className="heading-text text-white">How It Works</h2>
          <p className="body-text text-muted-text">A seamless, data-driven pipeline connecting localized neighborhood reports with city clean-up solutions.</p>
        </div>
        <div className="relative">
          <div className="absolute top-10 left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-primary/30 via-secondary/40 to-emerald-500/20 hidden lg:block pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
            {timelineSteps.map((step, idx) => (
              <motion.div key={step.number} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.15 }} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 group">
                <div className={`w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center relative shadow-lg ${step.glow} group-hover:border-secondary/30 transition-colors duration-300`}>
                  {step.icon}
                  <span className="absolute -top-1 -right-1 bg-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 border border-white/5 rounded-full text-secondary">{step.number}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-md font-bold text-white tracking-tight group-hover:text-secondary transition-colors duration-200">{step.title}</h4>
                  <p className="text-xs text-muted-text leading-relaxed max-w-xs mx-auto lg:mx-0">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
export default Home;
