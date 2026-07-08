import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Wind, Github, Shield, UserCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNavItemsForRole, getUserRole } from '../utils/role';
import { fetchGeminiUsage } from '../api/usage';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [geminiRemaining, setGeminiRemaining] = useState<number | null>(null);
  const [geminiLimit, setGeminiLimit] = useState<number>(0);
  const [geminiUsed, setGeminiUsed] = useState<number>(0);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await fetchGeminiUsage();
        setGeminiRemaining(data.remaining);
        setGeminiLimit(data.limit);
        setGeminiUsed(data.used);
      } catch {
        console.warn('[NAVBAR] Could not fetch Gemini usage');
      }
    };
    loadUsage();
    const interval = setInterval(loadUsage, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = getNavItemsForRole(user);
  const role = getUserRole(user);
  console.log('[NAVBAR] Current user role:', role, '| nav items count:', navItems.length);

  const getRoleIcon = () => {
    const actualRole = role?.toLowerCase() || 'citizen';
    switch (actualRole) {
      case 'officer':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'citizen':
        return <UserCheck className="w-4 h-4 text-green-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-green-400" />;
    }
  };

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

            {/* Desktop Action */}
            <div className="hidden md:flex items-center gap-4">
              {geminiRemaining !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900/30 border border-amber-700/40 text-amber-300 text-[10px] font-semibold whitespace-nowrap" title={`Gemini API: ${geminiUsed} / ${geminiLimit} used today`}>
                  <Zap className="w-3 h-3" />
                  <span>{geminiRemaining} / {geminiLimit}</span>
                </div>
              )}

              <a
                href="https://github.com/prem-2323/Madurai_For_Nation.git"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-muted-text hover:text-white text-xs border border-white/5 transition-all"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>

              {user ? (
                <div className="flex items-center gap-3">
                  {role && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-800 text-muted-text capitalize border border-slate-700">
                      {getRoleIcon()}
                      {role.toLowerCase()}
                    </span>
                  )}
                  <Link 
                    to="/profile" 
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-secondary/30 bg-secondary/5 hover:bg-secondary/15 text-white transition-all capitalize"
                  >
                    Hi, {user.name.split(' ')[0]}
                  </Link>
                  <button
                    onClick={onLogout}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/30 text-white transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-xl bg-gradient-primary-to-secondary hover:opacity-95 text-white text-sm font-semibold accent-glow-secondary transition-all"
                >
                  Sign In
                </Link>
              )}
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
                {geminiRemaining !== null && (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-900/30 border border-amber-700/40 text-amber-300 text-[10px] font-semibold" title={`Gemini API: ${geminiUsed} / ${geminiLimit} used today`}>
                    <Zap className="w-3 h-3" />
                    <span>Gemini API: {geminiRemaining} credits left</span>
                  </div>
                )}

                {user ? (
                  <div className="flex flex-col gap-2">
                    {role && (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-text font-semibold capitalize">
                        {getRoleIcon()}
                        {role.toLowerCase()}
                      </div>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-semibold capitalize text-center"
                    >
                      Hi, {user.name}
                    </Link>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-danger/15 hover:bg-danger/20 border border-danger/35 text-white text-sm font-semibold cursor-pointer text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary-to-secondary text-white text-sm font-bold shadow-md text-center"
                  >
                    Sign In
                  </Link>
                )}

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-muted-text hover:text-white text-xs border border-slate-800 transition-all text-center"
                >
                  <Github className="w-3.5 h-3.5" />
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