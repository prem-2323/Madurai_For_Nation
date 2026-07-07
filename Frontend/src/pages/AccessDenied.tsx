import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-left">
      <div className="rounded-3xl border border-danger/30 bg-slate-900/80 p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-danger">
          <ShieldAlert className="w-8 h-8" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Access denied</p>
            <h1 className="text-2xl font-bold text-white">You do not have permission to view this page.</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-text">
          Your account is restricted to the dashboard and tools assigned to your role.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/citizen/dashboard" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            Go to citizen dashboard
          </Link>
          <Link to="/officer/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white">
            Go to officer dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
