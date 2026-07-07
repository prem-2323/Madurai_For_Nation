import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Sparkles, ClipboardList, Map, Wind, TrendingUp, UserCircle } from 'lucide-react';
import type { PollutionReport, ReportStatus } from '../types';
import { getUserRole } from '../utils/role';

interface CitizenDashboardProps {
  reports: PollutionReport[];
  onAddReport: (report: PollutionReport) => void;
  onUpdateStatus: (id: string, newStatus: ReportStatus) => void;
  onDeleteReport: (id: string) => void;
  user?: any;
  token?: string | null;
}

const cards = [
  { title: 'Upload Pollution Image', description: 'Capture or upload a photo for AI analysis.', icon: Camera, path: '/citizen/report' },
  { title: 'AI Analysis', description: 'Review Gemini-based insights and pollution severity.', icon: Sparkles, path: '/citizen/report' },
  { title: 'Submit Report', description: 'Share the incident and its location with the city.', icon: ClipboardList, path: '/citizen/report' },
  { title: 'My Reports', description: 'Track your submitted reports and their status.', icon: ClipboardList, path: '/citizen/reports' },
  { title: 'AQI', description: 'Check the latest air quality data in your area.', icon: Wind, path: '/citizen/dashboard' },
  { title: 'AQI Prediction', description: 'See upcoming air quality trends and risk.', icon: TrendingUp, path: '/citizen/dashboard' },
  { title: 'Nearby Hotspots', description: 'Explore the latest pollution hotspots map.', icon: Map, path: '/citizen/map' },
  { title: 'Report Status', description: 'Follow your report through the review lifecycle.', icon: ClipboardList, path: '/citizen/reports' },
];

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ user }) => {
  const role = getUserRole(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Citizen Dashboard</p>
          <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.name?.split(' ')[0] || 'citizen'}</h1>
          <p className="text-sm text-muted-text">Your role is {role || 'citizen'} and your tools are tailored for reporting and tracking pollution incidents.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-text">
          <UserCircle className="w-4 h-4" />
          <span className="capitalize">{role === 'officer' ? 'officer' : 'citizen'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} whileHover={{ y: -4, scale: 1.01 }}>
              <Link to={card.path} className="block h-full rounded-2xl border border-white/5 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{card.title}</h2>
                <p className="mt-2 text-sm text-muted-text">{card.description}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardList className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-white">Citizen actions</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-text">
          <li>• Submit pollution reports with AI analysis and location coordinates.</li>
          <li>• View only your own reports, current status, and comments from officers.</li>
          <li>• Monitor AQI trends, hotspot areas, and recent local pollution events.</li>
          <li>• Officer-only management screens are hidden from this dashboard.</li>
        </ul>
      </div>
    </div>
  );
};
