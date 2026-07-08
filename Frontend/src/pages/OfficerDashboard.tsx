import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, BarChart3, AlertTriangle, UserCircle, CheckCircle2, Clock, Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { getUserRole } from '../utils/role';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SkeletonCard } from '../components/Skeleton';

interface OfficerDashboardProps {
  user?: any;
  token?: string | null;
}

interface DashboardData {
  total: number;
  pending: number;
  verified: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  criticalPriority: number;
  today: number;
}

const cardConfig = [
  { key: 'total', title: 'Total Reports', icon: FileText, color: 'from-amber-500 to-orange-700', desc: 'All incoming pollution incidents.' },
  { key: 'pending', title: 'Pending', icon: AlertTriangle, color: 'from-red-500 to-rose-700', desc: 'Reports that still need officer review.' },
  { key: 'verified', title: 'Verified', icon: CheckCircle2, color: 'from-blue-500 to-indigo-700', desc: 'Reports approved for follow-up action.' },
  { key: 'inProgress', title: 'In Progress', icon: Activity, color: 'from-yellow-500 to-amber-700', desc: 'Active response and monitoring cases.' },
  { key: 'resolved', title: 'Resolved', icon: CheckCircle2, color: 'from-green-500 to-teal-700', desc: 'Completed and closed reports.' },
  { key: 'highPriority', title: 'High Priority', icon: AlertTriangle, color: 'from-orange-500 to-red-700', desc: 'Urgent incidents requiring attention.' },
  { key: 'criticalPriority', title: 'Critical Priority', icon: AlertTriangle, color: 'from-red-600 to-pink-700', desc: 'High-risk emergencies.' },
  { key: 'today', title: "Today's Reports", icon: Clock, color: 'from-sky-500 to-cyan-700', desc: 'Reports received today.' },
];

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ user, token }) => {
  const role = getUserRole(user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/officer/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboard();
    else setLoading(false);
  }, [token]);

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cardConfig.map((card) => {
            const Icon = card.icon;
            const value = data ? (data as any)[card.key] : '—';
            return (
              <motion.div key={card.key} whileHover={{ y: -4, scale: 1.01 }} className="h-full">
                <Link 
                  to="/officer/reports" 
                  className="relative block h-full rounded-2xl border border-white/5 glass-panel p-5 shadow-lg overflow-hidden group"
                  onMouseMove={(e) => handleMouseMove(e, card.key)}
                  onMouseEnter={() => setHoveredCard(card.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Spotlight effect */}
                  <AnimatePresence>
                    {hoveredCard === card.key && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pointer-events-none absolute inset-0 z-0"
                        style={{
                          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(14, 165, 233, 0.1), transparent 40%)`,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className={`rounded-xl bg-gradient-to-br ${card.color} p-2 opacity-80 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-extrabold text-white">
                      {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
                    </span>
                  </div>
                  <h2 className="relative z-10 mt-4 text-lg font-semibold text-white">{card.title}</h2>
                  <p className="relative z-10 mt-2 text-sm text-muted-text">{card.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/5 glass-panel p-6">
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
