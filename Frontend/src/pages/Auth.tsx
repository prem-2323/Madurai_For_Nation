import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, User, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';

interface AuthProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'officer'>('citizen');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleTabSwitch = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    setSuccess('');
    if (!toLogin) {
      setRole('citizen');
    }
  };

  const navigateByRole = (user: any) => {
    const targetPath = user?.role === 'officer' ? '/officer/dashboard' : '/citizen/dashboard';
    navigate(targetPath, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('[AUTH] Submitting login for email:', email);
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email,
          password
        });
        const { user, token } = response.data.data;
        console.log('[AUTH] Login response - user role:', user?.role);
        onLoginSuccess(user, token);
        navigateByRole(user);
      } else {
        console.log('[AUTH] Submitting register for email:', email, '| selected role:', role);
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
          name,
          email,
          password,
          role
        });
        const { user, token } = response.data.data;
        console.log('[AUTH] Register response - user role:', user?.role, '| token present:', !!token);
        onLoginSuccess(user, token);
        navigateByRole(user);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'An error occurred during authentication. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-16 text-left">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow overlay */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">Access Gateway</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-muted-text">
            {isLogin 
              ? 'Sign in to access your dashboard and report details.' 
              : 'Join CleanAir AI to log incidents and track local telemetry.'
            }
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
          <button
            onClick={() => handleTabSwitch(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isLogin 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-muted-text hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabSwitch(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              !isLogin 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-muted-text hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-text uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-text" />
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-text uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-text" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-text uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-text" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Access Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(['citizen', 'officer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all duration-200 ${
                      role === r
                        ? 'border-secondary bg-secondary/15 text-white'
                        : 'border-slate-800 bg-slate-950 text-muted-text hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-danger/20 border border-danger/40 flex items-start gap-2.5 text-xs text-white"
            >
              <ShieldAlert className="w-4.5 h-4.5 text-danger shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-success/20 border border-success/40 flex items-start gap-2.5 text-xs text-white"
            >
              <Sparkles className="w-4.5 h-4.5 text-success shrink-0 mt-0.5 animate-pulse" />
              <span>{success}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-primary-to-secondary hover:opacity-95 text-white text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Account' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-text">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => handleTabSwitch(false)} className="text-secondary hover:underline font-semibold">
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => handleTabSwitch(true)} className="text-secondary hover:underline font-semibold">
                Sign in here
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
