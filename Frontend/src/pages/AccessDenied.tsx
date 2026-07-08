import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-left">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-danger/30 glass-panel p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-danger/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 text-danger relative z-10">
          <ShieldAlert className="w-8 h-8" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Access denied</p>
            <h1 className="text-2xl font-bold text-white">You do not have permission to view this page.</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-text relative z-10">
          Your account is restricted to the dashboard and tools assigned to your role.
        </p>
        <div className="mt-6 flex gap-3 relative z-10">
          <Link to="/citizen/dashboard" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
            Go to citizen dashboard
          </Link>
          <Link to="/officer/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
            Go to officer dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
