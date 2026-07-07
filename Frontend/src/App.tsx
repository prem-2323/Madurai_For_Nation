/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { HotspotsPage } from './pages/Hotspots';
import { Alerts } from './pages/Alerts';
import { About } from './pages/About';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { Users } from './pages/Users';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { Settings } from './pages/Settings';
import { Logs } from './pages/Logs';
import { PollutionReport, ReportStatus } from './types';
import { INITIAL_REPORTS } from './data';
import { motion } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from './api/analyze';
import { fetchMapReports } from './api/reports';
import { canAccessRoute } from './utils/role';

export default function App() {
  const [reports, setReports] = useState<PollutionReport[]>(INITIAL_REPORTS);
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Sync session check with profile323 on mount if token exists
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile323`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const verifiedUser = response.data.data;
        setUser(verifiedUser);
        localStorage.setItem('user', JSON.stringify(verifiedUser));
      } catch (err) {
        // Clear session if verification fails
        handleLogout();
      }
    };
    verifyToken();
  }, [token]);

  // Fetch all reports from DB on mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        const dbReports = await fetchMapReports(token);
        setReports(dbReports);
      } catch (err) {
        console.error('Failed to load reports from database:', err);
      }
    };
    loadReports();
  }, [token]);

  const handleLoginSuccess = (loggedInUser: any, userToken: string) => {
    setUser(loggedInUser);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 1. ADD NEW REPORT HANDLER (Pushed to beginning of list)
  const handleAddReport = (newReport: PollutionReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  // 2. WORKFLOW STEP ADVANCER
  const handleUpdateStatus = (id: string, newStatus: ReportStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  // 3. DELETE EXPIRED RECORD HANDLER
  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const ProtectedRoute = ({ children, path }: { children: ReactNode; path: string }) => {
    if (!canAccessRoute(user, path)) {
      if (!user) return <Navigate to="/auth" state={{ from: { pathname: path } }} replace />;
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  const PageTransition = ({ children }: { children: ReactNode }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      {children}
    </motion.div>
  );

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0F172A] text-white selection:bg-secondary/30 selection:text-white">
        
        {/* Sticky Header Navigation */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Dynamic Route Content (With delicate page fade-ins) */}
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/report" element={<ProtectedRoute path="/report"><PageTransition><Report onAddReport={handleAddReport} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute path="/dashboard"><PageTransition><Dashboard reports={reports} onUpdateStatus={handleUpdateStatus} onDeleteReport={handleDeleteReport} user={user} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute path="/map"><PageTransition><MapPage reports={reports} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/hotspots" element={<ProtectedRoute path="/hotspots"><PageTransition><HotspotsPage token={token} user={user} /></PageTransition></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute path="/alerts"><PageTransition><Alerts token={token} user={user} /></PageTransition></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute path="/analytics"><PageTransition><AdminAnalytics token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute path="/users"><PageTransition><Users token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute path="/settings"><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute path="/logs"><PageTransition><Logs token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/auth" element={<PageTransition><Auth onLoginSuccess={handleLoginSuccess} /></PageTransition>} />
            <Route path="/profile" element={<ProtectedRoute path="/profile"><PageTransition><Profile token={token} onLogout={handleLogout} /></PageTransition></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer Anchor */}
        <Footer />

      </div>
    </Router>
  );
}

