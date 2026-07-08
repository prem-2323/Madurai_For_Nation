import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faShieldHalved, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { User, Mail, Shield, Calendar, LogOut, CheckCircle2, UserCheck, Building2, ClipboardList, Trophy, Flame, Leaf, TrendingUp, Medal, Star, Award } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import { SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';

const ACHIEVEMENTS = [
  { id: 1, name: 'Pollution Hero', icon: <Trophy className="w-5 h-5" />, desc: 'Submitted 10+ pollution reports', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', earned: true },
  { id: 2, name: 'Active Reporter', icon: <Flame className="w-5 h-5" />, desc: 'Reported in last 7 days', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', earned: true },
  { id: 3, name: 'Green Citizen', icon: <Leaf className="w-5 h-5" />, desc: '5 resolved cleanups', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', earned: false },
  { id: 4, name: 'Environmental Guardian', icon: <Award className="w-5 h-5" />, desc: 'Contributed to 25 reports', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', earned: true },
  { id: 5, name: 'Impact Maker', icon: <Star className="w-5 h-5" />, desc: '500+ people benefited', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20', earned: false },
];

const LEVELS = [
  { level: 1, name: 'Cleaner', icon: <FontAwesomeIcon icon={faLeaf} className="w-4 h-4" />, min: 0, color: 'text-success' },
  { level: 2, name: 'Guardian', icon: <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />, min: 100, color: 'text-secondary' },
  { level: 3, name: 'Environmental Hero', icon: <FontAwesomeIcon icon={faTrophy} className="w-4 h-4" />, min: 500, color: 'text-amber-400' },
];

interface ProfileProps {
  token: string | null;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ token, onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [officerProfile, setOfficerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/auth'); return; }
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const fetchedProfile = response.data.data;
        setProfile(fetchedProfile);
        if (fetchedProfile?.role === 'officer') {
          try { const officerRes = await axios.get(`${API_BASE_URL}/api/officer/profile`, { headers: { Authorization: `Bearer ${token}` } }); setOfficerProfile(officerRes.data.data); } catch { }
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to retrieve profile.';
        setError(msg); toast.error(msg, { id: 'profile-error' });
        if (err.response?.status === 401) { onLogout(); navigate('/auth'); }
      } finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [token, navigate, onLogout]);

  const xp = 320;
  const currentLevel = LEVELS.filter(l => xp >= l.min).pop() || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-4 py-8 space-y-8"><SkeletonCard /><SkeletonCard /></div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-3xl border-danger/40 space-y-4">
          <div className="p-3 bg-danger/10 text-danger rounded-full w-12 h-12 flex items-center justify-center mx-auto"><Shield className="w-6 h-6" /></div>
          <h2 className="text-xl font-bold text-white">Error</h2>
          <p className="text-sm text-muted-text">{error}</p>
          <button onClick={() => navigate('/auth')} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm border border-slate-700 hover:bg-slate-700 transition-all">Return to Login</button>
        </div>
      </div>
    );
  }

  const initials = profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Profile Dashboard</span>
        <h1 className="heading-text text-white">Account Overview</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{profile?.name}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-success capitalize">
              <UserCheck className="w-3.5 h-3.5" />{profile?.role || 'loading'}
            </span>
          </div>

          {/* Level Badge */}
          <div className="w-full p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white inline-flex items-center gap-1">{currentLevel.icon} {currentLevel.name}</span>
              <span className="text-[10px] text-muted-text">{xp} XP</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" />
            </div>
            {nextLevel && <p className="text-[9px] text-muted-text mt-1 inline-flex items-center gap-1">{nextLevel.icon} {nextLevel.name} — {nextLevel.min - xp} XP away</p>}
          </div>

          <div className="w-full pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button onClick={() => { onLogout(); navigate('/auth'); }} className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-danger/10 border border-slate-800 hover:border-danger/30 text-muted-text hover:text-danger text-xs font-semibold transition-all flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Name</span>
                <div className="flex items-center gap-2 text-sm text-white"><User className="w-4 h-4 text-primary shrink-0" /><span>{profile?.name}</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Email</span>
                <div className="flex items-center gap-2 text-sm text-white"><Mail className="w-4 h-4 text-primary shrink-0" /><span>{profile?.email}</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Role</span>
                <div className="flex items-center gap-2 text-sm text-white"><Shield className="w-4 h-4 text-primary shrink-0" /><span className="capitalize">{profile?.role}</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Member Since</span>
                <div className="flex items-center gap-2 text-sm text-white"><Calendar className="w-4 h-4 text-primary shrink-0" /><span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              </div>
              {profile?.role === 'officer' && officerProfile && (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Department</span>
                    <div className="flex items-center gap-2 text-sm text-white"><Building2 className="w-4 h-4 text-primary shrink-0" /><span>{officerProfile.department}</span></div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Reports Reviewed</span>
                    <div className="flex items-center gap-2 text-sm text-white"><ClipboardList className="w-4 h-4 text-primary shrink-0" /><span>{officerProfile.reportsReviewed}</span></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Reports Submitted', value: '12', icon: <ClipboardList className="w-4 h-4" />, color: 'text-secondary' },
              { label: 'Hotspots Reported', value: '8', icon: <Flame className="w-4 h-4" />, color: 'text-danger' },
              { label: 'Resolved', value: '5', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success' },
              { label: 'Impact Score', value: '78%', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="glass-panel p-4 rounded-xl text-center">
                <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
                <span className="text-lg font-extrabold text-white">{s.value}</span>
                <span className="text-[9px] text-muted-text block mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-amber-400" /> Achievements & Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`p-4 rounded-xl border ${a.earned ? a.border : 'border-white/5 opacity-40'} ${a.bg} text-center space-y-2 transition-all hover:scale-105`}>
              <div className={`${a.color} flex justify-center`}>{a.icon}</div>
              <span className={`text-xs font-bold block ${a.earned ? 'text-white' : 'text-muted-text'}`}>{a.name}</span>
              <span className="text-[9px] text-muted-text block leading-tight">{a.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contribution Graph */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Medal className="w-4 h-4 text-secondary" /> Contribution Activity</h3>
          <span className="text-[10px] text-muted-text">Last 30 days</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const level = Math.random();
            let bg = 'bg-white/5';
            if (level > 0.7) bg = 'bg-success/40';
            else if (level > 0.4) bg = 'bg-success/25';
            else if (level > 0.15) bg = 'bg-success/10';
            return <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className={`flex-1 h-10 rounded-sm ${bg}`} title={`Day ${i + 1}`} />;
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="p-3 rounded-xl bg-success/15 text-success"><Leaf className="w-6 h-6" /></div>
          <div>
            <span className="text-sm font-bold text-white">Your Impact</span>
            <p className="text-xs text-muted-text mt-0.5">Your reports helped coordinate <strong className="text-white">8 cleanup operations</strong>, benefiting an estimated <strong className="text-white">3,000+ residents</strong> in Madurai.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Profile;
