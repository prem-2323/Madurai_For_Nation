import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, FileText, BarChart3, AlertTriangle, UserCircle } from 'lucide-react';
import type { PollutionReport, ReportStatus } from '../types';
import { getUserRole } from '../utils/role';

interface OfficerDashboardProps {
  reports: PollutionReport[];
  onUpdateStatus: (id: string, newStatus: ReportStatus) => void;
  onDeleteReport: (id: string) => void;
  user?: any;
  token?: string | null;
}

const cards = [
  { title: 'Total Reports', description: 'All incoming pollution incidents.', icon: FileText, path: '/officer/reports' },
  { title: 'Pending', description: 'Reports that still need officer review.', icon: AlertTriangle, path: '/officer/reports' },
  { title: 'Verified', description: 'Reports approved for follow-up action.', icon: LayoutDashboard, path: '/officer/reports' },
  { title: 'In Progress', description: 'Active response and monitoring cases.', icon: FileText, path: '/officer/reports' },
  { title: 'Resolved', description: 'Completed and closed reports.', icon: LayoutDashboard, path: '/officer/reports' },
  { title: 'High Priority', description: 'Urgent incidents requiring attention.', icon: AlertTriangle, path: '/officer/reports' },
  { title: 'Critical Priority', description: 'High-risk emergencies.', icon: AlertTriangle, path: '/officer/reports' },
  { title: "Today's Reports", description: 'Reports received today.', icon: BarChart3, path: '/officer/reports' },
];

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ user }) => {
  const role = getUserRole(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Officer Dashboard</p>
          <h1 className="text-3xl font-extrabold text-white">Operations Center</h1>
          <p className="text-sm text-muted-text">Review reports, update priorities, and monitor hotspot activity.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-text">
          <UserCircle className="w-4 h-4" />
          <span className="capitalize">{role || 'officer'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} whileHover={{ y: -4, scale: 1.01 }}>
              <Link to={card.path} className="block h-full rounded-2xl border border-white/5 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 hover:border-secondary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-secondary/10 p-2 text-secondary">
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
        <div className="flex items-center gap-2 text-secondary">
          <BarChart3 className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-white">Officer tools</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-text">
          <li>• Review all citizen reports and their AI analysis images.</li>
          <li>• Update report status, assign priority, and add officer remarks.</li>
          <li>• Track hotspot conditions and view dashboard-level statistics.</li>
          <li>• Citizen report submission tools remain hidden from this dashboard.</li>
        </ul>
      </div>
    </div>
  );
};
