import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  iconName: string;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  iconName,
  index,
}) => {
  // Dynamically resolve the icon from lucide-react
  const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass-panel p-6 rounded-2xl border border-white/5 transition-all duration-300 hover:border-secondary/30 shadow-lg group relative overflow-hidden"
    >
      {/* Decorative hover subtle light glow in corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-secondary/10 to-primary/5 rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Feature Icon container */}
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-secondary border border-white/5 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:border-transparent transition-all duration-300 mb-5">
        <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
      </div>

      <h3 className="text-lg font-bold text-white mb-2.5 tracking-tight group-hover:text-secondary transition-colors duration-200">
        {title}
      </h3>
      <p className="text-muted-text text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};
