import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { getEffectiveUser } from '../utils/auth';

interface ProtectedRouteProps {
  user: any;
  children: ReactNode;
}

export function ProtectedRoute({ user, children }: ProtectedRouteProps) {
  const location = useLocation();
  const effectiveUser = getEffectiveUser(user);

  if (!effectiveUser) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
