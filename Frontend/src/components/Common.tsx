import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';

// ==========================================
// LOADING SPINNER
// ==========================================
interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Processing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full"
        />
        <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-secondary animate-pulse" />
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-text font-medium text-sm animate-pulse"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

// ==========================================
// EMPTY STATE
// ==========================================
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 glass-panel rounded-2xl border border-white/5">
      <div className="p-4 bg-slate-800/80 rounded-full text-secondary mb-4 accent-glow-secondary">
        {icon || <Info className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-text text-sm max-w-md mb-6">{description}</p>
      {actionButton}
    </div>
  );
};

// ==========================================
// ALERT BANNER
// ==========================================
interface AlertBannerProps {
  type: 'success' | 'warning' | 'danger' | 'info';
  message: string;
  description?: string;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  description,
  onClose,
}) => {
  const styles = {
    success: {
      bg: 'bg-success/10 border-success/30 text-success-foreground',
      icon: <CheckCircle className="w-5 h-5 text-success shrink-0" />,
    },
    warning: {
      bg: 'bg-warning/10 border-warning/30 text-warning-foreground',
      icon: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
    },
    danger: {
      bg: 'bg-danger/10 border-danger/30 text-danger-foreground',
      icon: <AlertTriangle className="w-5 h-5 text-danger shrink-0" />,
    },
    info: {
      bg: 'bg-secondary/10 border-secondary/30 text-secondary-foreground',
      icon: <Info className="w-5 h-5 text-secondary shrink-0" />,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 p-4 border rounded-xl ${styles[type].bg} text-white`}
    >
      {styles[type].icon}
      <div className="flex-1 text-sm">
        <p className="font-semibold">{message}</p>
        {description && <p className="text-muted-text text-xs mt-1">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-muted-text hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// ==========================================
// MODAL
// ==========================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  // Prevent clicks from propagating to overlay
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={handleContentClick}
            className="relative w-full max-w-2xl glass-panel rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 text-muted-text hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-white/5 bg-slate-900/60 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
