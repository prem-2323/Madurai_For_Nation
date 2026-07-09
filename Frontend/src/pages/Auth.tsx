import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPostLoginPath, getStoredUser } from '../utils/auth';
import { motion } from 'motion/react';
import { Lock, Mail, User, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      navigate(getPostLoginPath(storedUser), { replace: true });
    }
  }, [navigate]);

  const handleTabSwitch = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    if (!toLogin) {
      setRole('citizen');
    }
  };

  const navigateByRole = (user: any) => {
    navigate(getPostLoginPath(user), { replace: true });
  };

  const authenticate = async (credentialEmail: string, credentialPassword: string, credentialRole: 'citizen' | 'officer', credentialName: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isLogin) {
        try {
          console.log('[AUTH] Attempting quick login for email:', credentialEmail);
          const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: credentialEmail,
            password: credentialPassword
          });
          const { user, token } = response.data.data;
          onLoginSuccess(user, token);
          toast.success(`Welcome back, ${user.name || 'User'}!`, { id: 'login-success' });
          navigateByRole(user);
        } catch (loginError: any) {
          const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            name: credentialName,
            email: credentialEmail,
            password: credentialPassword,
            role: credentialRole
          });
          const { user, token } = registerResponse.data.data;
          onLoginSuccess(user, token);
          toast.success(`Account created for demo ${credentialRole} access.`, { id: 'register-success' });
          navigateByRole(user);
        }
      } else {
        console.log('[AUTH] Submitting register for email:', credentialEmail, '| selected role:', credentialRole);
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
          name: credentialName,
          email: credentialEmail,
          password: credentialPassword,
          role: credentialRole
        });
        const { user, token } = response.data.data;
        onLoginSuccess(user, token);
        toast.success(`Account created! Welcome to CleanAir AI.`, { id: 'register-success' });
        navigateByRole(user);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'An error occurred during authentication. Please check your credentials.';
      setError(msg);
      toast.error(msg, { id: 'auth-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authenticate(email, password, role, name || (role === 'officer' ? 'Officer Demo' : 'Citizen Demo'));
  };

  const handleQuickSignIn = async (targetRole: 'citizen' | 'officer') => {
    const demoAccounts = {
      citizen: { email: 'citizen@madurai4nation.com', password: 'Madurai@2024', name: 'Citizen Demo' },
      officer: { email: 'officer@madurai4nation.com', password: 'Madurai@2024', name: 'Officer Demo' }
    } as const;

    const account = demoAccounts[targetRole];
    setIsLogin(true);
    setRole(targetRole);
    setName(account.name);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setSuccess('');
    await authenticate(account.email, account.password, targetRole, account.name);
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

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickSignIn('citizen')}
            disabled={isLoading}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Autofill Citizen
          </button>
          <button
            type="button"
            onClick={() => handleQuickSignIn('officer')}
            disabled={isLoading}
            className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500/20 disabled:opacity-50"
          >
            Autofill Officer
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

          {/* Form alerts removed in favor of toast */}

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
