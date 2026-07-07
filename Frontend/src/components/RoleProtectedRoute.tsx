import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserRole } from '../utils/role';
import { AccessDenied } from '../pages/AccessDenied';

interface RoleProtectedRouteProps {
  user: any;
  role: 'citizen' | 'officer';
  children: ReactNode;
}

export function RoleProtectedRoute({ user, role, children }: RoleProtectedRouteProps) {
  const location = useLocation();
  const currentRole = getUserRole(user);

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (currentRole !== role) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
