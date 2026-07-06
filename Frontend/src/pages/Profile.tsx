import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, LogOut, CheckCircle2, UserCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';

interface ProfileProps {
  token: string | null;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ token, onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile323`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProfile(response.data.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || 
          'Failed to retrieve profile metadata from secure node.'
        );
        // If unauthorized, trigger logout
        if (err.response?.status === 401) {
          onLogout();
          navigate('/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate, onLogout]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-text">Querying profile from profile323 endpoint...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-3xl border-danger/40 space-y-4">
          <div className="p-3 bg-danger/10 text-danger rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Security Violation</h2>
          <p className="text-sm text-muted-text">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm border border-slate-700 hover:bg-slate-700 transition-all"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Secure Identity Node</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Account Profile</h1>
        <p className="text-sm text-muted-text">
          Telemetry details associated with your environmental reporting account. Verified via SHA-256 JWT key.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-3xl md:col-span-1 flex flex-col items-center text-center space-y-4 relative overflow-hidden"
        >
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl accent-glow-secondary">
            <User className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{profile?.name}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-success capitalize">
              <UserCheck className="w-3.5 h-3.5" />
              {profile?.role}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onLogout();
                navigate('/auth');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-danger/10 border border-slate-800 hover:border-danger/30 text-muted-text hover:text-danger text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminate Session</span>
            </button>
          </div>
        </motion.div>

        {/* Profile Details & Metadata */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-8 rounded-3xl md:col-span-2 space-y-6"
        >
          <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-secondary" /> Account Telemetry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Registered Name</span>
              <div className="flex items-center gap-2.5 text-sm text-white">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span>{profile?.name}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Linked Email</span>
              <div className="flex items-center gap-2.5 text-sm text-white">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>{profile?.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Permission Level</span>
              <div className="flex items-center gap-2.5 text-sm text-white">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <span className="capitalize">{profile?.role} Authorization</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Created On</span>
              <div className="flex items-center gap-2.5 text-sm text-white">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-muted-text leading-relaxed">
            <span className="font-bold text-white block mb-1">Security Disclaimer</span>
            Your JWT token is saved locally to authorize environment reporting operations. Profile statistics and administrative rights are bound dynamically to the profile323 API endpoint.
          </div>
        </motion.div>
      </div>
    </div>
  );
};
