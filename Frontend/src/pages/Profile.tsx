import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User, Mail, Shield, Calendar, LogOut, CheckCircle2, UserCheck,
  Building2, ClipboardList, Trophy, Flame, Leaf, TrendingUp, Medal,
  Star, Award, Loader2, Save, X, Edit3, AlertTriangle, RefreshCw,
  BadgeCheck, Clock, Target, Activity, BarChart3
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { fetchMyReports } from '../api/reports';
import type { CitizenReport } from '../types';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';

const LEVELS = [
  { level: 1, name: 'Cleaner', icon: <Leaf className="w-4 h-4" />, min: 0, color: 'text-success' },
  { level: 2, name: 'Guardian', icon: <Shield className="w-4 h-4" />, min: 100, color: 'text-secondary' },
  { level: 3, name: 'Environmental Hero', icon: <Trophy className="w-4 h-4" />, min: 500, color: 'text-amber-400' },
];

interface ProfileProps {
  token: string | null;
  onLogout: () => void;
  onTokenUpdate?: (token: string) => void;
}

const LoadingState: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left w-full">
    <div className="space-y-2">
      <Skeleton type="text" className="h-3 w-24" />
      <Skeleton type="text" className="h-10 w-64" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <div className="lg:col-span-2 space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-3xl p-12 border border-red-500/20 text-center max-w-lg mx-auto space-y-6"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Failed to Load Profile</h2>
        <p className="text-sm text-muted-text">{message}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-shadow"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </motion.button>
    </motion.div>
  </div>
);

export const Profile: React.FC<ProfileProps> = ({ token, onLogout, onTokenUpdate }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [officerProfile, setOfficerProfile] = useState<any>(null);
  const [myReports, setMyReports] = useState<CitizenReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(async () => {
    if (!token) { navigate('/auth'); return; }
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedProfile = response.data.data;
      setProfile(fetchedProfile);
      setForm({ name: fetchedProfile.name || '', email: fetchedProfile.email || '', department: '' });

      if (fetchedProfile?.role === 'officer') {
        try {
          const [officerRes, reportsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/officer/profile`, { headers: { Authorization: `Bearer ${token}` } }),
            fetchMyReports(token).catch(() => []),
          ]);
          setOfficerProfile(officerRes.data.data);
          setMyReports(reportsRes);
          setForm(prev => ({ ...prev, department: officerRes.data.data.department || '' }));
        } catch { /* officer endpoint may not exist for citizens */ }
      } else {
        const reports = await fetchMyReports(token).catch(() => []);
        setMyReports(reports);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to retrieve profile.';
      setError(msg);
      toast.error(msg, { id: 'profile-error' });
      if (err.response?.status === 401) { onLogout(); navigate('/auth'); }
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate, onLogout]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/officer/profile`, {
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });

      const updated = res.data.data;
      setProfile((prev: any) => ({ ...prev, name: updated.name, email: updated.email }));
      setOfficerProfile((prev: any) => ({ ...prev, ...updated }));
      setIsEditing(false);
      toast.success('Profile updated successfully', { id: 'profile-save' });

      if (updated.token) {
        localStorage.setItem('token', updated.token);
        if (onTokenUpdate) onTokenUpdate(updated.token);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg, { id: 'profile-save-error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      department: officerProfile?.department || '',
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const totalReports = myReports.length;
  const resolvedReports = myReports.filter(r => r.municipalStatus === 'resolved').length;
  const recentReports = myReports.filter(r => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(r.createdAt) > weekAgo;
  }).length;
  const xp = totalReports * 25 + resolvedReports * 50;
  const currentLevel = LEVELS.filter(l => xp >= l.min).pop() || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!profile) return null;

  const ACHIEVEMENTS = [
    { id: 1, name: 'Pollution Hero', icon: <Trophy className="w-5 h-5" />, desc: 'Submitted 10+ pollution reports', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', earned: totalReports >= 10 },
    { id: 2, name: 'Active Reporter', icon: <Flame className="w-5 h-5" />, desc: 'Reported in last 7 days', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', earned: recentReports > 0 },
    { id: 3, name: 'Green Citizen', icon: <Leaf className="w-5 h-5" />, desc: '5 resolved cleanups', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', earned: resolvedReports >= 5 },
    { id: 4, name: 'Environmental Guardian', icon: <Award className="w-5 h-5" />, desc: 'Contributed to 25 reports', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', earned: totalReports >= 25 },
    { id: 5, name: 'Impact Maker', icon: <Star className="w-5 h-5" />, desc: '500+ people benefited', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20', earned: resolvedReports >= 10 },
  ];

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isOfficer = profile?.role === 'officer';
  const stats = isOfficer && officerProfile ? [
    { label: 'Reports Reviewed', value: officerProfile.reportsReviewed ?? 0, icon: <ClipboardList className="w-4 h-4" />, color: 'text-secondary' },
    { label: 'Resolved', value: officerProfile.reportsResolved ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success' },
    { label: 'In Progress', value: officerProfile.reportsInProgress ?? 0, icon: <Activity className="w-4 h-4" />, color: 'text-amber-400' },
    { label: 'Total Reports', value: officerProfile.totalReportCount ?? 0, icon: <Target className="w-4 h-4" />, color: 'text-purple-400' },
  ] : [];

  const inputClass = (field: string) =>
    `w-full bg-slate-800/80 border ${formErrors[field] ? 'border-red-500/50' : 'border-slate-700/50'} rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-text/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-secondary uppercase tracking-[0.15em] block">Profile</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">Account Overview</span>
          </h1>
          <p className="text-sm text-muted-text">Manage your account details and preferences.</p>
        </div>
        {isOfficer && !isEditing && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </motion.button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden"
        >
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{profile?.name}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-success capitalize">
              <BadgeCheck className="w-3.5 h-3.5" />
              {profile?.role || 'loading'}
            </span>
          </div>

          {/* Level Badge */}
          <div className="w-full p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white inline-flex items-center gap-1">
                {currentLevel.icon} {currentLevel.name}
              </span>
              <span className="text-[10px] text-muted-text">{xp} XP</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              />
            </div>
            {nextLevel && (
              <p className="text-[9px] text-muted-text mt-1 inline-flex items-center gap-1">
                {nextLevel.icon} {nextLevel.name} — {nextLevel.min - xp} XP away
              </p>
            )}
          </div>

          <div className="w-full pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => { onLogout(); navigate('/auth'); }}
              className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-danger/10 border border-slate-800 hover:border-danger/30 text-muted-text hover:text-danger text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-secondary" /> Account Details
              </h3>
              {isEditing && (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-muted-text hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? 'Saving...' : 'Save'}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Name</span>
                {isEditing ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your name"
                        className={inputClass('name')}
                      />
                    </div>
                    {formErrors.name && <p className="text-[10px] text-red-400 mt-1 ml-6">{formErrors.name}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-white">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <span>{profile?.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Email</span>
                {isEditing ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className={inputClass('email')}
                      />
                    </div>
                    {formErrors.email && <p className="text-[10px] text-red-400 mt-1 ml-6">{formErrors.email}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span>{profile?.email}</span>
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Role</span>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <span className="capitalize">{profile?.role}</span>
                </div>
              </div>

              {/* Member Since */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Member Since</span>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                </div>
              </div>

              {/* Department (officer only) */}
              {isOfficer && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Department</span>
                  {isEditing ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <input
                          type="text"
                          value={form.department}
                          onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                          placeholder="Your department"
                          className={inputClass('department')}
                        />
                      </div>
                      {formErrors.department && <p className="text-[10px] text-red-400 mt-1 ml-6">{formErrors.department}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{officerProfile?.department || 'Not set'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Reports Reviewed (officer only, read-only) */}
              {isOfficer && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Reports Reviewed</span>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                    <span>{officerProfile?.reportsReviewed ?? 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Edit hint */}
            {!isEditing && isOfficer && (
              <p className="text-[10px] text-muted-text/50 text-center pt-2 border-t border-slate-800/50">
                Click "Edit Profile" to update your details
              </p>
            )}
          </div>

          {/* Stats Cards */}
          {isOfficer && stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s, idx) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="glass-panel p-4 rounded-xl text-center group hover:border-white/10 transition-all"
                >
                  <div className={`${s.color} flex justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <span className="text-lg font-extrabold text-white">{s.value}</span>
                  <span className="text-[9px] text-muted-text block mt-0.5 uppercase tracking-wider font-semibold">{s.label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 rounded-2xl"
      >
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" /> Achievements & Badges
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-xl border ${a.earned ? a.border : 'border-white/5 opacity-40'} ${a.bg} text-center space-y-2 transition-all hover:scale-105`}
            >
              <div className={`${a.color} flex justify-center`}>{a.icon}</div>
              <span className={`text-xs font-bold block ${a.earned ? 'text-white' : 'text-muted-text'}`}>{a.name}</span>
              <span className="text-[9px] text-muted-text block leading-tight">{a.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

        {/* Contribution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Medal className="w-4 h-4 text-secondary" /> Contribution Activity
            </h3>
            <span className="text-[10px] text-muted-text">Last 30 days</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 30 }, (_, i) => {
              const day = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
              const dayStr = day.toISOString().slice(0, 10);
              const count = myReports.filter(r => r.createdAt?.slice(0, 10) === dayStr).length;
              let bg = 'bg-white/5';
              if (count >= 3) bg = 'bg-success/40';
              else if (count >= 2) bg = 'bg-success/25';
              else if (count >= 1) bg = 'bg-success/10';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex-1 h-10 rounded-sm cursor-default relative group/bar"
                >
                  <div className={`w-full h-full rounded-sm ${bg}`} />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[9px] text-white px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {count > 0 ? `${count} report${count > 1 ? 's' : ''}` : 'No reports'}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[9px] text-muted-text">Less</span>
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <div className="w-3 h-3 rounded-sm bg-success/10" />
            <div className="w-3 h-3 rounded-sm bg-success/25" />
            <div className="w-3 h-3 rounded-sm bg-success/40" />
            <span className="text-[9px] text-muted-text">More</span>
          </div>
        </motion.div>

        {/* Impact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3 rounded-xl bg-success/15 text-success">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">Your Impact</span>
              <p className="text-xs text-muted-text mt-0.5">
                You submitted <strong className="text-white">{totalReports} report{totalReports !== 1 ? 's' : ''}</strong>
                {resolvedReports > 0 && (
                  <>, <strong className="text-white">{resolvedReports} resolved</strong>,
                  benefiting an estimated <strong className="text-white">{resolvedReports * 350}+ residents</strong></>
                )}.
              </p>
            </div>
          </div>
        </motion.div>
    </div>
  );
};

export default Profile;
