/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { Alerts } from './pages/Alerts';
import { About } from './pages/About';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { PollutionReport, ReportStatus } from './types';
import { INITIAL_REPORTS } from './data';
import { motion } from 'motion/react';
import axios from 'axios';
import { API_BASE_URL } from './api/analyze';
import { fetchMapReports } from './api/reports';

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

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0F172A] text-white selection:bg-secondary/30 selection:text-white">
        
        {/* Sticky Header Navigation */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Dynamic Route Content (With delicate page fade-ins) */}
        <main className="flex-1 relative">
          <Routes>
            <Route
              path="/"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Home />
                </motion.div>
              }
            />
            <Route
              path="/report"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Report onAddReport={handleAddReport} token={token} />
                </motion.div>
              }
            />
            <Route
              path="/dashboard"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Dashboard
                    reports={reports}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteReport={handleDeleteReport}
                  />
                </motion.div>
              }
            />
            <Route
              path="/map"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <MapPage reports={reports} token={token} />
                </motion.div>
              }
            />
            <Route
              path="/alerts"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Alerts token={token} />
                </motion.div>
              }
            />
            <Route
              path="/about"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <About />
                </motion.div>
              }
            />
            <Route
              path="/auth"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Auth onLoginSuccess={handleLoginSuccess} />
                </motion.div>
              }
            />
            <Route
              path="/profile"
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Profile token={token} onLogout={handleLogout} />
                </motion.div>
              }
            />
            {/* Fallback Catch */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer Anchor */}
        <Footer />

      </div>
    </Router>
  );
}

