import React from 'react';
import { motion } from 'motion/react';
import { Hero } from '../components/Hero';
import { StatCard } from '../components/StatCard';
import { FeatureCard } from '../components/FeatureCard';
import { Upload, Cpu, MapPin, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export const Home: React.FC = () => {
  const stats = [
    { title: 'Total Reports', value: '1,842', change: '14.2%', isPositive: true, iconName: 'FileText', color: 'primary' },
    { title: 'Active Hotspots', value: '142', change: '-8.5%', isPositive: false, iconName: 'AlertTriangle', color: 'danger' },
    { title: 'Municipal Teams', value: '28 Active', change: '3.1%', isPositive: true, iconName: 'Users', color: 'secondary' },
    { title: 'AI Accuracy', value: '96.4%', change: '2.1%', isPositive: true, iconName: 'Cpu', color: 'warning' },
  ];

  const features = [
    {
      title: 'AI Image Detection',
      description: 'Upload standard cell phone photographs. Our neural image processors automatically isolate particulate, trash dumps, emissions density, and hazardous leak boundaries.',
      iconName: 'Cpu',
    },
    {
      title: 'Google Maps Integration',
      description: 'Pinpoints precision latitudes and longitudes from EXIF photo metadata, rendering hyperlocal markers on municipal air quality maps in real-time.',
      iconName: 'Map',
    },
    {
      title: 'Real-Time Dashboard',
      description: 'Centralized telemetry dashboard for city planners and inspectors to filter reports by severity, track daily logs, and coordinate incident responses.',
      iconName: 'Activity',
    },
    {
      title: 'Pollution Analytics',
      description: 'Durable trend modeling of PM2.5, PM10, SO2, and VOC levels. Displays visual pie and bar charts detailing pollution categories across city grids.',
      iconName: 'BarChart3',
    },
    {
      title: 'Community Reporting',
      description: 'Empowers citizens to easily log incidents anonymously or via accounts. Bridging the gap between active neighborhoods and public health officers.',
      iconName: 'Users',
    },
    {
      title: 'Fast AI Recommendations',
      description: 'Instantly generates clinical health warning assessments and tactical remediation instructions for municipal teams based on environmental profiles.',
      iconName: 'Sparkles',
    },
  ];

  const timelineSteps = [
    {
      number: '01',
      title: 'Upload Photo',
      description: 'A citizen logs an incident by uploading a photo of a localized emission or illegal dump via their mobile browser.',
      icon: <Upload className="w-5 h-5 text-emerald-500" />,
      glow: 'shadow-emerald-500/10'
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'CleanAir AI analyzes pixels, identifying pollutant category, calculating severity thresholds, and assigning a confidence score.',
      icon: <Cpu className="w-5 h-5 text-sky-400" />,
      glow: 'shadow-sky-400/10'
    },
    {
      number: '03',
      title: 'Location Detection',
      description: 'GPS sensors decode spatial coordinates, pinning the incident to our live map grid with pinpoint precision.',
      icon: <MapPin className="w-5 h-5 text-rose-400" />,
      glow: 'shadow-rose-400/10'
    },
    {
      number: '04',
      title: 'Dashboard Update',
      description: 'The incident enters the municipal queue, immediately alerting regional response coordinators and local dispatchers.',
      icon: <Database className="w-5 h-5 text-amber-500" />,
      glow: 'shadow-amber-500/10'
    },
    {
      number: '05',
      title: 'Municipal Action',
      description: 'Hazard crews and clean-air inspectors resolve the hazard, updating the database logs and notifying the community.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      glow: 'shadow-emerald-400/10'
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* HERO SECTION */}
      <Hero />

      {/* STATISTICS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Operational Telemetry</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Platform Telemetry & Metrics</h2>
          <p className="text-sm text-muted-text">Real-time statistics detailing active incident logs, AI processing efficacy, and city response coordination.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              isPositive={stat.isPositive}
              iconName={stat.iconName}
              color={stat.color as any}
            />
          ))}
        </div>
      </section>

      {/* CORE CAPABILITIES / FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">Advanced Technology</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Platform Capabilities</h2>
          <p className="text-sm text-muted-text">Explore the high-performance toolsets driving modern municipal climate response pipelines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => (
            <FeatureCard
              key={feat.title}
              title={feat.title}
              description={feat.description}
              iconName={feat.iconName}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS / TIMELINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Workflow Lifecycle</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">How It Works</h2>
          <p className="text-sm text-muted-text">A seamless, data-driven pipeline connecting localized neighborhood reports with city clean-up solutions.</p>
        </div>

        {/* Dynamic Horizontal Timeline for larger screens, Vertical list for smaller screens */}
        <div className="relative">
          {/* Timeline connecting line (desktop-only) */}
          <div className="absolute top-10 left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-primary/30 via-secondary/40 to-emerald-500/20 hidden lg:block pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
            {timelineSteps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 group"
              >
                {/* Step Circle with Icon */}
                <div className={`w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center relative shadow-lg ${step.glow} group-hover:border-secondary/30 transition-colors duration-300`}>
                  {step.icon}
                  {/* Step Number Badge */}
                  <span className="absolute -top-1 -right-1 bg-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 border border-white/5 rounded-full text-secondary">
                    {step.number}
                  </span>
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                  <h4 className="text-md font-bold text-white tracking-tight group-hover:text-secondary transition-colors duration-200">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-text leading-relaxed max-w-xs mx-auto lg:mx-0">
                    {step.description}
                  </p>
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
