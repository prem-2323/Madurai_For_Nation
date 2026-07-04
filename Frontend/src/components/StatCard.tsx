import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  iconName: string;
  color?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  iconName,
  color = 'primary',
}) => {
  // Dynamically resolve the icon from lucide-react
  const IconComponent = (Icons as any)[iconName] || Icons.Activity;

  const colorStyles = {
    primary: {
      text: 'text-primary',
      bg: 'bg-primary/10',
      border: 'hover:border-primary/30',
      glow: 'shadow-primary/5',
    },
    secondary: {
      text: 'text-secondary',
      bg: 'bg-secondary/10',
      border: 'hover:border-secondary/30',
      glow: 'shadow-secondary/5',
    },
    danger: {
      text: 'text-danger',
      bg: 'bg-danger/10',
      border: 'hover:border-danger/30',
      glow: 'shadow-danger/5',
    },
    warning: {
      text: 'text-warning',
      bg: 'bg-warning/10',
      border: 'hover:border-warning/30',
      glow: 'shadow-warning/5',
    },
    info: {
      text: 'text-sky-400',
      bg: 'bg-sky-400/10',
      border: 'hover:border-sky-400/30',
      glow: 'shadow-sky-400/5',
    },
  };

  const selectedColor = colorStyles[color];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className={`glass-panel p-6 rounded-2xl border border-white/5 shadow-lg ${selectedColor.glow} ${selectedColor.border} transition-colors duration-300`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            {title}
          </span>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${selectedColor.bg} ${selectedColor.text}`}>
          <IconComponent className="w-6 h-6" />
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-white/5">
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isPositive
                ? 'bg-success/15 text-success'
                : 'bg-danger/15 text-danger'
            }`}
          >
            {isPositive ? '+' : ''}
            {change}
          </span>
          <span className="text-xs text-muted-text font-medium">vs previous month</span>
        </div>
      )}
    </motion.div>
  );
};
