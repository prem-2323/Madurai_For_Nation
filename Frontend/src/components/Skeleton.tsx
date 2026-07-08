import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  type?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', type = 'rectangular' }) => {
  const baseClass = "bg-slate-800/80 overflow-hidden relative";
  
  const typeClasses = {
    text: "h-4 w-3/4 rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-2xl"
  };

  return (
    <div className={`${baseClass} ${typeClasses[type]} ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ translateX: ['-100%', '200%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton type="text" className="w-1/3" />
      <Skeleton type="circular" className="w-10 h-10" />
    </div>
    <Skeleton type="text" className="w-1/2 h-8" />
  </div>
);

export const SkeletonChart = () => (
  <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
    <div className="flex items-center gap-2">
      <Skeleton type="circular" className="w-4 h-4" />
      <Skeleton type="text" className="w-1/3" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton type="text" className="w-1/4" />
            <Skeleton type="text" className="w-1/6" />
          </div>
          <Skeleton type="rectangular" className="h-2 w-full" />
        </div>
      ))}
    </div>
  </div>
);
