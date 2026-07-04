import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Wind, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Report', path: '/report' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Map', path: '/map' },
    { name: 'About', path: '/about' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg accent-glow-primary transition-transform duration-300 group-hover:scale-110">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-secondary">
                CleanAir <span className="text-primary font-medium">AI</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/5 font-semibold border border-white/10'
                        : 'text-muted-text hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Action (GitHub) */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-white/5 transition-all hover:border-secondary/30"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-muted-text hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm md:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-40 w-72 max-w-xs bg-[#0F172A] border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between md:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-primary to-secondary rounded-lg">
                      <Wind className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white text-md">CleanAir AI</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-muted-text hover:text-white hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `px-4 py-3 rounded-xl text-md font-medium transition-all ${
                          isActive
                            ? 'text-white bg-white/5 font-semibold border border-white/5'
                            : 'text-muted-text hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-800 transition-all"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
