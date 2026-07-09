import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Wind, Shield, UserCheck, Bell, ChevronDown, Settings, LogOut, User, Github, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNavItemsForRole, getUserRole } from '../utils/role';
import { fetchGeminiUsage, GEMINI_USAGE_UPDATED_EVENT } from '../api/usage';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [geminiUsage, setGeminiUsage] = useState<{ used: number | null; limit: number | null } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await fetchGeminiUsage();
        setGeminiUsage({ used: data.used, limit: data.limit });
      } catch {
        setGeminiUsage({ used: null, limit: null });
      }
    };

    const handleUsageUpdated = () => {
      void loadUsage();
    };

    loadUsage();
    const interval = window.setInterval(() => {
      void loadUsage();
    }, 30000);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener(GEMINI_USAGE_UPDATED_EVENT, handleUsageUpdated);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener(GEMINI_USAGE_UPDATED_EVENT, handleUsageUpdated);
    };
  }, []);

  const navItems = getNavItemsForRole(user);
  const role = getUserRole(user);
  const geminiUsageLabel = geminiUsage && geminiUsage.used !== null && geminiUsage.limit !== null
    ? `Gemini: ${geminiUsage.used}/${geminiUsage.limit}`
    : 'Gemini: --/--';

  const getRoleIcon = () => {
    const actualRole = role?.toLowerCase() || 'citizen';
    switch (actualRole) {
      case 'officer': return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 'citizen': return <UserCheck className="w-3.5 h-3.5 text-green-400" />;
      default: return <UserCheck className="w-3.5 h-3.5 text-green-400" />;
    }
  };

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-[#0F172A]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20 py-1' : 'bg-[#0F172A]/50 backdrop-blur-md border-b border-white/5 py-1.5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="p-1.5 bg-gradient-to-br from-primary to-secondary rounded-lg accent-glow-primary transition-transform duration-300 group-hover:scale-110">
                <Wind className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-secondary">
                CleanAir <span className="text-primary font-medium">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 relative mx-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path} to={item.path}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(null)}
                  className={({ isActive }) =>
                    `relative px-3 py-1.5 rounded-xl text-xs font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-muted-text hover:text-white'}`
                  }>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{item.name}</span>
                      {isActive && (
                        <motion.div layoutId="navbar-active" className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {hoveredPath === item.path && !isActive && (
                        <motion.div layoutId="navbar-hover" className="absolute inset-0 bg-white/5 rounded-xl z-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <a href="/Proof.pdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-text hover:text-white hover:bg-white/5 transition-all">
                <FileText className="w-3.5 h-3.5" />
                Proof
              </a>

              <div className="text-[10px] text-muted-text font-medium whitespace-nowrap">
                {geminiUsageLabel}
              </div>

              {user ? (
                <>
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-xl text-muted-text hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                      <Bell className="w-4 h-4" />
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full text-[8px] font-bold text-white flex items-center justify-center">3</span>
                    </button>
                    <AnimatePresence>
                      {showNotifs && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-full mt-2 w-72 glass-panel rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                          <div className="p-3 border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Notifications</span>
                            <span className="text-[10px] text-secondary cursor-pointer hover:underline">Mark all read</span>
                          </div>
                          {[
                            { title: 'New Report', desc: 'Industrial emission reported in SIDCO', time: '2 min ago', color: 'text-warning' },
                            { title: 'AI Analysis Complete', desc: 'Smoke detection confidence: 94%', time: '15 min ago', color: 'text-secondary' },
                            { title: 'Report Resolved', desc: 'Waste dumping near Vaigai River cleaned', time: '1 hour ago', color: 'text-success' },
                          ].map((n, i) => (
                            <div key={i} className="p-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${n.color} bg-current shrink-0`} />
                                <span className="text-xs font-semibold text-white">{n.title}</span>
                              </div>
                              <p className="text-[10px] text-muted-text mt-0.5 line-clamp-1">{n.desc}</p>
                              <span className="text-[9px] text-muted-text/60 mt-0.5 block">{n.time}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white">
                        {initials}
                      </div>
                      <ChevronDown className={`w-3 h-3 text-muted-text transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-full mt-2 w-52 glass-panel rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                          <div className="p-3 border-b border-white/5">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {getRoleIcon()}
                              <span className="text-[10px] text-muted-text capitalize">{role}</span>
                            </div>
                          </div>
                          <div className="p-1">
                            <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-text hover:text-white hover:bg-white/5 transition-all">
                              <User className="w-3.5 h-3.5" /> Profile
                            </Link>
                            <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-text hover:text-white hover:bg-white/5 transition-all">
                              <Settings className="w-3.5 h-3.5" /> Settings
                            </Link>
                            <button onClick={() => { setShowUserMenu(false); onLogout(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-danger hover:bg-danger/10 transition-all cursor-pointer">
                              <LogOut className="w-3.5 h-3.5" /> Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <a href="https://github.com/prem-2323/Madurai_For_Nation.git" target="_blank" rel="noreferrer" className="p-2 rounded-xl text-muted-text hover:text-white hover:bg-white/5 transition-all">
                    <Github className="w-4 h-4" />
                  </a>
                </>
              ) : (
                <Link to="/auth" className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                  Sign In
                </Link>
              )}
            </div>

            <div className="flex md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-xl text-muted-text hover:text-white hover:bg-white/5 transition-colors">
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 z-40 w-72 max-w-xs bg-[#0F172A] border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between md:hidden">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-primary to-secondary rounded-lg"><Wind className="w-4 h-4 text-white" /></div>
                    <span className="font-bold text-white text-md">CleanAir AI</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-muted-text hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
                </div>

                {user && (
                  <div className="flex items-center gap-3 p-3 glass-panel rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {getRoleIcon()}
                        <span className="text-[10px] text-muted-text capitalize">{role}</span>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) =>
                      `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white bg-white/5 border border-white/5' : 'text-muted-text hover:text-white hover:bg-white/5'}`
                    }>
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <a href="/Proof.pdf" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all">
                  <FileText className="w-4 h-4" />
                  Proof
                </a>

                <div className="text-center text-[10px] text-muted-text font-medium">
                  {geminiUsageLabel}
                </div>

                {user ? (
                  <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full py-2.5 rounded-xl bg-danger/15 hover:bg-danger/20 border border-danger/35 text-white text-sm font-semibold cursor-pointer">
                    <LogOut className="w-3.5 h-3.5 inline mr-2" /> Sign Out
                  </button>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary-to-secondary text-white text-sm font-bold shadow-md text-center">
                    Sign In
                  </Link>
                )}

                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-muted-text hover:text-white text-xs border border-slate-800 transition-all text-center">
                  <Github className="w-3.5 h-3.5" /> GitHub
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
