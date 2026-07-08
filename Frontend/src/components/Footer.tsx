import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 pt-16 pb-8 text-sm overflow-hidden">
      {/* Glowing Top Border */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-50" />
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                CleanAir <span className="text-primary font-medium">AI</span>
              </span>
            </Link>
            <p className="text-muted-text leading-relaxed">
              An advanced, hyperlocal climate intelligence and pollution monitoring network. Empowering citizens and municipalities to safeguard clean air using AI-assisted imagery and spatial analytics.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-text hover:text-white hover:-translate-y-1 hover:text-[#1DA1F2] transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-text hover:text-white hover:-translate-y-1 hover:text-[#0A66C2] transition-all duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-text hover:text-white hover:-translate-y-1 hover:text-white transition-all duration-300">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-tight">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-muted-text hover:text-white transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/report" className="text-muted-text hover:text-white transition-colors">Report Pollution</Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-text hover:text-white transition-colors">Air Quality Dashboard</Link>
              </li>
              <li>
                <Link to="/map" className="text-muted-text hover:text-white transition-colors">Live Spatial Map</Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-text hover:text-white transition-colors">About & FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-tight">Contact Response</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-muted-text">
                <Mail className="w-4 h-4 text-secondary" />
                <a href="mailto:response@cleanair.ai" className="hover:text-white transition-colors">response@cleanair.ai</a>
              </li>
              <li className="flex items-center gap-2.5 text-muted-text">
                <Phone className="w-4 h-4 text-secondary" />
                <span>+1 (206) 555-0143</span>
              </li>
              <li className="flex items-start gap-2.5 text-muted-text">
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Madurai, Tamil Nadu, India</span>
              </li>
            </ul>
          </div>

          {/* Privacy/Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-tight">Legal & Policy</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-text hover:text-white transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-muted-text hover:text-white transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-muted-text hover:text-white transition-colors">Municipal Data SLA</a>
              </li>
              <li>
                <a href="#" className="text-muted-text hover:text-white transition-colors">API Accessibility</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-text">
          <p>© {currentYear} CleanAir AI. Built for municipal action. All rights reserved.</p>
          <p>
            Disclaimer: AI-assisted assessments are simulated for planning and educational demonstration purposes.
          </p>
        </div>
      </div>
    </footer>
  );
};
