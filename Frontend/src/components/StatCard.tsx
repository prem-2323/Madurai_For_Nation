import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

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

  // Dummy sparkline data for visualization
  const sparklineHeights = isPositive 
    ? [20, 35, 25, 45, 60, 50, 80] 
    : [80, 65, 75, 45, 30, 40, 20];

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`glass-panel p-6 rounded-2xl border border-white/5 shadow-lg ${selectedColor.glow} ${selectedColor.border} transition-colors duration-300 relative overflow-hidden`}
    >
      {/* Spotlight Effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.08), transparent 40%)`,
        }}
      />
      
      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            {title}
          </span>
          {typeof value === 'number' ? (
            <div className="text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform origin-left relative z-10">
              <AnimatedCounter value={value} />
            </div>
          ) : (
            <div className="text-3xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform origin-left relative z-10">
              {value}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${selectedColor.bg} ${selectedColor.text}`}>
          <IconComponent className="w-6 h-6" />
        </div>
      </div>

      {change && (
        <div className="relative z-10 flex items-end justify-between mt-4 pt-4 border-t border-white/5">
          <div>
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
            <span className="text-xs text-muted-text font-medium mt-1 block">vs previous month</span>
          </div>
          
          {/* Sparkline Widget */}
          <div className="flex items-end gap-1 h-8">
            {sparklineHeights.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: '10%' }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 1.5, delay: i * 0.1, ease: 'easeOut' }}
                className={`w-1.5 rounded-t-sm ${isPositive ? 'bg-success/50' : 'bg-danger/50'}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
