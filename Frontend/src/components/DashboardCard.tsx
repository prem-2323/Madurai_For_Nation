import React from 'react';
import { motion } from 'motion/react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`glass-panel border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden ${className}`}
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-text mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Children content slot */}
      <div className="flex-1">
        {children}
      </div>
    </motion.div>
  );
};
