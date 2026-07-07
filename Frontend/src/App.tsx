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
import { AccessDenied } from './pages/AccessDenied';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { AQI } from './pages/AQI';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { PollutionReport, ReportStatus } from './types';
import { INITIAL_REPORTS } from './data';
import { motion } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from './api/analyze';
import { fetchMapReports } from './api/reports';
import { getUserRole } from './utils/role';

export default function App() {
  const [reports, setReports] = useState<PollutionReport[]>(INITIAL_REPORTS);
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Verify token and fetch/sync user profile on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        console.log('[APP] No token found, skipping verification');
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile323`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const verifiedUser = response.data.data;
        console.log('[APP] Token verification - verified user role:', verifiedUser?.role);
        // Update user with verified profile data (including correct role)
        setUser(verifiedUser);
        localStorage.setItem('user', JSON.stringify(verifiedUser));
      } catch (err) {
        console.log('[APP] Token verification failed, logging out');
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
    console.log('[APP] handleLoginSuccess - received user role:', loggedInUser?.role);
    // Store the user object with their actual role from the response
    setUser(loggedInUser);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    // Ensure the complete user object with role is stored
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    console.log('[APP] Stored in localStorage - user role:', loggedInUser?.role);
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
            <Route path="/auth" element={<PageTransition><Auth onLoginSuccess={handleLoginSuccess} /></PageTransition>} />
            <Route path="/access-denied" element={<PageTransition><AccessDenied /></PageTransition>} />

            <Route path="/citizen/dashboard" element={<ProtectedRoute user={user}><PageTransition><CitizenDashboard reports={reports} onAddReport={handleAddReport} onUpdateStatus={handleUpdateStatus} onDeleteReport={handleDeleteReport} user={user} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/citizen/report" element={<ProtectedRoute user={user}><PageTransition><Report onAddReport={handleAddReport} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/citizen/reports" element={<ProtectedRoute user={user}><PageTransition><Dashboard reports={reports} onUpdateStatus={handleUpdateStatus} onDeleteReport={handleDeleteReport} user={user} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/citizen/map" element={<ProtectedRoute user={user}><PageTransition><MapPage reports={reports} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/citizen/hotspots" element={<ProtectedRoute user={user}><PageTransition><HotspotsPage token={token} user={user} /></PageTransition></ProtectedRoute>} />
            <Route path="/citizen/profile" element={<ProtectedRoute user={user}><PageTransition><Profile token={token} onLogout={handleLogout} /></PageTransition></ProtectedRoute>} />
            <Route path="/citizen/aqi" element={<ProtectedRoute user={user}><PageTransition><AQI /></PageTransition></ProtectedRoute>} />

            <Route path="/officer/dashboard" element={<RoleProtectedRoute user={user} role="officer"><PageTransition><OfficerDashboard reports={reports} onUpdateStatus={handleUpdateStatus} onDeleteReport={handleDeleteReport} user={user} token={token} /></PageTransition></RoleProtectedRoute>} />
            <Route path="/officer/reports" element={<RoleProtectedRoute user={user} role="officer"><PageTransition><Dashboard reports={reports} onUpdateStatus={handleUpdateStatus} onDeleteReport={handleDeleteReport} user={user} token={token} /></PageTransition></RoleProtectedRoute>} />
            <Route path="/officer/hotspots" element={<RoleProtectedRoute user={user} role="officer"><PageTransition><HotspotsPage token={token} user={user} /></PageTransition></RoleProtectedRoute>} />
            <Route path="/officer/profile" element={<RoleProtectedRoute user={user} role="officer"><PageTransition><Profile token={token} onLogout={handleLogout} /></PageTransition></RoleProtectedRoute>} />
            <Route path="/officer/analytics" element={<RoleProtectedRoute user={user} role="officer"><PageTransition><AdminAnalytics token={token} /></PageTransition></RoleProtectedRoute>} />

            <Route path="/report" element={<ProtectedRoute user={user}><PageTransition><Report onAddReport={handleAddReport} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute user={user}><PageTransition><Dashboard reports={reports} onUpdateStatus={handleUpdateStatus} onDeleteReport={handleDeleteReport} user={user} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute user={user}><PageTransition><MapPage reports={reports} token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/hotspots" element={<ProtectedRoute user={user}><PageTransition><HotspotsPage token={token} user={user} /></PageTransition></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute user={user}><PageTransition><Alerts token={token} user={user} /></PageTransition></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute user={user}><PageTransition><AdminAnalytics token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute user={user}><PageTransition><Users token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute user={user}><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute user={user}><PageTransition><Logs token={token} /></PageTransition></ProtectedRoute>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><PageTransition><Profile token={token} onLogout={handleLogout} /></PageTransition></ProtectedRoute>} />
            <Route path="*" element={
              (() => {
                const role = getUserRole(user);
                const target = role === 'officer' ? '/officer/dashboard' : user ? '/citizen/dashboard' : '/';
                console.log('[APP] Catch-all redirect - user role:', role, '| target:', target);
                return <Navigate to={target} replace />;
              })()
            } />
          </Routes>
        </main>

        {/* Global Footer Anchor */}
        <Footer />

      </div>
    </Router>
  );
}

