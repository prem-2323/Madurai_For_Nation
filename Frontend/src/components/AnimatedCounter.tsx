import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (val: number) => string | number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 1.5,
  format = (val) => Math.floor(val).toString()
}) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const springValue = useSpring(0, {
    bounce: 0,
    duration: duration * 1000,
  });

  useEffect(() => {
    springValue.set(value);
    setHasAnimated(true);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    return format(hasAnimated ? current : 0);
  });

  return (
    <motion.span>
      {displayValue}
    </motion.span>
  );
};
