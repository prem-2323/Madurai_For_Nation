import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { getUserRole } from '../utils/role';
import { getEffectiveUser } from '../utils/auth';
import { AccessDenied } from '../pages/AccessDenied';

interface RoleProtectedRouteProps {
  user: any;
  role: 'citizen' | 'officer';
  children: ReactNode;
}

export function RoleProtectedRoute({ user, role, children }: RoleProtectedRouteProps) {
  const location = useLocation();
  const effectiveUser = getEffectiveUser(user);
  const currentRole = getUserRole(effectiveUser);

  if (!effectiveUser) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (currentRole !== role) {
    return <AccessDenied />;
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
