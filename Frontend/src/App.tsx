/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { About } from './pages/About';
import { PollutionReport, ReportStatus } from './types';
import { INITIAL_REPORTS } from './data';
import { motion } from 'motion/react';

export default function App() {
  const [reports, setReports] = useState<PollutionReport[]>(INITIAL_REPORTS);

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
        <Navbar />

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
                  <Report onAddReport={handleAddReport} />
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
                  <MapPage reports={reports} />
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

